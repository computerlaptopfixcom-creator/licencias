# 🔐 Sistema de Gestión de Licencias (Micro-Service)

Panel de administración profesional diseñado para la gestión integral de inventarios de licencias de software (Windows, Office, Server, etc.). Incluye roles de usuario, notificaciones en tiempo real, catálogo dinámico y una interfaz ultra-moderna optimizada para móviles y escritorio.

---

## ✨ Características Principales

### 👤 Administración (Panel de Control)
- **Gestión de Usuarios**: Creación de cuentas personalizadas con nombre de usuario y contraseña (Bcrypt).
- **Inventario Inteligente**:
  - Filtros por estado: **Disponibles**, **Surtido (Asignadas)** y **Reportadas**.
  - Carga masiva de llaves con detección automática de duplicados.
  - Indicadores visuales (⚠️) para reportes de llaves defectuosas.
- **Catálogo Dinámico (CRUD)**: Gestión total de productos, categorías y precios desde la interfaz.
- **Asignación por Lote**: Suministro rápido de múltiples llaves a usuarios con un solo clic.
- **Ver Llaves de Usuario**: Historial detallado de todas las licencias entregadas a cada usuario.

### 👥 Portal del Usuario (Dashboard)
- **Resumen Visual**: Contador de llaves totales, asignadas y disponibles por reclamar.
- **Revelado de Keys**: Las llaves permanecen ocultas (`•••••`) hasta que el usuario decide revelarlas.
- **Reporte de Fallos**: Botón directo para marcar llaves defectuosas, notificando al admin al instante.
- **Solicitud de Licencias**: Formulario integrado para pedir stock adicional detallando producto y cantidad.

### 🔔 Notificaciones y UX
- **Alertas en Tiempo Real**: Sistema de "campanita" para avisar sobre nuevas asignaciones y reportes.
- **Diseño Glassmorphism**: Interfaz premium con desenfoques, gradientes y animaciones fluidas (Framer Motion).
- **Responsive 100%**: UI optimizada para celulares y tablets con menús colapsables y tablas con scroll lateral.

---

## 🚀 Despliegue Rápido (EasyPanel / Docker)

Este proyecto está listo para ser desplegado en VPS con **EasyPanel** o cualquier entorno Docker.

### Opción 1: EasyPanel (Recomendado)
1. Crea un nuevo **Service** en EasyPanel.
2. Conecta tu repositorio de GitHub.
3. EasyPanel detectará el `Dockerfile` automáticamente.
4. Configura el **puerto** como `3000`.
5. Dale **Deploy**.

### Opción 2: Docker Manual
```bash
docker build -t licencias-panel .
docker run -d -p 3000:3000 -v ./data:/app/src/data --name licencias_app licencias-panel
```
> **Nota de Persistencia:** El volumen `-v ./data:/app/src/data` es **obligatorio** para que la base de datos no se borre al reiniciar el contenedor.

---

## 🔑 Credenciales por Defecto

| Rol | Usuario | Contraseña | Nota |
|-----|---------|------------|------|
| Admin | `hielo` | `admin123` | **Cambio obligatorio al primer login** |

---

## 🛡️ Seguridad y Tecnología

### Onboarding de Seguridad
El sistema incluye un flujo de **configuración obligatoria** para el administrador inicial. Al iniciar sesión por primera vez:
1. Se debe elegir un **nombre de usuario personalizado**.
2. Se debe configurar una **contraseña segura** validada por un medidor de fuerza en tiempo real.
3. El acceso al panel está bloqueado hasta completar este proceso.

### Protección OWASP
- **Anti-XSS**: Sanitización de HTML en notificaciones internas y nombres de usuario.
- **JWT httpOnly**: Tokens de autenticación almacenados en cookies seguras.
- **IDOR Prevention**: Los endpoints de reveal/report usan el userId del token JWT.
- **Bcryptjs**: Contraseñas hasheadas con 10 rondas de salting.
- **Role Enforcement**: El rol de usuario siempre se fuerza a 'user' en el backend.

### SEO Dinámico (Marca Blanca)
- Metadatos **OpenGraph** y **Twitter Cards** generados dinámicamente desde la configuración de marca.
- Keywords y `theme-color` personalizados por instancia.
- `robots: noindex` por defecto (panel privado).

### Stack Tecnológico
- **Frontend/Backend**: Next.js 16 (Turbopack)
- **Base de Datos**: Local JSON Engine (Portabilidad extrema)
- **Estilos**: TailwindCSS 4 + Lucide Icons
- **Animaciones**: Framer Motion

---

## 💻 Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Inicializar DB (si no existe)
cp src/data/database.template.json src/data/database.json

# 3. Correr desarrollo
npm run dev
```

El servidor se iniciará en `http://localhost:3000`.

---
*Desarrollado con ❤️ para Computer Laptop Fix.*
