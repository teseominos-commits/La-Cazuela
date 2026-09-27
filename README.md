# La Cazuela — Plataforma de carta digital

Plataforma multi-cliente de carta digital para restaurantes. Los comensales
acceden escaneando un código QR desde la mesa; cada restaurante gestiona su
propio menú desde un panel privado, y el vendedor administra todos los
clientes desde un panel propio.

Fase 1 del proyecto (ver la especificación completa en el documento del
proyecto). Fases 2 y 3 (inglés automático, pagos, WhatsApp) quedan fuera de
este alcance.

## Stack

- React + Vite + TypeScript + Tailwind CSS
- Supabase (base de datos, autenticación por enlace mágico, almacenamiento de fotos)
- React Router

## Rutas

- `/` — landing simple
- `/:slug` — carta pública de un restaurante (ej. `/la-cazuela`)
- `/panel` — panel del dueño del restaurante (login por enlace mágico)
- `/admin` — panel del vendedor (alta de clientes, temas de color, pausar/reactivar)

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # rellena con tus credenciales de Supabase
npm run dev
```

## Variables de entorno

Ver `.env.example`. Se obtienen desde el panel de Supabase del proyecto
(`Project Settings → API`).

## Base de datos

El esquema (restaurantes, categorías, platos, menú del día, alérgenos,
visitas, administradores) vive como migraciones en el proyecto de Supabase
asociado. Row Level Security activado en todas las tablas: cada dueño solo
accede a los datos de su propio restaurante; el vendedor tiene acceso total.
