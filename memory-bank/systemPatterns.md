# Patrones del Sistema

## Arquitectura del Sistema

### Estructura de Capas
- **Presentación**: Componentes React que forman la interfaz de usuario
- **Lógica de Aplicación**: Hooks y servicios que gestionan el estado y la lógica
- **Acceso a Datos**: Cliente de Supabase para interactuar con la base de datos

### Patrones de Diseño
- **Arquitectura basada en componentes**: Uso extensivo de componentes reutilizables y composables
- **Patrón de Datos Inmutables**: Estado gestionado principalmente a través de React Hooks
- **Modelo Vista Controlador (MVC)**: Separación de la lógica de negocio, interfaz y datos
- **Patrones de Formularios**: Uso de React Hook Form para gestión y validación de formularios

## Relaciones entre Componentes

### Modelo de Datos
- **Campañas**: Contienen transectas
- **Transectas**: Contienen segmentos, marisqueos y cuadrados
- **Segmentos**: Representan puntos geoespaciales con conteo de especímenes
- **Personas**: Participantes en campañas
- **Embarcaciones**: Utilizadas en campañas

### Gestión de Estado
- Uso de React Context para estado global cuando es necesario
- Hooks personalizados para lógica reutilizable
- Formularios controlados con validación mediante Zod

## Flujo de Datos Geoespaciales
- **Interfaz de Usuario**: Coordenadas en formato sexagesimal (grados, minutos, segundos)
- **Lógica de Aplicación**: Conversión entre formatos sexagesimal y decimal
- **Persistencia**: Almacenamiento en formato WKT (Well-Known Text) para PostGIS

## Patrones de Interfaz de Usuario
- Componentes de Shadcn/UI como base para la interfaz
- Sistema de diseño consistente utilizando Tailwind CSS
- Interfaces responsivas adaptadas a diferentes dispositivos
- Componentes modales para operaciones CRUD
- Separación entre páginas y componentes reutilizables 