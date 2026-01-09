/**
 * 8Agency Dashboard - Gantt Chart with D3.js
 * Professional hierarchical Gantt with colored bars
 */

const GanttChart = {
    // Configuration
    config: {
        rowHeight: 40,
        labelWidth: 280,
        barHeight: 22,
        subBarHeight: 16,
        padding: 4,
        year: 2026
    },

    // State
    expandedClients: new Set(),
    expandedProjects: new Set(),
    zoomLevel: 100,

    // Colors for clients/projects
    projectColors: [
        '#f59e0b', // amber
        '#22c55e', // green
        '#3b82f6', // blue
        '#ec4899', // pink
        '#8b5cf6', // purple
        '#14b8a6', // teal
        '#f97316', // orange
        '#06b6d4', // cyan
    ],

    // Data
    data: null,
    filteredData: null,
    container: null,

    /**
     * Initialize Gantt chart
     */
    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.setupControls();
    },

    /**
     * Setup controls
     */
    setupControls() {
        const zoomIn = document.getElementById('zoomIn');
        const zoomOut = document.getElementById('zoomOut');

        if (zoomIn) {
            zoomIn.addEventListener('click', () => this.zoom(10));
        }
        if (zoomOut) {
            zoomOut.addEventListener('click', () => this.zoom(-10));
        }
    },

    /**
     * Zoom chart
     */
    zoom(delta) {
        this.zoomLevel = Math.max(50, Math.min(200, this.zoomLevel + delta));
        document.getElementById('zoomLevel').textContent = `${this.zoomLevel}%`;
        this.render();
    },

    /**
     * Set data
     */
    setData(data) {
        this.data = data;
        this.filteredData = data.projectsByClient;

        // Expand all clients by default
        Object.keys(this.filteredData).forEach(client => {
            this.expandedClients.add(client);
        });

        this.render();
    },

    /**
     * Filter data
     */
    filter(filters) {
        if (!this.data) return;

        const filtered = DataManager.filterProjects(filters);

        // Regroup by client
        this.filteredData = {};
        filtered.forEach(project => {
            const client = project.client || 'Sin Cliente';
            if (!this.filteredData[client]) {
                this.filteredData[client] = [];
            }
            this.filteredData[client].push(project);
        });

        this.render();
    },

    /**
     * Main render function
     */
    render() {
        if (!this.container || !this.filteredData) return;

        this.container.innerHTML = '';

        const months = this.getMonths();
        const monthWidth = (80 * this.zoomLevel) / 100;
        const timelineWidth = months.length * monthWidth;
        const totalWidth = this.config.labelWidth + timelineWidth;

        // Create main wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'gantt-wrapper';
        wrapper.style.cssText = `min-width: ${totalWidth}px; position: relative;`;

        // Build rows data
        const rows = this.buildRows();
        const totalHeight = (rows.length + 1) * this.config.rowHeight;

        // Create header
        const header = this.createHeader(months, monthWidth, timelineWidth);
        wrapper.appendChild(header);

        // Create body
        const body = document.createElement('div');
        body.className = 'gantt-body';
        body.style.cssText = `position: relative;`;

        // Render each row
        rows.forEach((row, index) => {
            const rowEl = this.createRow(row, index, months, monthWidth, timelineWidth);
            body.appendChild(rowEl);
        });

        wrapper.appendChild(body);

        // Add today marker
        this.addTodayMarker(wrapper, months, monthWidth);

        this.container.appendChild(wrapper);
    },

    /**
     * Get months for timeline
     */
    getMonths() {
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return monthNames.map((name, index) => ({
            index,
            name,
            start: new Date(this.config.year, index, 1),
            end: new Date(this.config.year, index + 1, 0)
        }));
    },

    /**
     * Build rows for rendering
     */
    buildRows() {
        const rows = [];
        let colorIndex = 0;

        Object.entries(this.filteredData).forEach(([client, projects]) => {
            const clientColor = this.projectColors[colorIndex % this.projectColors.length];
            colorIndex++;

            // Client row
            rows.push({
                type: 'client',
                name: client,
                expanded: this.expandedClients.has(client),
                projectCount: projects.length,
                color: clientColor
            });

            // Project rows if expanded
            if (this.expandedClients.has(client)) {
                projects.forEach((project, pIndex) => {
                    const projectColor = this.lightenColor(clientColor, pIndex * 10);

                    rows.push({
                        type: 'project',
                        ...project,
                        expanded: this.expandedProjects.has(project.id),
                        color: projectColor,
                        parentColor: clientColor
                    });

                    // Phase rows if project expanded
                    if (this.expandedProjects.has(project.id)) {
                        const phases = this.getProjectPhases(project);
                        phases.forEach(phase => {
                            rows.push({
                                type: 'phase',
                                ...phase,
                                parentProject: project
                            });
                        });
                    }
                });
            }
        });

        return rows;
    },

    /**
     * Create header with months
     */
    createHeader(months, monthWidth, timelineWidth) {
        const header = document.createElement('div');
        header.className = 'gantt-header';
        header.style.cssText = `
            display: flex;
            background: #334155;
            border-bottom: 2px solid #475569;
            position: sticky;
            top: 0;
            z-index: 10;
        `;

        // Label column
        const labelCol = document.createElement('div');
        labelCol.className = 'gantt-header-label';
        labelCol.style.cssText = `
            width: ${this.config.labelWidth}px;
            min-width: ${this.config.labelWidth}px;
            padding: 12px 16px;
            font-weight: 600;
            font-size: 14px;
            color: #f8fafc;
            border-right: 1px solid #475569;
        `;
        labelCol.textContent = 'Proyecto';
        header.appendChild(labelCol);

        // Timeline columns
        const timeline = document.createElement('div');
        timeline.style.cssText = `
            display: flex;
            flex: 1;
        `;

        const currentMonth = new Date().getMonth();

        months.forEach((month, i) => {
            const monthCol = document.createElement('div');
            const isCurrent = month.index === currentMonth;
            monthCol.style.cssText = `
                width: ${monthWidth}px;
                min-width: ${monthWidth}px;
                padding: 12px 4px;
                text-align: center;
                font-size: 12px;
                font-weight: 500;
                color: ${isCurrent ? '#818cf8' : '#94a3b8'};
                border-right: 1px solid #475569;
                background: ${isCurrent ? 'rgba(99, 102, 241, 0.15)' : 'transparent'};
            `;
            monthCol.textContent = month.name;
            timeline.appendChild(monthCol);
        });

        header.appendChild(timeline);
        return header;
    },

    /**
     * Create a single row
     */
    createRow(row, index, months, monthWidth, timelineWidth) {
        const rowEl = document.createElement('div');
        rowEl.className = `gantt-row gantt-row-${row.type}`;
        rowEl.style.cssText = `
            display: flex;
            border-bottom: 1px solid #334155;
            min-height: ${this.config.rowHeight}px;
            background: ${row.type === 'client' ? '#1e293b' : '#0f172a'};
        `;

        // Label section
        const label = this.createLabel(row);
        rowEl.appendChild(label);

        // Timeline section with bar
        const timeline = this.createTimeline(row, months, monthWidth, timelineWidth);
        rowEl.appendChild(timeline);

        return rowEl;
    },

    /**
     * Create label section of row
     */
    createLabel(row) {
        const label = document.createElement('div');
        label.className = 'gantt-label';

        let paddingLeft = 16;
        if (row.type === 'project') paddingLeft = 32;
        if (row.type === 'phase') paddingLeft = 52;

        label.style.cssText = `
            width: ${this.config.labelWidth}px;
            min-width: ${this.config.labelWidth}px;
            padding: 8px 12px 8px ${paddingLeft}px;
            display: flex;
            align-items: center;
            gap: 8px;
            background: #334155;
            border-right: 1px solid #475569;
        `;

        // Expand button for client/project
        if (row.type === 'client' || row.type === 'project') {
            const expandBtn = document.createElement('button');
            expandBtn.style.cssText = `
                background: none;
                border: none;
                color: #94a3b8;
                cursor: pointer;
                padding: 2px;
                display: flex;
                align-items: center;
                transition: transform 0.2s;
                transform: rotate(${row.expanded ? '90deg' : '0deg'});
            `;
            expandBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6"/>
                </svg>
            `;
            expandBtn.onclick = () => {
                if (row.type === 'client') {
                    if (this.expandedClients.has(row.name)) {
                        this.expandedClients.delete(row.name);
                    } else {
                        this.expandedClients.add(row.name);
                    }
                } else {
                    if (this.expandedProjects.has(row.id)) {
                        this.expandedProjects.delete(row.id);
                    } else {
                        this.expandedProjects.add(row.id);
                    }
                }
                this.render();
            };
            label.appendChild(expandBtn);
        }

        // Color indicator
        if (row.type !== 'phase') {
            const colorDot = document.createElement('span');
            colorDot.style.cssText = `
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: ${row.color || row.parentColor || '#6366f1'};
                flex-shrink: 0;
            `;
            label.appendChild(colorDot);
        }

        // Name
        const nameEl = document.createElement('span');
        nameEl.style.cssText = `
            flex: 1;
            font-size: ${row.type === 'client' ? '14px' : row.type === 'project' ? '13px' : '12px'};
            font-weight: ${row.type === 'client' ? '600' : '500'};
            color: ${row.type === 'phase' ? '#94a3b8' : '#f8fafc'};
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;
        nameEl.textContent = row.name;
        label.appendChild(nameEl);

        // Project count badge for clients
        if (row.type === 'client') {
            const badge = document.createElement('span');
            badge.style.cssText = `
                background: #6366f1;
                color: white;
                font-size: 11px;
                font-weight: 600;
                padding: 2px 8px;
                border-radius: 10px;
            `;
            badge.textContent = row.projectCount;
            label.appendChild(badge);
        }

        return label;
    },

    /**
     * Create timeline section with bar
     */
    createTimeline(row, months, monthWidth, timelineWidth) {
        const timeline = document.createElement('div');
        timeline.style.cssText = `
            flex: 1;
            position: relative;
            display: flex;
        `;

        // Grid lines
        months.forEach((month, i) => {
            const gridLine = document.createElement('div');
            const isCurrent = month.index === new Date().getMonth();
            gridLine.style.cssText = `
                width: ${monthWidth}px;
                min-width: ${monthWidth}px;
                border-right: 1px solid #334155;
                background: ${isCurrent ? 'rgba(99, 102, 241, 0.05)' : 'transparent'};
            `;
            timeline.appendChild(gridLine);
        });

        // Add bar if has dates
        if (row.type === 'project' && row.startDate) {
            const bar = this.createBar(row, months, monthWidth);
            if (bar) timeline.appendChild(bar);
        } else if (row.type === 'phase' && row.startDate) {
            const bar = this.createPhaseBar(row, months, monthWidth);
            if (bar) timeline.appendChild(bar);
        } else if (row.type === 'client') {
            // Create aggregated bar for client showing range of all projects
            const clientProjects = this.filteredData[row.name] || [];
            const bar = this.createClientBar(row, clientProjects, months, monthWidth);
            if (bar) timeline.appendChild(bar);
        }

        return timeline;
    },

    /**
     * Create bar for project
     */
    createBar(row, months, monthWidth) {
        const pos = this.calculatePosition(row.startDate, row.endDate, months, monthWidth);
        if (!pos) return null;

        const bar = document.createElement('div');
        bar.style.cssText = `
            position: absolute;
            left: ${pos.left}px;
            width: ${Math.max(pos.width, 8)}px;
            height: ${this.config.barHeight}px;
            top: 50%;
            transform: translateY(-50%);
            background: linear-gradient(135deg, ${row.color} 0%, ${this.darkenColor(row.color, 15)} 100%);
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            padding: 0 8px;
            overflow: hidden;
        `;

        // Add label if bar is wide enough
        if (pos.width > 60) {
            const label = document.createElement('span');
            label.style.cssText = `
                font-size: 11px;
                font-weight: 500;
                color: white;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            `;
            label.textContent = row.name;
            bar.appendChild(label);
        }

        bar.onmouseenter = () => {
            bar.style.transform = 'translateY(-50%) scale(1.02)';
            bar.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        };
        bar.onmouseleave = () => {
            bar.style.transform = 'translateY(-50%)';
            bar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        };
        bar.onclick = () => this.showProjectDetails(row);

        // Tooltip
        bar.title = `${row.name}\n${this.formatDate(row.startDate)} - ${this.formatDate(row.endDate)}`;

        return bar;
    },

    /**
     * Create aggregated bar for client
     */
    createClientBar(row, projects, months, monthWidth) {
        // Find min start and max end dates
        let minStart = null;
        let maxEnd = null;

        projects.forEach(p => {
            if (p.startDate) {
                if (!minStart || p.startDate < minStart) minStart = p.startDate;
            }
            if (p.endDate) {
                if (!maxEnd || p.endDate > maxEnd) maxEnd = p.endDate;
            }
        });

        if (!minStart) return null;

        const pos = this.calculatePosition(minStart, maxEnd || minStart, months, monthWidth);
        if (!pos) return null;

        const bar = document.createElement('div');
        bar.style.cssText = `
            position: absolute;
            left: ${pos.left}px;
            width: ${Math.max(pos.width, 8)}px;
            height: ${this.config.barHeight + 4}px;
            top: 50%;
            transform: translateY(-50%);
            background: linear-gradient(135deg, ${row.color} 0%, ${this.darkenColor(row.color, 20)} 100%);
            border-radius: 6px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            padding: 0 10px;
            overflow: hidden;
        `;

        // Add label
        if (pos.width > 80) {
            const label = document.createElement('span');
            label.style.cssText = `
                font-size: 12px;
                font-weight: 600;
                color: white;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                text-shadow: 0 1px 2px rgba(0,0,0,0.4);
            `;
            label.textContent = row.name;
            bar.appendChild(label);
        }

        return bar;
    },

    /**
     * Create bar for phase
     */
    createPhaseBar(row, months, monthWidth) {
        const pos = this.calculatePosition(row.startDate, row.endDate, months, monthWidth);
        if (!pos) return null;

        const colors = {
            'pre-prod': '#3b82f6',
            'key-date': '#f59e0b',
            'post-prod': '#10b981'
        };

        const bar = document.createElement('div');
        bar.style.cssText = `
            position: absolute;
            left: ${pos.left}px;
            width: ${Math.max(pos.width, 6)}px;
            height: ${this.config.subBarHeight}px;
            top: 50%;
            transform: translateY(-50%);
            background: ${colors[row.phaseType] || '#6366f1'};
            border-radius: 3px;
            opacity: 0.9;
        `;

        bar.title = `${row.name}: ${this.formatDate(row.startDate)} - ${this.formatDate(row.endDate)}`;

        return bar;
    },

    /**
     * Calculate position for a bar
     */
    calculatePosition(startDate, endDate, months, monthWidth) {
        if (!startDate) return null;

        const startMonth = startDate.getMonth();
        const startDay = startDate.getDate();
        const endMonth = endDate ? endDate.getMonth() : startMonth;
        const endDay = endDate ? endDate.getDate() : startDay;

        const daysInStartMonth = new Date(this.config.year, startMonth + 1, 0).getDate();
        const startOffset = ((startDay - 1) / daysInStartMonth) * monthWidth;
        const left = (startMonth * monthWidth) + startOffset;

        let width;
        if (startMonth === endMonth) {
            const daysDiff = endDay - startDay + 1;
            width = (daysDiff / daysInStartMonth) * monthWidth;
        } else {
            const daysInEndMonth = new Date(this.config.year, endMonth + 1, 0).getDate();
            const remainingStartDays = daysInStartMonth - startDay + 1;
            const fullMonths = endMonth - startMonth - 1;
            width = (remainingStartDays / daysInStartMonth) * monthWidth +
                (fullMonths * monthWidth) +
                (endDay / daysInEndMonth) * monthWidth;
        }

        return { left, width: Math.max(width, 4) };
    },

    /**
     * Get phases for a project
     */
    getProjectPhases(project) {
        const phases = [];
        if (!project.startDate) return phases;

        const duration = project.endDate ?
            (project.endDate - project.startDate) / (1000 * 60 * 60 * 24) : 30;

        // Pre-production
        const preEnd = new Date(project.startDate);
        preEnd.setDate(preEnd.getDate() + Math.floor(duration * 0.3));
        phases.push({
            name: 'Pre-producción',
            phaseType: 'pre-prod',
            startDate: new Date(project.startDate),
            endDate: preEnd
        });

        // Key date
        if (project.confirmedDate) {
            phases.push({
                name: 'Key Date',
                phaseType: 'key-date',
                startDate: project.confirmedDate,
                endDate: project.confirmedDate
            });
        }

        // Post-production
        if (project.endDate) {
            const postStart = new Date(project.endDate);
            postStart.setDate(postStart.getDate() - Math.floor(duration * 0.3));
            phases.push({
                name: 'Post-producción',
                phaseType: 'post-prod',
                startDate: postStart,
                endDate: project.endDate
            });
        }

        return phases;
    },

    /**
     * Add today marker
     */
    addTodayMarker(wrapper, months, monthWidth) {
        const today = new Date();
        if (today.getFullYear() !== this.config.year) return;

        const month = today.getMonth();
        const day = today.getDate();
        const daysInMonth = new Date(this.config.year, month + 1, 0).getDate();
        const left = this.config.labelWidth + (month * monthWidth) + ((day / daysInMonth) * monthWidth);

        const marker = document.createElement('div');
        marker.style.cssText = `
            position: absolute;
            left: ${left}px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #ef4444;
            z-index: 5;
            pointer-events: none;
        `;

        // Dashed line effect
        marker.style.background = 'repeating-linear-gradient(to bottom, #ef4444 0, #ef4444 4px, transparent 4px, transparent 8px)';

        wrapper.appendChild(marker);
    },

    /**
     * Show project details
     */
    showProjectDetails(project) {
        const panel = document.getElementById('detailPanel');
        const content = document.getElementById('panelContent');
        if (!panel || !content) return;

        content.innerHTML = `
            <div class="detail-section">
                <h4>Proyecto</h4>
                <div class="detail-value">${project.name || 'Sin nombre'}</div>
            </div>
            <div class="detail-section">
                <h4>Cliente</h4>
                <div class="detail-value">${project.client || 'Sin cliente'}</div>
            </div>
            <div class="detail-section">
                <h4>Tipo</h4>
                <div class="detail-value">${project.type || 'Sin tipo'}</div>
            </div>
            <div class="detail-section">
                <h4>Fechas</h4>
                <div class="detail-value">
                    <span class="detail-label">Inicio:</span> ${this.formatDate(project.startDate) || 'No definida'}
                </div>
                <div class="detail-value">
                    <span class="detail-label">Fin:</span> ${this.formatDate(project.endDate) || 'No definida'}
                </div>
            </div>
            <div class="detail-section">
                <h4>Equipos Asignados</h4>
                <div class="team-badges">
                    ${project.teams && project.teams.length > 0 ?
                        project.teams.map(team => `<span class="team-badge">${team}</span>`).join('') :
                        '<span class="detail-value">Sin equipos asignados</span>'
                    }
                </div>
            </div>
            ${project.tasks ? `
            <div class="detail-section">
                <h4>Tareas</h4>
                <div class="detail-value">${project.tasks}</div>
            </div>` : ''}
        `;

        panel.classList.add('open');
        document.getElementById('overlay').classList.add('active');
    },

    /**
     * Format date
     */
    formatDate(date) {
        if (!date) return null;
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    },

    /**
     * Lighten a color
     */
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    },

    /**
     * Darken a color
     */
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
};
