# Configuración de Supabase

Este documento describe la configuración y uso de Supabase en la aplicación.

## Estructura

```
utils/supabase/
├── client.ts    # Cliente para el navegador
├── middleware.ts # Middleware para autenticación
└── server.ts    # Cliente para el servidor
```

## Clientes

### Cliente del Servidor (`server.ts`)

- Usado en Server Components y Server Actions
- Maneja cookies automáticamente
- Configuración:
  ```typescript
  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
  ```

### Cliente del Navegador (`client.ts`)

- Usado en Client Components
- Configuración más simple
- No maneja cookies directamente

## Variables de Entorno

Requiere las siguientes variables en `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## Tablas Requeridas

### `embarcaciones`
- `id`: number (generado)
- `nombre`: string
- `matricula`: string

### `personas`
- `id`: number (generado)
- `nombre`: string
- `apellido`: string
- `rol`: string

### `campanias`
- `id`: number (generado)
- `nombre`: string
- `responsable_id`: number (FK a personas)
- `observaciones`: string (opcional)
- `inicio`: string (fecha)
- `fin`: string (fecha, opcional)

### `segmentos`
- `id`: number (generado)
- `transect_id`: number (FK a transectas)
- `coordenadas_fin`: string (WKT POINT)
- `profundidad_final`: number
- `sustrato_id`: number (FK a sustratos)
- `conteo`: number

### `sustratos`
- `id`: number (generado)
- `codigo`: string
- `descripcion`: string

## Políticas de Seguridad

Se recomienda configurar las siguientes políticas en Supabase:

1. Solo usuarios autenticados pueden:
   - Insertar registros
   - Actualizar registros
   - Eliminar registros

2. Lectura pública para:
   - `sustratos`

3. RLS (Row Level Security) para:
   - Campañas: Solo ver/editar las propias
   - Segmentos: Solo ver/editar los de sus campañas

## Tipos TypeScript

Para generar los tipos:

```bash
npx supabase gen types typescript --project-id tu-project-id > lib/types/database.ts
```

Actualizar los tipos cada vez que se modifica el esquema de la base de datos. 