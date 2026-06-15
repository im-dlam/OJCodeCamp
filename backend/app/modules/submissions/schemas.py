from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class SubmissionLanguageSchema(str, Enum):
    PYTHON = "Python"
    JAVASCRIPT = "JavaScript"
    JAVA = "Java"
    CPP = "C++"
    GO = "Go"
    CSHARP = "C#"
    RUBY = "Ruby"
    PHP = "PHP"


class SubmissionStatusSchema(str, Enum):
    ACCEPTED = "Accepted"
    WRONG_ANSWER = "Wrong Answer"
    TIME_LIMIT_EXCEEDED = "Time Limit Exceeded"
    RUNTIME_ERROR = "Runtime Error"
    COMPILATION_ERROR = "Compilation Error"
    PENDING = "Pending"


class SubmissionResultStatusSchema(str, Enum):
    PASSED = "Passed"
    FAILED = "Failed"
    RUNTIME_ERROR = "Runtime Error"
    TIME_LIMIT_EXCEEDED = "Time Limit Exceeded"


class SubmissionResultDetailSchema(BaseModel):
    id: int
    submission_id: int
    test_case_id: int
    result: SubmissionResultStatusSchema
    output_text: Optional[str] = None
    expected_output: Optional[str] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class SubmissionCreateSchema(BaseModel):
    problem_id: int = Field(..., gt=0, description="ID bài toán")
    code: str = Field(..., min_length=1, description="Code được submit")
    language: SubmissionLanguageSchema = Field(..., description="Ngôn ngữ lập trình")

    class Config:
        json_schema_extra = {
            "example": {
                "problem_id": 1,
                "code": "a, b = map(int, input().split())\nprint(a + b)",
                "language": "Python"
            }
        }


class SubmissionListSchema(BaseModel):
    id: int
    problem_id: int
    language: str
    status: str
    execution_time: Optional[float] = None
    memory_used: Optional[float] = None
    submitted_at: datetime

    class Config:
        from_attributes = True


class SubmissionDetailSchema(BaseModel):
    id: int
    user_id: int
    problem_id: int
    code: str
    language: str
    status: str
    execution_time: Optional[float] = None
    memory_used: Optional[float] = None
    submitted_at: datetime
    results: List[SubmissionResultDetailSchema] = []

    class Config:
        from_attributes = True


class SubmissionResultSchema(BaseModel):
    submission_id: int
    test_case_id: int
    result: str
    output_text: Optional[str] = None
    expected_output: Optional[str] = None
    error_message: Optional[str] = None


class SubmissionResponseSchema(BaseModel):
    success: bool
    message: str
    submission_id: int


class SubmissionListResponseSchema(BaseModel):
    success: bool
    data: List[SubmissionListSchema]
    total: int
    skip: int
    limit: int


class SubmissionDetailResponseSchema(BaseModel):
    success: bool
    submission: SubmissionDetailSchema


class SubmissionResultResponseSchema(BaseModel):
    success: bool
    submission_id: int
    status: str
    passed: int
    total: int
    execution_time: Optional[float] = None
    memory_used: Optional[float] = None
    results: List[SubmissionResultSchema]


class SubmissionCheckedResponseSchema(BaseModel):
    success: bool
    user_id: int
    problem_id: int
    is_solved: bool


class ProblemStatsSchema(BaseModel):
    success: bool
    problem_id: int
    total_submissions: int
    accepted: int
    acceptance_rate: str


class SubmissionCreateResponseSchema(BaseModel):
    success: bool
    message: str
    submission_id: int

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Submit thành công",
                "submission_id": 1
            }
        }


class ErrorResponseSchema(BaseModel):
    success: bool = False
    detail: str

    class Config:
        json_schema_extra = {
            "example": {
                "success": False,
                "detail": "Bài toán không tìm thấy"
            }
        }