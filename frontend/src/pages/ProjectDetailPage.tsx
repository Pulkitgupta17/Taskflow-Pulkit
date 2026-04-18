import { useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks'
import { useUsers } from '@/hooks/useUsers'
import { TaskCard } from '@/components/TaskCard'
import { TaskForm } from '@/components/TaskForm'
import { ProjectForm } from '@/components/ProjectForm'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus,
  ArrowLeft,
  Pencil,
  Trash2,
  ListTodo,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import type { Task, TaskStatus, TaskPriority } from '@/types'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [statusFilter, setStatusFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showEditProject, setShowEditProject] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const filters = useMemo(() => {
    const f: { status?: string; assignee?: string } = {}
    if (statusFilter) f.status = statusFilter
    if (assigneeFilter) f.assignee = assigneeFilter
    return f
  }, [statusFilter, assigneeFilter])

  const {
    data: project,
    isLoading: projectLoading,
    isError: projectError,
    error: projectErr,
    refetch: refetchProject,
  } = useProject(id!)

  const {
    data: tasks,
    isLoading: tasksLoading,
    isError: tasksError,
    refetch: refetchTasks,
  } = useTasks(id!, filters)

  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()
  const createTask = useCreateTask(id!)
  const updateTask = useUpdateTask(id!)
  const deleteTaskMutation = useDeleteTask(id!)

  const isOwner = project?.owner_id === user?.id

  const { data: allUsers } = useUsers()
  const members = allUsers ?? []

  const uniqueAssignees = useMemo(() => {
    if (!tasks) return []
    const seen = new Map<string, string>()
    tasks.forEach((t) => {
      if (t.assignee) {
        seen.set(t.assignee.id, t.assignee.name)
      }
    })
    return Array.from(seen.entries()).map(([aId, name]) => ({ id: aId, name }))
  }, [tasks])

  const handleCreateTask = useCallback(
    (formData: {
      title: string
      description: string
      status: TaskStatus
      priority: TaskPriority
      assignee_id: string
      due_date: string
    }) => {
      const payload: {
        title: string
        description?: string
        status: TaskStatus
        priority: TaskPriority
        assignee_id?: string
        due_date?: string
      } = {
        title: formData.title,
        status: formData.status,
        priority: formData.priority,
      }
      if (formData.description) payload.description = formData.description
      if (formData.assignee_id) payload.assignee_id = formData.assignee_id
      if (formData.due_date) payload.due_date = formData.due_date

      createTask.mutate(payload, {
        onSuccess: () => setShowTaskForm(false),
      })
    },
    [createTask]
  )

  const handleUpdateTask = useCallback(
    (formData: {
      title: string
      description: string
      status: TaskStatus
      priority: TaskPriority
      assignee_id: string
      due_date: string
    }) => {
      if (!editingTask) return
      const payload: {
        title: string
        description?: string
        status: TaskStatus
        priority: TaskPriority
        assignee_id?: string
        due_date?: string
      } = {
        title: formData.title,
        status: formData.status,
        priority: formData.priority,
      }
      if (formData.description) payload.description = formData.description
      if (formData.assignee_id) payload.assignee_id = formData.assignee_id
      if (formData.due_date) payload.due_date = formData.due_date

      updateTask.mutate(
        { id: editingTask.id, payload },
        { onSuccess: () => setEditingTask(null) }
      )
    },
    [editingTask, updateTask]
  )

  const handleStatusChange = useCallback(
    (taskId: string, newStatus: TaskStatus) => {
      updateTask.mutate({ id: taskId, payload: { status: newStatus } })
    },
    [updateTask]
  )

  const handleDeleteTask = useCallback(
    (taskId: string) => {
      deleteTaskMutation.mutate(taskId, {
        onSuccess: () => setEditingTask(null),
      })
    },
    [deleteTaskMutation]
  )

  const handleUpdateProject = useCallback(
    (formData: { name: string; description: string }) => {
      updateProject.mutate(
        { id: id!, payload: formData },
        { onSuccess: () => setShowEditProject(false) }
      )
    },
    [id, updateProject]
  )

  const handleDeleteProject = useCallback(() => {
    deleteProject.mutate(id!, {
      onSuccess: () => navigate('/projects'),
    })
  }, [id, deleteProject, navigate])

  // Group tasks by status for kanban view
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    }
    if (tasks) {
      tasks.forEach((task) => {
        if (grouped[task.status]) {
          grouped[task.status].push(task)
        }
      })
    }
    return grouped
  }, [tasks])

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (projectError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-muted-foreground">
          {(projectErr as Error)?.message ?? 'Failed to load project'}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/projects')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="outline" onClick={() => refetchProject()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!project) return null

  const statusLabels: Record<TaskStatus, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/projects')}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Projects
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {project.description}
              </p>
            )}
          </div>

          {isOwner && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditProject(true)}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-[140px]"
          >
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </Select>

          <Select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="w-[160px]"
          >
            <option value="">All Assignees</option>
            {uniqueAssignees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </div>

        <Button onClick={() => setShowTaskForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Tasks */}
      {tasksLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : tasksError ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">Failed to load tasks</p>
          <Button variant="outline" size="sm" onClick={() => refetchTasks()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : !tasks || tasks.length === 0 ? (
        <EmptyState
          icon={<ListTodo className="h-12 w-12" />}
          title="No tasks yet"
          description="Create your first task to get started."
          action={
            <Button onClick={() => setShowTaskForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          }
        />
      ) : (
        /* Kanban columns */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.keys(tasksByStatus) as TaskStatus[]).map((status) => (
            <div key={status}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {statusLabels[status]}
                </h3>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {tasksByStatus[status].length}
                </span>
              </div>
              <div className="space-y-3">
                {tasksByStatus[status].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => setEditingTask(task)}
                    onStatusChange={(newStatus) =>
                      handleStatusChange(task.id, newStatus)
                    }
                  />
                ))}
                {tasksByStatus[status].length === 0 && (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <p className="text-xs text-muted-foreground">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <TaskForm
        open={showTaskForm}
        onOpenChange={setShowTaskForm}
        onSubmit={handleCreateTask}
        isLoading={createTask.isPending}
        members={members}
      />

      {/* Edit Task Modal */}
      {editingTask && (
        <TaskForm
          open={!!editingTask}
          onOpenChange={(open) => {
            if (!open) setEditingTask(null)
          }}
          onSubmit={handleUpdateTask}
          isLoading={updateTask.isPending}
          task={editingTask}
          members={members}
        />
      )}

      {/* Edit Task Modal - Delete Button (rendered separately) */}
      {editingTask && (
        <div className="fixed bottom-6 right-6 z-[60]">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeleteTask(editingTask.id)}
            disabled={deleteTaskMutation.isPending}
          >
            {deleteTaskMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete Task
          </Button>
        </div>
      )}

      {/* Edit Project Modal */}
      <ProjectForm
        open={showEditProject}
        onOpenChange={setShowEditProject}
        onSubmit={handleUpdateProject}
        isLoading={updateProject.isPending}
        project={project}
      />

      {/* Delete Project Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent onClose={() => setShowDeleteConfirm(false)}>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{project.name}&quot;? This
              action cannot be undone and will remove all associated tasks.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleteProject.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={deleteProject.isPending}
            >
              {deleteProject.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
