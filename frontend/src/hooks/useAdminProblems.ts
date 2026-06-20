import { useMutation } from '@tanstack/react-query';
import type { ProblemCreatePayload } from '../types';
import { createProblemApi } from '../api/problem.api';

export const useCreateProblem = () => {
  return useMutation({
    mutationFn: (payload: ProblemCreatePayload) => createProblemApi(payload),
    onSuccess: (data) => {
      // console.log("Tạo bài toán thành công!", data);
    },
    onError: (error) => {
      console.error("Tạo bài toán thất bại:", error);
    }
  });
};