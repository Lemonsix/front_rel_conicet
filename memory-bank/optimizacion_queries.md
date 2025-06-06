# Optimización de Consultas - Campañas por ID

## Problema Identificado

La función `getCampaniaByIdAction` tenía un grave problema de rendimiento conocido como **problema N+1**. Para cada transecta en una campaña, se ejecutaban 2 consultas adicionales para obtener el primer y último segmento, resultando en:

- 1 consulta para obtener la campaña principal
- N × 2 consultas para obtener segmentos (donde N = número de transectas)

**Ejemplo**: Una campaña con 20 transectas generaba 41 consultas a la base de datos.

## Solución Implementada

### 1. Refactorización de la Función
Se modificó `lib/actions/campanias.ts` para usar **3 consultas optimizadas** en lugar de múltiples consultas secuenciales:

1. **Consulta 1**: Datos básicos de la campaña y responsable
2. **Consulta 2**: Todas las transectas con sus datos relacionados
3. **Consulta 3**: Primer y último segmento de todas las transectas usando función RPC

### 2. Función RPC PostgreSQL
Se creó la función `get_first_last_segments_by_transectas` que utiliza **window functions** para obtener eficientemente el primer y último segmento de múltiples transectas en una sola consulta.

```sql
-- La función usa ROW_NUMBER() OVER (PARTITION BY ...) para identificar
-- el primer y último segmento de cada transecta ordenados por número
```

### 3. Fallback de Compatibilidad
Se mantuvo el código anterior como fallback en caso de que la función RPC no esté disponible, garantizando la funcionalidad del sistema.

## Archivos Modificados

- `lib/actions/campanias.ts` - Función principal optimizada
- `migrations/ddl.sql` - Función RPC agregada al schema principal
- `migrations/optimize_campanias_query.sql` - Migración independiente
- `memory-bank/activeContext.md` - Documentación del cambio

## Aplicación en Producción

### Paso 1: Aplicar Migración SQL
Ejecutar en la base de datos de Supabase:

```bash
# Conectar a tu base de datos y ejecutar:
psql -f migrations/optimize_campanias_query.sql
```

O desde el panel de Supabase:
1. Ir a SQL Editor
2. Copiar y ejecutar el contenido de `migrations/optimize_campanias_query.sql`

### Paso 2: Verificar Función RPC
Verificar que la función esté disponible en Supabase Dashboard:
- Edge Functions > Database Functions
- Buscar `get_first_last_segments_by_transectas`

### Paso 3: Monitorear Rendimiento
- Usar Supabase Dashboard para monitorear tiempo de consultas
- Comparar tiempos antes y después de la optimización
- La mejora esperada es de ~10-20x en campañas con muchas transectas

## Beneficios Esperados

- **Reducción drástica de tiempo de respuesta**: De segundos a milisegundos
- **Menor carga en la base de datos**: Menos conexiones concurrentes
- **Mejor experiencia de usuario**: Carga más rápida de datos de campaña
- **Escalabilidad mejorada**: El sistema maneja mejor campañas con muchas transectas

## Notas Técnicas

- La función RPC está marcada como `STABLE` para permitir optimizaciones del query planner
- Se mantiene compatibilidad con versiones anteriores mediante fallback
- La función acepta arrays de enteros para procesar múltiples transectas
- Se utilizan window functions para máxima eficiencia en PostgreSQL

## Patrón Aplicable

Este patrón de optimización puede aplicarse a otras consultas similares en el sistema:
- Cualquier consulta que haga bucles con múltiples sub-consultas
- Relaciones donde se necesita obtener el "primer" o "último" elemento
- Consultas que pueden beneficiarse de window functions

**Regla**: Siempre preferir una consulta compleja sobre múltiples consultas simples cuando el rendimiento es crítico. 