import type {ProblemFetchResult, ProblemDetailResult} from "../types"


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