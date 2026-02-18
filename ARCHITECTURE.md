# Nueva Arquitectura - Plans Module

## Estructura de Carpetas

```
src/
├── views/
│   └── Plans.tsx                    # Orquestador principal (reducido a ~150 líneas)
│
├── features/
│   └── plans/
│       ├── components/
│       │   ├── Canvas.tsx           # Canvas con drag/zoom
│       │   ├── SubjectNode.tsx     # Nodo simplificado
│       │   ├── ConnectionLines.tsx # Líneas de conexión
│       │   ├── Sidebar.tsx         # Sidebar de carreras
│       │   ├── StatsFooter.tsx     # Footer con estadísticas
│       │   └── ui/                 # Componentes UI reutilizables
│       │       ├── Button.tsx
│       │       ├── Badge.tsx
│       │       └── Modal.tsx
│       │
│       ├── hooks/
│       │   ├── useCanvas.ts         # Lógica de drag/zoom
│       │   ├── useSubjects.ts       # Lógica de materias
│       │   └── useCareerProgress.ts # Progreso y Firebase
│       │
│       └── services/
│           └── careerProgress.ts   # Servicio Firebase aislado
│
├── services/
│   └── firebase/
│       └── careerProgress.ts       # Capa de abstracción Firebase
│
└── lib/
    └── utils.ts                     # Utilidades generales
```

## Principios de Diseño

### 1. Separación de Responsabilidades
- **Views**: Solo orquestación, sin lógica de negocio
- **Components**: UI pura, props simples
- **Hooks**: Lógica de estado y efectos
- **Services**: Comunicación con Firebase, sin React

### 2. Estado
- Estado local simple con `useState`
- Solo `useReducer` si hay lógica compleja de transiciones
- Hover local en componentes, no global
- Canvas state en hook dedicado

### 3. Performance
- Eliminar `useMemo`/`useCallback` innecesarios
- CSS para animaciones, no JS
- Estilos con Tailwind, mínimo inline
- Precalcular solo donde tenga impacto real

### 4. Firebase
- Servicio aislado con funciones puras
- Optimistic updates con rollback
- Manejo de errores centralizado

## Flujo de Datos

```
Plans (View)
  ├── useCareerProgress → Firebase Service
  ├── useCanvas → Estado local drag/zoom
  ├── useSubjects → Cálculos de posiciones
  │
  └── Render
      ├── Sidebar (carreras)
      ├── Canvas
      │   ├── ConnectionLines
      │   └── SubjectNode[] (hover local)
      ├── StatsFooter
      └── SubjectModal
```

## Cambios Principales

### Antes
- Plans.tsx: 639 líneas, useReducer innecesario
- Estado global para hover
- Estilos inline recreados
- Lógica Firebase en componentes
- Demasiados useMemo/useCallback

### Después
- Plans.tsx: ~150 líneas, orquestador simple
- Hover local en SubjectNode
- Estilos con Tailwind/CSS
- Firebase en servicios
- useMemo/useCallback solo donde necesario
