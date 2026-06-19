// src/hooks/useProblems.ts
import { useQuery } from '@tanstack/react-query';
import { fetch_problems, problem_detail } from '../api/problem.api';
import type { ProblemDetailResult } from '../types'; 

export const useProblems = (limit: number = 10) => {
  return useQuery({
    queryKey: ['problems', limit], 
    queryFn: () => fetch_problems(limit),
    staleTime: 5 * 60 * 1000, 
    retry: 1, 
  });
};



export const useProblemDetail = (endpoint: string) => {
  return useQuery<ProblemDetailResult>({ 
    queryKey: ['problems', endpoint], 
    queryFn: () => problem_detail(endpoint),
    staleTime: 5 * 60 * 1000, 
    retry: 1, 
  });
};