/**
 * 8Agency Dashboard - Main Application
 * Connects all components and handles UI interactions
 */

const App = {
    // Current filters
    filters: {
        client: '',
        team: '',
        type: '',
        month: ''
    },

    // Current section
    currentSection: 'gantt',

    /**
     * Initialize application
     */
    init() {
        // Check authentication (handled by auth.js)
        if (!AuthSystem.isAuthenticated()) {
            return;
        }

        // Initialize components
        this.initNavigation();
        this.initFilters();
        this.initDetailPanel();
        this.initRefreshButton();
        this.initMobileMenu();

        // Initialize charts module
        Charts.init();

        // Initialize Gantt chart
        GanttChart.init('ganttChart');

        // Load data
        this.loadData();
    },

    /**
     * Load data from Google Sheets
     */
    loadData() {
        DataManager.init(
            // On data loaded
            (data) => {
                this.onDataLoaded(data);
            },
            // On error
            (error) => {
                this.showError(error);
            }
        );
    },

    /**
     * Handle data loaded
     */
    onDataLoaded(data) {
        // Hide loading spinners
        document.querySelectorAll('.loading-spinner').forEach(el => {
            el.style.display = 'none';
        });

        // Populate filter dropdowns
        this.populateFilters(data);

        // Render visualizations with empty filters initially
        GanttChart.setData(data);
        Charts.createWorkloadChart({});
        Charts.createHeatmap({});

        // Update section title
        this.updateSectionTitle();
    },

    /**
     * Show error message
     */
    showError(message) {
        const ganttContainer = document.getElementById('ganttChart');
        if (ganttContainer) {
            ganttContainer.innerHTML = `
                <div class="error-state" style="text-align: center; padding: 60px 20px;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" style="margin-bottom: 16px;">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <h3 style="color: #f8fafc; margin-bottom: 8px;">Error al cargar datos</h3>
                    <p style="color: #94a3b8; margin-bottom: 20px;">${message}</p>
                    <p style="color: #64748b; font-size: 0.875rem;">
                        Asegúrate de que el Google Sheet esté compartido como "Cualquier persona con el enlace puede ver"
                    </p>
                    <button onclick="App.loadData()" style="margin-top: 20px; padding: 12px 24px; background: #6366f1; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                        Reintentar
                    </button>
                </div>
            `;
        }
    },

    /**
     * Initialize navigation
     */
    initNavigation() {
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();

                // Update active state
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');

                // Get section
                const section = item.dataset.section;
                this.showSection(section);

                // Close mobile menu
                document.getElementById('sidebar').classList.remove('open');
                document.getElementById('overlay').classList.remove('active');
            });
        });
    },

    /**
     * Show section
     */
    showSection(sectionName) {
        this.currentSection = sectionName;

        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(`${sectionName}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update title
        this.updateSectionTitle();

        // Trigger chart resize if needed
        if (sectionName === 'workload' && Charts.workloadChart) {
            Charts.workloadChart.resize();
        }
    },

    /**
     * Update section title
     */
    updateSectionTitle() {
        const titles = {
            'gantt': 'Timeline de Proyectos',
            'workload': 'Carga de Trabajo',
            'heatmap': 'Mapa de Calor'
        };

        const titleEl = document.getElementById('sectionTitle');
        if (titleEl) {
            titleEl.textContent = titles[this.currentSection] || 'Dashboard';
        }
    },

    /**
     * Initialize filters
     */
    initFilters() {
        const filterClient = document.getElementById('filterClient');
        const filterTeam = document.getElementById('filterTeam');
        const filterType = document.getElementById('filterType');
        const filterPhase = document.getElementById('filterPhase');
        const filterMonth = document.getElementById('filterMonth');
        const clearBtn = document.getElementById('clearFilters');

        // Add change listeners
        [filterClient, filterTeam, filterType, filterPhase, filterMonth].forEach(select => {
            if (select) {
                select.addEventListener('change', () => this.applyFilters());
            }
        });

        // Clear filters button
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearFilters());
        }
    },

    /**
     * Populate filter dropdowns
     */
    populateFilters(data) {
        const filterClient = document.getElementById('filterClient');
        const filterTeam = document.getElementById('filterTeam');
        const filterType = document.getElementById('filterType');

        // Clients
        if (filterClient && data.clients) {
            data.clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client;
                option.textContent = client;
                filterClient.appendChild(option);
            });
        }

        // Teams
        if (filterTeam && data.teams) {
            data.teams.forEach(team => {
                const option = document.createElement('option');
                option.value = team;
                option.textContent = team;
                filterTeam.appendChild(option);
            });
        }

        // Types
        if (filterType && data.types) {
            data.types.forEach(type => {
                if (type) {
                    const option = document.createElement('option');
                    option.value = type;
                    option.textContent = type;
                    filterType.appendChild(option);
                }
            });
        }
    },

    /**
     * Apply filters
     */
    applyFilters() {
        this.filters = {
            client: document.getElementById('filterClient')?.value || '',
            team: document.getElementById('filterTeam')?.value || '',
            type: document.getElementById('filterType')?.value || '',
            phase: document.getElementById('filterPhase')?.value || '',
            month: document.getElementById('filterMonth')?.value || ''
        };

        // Update Gantt
        GanttChart.filter(this.filters);

        // Update charts
        Charts.updateWithFilters(this.filters);
    },

    /**
     * Clear all filters
     */
    clearFilters() {
        document.getElementById('filterClient').value = '';
        document.getElementById('filterTeam').value = '';
        document.getElementById('filterType').value = '';
        document.getElementById('filterPhase').value = '';
        document.getElementById('filterMonth').value = '';

        this.filters = { client: '', team: '', type: '', phase: '', month: '' };

        // Reset visualizations
        GanttChart.filter({});
        Charts.updateWithFilters({});
    },

    /**
     * Initialize detail panel
     */
    initDetailPanel() {
        const closeBtn = document.getElementById('closePanel');
        const overlay = document.getElementById('overlay');

        const closePanel = () => {
            document.getElementById('detailPanel').classList.remove('open');
            overlay.classList.remove('active');
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', closePanel);
        }

        if (overlay) {
            overlay.addEventListener('click', closePanel);
        }

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closePanel();
            }
        });
    },

    /**
     * Initialize refresh button
     */
    initRefreshButton() {
        const refreshBtn = document.getElementById('refreshBtn');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                refreshBtn.classList.add('loading');

                await DataManager.refresh();

                // Re-render with new data
                const data = DataManager.getProcessedData();
                GanttChart.setData(data);
                Charts.updateWorkloadChart();
                Charts.createHeatmap();

                setTimeout(() => {
                    refreshBtn.classList.remove('loading');
                }, 500);
            });
        }
    },

    /**
     * Initialize mobile menu
     */
    initMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');

        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                overlay.classList.toggle('active');
            });
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure auth check completes
    setTimeout(() => {
        if (document.querySelector('.dashboard-page')) {
            App.init();
        }
    }, 100);
});
