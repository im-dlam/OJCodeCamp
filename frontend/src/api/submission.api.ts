import type {SubmitListResult, SubmitPayload, SubmitResult} from '../types'
const baseURL = import.meta.env.VITE_API_URL || "";


export const submitCode = async (payload: SubmitPayload) => {
  const res = await fetch(`${baseURL}/api/submissions/`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    credentials:'include'
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Please try again");
  }

  return data;
};



export const fetch_submissions = async (problem_id: string, limit: number = 10): Promise<SubmitListResult> => {
    const res = await fetch(`${baseURL}/api/submissions/?problem_id=${problem_id}&skip=0&limit=${limit}`, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        },
        credentials: "include"
    });
    const data = await res.json();
    return data; 
}

export const submission_result = async (sub_id: number): Promise<SubmitResult> => {
    const res = await fetch(`${baseURL}/api/submissions/${sub_id}/result`, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        },
        credentials: "include"
    });
    const data = await res.json();
    return data; 
}