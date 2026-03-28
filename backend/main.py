from fastapi import FastAPI, Depends, HTTPException, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import List
from .database import Base
import uuid
import datetime
import json
import random
import string

from . import models
from . import schemas
from . import database

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Autopsy Assistant API")

import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app.mount(
    "/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static"
)
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))


# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
async def serve_index(request: Request):
    return templates.TemplateResponse(request=request, name="index.html", context={"request": request})


@app.get("/dashboard")
async def serve_dashboard(request: Request):
    return templates.TemplateResponse(request=request, name="app.html", context={"request": request})


@app.get("/app.html")
async def serve_app(request: Request):
    return templates.TemplateResponse(request=request, name="app.html", context={"request": request})


@app.get("/favicon.ico", include_in_schema=False)
async def serve_favicon():
    return Response(content=b"", media_type="image/x-icon")


# Authentication
@app.post("/api/auth/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = (
        db.query(models.User).filter(models.User.username == user.username).first()
    )
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    user_id = "user-" + str(uuid.uuid4())
    create_time = datetime.datetime.utcnow().isoformat()
    db_user = models.User(
        id=user_id,
        name=user.name,
        username=user.username,
        password=user.password,
        role=user.role,
        writeApproved=False,
        createdAt=create_time,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/api/auth/login", response_model=schemas.User)
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    db_user = (
        db.query(models.User)
        .filter(
            models.User.username == req.username, models.User.password == req.password
        )
        .first()
    )
    if not db_user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    return db_user


@app.get("/api/auth/users", response_model=List[schemas.User])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()


@app.post("/api/auth/approve")
def approve_write(req: schemas.ApproveWriteRequest, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == req.userId).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db_user.writeApproved = req.approved
    db.commit()
    return {"ok": True}


# Knowledge Base
@app.get("/api/knowledge", response_model=List[schemas.KBEntry])
def get_kb(db: Session = Depends(get_db)):
    entries = db.query(models.KBEntry).all()
    # parse json strings to lists
    result = []
    for entry in entries:
        obj = schemas.KBEntry.model_validate(entry)
        obj.steps = json.loads(entry.steps) if entry.steps else []
        obj.trigger_keywords = (
            json.loads(entry.trigger_keywords) if entry.trigger_keywords else []
        )
        result.append(obj)
    return result


@app.post("/api/knowledge", response_model=schemas.KBEntry)
def create_kb_entry(entry: schemas.KBEntryCreate, db: Session = Depends(get_db)):
    entry_id = "kb-" + str(uuid.uuid4())
    db_entry = models.KBEntry(
        id=entry_id,
        title=entry.title,
        category=entry.category,
        content=entry.content,
        steps=json.dumps(entry.steps),
        trigger_keywords=json.dumps(entry.trigger_keywords),
        author=entry.author,
        authorId=entry.authorId,
        timestamp=datetime.datetime.utcnow().isoformat(),
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)

    obj = schemas.KBEntry.model_validate(db_entry)
    obj.steps = json.loads(db_entry.steps)
    obj.trigger_keywords = json.loads(db_entry.trigger_keywords)
    return obj


@app.put("/api/knowledge/{entry_id}", response_model=schemas.KBEntry)
def update_kb_entry(
    entry_id: str, entry: schemas.KBEntryCreate, db: Session = Depends(get_db)
):
    db_entry = db.query(models.KBEntry).filter(models.KBEntry.id == entry_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    db_entry.title = entry.title
    db_entry.category = entry.category
    db_entry.content = entry.content
    db_entry.steps = json.dumps(entry.steps)
    db_entry.trigger_keywords = json.dumps(entry.trigger_keywords)

    db.commit()
    db.refresh(db_entry)

    obj = schemas.KBEntry.model_validate(db_entry)
    obj.steps = json.loads(db_entry.steps)
    obj.trigger_keywords = json.loads(db_entry.trigger_keywords)
    return obj


@app.delete("/api/knowledge/{entry_id}")
def delete_kb_entry(entry_id: str, db: Session = Depends(get_db)):
    db_entry = db.query(models.KBEntry).filter(models.KBEntry.id == entry_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(db_entry)
    db.commit()
    return {"ok": True}


# Notebook
@app.get("/api/notebook/{user_id}", response_model=List[schemas.Note])
def get_notes(user_id: str, db: Session = Depends(get_db)):
    return db.query(models.Note).filter(models.Note.userId == user_id).all()


@app.post("/api/notebook", response_model=schemas.Note)
def create_note(note: schemas.NoteCreate, db: Session = Depends(get_db)):
    note_id = "note-" + str(uuid.uuid4())
    db_note = models.Note(
        id=note_id,
        userId=note.userId,
        text=note.text,
        category=note.category,
        source=note.source,
        timestamp=datetime.datetime.utcnow().isoformat(),
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note


@app.put("/api/notebook/{note_id}", response_model=schemas.Note)
def update_note(note_id: str, note: schemas.NoteCreate, db: Session = Depends(get_db)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")

    db_note.text = note.text
    db_note.category = note.category

    db.commit()
    db.refresh(db_note)
    return db_note


@app.delete("/api/notebook/{note_id}")
def delete_note(note_id: str, db: Session = Depends(get_db)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(db_note)
    db.commit()
    return {"ok": True}


# ── Captures ─────────────────────────────────────────────────

@app.post("/api/captures", response_model=schemas.Capture)
def create_capture(cap: schemas.CaptureCreate, db: Session = Depends(get_db)):
    cap_id = "cap-" + str(uuid.uuid4())
    db_cap = models.Capture(
        id=cap_id,
        userId=cap.userId,
        imageData=cap.imageData,
        timestamp=datetime.datetime.utcnow().isoformat(),
    )
    db.add(db_cap)
    db.commit()
    db.refresh(db_cap)
    return db_cap


@app.get("/api/captures/{user_id}", response_model=List[schemas.Capture])
def get_captures(user_id: str, db: Session = Depends(get_db)):
    return db.query(models.Capture).filter(models.Capture.userId == user_id).all()


@app.delete("/api/captures/{capture_id}")
def delete_capture(capture_id: str, db: Session = Depends(get_db)):
    db_cap = db.query(models.Capture).filter(models.Capture.id == capture_id).first()
    if not db_cap:
        raise HTTPException(status_code=404, detail="Capture not found")
    db.delete(db_cap)
    db.commit()
    return {"ok": True}


# ── Capture Notes ────────────────────────────────────────────

@app.post("/api/captures/{capture_id}/notes", response_model=schemas.CaptureNote)
def create_capture_note(capture_id: str, note: schemas.CaptureNoteCreate, db: Session = Depends(get_db)):
    db_cap = db.query(models.Capture).filter(models.Capture.id == capture_id).first()
    if not db_cap:
        raise HTTPException(status_code=404, detail="Capture not found")
    note_id = "cnote-" + str(uuid.uuid4())
    db_note = models.CaptureNote(
        id=note_id,
        captureId=capture_id,
        userId=note.userId,
        text=note.text,
        source=note.source,
        timestamp=datetime.datetime.utcnow().isoformat(),
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note


@app.get("/api/captures/{capture_id}/notes", response_model=List[schemas.CaptureNote])
def get_capture_notes(capture_id: str, db: Session = Depends(get_db)):
    return db.query(models.CaptureNote).filter(models.CaptureNote.captureId == capture_id).all()


@app.put("/api/captures/notes/{note_id}", response_model=schemas.CaptureNote)
def update_capture_note(note_id: str, note: schemas.CaptureNoteCreate, db: Session = Depends(get_db)):
    db_note = db.query(models.CaptureNote).filter(models.CaptureNote.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    db_note.text = note.text
    db.commit()
    db.refresh(db_note)
    return db_note


@app.delete("/api/captures/notes/{note_id}")
def delete_capture_note(note_id: str, db: Session = Depends(get_db)):
    db_note = db.query(models.CaptureNote).filter(models.CaptureNote.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(db_note)
    db.commit()
    return {"ok": True}


# ── Capture Annotations ─────────────────────────────────────

@app.post("/api/captures/{capture_id}/annotations", response_model=schemas.CaptureAnnotation)
def create_capture_annotation(capture_id: str, ann: schemas.CaptureAnnotationCreate, db: Session = Depends(get_db)):
    db_cap = db.query(models.Capture).filter(models.Capture.id == capture_id).first()
    if not db_cap:
        raise HTTPException(status_code=404, detail="Capture not found")
    ann_id = "ann-" + str(uuid.uuid4())
    db_ann = models.CaptureAnnotation(
        id=ann_id,
        captureId=capture_id,
        x=ann.x,
        y=ann.y,
        label=ann.label,
    )
    db.add(db_ann)
    db.commit()
    db.refresh(db_ann)
    return db_ann


@app.delete("/api/captures/annotations/{ann_id}")
def delete_capture_annotation(ann_id: str, db: Session = Depends(get_db)):
    db_ann = db.query(models.CaptureAnnotation).filter(models.CaptureAnnotation.id == ann_id).first()
    if not db_ann:
        raise HTTPException(status_code=404, detail="Annotation not found")
    db.delete(db_ann)
    db.commit()
    return {"ok": True}


# ── User Settings ────────────────────────────────────────────

@app.get("/api/settings/{user_id}", response_model=schemas.UserSettings)
def get_settings(user_id: str, db: Session = Depends(get_db)):
    db_settings = db.query(models.UserSettings).filter(models.UserSettings.userId == user_id).first()
    if not db_settings:
        # Create default settings
        settings_id = "cfg-" + str(uuid.uuid4())
        db_settings = models.UserSettings(
            id=settings_id,
            userId=user_id,
            defaultCameraId=None,
            voiceStart="anótalo mario hugo",
            voiceStop="basta rogelio",
        )
        db.add(db_settings)
        db.commit()
        db.refresh(db_settings)
    return db_settings


@app.put("/api/settings/{user_id}", response_model=schemas.UserSettings)
def update_settings(user_id: str, settings: schemas.UserSettingsUpdate, db: Session = Depends(get_db)):
    db_settings = db.query(models.UserSettings).filter(models.UserSettings.userId == user_id).first()
    if not db_settings:
        settings_id = "cfg-" + str(uuid.uuid4())
        db_settings = models.UserSettings(
            id=settings_id,
            userId=user_id,
        )
        db.add(db_settings)

    db_settings.defaultCameraId = settings.defaultCameraId
    db_settings.voiceStart = settings.voiceStart
    db_settings.voiceStop = settings.voiceStop
    db.commit()
    db.refresh(db_settings)
    return db_settings


# ── Procedure Sessions (WebSocket) ───────────────────────────

class SessionManager:
    """Manages in-memory real-time procedure sessions."""

    def __init__(self):
        self.sessions = {}  # code -> session data
        self.connections = {}  # code -> list of WebSocket connections

    def _gen_code(self):
        chars = string.ascii_uppercase + string.digits
        return 'SES-' + ''.join(random.choices(chars, k=4))

    def create_session(self, supervisor_id):
        code = self._gen_code()
        while code in self.sessions:
            code = self._gen_code()
        self.sessions[code] = {
            'code': code,
            'supervisorId': supervisor_id,
            'operatorId': None,
            'steps': [],
            'messages': [],
        }
        self.connections[code] = []
        return self.sessions[code]

    def get_session(self, code):
        return self.sessions.get(code)

    def join_session(self, code, operator_id):
        session = self.sessions.get(code)
        if session:
            session['operatorId'] = operator_id
        return session

    def add_connection(self, code, ws):
        if code not in self.connections:
            self.connections[code] = []
        self.connections[code].append(ws)

    def remove_connection(self, code, ws):
        if code in self.connections:
            self.connections[code] = [c for c in self.connections[code] if c != ws]
            if not self.connections[code]:
                # Clean up empty sessions
                del self.connections[code]
                if code in self.sessions:
                    del self.sessions[code]

    async def broadcast(self, code, message, exclude=None):
        if code not in self.connections:
            return
        for ws in self.connections[code]:
            if ws != exclude:
                try:
                    await ws.send_json(message)
                except Exception:
                    pass


session_manager = SessionManager()


@app.post("/api/procedure/session")
def create_procedure_session(req: dict):
    user_id = req.get('userId', '')
    session = session_manager.create_session(user_id)
    return session


@app.get("/api/procedure/session/{code}")
def get_procedure_session(code: str):
    session = session_manager.get_session(code)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@app.websocket("/ws/procedure/{session_code}")
async def procedure_websocket(websocket: WebSocket, session_code: str):
    session = session_manager.get_session(session_code)
    if not session:
        await websocket.close(code=4004)
        return

    await websocket.accept()
    user_id = websocket.query_params.get('userId', 'unknown')
    role = websocket.query_params.get('role', 'student')

    # If not supervisor, register as operator
    if session['supervisorId'] != user_id:
        session_manager.join_session(session_code, user_id)

    session_manager.add_connection(session_code, websocket)

    # Send current state to new connection
    await websocket.send_json({
        'type': 'session:state',
        'payload': session
    })

    # Notify others
    await session_manager.broadcast(session_code, {
        'type': 'user:joined',
        'payload': {'userId': user_id, 'role': role}
    }, exclude=websocket)

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get('type', '')
            payload = data.get('payload', {})

            if msg_type == 'step:add':
                step = {
                    'id': 's-' + str(uuid.uuid4())[:8],
                    'text': payload.get('text', ''),
                    'status': 'pending',
                    'addedBy': user_id
                }
                session['steps'].append(step)
                await session_manager.broadcast(session_code, {
                    'type': 'step:added',
                    'payload': step
                })

            elif msg_type == 'step:update':
                step_id = payload.get('id')
                for s in session['steps']:
                    if s['id'] == step_id:
                        s['text'] = payload.get('text', s['text'])
                        break
                await session_manager.broadcast(session_code, {
                    'type': 'step:updated',
                    'payload': payload
                })

            elif msg_type in ('step:approve', 'step:reject', 'step:complete'):
                step_id = payload.get('id')
                status_map = {
                    'step:approve': 'approved',
                    'step:reject': 'rejected',
                    'step:complete': 'completed'
                }
                new_status = status_map[msg_type]
                for s in session['steps']:
                    if s['id'] == step_id:
                        s['status'] = new_status
                        break
                await session_manager.broadcast(session_code, {
                    'type': msg_type.replace('step:', 'step:') + 'd' if not msg_type.endswith('e') else msg_type + 'd',
                    'payload': {'id': step_id, 'status': new_status}
                })

            elif msg_type == 'msg:send':
                message = {
                    'from': user_id,
                    'text': payload.get('text', ''),
                    'timestamp': datetime.datetime.utcnow().isoformat()
                }
                session['messages'].append(message)
                await session_manager.broadcast(session_code, {
                    'type': 'msg:received',
                    'payload': message
                })

    except WebSocketDisconnect:
        session_manager.remove_connection(session_code, websocket)
        # Notify remaining connections
        remaining_session = session_manager.get_session(session_code)
        if remaining_session:
            await session_manager.broadcast(session_code, {
                'type': 'user:left',
                'payload': {'userId': user_id}
            })
