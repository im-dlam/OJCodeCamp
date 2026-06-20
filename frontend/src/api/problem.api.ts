import type {ProblemFetchResult, ProblemDetailResult} from "../types"
import type { 
    ProblemCreatePayload
 } from '../types';


const baseURL = import.meta.env.VITE_API_URL;

export const fetch_problems = async (limit: number = 10): Promise<ProblemFetchResult> => {
    const res = await fetch(`${baseURL}/api/problems/?skip=0&limit=${limit}`, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        },
        credentials: "include"
    });
    const data = await res.json();
    return data; 
}

export const problem_detail = async (endpoint: string): Promise<ProblemDetailResult> => {
    const res = await fetch(`${baseURL}/api/problems/${endpoint}`, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        },
        credentials: "include"
    });
    const data = await res.json();
    return data; 
}


export const createProblemApi = async (payload: ProblemCreatePayload) => {
  const response = await fetch(`${baseURL}/api/problems/`, { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    credentials: "include"
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Error authen');
  }

  return response.json();
};