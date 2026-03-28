# 🔬 Forensic Autopsy Assistant

Aplicación web de apoyo para prácticas de autopsia forense. Diseñada para **profesionales** y **estudiantes** de medicina forense.

---

## 🚀 Cómo ejecutar

1. Asegúrate de tener **Python 3.10+** instalado.
2. Navega a la carpeta del proyecto.
3. Inicia el backend con: 
   ```bash
   python -m uvicorn backend.main:app --port 3000 --reload
   ```
4. Abre **http://localhost:3000** en Chrome o Edge.
5. Regístrate o usa las credenciales de dueño.

---

## 👤 Roles y credenciales

| Rol | Cómo registrarse | Permisos |
|---|---|---|
| **Dueño** | Email: `owner` / Contraseña: `owner2024` | Control total de la app |
| **Profesional** | Registro normal → espera aprobación del dueño | Edita base de conocimientos |
| **Estudiante** | Registro normal | Lectura + cuaderno privado |

> La contraseña del dueño se puede cambiar en `config.js`.

---

## 🗂️ Superpoderes del Sistema

### 📷 Captura & Anotación Avanzada (Fase 1)
- **Anotación Espacial**: Haz clic en cualquier parte de la captura para añadir marcadores visuales.
- **Multi-Notas por Captura**: Cada hallazgo puede tener múltiples notas (voz o manual).
- **Sugerencias Técnicas**: Acceso rápido a términos médicos-legales (Equimosis, Laceración).
- **Galería Persistente**: Las capturas se guardan en el servidor vinculadas a tu cuenta.

### 📊 Analíticas Forenses (Fase 2)
- **Estadísticas Dinámicas**: Visualización de métricas de sesión mediante gráficos CSS premium (Dona, Barras, Timeline).
- **Dashboard de Control**: Resumen inmediato de actividad del sistema para administradores.

### 📋 Colaboración Real-time (Fase 3)
- **Sesiones en Vivo**: Creación de códigos de sesión `SES-XXXX` para sincronización multi-usuario.
- **Workflow Supervisor-Operador**: Los pasos del procedimiento se aprueban o rechazan en tiempo real.
- **Chat de Instrucciones**: Comunicación directa dentro de la sesión de autopsia.

### 🎙️ Control por Voz Contextual
- El asistente inteligente detecta si estás editando una captura para asociar las notas dictadas automáticamente a esa imagen.
- Comando principal: **"Anótalo, Mario Hugo"**.

---

## 📁 Estructura del proyecto

```
Antigravity/
├── index.html              ← Login / Registro
├── app.html                ← Aplicación principal
├── config.js               ← Configuración del dueño
├── knowledge_base.json     ← Base de conocimientos (datos semilla)
├── implementation_plan.txt ← Plan de implementación (texto plano)
├── README.md               ← Este archivo
├── modules/
│   ├── auth.js             ← Autenticación y roles
│   ├── camera.js           ← Cámara + overlay de incisión
│   ├── voice.js            ← Reconocimiento de voz
│   ├── procedure.js        ← Procedimientos guiados
│   ├── knowledge.js        ← Base de conocimientos
│   └── notebook.js         ← Cuaderno privado
└── styles/
    └── main.css            ← Estilos
```

---

## ⚙️ Tecnologías

- **Backend**: Python + FastAPI (REST API & WebSockets).
- **Base de Datos**: SQLite con SQLAlchemy ORM.
- **Frontend**: Vanilla JS moderno, HTML5 Semántico, Tailwind CSS.
- **Visualización**: Estadísticas 100% CSS (sin librerías pesadas).
- **IA & APIs**: 
  - MediaPipe (Pose estimation para guías).
  - Web Speech API (Dictado y Comandos).
  - Canvas API (Overlay forense).
  - Persistent User Context (Database-backed sessions).

---

## 🛠️ Ingeniería de Requerimientos

### 1. Requerimientos Funcionales (RF)
- **RF-01: Autenticación de Roles.** El sistema debe permitir el acceso diferenciado para Dueño, Profesional y Estudiante.
- **RF-02: Asistencia Visual.** El sistema debe superponer una guía de incisión en Y sobre el feed de la cámara.
- **RF-03: Comandos de Voz.** Soporte para captura de fotos, registro de hallazgos y lectura de procedimientos vía voz.
- **RF-04: Análisis de Imagen.** Integración de un script de Python para el post-procesamiento de capturas forenses.

### 2. Requerimientos No Funcionales (RNF)
- **RNF-01: Privacidad Estudiantil.** El cuaderno de notas debe ser estrictamente privado por usuario (localStorage).
- **RNF-02: UI Moderna.** Uso de **Tailwind CSS** para una interfaz limpia, responsiva y profesional.
- **RNF-03: Disponibilidad Offline-first.** Funcionamiento basado en tecnologías de navegador y almacenamiento local.

---

## 🚀 Hoja de Ruta (Próximas Mejoras)

1. **Análisis de Imagen con IA Forense**: Implementación de modelos de visión para detección automática de lesiones y órganos.
2. **Generador de Reportes PDF**: Exportación automática de actas de autopsia con fotos y anotaciones.
3. **Módulo de Toxicología**: Registro especializado de muestras y cadenas de custodia.

---

## 🤖 Asistencia de Inteligencia Artificial

Este proyecto fue desarrollado con el apoyo de **Antigravity**, una IA de programación avanzada creada por el equipo de Google DeepMind.
A lo largo del desarrollo, la inteligencia artificial asistió activamente en la modernización de la arquitectura (migrando desde Vanilla JS hacia un robusto backend con FastAPI), en la creación de una interfaz dinámica y accesible, y en la integración de funcionalidades complejas como el asistente de voz y la gestión local de bases de conocimiento. Esto aceleró significativamente el flujo de trabajo y garantizó un código limpio, permitiendo que la visión del proyecto cobrara vida de manera eficiente. ✨
