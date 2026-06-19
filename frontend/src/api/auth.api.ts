import type { LoginForm, SignupForm, UserPublic, UserLeaderBoardRetult } from '../types';

const baseURL = import.meta.env.VITE_API_URL || "";

export const login = async (userData: LoginForm) => {
  const res = await fetch(`${baseURL}/api/users/login`, {
    method: "POST", 
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData), 
    credentials:"include"
  });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.detail || "Please try login again"); 
  }
  
  return data;
};

export const signup = async (userData: SignupForm) => {
  const res = await fetch(`${baseURL}/api/users/signup`, {
    method: "POST", 
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
    credentials:"include"

  });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.detail || "Register failed");
  }
  
  return data;
};



export const get_current_me = async (): Promise<UserPublic> => {
  const res = await fetch(`${baseURL}/api/users/me`, {
    method: "GET",
    credentials: "include", 
    headers: {
      "Accept": "application/json"
    }
  });

  if (!res.ok) {
    throw new Error("Invalid authen");
  }
  
  return res.json();
};

export const logoutUser = async () => {
  const res = await fetch(`${baseURL}/api/users/logout`, {
    method: "POST", 
    credentials: "include"
  });
  
  if (!res.ok) throw new Error("Cannot logout");
  return res.json();
};


export const get_leaderboard = async (): Promise<UserLeaderBoardRetult> => {
  const res = await fetch(`${baseURL}/api/users/leaderboard`, {
    method: "GET",
    credentials: "include", 
    headers: {
      "Accept": "application/json"
    }
  });

  if (!res.ok) {
    throw new Error("Cannot get leaderboard");
  }
  
  return res.json();
};
