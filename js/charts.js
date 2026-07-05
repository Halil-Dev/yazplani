/**
 * Charts Module - Handles Chart.js visualizations
 * Namespace: window.Charts
 */
window.Charts = (() => {
    'use strict';

    // ── Chart instances ──────────────────────────────────────────────
    let dailyChart = null;
    let weeklyChart = null;
    let monthlyChart = null;
    let overallChart = null;

    // ── Color palette ────────────────────────────────────────────────
    const COLORS = {
        accent: '#6366f1',
        accentLight: '#818cf8',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        successLight: 'rgba(16, 185, 129, 0.15)',
        accentAlpha: 'rgba(99, 102, 241, 0.15)',
        muted: '#64748b',
        mutedLight: 'rgba(100, 116, 139, 0.3)'
    };

    // ── Theme helpers ────────────────────────────────────────────────

    function isDark() {
        return document.documentElement.dataset.theme !== 'light';
    }

    function getThemeColors() {
        if (isDark()) {
            return {
                text: '#94a3b8',
                grid: 'rgba(255, 255, 255, 0.06)',
                bg: '#0f172a',
                cardBg: 'rgba(30, 41, 59, 0.8)',
                tooltipBg: '#1e293b',
                tooltipText: '#e2e8f0'
            };
        }
        return {
            text: '#475569',
            grid: 'rgba(0, 0, 0, 0.06)',
            bg: '#f8fafc',
            cardBg: 'rgba(255, 255, 255, 0.8)',
            tooltipBg: '#ffffff',
            tooltipText: '#334155'
        };
    }

    function getCommonOptions(showLegend = false) {
        const theme = getThemeColors();
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: showLegend,
                    labels: {
                        color: theme.text,
                        font: { family: 'Inter', size: 12 },
                        padding: 16,
                        usePointStyle: true,
                        pointStyleWidth: 8
                    }
                },
                tooltip: {
                    backgroundColor: theme.tooltipBg,
                    titleColor: theme.tooltipText,
                    bodyColor: theme.tooltipText,
                    borderColor: theme.grid,
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    titleFont: { family: 'Inter', size: 13, weight: '600' },
                    bodyFont: { family: 'Inter', size: 12 },
                    displayColors: true,
                    boxPadding: 6
                }
            }
        };
    }

    function getScaleOptions() {
        const theme = getThemeColors();
        return {
            x: {
                ticks: {
                    color: theme.text,
                    font: { family: 'Inter', size: 11 }
                },
                grid: {
                    color: theme.grid,
                    drawBorder: false
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    color: theme.text,
                    font: { family: 'Inter', size: 11 },
                    stepSize: 1,
                    precision: 0
                },
                grid: {
                    color: theme.grid,
                    drawBorder: false
                }
            }
        };
    }

    // ── Chart: Daily (Doughnut) ──────────────────────────────────────

    // Custom center text plugin for doughnut
    const centerTextPlugin = {
        id: 'centerText',
        afterDraw(chart) {
            if (chart.config.type !== 'doughnut') return;
            const centerText = chart.options.plugins.centerText;
            if (!centerText || !centerText.text) return;

            const { ctx, chartArea } = chart;
            const cx = (chartArea.left + chartArea.right) / 2;
            const cy = (chartArea.top + chartArea.bottom) / 2;
            const theme = getThemeColors();

            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Percentage
            ctx.font = `bold 24px Inter, sans-serif`;
            ctx.fillStyle = theme.text;
            ctx.fillText(centerText.text, cx, cy - 6);

            // Sub text
            if (centerText.subText) {
                ctx.font = `11px Inter, sans-serif`;
                ctx.fillStyle = theme.text;
                ctx.globalAlpha = 0.7;
                ctx.fillText(centerText.subText, cx, cy + 16);
            }

            ctx.restore();
        }
    };

    // Register plugin globally
    if (typeof Chart !== 'undefined') {
        Chart.register(centerTextPlugin);
    }

    function updateDaily(tasks) {
        const canvas = document.getElementById('daily-chart-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Update progress text
        const progressText = document.getElementById('daily-progress-text');
        if (progressText) {
            progressText.textContent = total > 0
                ? `%${percentage} tamamlandı`
                : 'Henüz görev eklenmedi';
        }

        // Destroy previous chart
        if (dailyChart) {
            dailyChart.destroy();
            dailyChart = null;
        }

        const commonOpts = getCommonOptions(false);

        dailyChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Tamamlanan', 'Bekleyen'],
                datasets: [{
                    data: total > 0 ? [completed, pending] : [0, 1],
                    backgroundColor: total > 0
                        ? [COLORS.success, COLORS.mutedLight]
                        : [COLORS.mutedLight, COLORS.mutedLight],
                    borderWidth: 0,
                    cutout: '75%',
                    borderRadius: total > 0 ? 4 : 0
                }]
            },
            options: {
                ...commonOpts,
                cutout: '75%',
                plugins: {
                    ...commonOpts.plugins,
                    legend: { display: false },
                    centerText: {
                        text: total > 0 ? `%${percentage}` : '-',
                        subText: total > 0 ? 'tamamlandı' : 'görev yok'
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 800,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    // ── Chart: Weekly (Bar) ──────────────────────────────────────────

    function updateWeekly(tasks) {
        const canvas = document.getElementById('weekly-chart-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Get week range
        const weekRange = window.UI ? window.UI.getWeekRange(window.UI.currentDate) : null;
        if (!weekRange) return;

        const dayLabels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
        const totalData = new Array(7).fill(0);
        const completedData = new Array(7).fill(0);

        // Group tasks by day of week (Monday=0)
        tasks.forEach(t => {
            const [y, m, d] = t.date.split('-').map(Number);
            const taskDate = new Date(y, m - 1, d);
            let dayIndex = taskDate.getDay(); // 0=Sun
            dayIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Convert to Mon=0

            totalData[dayIndex]++;
            if (t.completed) completedData[dayIndex]++;
        });

        // Destroy previous chart
        if (weeklyChart) {
            weeklyChart.destroy();
            weeklyChart = null;
        }

        const commonOpts = getCommonOptions(true);
        const scaleOpts = getScaleOptions();

        weeklyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dayLabels,
                datasets: [
                    {
                        label: 'Tamamlanan',
                        data: completedData,
                        backgroundColor: COLORS.success,
                        borderRadius: 6,
                        borderSkipped: false,
                        barPercentage: 0.6,
                        categoryPercentage: 0.7
                    },
                    {
                        label: 'Toplam',
                        data: totalData,
                        backgroundColor: COLORS.accentAlpha,
                        borderColor: COLORS.accent,
                        borderWidth: 1,
                        borderRadius: 6,
                        borderSkipped: false,
                        barPercentage: 0.6,
                        categoryPercentage: 0.7
                    }
                ]
            },
            options: {
                ...commonOpts,
                plugins: {
                    ...commonOpts.plugins,
                    legend: {
                        ...commonOpts.plugins.legend,
                        display: true,
                        position: 'top'
                    }
                },
                scales: scaleOpts,
                animation: {
                    duration: 600,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    // ── Chart: Monthly (Line) ────────────────────────────────────────

    function updateMonthly(tasks) {
        const canvas = document.getElementById('monthly-chart-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Group tasks by week of month
        const currentMonth = window.UI ? window.UI.currentDate.getMonth() : new Date().getMonth();
        const currentYear = window.UI ? window.UI.currentDate.getFullYear() : new Date().getFullYear();
        const firstDay = new Date(currentYear, currentMonth, 1);

        // Calculate number of weeks
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const weeksInMonth = Math.ceil((lastDay.getDate() + (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1)) / 7);

        const weekLabels = [];
        const totalByWeek = [];
        const completedByWeek = [];

        for (let w = 0; w < weeksInMonth; w++) {
            weekLabels.push(`Hafta ${w + 1}`);
            totalByWeek.push(0);
            completedByWeek.push(0);
        }

        tasks.forEach(t => {
            const [y, m, d] = t.date.split('-').map(Number);
            if (m - 1 !== currentMonth || y !== currentYear) return;

            const taskDate = new Date(y, m - 1, d);
            // Calculate week index
            const dayOfMonth = taskDate.getDate();
            const firstDayOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
            const weekIndex = Math.floor((dayOfMonth - 1 + firstDayOffset) / 7);

            if (weekIndex >= 0 && weekIndex < weeksInMonth) {
                totalByWeek[weekIndex]++;
                if (t.completed) completedByWeek[weekIndex]++;
            }
        });

        // Destroy previous chart
        if (monthlyChart) {
            monthlyChart.destroy();
            monthlyChart = null;
        }

        const commonOpts = getCommonOptions(true);
        const scaleOpts = getScaleOptions();

        // Create gradient for completed area
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');

        monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weekLabels,
                datasets: [
                    {
                        label: 'Toplam Görev',
                        data: totalByWeek,
                        borderColor: COLORS.accent,
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        tension: 0.4,
                        pointBackgroundColor: COLORS.accent,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    },
                    {
                        label: 'Tamamlanan',
                        data: completedByWeek,
                        borderColor: COLORS.success,
                        backgroundColor: gradient,
                        fill: true,
                        borderWidth: 2,
                        tension: 0.4,
                        pointBackgroundColor: COLORS.success,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }
                ]
            },
            options: {
                ...commonOpts,
                plugins: {
                    ...commonOpts.plugins,
                    legend: {
                        ...commonOpts.plugins.legend,
                        display: true,
                        position: 'top'
                    }
                },
                scales: scaleOpts,
                animation: {
                    duration: 800,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    // ── Chart: Overall / Stats (Line – last 30 days) ─────────────────

    function updateOverall(allTasks) {
        const canvas = document.getElementById('overall-chart-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Build last 30 days data
        const labels = [];
        const rateData = [];
        const today = new Date();

        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = window.UI ? window.UI.formatDateISO(d) : '';
            const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;
            labels.push(dayLabel);

            const dayTasks = allTasks.filter(t => t.date === dateStr);
            if (dayTasks.length > 0) {
                const completed = dayTasks.filter(t => t.completed).length;
                rateData.push(Math.round((completed / dayTasks.length) * 100));
            } else {
                rateData.push(null); // No data for this day
            }
        }

        // Destroy previous chart
        if (overallChart) {
            overallChart.destroy();
            overallChart = null;
        }

        const commonOpts = getCommonOptions(false);
        const theme = getThemeColors();

        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.02)');

        overallChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Tamamlanma Oranı (%)',
                    data: rateData,
                    borderColor: COLORS.accent,
                    backgroundColor: gradient,
                    fill: true,
                    borderWidth: 2.5,
                    tension: 0.4,
                    pointBackgroundColor: COLORS.accent,
                    pointBorderColor: isDark() ? '#1e293b' : '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    spanGaps: true
                }]
            },
            options: {
                ...commonOpts,
                scales: {
                    x: {
                        ticks: {
                            color: theme.text,
                            font: { family: 'Inter', size: 10 },
                            maxRotation: 45,
                            maxTicksLimit: 15
                        },
                        grid: {
                            color: theme.grid,
                            drawBorder: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: theme.text,
                            font: { family: 'Inter', size: 11 },
                            callback: value => `%${value}`,
                            stepSize: 25
                        },
                        grid: {
                            color: theme.grid,
                            drawBorder: false
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    // ── Theme update ─────────────────────────────────────────────────

    function updateTheme() {
        // Re-render all active charts with new theme colors
        // We store the last data to avoid fetching again
        // For simplicity, destroy and let the app re-render
        destroy();

        // Trigger a reload of the current view to rebuild charts
        if (window.App && window.App.loadCurrentView) {
            window.App.loadCurrentView();
        }
    }

    // ── Destroy all charts ───────────────────────────────────────────

    function destroy() {
        if (dailyChart) { dailyChart.destroy(); dailyChart = null; }
        if (weeklyChart) { weeklyChart.destroy(); weeklyChart = null; }
        if (monthlyChart) { monthlyChart.destroy(); monthlyChart = null; }
        if (overallChart) { overallChart.destroy(); overallChart = null; }
    }

    // ── Public API ───────────────────────────────────────────────────
    return {
        updateDaily,
        updateWeekly,
        updateMonthly,
        updateOverall,
        updateTheme,
        destroy,
        isDark,
        getThemeColors
    };
})();
