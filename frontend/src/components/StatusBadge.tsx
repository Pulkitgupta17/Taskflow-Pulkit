import { useState } from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { TaskStatus } from '@/types'

const statusConfig: Record<
  TaskStatus,
  { label: string; className: string }
> = {
  todo: {
    label: 'To Do',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  },
  done: {
    label: 'Done',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  },
}

interface StatusBadgeProps {
  status: TaskStatus
  onClick?: (e: React.MouseEvent) => void
  className?: string
}

export function StatusBadge({ status, onClick, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  const [isPulsing, setIsPulsing] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      setIsPulsing(true)
      setTimeout(() => setIsPulsing(false), 300)
      onClick(e)
    }
  }

  return (
    <motion.span
      onClick={handleClick}
      whileHover={{ scale: 1.08 }}
      animate={isPulsing ? { scale: [1, 1.15, 1] } : {}}
      transition={{ duration: 0.25 }}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-200',
        config.className,
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
    >
      {config.label}
    </motion.span>
  )
}
