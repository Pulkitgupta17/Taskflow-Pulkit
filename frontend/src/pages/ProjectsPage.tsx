import { useState, useCallback } from 'react'
import { useProjects, useCreateProject } from '@/hooks/useProjects'
import { ProjectCard } from '@/components/ProjectCard'
import { ProjectForm } from '@/components/ProjectForm'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Plus, FolderOpen, Loader2, AlertCircle, RefreshCw } from 'lucide-react'

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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your projects and tasks
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <ProjectForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleCreate}
        isLoading={createProject.isPending}
      />
    </div>
  )
}
