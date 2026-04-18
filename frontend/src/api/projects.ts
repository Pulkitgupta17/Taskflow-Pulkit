import apiClient from './client'
import type {
  Project,
  ProjectsResponse,
  CreateProjectPayload,
  UpdateProjectPayload,
  ProjectStats,
} from '@/types'

export async function getProjects(page = 1, limit = 20): Promise<ProjectsResponse> {
  const { data } = await apiClient.get<ProjectsResponse>('/projects', {
    params: { page, limit },
  })
  return data
}

export async function getProject(id: string): Promise<Project> {
  const { data } = await apiClient.get<Project>(`/projects/${id}`)
  return data
}

export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  const { data } = await apiClient.post<Project>('/projects', payload)
  return data
}

export async function updateProject(
  id: string,
  payload: UpdateProjectPayload
): Promise<Project> {
  const { data } = await apiClient.patch<Project>(`/projects/${id}`, payload)
  return data
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`/projects/${id}`)
}

export async function getProjectStats(id: string): Promise<ProjectStats> {
  const { data } = await apiClient.get<ProjectStats>(`/projects/${id}/stats`)
  return data
}
