import { useState, useCallback } from 'react'
import { useProjects, useCreateProject } from '@/hooks/useProjects'
import { ProjectCard, projectCardVariants } from '@/components/ProjectCard'
import { ProjectForm } from '@/components/ProjectForm'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Plus, FolderOpen, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

export function ProjectsPage() {
  const [showForm, setShowForm] = useState(false)
  const { data, isLoading, isError, error, refetch } = useProjects()
  const createProject = useCreateProject()

  const handleCreate = useCallback(
    (formData: { name: string; description: string }) => {
      createProject.mutate(formData, {
        onSuccess: () => setShowForm(false),
      })
    },
    [createProject]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-muted-foreground">
          {(error as Error)?.message ?? 'Failed to load projects'}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  const projects = data?.data ?? []

  return (
    <div className="relative">
      {/* Subtle animated gradient accent */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-[0.07] blur-3xl rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400" />

      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your projects and tasks
            </p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </motion.div>
        </div>

        {projects.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="h-12 w-12" />}
            title="No projects yet"
            description="Create your first project to start organizing your tasks."
            action={
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            }
          />
        ) : (
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {projects.map((project) => (
              <motion.div key={project.id} variants={projectCardVariants}>
                <ProjectCard project={project} />
              </motion.div>
            ))}
          </motion.div>
        )}

        <ProjectForm
          open={showForm}
          onOpenChange={setShowForm}
          onSubmit={handleCreate}
          isLoading={createProject.isPending}
        />
      </div>
    </div>
  )
}
