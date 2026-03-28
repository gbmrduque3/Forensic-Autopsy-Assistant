from pydantic import BaseModel
from typing import List, Optional


class UserBase(BaseModel):
    name: str
    username: str
    role: str


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: str
    writeApproved: bool
    createdAt: str

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str
    password: str


class KBEntryBase(BaseModel):
    title: str
    category: str
    content: str
    steps: List[str]
    trigger_keywords: List[str]
    author: str
    authorId: str


class KBEntryCreate(KBEntryBase):
    pass


class KBEntry(KBEntryBase):
    id: str
    timestamp: str

    class Config:
        from_attributes = True


class NoteCreate(BaseModel):
    text: str
    userId: str
    category: Optional[str] = "General"
    source: Optional[str] = "manual"


class Note(BaseModel):
    id: str
    userId: str
    text: str
    category: str
    source: str
    timestamp: str

    class Config:
        from_attributes = True


class ApproveWriteRequest(BaseModel):
    userId: str
    approved: bool


# ── Capture Schemas ─────────────────────────────────────────

class CaptureCreate(BaseModel):
    userId: str
    imageData: str


class CaptureAnnotationCreate(BaseModel):
    x: float
    y: float
    label: Optional[str] = ""


class CaptureAnnotation(BaseModel):
    id: str
    captureId: str
    x: float
    y: float
    label: str

    class Config:
        from_attributes = True


class CaptureNoteCreate(BaseModel):
    userId: str
    text: str
    source: Optional[str] = "manual"


class CaptureNote(BaseModel):
    id: str
    captureId: str
    userId: str
    text: str
    source: str
    timestamp: str

    class Config:
        from_attributes = True


class Capture(BaseModel):
    id: str
    userId: str
    imageData: str
    timestamp: str
    notes: List[CaptureNote] = []
    annotations: List[CaptureAnnotation] = []

    class Config:
        from_attributes = True


# ── User Settings Schemas ───────────────────────────────────

class UserSettingsUpdate(BaseModel):
    defaultCameraId: Optional[str] = None
    voiceStart: Optional[str] = "anótalo mario hugo"
    voiceStop: Optional[str] = "basta rogelio"


class UserSettings(BaseModel):
    id: str
    userId: str
    defaultCameraId: Optional[str] = None
    voiceStart: str
    voiceStop: str

    class Config:
        from_attributes = True

