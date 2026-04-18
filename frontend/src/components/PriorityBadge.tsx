import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { TaskPriority } from '@/types'

const priorityConfig: Record<
  TaskPriority,
  { label: string; className: string; glowColor: string }
> = {
  low: {
    label: 'Low',
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    glowColor: 'rgba(100, 116, 139, 0.2)',
  },
  medium: {
    label: 'Medium',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
    glowColor: 'rgba(234, 179, 8, 0.25)',
  },
  high: {
    label: 'High',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    glowColor: 'rgba(239, 68, 68, 0.25)',
  },
}

interface PriorityBadgeProps {
  priority: TaskPriority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority]
  return (
    <motion.span
      whileHover={{ scale: 1.08 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-shadow duration-300',
        config.className,
        className
      )}
      style={{ boxShadow: `0 0 8px ${config.glowColor}` }}
    >
      {config.label}
    </motion.span>
  )
}
