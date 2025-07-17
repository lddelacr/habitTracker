// src/styled-jsx.d.ts (enhanced version)
import 'react'

declare module 'react' {
  interface StyleHTMLAttributes<T> extends React.HTMLAttributes<T> {
    jsx?: boolean
    global?: boolean
  }
  
  interface CSSProperties {
    [key: `--${string}`]: string | number
  }
}