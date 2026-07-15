---
name: create-admin-module
description: Describe what this skill does and when to use it. Include keywords that help agents identify relevant tasks.
---

<!-- Tip: Use /create-skill in chat to generate content with agent assistance -->

---
name: create-admin-module
description: Crear módulos internos para gestionar contenido y usuarios desde el panel de administración.
---

# Objetivo
Construir funcionalidades internas del backoffice.

# Cuándo usarla
- Gestión de preguntas
- Gestión de temas
- Gestión de oposiciones
- Moderación de contenido

# Qué debe hacer
1. Proponer pantalla de listado
2. Añadir filtros
3. Añadir formulario crear/editar
4. Definir acciones básicas
5. Conectar con API

# Reglas
- Pensar en productividad del equipo de contenido
- Priorizar claridad y velocidad de uso

# Entrada esperada
- Entidad a administrar
- Operaciones necesarias

# Salida esperada
- Estructura de pantalla
- Componentes
- Endpoints asociados

# Ejemplo
Entrada: módulo admin de preguntas
Salida: listado, filtros, crear, editar y ver detalle

# Archivos relacionados
frontend/src/admin
backend/src/routes/admin