import { useState, type FormEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Task, TaskStatus, TaskPriority, User } from '@/types'

interface TaskFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    title: string
    description: string
    status: TaskStatus
    priority: TaskPriority
    assignee_id: string
    due_date: string
  }) => void
  isLoading?: boolean
  task?: Task | null
  members?: User[]
}

const fieldVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.25, ease: 'easeOut' as const },
  }),
}

export function TaskForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  task,
  members = [],
}: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'todo')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium')
  const [assigneeId, setAssigneeId] = useState(task?.assignee_id ?? '')
  const [dueDate, setDueDate] = useState(
    task?.due_date ? task.due_date.split('T')[0] : ''
  )
  const [errors, setErrors] = useState<{ title?: string }>({})

  const isEdit = !!task

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const newErrors: { title?: string } = {}

    if (!title.trim()) {
      newErrors.title = 'Task title is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assignee_id: assigneeId,
      due_date: dueDate,
    })
  }

  const handleClose = () => {
    setTitle(task?.title ?? '')
    setDescription(task?.description ?? '')
    setStatus(task?.status ?? 'todo')
    setPriority(task?.priority ?? 'medium')
    setAssigneeId(task?.assignee_id ?? '')
    setDueDate(task?.due_date ? task.due_date.split('T')[0] : '')
    setErrors({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <DialogContent onClose={handleClose} className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEdit ? 'Edit Task' : 'Create Task'}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <motion.div
                  custom={0}
                  variants={fieldVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2"
                >
                  <Label htmlFor="task-title">Title</Label>
                  <Input
                    id="task-title"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      if (errors.title) setErrors({})
                    }}
                    placeholder="Enter task title"
                    autoFocus
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title}</p>
                  )}
                </motion.div>

                <motion.div
                  custom={1}
                  variants={fieldVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2"
                >
                  <Label htmlFor="task-description">Description</Label>
                  <Textarea
                    id="task-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional task description"
                    rows={3}
                  />
                </motion.div>

                <motion.div
                  custom={2}
                  variants={fieldVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="task-status">Status</Label>
                    <Select
                      id="task-status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="task-priority">Priority</Label>
                    <Select
                      id="task-priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </Select>
                  </div>
                </motion.div>

                <motion.div
                  custom={3}
                  variants={fieldVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="task-assignee">Assignee</Label>
                    <Select
                      id="task-assignee"
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="task-due-date">Due Date</Label>
                    <Input
                      id="task-due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </motion.div>

                <motion.div
                  custom={4}
                  variants={fieldVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} className="transition-all duration-200">
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isEdit ? 'Save Changes' : 'Create Task'}
                    </Button>
                  </DialogFooter>
                </motion.div>
              </form>
            </DialogContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
