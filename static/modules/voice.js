// ============================================================
//  FORENSIC AUTOPSY ASSISTANT – Voice Recognition Module
// ============================================================

const Voice = (() => {
    const ACTIVATION_PHRASE = 'anótalo mario hugo';
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

    let recognition = null;
    let listening = false;
    let onFinding = null;
    let onNote = null;
    let onCapture = null;
    let onNavigate = null;
    let onReadStep = null;
    let onStatus = null;
    let contextCaptureId = null; // When set, voice notes go to this capture

    // ── Pip sound via AudioContext ────────────────────────────
    function playPip(freq = 880, duration = 0.12) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (_) { }
    }

    // ── Text-to-Speech ────────────────────────────────────────
    function speak(text) {
        if (!window.speechSynthesis) return;
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'es-ES';
        window.speechSynthesis.speak(u);
    }

    let isDictatingNote = false;

    // ── Process transcript ────────────────────────────────────
    function process(transcript) {
        // Normalizar acentos y pasar a minúsculas
        const t = transcript.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .trim();

        // DEACTIVATE MIC (Basta Rogelio) - Should be checked first to stop dictation
        if (t.includes('basta rogelio')) {
            isDictatingNote = false;
            playPip(440); // Lower pitch to signal stopping
            stop();
            return;
        }

        // Activation phrase check to start dictating a note
        if (t.includes('anotalo mario hugo') || t.includes('anotalo') || t.includes('mario hugo')) {
            isDictatingNote = true;
            playPip();
            if (onStatus) onStatus('Escuchando nota...', 'active');
            return;
        }

        // FINDING
        if (t.startsWith('hallazgo:') || t.startsWith('hallazgo ')) {
            const finding = t.replace(/^hallazgo[:\s]+/, '').trim();
            playPip();
            if (onFinding) onFinding(finding);
            return;
        }

        // CAPTURE
        if (t.includes('capturar') || t.includes('fotografía') || t.includes('foto')) {
            if (onCapture) onCapture();
            return;
        }

        // NAVIGATION
        if (t.includes('siguiente paso') || t.includes('próximo paso')) {
            if (onNavigate) onNavigate('next');
            return;
        }
        if (t.includes('paso anterior') || t.includes('atrás')) {
            if (onNavigate) onNavigate('prev');
            return;
        }

        // READ STEP
        if (t.includes('leer paso') || t.includes('lee el paso') || t.includes('leer el paso')) {
            if (onReadStep) onReadStep();
            return;
        }

        // If dictating, everything else goes to the notebook
        if (isDictatingNote && t.length > 0) {
            playPip(660);
            if (onNote) onNote(transcript.trim()); // Use original case for the note
            return;
        }
    }

    // ── Init recognition ──────────────────────────────────────
    function init({ onFinding: f, onNote: n, onCapture: c, onNavigate: nav, onReadStep: r, onStatus: s }) {
        onFinding = f;
        onNote = n;
        onCapture = c;
        onNavigate = nav;
        onReadStep = r;
        onStatus = s;

        if (!SpeechRec) {
            if (onStatus) onStatus('Web Speech API no disponible en este navegador.', 'error');
            return;
        }

        recognition = new SpeechRec();
        recognition.lang = 'es-ES';
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (e) => {
            const transcript = e.results[e.results.length - 1][0].transcript;
            console.log('[Voice] Transcripción:', transcript);
            process(transcript);
        };

        recognition.onerror = (e) => {
            if (e.error !== 'no-speech') {
                if (onStatus) onStatus('Error de voz: ' + e.error, 'error');
            }
        };

        recognition.onend = () => {
            if (listening) {
                // Auto-restart for continuous listening
                try { recognition.start(); } catch (_) { }
            }
        };
    }

    function start() {
        if (!recognition) return;
        listening = true;
        try { recognition.start(); } catch (_) { }
        playPip();
        if (onStatus) onStatus('🎙️ Micrófono activo – Esperando comandos', 'active');
        const wave = document.getElementById('voice-wave');
        if (wave) wave.classList.remove('inactive');
    }

    function stop() {
        listening = false;
        if (recognition) try { recognition.stop(); } catch (_) { }
        if (onStatus) onStatus('Micrófono inactivo', 'idle');
        const wave = document.getElementById('voice-wave');
        if (wave) wave.classList.add('inactive');
    }

    function isListening() { return listening; }

    function setContextMode(captureId) {
        contextCaptureId = captureId;
    }

    function getContextCaptureId() {
        return contextCaptureId;
    }

    return { init, start, stop, isListening, speak, playPip, setContextMode, getContextCaptureId };
})();

window.Voice = Voice;
