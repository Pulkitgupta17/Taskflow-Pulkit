import { cn } from '@/lib/utils'
import type { TaskPriority } from '@/types'

const priorityConfig: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  low: {
    label: 'Low',
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  },
  medium: {
    label: 'Medium',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
  },
  high: {
    label: 'High',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  },
}

interface PriorityBadgeProps {
  priority: TaskPriority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
