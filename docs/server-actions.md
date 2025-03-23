# Server Actions

Este documento describe los flujos de Server Actions implementados en la aplicación.

## Estructura

Las Server Actions están organizadas por entidad en la carpeta `lib/actions/`:

```
lib/actions/
├── campanias.ts
├── embarcaciones.ts
├── personas.ts
└── segmentos.ts
```

## Flujos Implementados

### Embarcaciones

- `createEmbarcacionAction`: Crea una nueva embarcación
  - Parámetros: `{ nombre: string, matricula: string }`
  - Revalida: `/embarcaciones`

- `getEmbarcacionesAction`: Obtiene todas las embarcaciones
  - Ordenadas por: ID ascendente

### Personas

- `createPersonaAction`: Crea una nueva persona
  - Parámetros: `{ nombre: string, apellido: string, rol: string }`
  - Revalida: `/personas`

- `getPersonasAction`: Obtiene todas las personas
  - Ordenadas por: ID ascendente

### Campañas

- `createCampaniaAction`: Crea una nueva campaña
  - Parámetros: 
    ```typescript
    {
      nombre: string;
      responsable_id: string;
      observaciones?: string;
      inicio: string;
    }
    ```
  - Revalida: `/campanias`

- `getCampaniasAction`: Obtiene todas las campañas
  - Incluye: 
    - Datos del responsable (id, nombre, apellido, rol)
    - Conteo de transectas

### Segmentos

- `createSegmentoAction`: Crea un nuevo segmento
  - Parámetros:
    ```typescript
    {
      transect_id: number;
      coordenadas_fin: string;
      profundidad_final: number;
      sustrato_id: number;
      conteo: number;
    }
    ```
  - Revalida: `/campanias`

- `getSustratosAction`: Obtiene todos los sustratos
  - Ordenados por: código

## Manejo de Errores

Todas las acciones siguen el mismo patrón de manejo de errores:

1. Retornan un objeto con la siguiente estructura:
   ```typescript
   { data?: T; error?: string }
   ```

2. Los errores de Supabase son capturados y devueltos como mensajes de error.

3. La UI muestra los errores usando el componente `toast` de Sonner.

## Revalidación de Datos

- Cada acción de creación revalida su ruta correspondiente usando `revalidatePath`
- Esto asegura que los datos mostrados estén siempre actualizados

## Seguridad

- Todas las acciones están marcadas con `"use server"`
- La lógica de base de datos solo se ejecuta en el servidor
- Se usa el cliente de Supabase del servidor para mejor seguridad 