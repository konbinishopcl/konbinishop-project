# Konbini Listing

Plataforma de listado de eventos y anuncios construida con Nuxt 3, Strapi y Sentry para monitoreo de errores y performance.

## 🚀 Características

- **Frontend**: Nuxt 3 con Vue 3 y TypeScript
- **Backend**: Strapi CMS con API REST
- **Estado**: Pinia con persistencia en localStorage
- **Autenticación**: Sistema de login con Google OAuth
- **Monitoreo**: Sentry para errores, performance y Session Replay
- **Modo Desarrollo**: Sistema de autenticación para desarrollo
- **Responsive**: Diseño adaptativo para todos los dispositivos

## 📋 Tabla de Contenidos

- [Configuración](#configuración)
- [Desarrollo](#desarrollo)
- [Producción](#producción)
- [Modo Desarrollo](#modo-desarrollo)
- [Sentry - Monitoreo](#sentry---monitoreo)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Scripts Disponibles](#scripts-disponibles)

## ⚙️ Configuración

### Instalación de Dependencias

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# API Strapi
API_URL=http://localhost:1337

# Google Tag Manager
GTM_ID=GTM-XXXXXXXX

# Sentry
SENTRY_DSN=https://tu-dsn-de-sentry@sentry.io/project

# Modo Desarrollo (opcional)
DEV_MODE=false
DEV_USERNAME=konbinishop
DEV_PASSWORD=konbinishopdev

# Configuración de SEO
BLOCK_SEARCH_ENGINES=false
```

## 🛠️ Desarrollo

### Servidor de Desarrollo

Inicia el servidor de desarrollo en `http://localhost:4000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

### Comandos de Desarrollo

```bash
# Linting
yarn lint          # Verificar código
yarn lint:fix      # Corregir errores automáticamente

# Formateo
yarn format        # Formatear código con Prettier

# Preparar Husky
yarn prepare       # Configurar git hooks
```

## 🚀 Producción

### Construir la Aplicación

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

### Vista Previa de Producción

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

### Despliegue con PM2

```bash
# Construir y desplegar
yarn production

# Solo iniciar PM2
yarn start
```

## 🔐 Modo Desarrollo

### Configuración

Para activar el modo desarrollo, agrega las siguientes variables a tu archivo `.env`:

```bash
# Activar modo desarrollo
DEV_MODE=true

# Credenciales de acceso
DEV_USERNAME=konbinishop
DEV_PASSWORD=konbinishopdev
```

### Funcionamiento

1. **Activación**: Cuando `DEV_MODE=true`, el sitio requiere autenticación antes de mostrar cualquier página
2. **Redirección**: Los usuarios no autenticados son redirigidos a `/dev`
3. **Acceso de bots**: Google y otros bots pueden acceder normalmente sin restricciones
4. **Persistencia**: La autenticación se guarda en localStorage y persiste durante la sesión

### Rutas

- **`/dev`**: Página de login para modo desarrollo
- **`/`**: Página principal (requiere autenticación en modo desarrollo)

### Componentes

- **`FormDev.vue`**: Formulario de autenticación simple
- **`pages/dev/index.vue`**: Página de login

### Plugin

El plugin `plugins/dev-auth.client.ts` se ejecuta globalmente y:

- Verifica si está en modo desarrollo
- Detecta bots y les permite acceso
- Redirige usuarios no autenticados al login
- Solo se ejecuta en el cliente

### Desactivar

Para desactivar el modo desarrollo, simplemente cambia:

```bash
DEV_MODE=false
```

O elimina la variable del archivo `.env`.

## 📊 Sentry - Monitoreo

### Configuración Automática

Sentry se configura automáticamente para:

- ✅ Enviar información del usuario logueado
- ✅ Rastrear navegación entre páginas
- ✅ Capturar errores del cliente y servidor
- ✅ Monitorear performance de la aplicación
- ✅ Session Replay para debugging

### Uso Básico

#### 1. Capturar Errores

```typescript
import { useSentry } from '@/composables/useSentry'

const { captureException } = useSentry()

try {
  // Tu código aquí
} catch (error) {
  captureException(error, {
    component: 'MiComponente',
    action: 'submitForm',
    formData: {
      /* datos del formulario */
    },
  })
}
```

#### 2. Capturar Mensajes

```typescript
const { captureMessage } = useSentry()

// Mensaje informativo
captureMessage('Usuario completó el formulario', 'info')

// Mensaje de advertencia
captureMessage('Formulario incompleto', 'warning')

// Mensaje de error
captureMessage('Error de validación', 'error')
```

#### 3. Agregar Breadcrumbs

```typescript
const { addBreadcrumb } = useSentry()

addBreadcrumb({
  category: 'user_action',
  message: 'Usuario hizo clic en botón',
  level: 'info',
  data: {
    buttonId: 'submit-btn',
    timestamp: new Date().toISOString(),
  },
})
```

#### 4. Configurar Usuario Manualmente

```typescript
const { setUser } = useSentry()

// Cuando el usuario se loguea
setUser({
  id: user.id,
  email: user.email,
  username: user.username,
  firstname: user.firstname,
  lastname: user.lastname,
})

// Cuando el usuario se desloguea
setUser(null)
```

#### 5. Performance Monitoring

```typescript
const { startTransaction } = useSentry()

// Iniciar transacción para operaciones costosas
const transaction = startTransaction('fetchUserData', 'http.request')

try {
  const userData = await fetchUserData()
  transaction.setStatus('ok')
  return userData
} catch (error) {
  transaction.setStatus('error')
  throw error
} finally {
  transaction.finish()
}
```

### Ejemplos en Componentes Vue

#### Componente con Manejo de Errores

```vue
<template>
  <div>
    <button @click="handleSubmit">Enviar</button>
  </div>
</template>

<script setup>
import { useSentry } from '@/composables/useSentry'

const { captureException, addBreadcrumb } = useSentry()

const handleSubmit = async () => {
  try {
    addBreadcrumb({
      category: 'user_action',
      message: 'Usuario hizo clic en botón enviar',
      level: 'info',
    })

    await submitForm()
  } catch (error) {
    captureException(error, {
      component: 'FormComponent',
      action: 'submit',
      formData: form.value,
    })
  }
}
</script>
```

#### Store con Sentry

```typescript
import { useSentry } from '@/composables/useSentry'

export const useMyStore = defineStore('my', () => {
  const { captureException, setTag } = useSentry()

  const fetchData = async () => {
    try {
      setTag('action', 'fetch_data')
      const response = await api.getData()
      return response
    } catch (error) {
      captureException(error, {
        store: 'myStore',
        action: 'fetchData',
      })
      throw error
    }
  }

  return { fetchData }
})
```

### Configuración de Entorno

#### Variables de Entorno

```bash
# .env
SENTRY_DSN=https://tu-dsn-de-sentry@sentry.io/project
NODE_ENV=production
```

#### Configuración por Entorno

- **Desarrollo**: 100% de traces, debug habilitado
- **Producción**: 10% de traces, debug deshabilitado
- **Session Replay**: 1% en producción, 10% en desarrollo

### Monitoreo en Sentry Dashboard

Una vez configurado, podrás ver en tu dashboard de Sentry:

1. **Errores**: Con contexto completo del usuario
2. **Performance**: Métricas de navegación y operaciones
3. **Session Replay**: Reproducción de sesiones con errores
4. **Usuarios**: Seguimiento por usuario específico
5. **Breadcrumbs**: Rastro de acciones del usuario

### Mejores Prácticas

1. **No enviar datos sensibles**: Usa `beforeSend` para filtrar
2. **Contexto útil**: Siempre incluye información relevante
3. **Performance**: Usa transacciones para operaciones costosas
4. **Breadcrumbs**: Agrega contexto de navegación
5. **Tags**: Usa tags para categorizar y filtrar

## 📁 Estructura del Proyecto

```
konbini-listing/
├── components/           # Componentes Vue reutilizables
├── composables/          # Composables de Vue (useSentry, useUser, etc.)
├── layouts/              # Layouts de la aplicación
├── middleware/           # Middleware de rutas
├── pages/                # Páginas de la aplicación
├── plugins/              # Plugins de Nuxt
├── server/               # API routes del servidor
├── stores/               # Stores de Pinia
├── types/                # Definiciones de TypeScript
├── assets/               # Assets estáticos (CSS, imágenes)
├── public/               # Archivos públicos
├── .nuxt/                # Archivos generados por Nuxt
├── nuxt.config.ts        # Configuración de Nuxt
├── sentry.client.config.ts # Configuración de Sentry cliente
├── sentry.server.config.ts # Configuración de Sentry servidor
└── package.json          # Dependencias y scripts
```

## 📜 Scripts Disponibles

```json
{
  "build": "nuxt build", // Construir para producción
  "dev": "nuxt dev", // Servidor de desarrollo
  "generate": "nuxt generate", // Generar sitio estático
  "preview": "nuxt preview", // Vista previa de producción
  "start": "pm2 start ecosystem.config.cjs", // Iniciar con PM2
  "production": "yarn build && yarn start", // Construir y desplegar
  "lint": "eslint .", // Verificar código
  "lint:fix": "eslint . --fix", // Corregir errores
  "format": "npx prettier --write .", // Formatear código
  "prepare": "husky install" // Configurar git hooks
}
```

## 🔗 Enlaces Útiles

- [Documentación de Nuxt](https://nuxt.com/docs/getting-started/introduction)
- [Documentación de Strapi](https://docs.strapi.io/)
- [Documentación de Sentry](https://docs.sentry.io/platforms/javascript/guides/nuxt/)
- [Documentación de Pinia](https://pinia.vuejs.org/)
- [Documentación de Vue 3](https://vuejs.org/)

## 📝 Licencia

Este proyecto es privado y pertenece a Konbini Shop.
