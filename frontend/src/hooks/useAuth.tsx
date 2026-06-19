import { useMutation, useQuery } from '@tanstack/react-query';
import { login, signup, get_current_me, logoutUser, get_leaderboard } from '../api/auth.api';
import type { LoginForm, SignupForm } from '../types';
import {queryClient} from "../App"

export const useSignup = () => {
  return useMutation({
    mutationFn: (userData: SignupForm) => signup(userData),
    onSuccess: (data) => {
    //   console.log("Đăng ký thành công!", data);
    // return data;
    },
    onError: (error) => {
      console.error("Đăng ký thất bại:", error);
    }
  });
};

export const useLogin = () => {
  return useMutation({
    mutationFn: (userData: LoginForm) => login(userData),
    onSuccess: (data) => {}
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: get_current_me,
    retry: false, 
    staleTime: 5 * 60 * 1000,
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.setQueryData(['user', 'me'], null);
    }
  });
};



export const useTopLeaderBoard = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: get_leaderboard,
    retry: false, 
    staleTime: 5 * 60 * 1000,
  });
};