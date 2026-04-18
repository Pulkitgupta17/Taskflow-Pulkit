import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/StatusBadge'
import { PriorityBadge } from '@/components/PriorityBadge'
import { CalendarDays, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'
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

export const TaskCard = memo(function TaskCard({
  task,
  onClick,
  onStatusChange,
}: TaskCardProps) {
  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onStatusChange) {
      onStatusChange(statusCycle[task.status])
    }
  }

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
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
  )
})
