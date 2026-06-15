from sqlalchemy import String, DateTime, BIGINT, Column, Index, Text, Boolean, Enum, ForeignKey, UniqueConstraint, Integer
from datetime import datetime
from app.core.db import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MEMBER = "member"
    DISTRIBUTOR = "distributor"
    COLLABORATOR = "collaborator"


class DifficultyLevel(str, enum.Enum):
    EASY = "Dễ"
    MEDIUM = "Trung bình"
    HARD = "Khó"






class UserProblemStatus(str, enum.Enum):
    SOLVED = "Solved"
    ATTEMPTED = "Attempted"
    NOT_ATTEMPTED = "Not Attempted"
    
    

class Users(Base):
    __tablename__ = "users"
    id = Column(BIGINT, primary_key=True, autoincrement=True)
    username = Column(String(255), unique=True, nullable=False, index=True, comment="Tên đăng nhập")
    email = Column(String(255), unique=True, nullable=False, index=True, comment="Email")
    password_hash = Column(String(255), nullable=False, comment="Mật khẩu mã hóa")
    point = Column(Integer, nullable=False, default=0, comment="Điểm tích lũy")
    full_name = Column(String(255), nullable=True, default="anonymous", comment="Họ và tên")
    role = Column(Enum(UserRole), nullable=False, default=UserRole.MEMBER, comment="Vai trò")
    is_active = Column(Boolean, nullable=False, default=True, comment="Trạng thái kích hoạt")
    created_at = Column(DateTime, nullable=False, default=datetime.now, comment="Ngày tạo")
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now, comment="Ngày cập nhật")
    __table_args__ = (Index("idx_users_username", "username"), Index("idx_users_email", "email"))
    def __repr__(self):
        return f"<Users(id={self.id}, username='{self.username}', email='{self.email}, point='{self.point}')>"


class UserProblemStats(Base):
    __tablename__ = "user_problem_stats"
    id = Column(BIGINT, primary_key=True, autoincrement=True)
    user_id = Column(BIGINT, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True, comment="ID người dùng")
    problem_id = Column(BIGINT, ForeignKey("problems.id", ondelete="CASCADE"), nullable=False, index=True, comment="ID bài toán")
    status = Column(Enum(UserProblemStatus), nullable=False, default=UserProblemStatus.NOT_ATTEMPTED, comment="Trạng thái")
    attempts = Column(Integer, nullable=False, default=0, comment="Số lần thử")
    first_solved_at = Column(DateTime, nullable=True, comment="Lần đầu giải")
    last_attempted_at = Column(DateTime, nullable=True, comment="Lần cuối thử")
    __table_args__ = (Index("idx_user_problem_stats_user_id", "user_id"), Index("idx_user_problem_stats_problem_id", "problem_id"), UniqueConstraint("user_id", "problem_id", name="uq_user_problem_stats"))
    def __repr__(self):
        return f"<UserProblemStats(user_id={self.user_id}, problem_id={self.problem_id}, status='{self.status}')>"