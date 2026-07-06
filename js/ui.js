/**
 * UI Module - Handles all DOM manipulation and user interface
 * Namespace: window.UI
 */
window.UI = (() => {
    'use strict';

    // ── Turkish locale data ──────────────────────────────────────────
    const MONTH_NAMES = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    const MONTH_NAMES_SHORT = [
        'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
        'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'
    ];
    const DAY_NAMES = [
        'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'
    ];
    const DAY_NAMES_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const PRIORITY_LABELS = { low: 'Düşük', medium: 'Orta', high: 'Yüksek' };
    const PAGE_TITLES = {
        daily: 'Günlük Plan',
        weekly: 'Haftalık Plan',
        monthly: 'Aylık Plan',
        stats: 'İstatistikler'
    };

    // ── State ────────────────────────────────────────────────────────
    let currentPage = 'daily';
    let currentDate = new Date();
    let searchQuery = '';
    let reminderTimeouts = [];

    // ── Cached DOM elements ──────────────────────────────────────────
    const els = {};
    function cacheElements() {
        els.pageTitle = document.getElementById('page-title');
        els.currentDateLabel = document.getElementById('current-date-label');
        els.dailySection = document.getElementById('daily-section');
        els.weeklySection = document.getElementById('weekly-section');
        els.monthlySection = document.getElementById('monthly-section');
        els.statsSection = document.getElementById('stats-section');
        els.dailyTasksContainer = document.getElementById('daily-tasks-container');
        els.dailyEmpty = document.getElementById('daily-empty');
        els.dailyTotal = document.getElementById('daily-total');
        els.dailyCompleted = document.getElementById('daily-completed');
        els.dailyPending = document.getElementById('daily-pending');
        els.dailyRate = document.getElementById('daily-rate');
        els.dailyProgressText = document.getElementById('daily-progress-text');
        els.weeklyDaysContainer = document.getElementById('weekly-days-container');
        els.monthlyCalendarContainer = document.getElementById('monthly-calendar-container');
        els.totalTasksStat = document.getElementById('total-tasks-stat');
        els.completedTasksStat = document.getElementById('completed-tasks-stat');
        els.streakStat = document.getElementById('streak-stat');
        els.rateStat = document.getElementById('rate-stat');
        els.statsCategories = document.getElementById('stats-categories');
        els.taskModal = document.getElementById('task-modal');
        els.modalOverlay = document.getElementById('modal-overlay');
        els.modalTitle = document.getElementById('modal-title');
        els.taskForm = document.getElementById('task-form');
        els.taskIdHidden = document.getElementById('task-id-hidden');
        els.taskTitleInput = document.getElementById('task-title-input');
        els.taskDescriptionInput = document.getElementById('task-description-input');
        els.taskDateInput = document.getElementById('task-date-input');
        els.taskTimeInput = document.getElementById('task-time-input');
        els.taskPrioritySelect = document.getElementById('task-priority-select');
        els.taskCategoryInput = document.getElementById('task-category-input');
        els.taskRecurringSelect = document.getElementById('task-recurring-select');
        els.taskReminderCheckbox = document.getElementById('task-reminder-checkbox');
        els.taskReminderTime = document.getElementById('task-reminder-time');
        els.deleteTaskBtn = document.getElementById('delete-task-btn');
        els.loadingOverlay = document.getElementById('loading-overlay');
        els.toastContainer = document.getElementById('toast-container');
        els.sidebar = document.getElementById('sidebar');
        els.sidebarOverlay = document.getElementById('sidebar-overlay');
        els.searchInput = document.getElementById('search-input');
        els.dateNav = document.getElementById('date-nav');
        els.statsRangeNav = document.getElementById('stats-range-nav');
        els.weeklyAnalysisValue = document.getElementById('weekly-analysis-value');
        els.weeklyAnalysisPercentage = document.getElementById('weekly-analysis-percentage');
        els.monthlyAnalysisValue = document.getElementById('monthly-analysis-value');
        els.monthlyAnalysisPercentage = document.getElementById('monthly-analysis-percentage');
    }

    // ── Date helpers ─────────────────────────────────────────────────

    function formatDate(date) {
        const d = new Date(date);
        return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}, ${DAY_NAMES[d.getDay()]}`;
    }

    function formatDateShort(date) {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${day}.${month}.${d.getFullYear()}`;
    }

    function formatDateISO(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getWeekRange(date) {
        const d = new Date(date);
        const dayOfWeek = d.getDay();
        // Monday = 0 offset, Sunday = 6 offset
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const start = new Date(d);
        start.setDate(d.getDate() + mondayOffset);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }

    function getMonthRange(date) {
        const d = new Date(date);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }

    function getDayName(date) {
        return DAY_NAMES[new Date(date).getDay()];
    }

    function getMonthName(month) {
        return MONTH_NAMES[month];
    }

    // ── Page / Navigation ────────────────────────────────────────────

    function switchPage(page) {
        currentPage = page;

        // Update nav active state
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Show correct section
        const sections = ['daily', 'weekly', 'monthly', 'stats'];
        sections.forEach(s => {
            const section = document.getElementById(`${s}-section`);
            if (section) {
                section.classList.toggle('active', s === page);
            }
        });

        // Update page title
        if (els.pageTitle) {
            els.pageTitle.textContent = PAGE_TITLES[page] || '';
        }

        // Toggle header controls based on page
        if (page === 'stats') {
            if (els.dateNav) els.dateNav.style.display = 'none';
            if (els.statsRangeNav) els.statsRangeNav.style.display = 'flex';
        } else {
            if (els.dateNav) els.dateNav.style.display = 'flex';
            if (els.statsRangeNav) els.statsRangeNav.style.display = 'none';
            updateDateLabel();
        }

        // Close sidebar on mobile
        if (els.sidebar && els.sidebar.classList.contains('open')) {
            toggleSidebar();
        }

        // Trigger data reload
        if (window.App && window.App.loadCurrentView) {
            window.App.loadCurrentView();
        }
    }

    function navigateDate(direction) {
        switch (currentPage) {
            case 'daily':
                currentDate.setDate(currentDate.getDate() + direction);
                break;
            case 'weekly':
                currentDate.setDate(currentDate.getDate() + (direction * 7));
                break;
            case 'monthly':
                currentDate.setMonth(currentDate.getMonth() + direction);
                break;
            default:
                return;
        }
        currentDate = new Date(currentDate);
        updateDateLabel();
        if (window.App && window.App.loadCurrentView) {
            window.App.loadCurrentView();
        }
    }

    function goToToday() {
        currentDate = new Date();
        updateDateLabel();
        if (window.App && window.App.loadCurrentView) {
            window.App.loadCurrentView();
        }
    }

    function updateDateLabel() {
        if (!els.currentDateLabel) return;

        switch (currentPage) {
            case 'daily':
                els.currentDateLabel.textContent = formatDate(currentDate);
                break;
            case 'weekly': {
                const range = getWeekRange(currentDate);
                const startDay = range.start.getDate();
                const endDay = range.end.getDate();
                const startMonth = MONTH_NAMES_SHORT[range.start.getMonth()];
                const endMonth = MONTH_NAMES_SHORT[range.end.getMonth()];
                const year = range.end.getFullYear();
                if (range.start.getMonth() === range.end.getMonth()) {
                    els.currentDateLabel.textContent = `${startDay} - ${endDay} ${endMonth} ${year}`;
                } else {
                    els.currentDateLabel.textContent = `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
                }
                break;
            }
            case 'monthly':
                els.currentDateLabel.textContent = `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
                break;
            case 'stats':
                els.currentDateLabel.textContent = 'Genel İstatistikler';
                break;
        }
    }

    // ── Render Views ─────────────────────────────────────────────────

    function renderDailyView(tasks) {
        if (!els.dailyTasksContainer) return;

        // Filter by search query
        let filtered = tasks;
        if (searchQuery) {
            filtered = tasks.filter(t =>
                (t.title && t.title.toLowerCase().includes(searchQuery)) ||
                (t.category && t.category.toLowerCase().includes(searchQuery)) ||
                (t.description && t.description.toLowerCase().includes(searchQuery))
            );
        }

        // Sort: tasks with time first, then by priority
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        filtered.sort((a, b) => {
            // Tasks with time come first
            const aHasTime = a.time ? 0 : 1;
            const bHasTime = b.time ? 0 : 1;
            if (aHasTime !== bHasTime) return aHasTime - bHasTime;
            // Sort by time
            if (a.time && b.time && a.time !== b.time) return a.time.localeCompare(b.time);
            // Sort by priority
            return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
        });

        // Render tasks
        if (filtered.length === 0) {
            els.dailyTasksContainer.innerHTML = '';
            if (els.dailyEmpty) els.dailyEmpty.style.display = 'flex';
        } else {
            if (els.dailyEmpty) els.dailyEmpty.style.display = 'none';
            els.dailyTasksContainer.innerHTML = filtered.map(t => renderTaskItem(t)).join('');
        }

        // Update mini stats
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        if (els.dailyTotal) els.dailyTotal.textContent = total;
        if (els.dailyCompleted) els.dailyCompleted.textContent = completed;
        if (els.dailyPending) els.dailyPending.textContent = pending;
        if (els.dailyRate) els.dailyRate.textContent = `%${rate}`;

        // Update chart
        if (window.Charts && window.Charts.updateDaily) {
            window.Charts.updateDaily(tasks);
        }
    }

    function renderWeeklyView(tasks) {
        if (!els.weeklyDaysContainer) return;

        const weekRange = getWeekRange(currentDate);
        const todayISO = formatDateISO(new Date());

        // Group tasks by date
        const tasksByDate = {};
        tasks.forEach(t => {
            if (!tasksByDate[t.date]) tasksByDate[t.date] = [];
            tasksByDate[t.date].push(t);
        });

        // Build 7 columns (Monday to Sunday)
        // DAY_NAMES_SHORT index: 0=Paz, 1=Pzt, 2=Sal, ...
        const weekDayOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun mapped to JS day indices
        const weekDayLabels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
        let html = '';

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(weekRange.start);
            dayDate.setDate(weekRange.start.getDate() + i);
            const dateISO = formatDateISO(dayDate);
            const dayTasks = tasksByDate[dateISO] || [];
            const isToday = dateISO === todayISO;
            const completedCount = dayTasks.filter(t => t.completed).length;

            html += `
                <div class="weekly-day-column ${isToday ? 'today' : ''}" data-date="${dateISO}">
                    <div class="weekly-day-header">
                        <span class="weekly-day-name">${weekDayLabels[i]}</span>
                        <span class="weekly-day-date">${dayDate.getDate()}</span>
                        <span class="weekly-day-count">${completedCount}/${dayTasks.length}</span>
                    </div>
                    <div class="weekly-day-tasks">
                        ${dayTasks.map(t => `
                            <div class="weekly-task-card ${t.completed ? 'completed' : ''} priority-${t.priority}" data-id="${t.id}">
                                <button class="task-checkbox ${t.completed ? 'checked' : ''}" data-id="${t.id}">
                                    ${t.completed ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                                </button>
                                <span class="weekly-task-title">${escapeHtml(t.title)}</span>
                                <span class="priority-dot priority-${t.priority}"></span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        els.weeklyDaysContainer.innerHTML = html;

        // Update chart
        if (window.Charts && window.Charts.updateWeekly) {
            window.Charts.updateWeekly(tasks);
        }
    }

    function renderMonthlyView(tasks) {
        if (!els.monthlyCalendarContainer) return;

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const todayISO = formatDateISO(new Date());

        // Group tasks by date
        const tasksByDate = {};
        tasks.forEach(t => {
            if (!tasksByDate[t.date]) tasksByDate[t.date] = [];
            tasksByDate[t.date].push(t);
        });

        // Calendar header
        const dayHeaders = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
        let html = '<div class="calendar-grid">';
        html += '<div class="calendar-header-row">';
        dayHeaders.forEach(d => {
            html += `<div class="calendar-header-cell">${d}</div>`;
        });
        html += '</div>';

        // Offset for first day (Monday = 0)
        let firstDayOfWeek = firstDay.getDay(); // 0=Sun
        let offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

        html += '<div class="calendar-body">';

        // Empty cells before first day
        for (let i = 0; i < offset; i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        // Day cells
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTasks = tasksByDate[dateStr] || [];
            const isToday = dateStr === todayISO;

            const completedTasks = dayTasks.filter(t => t.completed);
            const pendingTasks = dayTasks.filter(t => !t.completed);
            const highPriorityTasks = pendingTasks.filter(t => t.priority === 'high');

            html += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${dayTasks.length > 0 ? 'has-tasks' : ''}" data-date="${dateStr}">
                    <span class="calendar-day-number">${day}</span>
                    <div class="calendar-day-dots">
                        ${completedTasks.length > 0 ? `<span class="calendar-dot completed" title="${completedTasks.length} tamamlanmış"></span>` : ''}
                        ${pendingTasks.length > 0 ? `<span class="calendar-dot pending" title="${pendingTasks.length} bekleyen"></span>` : ''}
                        ${highPriorityTasks.length > 0 ? `<span class="calendar-dot high-priority" title="${highPriorityTasks.length} yüksek öncelik"></span>` : ''}
                    </div>
                    ${dayTasks.length > 0 ? `<span class="calendar-task-count">${dayTasks.length}</span>` : ''}
                </div>
            `;
        }

        // Empty cells after last day
        const totalCells = offset + lastDay.getDate();
        const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let i = 0; i < remainingCells; i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        html += '</div></div>';
        els.monthlyCalendarContainer.innerHTML = html;

        // Update chart
        if (window.Charts && window.Charts.updateMonthly) {
            window.Charts.updateMonthly(tasks);
        }
    }

    function renderStatsView(allTasks, range = '30') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Filter tasks based on selected range
        let filteredTasks = allTasks;
        if (range !== 'all') {
            const daysCount = parseInt(range) || 30;
            const pastDate = new Date(today);
            pastDate.setDate(today.getDate() - daysCount + 1);
            const startISO = formatDateISO(pastDate);
            const endISO = formatDateISO(today);

            filteredTasks = allTasks.filter(t => t.date >= startISO && t.date <= endISO);
        }

        const total = filteredTasks.length;
        const completed = filteredTasks.filter(t => t.completed).length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Calculate streak (always based on all tasks to keep consecutive days correct)
        const streak = calculateStreak(allTasks);

        if (els.totalTasksStat) els.totalTasksStat.textContent = total;
        if (els.completedTasksStat) els.completedTasksStat.textContent = completed;
        if (els.streakStat) els.streakStat.textContent = streak;
        if (els.rateStat) els.rateStat.textContent = `%${rate}`;

        // 2. Calculate Weekly Analysis (fixed to current week Monday-Sunday)
        const weekRange = getWeekRange(new Date());
        const weekStartISO = formatDateISO(weekRange.start);
        const weekEndISO = formatDateISO(weekRange.end);
        const weeklyTasks = allTasks.filter(t => t.date >= weekStartISO && t.date <= weekEndISO);
        const weeklyTotal = weeklyTasks.length;
        const weeklyCompleted = weeklyTasks.filter(t => t.completed).length;
        const weeklyRate = weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0;

        if (els.weeklyAnalysisValue) {
            els.weeklyAnalysisValue.textContent = `${weeklyCompleted} / ${weeklyTotal}`;
        }
        if (els.weeklyAnalysisPercentage) {
            els.weeklyAnalysisPercentage.textContent = `%${weeklyRate} tamamlandı`;
        }

        // 3. Calculate Monthly Analysis (fixed to current calendar month)
        const monthRange = getMonthRange(new Date());
        const monthStartISO = formatDateISO(monthRange.start);
        const monthEndISO = formatDateISO(monthRange.end);
        const monthlyTasks = allTasks.filter(t => t.date >= monthStartISO && t.date <= monthEndISO);
        const monthlyTotal = monthlyTasks.length;
        const monthlyCompleted = monthlyTasks.filter(t => t.completed).length;
        const monthlyRate = monthlyTotal > 0 ? Math.round((monthlyCompleted / monthlyTotal) * 100) : 0;

        if (els.monthlyAnalysisValue) {
            els.monthlyAnalysisValue.textContent = `${monthlyCompleted} / ${monthlyTotal}`;
        }
        if (els.monthlyAnalysisPercentage) {
            els.monthlyAnalysisPercentage.textContent = `%${monthlyRate} tamamlandı`;
        }

        // 4. Category breakdown (based on filtered tasks)
        if (els.statsCategories) {
            const categories = {};
            filteredTasks.forEach(t => {
                const cat = t.category || 'Genel';
                if (!categories[cat]) categories[cat] = { total: 0, completed: 0 };
                categories[cat].total++;
                if (t.completed) categories[cat].completed++;
            });

            let catHtml = '';
            Object.entries(categories)
                .sort((a, b) => b[1].total - a[1].total)
                .forEach(([name, data]) => {
                    const catRate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
                    catHtml += `
                        <div class="stat-category-item glass-card">
                            <div class="stat-category-header">
                                <span class="stat-category-name">${escapeHtml(name)}</span>
                                <span class="stat-category-count">${data.completed}/${data.total}</span>
                            </div>
                            <div class="stat-category-bar">
                                <div class="stat-category-fill" style="width: ${catRate}%"></div>
                            </div>
                            <span class="stat-category-rate">%${catRate}</span>
                        </div>
                    `;
                });
            els.statsCategories.innerHTML = catHtml;
        }

        // 5. Update chart
        if (window.Charts && window.Charts.updateOverall) {
            window.Charts.updateOverall(allTasks, range);
        }
    }

    function calculateStreak(tasks) {
        // Calculate consecutive days with all tasks completed
        const tasksByDate = {};
        tasks.forEach(t => {
            if (!tasksByDate[t.date]) tasksByDate[t.date] = { total: 0, completed: 0 };
            tasksByDate[t.date].total++;
            if (t.completed) tasksByDate[t.date].completed++;
        });

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateStr = formatDateISO(checkDate);
            const dayData = tasksByDate[dateStr];

            if (!dayData) {
                // No tasks for this day - if it's today, continue checking
                if (i === 0) continue;
                break;
            }

            if (dayData.total > 0 && dayData.completed === dayData.total) {
                streak++;
            } else if (dayData.total > 0) {
                // Has tasks but not all completed
                if (i === 0) continue; // Give grace for today
                break;
            }
        }

        return streak;
    }

    // ── Task Item Render ─────────────────────────────────────────────

    function renderTaskItem(task) {
        const checkmarkSVG = task.completed
            ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
            : '';

        const timeDisplay = task.time ? `<span class="task-time">🕐 ${task.time}</span>` : '';
        const categoryDisplay = task.category ? `<span class="task-category-badge">${escapeHtml(task.category)}</span>` : '';
        const recurringBadge = task.recurring && task.recurring !== 'none' ? '<span class="task-recurring-badge">🔄</span>' : '';

        return `
            <div class="task-item ${task.completed ? 'completed' : ''} priority-${task.priority}" data-id="${task.id}">
                <button class="task-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}" aria-label="Görevi tamamla">
                    ${checkmarkSVG}
                </button>
                <div class="task-content" data-id="${task.id}">
                    <h4 class="task-title">${escapeHtml(task.title)}</h4>
                    <div class="task-meta">
                        ${timeDisplay}
                        ${categoryDisplay}
                        <span class="task-priority-badge priority-${task.priority}">${PRIORITY_LABELS[task.priority] || 'Orta'}</span>
                        ${recurringBadge}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-edit-btn" data-id="${task.id}" title="Düzenle">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="task-delete-btn" data-id="${task.id}" title="Sil">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    // ── Modal ────────────────────────────────────────────────────────

    function openTaskModal(task) {
        if (!els.taskModal || !els.modalOverlay) return;

        // Reset form
        if (els.taskForm) els.taskForm.reset();
        if (els.taskIdHidden) els.taskIdHidden.value = '';

        if (task) {
            // Editing mode
            if (els.modalTitle) els.modalTitle.textContent = 'Görevi Düzenle';
            if (els.deleteTaskBtn) els.deleteTaskBtn.style.display = 'inline-flex';
            if (els.taskIdHidden) els.taskIdHidden.value = task.id;
            if (els.taskTitleInput) els.taskTitleInput.value = task.title || '';
            if (els.taskDescriptionInput) els.taskDescriptionInput.value = task.description || '';
            if (els.taskDateInput) els.taskDateInput.value = task.date || '';
            if (els.taskTimeInput) els.taskTimeInput.value = task.time || '';
            if (els.taskPrioritySelect) els.taskPrioritySelect.value = task.priority || 'medium';
            if (els.taskCategoryInput) els.taskCategoryInput.value = task.category || '';
            if (els.taskRecurringSelect) els.taskRecurringSelect.value = task.recurring || 'none';
            if (els.taskReminderCheckbox) els.taskReminderCheckbox.checked = task.reminder || false;
            if (els.taskReminderTime) {
                els.taskReminderTime.value = task.reminderTime || '';
                els.taskReminderTime.disabled = !task.reminder;
                els.taskReminderTime.style.display = task.reminder ? 'block' : 'none';
            }
        } else {
            // New task mode
            if (els.modalTitle) els.modalTitle.textContent = 'Yeni Görev';
            if (els.deleteTaskBtn) els.deleteTaskBtn.style.display = 'none';
            if (els.taskDateInput) els.taskDateInput.value = formatDateISO(currentDate);
            if (els.taskPrioritySelect) els.taskPrioritySelect.value = 'medium';
            if (els.taskRecurringSelect) els.taskRecurringSelect.value = 'none';
            if (els.taskReminderCheckbox) els.taskReminderCheckbox.checked = false;
            if (els.taskReminderTime) {
                els.taskReminderTime.disabled = true;
                els.taskReminderTime.style.display = 'none';
            }
        }

        // Show modal with animation
        els.taskModal.classList.add('active');
        els.modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus title input
        setTimeout(() => {
            if (els.taskTitleInput) els.taskTitleInput.focus();
        }, 100);
    }

    function closeTaskModal() {
        if (!els.taskModal || !els.modalOverlay) return;

        els.taskModal.classList.remove('active');
        els.modalOverlay.classList.remove('active');
        document.body.style.overflow = '';

        // Reset form
        if (els.taskForm) els.taskForm.reset();
        if (els.taskIdHidden) els.taskIdHidden.value = '';
    }

    // ── Toast Notifications ──────────────────────────────────────────

    function showToast(message, type = 'info') {
        if (!els.toastContainer) return;

        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${escapeHtml(message)}</span>
            <button class="toast-close" aria-label="Kapat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;

        // Close button handler
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        });

        els.toastContainer.appendChild(toast);

        // Trigger enter animation
        requestAnimationFrame(() => {
            toast.classList.add('toast-enter');
        });

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('toast-exit');
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    }

    // ── Theme ────────────────────────────────────────────────────────

    function toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.dataset.theme || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.dataset.theme = newTheme;
        localStorage.setItem('yazplani-theme', newTheme);

        // Toggle theme icons
        document.querySelectorAll('.theme-icon-dark').forEach(el => {
            el.style.display = newTheme === 'dark' ? 'block' : 'none';
        });
        document.querySelectorAll('.theme-icon-light').forEach(el => {
            el.style.display = newTheme === 'light' ? 'block' : 'none';
        });

        // Update charts
        if (window.Charts && window.Charts.updateTheme) {
            window.Charts.updateTheme();
        }
    }

    function loadSavedTheme() {
        const saved = localStorage.getItem('yazplani-theme') || 'dark';
        document.documentElement.dataset.theme = saved;

        document.querySelectorAll('.theme-icon-dark').forEach(el => {
            el.style.display = saved === 'dark' ? 'block' : 'none';
        });
        document.querySelectorAll('.theme-icon-light').forEach(el => {
            el.style.display = saved === 'light' ? 'block' : 'none';
        });
    }

    // ── PDF Export ───────────────────────────────────────────────────

    async function exportToPDF() {
        try {
            if (els.loadingOverlay) els.loadingOverlay.classList.add('active');

            const contentBody = document.querySelector('.content-body');
            if (!contentBody) {
                showToast('Dışa aktarılacak içerik bulunamadı.', 'error');
                return;
            }

            // Check for html2canvas and jsPDF
            if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
                showToast('PDF kütüphaneleri yüklenmedi.', 'error');
                return;
            }

            const canvas = await html2canvas(contentBody, {
                scale: 2,
                useCORS: true,
                backgroundColor: document.documentElement.dataset.theme === 'dark' ? '#0f172a' : '#f8fafc',
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            const dateStr = formatDateISO(new Date());
            pdf.save(`YazPlani_${dateStr}.pdf`);

            showToast('PDF başarıyla oluşturuldu.', 'success');
        } catch (error) {
            console.error('PDF export error:', error);
            showToast('PDF oluşturulurken bir hata oluştu.', 'error');
        } finally {
            if (els.loadingOverlay) els.loadingOverlay.classList.remove('active');
        }
    }

    // ── Notifications ────────────────────────────────────────────────

    function requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    function showNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification(title, {
                    body,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico'
                });
            } catch (e) {
                console.warn('Notification error:', e);
            }
        }
    }

    function scheduleReminder(task) {
        if (!task.reminder || !task.reminderTime || !task.date) return;

        try {
            const [year, month, day] = task.date.split('-').map(Number);
            const [hours, minutes] = task.reminderTime.split(':').map(Number);
            const reminderDate = new Date(year, month - 1, day, hours, minutes);
            const now = new Date();
            const diff = reminderDate.getTime() - now.getTime();

            if (diff > 0) {
                const timeoutId = setTimeout(() => {
                    showNotification('YazPlanı Hatırlatma', `📋 ${task.title}`);
                    showToast(`Hatırlatma: ${task.title}`, 'info');
                }, diff);
                reminderTimeouts.push(timeoutId);
            }
        } catch (error) {
            console.warn('Schedule reminder error:', error);
        }
    }

    function clearReminders() {
        reminderTimeouts.forEach(id => clearTimeout(id));
        reminderTimeouts = [];
    }

    // ── Sidebar ──────────────────────────────────────────────────────

    function toggleSidebar() {
        if (els.sidebar) els.sidebar.classList.toggle('open');
        if (els.sidebarOverlay) els.sidebarOverlay.classList.toggle('active');
    }

    // ── Utility ──────────────────────────────────────────────────────

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ── Initialize cached elements on module load ────────────────────
    // Defer to make sure DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', cacheElements);
    } else {
        cacheElements();
    }

    // ── Public API ───────────────────────────────────────────────────
    return {
        get currentPage() { return currentPage; },
        set currentPage(val) { currentPage = val; },
        get currentDate() { return currentDate; },
        set currentDate(val) { currentDate = val; },
        get searchQuery() { return searchQuery; },
        set searchQuery(val) { searchQuery = val; },

        switchPage,
        formatDate,
        formatDateShort,
        formatDateISO,
        getWeekRange,
        getMonthRange,
        getDayName,
        getMonthName,
        navigateDate,
        goToToday,
        updateDateLabel,
        renderDailyView,
        renderWeeklyView,
        renderMonthlyView,
        renderStatsView,
        renderTaskItem,
        openTaskModal,
        closeTaskModal,
        showToast,
        toggleTheme,
        loadSavedTheme,
        exportToPDF,
        requestNotificationPermission,
        showNotification,
        scheduleReminder,
        clearReminders,
        toggleSidebar,
        escapeHtml,
        cacheElements
    };
})();
