# SIGELAB - Sistema Básico

Este es el sistema básico de SIGELAB (Sistema de Gestión de Laboratorios) copiado a una estructura de Node.js.

## Estructura del Proyecto

```
nodes/
├── backend/
│   ├── package.json
│   ├── server.js
│   └── config/
│       └── db.js
├── public/
│   ├── index.html
│   ├── login-admin.html
│   ├── admin-panel.html
│   ├── bitacora.html
│   ├── inventario.html
│   ├── css/
│   │   └── estilos.css
│   └── js/
│       ├── config.js
│       ├── app.js
│       ├── admin.js
│       ├── bitacora.js
│       └── login.js
└── README.md
```

## Instalación y Ejecución

1. Instalar dependencias:
   ```bash
   cd nodes/backend
   npm install
   ```

2. Configurar la base de datos PostgreSQL en `backend/config/db.js`

3. Ejecutar el servidor:
   ```bash
   npm start
   ```

4. Abrir el navegador en `http://localhost:3000`

## Funcionalidades Básicas

- **Registro de Bitácora**: Registro de accesos al laboratorio
- **Gestión de Inventario**: Control de equipos de cómputo
- **Panel Administrativo**: Dashboard con estadísticas y gestión
- **Gestión de Clases**: Administración de clases y maestros

## Tecnologías Utilizadas

- **Backend**: Node.js, Express.js, PostgreSQL
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Autenticación**: JWT
- **Base de Datos**: PostgreSQL

## Notas

Este es el sistema básico sin configuraciones de despliegue. Para producción, se requiere configuración adicional de variables de entorno y base de datos.