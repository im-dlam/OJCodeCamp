from sqlalchemy import (
    String,
    DateTime,
    BIGINT,
    Column,
    Index,
    Text,
    Integer,
    ForeignKey,
    Enum,
    func
)
from app.core.db import Base
import enum


class SubmissionStatus(str, enum.Enum):
    ACCEPTED = "Accepted"
    WRONG_ANSWER = "Wrong Answer"
    TIME_LIMIT_EXCEEDED = "Time Limit Exceeded"
    RUNTIME_ERROR = "Runtime Error"
    COMPILATION_ERROR = "Compilation Error"
    PENDING = "Pending"


class SubmissionLanguage(str, enum.Enum):
    PYTHON = "Python"
    JAVASCRIPT = "JavaScript"
    JAVA = "Java"
    CPP = "C++"
    GO = "Go"


class SubmissionResultStatus(str, enum.Enum):
    PASSED = "Passed"
    FAILED = "Failed"
    RUNTIME_ERROR = "Runtime Error"
    TIME_LIMIT_EXCEEDED = "Time Limit Exceeded"
    COMPILATION_ERROR = "Compilation Error"


class Submissions(Base):
    __tablename__ = "submissions"
    
    id = Column(BIGINT, primary_key=True, autoincrement=True)
    user_id = Column(
        BIGINT,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True, 
        comment="ID người dùng",
    )
    problem_id = Column(
        BIGINT,
        ForeignKey("problems.id", ondelete="CASCADE"),
        nullable=False,
        index=True, 
        comment="ID bài toán",
    )
    code = Column(Text, nullable=False, comment="Code được submit")
    language = Column(
        Enum(SubmissionLanguage), nullable=False, comment="Ngôn ngữ lập trình"
    )
    status = Column(
        Enum(SubmissionStatus),
        nullable=False,
        default=SubmissionStatus.PENDING,
        index=True, 
        comment="Trạng thái submit",
    )
    execution_time = Column(Integer, nullable=True, comment="Thời gian chạy (ms)")
    memory_used = Column(Integer, nullable=True, comment="Bộ nhớ sử dụng (MB)")
    
    submitted_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
        comment="Thời gian submit",
    )
    
    __table_args__ = (
        Index("idx_submissions_user_problem", "user_id", "problem_id"),
    )

    def __repr__(self):
        return f"<Submissions(id={self.id}, user_id={self.user_id}, problem_id={self.problem_id}, status='{self.status}')>"


class SubmissionResults(Base):
    __tablename__ = "submission_results"
    
    id = Column(BIGINT, primary_key=True, autoincrement=True)
    submission_id = Column(
        BIGINT,
        ForeignKey("submissions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="ID submission",
    )
    test_case_id = Column(
        BIGINT,
        ForeignKey("test_cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="ID test case",
    )
    result = Column(
        Enum(SubmissionResultStatus), 
        nullable=False, 
        index=True,
        comment="Kết quả test case"
    )
    output_text = Column(Text, nullable=True, comment="Output thực tế")
    input_text = Column(Text, nullable=True, comment="Input thực tế")
    expected_output = Column(Text, nullable=True, comment="Output mong đợi")
    error_message = Column(Text, nullable=True, comment="Thông báo lỗi")
    
    execution_time = Column(Integer, nullable=True, comment="Thời gian chạy (ms)")
    memory_used = Column(Integer, nullable=True, comment="Bộ nhớ sử dụng (MB)")
    
    created_at = Column(
        DateTime(timezone=True), 
        nullable=False, 
        server_default=func.now(), 
        comment="Ngày tạo"
    )

    def __repr__(self):
        return f"<SubmissionResults(id={self.id}, submission_id={self.submission_id}, result='{self.result}')>"