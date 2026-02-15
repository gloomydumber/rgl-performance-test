import React from 'react'

const ResizeHandle = React.forwardRef<
  HTMLSpanElement,
  { handleAxis?: string }
>((props, ref) => {
  const { handleAxis, ...restProps } = props
  return (
    <span
      {...restProps}
      className={`react-resizable-handle handle-${handleAxis}`}
      ref={ref}
      style={{
        position: 'absolute',
        width: 20,
        height: 20,
        bottom: 0,
        right: 0,
        cursor: 'se-resize',
        backgroundRepeat: 'no-repeat',
        backgroundOrigin: 'content-box',
        boxSizing: 'border-box',
        backgroundPosition: 'bottom right',
        padding: '0 3px 3px 0',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Cpath d='M14 16h2v-2h-2v2zm-4 0h2v-2h-2v2zm4-4h2v-2h-2v2z' fill='%23999'/%3E%3C/svg%3E")`,
      }}
    />
  )
})

ResizeHandle.displayName = 'ResizeHandle'
export default ResizeHandle
