---
name: create-react-screen
description: Describe what this skill does and when to use it. Include keywords that help agents identify relevant tasks.
---

<!-- Tip: Use /create-skill in chat to generate content with agent assistance -->

---
name: create-react-screen
description: Crear pantallas React alineadas con el flujo de la plataforma.
---

# Objetivo
Generar vistas funcionales para test, resultados, progreso o administración.

# Cuándo usarla
- Crear nueva pantalla
- Crear formulario
- Crear listado o detalle

# Qué debe hacer
1. Definir estructura del componente
2. Separar UI y servicio API
3. Manejar loading, error y vacío
4. Mantener naming coherente
5. Proponer estructura reutilizable

# Reglas
- Componentes pequeños
- Sin lógica compleja en la vista
- Llamadas API en servicios

# Entrada esperada
- Nombre de pantalla
- Objetivo de negocio
- Datos que debe mostrar

# Salida esperada
- Componente React
- Servicio API asociado
- Estados UI

# Ejemplo
Entrada: pantalla para realizar test
Salida: TestPage.jsx + testsApi.js

# Archivos relacionados
frontend/src/pages
frontend/src/components
frontend/src/services