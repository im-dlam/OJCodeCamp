import { useMutation } from '@tanstack/react-query';
import type { ProblemConstraint, ProblemCreatePayload, ProblemExample, ProblemTag, ProblemUpdatePayload } from '../types';
import { addProblemConstraint, addProblemExample, addProblemTag, createProblemApi, deleteProblem, updateProblem } from '../api/problem.api';
import {queryClient} from '../App';

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


export const useUpdateProblem = (problem_id: number) => {

  return useMutation({
    mutationFn: (payload: ProblemUpdatePayload) => updateProblem(problem_id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems'] });
      queryClient.invalidateQueries({ queryKey: ['problem', problem_id] });
    },
    onError: (error) => {
      console.error("Cập nhật bài toán fail:", error);
    }
  });
};

export const useDeleteProblem = (problem_id: number) => {

  return useMutation({
    mutationFn: () => deleteProblem(problem_id),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['problems'] });
    },
    onError: (error) => {
      console.error("Delete fail:", error);
    }
  });
};

export const useAddProblemExample = (problem_id: number) => {

  return useMutation({
    mutationFn: (payload: ProblemExample) => addProblemExample(problem_id, payload),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['problems'] });
    },
    onError: (error) => {
      console.error("Delete fail:", error);
    }
  });
};

export const useaddProblemConstraint = (problem_id: number) => {

  return useMutation({
    mutationFn: (payload: ProblemConstraint) => addProblemConstraint(problem_id, payload),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['problems'] });
    },
    onError: (error) => {
      console.error("Delete fail:", error);
    }
  });
};

export const useAProblemTag = (problem_id: number) => {

  return useMutation({
    mutationFn: (payload: ProblemTag) => addProblemTag(problem_id, payload),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['problems'] });
    },
    onError: (error) => {
      console.error("Delete fail:", error);
    }
  });
};