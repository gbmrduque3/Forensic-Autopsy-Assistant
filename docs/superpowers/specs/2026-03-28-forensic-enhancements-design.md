# Forensic Autopsy Assistant — Mejoras del Registro Forense

## Resumen

Ampliación del sistema de registro forense en 3 fases: (1) captura con selección de cámara y notas múltiples, (2) cuaderno mejorado con estadísticas, y (3) procedimientos colaborativos en tiempo real vía WebSocket.

---

## Fase 1: Selección de Cámara + Notas Múltiples por Captura

### Selección de Cámara

La cámara se puede elegir desde **dos ubicaciones**:

- **Panel de Ajustes** — Dropdown con cámaras detectadas + botón "Refrescar". La selección se persiste como `defaultCameraId` en una tabla `UserSettings` del backend.
- **Módulo de Cámara** — Dropdown visible sobre el video para cambio rápido (no se persiste, solo afecta la sesión actual).

Al abrir el módulo de cámara, se carga la cámara guardada en ajustes como valor predeterminado; si no hay preferencia, se usa la primera disponible.

### Capturas Persistentes

Las capturas actualmente viven solo en memoria del frontend. Se migran al backend:

- Nuevo modelo `Capture`: `id`, `userId` (FK), `imageData` (base64), `timestamp`.
- API: `POST /api/captures`, `GET /api/captures/{user_id}`, `DELETE /api/captures/{capture_id}`.
- Al capturar, la imagen se envía al backend y se almacena en SQLite.

### Notas Múltiples por Captura

Cada captura puede tener N notas independientes, cada una con:

- `id`, `captureId` (FK), `userId` (FK), `text`, `source` ("voice" | "manual"), `timestamp`.
- API: `POST /api/captures/{id}/notes`, `GET /api/captures/{id}/notes`, `PUT /api/captures/notes/{id}`, `DELETE /api/captures/notes/{id}`.

### Marcadores Espaciales (Annotations)

Los marcadores sobre la imagen se persisten:

- `id`, `captureId` (FK), `x` (Float, %), `y` (Float, %), `label` (String).
- API: `POST /api/captures/{id}/annotations`, `DELETE /api/captures/annotations/{id}`.

### Ajustes del Usuario

Nueva tabla `UserSettings`:

- `id`, `userId` (FK, unique), `defaultCameraId` (nullable), `voiceStart`, `voiceStop`.
- API: `GET /api/settings/{user_id}`, `PUT /api/settings/{user_id}`.

### Modal de Anotación Rediseñado

- **Izquierda:** Imagen con capa de marcadores (ya existe, se mantiene).
- **Derecha superior:** Lista scrollable de notas de esta captura. Cada nota muestra texto truncado, timestamp, ícono de fuente (🎙️ voz / ✏️ manual).
- **Derecha inferior:** Formulario nueva nota (textarea + botón "Dictar" para activar voz contextual + tags de sugerencia del experto).

### Voz Contextual

Cuando el modal de anotación está abierto y el usuario dicta, se crea una nueva `CaptureNote` de tipo `"voice"` asociada a esa captura, en lugar de ir al cuaderno general.

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `backend/models.py` | Nuevos modelos: `Capture`, `CaptureNote`, `CaptureAnnotation`, `UserSettings` |
| `backend/schemas.py` | Nuevos schemas Pydantic para los modelos |
| `backend/main.py` | Nuevos endpoints CRUD para capturas, notas, annotations, settings |
| `static/modules/camera.js` | Método `saveCapture()`, carga de cámara por defecto |
| `static/modules/voice.js` | Modo contextual: detecta si modal abierto para rutear la nota |
| **[NEW]** `static/modules/capture.js` | Módulo CRUD de capturas y notas vía API |
| `templates/app.html` | Modal rediseñado, panel de ajustes con sección cámara |

---

## Fase 2: Cuaderno Mejorado con Estadísticas

### Pestañas Internas del Cuaderno

El panel del cuaderno se divide en dos sub-pestañas:

#### "📝 Apuntes"

- **Barra superior:** Filtro por categoría (dropdown) + botón "Nueva Nota" + buscador de texto.
- **Lista izquierda:** Notas con preview del texto, timestamp, badge de fuente (🎙️/✏️/📷), categoría como tag de color.
- **Editor derecho:** Textarea editable con nota seleccionada + botón guardar/eliminar.
- Organización por **categorías** (no por caso/autopsia).

#### "📊 Estadísticas"

**Métricas de sesión (panel superior):**

| Métrica | Visual |
|---|---|
| Total de capturas | Número grande con ícono |
| Notas por voz vs manual | Barra de proporción (%) |
| Hallazgos por categoría | Mini barras horizontales |
| Tiempo total activo | Contador basado en primer/último timestamp |

**Analíticas del caso (panel inferior):**

| Métrica | Visual |
|---|---|
| Distribución de tipos de hallazgo | Gráfico de dona (CSS puro, gradiente cónico) |
| Top 5 términos más usados | Lista con frecuencia |
| Actividad reciente | Timeline vertical (últimas 10 acciones) |
| Tags experto más aplicados | Barras horizontales ordenadas |

### Implementación técnica

- Gráficos 100% CSS puro (sin librerías externas): gradientes cónicos para donas, flexbox para barras.
- Datos calculados en frontend a partir de notas y capturas cargadas.

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `static/modules/notebook.js` | Filtros, búsqueda, badges de fuente |
| **[NEW]** `static/modules/stats.js` | Cálculo de métricas + renderizado gráficos CSS |
| `templates/app.html` | Panel cuaderno rediseñado con pestañas |
| `static/styles/main.css` | Estilos para gráficos CSS |

---

## Fase 3: Procedimientos Colaborativos en Tiempo Real (WebSocket)

### Concepto

Un profesional/owner (supervisor) crea una sesión de procedimiento. Un operador (cualquier rol) se une con un código. Ambos ven cambios en vivo a través de WebSocket.

### Flujo

1. **Supervisor** → Crear Sesión → genera código `SES-XXXX`.
2. **Operador** → Ingresar código → se conecta a la sesión.
3. Supervisor escribe/modifica pasos, aprueba/rechaza.
4. Operador ve todo en vivo, marca pasos como completados.

### Arquitectura

```
Operador  ←──WebSocket──→  FastAPI  ←──WebSocket──→  Supervisor
                              ↕
                   Sesiones en memoria (dict)
```

- Endpoint: `/ws/procedure/{session_code}`.
- Sesiones almacenadas en un `dict` en memoria del servidor (se pierden al reiniciar — son temporales por diseño).
- FastAPI soporta WebSocket nativo, no se requiere dependencia adicional.

### Estructura de Sesión (en memoria)

```json
{
  "code": "SES-A3F7",
  "supervisorId": "user-xxx",
  "operatorId": "user-yyy",
  "steps": [
    { "id": "s1", "text": "...", "status": "pending|completed|approved|rejected", "addedBy": "supervisor" }
  ],
  "messages": [
    { "from": "supervisor", "text": "...", "timestamp": "..." }
  ]
}
```

### Protocolo de Mensajes WebSocket

| Tipo | Dirección | Acción |
|---|---|---|
| `step:add` | Supervisor → Operador | Agregar nuevo paso |
| `step:update` | Ambos → Ambos | Modificar texto de paso |
| `step:approve` | Supervisor → Operador | Aprobar paso |
| `step:reject` | Supervisor → Operador | Rechazar paso |
| `step:complete` | Operador → Supervisor | Marcar paso como completado |
| `msg:send` | Ambos → Ambos | Instrucción rápida / mensaje |

### Restricción de Roles

- Solo `professional` y `owner` pueden **crear sesión** (supervisor).
- Cualquier rol puede **unirse** como operador.

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `backend/main.py` | Endpoint WebSocket + `SessionManager` class |
| **[NEW]** `static/modules/realtime.js` | Módulo WebSocket frontend |
| `static/modules/procedure.js` | Integración con `realtime.js` para modo en vivo |
| `templates/app.html` | UI procedimiento rediseñada: crear/unirse a sesión, panel de pasos en vivo, chat |

---

## Nuevos Archivos (Resumen)

| Archivo | Fase | Propósito |
|---|---|---|
| `static/modules/capture.js` | 1 | CRUD de capturas y notas vía API |
| `static/modules/stats.js` | 2 | Métricas y gráficos CSS del cuaderno |
| `static/modules/realtime.js` | 3 | WebSocket para procedimientos en vivo |

## Archivos Modificados (Resumen)

| Archivo | Fases |
|---|---|
| `backend/models.py` | 1 |
| `backend/schemas.py` | 1 |
| `backend/main.py` | 1, 3 |
| `static/modules/camera.js` | 1 |
| `static/modules/voice.js` | 1 |
| `static/modules/notebook.js` | 2 |
| `static/modules/procedure.js` | 3 |
| `static/styles/main.css` | 1, 2, 3 |
| `templates/app.html` | 1, 2, 3 |
