import type { CSSProperties } from 'react'

interface IconProps {
  name: string
  size?: number
  color?: string
  label?: string
  className?: string
  style?: CSSProperties
  filled?: boolean
  'aria-hidden'?: boolean
  'aria-label'?: string
}

export function Icon({
  name,
  size = 24,
  label,
  className = '',
  style,
  filled = false,
  'aria-hidden': ariaHiddenProp,
  'aria-label': ariaLabelProp,
}: IconProps) {
  const resolvedLabel = label ?? ariaLabelProp
  const isHidden = ariaHiddenProp !== undefined ? ariaHiddenProp : !resolvedLabel

  return (
    <span
      className={`material-symbols-outlined${className ? ` ${className}` : ''}`}
      aria-label={resolvedLabel}
      aria-hidden={isHidden || undefined}
      role={resolvedLabel ? 'img' : undefined}
      style={{
        fontSize: size,
        lineHeight: 1,
        userSelect: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0",
        ...style,
      }}
    >
      {name}
    </span>
  )
}
