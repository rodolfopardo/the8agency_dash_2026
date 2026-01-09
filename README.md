<p align="center">
  <img src="https://img.shields.io/badge/8Agency-Dashboard%202026-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSIxMCIgZmlsbD0id2hpdGUiLz48dGV4dCB4PSIyMCIgeT0iMjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2MzY2ZjEiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtd2VpZ2h0PSI3MDAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj44PC90ZXh0Pjwvc3ZnPg==" alt="8Agency Dashboard"/>
</p>

<h1 align="center">8Agency Project Dashboard 2026</h1>

<p align="center">
  <strong>Sistema de visualización y gestión de proyectos con conexión en tiempo real a Google Sheets</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#instalación">Instalación</a> •
  <a href="#uso">Uso</a> •
  <a href="#tecnologías">Tecnologías</a> •
  <a href="#configuración">Configuración</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5"/>
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3"/>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript"/>
  <img src="https://img.shields.io/badge/D3.js-F9A03C?style=flat-square&logo=d3.js&logoColor=white" alt="D3.js"/>
  <img src="https://img.shields.io/badge/Chart.js-FF6384?style=flat-square&logo=chart.js&logoColor=white" alt="Chart.js"/>
  <img src="https://img.shields.io/badge/Google%20Sheets-34A853?style=flat-square&logo=google-sheets&logoColor=white" alt="Google Sheets"/>
</p>

---

## Overview

Dashboard interactivo diseñado para visualizar la planificación de proyectos y demanda de trabajo por equipo. Permite identificar picos de carga, anticipar necesidades de recursos y gestionar proyectos de manera eficiente.

El sistema se conecta directamente a Google Sheets como fuente de datos, actualizándose automáticamente ante cualquier cambio.

---

## Features

### Visualizaciones Avanzadas

| Feature | Descripción |
|---------|-------------|
| **Gantt Jerárquico** | Timeline interactivo de proyectos agrupados por cliente, expandible para ver fases (Pre-producción, Key Date, Post-producción) |
| **Carga de Trabajo** | Gráfico de barras apiladas mostrando proyectos por equipo y período |
| **Heatmap** | Mapa de calor de intensidad de carga por equipo y mes |
| **Panel de Detalles** | Información completa del proyecto al hacer click |

### Funcionalidades

- **Autenticación Multi-usuario** - Sistema de login con roles diferenciados
- **Filtros Dinámicos** - Por cliente, equipo, tipo de proyecto y mes
- **Conexión en Tiempo Real** - Sincronización automática con Google Sheets cada 5 minutos
- **Diseño Responsive** - Adaptable a desktop, tablet y móvil
- **Tema Oscuro** - Interfaz moderna y profesional
- **Caché Local** - Funcionamiento offline con datos en caché

---

## Demo

**Live Demo:** [https://rodolfopardo.github.io/the8agency_dash_2026/](https://rodolfopardo.github.io/the8agency_dash_2026/)

### Credenciales de Prueba

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin2026` | Administrador |
| `mario` | `mario2026` | Manager |
| `viewer` | `viewer2026` | Visualizador |

---

## Instalación

### Opción 1: GitHub Pages (Recomendado)

1. Fork este repositorio
2. Ve a **Settings** → **Pages**
3. Selecciona **Source**: `main` branch, `/ (root)`
4. Tu dashboard estará disponible en `https://[usuario].github.io/[repo]/`

### Opción 2: Servidor Local

```bash
# Clonar repositorio
git clone https://github.com/rodolfopardo/the8agency_dash_2026.git

# Entrar al directorio
cd the8agency_dash_2026

# Iniciar servidor local (Python 3)
python3 -m http.server 8080

# Abrir en navegador
open http://localhost:8080
```

---

## Uso

### Navegación

1. **Login** - Ingresar con usuario y contraseña
2. **Gantt** - Ver timeline de proyectos, expandir/contraer clientes y proyectos
3. **Carga de Trabajo** - Analizar distribución de proyectos por equipo
4. **Heatmap** - Identificar picos de carga por mes

### Filtros

- **Cliente** - Filtrar proyectos por cliente específico
- **Equipo** - Ver proyectos asignados a un equipo
- **Tipo** - Filtrar por tipo de proyecto (Always On, Evento, Campaña)
- **Mes** - Enfocarse en un período específico

### Interactividad

- Click en barras del Gantt para ver detalles del proyecto
- Hover en celdas del Heatmap para ver información
- Zoom +/- en el Gantt para ajustar la vista
- Botón de refresh para actualizar datos manualmente

---

## Tecnologías

| Tecnología | Uso |
|------------|-----|
| **HTML5** | Estructura semántica |
| **CSS3** | Estilos, variables CSS, diseño responsive |
| **JavaScript ES6+** | Lógica de aplicación |
| **D3.js v7** | Gantt Chart y Heatmap |
| **Chart.js** | Gráfico de carga de trabajo |
| **Google Sheets API** | Fuente de datos en tiempo real |

---

## Estructura del Proyecto

```
the8agency_dash_2026/
├── index.html          # Página de login
├── dashboard.html      # Dashboard principal
├── css/
│   └── styles.css      # Estilos globales
├── js/
│   ├── auth.js         # Sistema de autenticación
│   ├── data.js         # Conexión a Google Sheets
│   ├── gantt.js        # Gantt Chart (D3.js)
│   ├── charts.js       # Workload + Heatmap
│   └── app.js          # Lógica principal
├── assets/             # Recursos adicionales
└── README.md
```

---

## Configuración

### Google Sheets

1. El Sheet debe estar compartido como **"Cualquier persona con el enlace puede ver"**

2. Estructura requerida del Sheet:

| Columna | Descripción |
|---------|-------------|
| Cliente | Nombre del cliente |
| Proyecto | Nombre del proyecto |
| Línea / Tipo | Tipo de proyecto |
| Fase | Fase actual |
| Tareas | Descripción de tareas |
| Fecha de Inicio | Fecha inicio (DD-Mon-YYYY) |
| Fecha Finalización | Fecha fin (DD-Mon-YYYY) |
| Fecha confirmada | Key date confirmada |
| Link Click Up | URL de ClickUp |
| Equipo Content | "Aplica" / "No Aplica" |
| Equipo Diseño | "Aplica" / "No Aplica" |
| Equipo Video | "Aplica" / "No Aplica" |
| Equipo Dev | "Aplica" / "No Aplica" |
| Equipo Traducciones | "Aplica" / "No Aplica" |
| Equipo Social Media | "Aplica" / "No Aplica" |
| Equipo Field Marketing | "Aplica" / "No Aplica" |
| Equipo Strategy | "Aplica" / "No Aplica" |

3. Para cambiar el Sheet, edita `SHEET_ID` en `js/data.js`:

```javascript
SHEET_ID: 'TU_SHEET_ID_AQUI',
```

### Usuarios

Edita los usuarios en `js/auth.js`:

```javascript
users: [
    { username: 'admin', password: 'admin2026', name: 'Administrador', role: 'Admin', avatar: 'A' },
    // Agregar más usuarios aquí
],
```

---

## Roadmap

- [ ] Export a PDF/Excel
- [ ] Modo claro/oscuro toggle
- [ ] Notificaciones de cambios
- [ ] Drag & drop en Gantt
- [ ] Integración con ClickUp API
- [ ] Vista semanal detallada

---

## Licencia

Este proyecto es privado y de uso interno de 8Agency.

---

<p align="center">
  <strong>The 8 Agency</strong> © 2026
</p>

<p align="center">
  <sub>Creado por Equipo Data - The 8 Agency</sub>
</p>
