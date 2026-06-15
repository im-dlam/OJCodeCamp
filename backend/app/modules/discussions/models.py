from sqlalchemy import String, DateTime, BIGINT, Column, Index, Text, Boolean, Integer, ForeignKey, Enum
from datetime import datetime
from app.core.db import Base
import enum


class Discussions(Base):
    __tablename__ = "discussions"
    id = Column(BIGINT, primary_key=True, autoincrement=True)
    problem_id = Column(BIGINT, ForeignKey("problems.id", ondelete="CASCADE"), nullable=False, index=True, comment="ID bài toán")
    user_id = Column(BIGINT, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True, comment="ID người tạo")
    title = Column(String(255), nullable=False, comment="Tiêu đề bàn luận")
    content = Column(Text, nullable=False, comment="Nội dung bàn luận")
    likes_count = Column(Integer, nullable=False, default=0, comment="Số lượt thích")
    views_count = Column(Integer, nullable=False, default=0, comment="Số lượt xem")
    created_at = Column(DateTime, nullable=False, default=datetime.now, index=True, comment="Ngày tạo")
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now, comment="Ngày cập nhật")
    __table_args__ = (Index("idx_discussions_problem_id", "problem_id"), Index("idx_discussions_user_id", "user_id"), Index("idx_discussions_created_at", "created_at"), Index("idx_discussions_likes_count", "likes_count"))
    def __repr__(self):
        return f"<Discussions(id={self.id}, problem_id={self.problem_id}, user_id={self.user_id}, title='{self.title}')>"


class DiscussionComments(Base):
    __tablename__ = "discussion_comments"
    id = Column(BIGINT, primary_key=True, autoincrement=True)
    discussion_id = Column(BIGINT, ForeignKey("discussions.id", ondelete="CASCADE"), nullable=False, index=True, comment="ID bàn luận")
    user_id = Column(BIGINT, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True, comment="ID người comment")
    parent_comment_id = Column(BIGINT, ForeignKey("discussion_comments.id", ondelete="CASCADE"), nullable=True, comment="ID comment cha (reply)")
    content = Column(Text, nullable=False, comment="Nội dung comment")
    likes_count = Column(Integer, nullable=False, default=0, comment="Số lượt thích")
    created_at = Column(DateTime, nullable=False, default=datetime.now, index=True, comment="Ngày tạo")
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now, comment="Ngày cập nhật")
    __table_args__ = (Index("idx_discussion_comments_discussion_id", "discussion_id"), Index("idx_discussion_comments_user_id", "user_id"), Index("idx_discussion_comments_parent_comment_id", "parent_comment_id"), Index("idx_discussion_comments_created_at", "created_at"))
    def __repr__(self):
        return f"<DiscussionComments(id={self.id}, discussion_id={self.discussion_id}, user_id={self.user_id})>"


class DiscussionLikes(Base):
    __tablename__ = "discussion_likes"
    id = Column(BIGINT, primary_key=True, autoincrement=True)
    discussion_id = Column(BIGINT, ForeignKey("discussions.id", ondelete="CASCADE"), nullable=False, index=True, comment="ID bàn luận")
    user_id = Column(BIGINT, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True, comment="ID người thích")
    created_at = Column(DateTime, nullable=False, default=datetime.now, comment="Ngày tạo")
    __table_args__ = (Index("idx_discussion_likes_discussion_id", "discussion_id"), Index("idx_discussion_likes_user_id", "user_id"))
    def __repr__(self):
        return f"<DiscussionLikes(id={self.id}, discussion_id={self.discussion_id}, user_id={self.user_id})>"


class CommentLikes(Base):
    __tablename__ = "comment_likes"
    id = Column(BIGINT, primary_key=True, autoincrement=True)
    comment_id = Column(BIGINT, ForeignKey("discussion_comments.id", ondelete="CASCADE"), nullable=False, index=True, comment="ID comment")
    user_id = Column(BIGINT, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True, comment="ID người thích")
    created_at = Column(DateTime, nullable=False, default=datetime.now, comment="Ngày tạo")
    __table_args__ = (Index("idx_comment_likes_comment_id", "comment_id"), Index("idx_comment_likes_user_id", "user_id"))
    def __repr__(self):
        return f"<CommentLikes(id={self.id}, comment_id={self.comment_id}, user_id={self.user_id})>"