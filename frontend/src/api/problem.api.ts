import type { ProblemFetchResult, ProblemDetailResult, ProblemUpdatePayload, ProblemExample, ProblemConstraint, ProblemTag } from "../types"
import type {
    ProblemCreatePayload,
    ProblemActionResult
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

export const updateProblem = async (problem_id: number, payload: ProblemUpdatePayload): Promise<ProblemActionResult> => {
    const response = await fetch(`${baseURL}/api/problems/${problem_id}`, {
        method: 'PUT',
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

export const deleteProblem = async (problem_id: number): Promise<ProblemActionResult> => {
    const response = await fetch(`${baseURL}/api/problems/${problem_id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: "include"
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error authen');
    }

    return response.json();
};

export const addProblemExample = async (problem_id: number, payload: ProblemExample): Promise<ProblemActionResult> => {
    const response = await fetch(`${baseURL}/api/problems/${problem_id}/examples?input_text=${payload.input_text}&output_text=${payload.output_text}&explanation=${payload.explanation}&order_index=${payload.order_index}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: "include"
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error authen');
    }

    return response.json();
};

export const addProblemConstraint = async (problem_id: number, payload: ProblemConstraint): Promise<ProblemActionResult> => {
    const response = await fetch(`${baseURL}/api/problems/${problem_id}/constraints?constraint_text=${payload.constraint_text}&order_index=${payload.order_index}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: "include"
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error authen');
    }

    return response.json();
};

export const addProblemTag = async (problem_id: number, payload: ProblemTag): Promise<ProblemActionResult> => {
    const response = await fetch(`${baseURL}/api/problems/${problem_id}/tags?tag_name=${payload.tag_name}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: "include"
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error authen');
    }

    return response.json();
};