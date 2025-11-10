import api from './api';
import { ENDPOINTS } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  password: string;
}

export interface UpdateUserData extends Partial<Omit<CreateUserData, 'password'>> {
  id: string;
}

export const userService = {
  // Get all users
  async getUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/users/');
    return response.data;
  },

  // Get user by ID
  async getUser(id: string): Promise<User> {
    const response = await api.get<User>(`/users/${id}/`);
    return response.data;
  },

  // Create new user
  async createUser(data: CreateUserData): Promise<User> {
    const response = await api.post<User>('/users/', data);
    return response.data;
  },

  // Update user
  async updateUser(data: UpdateUserData): Promise<User> {
    const response = await api.put<User>(`/users/${data.id}/`, data);
    return response.data;
  },

  // Delete user
  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}/`);
  },

  // Get users by role
  async getUsersByRole(role: string): Promise<User[]> {
    const response = await api.get<User[]>('/users/', {
      params: {
        role,
      },
    });
    return response.data;
  },

  // Get users by status
  async getUsersByStatus(status: 'active' | 'inactive'): Promise<User[]> {
    const response = await api.get<User[]>('/users/', {
      params: {
        status,
      },
    });
    return response.data;
  },
};

export const fetchUsers = () => api.get(ENDPOINTS.users);
export const fetchEmployees = () => api.get(ENDPOINTS.employees);
export const fetchDepartments = () => api.get(ENDPOINTS.departments);
export const createEmployee = (data: any) => api.post(ENDPOINTS.employees, data);
export const updateEmployee = (id: number, data: any) => api.put(`${ENDPOINTS.employees}${id}/`, data);
export const deleteEmployee = (id: number) => api.delete(`${ENDPOINTS.employees}${id}/`);
export const createDepartment = (data: any) => api.post(ENDPOINTS.departments, data);
export const updateDepartment = (id: number, data: any) => api.put(`${ENDPOINTS.departments}${id}/`, data);
export const deleteDepartment = (id: number) => api.delete(`${ENDPOINTS.departments}${id}/`);

export default userService; 