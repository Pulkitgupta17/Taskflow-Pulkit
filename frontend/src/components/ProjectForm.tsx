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
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Project } from '@/types'

interface ProjectFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string; description: string }) => void
  isLoading?: boolean
  project?: Project | null
}

const fieldVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.25, ease: 'easeOut' as const },
  }),
}

export function ProjectForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  project,
}: ProjectFormProps) {
  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [errors, setErrors] = useState<{ name?: string }>({})

  const isEdit = !!project

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const newErrors: { name?: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Project name is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    onSubmit({ name: name.trim(), description: description.trim() })
  }

  const handleClose = () => {
    setName(project?.name ?? '')
    setDescription(project?.description ?? '')
    setErrors({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent onClose={handleClose}>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Project' : 'Create Project'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-5">
          <motion.div
            custom={0}
            variants={fieldVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors({})
              }}
              placeholder="Enter project name"
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </motion.div>

          <motion.div
            custom={1}
            variants={fieldVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional project description"
              rows={3}
            />
          </motion.div>

          <motion.div
            custom={2}
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
                {isEdit ? 'Save Changes' : 'Create Project'}
              </Button>
            </DialogFooter>
          </motion.div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
