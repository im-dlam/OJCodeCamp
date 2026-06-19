import { useMutation, useQuery } from '@tanstack/react-query';
import { submitCode, fetch_submissions, submission_result } from '../api/submission.api';
import type {SubmitPayload, SubmitResult} from '../types'


export const useSubmitCode = () => {
  return useMutation({
    mutationFn: (payload: SubmitPayload) => submitCode(payload),
  });
};


export const useFetchSubmit = (problem_id: string, limit: number = 10) => {
  return useQuery({
    queryKey: ['submission', limit, problem_id], 
    queryFn: () => fetch_submissions(problem_id, limit),
    staleTime: 5 * 60 * 1000, 
    retry: 1, 
  });
};


export const useFetchSubmitResult = (sub_id: number | null) => {
  return useQuery<SubmitResult>({
    queryKey: ['submission', sub_id], 
    queryFn: () => submission_result(sub_id!), 
    enabled: !!sub_id, 
    refetchInterval: (query) => {
      const data = query.state?.data as SubmitResult | undefined;
      return (data?.status === 'Pending' || !data) ? 1000 : false;
    },
    staleTime: 0, 
  });
};
