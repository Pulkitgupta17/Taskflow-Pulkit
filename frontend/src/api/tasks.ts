import apiClient from './client'
import type {
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
} from '@/types'

export async function getTasks(
  projectId: string,
  filters?: { status?: string; assignee?: string }
): Promise<Task[]> {
  const { data } = await apiClient.get<{ data: Task[]; page: number; limit: number; total_count: number; total_pages: number }>(
    `/projects/${projectId}/tasks`,
    { params: filters }
  )
  return data.data ?? []
}

export async function createTask(
  projectId: string,
  payload: CreateTaskPayload
): Promise<Task> {
  const { data } = await apiClient.post<Task>(
    `/projects/${projectId}/tasks`,
    payload
  )
  return data
}

export async function updateTask(
  taskId: string,
  payload: UpdateTaskPayload
): Promise<Task> {
  const { data } = await apiClient.patch<Task>(`/tasks/${taskId}`, payload)
  return data
}

export async function deleteTask(taskId: string): Promise<void> {
  await apiClient.delete(`/tasks/${taskId}`)
}
