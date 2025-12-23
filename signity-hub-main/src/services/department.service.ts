import { api } from '@/lib/api';

export interface Department {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userCount?: number;
}

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
}

export interface DepartmentResponse {
  success: boolean;
  message: string;
  department?: Department;
  departments?: Department[];
}

export interface DepartmentUsersResponse {
  success: boolean;
  message: string;
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

/**
 * Get all departments in the company
 */
export const getAllDepartments = async (): Promise<DepartmentResponse> => {
  const response = await api.get('/departments');
  return response.data;
};

/**
 * Create a new department
 */
export const createDepartment = async (data: CreateDepartmentRequest): Promise<DepartmentResponse> => {
  const response = await api.post('/departments', data);
  return response.data;
};

/**
 * Update a department
 */
export const updateDepartment = async (
  departmentId: string, 
  data: UpdateDepartmentRequest
): Promise<DepartmentResponse> => {
  const response = await api.put(`/departments/${departmentId}`, data);
  return response.data;
};

/**
 * Delete a department
 */
export const deleteDepartment = async (departmentId: string): Promise<DepartmentResponse> => {
  const response = await api.delete(`/departments/${departmentId}`);
  return response.data;
};

/**
 * Get users in a department
 */
export const getDepartmentUsers = async (departmentId: string): Promise<DepartmentUsersResponse> => {
  const response = await api.get(`/departments/${departmentId}/users`);
  return response.data;
};