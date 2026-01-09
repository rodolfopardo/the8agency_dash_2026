/**
 * 8Agency Dashboard - Gantt Chart
 * Professional hierarchical Gantt with colored bars
 */

const GanttChart = {
    config: {
        rowHeight: 40,
        labelWidth: 280,
        barHeight: 22,
        year: 2026
    },

    expandedClients: new Set(),
    zoomLevel: 100,

    projectColors: ['#f59e0b', '#22c55e', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4'],

    data: null,
    filteredData: null,
    container: null,

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        document.getElementById('zoomIn')?.addEventListener('click', () => this.zoom(10));
        document.getElementById('zoomOut')?.addEventListener('click', () => this.zoom(-10));
    },

    zoom(delta) {
        this.zoomLevel = Math.max(50, Math.min(200, this.zoomLevel + delta));
        document.getElementById('zoomLevel').textContent = `${this.zoomLevel}%`;
        this.render();
    },

    setData(data) {
        this.data = data;
        this.filteredData = data.projectsByClient;
        // Expand all clients by default
        Object.keys(this.filteredData).forEach(client => this.expandedClients.add(client));
        this.render();
    },

    filter(filters) {
        if (!this.data) return;
        const filtered = DataManager.filterProjects(filters);
        this.filteredData = {};
        filtered.forEach(project => {
            const client = project.client || 'Sin Cliente';
            if (!this.filteredData[client]) this.filteredData[client] = [];
            this.filteredData[client].push(project);
        });
        this.render();
    },

    render() {
        if (!this.container || !this.filteredData) return;
        this.container.innerHTML = '';

        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const monthWidth = (80 * this.zoomLevel) / 100;
        const totalWidth = this.config.labelWidth + (months.length * monthWidth);

        const wrapper = document.createElement('div');
        wrapper.className = 'gantt-wrapper';
        wrapper.style.cssText = `min-width: ${totalWidth}px; position: relative;`;

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'display: flex; background: #334155; border-bottom: 2px solid #475569; position: sticky; top: 0; z-index: 10;';

        const headerLabel = document.createElement('div');
        headerLabel.style.cssText = `width: ${this.config.labelWidth}px; min-width: ${this.config.labelWidth}px; padding: 12px 16px; font-weight: 600; font-size: 14px; color: #f8fafc; border-right: 1px solid #475569;`;
        headerLabel.textContent = 'Proyecto';
        header.appendChild(headerLabel);

        const headerTimeline = document.createElement('div');
        headerTimeline.style.cssText = 'display: flex; flex: 1;';

        const currentMonth = new Date().getMonth();
        months.forEach((month, i) => {
            const monthEl = document.createElement('div');
            const isCurrent = i === currentMonth;
            monthEl.style.cssText = `width: ${monthWidth}px; min-width: ${monthWidth}px; padding: 12px 4px; text-align: center; font-size: 12px; font-weight: 500; color: ${isCurrent ? '#818cf8' : '#94a3b8'}; border-right: 1px solid #475569; background: ${isCurrent ? 'rgba(99, 102, 241, 0.15)' : 'transparent'};`;
            monthEl.textContent = month;
            headerTimeline.appendChild(monthEl);
        });
        header.appendChild(headerTimeline);
        wrapper.appendChild(header);

        // Body
        const body = document.createElement('div');
        body.style.cssText = 'position: relative;';

        let colorIndex = 0;
        Object.entries(this.filteredData).forEach(([client, projects]) => {
            const clientColor = this.projectColors[colorIndex % this.projectColors.length];
            colorIndex++;

            // Client row
            const clientRow = this.createRow(client, 'client', clientColor, projects.length, months, monthWidth, projects);
            body.appendChild(clientRow);

            // Project rows if expanded
            if (this.expandedClients.has(client)) {
                projects.forEach((project, pIndex) => {
                    const projectColor = this.adjustColor(clientColor, pIndex * 15);
                    const projectRow = this.createRow(project.name, 'project', projectColor, 0, months, monthWidth, null, project);
                    body.appendChild(projectRow);
                });
            }
        });

        wrapper.appendChild(body);

        // Today line
        this.addTodayLine(wrapper, monthWidth);

        this.container.appendChild(wrapper);
    },

    createRow(name, type, color, count, months, monthWidth, clientProjects, project) {
        const row = document.createElement('div');
        row.style.cssText = `display: flex; border-bottom: 1px solid #334155; min-height: ${this.config.rowHeight}px; background: ${type === 'client' ? '#1e293b' : '#0f172a'};`;

        // Label
        const label = document.createElement('div');
        const paddingLeft = type === 'client' ? 16 : 40;
        label.style.cssText = `width: ${this.config.labelWidth}px; min-width: ${this.config.labelWidth}px; padding: 8px 12px 8px ${paddingLeft}px; display: flex; align-items: center; gap: 8px; background: #334155; border-right: 1px solid #475569;`;

        // Expand button for clients
        if (type === 'client') {
            const btn = document.createElement('button');
            const isExpanded = this.expandedClients.has(name);
            btn.style.cssText = `background: none; border: none; color: #94a3b8; cursor: pointer; padding: 2px; display: flex; transform: rotate(${isExpanded ? '90deg' : '0deg'}); transition: transform 0.2s;`;
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';
            btn.onclick = () => {
                if (this.expandedClients.has(name)) {
                    this.expandedClients.delete(name);
                } else {
                    this.expandedClients.add(name);
                }
                this.render();
            };
            label.appendChild(btn);
        }

        // Color dot
        const dot = document.createElement('span');
        dot.style.cssText = `width: 8px; height: 8px; border-radius: 50%; background: ${color}; flex-shrink: 0;`;
        label.appendChild(dot);

        // Name
        const nameEl = document.createElement('span');
        nameEl.style.cssText = `flex: 1; font-size: ${type === 'client' ? '14px' : '13px'}; font-weight: ${type === 'client' ? '600' : '500'}; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
        nameEl.textContent = name || 'Sin nombre';
        label.appendChild(nameEl);

        // Count badge for clients
        if (type === 'client' && count > 0) {
            const badge = document.createElement('span');
            badge.style.cssText = 'background: #6366f1; color: white; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px;';
            badge.textContent = count;
            label.appendChild(badge);
        }

        row.appendChild(label);

        // Timeline
        const timeline = document.createElement('div');
        timeline.style.cssText = 'flex: 1; position: relative; display: flex;';

        // Grid
        months.forEach((_, i) => {
            const gridCell = document.createElement('div');
            const isCurrent = i === new Date().getMonth();
            gridCell.style.cssText = `width: ${monthWidth}px; min-width: ${monthWidth}px; border-right: 1px solid #334155; background: ${isCurrent ? 'rgba(99, 102, 241, 0.05)' : 'transparent'};`;
            timeline.appendChild(gridCell);
        });

        // Bar
        if (type === 'project' && project && project.startDate) {
            const bar = this.createBar(project, color, monthWidth);
            if (bar) timeline.appendChild(bar);
        } else if (type === 'client' && clientProjects) {
            const bar = this.createClientBar(clientProjects, color, monthWidth);
            if (bar) timeline.appendChild(bar);
        }

        row.appendChild(timeline);
        return row;
    },

    createBar(project, color, monthWidth) {
        const pos = this.calcPosition(project.startDate, project.endDate, monthWidth);
        if (!pos) return null;

        const bar = document.createElement('div');
        bar.style.cssText = `
            position: absolute;
            left: ${pos.left}px;
            width: ${Math.max(pos.width, 10)}px;
            height: ${this.config.barHeight}px;
            top: 50%;
            transform: translateY(-50%);
            background: linear-gradient(135deg, ${color} 0%, ${this.darken(color, 20)} 100%);
            border-radius: 4px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            padding: 0 8px;
            overflow: hidden;
            transition: all 0.2s;
        `;

        if (pos.width > 60) {
            const label = document.createElement('span');
            label.style.cssText = 'font-size: 11px; font-weight: 500; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 1px 2px rgba(0,0,0,0.3);';
            label.textContent = project.name;
            bar.appendChild(label);
        }

        bar.title = `${project.name}\n${this.formatDate(project.startDate)} - ${this.formatDate(project.endDate)}`;

        bar.onmouseenter = () => { bar.style.transform = 'translateY(-50%) scale(1.02)'; bar.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)'; };
        bar.onmouseleave = () => { bar.style.transform = 'translateY(-50%)'; bar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'; };
        bar.onclick = () => this.showDetails(project);

        return bar;
    },

    createClientBar(projects, color, monthWidth) {
        let minStart = null, maxEnd = null;
        projects.forEach(p => {
            if (p.startDate && (!minStart || p.startDate < minStart)) minStart = p.startDate;
            if (p.endDate && (!maxEnd || p.endDate > maxEnd)) maxEnd = p.endDate;
        });

        if (!minStart) return null;

        const pos = this.calcPosition(minStart, maxEnd || minStart, monthWidth);
        if (!pos) return null;

        const bar = document.createElement('div');
        bar.style.cssText = `
            position: absolute;
            left: ${pos.left}px;
            width: ${Math.max(pos.width, 10)}px;
            height: ${this.config.barHeight + 4}px;
            top: 50%;
            transform: translateY(-50%);
            background: linear-gradient(135deg, ${color} 0%, ${this.darken(color, 25)} 100%);
            border-radius: 6px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            padding: 0 10px;
            overflow: hidden;
        `;

        if (pos.width > 80) {
            const label = document.createElement('span');
            label.style.cssText = 'font-size: 12px; font-weight: 600; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 1px 2px rgba(0,0,0,0.4);';
            label.textContent = `${projects.length} proyectos`;
            bar.appendChild(label);
        }

        return bar;
    },

    calcPosition(startDate, endDate, monthWidth) {
        if (!startDate) return null;

        const startMonth = startDate.getMonth();
        const startDay = startDate.getDate();
        const endMonth = endDate ? endDate.getMonth() : startMonth;
        const endDay = endDate ? endDate.getDate() : startDay;

        const daysInStartMonth = new Date(this.config.year, startMonth + 1, 0).getDate();
        const left = (startMonth * monthWidth) + ((startDay - 1) / daysInStartMonth) * monthWidth;

        let width;
        if (startMonth === endMonth) {
            width = ((endDay - startDay + 1) / daysInStartMonth) * monthWidth;
        } else {
            const daysInEndMonth = new Date(this.config.year, endMonth + 1, 0).getDate();
            const startPart = ((daysInStartMonth - startDay + 1) / daysInStartMonth) * monthWidth;
            const endPart = (endDay / daysInEndMonth) * monthWidth;
            const middleMonths = (endMonth - startMonth - 1) * monthWidth;
            width = startPart + middleMonths + endPart;
        }

        return { left, width: Math.max(width, 4) };
    },

    addTodayLine(wrapper, monthWidth) {
        const today = new Date();
        if (today.getFullYear() !== this.config.year) return;

        const month = today.getMonth();
        const day = today.getDate();
        const daysInMonth = new Date(this.config.year, month + 1, 0).getDate();
        const left = this.config.labelWidth + (month * monthWidth) + ((day / daysInMonth) * monthWidth);

        const line = document.createElement('div');
        line.style.cssText = `position: absolute; left: ${left}px; top: 0; bottom: 0; width: 2px; z-index: 5; pointer-events: none; background: repeating-linear-gradient(to bottom, #ef4444 0, #ef4444 4px, transparent 4px, transparent 8px);`;
        wrapper.appendChild(line);
    },

    showDetails(project) {
        const panel = document.getElementById('detailPanel');
        const content = document.getElementById('panelContent');
        if (!panel || !content) return;

        content.innerHTML = `
            <div class="detail-section"><h4>Proyecto</h4><div class="detail-value">${project.name || 'Sin nombre'}</div></div>
            <div class="detail-section"><h4>Cliente</h4><div class="detail-value">${project.client || 'Sin cliente'}</div></div>
            <div class="detail-section"><h4>Tipo</h4><div class="detail-value">${project.type || 'Sin tipo'}</div></div>
            <div class="detail-section">
                <h4>Fechas</h4>
                <div class="detail-value"><span class="detail-label">Inicio:</span> ${this.formatDate(project.startDate) || 'No definida'}</div>
                <div class="detail-value"><span class="detail-label">Fin:</span> ${this.formatDate(project.endDate) || 'No definida'}</div>
            </div>
            <div class="detail-section">
                <h4>Equipos</h4>
                <div class="team-badges">${project.teams?.length > 0 ? project.teams.map(t => `<span class="team-badge">${t}</span>`).join('') : 'Sin equipos'}</div>
            </div>
        `;

        panel.classList.add('open');
        document.getElementById('overlay')?.classList.add('active');
    },

    formatDate(date) {
        if (!date) return null;
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    },

    adjustColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + amount));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + amount));
        const b = Math.min(255, Math.max(0, (num & 0xFF) + amount));
        return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
    },

    darken(color, amount) {
        return this.adjustColor(color, -amount);
    }
};
