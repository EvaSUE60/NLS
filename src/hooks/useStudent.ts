// src/hooks/useStudent.ts
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { studentService, StudentInfoResponse } from '@/src/service/student.service';
import { useStudentStore } from '@/src/store/student.store';

// Get full student info - public (no auth)
export const useStudentInfo = (nlsId: string) => {
  const { setStudentData, setLoading, setError } = useStudentStore();

  return useQuery<StudentInfoResponse, Error>({
    queryKey: ['student', 'info', nlsId],
    queryFn: async () => {
      setLoading(true);
      try {
        const response = await studentService.getStudentInfo(nlsId);
        const data = response.data.data;
        setStudentData(data);
        setLoading(false);
        return data;
      } catch (error: any) {
        const message = error.response?.data?.message || 'Failed to fetch student info';
        setError(message);
        setLoading(false);
        throw error;
      }
    },
    enabled: !!nlsId && nlsId.startsWith('NLS-'),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

// Hook with store integration - public
export const useStudent = (nlsId: string) => {
  const query = useStudentInfo(nlsId);
  const store = useStudentStore();

  return {
    ...query,
    data: store.studentData,
    nlsId: store.currentStudentNlsId,
    searchHistory: store.searchHistory,
    setNlsId: store.setNlsId,
    clearStudent: store.clearStudent,
    clearHistory: store.clearHistory,
  };
};

// Hook for student search - public
export const useStudentSearch = () => {
  const queryClient = useQueryClient();
  const { setNlsId, currentStudentNlsId } = useStudentStore();

  const search = async (nlsId: string) => {
    if (!nlsId || !nlsId.startsWith('NLS-')) {
      throw new Error('Invalid NLS ID format. Use format: NLS-2026-XXX');
    }
    setNlsId(nlsId);
    await queryClient.prefetchQuery({
      queryKey: ['student', 'info', nlsId],
      queryFn: () => studentService.getStudentInfo(nlsId),
    });
    return nlsId;
  };

  return { search, currentStudentNlsId };
};