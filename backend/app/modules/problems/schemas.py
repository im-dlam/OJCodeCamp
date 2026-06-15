from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class DifficultyLevelSchema(str, Enum):
    EASY = "Dễ"
    MEDIUM = "Trung bình"
    HARD = "Khó"


class ProblemExampleSchema(BaseModel):
    id: Optional[int] = None
    problem_id: Optional[int] = None
    input_text: str = Field(..., min_length=1, description="Input example")
    output_text: str = Field(..., min_length=1, description="Output example")
    explanation: Optional[str] = Field(None, description="Giải thích ví dụ")
    order_index: int = Field(0, ge=0, description="Thứ tự sắp xếp")

    class Config:
        from_attributes = True


class ProblemConstraintSchema(BaseModel):
    id: Optional[int] = None
    problem_id: Optional[int] = None
    constraint_text: str = Field(..., min_length=1, description="Nội dung điều kiện")
    order_index: int = Field(0, ge=0, description="Thứ tự sắp xếp")

    class Config:
        from_attributes = True


class ProblemTagSchema(BaseModel):
    id: Optional[int] = None
    problem_id: Optional[int] = None
    tag_name: str = Field(..., min_length=1, max_length=255, description="Tên tag")

    class Config:
        from_attributes = True


class TestCaseSchema(BaseModel):
    id: Optional[int] = None
    problem_id: Optional[int] = None
    input_text: str = Field(..., min_length=1, description="Input của test case")
    output_text: str = Field(..., min_length=1, description="Output mong đợi")
    is_hidden: bool = Field(False, description="Test case ẩn hay công khai")

    class Config:
        from_attributes = True


class ProblemCreateSchema(BaseModel):
    endpoint: str = Field(..., min_length=1, max_length=255, pattern=r"^[a-z0-9\-]+$", description="URL-friendly identifier")
    title: str = Field(..., min_length=1, max_length=255, description="Tiêu đề bài toán")
    difficulty: DifficultyLevelSchema = Field(..., description="Độ khó")
    category: str = Field(..., min_length=1, max_length=255, description="Danh mục bài toán")
    description: str = Field(..., min_length=1, description="Mô tả chi tiết bài toán")
    point: int = Field(0, ge=0, description="Điểm của bài toán")
    examples: List[ProblemExampleSchema] = Field(default_factory=list, description="Danh sách ví dụ")
    constraints: List[ProblemConstraintSchema] = Field(default_factory=list, description="Danh sách điều kiện")
    tags: List[ProblemTagSchema] = Field(default_factory=list, description="Danh sách tag")
    test_cases: List[TestCaseSchema] = Field(default_factory=list, description="Danh sách test case")


class ProblemUpdateSchema(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255, description="Tiêu đề bài toán")
    difficulty: Optional[DifficultyLevelSchema] = Field(None, description="Độ khó")
    category: Optional[str] = Field(None, min_length=1, max_length=255, description="Danh mục bài toán")
    description: Optional[str] = Field(None, min_length=1, description="Mô tả chi tiết bài toán")
    point: Optional[int] = Field(None, ge=0, description="Điểm của bài toán")


class ProblemListSchema(BaseModel):
    id: int
    endpoint: str
    title: str
    difficulty: str
    category: str
    point: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProblemDetailSchema(BaseModel):
    id: int
    endpoint: str
    title: str
    difficulty: str
    category: str
    point: int
    description: str
    examples: List[ProblemExampleSchema]
    constraints: List[ProblemConstraintSchema]
    tags: List[ProblemTagSchema]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProblemWithTestCasesSchema(BaseModel):
    id: int
    endpoint: str
    title: str
    difficulty: str
    category: str
    point: int
    description: str
    examples: List[ProblemExampleSchema]
    constraints: List[ProblemConstraintSchema]
    tags: List[ProblemTagSchema]
    test_cases: List[TestCaseSchema]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AddExampleSchema(BaseModel):
    input_text: str = Field(..., min_length=1, description="Input example")
    output_text: str = Field(..., min_length=1, description="Output example")
    explanation: Optional[str] = Field(None, description="Giải thích ví dụ")
    order_index: int = Field(0, ge=0, description="Thứ tự sắp xếp")


class AddConstraintSchema(BaseModel):
    constraint_text: str = Field(..., min_length=1, description="Nội dung điều kiện")
    order_index: int = Field(0, ge=0, description="Thứ tự sắp xếp")


class AddTagSchema(BaseModel):
    tag_name: str = Field(..., min_length=1, max_length=255, description="Tên tag")


class AddTestCaseSchema(BaseModel):
    input_text: str = Field(..., min_length=1, description="Input của test case")
    output_text: str = Field(..., min_length=1, description="Output mong đợi")
    is_hidden: bool = Field(False, description="Test case ẩn hay công khai")


class ProblemsListResponseSchema(BaseModel):
    success: bool
    data: List[ProblemListSchema]
    total: int
    skip: int
    limit: int


class ProblemDetailResponseSchema(BaseModel):
    success: bool
    problem: ProblemDetailSchema


class ProblemCreateResponseSchema(BaseModel):
    success: bool
    message: str
    problem_id: int


class ProblemUpdateResponseSchema(BaseModel):
    success: bool
    message: str


class ProblemDeleteResponseSchema(BaseModel):
    success: bool
    message: str


class TestCasesResponseSchema(BaseModel):
    success: bool
    test_cases: List[TestCaseSchema]


class ExampleResponseSchema(BaseModel):
    success: bool
    message: str
    example_id: int


class ConstraintResponseSchema(BaseModel):
    success: bool
    message: str
    constraint_id: int


class TagResponseSchema(BaseModel):
    success: bool
    message: str
    tag_id: int