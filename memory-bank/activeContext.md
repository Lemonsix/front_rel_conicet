# Contexto Activo

## Enfoque de Trabajo Actual
- Implementación del sistema de gestión de campañas de relevamiento de mariscos bivalvos
- Desarrollo de interfaces para la carga y visualización de datos geoespaciales
- Integración con Supabase para almacenamiento y autenticación
- Optimización de consultas de base de datos para mejorar rendimiento
- **NUEVA PRIORIDAD**: Optimización de componentes React para prevenir errores de hidratación
- **CRÍTICO**: Manejo robusto de formatos de fecha/hora desde base de datos

## Cambios Recientes
- Configuración inicial del proyecto con Next.js 15.2.4
- Implementación de la estructura básica de autenticación
- Creación de rutas principales para gestión de campañas, embarcaciones y personas
- Integración de componentes Shadcn/UI para la interfaz de usuario
- **OPTIMIZACIÓN CRÍTICA**: Refactorización de `getCampaniaByIdAction` para eliminar problema N+1
  - Creación de función RPC `get_first_last_segments_by_transectas` usando window functions
  - Reducción de consultas múltiples secuenciales a 3 consultas optimizadas
  - Implementación de fallback para compatibilidad con versiones anteriores
  - **CORRECCIÓN**: Renombrado de columna `position` a `segment_position` (palabra reservada SQL)
- **OPTIMIZACIÓN FRONTEND**: Refactorización completa de `CampaniaView` componente
  - Eliminación de problemas de hidratación servidor/cliente
  - Implementación de `useCallback` y `useMemo` para optimización de rendimiento
  - Carga paralela de datos iniciales con `Promise.all`
  - Gestión mejorada de estado con inicializadores estables
  - Tipado estricto para pestañas con `TabValue`
- **MANEJO ROBUSTO DE FECHAS**: Implementación de utilidades datetime
  - Creación de `lib/utils/datetime.ts` con funciones seguras de parsing
  - Manejo de timestamps ISO 8601 (`2017-06-28T16:48:00`) sin fallos
  - Actualización de mappers y componentes para usar parsing robusto
  - Fallbacks graceful para formatos inválidos o datos faltantes
  - Funciones: `safeGetTime()`, `safeGetDate()`, `formatTimeFromISO()`, etc.

## Próximos Pasos
- ✅ Aplicar la migración SQL `optimize_campanias_query.sql` en el entorno de producción
- ✅ Monitorear el rendimiento de la consulta optimizada
- ✅ Implementar manejo robusto de fechas ISO 8601
- Completar funcionalidades CRUD para campañas, transectas y segmentos
- Mejorar la visualización geoespacial con Leaflet
- Implementar validaciones de formularios para datos de relevamiento
- Desarrollar flujos de trabajo para carga de datos en campo
- Añadir capacidades de exportación de datos

## Decisiones y Consideraciones Activas
- **Estrategia de Optimización**: Preferir consultas optimizadas con RPC sobre múltiples consultas secuenciales
- **Patrón de Componentes React**: 
  - Usar `useCallback` para funciones que se pasan como props
  - Usar `useMemo` para cálculos costosos y datos derivados
  - Inicializar estado con funciones para evitar recálculos en re-renders
  - Implementar carga lazy para pestañas y datos no críticos
  - Usar `Promise.all` para operaciones paralelas
- **Manejo de Fechas/Horas**:
  - Siempre usar funciones de `lib/utils/datetime.ts` para parsing
  - Implementar fallbacks graceful para datos malformados
  - Mostrar mensajes informativos cuando los datos no están disponibles
  - Manejar múltiples formatos de entrada (ISO 8601, solo fecha, solo hora)
- Optimización de la interfaz para uso en dispositivos de campo
- Manejo de datos geoespaciales entre diferentes formatos (sexagesimal, decimal, WKT)
- Estrategias para sincronización de datos con conectividad limitada
- Balance entre simplicidad de uso y completitud funcional
- Validación de datos según estándares científicos 