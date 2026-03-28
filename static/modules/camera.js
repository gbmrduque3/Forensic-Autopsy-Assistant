// ============================================================
//  FORENSIC AUTOPSY ASSISTANT – Camera Module
// ============================================================

const Camera = (() => {
    let stream = null;
    let videoEl = null;
    let canvasEl = null;
    let ctx = null;
    let animFrame = null;
    let capturedImg = null;
    let overlayActive = true;

    let pose = null;
    let poseLandmarks = null;
    let isProcessing = false;

    // Y-incision path definition (fallback normalized 0-1 coordinates)
    const Y_LINES = [
        // Left arm of Y: left shoulder → center chest
        { x1: 0.20, y1: 0.15, x2: 0.50, y2: 0.40 },
        // Right arm of Y: right shoulder → center chest
        { x1: 0.80, y1: 0.15, x2: 0.50, y2: 0.40 },
        // Vertical stem: center chest → pubis
        { x1: 0.50, y1: 0.40, x2: 0.50, y2: 0.90 },
    ];

    let dashOffset = 0;

    function init(videoId, canvasId) {
        videoEl = document.getElementById(videoId);
        canvasEl = document.getElementById(canvasId);
        ctx = canvasEl.getContext('2d');

        // Initialize MediaPipe Pose
        if (window.Pose) {
            pose = new window.Pose({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
                }
            });
            pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                smoothSegmentation: false,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            pose.onResults((results) => {
                poseLandmarks = results.poseLandmarks;
            });
        }
    }

    async function getDevices() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return [];
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(d => d.kind === 'videoinput');
    }

    async function start(deviceId = null) {
        try {
            const constraints = { 
                video: deviceId ? { deviceId: { exact: deviceId } } : true, 
                audio: false 
            };
            stop(); // Always stop previous stream first
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            videoEl.srcObject = stream;
            videoEl.play();
            videoEl.onloadedmetadata = () => {
                canvasEl.width = videoEl.videoWidth;
                canvasEl.height = videoEl.videoHeight;
                drawLoop();
            };
            return { ok: true };
        } catch (e) {
            return { ok: false, error: 'No se pudo acceder a la cámara: ' + e.message };
        }
    }

    function stop() {
        if (stream) stream.getTracks().forEach(t => t.stop());
        if (animFrame) cancelAnimationFrame(animFrame);
        stream = null;
        if (ctx) ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    }

    function drawLoop() {
        if (!stream) return;
        ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
        
        if (pose && videoEl.readyState >= 2 && !isProcessing) {
            isProcessing = true;
            pose.send({ image: videoEl }).finally(() => { isProcessing = false; });
        }

        if (poseLandmarks && window.drawConnectors) {
            ctx.save();
            ctx.globalAlpha = 0.35;
            window.drawConnectors(ctx, poseLandmarks, window.POSE_CONNECTIONS, { color: '#ffffff', lineWidth: 2 });
            window.drawLandmarks(ctx, poseLandmarks, { color: '#00c8ff', lineWidth: 1, radius: 2 });
            ctx.restore();
        }

        if (overlayActive) {
            if (poseLandmarks) drawDynamicYIncision(poseLandmarks);
            else drawYIncision();
        }
        
        dashOffset = (dashOffset + 0.5) % 20;
        pulseScale = 1 + Math.sin(Date.now() / 300) * 0.2;
        animFrame = requestAnimationFrame(drawLoop);
    }

    let pulseScale = 1;

    function drawYIncision() {
        const w = canvasEl.width;
        const h = canvasEl.height;

        ctx.save();

        // Glow shadow
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10 * pulseScale;

        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -dashOffset;
        ctx.lineWidth = 2 * pulseScale;
        ctx.strokeStyle = '#06b6d4';
        ctx.lineCap = 'round';

        for (const line of Y_LINES) {
            ctx.beginPath();
            ctx.moveTo(line.x1 * w, line.y1 * h);
            ctx.lineTo(line.x2 * w, line.y2 * h);
            ctx.stroke();
        }

        // Label
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);
        ctx.font = '600 13px Inter, sans-serif';
        ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
        ctx.fillText('✦ Guía de Incisión (Estática)', 16, h - 20);

        ctx.restore();
    }

    function drawDynamicYIncision(landmarks) {
        // Landmarks: 11 (Left Shoulder), 12 (Right Shoulder)
        // 23 (Left Hip), 24 (Right Hip)
        const ls = landmarks[11];
        const rs = landmarks[12];
        const lh = landmarks[23];
        const rh = landmarks[24];

        if (!ls || !rs || !lh || !rh) return drawYIncision();

        const midShoulderX = (ls.x + rs.x) / 2;
        const midShoulderY = (ls.y + rs.y) / 2;
        const midHipX = (lh.x + rh.x) / 2;
        const midHipY = (lh.y + rh.y) / 2;

        // Chest point (~30% down from shoulders)
        const chestX = midShoulderX + (midHipX - midShoulderX) * 0.3;
        const chestY = midShoulderY + (midHipY - midShoulderY) * 0.3;

        const w = canvasEl.width;
        const h = canvasEl.height;

        const dynamicLines = [
            { x1: ls.x, y1: ls.y, x2: chestX, y2: chestY },
            { x1: rs.x, y1: rs.y, x2: chestX, y2: chestY },
            { x1: chestX, y1: chestY, x2: midHipX, y2: midHipY },
        ];

        ctx.save();
        ctx.shadowColor = '#14b8a6';
        ctx.shadowBlur = 12 * pulseScale;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -dashOffset;
        ctx.lineWidth = 3 * pulseScale;
        ctx.strokeStyle = '#14b8a6'; 
        ctx.lineCap = 'round';

        for (const line of dynamicLines) {
            ctx.beginPath();
            ctx.moveTo(line.x1 * w, line.y1 * h);
            ctx.lineTo(line.x2 * w, line.y2 * h);
            ctx.stroke();
        }

        ctx.shadowBlur = 0;
        ctx.setLineDash([]);
        ctx.font = '600 13px Inter, sans-serif';
        ctx.fillStyle = 'rgba(20, 184, 166, 0.9)';
        ctx.fillText('✦ Guía de Incisión (IA Dinámica)', 16, h - 20);
        ctx.restore();
    }

    function capture() {
        // Return current canvas content without freezing the live feed
        return canvasEl.toDataURL('image/png');
    }

    function toggleOverlay(show) {
        overlayActive = show;
    }

    return { init, start, stop, capture, toggleOverlay, getDevices };
})();

window.Camera = Camera;
