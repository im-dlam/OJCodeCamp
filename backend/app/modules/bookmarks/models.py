from sqlalchemy import String, DateTime, BIGINT, Column, Index, Text, Boolean, Integer, ForeignKey, UniqueConstraint
from datetime import datetime
from app.core.db import Base
import enum


class Bookmarks(Base):
    __tablename__ = "bookmarks"
    id = Column(BIGINT, primary_key=True, autoincrement=True)
    user_id = Column(BIGINT, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True, comment="ID người dùng")
    problem_id = Column(BIGINT, ForeignKey("problems.id", ondelete="CASCADE"), nullable=False, index=True, comment="ID bài toán")
    created_at = Column(DateTime, nullable=False, default=datetime.now, comment="Ngày tạo")
    __table_args__ = (Index("idx_bookmarks_user_id", "user_id"), Index("idx_bookmarks_problem_id", "problem_id"), UniqueConstraint("user_id", "problem_id", name="uq_bookmarks"))
    def __repr__(self):
        return f"<Bookmarks(id={self.id}, user_id={self.user_id}, problem_id={self.problem_id})>"