/**
 * 8Agency Dashboard - Data Management
 * Connection to Google Sheets with auto-refresh
 * Uses JSONP to avoid CORS issues
 */

const DataManager = {
    // Google Sheet configuration
    SHEET_ID: '16XAAmoyXR1xmhSvEbHiEGzIPgvrD7eKUOaX38gxwzrw',

    // Cache configuration
    CACHE_KEY: '8agency_data_cache',
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes

    // Auto-refresh interval (in milliseconds)
    REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes

    // Parsed data
    rawData: [],
    projects: [],
    teams: [],
    clients: [],
    types: [],

    // Callbacks
    onDataLoaded: null,
    onDataError: null,

    /**
     * Initialize data manager
     */
    async init(onLoaded, onError) {
        this.onDataLoaded = onLoaded;
        this.onDataError = onError;

        // Try to load from cache first
        const cached = this.loadFromCache();
        if (cached) {
            console.log('Loading from cache...');
            this.processData(cached);
            if (this.onDataLoaded) this.onDataLoaded(this.getProcessedData());
        }

        // Fetch fresh data
        await this.fetchData();

        // Setup auto-refresh
        this.startAutoRefresh();
    },

    /**
     * Fetch data using JSONP (no CORS issues)
     */
    async fetchData() {
        return new Promise((resolve) => {
            const callbackName = 'googleSheetsCallback_' + Date.now();
            const url = `https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/gviz/tq?tqx=out:json;responseHandler:${callbackName}`;

            // Create callback function
            window[callbackName] = (response) => {
                // Cleanup
                delete window[callbackName];
                document.head.removeChild(script);

                try {
                    if (response && response.table && response.table.rows) {
                        console.log('Data loaded from Google Sheets');
                        this.rawData = this.parseGoogleSheetsData(response.table);
                        this.saveToCache(this.rawData);
                        this.processData(this.rawData);

                        if (this.onDataLoaded) {
                            this.onDataLoaded(this.getProcessedData());
                        }

                        this.updateLastRefresh();
                    } else {
                        throw new Error('Invalid response structure');
                    }
                } catch (error) {
                    console.error('Error parsing response:', error);
                    this.loadFallbackData();
                }
                resolve();
            };

            // Create script tag for JSONP
            const script = document.createElement('script');
            script.src = url;
            script.onerror = () => {
                console.error('JSONP request failed');
                delete window[callbackName];
                document.head.removeChild(script);
                this.loadFallbackData();
                resolve();
            };

            // Timeout fallback
            setTimeout(() => {
                if (window[callbackName]) {
                    console.warn('Request timeout, using fallback data');
                    delete window[callbackName];
                    if (script.parentNode) {
                        document.head.removeChild(script);
                    }
                    this.loadFallbackData();
                    resolve();
                }
            }, 10000); // 10 second timeout

            document.head.appendChild(script);
        });
    },

    /**
     * Load fallback/demo data when Sheet is unavailable
     */
    loadFallbackData() {
        console.log('Loading fallback demo data...');

        // Check cache first
        const cached = this.loadFromCache();
        if (cached && cached.length > 0) {
            this.processData(cached);
            if (this.onDataLoaded) {
                this.onDataLoaded(this.getProcessedData());
            }
            this.updateLastRefresh();
            return;
        }

        // Demo data based on actual Sheet structure
        const demoData = [
            {
                'Cliente': 'Google Public Sector',
                'Proyecto': 'Account Onboarding',
                'Línea / Tipo': 'Always On',
                'Fase': 'Planning',
                'Tareas': 'Onboarding inicial del cliente',
                'Fecha de Inicio': '1-Jan-2026',
                'Fecha Finalización': '31-Jan-2026',
                'Fecha confirmada': '',
                'Link Click Up': '',
                'Equipo Content': 'Aplica',
                'Equipo Diseño': 'Aplica',
                'Equipo Video': 'No Aplica',
                'Equipo Dev': 'No Aplica',
                'Equipo Traducciones': 'No Aplica',
                'Equipo Social Media': 'No Aplica',
                'Equipo Field Marketing': 'No Aplica',
                'Equipo Strategy': 'Aplica'
            },
            {
                'Cliente': 'Google Public Sector',
                'Proyecto': 'Strategy Approval',
                'Línea / Tipo': 'Always On',
                'Fase': 'Planning',
                'Tareas': 'Workshops de estrategia y aprobación',
                'Fecha de Inicio': '1-Feb-2026',
                'Fecha Finalización': '28-Feb-2026',
                'Fecha confirmada': '',
                'Link Click Up': '',
                'Equipo Content': 'Aplica',
                'Equipo Diseño': 'No Aplica',
                'Equipo Video': 'No Aplica',
                'Equipo Dev': 'No Aplica',
                'Equipo Traducciones': 'No Aplica',
                'Equipo Social Media': 'No Aplica',
                'Equipo Field Marketing': 'No Aplica',
                'Equipo Strategy': 'Aplica'
            },
            {
                'Cliente': 'Google Public Sector',
                'Proyecto': 'Channel Activation',
                'Línea / Tipo': 'Always On',
                'Fase': 'Production',
                'Tareas': 'Activación de contenido en canales',
                'Fecha de Inicio': '1-Mar-2026',
                'Fecha Finalización': '30-Jun-2026',
                'Fecha confirmada': '',
                'Link Click Up': '',
                'Equipo Content': 'Aplica',
                'Equipo Diseño': 'Aplica',
                'Equipo Video': 'Aplica',
                'Equipo Dev': 'No Aplica',
                'Equipo Traducciones': 'No Aplica',
                'Equipo Social Media': 'Aplica',
                'Equipo Field Marketing': 'No Aplica',
                'Equipo Strategy': 'No Aplica'
            },
            {
                'Cliente': 'Google Public Sector',
                'Proyecto': 'Google Next',
                'Línea / Tipo': 'Evento',
                'Fase': 'Pre-production',
                'Tareas': 'Preparación para evento Google Next',
                'Fecha de Inicio': '1-Mar-2026',
                'Fecha Finalización': '24-Apr-2026',
                'Fecha confirmada': '22-Apr-2026',
                'Link Click Up': '',
                'Equipo Content': 'Aplica',
                'Equipo Diseño': 'Aplica',
                'Equipo Video': 'Aplica',
                'Equipo Dev': 'Aplica',
                'Equipo Traducciones': 'Aplica',
                'Equipo Social Media': 'Aplica',
                'Equipo Field Marketing': 'Aplica',
                'Equipo Strategy': 'Aplica'
            },
            {
                'Cliente': 'Google Public Sector',
                'Proyecto': 'Public Sector Summit',
                'Línea / Tipo': 'Evento',
                'Fase': 'Planning',
                'Tareas': 'Summit de sector público',
                'Fecha de Inicio': '1-Aug-2026',
                'Fecha Finalización': '15-Oct-2026',
                'Fecha confirmada': '10-Oct-2026',
                'Link Click Up': '',
                'Equipo Content': 'Aplica',
                'Equipo Diseño': 'Aplica',
                'Equipo Video': 'Aplica',
                'Equipo Dev': 'No Aplica',
                'Equipo Traducciones': 'Aplica',
                'Equipo Social Media': 'Aplica',
                'Equipo Field Marketing': 'Aplica',
                'Equipo Strategy': 'Aplica'
            },
            {
                'Cliente': 'Localiza',
                'Proyecto': 'Campaña Mundial',
                'Línea / Tipo': 'Campaña',
                'Fase': 'Production',
                'Tareas': 'Campaña publicitaria mundial',
                'Fecha de Inicio': '15-Jan-2026',
                'Fecha Finalización': '28-Feb-2026',
                'Fecha confirmada': '',
                'Link Click Up': '',
                'Equipo Content': 'Aplica',
                'Equipo Diseño': 'Aplica',
                'Equipo Video': 'Aplica',
                'Equipo Dev': 'No Aplica',
                'Equipo Traducciones': 'Aplica',
                'Equipo Social Media': 'Aplica',
                'Equipo Field Marketing': 'Aplica',
                'Equipo Strategy': 'No Aplica'
            },
            {
                'Cliente': 'Localiza',
                'Proyecto': 'Semana Santa',
                'Línea / Tipo': 'Campaña',
                'Fase': 'Pre-production',
                'Tareas': 'Campaña Semana Santa',
                'Fecha de Inicio': '1-Mar-2026',
                'Fecha Finalización': '15-Apr-2026',
                'Fecha confirmada': '10-Apr-2026',
                'Link Click Up': '',
                'Equipo Content': 'Aplica',
                'Equipo Diseño': 'Aplica',
                'Equipo Video': 'Aplica',
                'Equipo Dev': 'No Aplica',
                'Equipo Traducciones': 'No Aplica',
                'Equipo Social Media': 'Aplica',
                'Equipo Field Marketing': 'Aplica',
                'Equipo Strategy': 'No Aplica'
            },
            {
                'Cliente': 'Localiza',
                'Proyecto': 'Tianguis Turístico',
                'Línea / Tipo': 'Evento',
                'Fase': 'Planning',
                'Tareas': 'Participación en Tianguis Turístico',
                'Fecha de Inicio': '1-May-2026',
                'Fecha Finalización': '30-May-2026',
                'Fecha confirmada': '25-May-2026',
                'Link Click Up': '',
                'Equipo Content': 'No Aplica',
                'Equipo Diseño': 'Aplica',
                'Equipo Video': 'No Aplica',
                'Equipo Dev': 'No Aplica',
                'Equipo Traducciones': 'No Aplica',
                'Equipo Social Media': 'Aplica',
                'Equipo Field Marketing': 'Aplica',
                'Equipo Strategy': 'Aplica'
            }
        ];

        this.rawData = demoData;
        this.processData(demoData);

        if (this.onDataLoaded) {
            this.onDataLoaded(this.getProcessedData());
        }

        this.updateLastRefresh();

        // Show notice
        if (this.onDataError) {
            this.onDataError('Usando datos de demostración. Para datos en vivo, asegúrate de que el Sheet esté compartido públicamente.');
        }
    },

    /**
     * Parse Google Sheets JSON data
     */
    parseGoogleSheetsData(table) {
        const headers = table.cols.map(col => col.label || '');
        const rows = [];

        table.rows.forEach(row => {
            if (!row.c) return;

            const rowData = {};
            row.c.forEach((cell, index) => {
                if (headers[index]) {
                    if (cell) {
                        // Handle date values
                        if (cell.v && typeof cell.v === 'string' && cell.v.startsWith('Date(')) {
                            rowData[headers[index]] = cell.f || cell.v;
                        } else {
                            rowData[headers[index]] = cell.v !== null && cell.v !== undefined ? cell.v : (cell.f || '');
                        }
                    } else {
                        rowData[headers[index]] = '';
                    }
                }
            });
            rows.push(rowData);
        });

        return rows;
    },

    /**
     * Process raw data into structured format
     */
    processData(data) {
        this.projects = [];
        this.teams = new Set();
        this.clients = new Set();
        this.types = new Set();

        const teamColumns = [
            'Equipo Content',
            'Equipo Diseño',
            'Equipo Video',
            'Equipo Dev',
            'Equipo Traducciones',
            'Equipo Social Media',
            'Equipo Field Marketing',
            'Equipo Strategy'
        ];

        data.forEach((row, index) => {
            // Skip empty rows
            if (!row['Cliente'] && !row['Proyecto']) return;

            const project = {
                id: index,
                client: row['Cliente'] || '',
                name: row['Proyecto'] || '',
                type: row['Línea / Tipo'] || '',
                phase: row['Fase'] || '',
                tasks: row['Tareas'] || '',
                startDate: this.parseDate(row['Fecha de Inicio']),
                endDate: this.parseDate(row['Fecha Finalización']),
                confirmedDate: this.parseDate(row['Fecha confirmada']),
                clickUpLink: row['Link Click Up'] || '',
                teams: []
            };

            // Collect teams
            teamColumns.forEach(teamCol => {
                const value = row[teamCol];
                if (value && (value.toLowerCase() === 'aplica' || value === true)) {
                    const teamName = teamCol.replace('Equipo ', '');
                    project.teams.push(teamName);
                    this.teams.add(teamName);
                }
            });

            // Collect unique values
            if (project.client) this.clients.add(project.client);
            if (project.type) this.types.add(project.type);

            this.projects.push(project);
        });

        // Convert Sets to Arrays
        this.teams = Array.from(this.teams);
        this.clients = Array.from(this.clients);
        this.types = Array.from(this.types);

        // Group projects by client
        this.projectsByClient = this.groupByClient();

        console.log(`Processed ${this.projects.length} projects, ${this.teams.length} teams, ${this.clients.length} clients`);
    },

    /**
     * Parse date from various formats
     */
    parseDate(dateStr) {
        if (!dateStr) return null;

        // Convert to string if needed
        dateStr = String(dateStr).trim();
        if (!dateStr) return null;

        // Handle "D-Mon-YYYY" format (like "1-Jan-2026")
        const monthNames = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };

        const dMonYYYY = dateStr.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
        if (dMonYYYY) {
            const day = parseInt(dMonYYYY[1]);
            const month = monthNames[dMonYYYY[2]];
            const year = parseInt(dMonYYYY[3]);
            if (month !== undefined) {
                return new Date(year, month, day);
            }
        }

        // Handle different date formats
        const formats = [
            // DD/MM/YYYY
            { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, order: ['d', 'm', 'y'] },
            // MM/DD/YYYY
            { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, order: ['m', 'd', 'y'] },
            // YYYY-MM-DD
            { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, order: ['y', 'm', 'd'] },
            // DD-MM-YYYY
            { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, order: ['d', 'm', 'y'] }
        ];

        for (const format of formats) {
            const match = dateStr.match(format.regex);
            if (match) {
                let day, month, year;
                format.order.forEach((part, i) => {
                    const val = parseInt(match[i + 1]);
                    if (part === 'd') day = val;
                    if (part === 'm') month = val - 1;
                    if (part === 'y') year = val;
                });

                const date = new Date(year, month, day);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
        }

        // Try native parsing as last resort
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date;
        }

        return null;
    },

    /**
     * Group projects by client
     */
    groupByClient() {
        const grouped = {};

        this.projects.forEach(project => {
            const client = project.client || 'Sin Cliente';
            if (!grouped[client]) {
                grouped[client] = [];
            }
            grouped[client].push(project);
        });

        return grouped;
    },

    /**
     * Get processed data
     */
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

    /**
     * Filter projects
     */
    filterProjects(filters = {}) {
        let filtered = [...this.projects];
        console.log('filterProjects called with:', filters, 'Total projects:', this.projects.length);

        if (filters.client) {
            filtered = filtered.filter(p => p.client === filters.client);
        }

        if (filters.team) {
            filtered = filtered.filter(p => p.teams.includes(filters.team));
        }

        if (filters.type) {
            filtered = filtered.filter(p => p.type === filters.type);
        }

        if (filters.month) {
            const month = parseInt(filters.month);
            filtered = filtered.filter(p => {
                if (p.startDate) {
                    const startMonth = p.startDate.getMonth() + 1;
                    const endMonth = p.endDate ? p.endDate.getMonth() + 1 : startMonth;
                    return month >= startMonth && month <= endMonth;
                }
                return false;
            });
        }

        console.log('Filtered projects:', filtered.length);
        return filtered;
    },

    /**
     * Get workload data by team and period (with optional filters)
     */
    getWorkloadData(period = 'month', filters = {}) {
        const workload = {};

        // Initialize months
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        // Get filtered projects
        const filteredProjects = this.filterProjects(filters);

        // Get teams from filtered projects or all teams
        let teamsToShow = new Set();
        filteredProjects.forEach(p => p.teams.forEach(t => teamsToShow.add(t)));

        // If filtering by team, only show that team
        if (filters.team) {
            teamsToShow = new Set([filters.team]);
        }

        // If no teams found, use all teams
        if (teamsToShow.size === 0) {
            teamsToShow = new Set(this.teams);
        }

        teamsToShow.forEach(team => {
            workload[team] = new Array(12).fill(0);
        });

        filteredProjects.forEach(project => {
            const startMonth = project.startDate ? project.startDate.getMonth() : null;
            const endMonth = project.endDate ? project.endDate.getMonth() : startMonth;

            if (startMonth !== null) {
                project.teams.forEach(team => {
                    // Only count if team is in our filtered set
                    if (!workload[team]) return;

                    // Count project for each month it spans
                    const start = startMonth;
                    const end = endMonth !== null ? endMonth : startMonth;

                    for (let m = start; m <= end; m++) {
                        workload[team][m]++;
                    }
                });
            }
        });

        return {
            labels: months,
            teams: workload
        };
    },

    /**
     * Get heatmap data (with optional filters)
     */
    getHeatmapData(filters = {}) {
        const heatmap = [];
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        // Get filtered projects
        const filteredProjects = this.filterProjects(filters);

        // Get teams to show
        let teamsToShow = [];
        if (filters.team) {
            teamsToShow = [filters.team];
        } else {
            // Get unique teams from filtered projects
            const teamsSet = new Set();
            filteredProjects.forEach(p => p.teams.forEach(t => teamsSet.add(t)));
            teamsToShow = teamsSet.size > 0 ? Array.from(teamsSet) : this.teams;
        }

        teamsToShow.forEach((team, teamIndex) => {
            months.forEach((month, monthIndex) => {
                let count = 0;

                filteredProjects.forEach(project => {
                    if (!project.teams.includes(team)) return;

                    const startMonth = project.startDate ? project.startDate.getMonth() : null;
                    const endMonth = project.endDate ? project.endDate.getMonth() : startMonth;

                    if (startMonth !== null) {
                        if (monthIndex >= startMonth && monthIndex <= (endMonth || startMonth)) {
                            count++;
                        }
                    }
                });

                heatmap.push({
                    team: team,
                    month: month,
                    monthIndex: monthIndex,
                    teamIndex: teamIndex,
                    value: count
                });
            });
        });

        return {
            data: heatmap,
            teams: teamsToShow,
            months: months,
            maxValue: Math.max(...heatmap.map(h => h.value), 1)
        };
    },

    /**
     * Save data to cache
     */
    saveToCache(data) {
        try {
            const cacheData = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
        } catch (e) {
            console.warn('Could not save to cache:', e);
        }
    },

    /**
     * Load data from cache
     */
    loadFromCache() {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                // Check if cache is still valid
                if (Date.now() - timestamp < this.CACHE_DURATION) {
                    return data;
                }
            }
        } catch (e) {
            console.warn('Could not load from cache:', e);
        }
        return null;
    },

    /**
     * Start auto-refresh
     */
    startAutoRefresh() {
        setInterval(() => {
            this.fetchData();
        }, this.REFRESH_INTERVAL);
    },

    /**
     * Manual refresh
     */
    async refresh() {
        await this.fetchData();
    },

    /**
     * Update last refresh timestamp in UI
     */
    updateLastRefresh() {
        const el = document.getElementById('lastUpdate');
        if (el) {
            const now = new Date();
            el.textContent = now.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
};
