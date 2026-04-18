import apiClient from './client'
import type { User } from '@/types'

export async function getUsers(): Promise<User[]> {
  const { data } = await apiClient.get<{ users: User[] }>('/users')
  return data.users ?? []
}
