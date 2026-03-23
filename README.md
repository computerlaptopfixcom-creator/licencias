# 🔐 Sistema de Gestión de Licencias (Micro-Service)

Panel de administración profesional diseñado para la gestión integral de inventarios de licencias de software (Windows, Office, Server, etc.). Incluye roles de usuario, notificaciones en tiempo real, catálogo dinámico y una interfaz ultra-moderna (Dark Mode Inmersivo) optimizada para móviles y escritorio.

---

## ✨ Características Principales

### 👤 Administración (Panel de Control)
- **Instalación Fresca Segura**: Al iniciar la aplicación por primera vez (sin base de datos base), un asistente interactivo forzará la creación del primer Administrador (Nombre y Contraseña segura), evitando el uso inseguro de credenciales "por defecto".
- **Inventario Inteligente**:
  - Filtros por estado: **Disponibles**, **Surtido (Asignadas)** y **Reportadas**.
  - Carga masiva de llaves con detección automática de duplicados.
  - **Reemplazo Automático (1-Click)**: Opción para reabastecer licencias fallidas de inmediato tomando stock disponible, todo con un solo botón.
- **Catálogo Dinámico (CRUD)**: Gestión total de productos, categorías y precios desde la interfaz, incluyendo la selección de **Íconos Vectoriales Nativos** (Lucide React) para personalizar la apariencia de cada producto.
- **Asignación por Lote**: Suministro rápido de múltiples llaves a usuarios con un solo clic.
- **Gestión de Descargas**: Espacio para colgar enlaces ISO, configurado para proteger las rutas cruzadas (CORS) y agilizar la provisión de binarios pesados.

### 👥 Portal del Usuario (Dashboard)
- **Diseño Ultra-Premium UI/UX**: Formularios integrados (*inline*), paletas Dark Mode de alto contraste, menús selectores adaptados (sin brillos o áreas blancas) y animaciones fluidas potenciadas por Framer Motion.
- **Revelado de Keys**: Las llaves permanecen ocultas (`•••••`) hasta que el usuario decide revelarlas.
- **Reporte de Fallos**: Botón directo para marcar llaves defectuosas, notificando al admin al instante para proceder con el reemplazo auto-asistido.
- **Solicitud de Licencias**: Formulario integrado para pedir stock adicional detallando producto y cantidad.

---

## 🚀 Despliegue Rápido (EasyPanel / Docker)

Este proyecto emplea tecnología **SQLite embebida** (`better-sqlite3`), garantizando máxima velocidad, integridad referencial y cero fricción en configuración de servidores externos de bases de datos.

### Opción 1: EasyPanel (Recomendado)
1. Crea un nuevo **Service** en EasyPanel.
2. Conecta tu repositorio de GitHub.
3. EasyPanel detectará el `Dockerfile` automáticamente.
4. Configura el **puerto** como `3000`.
5. Dale **Deploy**.

### Opción 2: Docker / VPS Manual
```bash
docker build -t licencias-panel .
docker run -d -p 3000:3000 -v ./data:/app/src/data --name licencias_app licencias-panel
```
> **Nota de Persistencia CRÍTICA:** El volumen `-v ./data:/app/src/data` es **obligatorio**. La base de datos SQLite (archivos `.sqlite`, `.sqlite-wal`, `.sqlite-shm`) reside dentro de esa carpeta. Si no declaras el volumen, perderás tus datos al reiniciar el contenedor.

---

## 🛡️ Seguridad y Tecnología

### Onboarding de Seguridad Integral
- La aplicación **no posee** credenciales en código duro. En su primera ejecución en limpio, el sistema bloquea todas las rutas y renderiza un asistente de **Primera Configuración** para forjar la cuenta Maestra.
- **Contraseñas**: Hasheadas y saltadas vía Bcryptjs.
- **Usuarios Administrados**: Al crear usuarios nuevos directamente desde el panel como administrador, se les concede acceso inmediato usando sus credenciales seguras (sin forzarlos a reiniciar su clave al entrar por primera vez).

### Stack Tecnológico
- **Frontend/Backend**: Next.js 16 (App Router + Turbopack)
- **Base de Datos Relacional**: SQLite vía `better-sqlite3` (Sustituyendo el antiguo motor JSON).
- **Estilos**: TailwindCSS 4 + Lucide Icons (Renderizado SVG dinámico y control total de Dark Mode)
- **Animaciones**: Framer Motion
- **Protección OWASP**: Anti-XSS, JWT httpOnly cookies, Prevención IDOR.

---

## 🤖 Bot de Telegram Interactivo

Integración total con la base de datos SQL para notificaciones y comandos interactivos:

| Comando | Descripción |
|---------|-------------|
| `/start` | Mensaje de bienvenida y lista de comandos |
| `/stock` | Inventario de llaves disponibles por producto |
| `/stats` | Estadísticas generales (usuarios, licencias, solicitudes) |
| `/requests` | Solicitudes pendientes |
| `/users` | Lista de usuarios registrados |

### Activación
1. Configura el **Bot Token** y **Chat ID** en Ajustes > Integración Telegram.
2. Haz clic en **🤖 Activar Bot Interactivo**.

---

## 💻 Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Correr desarrollo (SQLite auto-generará su schema en el primer arranque)
npm run dev
```

> **Aviso Local:** Ya **no** requieres copiar archivos de plantilla (JSON) ni realizar inyecciones manuales. Solo despliega la base de código y la arquitectura relacional se construirá de cero en tu `localhost:3000`.

---
*Desarrollado con ❤️ para Computer Laptop Fix.*
