export interface SubmitPayload {
  code: string;
  language: string;
  problem_id: number;
}

export interface Submit {
    id: number;
    problem_id: number;
    language: string;
    status: string ;
    execution_time: string | null;
    memory_used: string | null;
    submitted_at: string;
}

export interface SubmitListResult {
  success: true;
  message ?: string;
  data: Submit[];
  total ?: number;
  skip ?: number;
  limit ?: number;
}


export interface TestCasePreview {
  submission_id: number;
  test_case_id: number;
  result: string;
  input_text: string;
  output_text: string;
  expected_output: string;
  error_message: string
}

export interface SubmitResult {
  success: boolean;
  submission_id: number;
  status: "Pending" | "Accepted" | "Wrong Answer" | "Time Limit Exceeded" | "Runtime Error" | "Compilation Error";
  passed: number;
  total: number;
  execution_time: string;
  memory_used: string;
  results: TestCasePreview[]
}

