// ============================================================
//  FORENSIC AUTOPSY ASSISTANT – Real-time WebSocket Module
// ============================================================

const Realtime = (() => {
    let ws = null;
    let sessionCode = null;
    let userId = null;
    let userRole = null;
    let handlers = {};
    let reconnectAttempts = 0;
    const MAX_RECONNECT = 5;
    let onConnectionChange = null;

    function connect(code, uid, role, onConnChange) {
        sessionCode = code;
        userId = uid;
        userRole = role;
        onConnectionChange = onConnChange;
        reconnectAttempts = 0;
        _connect();
    }

    function _connect() {
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const url = `${protocol}//${location.host}/ws/procedure/${sessionCode}?userId=${userId}&role=${userRole}`;

        ws = new WebSocket(url);

        ws.onopen = () => {
            reconnectAttempts = 0;
            if (onConnectionChange) onConnectionChange('connected');
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                const type = msg.type;
                if (handlers[type]) {
                    handlers[type].forEach(cb => cb(msg.payload, msg));
                }
                // Also fire a generic handler
                if (handlers['*']) {
                    handlers['*'].forEach(cb => cb(msg));
                }
            } catch (e) {
                console.error('[Realtime] Parse error:', e);
            }
        };

        ws.onclose = () => {
            if (onConnectionChange) onConnectionChange('disconnected');
            // Auto-reconnect
            if (reconnectAttempts < MAX_RECONNECT && sessionCode) {
                reconnectAttempts++;
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
                if (onConnectionChange) onConnectionChange('reconnecting');
                setTimeout(() => _connect(), delay);
            }
        };

        ws.onerror = (e) => {
            console.error('[Realtime] WebSocket error:', e);
        };
    }

    function disconnect() {
        sessionCode = null;
        if (ws) {
            ws.close();
            ws = null;
        }
        if (onConnectionChange) onConnectionChange('disconnected');
    }

    function send(type, payload) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type, payload, userId }));
        }
    }

    function on(type, callback) {
        if (!handlers[type]) handlers[type] = [];
        handlers[type].push(callback);
    }

    function off(type) {
        delete handlers[type];
    }

    function clearHandlers() {
        handlers = {};
    }

    function isConnected() {
        return ws && ws.readyState === WebSocket.OPEN;
    }

    // ── Session Management (REST) ─────────────────────────────

    async function createSession(supervisorId) {
        try {
            const res = await fetch('/api/procedure/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: supervisorId })
            });
            if (res.ok) return await res.json();
        } catch (e) { console.error('[Realtime] Create session error:', e); }
        return null;
    }

    async function getSession(code) {
        try {
            const res = await fetch(`/api/procedure/session/${code}`);
            if (res.ok) return await res.json();
        } catch (e) { console.error('[Realtime] Get session error:', e); }
        return null;
    }

    return { connect, disconnect, send, on, off, clearHandlers, isConnected, createSession, getSession };
})();

window.Realtime = Realtime;
