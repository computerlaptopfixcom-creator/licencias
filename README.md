# 🔐 Sistema de Gestión de Licencias

Panel de administración para gestionar inventario de licencias de software (Windows, Office, Server, etc.) con roles de usuario, notificaciones en tiempo real y catálogo dinámico de productos.

## 🚀 Despliegue Rápido (EasyPanel / Docker)

### Opción 1: EasyPanel (Recomendado)
1. Crea un nuevo **Service** en EasyPanel.
2. Conecta tu repositorio de GitHub.
3. EasyPanel detectará el `Dockerfile` automáticamente.
4. Configura el **puerto** como `3000`.
5. Dale **Deploy** y listo.

### Opción 2: Docker Manual
```bash
docker build -t licencias-panel .
docker run -p 3000:3000 -v ./data:/app/src/data licencias-panel
```

> **Nota:** El volumen `-v ./data:/app/src/data` es **crítico** para persistir la base de datos entre reinicios del container.

## 🔑 Credenciales por Defecto

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Admin | `admin` | `admin123` |

> ⚠️ **Cambia la contraseña del admin inmediatamente** desde Ajustes > Seguridad y Cuenta.

## 💻 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Copiar base de datos limpia (solo la primera vez)
cp src/data/database.template.json src/data/database.json

# Ejecutar en modo desarrollo
npm run dev
```

El servidor se iniciará en `http://localhost:3000`.

## 📁 Estructura Importante

```
src/
├── app/
│   ├── api/          # Rutas de API (auth, licenses, catalog, etc.)
│   └── page.tsx      # Frontend completo (Single Page App)
├── data/
│   ├── database.template.json  # Base de datos limpia (se sube a Git)
│   └── database.json           # Base de datos real (NO se sube a Git)
└── lib/
    └── db.ts         # Lógica de base de datos y CRUD
```

## 🛡️ Seguridad
- Contraseñas almacenadas con **bcrypt** (hash de 10 rondas).
- Migración automática de contraseñas en texto plano a hash en el primer login.
- `database.json` excluido de Git por `.gitignore`.
- Sesiones persistentes con `localStorage`.

## 📦 Stack
- **Next.js 16** (Turbopack)
- **React 19**
- **TailwindCSS 4**
- **Framer Motion**
- **bcryptjs**
