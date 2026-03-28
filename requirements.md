# Software Requirements Document (SRD)

## Forensic Autopsy Assistant

------------------------------------------------------------------------

## 1. Nombre del Programa

**Forensic Autopsy Assistant**

------------------------------------------------------------------------

## 2. Descripción General

**Forensic Autopsy Assistant** es una aplicación web diseñada para
apoyar prácticas de autopsia forense, proporcionando herramientas
visuales, comandos de voz y un sistema de registro de hallazgos.

La plataforma está orientada a **profesionales y estudiantes de medicina
forense**, permitiendo documentar, guiar y registrar procedimientos
durante una autopsia.

### Funcionalidades principales

-   Seguir **procedimientos guiados de autopsia**
-   Utilizar **comandos de voz manos libres**
-   **Capturar fotografías forenses**
-   Consultar una **base de conocimientos**
-   Registrar **notas privadas durante la práctica**

------------------------------------------------------------------------

# 3. Alcance del Sistema

El sistema funcionará como una **aplicación web progresiva (PWA)**
accesible desde:

-   Navegadores de escritorio
-   Teléfonos móviles
-   Tablets

Debe ofrecer una experiencia **responsiva**, optimizada para uso en
entornos profesionales y educativos.

------------------------------------------------------------------------

# 4. Arquitectura del Sistema

El sistema se divide en tres capas principales:

### Backend

Responsable de:

-   Gestión de API REST y WebSockets
-   Autenticación de usuarios persistente
-   Almacenamiento de datos (SQLite/SQLAlchemy)
-   Procesamiento de imágenes y metadatos
-   Gestión de registros forenses y sesiones en vivo

### Frontend

Responsable de:

-   Interfaz de usuario
-   Interacciones en tiempo real
-   Control por voz
-   Manejo de cámara

### Inteligencia Artificial y APIs del navegador

Responsable de:

-   Reconocimiento corporal
-   Comandos de voz
-   Lectura automática de pasos

------------------------------------------------------------------------

# 5. Módulos del Sistema

## 5.1 Backend (Python)

El backend se encargará de la lógica del sistema y gestión de datos.

### Funciones

-   API REST
-   Gestión de usuarios
-   Almacenamiento de autopsias
-   Procesamiento de imágenes
-   Integración con IA

### Tecnologías

-   Python 3.10+
-   FastAPI (REST & WebSockets)
-   SQLite
-   SQLAlchemy (ORM)
-   Jinja2 (Templating)
-   Pydantic (Schemas)
-   UUID (Gestión de identificadores únicos)

------------------------------------------------------------------------

## 5.2 Frontend (JavaScript)

Encargado de la experiencia del usuario.

### Módulos principales

**Autenticación** - Registro - Inicio de sesión - Control de sesiones

**Cámara Forense Avanzada** - Captura de fotografías - Guías de incisión mediante IA - Anotación espacial de hallazgos (marcadores)

**Control por Voz Contextual** - Reconocimiento de comandos - Navegación sin contacto - Dictado de notas directo a capturas

**Cuaderno & Analíticas** - Registro de observaciones persistente - Estadísticas dinámicas con CSS puro - Buscador avanzado

### Tecnologías

-   JavaScript Vanilla
-   HTML5
-   CSS3
-   Tailwind CSS
-   LocalStorage

------------------------------------------------------------------------

## 5.3 Interfaz de Usuario

Pantallas principales:

1.  **Index**
    -   Inicio de sesión
    -   Registro
2.  **Dashboard**
    -   Resumen de autopsias
    -   Acceso a herramientas
3.  **App de Trabajo**
    -   Procedimiento guiado
    -   Cámara
    -   Notas privadas
    -   Control por voz

### Diseño

-   Tema oscuro profesional
-   Estilo moderno
-   Glassmorphism
-   Responsive

------------------------------------------------------------------------

# 6. Inteligencia Artificial y APIs del Navegador

### MediaPipe Pose

Permite:

-   Detectar puntos de referencia corporales
-   Dibujar guías de incisión
-   Asistir visualmente en procedimientos

### Web Speech API

Permite:

-   Reconocimiento de voz
-   Ejecución de comandos
-   Lectura de pasos mediante TTS

------------------------------------------------------------------------

# 7. Requerimientos Funcionales

RF1 [DOC] --- El sistema debe permitir registro de usuarios con roles definidos.

RF2 [DOC] --- El sistema debe permitir inicio de sesión seguro y persistente.

RF3 [DOC] --- El usuario podrá crear registros de autopsia y capturas vinculadas.

RF4 [DOC] --- El sistema permitirá capturar fotografías y gestionarlas en una galería.

RF5 [OK] --- El sistema mostrará guías visuales de incisión.

RF6 [DOC] --- El sistema reconocerá comandos de voz para manos libres.

RF7 [DOC] --- El sistema permitirá guardar notas privadas y notas vinculadas a capturas.

RF8 [DOC] --- El sistema permitirá consultar una base de conocimiento compartida.

RF9 [DOC] --- El sistema funcionará en dispositivos móviles y escritorio (Responsive).

RF10 [NUEVO] --- El sistema debe permitir colaboración en tiempo real entre Supervisor y Operador vía WebSockets.

RF11 [NUEVO] --- El sistema debe generar visualizaciones de datos (Estadísticas) basadas en los hallazgos registrados.

------------------------------------------------------------------------

# 8. Requerimientos No Funcionales

### Rendimiento

-   La aplicación debe responder en menos de **2 segundos** en
    operaciones normales.

### Seguridad

-   Autenticación de usuarios
-   Protección de datos sensibles

### Usabilidad

-   Interfaz intuitiva
-   Compatible con pantallas táctiles

### Portabilidad

-   Compatible con:
    -   Chrome
    -   Edge
    -   Firefox
    -   Navegadores móviles

------------------------------------------------------------------------

# 9. Frameworks Sugeridos

### Backend

Se recomienda:

**FastAPI**

Ventajas:

-   Alto rendimiento
-   Documentación automática
-   Integración fácil con Python
-   Ideal para APIs modernas

Alternativa:

-   Django + Django Rest Framework

------------------------------------------------------------------------

### Frontend

Se recomienda:

**Vue.js**

Ventajas:

-   Ligero
-   Fácil de integrar
-   Excelente para aplicaciones interactivas

Alternativas:

-   React
-   Svelte

------------------------------------------------------------------------

# 10. Base de Datos Recomendada

### Opción inicial

**SQLite**

Ventajas:

-   Ligera
-   Fácil de integrar
-   Ideal para prototipos o aplicaciones locales

### Opción escalable

**PostgreSQL**

Ventajas:

-   Alta seguridad
-   Escalable
-   Excelente rendimiento para aplicaciones profesionales

------------------------------------------------------------------------

# 11. Hoja de Ruta e Implementaciones Futuras

-   **IA Forense Avanzada**: Integración de visión artificial para detección automática de órganos y medición de heridas.
-   **Protocolos Globales**: Implementación de estándares internacionales (Minnesota, Virchow) mediante módulos de procedimiento específicos.
-   **Exportación de Reportes**: Generación de informes médico-legales en PDF integrando capturas, notas y mapas de anotaciones.
-   **Seguridad Biométrica**: Integración de reconocimiento facial o huella para acceso rápido en entornos estériles.

------------------------------------------------------------------------

# 12. Conclusión

Forensic Autopsy Assistant busca modernizar el proceso de documentación
y aprendizaje en autopsias forenses mediante el uso de tecnologías web
modernas, inteligencia artificial y herramientas de interacción manos
libres.
