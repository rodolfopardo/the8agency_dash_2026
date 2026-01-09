/**
 * 8Agency Dashboard - Gantt Chart with D3.js
 * Hierarchical, expandable Gantt chart
 */

const GanttChart = {
    // Configuration
    config: {
        rowHeight: 44,
        labelWidth: 250,
        monthWidth: 100,
        barHeight: 24,
        padding: 4,
        year: 2026
    },

    // State
    expandedClients: new Set(),
    expandedProjects: new Set(),
    zoomLevel: 100,
    viewMode: 'month', // 'month' or 'week'

    // Data
    data: null,
    filteredData: null,

    // D3 elements
    svg: null,
    container: null,

    /**
     * Initialize Gantt chart
     */
    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        // Setup zoom controls
        this.setupControls();
    },

    /**
     * Setup controls
     */
    setupControls() {
        const zoomIn = document.getElementById('zoomIn');
        const zoomOut = document.getElementById('zoomOut');
        const viewBtns = document.querySelectorAll('.btn-view');

        if (zoomIn) {
            zoomIn.addEventListener('click', () => this.zoom(10));
        }
        if (zoomOut) {
            zoomOut.addEventListener('click', () => this.zoom(-10));
        }

        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.viewMode = btn.dataset.view;
                this.render();
            });
        });
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
     * Render the Gantt chart
     */
    render() {
        if (!this.container || !this.filteredData) return;

        // Clear container
        this.container.innerHTML = '';

        // Calculate dimensions
        const months = this.getMonths();
        const rows = this.buildRows();
        const monthWidth = (this.config.monthWidth * this.zoomLevel) / 100;
        const totalWidth = this.config.labelWidth + (months.length * monthWidth);
        const totalHeight = (rows.length + 1) * this.config.rowHeight;

        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'gantt-wrapper';
        wrapper.style.minWidth = `${totalWidth}px`;

        // Create SVG
        this.svg = d3.select(wrapper)
            .append('svg')
            .attr('width', totalWidth)
            .attr('height', totalHeight)
            .attr('class', 'gantt-svg');

        // Render header
        this.renderHeader(months, monthWidth);

        // Render rows
        this.renderRows(rows, months, monthWidth);

        // Render today line
        this.renderTodayLine(months, monthWidth);

        this.container.appendChild(wrapper);
    },

    /**
     * Get months for timeline
     */
    getMonths() {
        const months = [];
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        for (let i = 0; i < 12; i++) {
            months.push({
                index: i,
                name: monthNames[i],
                start: new Date(this.config.year, i, 1),
                end: new Date(this.config.year, i + 1, 0)
            });
        }

        return months;
    },

    /**
     * Build rows for rendering
     */
    buildRows() {
        const rows = [];

        Object.entries(this.filteredData).forEach(([client, projects]) => {
            // Add client row
            rows.push({
                type: 'client',
                name: client,
                expanded: this.expandedClients.has(client),
                projectCount: projects.length
            });

            // Add project rows if expanded
            if (this.expandedClients.has(client)) {
                projects.forEach(project => {
                    rows.push({
                        type: 'project',
                        ...project,
                        expanded: this.expandedProjects.has(project.id)
                    });

                    // Add phase rows if project is expanded
                    if (this.expandedProjects.has(project.id)) {
                        // Determine phases based on data
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
     * Get phases for a project
     */
    getProjectPhases(project) {
        const phases = [];

        if (project.startDate) {
            // Pre-production phase (first third of project duration)
            const duration = project.endDate ?
                (project.endDate - project.startDate) / (1000 * 60 * 60 * 24) : 30;

            const preEnd = new Date(project.startDate);
            preEnd.setDate(preEnd.getDate() + Math.floor(duration * 0.3));

            phases.push({
                name: 'Pre-producción',
                phaseType: 'pre-prod',
                startDate: project.startDate,
                endDate: preEnd
            });

            // Key date (middle)
            if (project.confirmedDate) {
                phases.push({
                    name: 'Key Date',
                    phaseType: 'key-date',
                    startDate: project.confirmedDate,
                    endDate: project.confirmedDate
                });
            } else {
                const keyStart = new Date(preEnd);
                keyStart.setDate(keyStart.getDate() + 1);
                const keyEnd = new Date(keyStart);
                keyEnd.setDate(keyEnd.getDate() + Math.floor(duration * 0.2));

                phases.push({
                    name: 'Key Date',
                    phaseType: 'key-date',
                    startDate: keyStart,
                    endDate: keyEnd
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
        }

        return phases;
    },

    /**
     * Render header
     */
    renderHeader(months, monthWidth) {
        const headerGroup = this.svg.append('g').attr('class', 'gantt-header-group');

        // Background
        headerGroup.append('rect')
            .attr('width', '100%')
            .attr('height', this.config.rowHeight)
            .attr('fill', '#334155');

        // Label header
        headerGroup.append('text')
            .attr('x', 16)
            .attr('y', this.config.rowHeight / 2)
            .attr('dy', '0.35em')
            .attr('fill', '#f8fafc')
            .attr('font-size', '14px')
            .attr('font-weight', '600')
            .text('Proyecto');

        // Month headers
        const currentMonth = new Date().getMonth();

        months.forEach((month, i) => {
            const x = this.config.labelWidth + (i * monthWidth);

            // Month background (highlight current)
            if (month.index === currentMonth) {
                headerGroup.append('rect')
                    .attr('x', x)
                    .attr('y', 0)
                    .attr('width', monthWidth)
                    .attr('height', this.config.rowHeight)
                    .attr('fill', 'rgba(99, 102, 241, 0.2)');
            }

            // Vertical line
            headerGroup.append('line')
                .attr('x1', x)
                .attr('y1', 0)
                .attr('x2', x)
                .attr('y2', '100%')
                .attr('stroke', '#475569')
                .attr('stroke-width', 1);

            // Month name
            headerGroup.append('text')
                .attr('x', x + monthWidth / 2)
                .attr('y', this.config.rowHeight / 2)
                .attr('dy', '0.35em')
                .attr('text-anchor', 'middle')
                .attr('fill', month.index === currentMonth ? '#818cf8' : '#94a3b8')
                .attr('font-size', '12px')
                .attr('font-weight', '500')
                .text(month.name);
        });
    },

    /**
     * Render rows
     */
    renderRows(rows, months, monthWidth) {
        const self = this;

        rows.forEach((row, index) => {
            const y = (index + 1) * this.config.rowHeight;
            const rowGroup = this.svg.append('g')
                .attr('class', `gantt-row-group gantt-row-${row.type}`)
                .attr('transform', `translate(0, ${y})`);

            // Row background
            rowGroup.append('rect')
                .attr('width', '100%')
                .attr('height', this.config.rowHeight)
                .attr('fill', row.type === 'client' ? '#1e293b' :
                    row.type === 'project' ? '#0f172a' : 'transparent')
                .attr('class', 'row-bg');

            // Label background
            rowGroup.append('rect')
                .attr('width', this.config.labelWidth)
                .attr('height', this.config.rowHeight)
                .attr('fill', row.type === 'client' ? '#1e293b' : '#334155');

            // Row border
            rowGroup.append('line')
                .attr('x1', 0)
                .attr('x2', '100%')
                .attr('y1', this.config.rowHeight)
                .attr('y2', this.config.rowHeight)
                .attr('stroke', '#334155')
                .attr('stroke-width', 1);

            // Render based on row type
            if (row.type === 'client') {
                this.renderClientRow(rowGroup, row, months, monthWidth);
            } else if (row.type === 'project') {
                this.renderProjectRow(rowGroup, row, months, monthWidth);
            } else if (row.type === 'phase') {
                this.renderPhaseRow(rowGroup, row, months, monthWidth);
            }

            // Grid lines for months
            months.forEach((month, i) => {
                const x = this.config.labelWidth + (i * monthWidth);
                rowGroup.append('line')
                    .attr('x1', x)
                    .attr('y1', 0)
                    .attr('x2', x)
                    .attr('y2', this.config.rowHeight)
                    .attr('stroke', '#334155')
                    .attr('stroke-width', 1)
                    .attr('stroke-opacity', 0.5);
            });
        });
    },

    /**
     * Render client row
     */
    renderClientRow(group, row, months, monthWidth) {
        const self = this;

        // Expand/collapse button
        const expandBtn = group.append('g')
            .attr('class', 'expand-btn')
            .attr('transform', `translate(12, ${this.config.rowHeight / 2})`)
            .style('cursor', 'pointer');

        expandBtn.append('path')
            .attr('d', row.expanded ? 'M6 9l6 6 6-6' : 'M9 18l6-6-6-6')
            .attr('stroke', '#94a3b8')
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('transform', 'translate(-6, -6)');

        expandBtn.on('click', function () {
            if (self.expandedClients.has(row.name)) {
                self.expandedClients.delete(row.name);
            } else {
                self.expandedClients.add(row.name);
            }
            self.render();
        });

        // Client name
        group.append('text')
            .attr('x', 36)
            .attr('y', this.config.rowHeight / 2)
            .attr('dy', '0.35em')
            .attr('fill', '#f8fafc')
            .attr('font-size', '14px')
            .attr('font-weight', '600')
            .text(row.name);

        // Project count badge
        group.append('rect')
            .attr('x', this.config.labelWidth - 50)
            .attr('y', (this.config.rowHeight - 20) / 2)
            .attr('width', 36)
            .attr('height', 20)
            .attr('rx', 10)
            .attr('fill', '#6366f1');

        group.append('text')
            .attr('x', this.config.labelWidth - 32)
            .attr('y', this.config.rowHeight / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-size', '11px')
            .attr('font-weight', '600')
            .text(row.projectCount);
    },

    /**
     * Render project row
     */
    renderProjectRow(group, row, months, monthWidth) {
        const self = this;

        // Expand button for phases
        const expandBtn = group.append('g')
            .attr('class', 'expand-btn')
            .attr('transform', `translate(28, ${this.config.rowHeight / 2})`)
            .style('cursor', 'pointer');

        expandBtn.append('path')
            .attr('d', row.expanded ? 'M6 9l6 6 6-6' : 'M9 18l6-6-6-6')
            .attr('stroke', '#64748b')
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('transform', 'translate(-6, -6) scale(0.8)');

        expandBtn.on('click', function () {
            if (self.expandedProjects.has(row.id)) {
                self.expandedProjects.delete(row.id);
            } else {
                self.expandedProjects.add(row.id);
            }
            self.render();
        });

        // Project name
        group.append('text')
            .attr('x', 48)
            .attr('y', this.config.rowHeight / 2)
            .attr('dy', '0.35em')
            .attr('fill', '#f8fafc')
            .attr('font-size', '13px')
            .attr('font-weight', '500')
            .text(this.truncateText(row.name, 22));

        // Render project bar
        if (row.startDate) {
            const barInfo = this.calculateBarPosition(row.startDate, row.endDate || row.startDate, months, monthWidth);

            if (barInfo) {
                const bar = group.append('rect')
                    .attr('x', barInfo.x)
                    .attr('y', (this.config.rowHeight - this.config.barHeight) / 2)
                    .attr('width', Math.max(barInfo.width, 8))
                    .attr('height', this.config.barHeight)
                    .attr('rx', 4)
                    .attr('class', 'gantt-bar project-bar')
                    .style('cursor', 'pointer');

                // Gradient fill
                const gradientId = `gradient-${row.id}`;
                const gradient = this.svg.append('defs')
                    .append('linearGradient')
                    .attr('id', gradientId)
                    .attr('x1', '0%')
                    .attr('x2', '100%');

                gradient.append('stop')
                    .attr('offset', '0%')
                    .attr('stop-color', '#6366f1');

                gradient.append('stop')
                    .attr('offset', '100%')
                    .attr('stop-color', '#8b5cf6');

                bar.attr('fill', `url(#${gradientId})`);

                // Click to show details
                bar.on('click', () => {
                    this.showProjectDetails(row);
                });

                // Tooltip on hover
                bar.append('title')
                    .text(`${row.name}\n${this.formatDate(row.startDate)} - ${this.formatDate(row.endDate)}`);
            }
        }
    },

    /**
     * Render phase row
     */
    renderPhaseRow(group, row, months, monthWidth) {
        // Phase name
        group.append('text')
            .attr('x', 68)
            .attr('y', this.config.rowHeight / 2)
            .attr('dy', '0.35em')
            .attr('fill', '#94a3b8')
            .attr('font-size', '12px')
            .text(row.name);

        // Render phase bar
        if (row.startDate) {
            const barInfo = this.calculateBarPosition(row.startDate, row.endDate || row.startDate, months, monthWidth);

            if (barInfo) {
                const barHeight = 18;
                const bar = group.append('rect')
                    .attr('x', barInfo.x)
                    .attr('y', (this.config.rowHeight - barHeight) / 2)
                    .attr('width', Math.max(barInfo.width, 6))
                    .attr('height', barHeight)
                    .attr('rx', 3)
                    .attr('class', `gantt-bar ${row.phaseType}`);

                // Color based on phase type
                const colors = {
                    'pre-prod': '#3b82f6',
                    'key-date': '#f59e0b',
                    'post-prod': '#10b981'
                };

                bar.attr('fill', colors[row.phaseType] || '#6366f1');

                // Tooltip
                bar.append('title')
                    .text(`${row.name}\n${this.formatDate(row.startDate)} - ${this.formatDate(row.endDate)}`);
            }
        }
    },

    /**
     * Calculate bar position based on dates
     */
    calculateBarPosition(startDate, endDate, months, monthWidth) {
        if (!startDate) return null;

        const startMonth = startDate.getMonth();
        const startDay = startDate.getDate();
        const endMonth = endDate ? endDate.getMonth() : startMonth;
        const endDay = endDate ? endDate.getDate() : startDay;

        // Calculate x position
        const daysInStartMonth = new Date(this.config.year, startMonth + 1, 0).getDate();
        const startOffset = ((startDay - 1) / daysInStartMonth) * monthWidth;
        const x = this.config.labelWidth + (startMonth * monthWidth) + startOffset;

        // Calculate width
        let width;
        if (startMonth === endMonth) {
            const daysDiff = endDay - startDay + 1;
            width = (daysDiff / daysInStartMonth) * monthWidth;
        } else {
            // Spans multiple months
            const daysInEndMonth = new Date(this.config.year, endMonth + 1, 0).getDate();
            const remainingStartDays = daysInStartMonth - startDay + 1;
            const fullMonths = endMonth - startMonth - 1;

            width = (remainingStartDays / daysInStartMonth) * monthWidth +
                (fullMonths * monthWidth) +
                (endDay / daysInEndMonth) * monthWidth;
        }

        return { x, width: Math.max(width, 4) };
    },

    /**
     * Render today line
     */
    renderTodayLine(months, monthWidth) {
        const today = new Date();
        if (today.getFullYear() !== this.config.year) return;

        const month = today.getMonth();
        const day = today.getDate();
        const daysInMonth = new Date(this.config.year, month + 1, 0).getDate();

        const x = this.config.labelWidth + (month * monthWidth) + ((day / daysInMonth) * monthWidth);

        this.svg.append('line')
            .attr('x1', x)
            .attr('y1', 0)
            .attr('x2', x)
            .attr('y2', '100%')
            .attr('stroke', '#ef4444')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '4,4');

        // Today marker
        this.svg.append('circle')
            .attr('cx', x)
            .attr('cy', this.config.rowHeight / 2)
            .attr('r', 6)
            .attr('fill', '#ef4444');
    },

    /**
     * Show project details in panel
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
                ${project.confirmedDate ? `
                <div class="detail-value">
                    <span class="detail-label">Confirmada:</span> ${this.formatDate(project.confirmedDate)}
                </div>
                ` : ''}
            </div>

            <div class="detail-section">
                <h4>Equipos Asignados</h4>
                <div class="team-badges">
                    ${project.teams.length > 0 ?
                project.teams.map(team => `<span class="team-badge">${team}</span>`).join('') :
                '<span class="detail-value">Sin equipos asignados</span>'
            }
                </div>
            </div>

            ${project.tasks ? `
            <div class="detail-section">
                <h4>Tareas</h4>
                <div class="detail-value">${project.tasks}</div>
            </div>
            ` : ''}

            ${project.clickUpLink ? `
            <div class="detail-section">
                <h4>ClickUp</h4>
                <a href="${project.clickUpLink}" target="_blank" class="detail-value" style="color: #818cf8; text-decoration: underline;">
                    Ver en ClickUp
                </a>
            </div>
            ` : ''}

            <div class="detail-section">
                <h4>Fases del Proyecto</h4>
                <div class="phase-timeline">
                    <div class="phase-item">
                        <span class="phase-indicator pre-prod"></span>
                        <div class="phase-info">
                            <div class="phase-name">Pre-producción</div>
                            <div class="phase-dates">Planificación y preparación</div>
                        </div>
                    </div>
                    <div class="phase-item">
                        <span class="phase-indicator key-date"></span>
                        <div class="phase-info">
                            <div class="phase-name">Key Date</div>
                            <div class="phase-dates">Evento o entrega principal</div>
                        </div>
                    </div>
                    <div class="phase-item">
                        <span class="phase-indicator post-prod"></span>
                        <div class="phase-info">
                            <div class="phase-name">Post-producción</div>
                            <div class="phase-dates">Seguimiento y cierre</div>
                        </div>
                    </div>
                </div>
            </div>
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
     * Truncate text
     */
    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
};
