export interface ProblemExample {
  id: number;
  input_text: string;
  output_text: string;
  explanation: string;
  order_index: number;
}

export interface ProblemConstraint {
  id: number;
  constraint_text: string;
  order_index: number;
}

export interface ProblemTag {
  id: number;
  tag_name: string;
}

export interface ProblemPreview {
  id: number;
  endpoint: string;
  title: string;
  difficulty: string;
  category: string;
  point: number;
  is_solved: boolean;
}

export interface ProblemDetail extends ProblemPreview{
  description: string;
  examples: ProblemExample[];
  constraints: ProblemConstraint[];
  tags: ProblemTag[];
}


export interface ProblemFetchResult {
  success: boolean,
  data: ProblemPreview[],
  total: number,
  skip: number;
  limit: number;
  current_count: number;
  has_next: number;

}

export interface ProblemDetailResult {
  success: boolean;
  problem: ProblemDetail
}