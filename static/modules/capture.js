// ============================================================
//  FORENSIC AUTOPSY ASSISTANT – Capture Management Module
// ============================================================

const CaptureManager = (() => {
    let _captures = [];

    // ── Captures CRUD ─────────────────────────────────────────

    async function saveCapture(userId, imageData) {
        try {
            const res = await fetch('/api/captures', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, imageData })
            });
            if (!res.ok) return null;
            const cap = await res.json();
            _captures.unshift(cap);
            return cap;
        } catch (e) {
            console.error('[Capture] Error saving:', e);
            return null;
        }
    }

    async function fetchCaptures(userId) {
        try {
            const res = await fetch(`/api/captures/${userId}`);
            if (res.ok) {
                _captures = await res.json();
                // Sort newest first
                _captures.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
            }
        } catch (e) { console.error('[Capture] Error fetching:', e); }
        return _captures;
    }

    function getCaptures() {
        return _captures;
    }

    function getCaptureById(id) {
        return _captures.find(c => c.id === id) || null;
    }

    async function deleteCapture(captureId) {
        try {
            const res = await fetch(`/api/captures/${captureId}`, { method: 'DELETE' });
            if (res.ok) {
                _captures = _captures.filter(c => c.id !== captureId);
                return true;
            }
        } catch (e) { console.error('[Capture] Error deleting:', e); }
        return false;
    }

    // ── Capture Notes CRUD ────────────────────────────────────

    async function addNote(captureId, userId, text, source = 'manual') {
        try {
            const res = await fetch(`/api/captures/${captureId}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, text, source })
            });
            if (!res.ok) return null;
            const note = await res.json();
            // Add to local cache
            const cap = getCaptureById(captureId);
            if (cap) {
                if (!cap.notes) cap.notes = [];
                cap.notes.push(note);
            }
            return note;
        } catch (e) {
            console.error('[Capture] Error adding note:', e);
            return null;
        }
    }

    async function fetchNotes(captureId) {
        try {
            const res = await fetch(`/api/captures/${captureId}/notes`);
            if (res.ok) {
                const notes = await res.json();
                const cap = getCaptureById(captureId);
                if (cap) cap.notes = notes;
                return notes;
            }
        } catch (e) { console.error('[Capture] Error fetching notes:', e); }
        return [];
    }

    async function updateNote(noteId, userId, text) {
        try {
            const res = await fetch(`/api/captures/notes/${noteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, text })
            });
            if (!res.ok) return false;
            const updated = await res.json();
            // Update local cache
            for (const cap of _captures) {
                if (!cap.notes) continue;
                const idx = cap.notes.findIndex(n => n.id === noteId);
                if (idx !== -1) { cap.notes[idx] = updated; break; }
            }
            return true;
        } catch (e) { return false; }
    }

    async function deleteNote(noteId) {
        try {
            const res = await fetch(`/api/captures/notes/${noteId}`, { method: 'DELETE' });
            if (res.ok) {
                for (const cap of _captures) {
                    if (!cap.notes) continue;
                    cap.notes = cap.notes.filter(n => n.id !== noteId);
                }
                return true;
            }
        } catch (e) { }
        return false;
    }

    // ── Annotations CRUD ──────────────────────────────────────

    async function addAnnotation(captureId, x, y, label = '') {
        try {
            const res = await fetch(`/api/captures/${captureId}/annotations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x, y, label })
            });
            if (!res.ok) return null;
            const ann = await res.json();
            const cap = getCaptureById(captureId);
            if (cap) {
                if (!cap.annotations) cap.annotations = [];
                cap.annotations.push(ann);
            }
            return ann;
        } catch (e) {
            console.error('[Capture] Error adding annotation:', e);
            return null;
        }
    }

    async function deleteAnnotation(annId) {
        try {
            const res = await fetch(`/api/captures/annotations/${annId}`, { method: 'DELETE' });
            if (res.ok) {
                for (const cap of _captures) {
                    if (!cap.annotations) continue;
                    cap.annotations = cap.annotations.filter(a => a.id !== annId);
                }
                return true;
            }
        } catch (e) { }
        return false;
    }

    // ── Settings ──────────────────────────────────────────────

    async function getSettings(userId) {
        try {
            const res = await fetch(`/api/settings/${userId}`);
            if (res.ok) return await res.json();
        } catch (e) { console.error('[Settings] Error:', e); }
        return null;
    }

    async function saveSettings(userId, settings) {
        try {
            const res = await fetch(`/api/settings/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) return await res.json();
        } catch (e) { console.error('[Settings] Error:', e); }
        return null;
    }

    return {
        saveCapture, fetchCaptures, getCaptures, getCaptureById, deleteCapture,
        addNote, fetchNotes, updateNote, deleteNote,
        addAnnotation, deleteAnnotation,
        getSettings, saveSettings,
    };
})();

window.CaptureManager = CaptureManager;
