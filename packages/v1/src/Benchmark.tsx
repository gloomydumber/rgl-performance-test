import { useState, useCallback, type CSSProperties } from 'react'

interface BenchmarkResult {
  run: number
  totalFrames: number
  avgFrameTime: number
  p95FrameTime: number
  maxFrameTime: number
  minFrameTime: number
  jankFrames: number
  jankPercent: number
}

const TOTAL_FRAMES = 120 // ~2s at 60fps
const MOVE_PX = 300 // pixels diagonal
const WARMUP_FRAMES = 5

/** Dispatch both PointerEvent and MouseEvent for compatibility */
function fire(
  target: EventTarget,
  type: 'mousedown' | 'mousemove' | 'mouseup',
  clientX: number,
  clientY: number,
) {
  const pointerType = type.replace('mouse', 'pointer') as string
  const isUp = type === 'mouseup'
  const shared = {
    clientX,
    clientY,
    screenX: clientX,
    screenY: clientY,
    button: 0,
    buttons: isUp ? 0 : 1,
    bubbles: true,
    cancelable: true,
    composed: true,
  }
  target.dispatchEvent(
    new PointerEvent(pointerType, { ...shared, pointerId: 1, pointerType: 'mouse' }),
  )
  target.dispatchEvent(new MouseEvent(type, shared))
}

export default function Benchmark() {
  const [results, setResults] = useState<BenchmarkResult[]>([])
  const [running, setRunning] = useState(false)

  const run = useCallback(() => {
    const handle = document.querySelector('.react-resizable-handle') as HTMLElement | null
    if (!handle) {
      alert('No resize handle found — is the grid rendered?')
      return
    }

    setRunning(true)

    const rect = handle.getBoundingClientRect()
    const startX = Math.round(rect.left + rect.width / 2)
    const startY = Math.round(rect.top + rect.height / 2)

    const frameTimes: number[] = []
    let frameCount = 0
    let lastTime = 0

    fire(handle, 'mousedown', startX, startY)

    const step = (timestamp: number) => {
      if (lastTime > 0) {
        frameTimes.push(timestamp - lastTime)
      }
      lastTime = timestamp
      frameCount++

      const progress = frameCount / TOTAL_FRAMES
      fire(
        document,
        'mousemove',
        startX + MOVE_PX * progress,
        startY + MOVE_PX * progress,
      )

      if (frameCount < TOTAL_FRAMES) {
        requestAnimationFrame(step)
      } else {
        fire(
          document,
          'mouseup',
          startX + MOVE_PX,
          startY + MOVE_PX,
        )

        const times = frameTimes.slice(WARMUP_FRAMES)
        const sorted = [...times].sort((a, b) => a - b)
        const avg = times.reduce((a, b) => a + b, 0) / times.length
        const jank = times.filter((t) => t > 16.67)
        const p95Idx = Math.floor(sorted.length * 0.95)

        setResults((prev) => [
          ...prev,
          {
            run: prev.length + 1,
            totalFrames: times.length,
            avgFrameTime: round2(avg),
            p95FrameTime: round2(sorted[p95Idx]),
            maxFrameTime: round2(sorted[sorted.length - 1]),
            minFrameTime: round2(sorted[0]),
            jankFrames: jank.length,
            jankPercent: round1((jank.length / times.length) * 100),
          },
        ])
        setRunning(false)
      }
    }

    requestAnimationFrame(step)
  }, [])

  const avg = (key: keyof BenchmarkResult) => {
    if (results.length === 0) return '—'
    const sum = results.reduce((a, r) => a + (r[key] as number), 0)
    return round2(sum / results.length)
  }

  const [copied, setCopied] = useState(false)

  const copyResults = useCallback(() => {
    if (results.length === 0) return
    const pad = (s: string | number, w: number) => String(s).padStart(w)
    const header = `Run  Avg(ms)  P95(ms)  Max(ms)  Min(ms)  Jank       Jank%`
    const sep = `---  -------  -------  -------  -------  ---------  -----`
    const rows = results.map((r) =>
      `${pad(r.run, 3)}  ${pad(r.avgFrameTime, 7)}  ${pad(r.p95FrameTime, 7)}  ${pad(r.maxFrameTime, 7)}  ${pad(r.minFrameTime, 7)}  ${pad(r.jankFrames, 3)}/${pad(r.totalFrames, 3)}    ${pad(r.jankPercent, 4)}%`,
    )
    const lines = [header, sep, ...rows]
    if (results.length >= 2) {
      lines.push(sep)
      lines.push(
        `AVG  ${pad(avg('avgFrameTime'), 7)}  ${pad(avg('p95FrameTime'), 7)}  ${pad(avg('maxFrameTime'), 7)}  ${pad(avg('minFrameTime'), 7)}  ${pad(avg('jankFrames'), 3)}        ${pad(avg('jankPercent'), 4)}%`,
      )
    }
    const widgetCount = document.querySelectorAll('.react-resizable-handle').length
    const text = `Widgets: ${widgetCount} | ${TOTAL_FRAMES} frames | ${MOVE_PX}px diagonal\n\n${lines.join('\n')}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [results])

  return (
    <div style={{ padding: '8px 16px', fontFamily: 'monospace', fontSize: 13 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <button onClick={run} disabled={running}>
          {running ? 'Running…' : 'Run Benchmark'}
        </button>
        {results.length > 0 && (
          <>
            <button onClick={copyResults}>{copied ? 'Copied!' : 'Copy'}</button>
            <button onClick={() => setResults([])}>Clear</button>
          </>
        )}
        <span style={{ color: '#999', fontSize: 11 }}>
          {TOTAL_FRAMES} frames · {MOVE_PX}px diagonal · {WARMUP_FRAMES} warmup skipped
        </span>
      </div>

      {results.length > 0 && (
        <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={th}>Run</th>
              <th style={th}>Avg (ms)</th>
              <th style={th}>P95 (ms)</th>
              <th style={th}>Max (ms)</th>
              <th style={th}>Min (ms)</th>
              <th style={th}>Jank</th>
              <th style={th}>Jank %</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.run}>
                <td style={td}>{r.run}</td>
                <td style={td}>{r.avgFrameTime}</td>
                <td style={tdWarn(r.p95FrameTime)}>{r.p95FrameTime}</td>
                <td style={tdWarn(r.maxFrameTime)}>{r.maxFrameTime}</td>
                <td style={td}>{r.minFrameTime}</td>
                <td style={td}>
                  {r.jankFrames}/{r.totalFrames}
                </td>
                <td style={tdWarn(r.jankPercent > 10 ? 20 : 0)}>{r.jankPercent}%</td>
              </tr>
            ))}
            {results.length >= 2 && (
              <tr style={{ borderTop: '2px solid #333', fontWeight: 'bold' }}>
                <td style={td}>AVG</td>
                <td style={td}>{avg('avgFrameTime')}</td>
                <td style={td}>{avg('p95FrameTime')}</td>
                <td style={td}>{avg('maxFrameTime')}</td>
                <td style={td}>{avg('minFrameTime')}</td>
                <td style={td}>{avg('jankFrames')}</td>
                <td style={td}>{avg('jankPercent')}%</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}
function round1(n: number) {
  return Math.round(n * 10) / 10
}

const th: CSSProperties = {
  textAlign: 'left',
  padding: '4px 12px 4px 0',
  borderBottom: '1px solid #444',
  color: '#888',
}
const td: CSSProperties = {
  padding: '3px 12px 3px 0',
}
function tdWarn(val: number): CSSProperties {
  return {
    ...td,
    color: val > 16.67 ? '#e74c3c' : undefined,
    fontWeight: val > 16.67 ? 'bold' : undefined,
  }
}
