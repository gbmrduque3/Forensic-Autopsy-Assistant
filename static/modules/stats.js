// ============================================================
//  FORENSIC AUTOPSY ASSISTANT – Statistics Module
// ============================================================

const Stats = (() => {

    // ── Session Metrics ───────────────────────────────────────

    function calculateSessionStats(captures, notes) {
        const totalCaptures = captures.length;
        const voiceNotes = notes.filter(n => n.source === 'voice' || n.source === 'Voz').length;
        const manualNotes = notes.filter(n => n.source === 'manual').length;
        const captureNotes = notes.filter(n => n.source === 'capture').length;
        const totalNotes = notes.length;

        // categories
        const catMap = {};
        notes.forEach(n => {
            const cat = n.category || 'General';
            catMap[cat] = (catMap[cat] || 0) + 1;
        });

        // time active
        let timeActive = '—';
        if (notes.length >= 2) {
            const timestamps = notes.map(n => new Date(n.timestamp).getTime()).filter(t => !isNaN(t));
            if (timestamps.length >= 2) {
                const minT = Math.min(...timestamps);
                const maxT = Math.max(...timestamps);
                const diffMs = maxT - minT;
                const mins = Math.floor(diffMs / 60000);
                const hrs = Math.floor(mins / 60);
                timeActive = hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`;
            }
        }

        return { totalCaptures, voiceNotes, manualNotes, captureNotes, totalNotes, categories: catMap, timeActive };
    }

    // ── Analytical Metrics ────────────────────────────────────

    function calculateAnalytics(notes, captures) {
        // Top terms (words > 4 chars, frequency)
        const wordMap = {};
        const stopWords = new Set(['para', 'como', 'este', 'esta', 'estos', 'estas', 'tiene', 'desde', 'donde', 'cuando', 'sobre', 'entre', 'antes', 'después', 'siendo', 'parte', 'puede', 'todos', 'hacia', 'según']);
        notes.forEach(n => {
            const words = (n.text || '').toLowerCase().replace(/[^a-záéíóúñü\s]/g, '').split(/\s+/);
            words.forEach(w => {
                if (w.length > 4 && !stopWords.has(w)) {
                    wordMap[w] = (wordMap[w] || 0) + 1;
                }
            });
        });
        const topTerms = Object.entries(wordMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word, count]) => ({ word, count }));

        // Expert tags distribution (from capture annotations)
        const tagMap = {};
        captures.forEach(c => {
            (c.annotations || []).forEach(a => {
                if (a.label) tagMap[a.label] = (tagMap[a.label] || 0) + 1;
            });
        });
        const tagDistribution = Object.entries(tagMap)
            .sort((a, b) => b[1] - a[1])
            .map(([tag, count]) => ({ tag, count }));

        // Recent activity timeline (last 10)
        const allEvents = [];
        notes.forEach(n => {
            allEvents.push({
                type: n.source === 'voice' || n.source === 'Voz' ? 'voice' : 'note',
                text: (n.text || '').substring(0, 40),
                timestamp: n.timestamp,
                icon: n.source === 'voice' || n.source === 'Voz' ? '🎙️' : '✏️'
            });
        });
        captures.forEach(c => {
            allEvents.push({
                type: 'capture',
                text: 'Captura fotográfica',
                timestamp: c.timestamp,
                icon: '📷'
            });
        });
        allEvents.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        const timeline = allEvents.slice(0, 10);

        // Finding types (from capture note text, simple heuristic)
        const findingKeywords = {
            'Equimosis': 0, 'Laceración': 0, 'Excoriación': 0,
            'Fractura': 0, 'Herida': 0, 'Contusión': 0,
            'Tatuaje': 0, 'Orificio': 0, 'Otros': 0
        };
        captures.forEach(c => {
            (c.notes || []).forEach(n => {
                const txt = (n.text || '').toLowerCase();
                let matched = false;
                for (const kw of Object.keys(findingKeywords)) {
                    if (kw !== 'Otros' && txt.includes(kw.toLowerCase())) {
                        findingKeywords[kw]++;
                        matched = true;
                    }
                }
                if (!matched && txt.length > 0) findingKeywords['Otros']++;
            });
        });
        // Remove zeros
        const findingTypes = Object.entries(findingKeywords)
            .filter(([, v]) => v > 0)
            .map(([type, count]) => ({ type, count }));

        return { topTerms, tagDistribution, timeline, findingTypes };
    }

    // ── Render Functions ──────────────────────────────────────

    function renderDonutChart(container, data) {
        if (!data.length) {
            container.innerHTML = '<div class="stat-empty">Sin datos</div>';
            return;
        }
        const total = data.reduce((s, d) => s + d.count, 0);
        const colors = ['#06b6d4', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#10b981', '#6366f1', '#f97316'];
        let gradientParts = [];
        let offset = 0;
        data.forEach((d, i) => {
            const pct = (d.count / total) * 100;
            const color = colors[i % colors.length];
            gradientParts.push(`${color} ${offset}% ${offset + pct}%`);
            offset += pct;
        });

        let html = `<div class="donut-chart" style="background: conic-gradient(${gradientParts.join(', ')})"></div>`;
        html += '<div class="donut-legend">';
        data.forEach((d, i) => {
            const pct = Math.round((d.count / total) * 100);
            html += `<div class="legend-item"><span class="legend-dot" style="background:${colors[i % colors.length]}"></span>${d.type} <span class="legend-pct">${pct}%</span></div>`;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    function renderBarChart(container, data, labelKey = 'tag', valueKey = 'count') {
        if (!data.length) {
            container.innerHTML = '<div class="stat-empty">Sin datos</div>';
            return;
        }
        const max = Math.max(...data.map(d => d[valueKey]));
        let html = '';
        data.forEach(d => {
            const pct = (d[valueKey] / max) * 100;
            html += `<div class="bar-row">
                <span class="bar-label">${d[labelKey]}</span>
                <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
                <span class="bar-value">${d[valueKey]}</span>
            </div>`;
        });
        container.innerHTML = html;
    }

    function renderTimeline(container, events) {
        if (!events.length) {
            container.innerHTML = '<div class="stat-empty">Sin actividad reciente</div>';
            return;
        }
        let html = '<div class="timeline">';
        events.forEach(e => {
            const time = new Date(e.timestamp);
            const timeStr = isNaN(time.getTime()) ? '' : time.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
            html += `<div class="timeline-item">
                <div class="timeline-icon">${e.icon}</div>
                <div class="timeline-content">
                    <div class="timeline-text">${e.text}</div>
                    <div class="timeline-time">${timeStr}</div>
                </div>
            </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    function renderStats(containerId, captures, notes) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const session = calculateSessionStats(captures, notes);
        const analytics = calculateAnalytics(notes, captures);

        container.innerHTML = `
            <div class="stats-section">
                <h3 class="stats-section-title">📈 Métricas de Sesión</h3>
                <div class="stats-metrics-grid">
                    <div class="stat-card">
                        <div class="stat-number">${session.totalCaptures}</div>
                        <div class="stat-label">📷 Capturas</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${session.totalNotes}</div>
                        <div class="stat-label">📝 Notas Total</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${session.timeActive}</div>
                        <div class="stat-label">⏱️ Tiempo Activo</div>
                    </div>
                </div>
                <div class="stats-ratio">
                    <span class="ratio-label">Voz vs Manual</span>
                    <div class="ratio-bar">
                        <div class="ratio-fill ratio-voice" style="width:${session.totalNotes ? (session.voiceNotes / session.totalNotes * 100) : 0}%"></div>
                    </div>
                    <span class="ratio-numbers">🎙️ ${session.voiceNotes} / ✏️ ${session.manualNotes}</span>
                </div>
                <div class="stats-categories" id="stats-categories"></div>
            </div>

            <div class="stats-section">
                <h3 class="stats-section-title">🔬 Analíticas del Caso</h3>
                <div class="stats-analytics-grid">
                    <div>
                        <h4 class="stats-sub-title">Tipos de Hallazgo</h4>
                        <div id="stats-donut"></div>
                    </div>
                    <div>
                        <h4 class="stats-sub-title">Tags Más Usados</h4>
                        <div id="stats-tags"></div>
                    </div>
                </div>
                <div class="stats-analytics-grid" style="margin-top: 20px;">
                    <div>
                        <h4 class="stats-sub-title">Top Términos</h4>
                        <div id="stats-terms"></div>
                    </div>
                    <div>
                        <h4 class="stats-sub-title">Actividad Reciente</h4>
                        <div id="stats-timeline"></div>
                    </div>
                </div>
            </div>
        `;

        // Render sub-components
        const catData = Object.entries(session.categories).map(([type, count]) => ({ type, count }));
        const catContainer = document.getElementById('stats-categories');
        if (catData.length && catContainer) {
            renderBarChart(catContainer, catData, 'type', 'count');
        }

        renderDonutChart(document.getElementById('stats-donut'), analytics.findingTypes);
        renderBarChart(document.getElementById('stats-tags'), analytics.tagDistribution);
        renderBarChart(document.getElementById('stats-terms'), analytics.topTerms, 'word', 'count');
        renderTimeline(document.getElementById('stats-timeline'), analytics.timeline);
    }

    return { calculateSessionStats, calculateAnalytics, renderStats };
})();

window.Stats = Stats;
