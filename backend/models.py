from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
import datetime

from . import database
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String)  # 'owner', 'professional', 'student'
    writeApproved = Column(Boolean, default=False)
    createdAt = Column(String, default=lambda: datetime.datetime.utcnow().isoformat())

    notes = relationship("Note", back_populates="owner")
    kb_entries = relationship("KBEntry", back_populates="author_user")
    captures = relationship("Capture", back_populates="owner")
    settings = relationship("UserSettings", back_populates="owner", uselist=False)


class KBEntry(Base):
    __tablename__ = "knowledge_base"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, index=True)
    category = Column(String, index=True)
    content = Column(Text)
    steps = Column(Text)  # JSON string array
    trigger_keywords = Column(Text)  # JSON string array
    author = Column(String)
    authorId = Column(String, ForeignKey("users.id"))
    timestamp = Column(String, default=lambda: datetime.datetime.utcnow().isoformat())

    author_user = relationship("User", back_populates="kb_entries")


class Note(Base):
    __tablename__ = "notes"

    id = Column(String, primary_key=True, index=True)
    userId = Column(String, ForeignKey("users.id"))
    text = Column(Text)
    category = Column(String, default="General")
    source = Column(String, default="manual")
    timestamp = Column(String, default=lambda: datetime.datetime.utcnow().isoformat())

    owner = relationship("User", back_populates="notes")


class Capture(Base):
    __tablename__ = "captures"

    id = Column(String, primary_key=True, index=True)
    userId = Column(String, ForeignKey("users.id"))
    imageData = Column(Text)  # base64 encoded image
    timestamp = Column(String, default=lambda: datetime.datetime.utcnow().isoformat())

    owner = relationship("User", back_populates="captures")
    notes = relationship("CaptureNote", back_populates="capture", cascade="all, delete-orphan")
    annotations = relationship("CaptureAnnotation", back_populates="capture", cascade="all, delete-orphan")


class CaptureNote(Base):
    __tablename__ = "capture_notes"

    id = Column(String, primary_key=True, index=True)
    captureId = Column(String, ForeignKey("captures.id"))
    userId = Column(String, ForeignKey("users.id"))
    text = Column(Text)
    source = Column(String, default="manual")  # 'voice' or 'manual'
    timestamp = Column(String, default=lambda: datetime.datetime.utcnow().isoformat())

    capture = relationship("Capture", back_populates="notes")


class CaptureAnnotation(Base):
    __tablename__ = "capture_annotations"

    id = Column(String, primary_key=True, index=True)
    captureId = Column(String, ForeignKey("captures.id"))
    x = Column(Float)  # percentage 0-100
    y = Column(Float)  # percentage 0-100
    label = Column(String, default="")

    capture = relationship("Capture", back_populates="annotations")


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(String, primary_key=True, index=True)
    userId = Column(String, ForeignKey("users.id"), unique=True)
    defaultCameraId = Column(String, nullable=True)
    voiceStart = Column(String, default="anótalo mario hugo")
    voiceStop = Column(String, default="basta rogelio")

    owner = relationship("User", back_populates="settings")
