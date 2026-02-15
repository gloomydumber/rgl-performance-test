import { useState } from 'react'
import Grid from './Grid'
import Benchmark from './Benchmark'

const COUNTS = [4, 8, 12, 16, 24, 32]

export default function App() {
  const [widgetCount, setWidgetCount] = useState(4)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 16px 0' }}>
        <h1 style={{ margin: 0, fontSize: 18, fontFamily: 'system-ui, sans-serif' }}>
          RGL v1.4.4
        </h1>
        <label style={{ fontFamily: 'monospace', fontSize: 13 }}>
          Widgets:{' '}
          <select
            value={widgetCount}
            onChange={(e) => setWidgetCount(Number(e.target.value))}
            style={{ fontSize: 13 }}
          >
            {COUNTS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>
      <Benchmark />
      <Grid widgetCount={widgetCount} />
    </div>
  )
}
