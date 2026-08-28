'use client'

import { IconRefresh as RotateCcw } from '@tabler/icons-react'

import { Button } from './ui/button'

interface RetryButtonProps {
  reload: () => Promise<void | string | null | undefined>
  messageId: string
}

export const RetryButton: React.FC<RetryButtonProps> = ({
  reload,
  messageId
}) => {
  return (
    <Button
      className="rounded-full size-8"
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => reload()}
      aria-label={`Retry from message ${messageId}`}
    >
      <RotateCcw className="size-4 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:rotate-180 active:scale-90" />
      <span className="sr-only">Retry</span>
    </Button>
  )
}
