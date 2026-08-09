// src/store/user.store.ts
'use client';

import { create } from 'zustand';
import { userService } from '@/src/service/user.service';

export interface User {
  _id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'super_admin' | 'admin' | 'staff';
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  full_name?: string;
}

interface UserState {
  users: User[];
  selectedUser: User | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  filters: any;
  isInitialized: boolean;
  isFetching: boolean;

  fetchUsers: (filters?: any) => Promise<void>;
  fetchUser: (id: string) => Promise<void>;
  createUser: (data: any) => Promise<User>;
  updateUser: (id: string, data: any) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  selectedUser: null,
  isLoading: false,
  error: null,
  pagination: null,
  filters: {},
  isInitialized: false,
  isFetching: false,

  initialize: async () => {
    if (get().isInitialized || get().isFetching) return;
    await get().fetchUsers({ page: 1, limit: 20 });
    set({ isInitialized: true });
  },

  fetchUsers: async (filters = {}) => {
    if (get().isFetching) return;
    
    set({ isLoading: true, isFetching: true, error: null });
    try {
      const response = await userService.getUsers(filters);
      set({
        users: response.data.data.users,
        pagination: response.data.data.pagination,
        filters: { ...get().filters, ...filters },
        isLoading: false,
        isFetching: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch users',
        isLoading: false,
        isFetching: false,
      });
    }
  },

  fetchUser: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await userService.getUser(id);
      set({
        selectedUser: response.data.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch user',
        isLoading: false,
      });
    }
  },

  createUser: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await userService.createUser(data);
      const newUser = response.data.data;
      set((state) => ({
        users: [newUser, ...state.users],
        isLoading: false,
      }));
      return newUser;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create user',
        isLoading: false,
      });
      throw error;
    }
  },

  updateUser: async (id: string, data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await userService.updateUser(id, data);
      const updatedUser = response.data.data;
      set((state) => ({
        users: state.users.map((u) => (u._id === id ? updatedUser : u)),
        selectedUser: updatedUser,
        isLoading: false,
      }));
      return updatedUser;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update user',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteUser: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await userService.deleteUser(id);
      set((state) => ({
        users: state.users.filter((u) => u._id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete user',
        isLoading: false,
      });
      throw error;
    }
  },

  refetch: async () => {
    const { filters } = get();
    await get().fetchUsers(filters);
  },

  clearError: () => {
    set({ error: null });
  },
}));