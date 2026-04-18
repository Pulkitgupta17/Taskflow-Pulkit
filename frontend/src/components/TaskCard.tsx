import { memo, useState, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/StatusBadge'
import { PriorityBadge } from '@/components/PriorityBadge'
import { CalendarDays, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { Task, TaskStatus } from '@/types'

interface TaskCardProps {
  task: Task
  onClick?: () => void
  onStatusChange?: (newStatus: TaskStatus) => void
}

const statusCycle: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
}

export const taskCardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
}

export const TaskCard = memo(function TaskCard({
  task,
  onClick,
  onStatusChange,
}: TaskCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onStatusChange) {
      onStatusChange(statusCycle[task.status])
    }
  }

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const mouseX = e.clientX - centerX
    const mouseY = e.clientY - centerY
    setRotateX((-mouseY / (rect.height / 2)) * 3)
    setRotateY((mouseX / (rect.width / 2)) * 3)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setRotateX(0)
    setRotateY(0)
    setIsHovered(false)
  }, [])

  return (
    <div style={{ perspective: '800px' }}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX,
          rotateY,
          y: isHovered ? -2 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.5 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <Card
          className={`cursor-pointer transition-all duration-200 ${
            isHovered ? 'shadow-lg border-primary/30' : 'hover:shadow-md hover:border-primary/30'
          }`}
          onClick={onClick}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-medium leading-tight flex-1 min-w-0">
                {task.title}
              </h4>
              <PriorityBadge priority={task.priority} />
            </div>

            {task.description && (
              <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <StatusBadge status={task.status} onClick={handleStatusClick} />

              {task.assignee && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {task.assignee.name}
                </span>
              )}

              {task.due_date && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  {formatDate(task.due_date)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
})
