# Contexto Técnico

## Tecnologías utilizadas

### Frontend
- **Framework**: Next.js 15.2.4 con App Router
- **Lenguaje**: TypeScript 5.8.2
- **Estilado**: Tailwind CSS 4.0.17
- **Componentes UI**: Shadcn (basados en Radix UI)
- **Gestión de formularios**: React Hook Form 7.54.2 con Zod 3.24.2 para validación
- **Visualización geoespacial**: Leaflet 1.9.4 y React Leaflet 5.0.0
- **Package manager**: pnpm

### Backend
- **Supabase**: Plataforma para autenticación y base de datos
- **PostgreSQL**: Base de datos con soporte para PostGIS (datos geoespaciales)

## Configuración de desarrollo
- Desarrollo local con `pnpm dev --turbopack`
- ESLint para linting de código
- Soporte para React DevTools

## Arquitectura
- Aplicación Next.js con App Router
- Rutas organizadas en grupos:
  - `(auth)`: Rutas relacionadas con autenticación
  - `(main)`: Rutas principales de la aplicación, incluyendo:
    - `/campanias`: Gestión de campañas de relevamiento
    - `/embarcaciones`: Gestión de embarcaciones
    - `/personas`: Gestión de personas

## Restricciones técnicas
- Los componentes de Shadcn no pueden ser editados (regla definida en `.Cursorrules`)
- Las consultas a Supabase deben mapear manualmente campos específicos en lugar de usar `*`
- Los archivos en `/utils/supabase` no deben modificarse
- Nombres de campos y tablas en SQL deben seguir la convención de snake_case 