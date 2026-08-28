'use client'

import { NelthLogo } from './nelth-logo'

export function AnimatedLogo({
  animate = true,
  className,
  ...props
}: React.ComponentProps<'svg'> & {
  animate?: boolean
}) {
  return (
    <NelthLogo
      variant="active"
      animate={animate}
      className={className}
      {...props}
    />
  )
}
