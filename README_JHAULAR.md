# Paquete de arranque — Jhaular Store

Este paquete NO es un proyecto Vite corriendo (no tiene `node_modules` ni
`package.json` propio) — son los archivos que copias DENTRO del proyecto
que creas con `npm create vite@latest`. Sigue `00_COMANDOS_INSTALACION.md`
en orden.

## Qué incluye

```
tailwind.config.ts          → tokens del sistema "Ancestral Tech" (DESIGN.md)
vite.config.ts              → alias @/ apuntando a src/
tsconfig.paths.json         → qué agregar a tu tsconfig para que @/ funcione
.env.example                → plantilla de variables de entorno
src/
  index.css                 → fuentes (Libre Caslon Text, Hanken Grotesk) + base
  App.tsx                   → QueryClientProvider + RouterProvider
  router.tsx                → las 4 vistas + rutas del admin
  lib/supabase.ts           → cliente con anon key (seguro para el navegador)
  store/
    laboratorioStore.ts     → estado del diseño de manilla (Zustand + localStorage)
    carritoStore.ts         → estado del carrito (Zustand + localStorage)
  types/database.types.ts   → placeholder, reemplázalo con `supabase gen types`
  components/ProtectedRoute.tsx  → protege /admin verificando role=ADMIN
  pages/
    Bienvenida/              → landing (hero + CTAs)
    Catalogo/                → grid de productos públicos
    Laboratorio/              → editor de manillas (client-side)
    Admin/                    → login + layout + 5 subvistas (todas con TODO)
api/
  confirmar-pedido.ts        → Vercel Function con service_role key (ejemplo completo)
```

## Lo que ya funciona tal cual lo copies

- Rutas: `/`, `/catalogo`, `/laboratorio`, `/admin/login`, `/admin/*`
- Login de admin real contra Supabase Auth
- Protección de rutas admin (verifica `profiles.role === 'ADMIN'`)
- Catálogo leyendo productos reales de tu base de datos
- Laboratorio leyendo `materiales_catalogo` y permitiendo agregar componentes
- Un endpoint completo de backend (`confirmar-pedido`) que crea cliente + pedido + items
  y devuelve el link de WhatsApp — el flujo de checkout completo, listo para conectar
  a un botón "Confirmar pedido" en tu carrito

## Lo que falta que tú construyas (con mi ayuda cuando quieras)

- El diseño visual real de cada página (estos son esqueletos funcionales, no el
  diseño final — para eso usamos el Stitch export como referencia)
- El canvas visual del laboratorio (representación gráfica de la manilla, no solo la lista)
- Las 5 vistas del admin (dashboard con widgets, tabla de inventario, lista de ventas,
  gráfica de proyección con Recharts, módulo de contabilidad/gastos)
- `crear-proyecto.ts` (la función gemela de `confirmar-pedido.ts` pero para cuando el
  cliente confirma un diseño del laboratorio en vez de un producto del catálogo)

## Deploy en Vercel

1. Sube el proyecto a un repo de GitHub.
2. En Vercel → Import Project → selecciona el repo.
3. En Environment Variables agrega las 4 del `.env.example` (las `VITE_*` Y las
   `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` sin prefijo `VITE_`, para que
   `/api/*` las pueda usar sin exponerlas al navegador).
4. Deploy. Vercel detecta Vite automáticamente y las funciones en `/api` quedan
   activas solas.
