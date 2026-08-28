import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** Raised surface token (mirrors @assistant-ui/elements `paper`). */
export const paper = 'border border-border bg-background'

/** Monospace text token. */
export const mono = 'font-mono'

/** Ghost button token (icon buttons, etc.). */
export const ghostButton =
  'inline-flex items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'

/** Shimmering label used while a generation is in progress. */
export function ShimmerLabel({
  className,
  children
}: {
  className?: string
  children?: ReactNode
}) {
  return (
    <span
      className={cn(
        'bg-gradient-to-r from-foreground/40 via-foreground to-foreground/40 bg-[length:200%_100%] bg-clip-text text-transparent animate-[shimmer_1.5s_linear_infinite]',
        className
      )}
    >
      {children}
    </span>
  )
}
