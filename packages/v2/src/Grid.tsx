import { useCallback, useMemo, useState } from 'react'
import {
  ResponsiveGridLayout,
  useContainerWidth,
  type Layout,
  type ResponsiveLayouts,
} from 'react-grid-layout'
import { absoluteStrategy } from 'react-grid-layout/core'
import { debounce } from 'lodash'
import ResizeHandle from './ResizeHandle'

import 'react-grid-layout/css/styles.css'

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }
const ROW_HEIGHT = 30

const COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#e67e22',
  '#9b59b6', '#1abc9c', '#f39c12', '#e91e63',
  '#00bcd4', '#8bc34a', '#ff5722', '#607d8b',
  '#673ab7', '#009688', '#ffc107', '#795548',
]

function widgetId(idx: number) {
  return `W${idx + 1}`
}

function generateWidgets(count: number) {
  return Array.from({ length: count }, (_, idx) => ({
    i: widgetId(idx),
    label: `Widget ${idx + 1}`,
    color: COLORS[idx % COLORS.length],
  }))
}

function generateLayouts(count: number): ResponsiveLayouts {
  const perRow = 4
  const colW = 3
  return {
    lg: Array.from({ length: count }, (_, idx) => ({
      i: widgetId(idx),
      x: (idx % perRow) * colW,
      y: Math.floor(idx / perRow) * 4,
      w: colW,
      h: 4,
    })),
  }
}

export default function Grid({ widgetCount }: { widgetCount: number }) {
  const { width, containerRef, mounted } = useContainerWidth()
  const widgets = useMemo(() => generateWidgets(widgetCount), [widgetCount])
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(() => generateLayouts(widgetCount))

  // Reset layouts when widget count changes
  const [prevCount, setPrevCount] = useState(widgetCount)
  if (widgetCount !== prevCount) {
    setPrevCount(widgetCount)
    setLayouts(generateLayouts(widgetCount))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onLayoutChange = useCallback(
    debounce((_layout: Layout, newLayouts: ResponsiveLayouts) => {
      setLayouts((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(newLayouts)) {
          return newLayouts
        }
        return prev
      })
    }, 10),
    [],
  )

  return (
    <div ref={containerRef}>
      {mounted && (
        <ResponsiveGridLayout
          className="layout"
          width={width}
          layouts={layouts}
          onLayoutChange={onLayoutChange}
          rowHeight={ROW_HEIGHT}
          dragConfig={{ handle: '.drag-handle', enabled: true }}
          resizeConfig={{ enabled: true, handleComponent: <ResizeHandle /> }}
          positionStrategy={absoluteStrategy}
          breakpoints={BREAKPOINTS}
          cols={COLS}
        >
          {widgets.map(({ i, label, color }) => (
            <div
              key={i}
              style={{
                border: '1px solid #999',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div
                className="drag-handle"
                style={{
                  padding: 5,
                  fontWeight: 'bold',
                  borderBottom: '1px solid #999',
                  cursor: 'move',
                  background: color,
                  color: '#fff',
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: 14,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  flex: 1,
                  background: `${color}22`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 32, fontWeight: 'bold', color }}>{i}</span>
              </div>
            </div>
          ))}
        </ResponsiveGridLayout>
      )}
    </div>
  )
}
