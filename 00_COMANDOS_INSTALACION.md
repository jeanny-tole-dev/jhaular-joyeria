# Paso 2 — Instala las dependencias

Corre esto dentro de la carpeta `jhaular-store`:

```bash
# Cliente Supabase
npm install @supabase/supabase-js

# Routing
npm install react-router-dom

# Data fetching / cache
npm install @tanstack/react-query

# Estado global (carrito + laboratorio)
npm install zustand

# Formularios + validación
npm install react-hook-form zod @hookform/resolvers

# Gráficas del admin (proyección de ventas)
npm install recharts

# Tailwind CSS v4 — se integra como plugin de Vite, ya NO se usa
# tailwind.config.js ni postcss.config.js
npm install -D tailwindcss @tailwindcss/vite
```

⚠️ Si ya instalaste `postcss` y `autoprefixer` por error (guía vieja), no pasa
nada, simplemente no se usan — puedes dejarlos o desinstalarlos con
`npm uninstall postcss autoprefixer`.

# Paso 3 — Copia estos archivos

Copia el contenido de este paquete dentro de tu proyecto `jhaular-store`,
respetando las rutas (sobrescribe `tailwind.config.ts`, `vite.config.ts`,
`tsconfig.json`, `src/index.css`, y agrega las carpetas `src/lib`,
`src/store`, `src/types`, `src/pages`, `src/components`, `api/`).

# Paso 4 — Variables de entorno

Crea un archivo `.env.local` en la raíz (basado en `.env.example` que te dejo
en este paquete) con tus keys reales de Supabase. Nunca subas `.env.local`
a git — ya viene en el `.gitignore` de Vite por defecto.

# Paso 5 — Genera los tipos de tu base de datos

Con la Supabase CLI instalada (`npm install -g supabase`), corre:

```bash
supabase login
supabase gen types typescript --project-id TU_PROJECT_ID > src/types/database.types.ts
```

Tu `PROJECT_ID` lo ves en la URL del dashboard de Supabase
(`supabase.com/dashboard/project/TU_PROJECT_ID`).

# Paso 6 — Corre el proyecto

```bash
npm run dev
```

Se abre en `http://localhost:5173`.
