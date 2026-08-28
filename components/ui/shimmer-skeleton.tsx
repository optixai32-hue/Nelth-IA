'use client'

import { cn } from '@/lib/utils'

/**
 * Skeleton placeholder with a moving shimmer highlight, used while the
 * web search / fetch tools are running (chain-of-thought style loading).
 */
export function ShimmerSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-muted/60',
        'bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.18)_50%,transparent_70%)]',
        'bg-[length:200%_100%] animate-[shimmer_1.6s_infinite]',
        className
      )}
      {...props}
    />
  )
}
