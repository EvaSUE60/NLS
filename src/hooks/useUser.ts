// src/hooks/useUser.ts
'use client';

import { useUserStore } from '@/src/store/user.store';
import { useCallback } from 'react';

export function useUser() {
  const {
    users,
    selectedUser,
    isLoading,
    error,
    pagination,
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
    refetch,
    clearError,
    initialize,
  } = useUserStore();

  return {
    users,
    selectedUser,
    isLoading,
    error,
    pagination,
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
    refetch,
    clearError,
    initialize,
  };
}