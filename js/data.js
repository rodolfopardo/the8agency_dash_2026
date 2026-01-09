/**
 * 8Agency Dashboard - Data Management
 * Connection to Google Sheets with auto-refresh
 */

const DataManager = {
    SHEET_ID: '16XAAmoyXR1xmhSvEbHiEGzIPgvrD7eKUOaX38gxwzrw',
    CACHE_KEY: '8agency_data_cache',
    CACHE_DURATION: 5 * 60 * 1000,
    REFRESH_INTERVAL: 5 * 60 * 1000,

    rawData: [],
    projects: [],
    teams: [],
    clients: [],
    types: [],
    projectsByClient: {},

    onDataLoaded: null,
    onDataError: null,

    async init(onLoaded, onError) {
        this.onDataLoaded = onLoaded;
        this.onDataError = onError;

        const cached = this.loadFromCache();
        if (cached) {
            this.processData(cached);
            if (this.onDataLoaded) this.onDataLoaded(this.getProcessedData());
        }

        await this.fetchData();
        this.startAutoRefresh();
    },

    async fetchData() {
        return new Promise((resolve) => {
            const callbackName = 'googleSheetsCallback_' + Date.now();
            const url = `https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/gviz/tq?tqx=out:json;responseHandler:${callbackName}`;

            window[callbackName] = (response) => {
                delete window[callbackName];
                if (script.parentNode) script.parentNode.removeChild(script);

                try {
                    if (response && response.table && response.table.rows) {
                        this.rawData = this.parseGoogleSheetsData(response.table);
                        this.saveToCache(this.rawData);
                        this.processData(this.rawData);
                        if (this.onDataLoaded) this.onDataLoaded(this.getProcessedData());
                        this.updateLastRefresh();
                    }
                } catch (error) {
                    console.error('Parse error:', error);
                    this.loadFallbackData();
                }
                resolve();
            };

            const script = document.createElement('script');
            script.src = url;
            script.onerror = () => {
                delete window[callbackName];
                if (script.parentNode) script.parentNode.removeChild(script);
                this.loadFallbackData();
                resolve();
            };

            setTimeout(() => {
                if (window[callbackName]) {
                    delete window[callbackName];
                    if (script.parentNode) script.parentNode.removeChild(script);
                    this.loadFallbackData();
                    resolve();
                }
            }, 10000);

            document.head.appendChild(script);
        });
    },

    loadFallbackData() {
        const cached = this.loadFromCache();
        if (cached && cached.length > 0) {
            this.processData(cached);
            if (this.onDataLoaded) this.onDataLoaded(this.getProcessedData());
            this.updateLastRefresh();
            return;
        }

        // Demo data
        const demoData = [
            { 'Cliente': 'Google Public Sector', 'Proyecto': 'Account Onboarding', 'Línea / Tipo': 'Always On', 'Fase': 'Planning', 'Fecha de Inicio': '1-Jan-2026', 'Fecha Finalización': '31-Jan-2026', 'Equipo Content': 'Aplica', 'Equipo Diseño': 'Aplica', 'Equipo Strategy': 'Aplica' },
            { 'Cliente': 'Google Public Sector', 'Proyecto': 'Strategy Approval', 'Línea / Tipo': 'Always On', 'Fase': 'Planning', 'Fecha de Inicio': '1-Feb-2026', 'Fecha Finalización': '28-Feb-2026', 'Equipo Content': 'Aplica', 'Equipo Strategy': 'Aplica' },
            { 'Cliente': 'Google Public Sector', 'Proyecto': 'Channel Activation', 'Línea / Tipo': 'Always On', 'Fase': 'Production', 'Fecha de Inicio': '1-Mar-2026', 'Fecha Finalización': '30-Jun-2026', 'Equipo Content': 'Aplica', 'Equipo Diseño': 'Aplica', 'Equipo Video': 'Aplica', 'Equipo Social Media': 'Aplica' },
            { 'Cliente': 'Google Public Sector', 'Proyecto': 'Google Next', 'Línea / Tipo': 'Evento', 'Fase': 'Pre-production', 'Fecha de Inicio': '1-Mar-2026', 'Fecha Finalización': '24-Apr-2026', 'Fecha confirmada': '22-Apr-2026', 'Equipo Content': 'Aplica', 'Equipo Diseño': 'Aplica', 'Equipo Video': 'Aplica', 'Equipo Dev': 'Aplica', 'Equipo Strategy': 'Aplica' },
            { 'Cliente': 'Google Public Sector', 'Proyecto': 'Public Sector Summit', 'Línea / Tipo': 'Evento', 'Fase': 'Planning', 'Fecha de Inicio': '1-Aug-2026', 'Fecha Finalización': '15-Oct-2026', 'Equipo Content': 'Aplica', 'Equipo Diseño': 'Aplica', 'Equipo Video': 'Aplica', 'Equipo Strategy': 'Aplica' },
            { 'Cliente': 'Localiza', 'Proyecto': 'Campaña Mundial', 'Línea / Tipo': 'Campaña', 'Fase': 'Production', 'Fecha de Inicio': '15-Jan-2026', 'Fecha Finalización': '28-Feb-2026', 'Equipo Content': 'Aplica', 'Equipo Diseño': 'Aplica', 'Equipo Video': 'Aplica', 'Equipo Social Media': 'Aplica', 'Equipo Field Marketing': 'Aplica' },
            { 'Cliente': 'Localiza', 'Proyecto': 'Semana Santa', 'Línea / Tipo': 'Campaña', 'Fase': 'Pre-production', 'Fecha de Inicio': '1-Mar-2026', 'Fecha Finalización': '15-Apr-2026', 'Equipo Content': 'Aplica', 'Equipo Diseño': 'Aplica', 'Equipo Video': 'Aplica', 'Equipo Social Media': 'Aplica' },
            { 'Cliente': 'Localiza', 'Proyecto': 'Tianguis Turístico', 'Línea / Tipo': 'Evento', 'Fase': 'Planning', 'Fecha de Inicio': '1-May-2026', 'Fecha Finalización': '30-May-2026', 'Equipo Diseño': 'Aplica', 'Equipo Social Media': 'Aplica', 'Equipo Field Marketing': 'Aplica', 'Equipo Strategy': 'Aplica' }
        ];

        this.rawData = demoData;
        this.processData(demoData);
        if (this.onDataLoaded) this.onDataLoaded(this.getProcessedData());
        this.updateLastRefresh();
    },

    parseGoogleSheetsData(table) {
        const headers = table.cols.map(col => (col.label || '').trim());
        const rows = [];

        table.rows.forEach(row => {
            if (!row.c) return;
            const rowData = {};
            row.c.forEach((cell, index) => {
                if (headers[index]) {
                    // For dates, prefer formatted value (f), fallback to raw value (v)
                    let value = '';
                    if (cell) {
                        value = cell.f !== undefined && cell.f !== null ? cell.f : (cell.v || '');
                    }
                    rowData[headers[index]] = value;
                }
            });
            rows.push(rowData);
        });

        return rows;
    },

    // Helper to find column value with flexible matching
    getColumnValue(row, possibleNames) {
        for (const name of possibleNames) {
            if (row[name] !== undefined && row[name] !== '') {
                return row[name];
            }
        }
        // Try partial match
        const keys = Object.keys(row);
        for (const name of possibleNames) {
            const found = keys.find(k => k.toLowerCase().includes(name.toLowerCase()));
            if (found && row[found] !== '') {
                return row[found];
            }
        }
        return '';
    },

    processData(data) {
        this.projects = [];
        this.teams = new Set();
        this.clients = new Set();
        this.types = new Set();

        const teamColumns = ['Equipo Content', 'Equipo Diseño', 'Equipo Video', 'Equipo Dev', 'Equipo Traducciones', 'Equipo Social Media', 'Equipo Field Marketing', 'Equipo Strategy'];

        data.forEach((row, index) => {
            const client = this.getColumnValue(row, ['Cliente', 'Client', 'cliente']);
            const projectName = this.getColumnValue(row, ['Proyecto', 'Project', 'proyecto', 'Nombre']);

            if (!client && !projectName) return;

            const startDateStr = this.getColumnValue(row, ['Fecha de Inicio', 'Fecha Inicio', 'Start Date', 'Inicio', 'FechaInicio']);
            const endDateStr = this.getColumnValue(row, ['Fecha Finalización', 'Fecha Finalizacion', 'Fecha Fin', 'End Date', 'Fin', 'FechaFin']);

            const startDate = this.parseDate(startDateStr);
            const endDate = this.parseDate(endDateStr);

            const project = {
                id: index,
                client: client,
                name: projectName,
                type: this.getColumnValue(row, ['Línea / Tipo', 'Linea / Tipo', 'Tipo', 'Type', 'Línea']),
                phase: this.getColumnValue(row, ['Fase', 'Phase', 'Estado']),
                tasks: this.getColumnValue(row, ['Tareas', 'Tasks', 'Descripción']),
                startDate: startDate,
                endDate: endDate,
                confirmedDate: this.parseDate(this.getColumnValue(row, ['Fecha confirmada', 'Key Date', 'Confirmada'])),
                clickUpLink: this.getColumnValue(row, ['Link Click Up', 'ClickUp', 'Link']),
                teams: []
            };

            teamColumns.forEach(teamCol => {
                const value = row[teamCol];
                if (value && (value.toLowerCase() === 'aplica' || value === true || value === 'TRUE')) {
                    const teamName = teamCol.replace('Equipo ', '');
                    project.teams.push(teamName);
                    this.teams.add(teamName);
                }
            });

            if (project.client) this.clients.add(project.client);
            if (project.type) this.types.add(project.type);

            this.projects.push(project);
        });

        this.teams = Array.from(this.teams);
        this.clients = Array.from(this.clients);
        this.types = Array.from(this.types);
        this.projectsByClient = this.groupByClient(this.projects);

    },

    parseDate(dateStr) {
        if (!dateStr) return null;
        dateStr = String(dateStr).trim();
        if (!dateStr) return null;

        // Format 1: Google Sheets "Date(2026,0,1)" format
        const dateMatch = dateStr.match(/^Date\((\d{4}),(\d{1,2}),(\d{1,2})\)$/);
        if (dateMatch) {
            const year = parseInt(dateMatch[1]);
            const month = parseInt(dateMatch[2]); // Already 0-indexed
            const day = parseInt(dateMatch[3]);
            return new Date(year, month, day);
        }

        // Format 2: "1-Jan-2026" or "15-Feb-2026"
        const monthMap = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 };
        const textMatch = dateStr.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
        if (textMatch) {
            const day = parseInt(textMatch[1]);
            const month = monthMap[textMatch[2]];
            const year = parseInt(textMatch[3]);
            if (month !== undefined) {
                return new Date(year, month, day);
            }
        }

        // Format 3: "DD/MM/YYYY" or "D/M/YYYY"
        const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (slashMatch) {
            const day = parseInt(slashMatch[1]);
            const month = parseInt(slashMatch[2]) - 1;
            const year = parseInt(slashMatch[3]);
            return new Date(year, month, day);
        }

        // Fallback: try native parsing
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
    },

    groupByClient(projects) {
        const grouped = {};
        projects.forEach(project => {
            const client = project.client || 'Sin Cliente';
            if (!grouped[client]) grouped[client] = [];
            grouped[client].push(project);
        });
        return grouped;
    },

    getProcessedData() {
        return {
            projects: this.projects,
            projectsByClient: this.projectsByClient,
            teams: this.teams,
            clients: this.clients,
            types: this.types,
            lastUpdate: new Date()
        };
    },

    filterProjects(filters = {}) {
        let filtered = [...this.projects];

        if (filters.client) {
            filtered = filtered.filter(p => p.client === filters.client);
        }
        if (filters.team) {
            filtered = filtered.filter(p => p.teams.includes(filters.team));
        }
        if (filters.type) {
            filtered = filtered.filter(p => p.type === filters.type);
        }
        if (filters.phase) {
            filtered = filtered.filter(p => p.phase === filters.phase);
        }
        if (filters.month) {
            const month = parseInt(filters.month);
            filtered = filtered.filter(p => {
                if (!p.startDate) return false;
                const startMonth = p.startDate.getMonth() + 1;
                const endMonth = p.endDate ? p.endDate.getMonth() + 1 : startMonth;
                return month >= startMonth && month <= endMonth;
            });
        }

        return filtered;
    },

    getWorkloadData(filters = {}, viewMode = 'month') {
        const isQuarter = viewMode === 'quarter';
        const labels = isQuarter
            ? ['Q1', 'Q2', 'Q3', 'Q4']
            : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        const filtered = this.filterProjects(filters);

        // Determine which teams to show
        let teamsToShow = new Set();
        filtered.forEach(p => p.teams.forEach(t => teamsToShow.add(t)));
        if (filters.team) teamsToShow = new Set([filters.team]);
        if (teamsToShow.size === 0) teamsToShow = new Set(this.teams);

        const periodCount = isQuarter ? 4 : 12;
        const workload = {};
        teamsToShow.forEach(team => {
            workload[team] = new Array(periodCount).fill(0);
        });

        filtered.forEach(project => {
            if (!project.startDate) return;

            if (isQuarter) {
                // Quarter view: count project in each quarter it spans
                const startQuarter = Math.floor(project.startDate.getMonth() / 3);
                const endQuarter = project.endDate ? Math.floor(project.endDate.getMonth() / 3) : startQuarter;

                project.teams.forEach(team => {
                    if (!workload[team]) return;
                    for (let q = startQuarter; q <= endQuarter; q++) {
                        workload[team][q]++;
                    }
                });
            } else {
                // Month view: count project in each month it spans
                const startMonth = project.startDate.getMonth();
                const endMonth = project.endDate ? project.endDate.getMonth() : startMonth;

                project.teams.forEach(team => {
                    if (!workload[team]) return;
                    for (let m = startMonth; m <= endMonth; m++) {
                        workload[team][m]++;
                    }
                });
            }
        });

        return { labels: labels, teams: workload };
    },

    getHeatmapData(filters = {}) {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const filtered = this.filterProjects(filters);

        let teamsToShow = [];
        if (filters.team) {
            teamsToShow = [filters.team];
        } else {
            const teamsSet = new Set();
            filtered.forEach(p => p.teams.forEach(t => teamsSet.add(t)));
            teamsToShow = teamsSet.size > 0 ? Array.from(teamsSet) : this.teams;
        }

        const heatmap = [];
        teamsToShow.forEach((team, teamIndex) => {
            months.forEach((month, monthIndex) => {
                let count = 0;
                filtered.forEach(project => {
                    if (!project.teams.includes(team) || !project.startDate) return;
                    const startMonth = project.startDate.getMonth();
                    const endMonth = project.endDate ? project.endDate.getMonth() : startMonth;
                    if (monthIndex >= startMonth && monthIndex <= endMonth) count++;
                });
                heatmap.push({ team, month, monthIndex, teamIndex, value: count });
            });
        });

        return {
            data: heatmap,
            teams: teamsToShow,
            months: months,
            maxValue: Math.max(...heatmap.map(h => h.value), 1)
        };
    },

    saveToCache(data) {
        try {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
        } catch (e) { }
    },

    loadFromCache() {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < this.CACHE_DURATION) return data;
            }
        } catch (e) { }
        return null;
    },

    startAutoRefresh() {
        setInterval(() => this.fetchData(), this.REFRESH_INTERVAL);
    },

    async refresh() {
        await this.fetchData();
    },

    updateLastRefresh() {
        const el = document.getElementById('lastUpdate');
        if (el) {
            el.textContent = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        }
    }
};
