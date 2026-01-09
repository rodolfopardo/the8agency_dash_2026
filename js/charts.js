/**
 * 8Agency Dashboard - Charts
 * Workload chart (Chart.js) and Heatmap (D3.js)
 */

const Charts = {
    // Chart instances
    workloadChart: null,

    // Current filters
    currentFilters: {},

    // Team colors
    teamColors: {
        'Content': '#6366f1',
        'Diseño': '#ec4899',
        'Video': '#f43f5e',
        'Dev': '#14b8a6',
        'Traducciones': '#8b5cf6',
        'Social Media': '#f97316',
        'Field Marketing': '#22c55e',
        'Strategy': '#0ea5e9'
    },

    /**
     * Initialize charts
     */
    init() {
        // Setup period selector
        const periodSelector = document.getElementById('workloadPeriod');
        if (periodSelector) {
            periodSelector.addEventListener('change', () => {
                this.updateWorkloadChart(this.currentFilters);
            });
        }
    },

    /**
     * Create workload chart (Chart.js - stacked bar)
     */
    createWorkloadChart(filters = {}) {
        const ctx = document.getElementById('workloadChart');
        if (!ctx) return;

        this.currentFilters = filters;
        const workloadData = DataManager.getWorkloadData('month', filters);

        // Destroy existing chart
        if (this.workloadChart) {
            this.workloadChart.destroy();
        }

        // Prepare datasets
        const datasets = Object.entries(workloadData.teams).map(([team, values]) => ({
            label: team,
            data: values,
            backgroundColor: this.teamColors[team] || '#6366f1',
            borderColor: this.teamColors[team] || '#6366f1',
            borderWidth: 0,
            borderRadius: 4,
            barPercentage: 0.7,
            categoryPercentage: 0.8
        }));

        this.workloadChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: workloadData.labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8',
                            padding: 16,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#f8fafc',
                        bodyColor: '#94a3b8',
                        borderColor: '#334155',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: true,
                        callbacks: {
                            title: (items) => `${items[0].label} 2026`,
                            label: (item) => ` ${item.dataset.label}: ${item.raw} proyectos`
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        grid: {
                            color: '#334155',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#64748b',
                            stepSize: 1,
                            font: {
                                size: 11
                            }
                        },
                        title: {
                            display: true,
                            text: 'Número de Proyectos',
                            color: '#64748b',
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });

        // Update summary cards
        this.updateWorkloadSummary(workloadData);
    },

    /**
     * Update workload chart
     */
    updateWorkloadChart(filters = {}) {
        this.createWorkloadChart(filters);
    },

    /**
     * Update workload summary cards
     */
    updateWorkloadSummary(workloadData) {
        const container = document.getElementById('workloadSummary');
        if (!container) return;

        container.innerHTML = '';

        Object.entries(workloadData.teams).forEach(([team, values]) => {
            const total = values.reduce((a, b) => a + b, 0);
            const maxMonth = Math.max(...values);
            const peakMonth = workloadData.labels[values.indexOf(maxMonth)];

            const card = document.createElement('div');
            card.className = 'summary-card';
            card.innerHTML = `
                <div class="team-name">
                    <span class="team-color" style="background: ${this.teamColors[team] || '#6366f1'}"></span>
                    ${team}
                </div>
                <div class="project-count">${total}</div>
                <div class="project-label">proyectos totales</div>
                <div class="project-label" style="margin-top: 8px; color: #94a3b8;">
                    Pico: ${peakMonth} (${maxMonth})
                </div>
            `;

            container.appendChild(card);
        });
    },

    /**
     * Create heatmap (D3.js)
     */
    createHeatmap(filters = {}) {
        const container = document.getElementById('heatmapChart');
        if (!container) return;

        // Clear container
        container.innerHTML = '';

        const heatmapData = DataManager.getHeatmapData(filters);

        // Dimensions
        const margin = { top: 30, right: 30, bottom: 60, left: 120 };
        const cellSize = 50;
        const width = margin.left + (heatmapData.months.length * cellSize) + margin.right;
        const height = margin.top + (heatmapData.teams.length * cellSize) + margin.bottom;

        // Create SVG
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        // Color scale
        const colorScale = d3.scaleSequential()
            .domain([0, heatmapData.maxValue || 1])
            .interpolator(d3.interpolateRgbBasis(['#10b981', '#f59e0b', '#ef4444']));

        // X axis (months)
        const xScale = d3.scaleBand()
            .domain(heatmapData.months)
            .range([0, heatmapData.months.length * cellSize])
            .padding(0.05);

        g.append('g')
            .attr('transform', `translate(0, ${heatmapData.teams.length * cellSize})`)
            .call(d3.axisBottom(xScale).tickSize(0))
            .select('.domain').remove();

        g.selectAll('.tick text')
            .attr('fill', '#94a3b8')
            .attr('font-size', '11px')
            .attr('dy', '1em');

        // Y axis (teams)
        const yScale = d3.scaleBand()
            .domain(heatmapData.teams)
            .range([0, heatmapData.teams.length * cellSize])
            .padding(0.05);

        g.append('g')
            .call(d3.axisLeft(yScale).tickSize(0))
            .select('.domain').remove();

        g.selectAll('.tick text')
            .attr('fill', '#94a3b8')
            .attr('font-size', '12px');

        // Tooltip
        const tooltip = d3.select(container)
            .append('div')
            .attr('class', 'heatmap-tooltip')
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .style('background', '#1e293b')
            .style('border', '1px solid #334155')
            .style('border-radius', '8px')
            .style('padding', '12px')
            .style('color', '#f8fafc')
            .style('font-size', '12px')
            .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)')
            .style('pointer-events', 'none')
            .style('z-index', '100');

        // Cells
        g.selectAll('.heatmap-cell')
            .data(heatmapData.data)
            .enter()
            .append('rect')
            .attr('class', 'heatmap-cell')
            .attr('x', d => xScale(d.month))
            .attr('y', d => yScale(d.team))
            .attr('width', xScale.bandwidth())
            .attr('height', yScale.bandwidth())
            .attr('rx', 4)
            .attr('fill', d => d.value === 0 ? '#1e293b' : colorScale(d.value))
            .attr('stroke', '#0f172a')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .attr('stroke', '#6366f1')
                    .attr('stroke-width', 3);

                tooltip
                    .style('visibility', 'visible')
                    .html(`
                        <strong>${d.team}</strong><br>
                        <span style="color: #94a3b8">${d.month} 2026</span><br>
                        <span style="font-size: 18px; font-weight: 700; color: ${d.value === 0 ? '#64748b' : colorScale(d.value)}">${d.value}</span> proyectos
                    `);
            })
            .on('mousemove', function (event) {
                tooltip
                    .style('top', (event.pageY - 10) + 'px')
                    .style('left', (event.pageX + 10) + 'px');
            })
            .on('mouseout', function () {
                d3.select(this)
                    .attr('stroke', '#0f172a')
                    .attr('stroke-width', 2);

                tooltip.style('visibility', 'hidden');
            });

        // Cell values
        g.selectAll('.heatmap-value')
            .data(heatmapData.data)
            .enter()
            .append('text')
            .attr('class', 'heatmap-value')
            .attr('x', d => xScale(d.month) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(d.team) + yScale.bandwidth() / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('fill', d => d.value > heatmapData.maxValue / 2 ? '#0f172a' : '#f8fafc')
            .attr('font-size', '14px')
            .attr('font-weight', '600')
            .attr('pointer-events', 'none')
            .text(d => d.value || '');
    },

    /**
     * Update all charts with filtered data
     */
    updateWithFilters(filters = {}) {
        console.log('Applying filters:', filters);
        this.currentFilters = filters;

        // Update workload chart with filters
        this.createWorkloadChart(filters);

        // Recreate heatmap with filters
        this.createHeatmap(filters);
    }
};
