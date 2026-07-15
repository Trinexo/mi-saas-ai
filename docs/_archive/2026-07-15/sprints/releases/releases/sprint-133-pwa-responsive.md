# Sprint 133 — PWA Foundation + Responsive App-Style

**PR**: #278  
**Branch**: `feature/sprint-133-pwa-responsive`  
**Merged**: main (squash)  
**Build**: ✓ 879 módulos, 88 precache entries, sw.js + workbox generados

---

## Objetivo

Convertir la plataforma en una Progressive Web App (PWA) instalable con diseño responsive tipo app para los tres roles: **alumno**, **admin** y **profesor**.

---

## Archivos modificados

### Nuevos
| Archivo | Descripción |
|---------|-------------|
| `frontend/public/manifest.json` | Web App Manifest con nombre, íconos, theme_color, shortcuts |
| `frontend/public/icons/icon-192.svg` | Ícono PWA 192px |
| `frontend/public/icons/icon-512.svg` | Ícono PWA 512px |
| `frontend/public/icons/apple-touch-icon.svg` | Ícono iOS |
| `frontend/src/components/InstallPrompt.jsx` | Banner de instalación PWA |

### Modificados
| Archivo | Cambio |
|---------|--------|
| `frontend/vite.config.js` | Integración `vite-plugin-pwa` (generateSW + NetworkFirst para API) |
| `frontend/index.html` | Meta tags PWA: theme-color, apple-mobile-web-app-capable, viewport-fit=cover |
| `frontend/src/styles.css` | Sistema responsive completo: variables, clases de grid, drawer, bottom nav, animaciones |
| `frontend/src/components/MainLayout.jsx` | Mobile top bar + drawer lateral para staff + bottom nav para alumnos |
| `frontend/src/pages/admin/AdminLayout.jsx` | Mobile top bar + drawer lateral para admin |
| `frontend/src/App.jsx` | `<InstallPrompt />` integrado |
| `frontend/nginx.conf` | Headers PWA: no-cache para sw.js, caché para manifest e íconos |
| `frontend/vercel.json` | Headers PWA equivalentes para Vercel |
| `frontend/package.json` | `vite-plugin-pwa@1.3.0` (devDep), `react-is` (dep, fix recharts) |

---

## Detalles técnicos

### Service Worker
- Modo: `generateSW` (Workbox autogenerado)
- Precache: 88 assets (JS, CSS, HTML, íconos, fonts)
- Runtime caching: `NetworkFirst` para `/api/*` con timeout 10s → fallback a cache
- `registerType: 'autoUpdate'` — se actualiza silenciosamente en background

### Manifest
```json
{
  "name": "AlbacerTest - Plataforma de Oposiciones",
  "short_name": "AlbacerTest",
  "theme_color": "#ea580c",
  "display": "standalone",
  "orientation": "portrait-primary",
  "shortcuts": [
    { "name": "Crear Test", "url": "/configurar-test" },
    { "name": "Mi Progreso", "url": "/progreso" }
  ]
}
```

### Sistema CSS responsive
Variables globales añadidas:
```css
--bottom-nav-height: 64px;
--top-bar-height: 56px;
```

Clases de grid responsivas:
- `.card-grid-2`, `.card-grid-3`, `.card-grid-4` — stack a 1 columna en ≤768px
- `.table-responsive` — scroll horizontal en mobile
- `.col-hide-mobile` — ocultar columnas en mobile

Comportamiento touch:
- `touch-action: manipulation` — elimina 300ms tap delay
- `overscroll-behavior: none` — elimina bounce en PWA instalada

### MainLayout — Alumno (responsive)
- **Desktop**: sidebar fijo 240px
- **Mobile (≤768px)**:
  - Top bar con logo + notificaciones + avatar
  - Para staff (admin/profesor): hamburger que abre drawer lateral animado
  - Para alumnos: bottom navigation bar con 4 enlaces
  - Drawer se cierra automáticamente al cambiar de ruta (`useEffect` + pathname)

### AdminLayout — Admin (responsive)
- **Desktop**: sidebar fijo 240px con fondo `#111827`
- **Mobile (≤768px)**:
  - Top bar con hamburger + label "OpoTest Admin" + badge + avatar
  - Drawer lateral animado con los mismos nav links del sidebar
  - Backdrop con `onClick` para cerrar

### InstallPrompt
- Se activa con el evento nativo `beforeinstallprompt`
- No aparece si ya está instalada (`matchMedia('(display-mode: standalone)')`)
- Se puede descartar (guarda en `sessionStorage` para no molestar en la sesión)
- Posicionado como barra fija en la parte inferior de la pantalla

---

## Sprint siguiente propuesto

### Sprint 134 — Responsive Polish en páginas individuales

Las páginas de contenido aún usan layouts fijos que no se adaptan bien en móvil. Trabajo propuesto:

| Página | Mejora |
|--------|--------|
| `HomePage.jsx` | Usar `.card-grid-3` para KPI cards, stack en móvil |
| `TestPage.jsx` | Ocultar `LeftPanel` en móvil, padding del header responsivo |
| `ConfigurarTestPage.jsx` | Tabs stackable, form fields full-width en móvil |
| `ResultPage.jsx` | Cards de resultado en `.card-grid-2` |
| `AdminQuestionsPage.jsx` | Tabla con `.table-responsive` + `.col-hide-mobile` |
| `ProfesorDashboard.jsx` | Grid de stats en `.card-grid-2` |
| Formularios admin | Labels + inputs full-width en móvil |

**Estimación**: 1 sprint (3-5 días)
