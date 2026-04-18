export interface User {
  id: string
  name: string
  email: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Project {
  id: string
  name: string
  description: string
  owner_id: string
  owner?: User
  members?: User[]
  task_count?: number
  tasks?: Task[]
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignee_id?: string
  assignee?: User
  project_id: string
  due_date?: string
  created_at: string
  updated_at: string
}

export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Pagination {
  page: number
  limit: number
  total: number
}

export interface ProjectsResponse {
  data: Project[]
  page: number
  limit: number
  total_count: number
  total_pages: number
}

export interface ProjectDetailResponse {
  project: Project
}

export interface TasksResponse {
  tasks: Task[]
}

export interface ProjectStats {
  by_status: Record<string, number>
  by_assignee: Array<{ user: User; count: number }>
}

export interface CreateProjectPayload {
  name: string
  description?: string
}

export interface UpdateProjectPayload {
  name?: string
  description?: string
}

export interface CreateTaskPayload {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assignee_id?: string
  due_date?: string
}

export interface UpdateTaskPayload {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assignee_id?: string
  due_date?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}
