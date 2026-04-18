import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getTasks, createTask, updateTask, deleteTask } from '@/api/tasks'
import type {
  CreateTaskPayload,
  Task,
  UpdateTaskPayload,
} from '@/types'

export function useTasks(
  projectId: string,
  filters?: { status?: string; assignee?: string }
) {
  return useQuery({
    queryKey: ['tasks', projectId, filters],
    queryFn: () => getTasks(projectId, filters),
    enabled: !!projectId,
  })
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => createTask(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    },
  })
}

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) =>
      updateTask(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] })

      const previousTasks = queryClient.getQueriesData<Task[]>({
        queryKey: ['tasks', projectId],
      })

      queryClient.setQueriesData<Task[]>(
        { queryKey: ['tasks', projectId] },
        (old) => {
          if (!old) return old
          return old.map((task) =>
            task.id === id ? { ...task, ...payload } : task
          )
        }
      )

      return { previousTasks }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    },
  })
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    },
  })
}
