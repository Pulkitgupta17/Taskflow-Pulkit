import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { FolderOpen, CalendarDays, ListTodo } from 'lucide-react'
import { formatRelativeDate } from '@/lib/utils'
import type { Project } from '@/types'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate()

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <FolderOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{project.name}</CardTitle>
            {project.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {project.description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <ListTodo className="h-3.5 w-3.5" />
            <span>{project.task_count ?? 0} tasks</span>
          </div>
          <div className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{formatRelativeDate(project.created_at)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
