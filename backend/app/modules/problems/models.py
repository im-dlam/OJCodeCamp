from sqlalchemy import (
    String,
    DateTime,
    BIGINT,
    Column,
    Index,
    Text,
    Boolean,
    Integer,
    ForeignKey,
    Enum,
    BigInteger,
    func
)
from datetime import datetime
from app.core.db import Base
import enum


class DifficultyLevel(str, enum.Enum):
    EASY = "Dễ"
    MEDIUM = "Trung bình"
    HARD = "Khó"


class Problems(Base):
    __tablename__ = "problems"
    id = Column(BIGINT, primary_key=True, autoincrement=True)
    endpoint = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        comment="URL-friendly identifier",
    )
    point = Column(Integer, nullable=False, default=0, comment="Điểm tích lũy")
    title = Column(String(255), nullable=False, comment="Tiêu đề bài toán")
    difficulty = Column(
        Enum(DifficultyLevel),
        nullable=False,
        index=True,
        comment="Độ khó: Dễ, Trung bình, Khó",
    )
    category = Column(
        String(255), nullable=False, index=True, comment="Danh mục bài toán"
    )
    description = Column(Text, nullable=False, comment="Mô tả chi tiết bài toán")
    created_at = Column(
        DateTime, nullable=False, default=datetime.now, index=True, comment="Ngày tạo"
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.now,
        onupdate=datetime.now,
        comment="Ngày cập nhật",
    )
    __table_args__ = (
        Index("idx_problems_endpoint", "endpoint"),
        Index("idx_problems_difficulty", "difficulty"),
        Index("idx_problems_category", "category"),
        Index("idx_problems_created_at", "created_at"),
    )

    def __repr__(self):
        return f"<Problems(id={self.id}, title='{self.title}', point={self.point}, difficulty='{self.difficulty}')>"


class ProblemExamples(Base):
    __tablename__ = "problem_examples"
    id = Column(BIGINT, primary_key=True, autoincrement=True)
    problem_id = Column(
        BIGINT,
        ForeignKey("problems.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="ID bài toán",
    )
    input_text = Column(Text, nullable=False, comment="Input example")
    output_text = Column(Text, nullable=False, comment="Output example")
    explanation = Column(Text, nullable=True, comment="Giải thích ví dụ")
    order_index = Column(Integer, nullable=False, default=0, comment="Thứ tự sắp xếp")
    created_at = Column(
        DateTime, nullable=False, default=datetime.now, comment="Ngày tạo"
    )
    __table_args__ = (
        Index("idx_problem_examples_problem_id", "problem_id"),
        Index("idx_problem_examples_order", "order_index"),
    )

    def __repr__(self):
        return f"<ProblemExamples(id={self.id}, problem_id={self.problem_id})>"


class ProblemConstraints(Base):
    __tablename__ = "problem_constraints"
    id = Column(BIGINT, primary_key=True, autoincrement=True)
    problem_id = Column(
        BIGINT,
        ForeignKey("problems.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="ID bài toán",
    )
    constraint_text = Column(Text, nullable=False, comment="Nội dung điều kiện")
    order_index = Column(Integer, nullable=False, default=0, comment="Thứ tự sắp xếp")
    created_at = Column(
        DateTime, nullable=False, default=datetime.now, comment="Ngày tạo"
    )
    __table_args__ = (Index("idx_problem_constraints_problem_id", "problem_id"),)

    def __repr__(self):
        return f"<ProblemConstraints(id={self.id}, problem_id={self.problem_id})>"


class ProblemTags(Base):
    __tablename__ = "problem_tags"
    id = Column(BIGINT, primary_key=True, autoincrement=True)
    problem_id = Column(
        BIGINT,
        ForeignKey("problems.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="ID bài toán",
    )
    tag_name = Column(String(255), nullable=False, index=True, comment="Tên tag/nhãn")
    created_at = Column(
        DateTime, nullable=False, default=datetime.now, comment="Ngày tạo"
    )
    __table_args__ = (
        Index("idx_problem_tags_problem_id", "problem_id"),
        Index("idx_problem_tags_tag_name", "tag_name"),
    )

    def __repr__(self):
        return f"<ProblemTags(id={self.id}, tag_name='{self.tag_name}')>"


class TestCases(Base):
    __tablename__ = "test_cases"
    id = Column(BIGINT, primary_key=True, autoincrement=True)
    problem_id = Column(
        BIGINT,
        ForeignKey("problems.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="ID bài toán",
    )
    input_text = Column(Text, nullable=False, comment="Input của test case")
    output_text = Column(Text, nullable=False, comment="Output mong đợi")
    is_hidden = Column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
        comment="Test case ẩn hay công khai",
    )
    created_at = Column(
        DateTime, nullable=False, default=datetime.now, comment="Ngày tạo"
    )
    __table_args__ = (
        Index("idx_test_cases_problem_id", "problem_id"),
        Index("idx_test_cases_is_hidden", "is_hidden"),
    )

    def __repr__(self):
        return f"<TestCases(id={self.id}, problem_id={self.problem_id}, is_hidden={self.is_hidden})>"


class ProblemStats(Base):
    __tablename__ = "problem_stats"

    problem_id = Column(
        BigInteger,
        ForeignKey("problems.id", ondelete="CASCADE"),
        primary_key=True
    )

    attempts = Column(Integer, nullable=False, default=0)
    accepted = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )