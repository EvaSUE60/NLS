// src/service/user.service.ts
import apiClient from '@/src/lib/api/client';

export const userService = {
  getUsers: (filters?: any) => {
    // Remove '/api' from the path since apiClient already has it as base
    return apiClient.get('/users', { params: filters });
  },

  getUser: (id: string) => {
    return apiClient.get(`/users/${id}`);
  },

  createUser: (data: any) => {
    return apiClient.post('/users', data);
  },

  updateUser: (id: string, data: any) => {
    return apiClient.put(`/users/${id}`, data);
  },

  deleteUser: (id: string) => {
    return apiClient.delete(`/users/${id}`);
  },
};