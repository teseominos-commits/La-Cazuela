# Ideas pospuestas / backlog de fases futuras

Ideas propuestas y descartadas *por ahora* (no por malas, sino porque requieren
trabajo que no encaja en la fase actual). Revisar esta lista al empezar cada
fase nueva.

## Fase 3

### Badge "🔥 Popular" en los platos más vistos

**Idea:** mostrar un badge tipo "🔥 Popular" en los 2-3 platos más vistos de la
carta pública. Se apoya en que el propio comensal, al elegir qué mirar, ya
genera una señal de popularidad real ("la gente pide lo que ve que otros
piden").

**Por qué se pospuso:** se comprobó que el sistema de visitas actual **no
trackea vistas por plato**. Solo existen visitas agregadas por restaurante y
día:

- Tabla `visit_counts` (columnas `restaurant_id` / `day` / `count`).
- Alimentada por la función RPC `increment_visit`, que se dispara una única
  vez al cargar la carta completa (ver `src/pages/PublicMenu.tsx`).
- La tabla `dishes` (`src/types.ts`) no tiene ningún contador de vistas.

Por tanto, esto no es "activar un badge con datos que ya existen": es
construir un sistema de tracking nuevo desde cero (detectar cuándo un plato
entra en la vista del comensal —scroll / IntersectionObserver— o al menos
cuándo se despliega su categoría, y agregar esas vistas por plato sin
disparar una escritura a la base de datos por cada scroll).

**Decisiones pendientes cuando se retome:**

1. Qué cuenta como "vista" de un plato: ¿aparece en pantalla vs. el usuario
   interactúa con él?
2. Cómo agregar sin generar demasiado tráfico de escritura (batching en
   cliente, debounce, etc.).
3. Esquema de datos: ¿nueva tabla de vistas por plato, o columna de contador
   en `dishes` con upsert?
4. Umbral mínimo de vistas antes de mostrar el badge, para que no aparezca
   con datos poco significativos en restaurantes nuevos.
