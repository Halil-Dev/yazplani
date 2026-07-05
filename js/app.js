/**
 * App Module - Main application controller
 * Namespace: window.App
 */
window.App = (() => {
    'use strict';

    // ── State ────────────────────────────────────────────────────────
    let currentUser = null;
    let unsubscribe = null;
    let reminderTimeouts = [];
    let lastRenderedTasks = []; // Cache for re-renders

    // ── Initialization ───────────────────────────────────────────────

    function init() {
        // Ensure UI elements are cached
        if (window.UI && window.UI.cacheElements) {
            window.UI.cacheElements();
        }

        // Initialize Auth
        if (window.Auth && window.Auth.init) {
            window.Auth.init();
        }

        // Load saved theme
        if (window.UI && window.UI.loadSavedTheme) {
            window.UI.loadSavedTheme();
        }

        // Request notification permission
        if (window.UI && window.UI.requestNotificationPermission) {
            window.UI.requestNotificationPermission();
        }

        // Set up all event listeners
        setupEventListeners();
    }

    // ── Event Listeners ──────────────────────────────────────────────

    function setupEventListeners() {
        // Login
        const googleLoginBtn = document.getElementById('google-login-btn');
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', () => {
                window.Auth.loginWithGoogle();
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                window.Auth.logout();
            });
        }

        // Navigation
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) window.UI.switchPage(page);
            });
        });

        // Date navigation
        const prevDateBtn = document.getElementById('prev-date-btn');
        const nextDateBtn = document.getElementById('next-date-btn');
        const todayBtn = document.getElementById('today-btn');

        if (prevDateBtn) prevDateBtn.addEventListener('click', () => window.UI.navigateDate(-1));
        if (nextDateBtn) nextDateBtn.addEventListener('click', () => window.UI.navigateDate(1));
        if (todayBtn) todayBtn.addEventListener('click', () => window.UI.goToToday());

        // Add task buttons
        const addTaskBtn = document.getElementById('add-task-btn');
        const addTaskFab = document.getElementById('add-task-fab');
        if (addTaskBtn) addTaskBtn.addEventListener('click', () => window.UI.openTaskModal());
        if (addTaskFab) addTaskFab.addEventListener('click', () => window.UI.openTaskModal());

        // Modal controls
        const modalCloseBtn = document.getElementById('modal-close-btn');
        const cancelTaskBtn = document.getElementById('cancel-task-btn');
        const modalOverlay = document.getElementById('modal-overlay');

        if (modalCloseBtn) modalCloseBtn.addEventListener('click', () => window.UI.closeTaskModal());
        if (cancelTaskBtn) cancelTaskBtn.addEventListener('click', () => window.UI.closeTaskModal());
        if (modalOverlay) modalOverlay.addEventListener('click', () => window.UI.closeTaskModal());

        // Task form submit
        const taskForm = document.getElementById('task-form');
        if (taskForm) {
            taskForm.addEventListener('submit', handleTaskSubmit);
        }

        // Delete task button
        const deleteTaskBtn = document.getElementById('delete-task-btn');
        if (deleteTaskBtn) {
            deleteTaskBtn.addEventListener('click', handleTaskDelete);
        }

        // Theme toggle
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => window.UI.toggleTheme());
        }

        // PDF export
        const exportPdfBtn = document.getElementById('export-pdf-btn');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => window.UI.exportToPDF());
        }

        // Mobile menu
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const sidebarOverlay = document.getElementById('sidebar-overlay');

        if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', () => window.UI.toggleSidebar());
        if (sidebarOverlay) sidebarOverlay.addEventListener('click', () => window.UI.toggleSidebar());

        // Search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    handleSearch(e);
                }, 300);
            });
        }

        // Reminder checkbox toggle
        const taskReminderCheckbox = document.getElementById('task-reminder-checkbox');
        const taskReminderTime = document.getElementById('task-reminder-time');
        if (taskReminderCheckbox && taskReminderTime) {
            taskReminderCheckbox.addEventListener('change', () => {
                taskReminderTime.disabled = !taskReminderCheckbox.checked;
                taskReminderTime.style.display = taskReminderCheckbox.checked ? 'block' : 'none';
                if (!taskReminderCheckbox.checked) {
                    taskReminderTime.value = '';
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                window.UI.closeTaskModal();
            }
        });

        // Event delegation for task interactions
        setupTaskEventDelegation();
    }

    function setupTaskEventDelegation() {
        // Use event delegation on the main content area
        document.addEventListener('click', (e) => {
            const target = e.target;

            // Task checkbox toggle
            const checkboxBtn = target.closest('.task-checkbox');
            if (checkboxBtn) {
                e.preventDefault();
                e.stopPropagation();
                const taskId = checkboxBtn.dataset.id;
                if (!taskId) return;

                const isCurrentlyChecked = checkboxBtn.classList.contains('checked');
                window.DB.toggleTask(taskId, !isCurrentlyChecked);
                return;
            }

            // Task edit button
            const editBtn = target.closest('.task-edit-btn');
            if (editBtn) {
                e.preventDefault();
                e.stopPropagation();
                const taskId = editBtn.dataset.id;
                if (!taskId) return;

                const task = lastRenderedTasks.find(t => t.id === taskId);
                if (task) {
                    window.UI.openTaskModal(task);
                }
                return;
            }

            // Task delete button
            const deleteBtn = target.closest('.task-delete-btn');
            if (deleteBtn) {
                e.preventDefault();
                e.stopPropagation();
                const taskId = deleteBtn.dataset.id;
                if (!taskId) return;

                if (window.confirm('Bu görevi silmek istediğinize emin misiniz?')) {
                    window.DB.deleteTask(taskId);
                }
                return;
            }

            // Task content click -> edit
            const taskContent = target.closest('.task-content');
            if (taskContent) {
                const taskId = taskContent.dataset.id;
                if (!taskId) return;

                const task = lastRenderedTasks.find(t => t.id === taskId);
                if (task) {
                    window.UI.openTaskModal(task);
                }
                return;
            }

            // Calendar day click -> switch to daily view
            const calendarDay = target.closest('.calendar-day:not(.empty)');
            if (calendarDay) {
                const dateStr = calendarDay.dataset.date;
                if (!dateStr) return;

                const [y, m, d] = dateStr.split('-').map(Number);
                window.UI.currentDate = new Date(y, m - 1, d);
                window.UI.switchPage('daily');
                return;
            }
        });
    }

    // ── Auth Callbacks ───────────────────────────────────────────────

    function onUserLoggedIn(user) {
        currentUser = user;
        loadCurrentView();
    }

    function onUserLoggedOut() {
        // Unsubscribe from Firestore listener
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }

        // Clear reminder timeouts
        if (window.UI && window.UI.clearReminders) {
            window.UI.clearReminders();
        }
        reminderTimeouts.forEach(id => clearTimeout(id));
        reminderTimeouts = [];

        // Destroy charts
        if (window.Charts && window.Charts.destroy) {
            window.Charts.destroy();
        }

        currentUser = null;
        lastRenderedTasks = [];
    }

    // ── Data Loading ─────────────────────────────────────────────────

    function loadCurrentView() {
        if (!currentUser) return;

        // Unsubscribe from previous listener
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }

        // Clear previous reminders
        if (window.UI && window.UI.clearReminders) {
            window.UI.clearReminders();
        }

        const page = window.UI.currentPage;

        switch (page) {
            case 'daily': {
                const dateStr = window.UI.formatDateISO(window.UI.currentDate);
                unsubscribe = window.DB.subscribeToDailyTasks(dateStr, (tasks) => {
                    lastRenderedTasks = tasks;
                    window.UI.renderDailyView(tasks);
                    scheduleTaskReminders(tasks);
                });
                break;
            }
            case 'weekly': {
                const weekRange = window.UI.getWeekRange(window.UI.currentDate);
                const startStr = window.UI.formatDateISO(weekRange.start);
                const endStr = window.UI.formatDateISO(weekRange.end);
                unsubscribe = window.DB.subscribeToDateRange(startStr, endStr, (tasks) => {
                    lastRenderedTasks = tasks;
                    window.UI.renderWeeklyView(tasks);
                });
                break;
            }
            case 'monthly': {
                const monthRange = window.UI.getMonthRange(window.UI.currentDate);
                const startStr = window.UI.formatDateISO(monthRange.start);
                const endStr = window.UI.formatDateISO(monthRange.end);
                unsubscribe = window.DB.subscribeToDateRange(startStr, endStr, (tasks) => {
                    lastRenderedTasks = tasks;
                    window.UI.renderMonthlyView(tasks);
                });
                break;
            }
            case 'stats': {
                loadStatsView();
                break;
            }
        }
    }

    async function loadStatsView() {
        try {
            // Get tasks from last 90 days
            const today = new Date();
            const past = new Date(today);
            past.setDate(today.getDate() - 90);

            const startStr = window.UI.formatDateISO(past);
            const endStr = window.UI.formatDateISO(today);

            const tasks = await window.DB.getTasksByDateRange(startStr, endStr);
            lastRenderedTasks = tasks;
            window.UI.renderStatsView(tasks);
        } catch (error) {
            console.error('Load stats error:', error);
            if (window.UI && window.UI.showToast) {
                window.UI.showToast('İstatistikler yüklenirken hata oluştu.', 'error');
            }
        }
    }

    // ── Task Reminders ───────────────────────────────────────────────

    function scheduleTaskReminders(tasks) {
        const todayStr = window.UI.formatDateISO(new Date());
        tasks.forEach(task => {
            if (task.date === todayStr && task.reminder && !task.completed) {
                window.UI.scheduleReminder(task);
            }
        });
    }

    // ── Task Form Handlers ───────────────────────────────────────────

    async function handleTaskSubmit(e) {
        e.preventDefault();

        const taskIdHidden = document.getElementById('task-id-hidden');
        const taskTitleInput = document.getElementById('task-title-input');
        const taskDescriptionInput = document.getElementById('task-description-input');
        const taskDateInput = document.getElementById('task-date-input');
        const taskTimeInput = document.getElementById('task-time-input');
        const taskPrioritySelect = document.getElementById('task-priority-select');
        const taskCategoryInput = document.getElementById('task-category-input');
        const taskRecurringSelect = document.getElementById('task-recurring-select');
        const taskReminderCheckbox = document.getElementById('task-reminder-checkbox');
        const taskReminderTime = document.getElementById('task-reminder-time');

        const title = taskTitleInput ? taskTitleInput.value.trim() : '';
        if (!title) {
            window.UI.showToast('Görev başlığı gereklidir.', 'warning');
            if (taskTitleInput) taskTitleInput.focus();
            return;
        }

        const taskData = {
            title: title,
            description: taskDescriptionInput ? taskDescriptionInput.value.trim() : '',
            date: taskDateInput ? taskDateInput.value : window.UI.formatDateISO(window.UI.currentDate),
            time: taskTimeInput ? taskTimeInput.value : '',
            priority: taskPrioritySelect ? taskPrioritySelect.value : 'medium',
            category: taskCategoryInput ? taskCategoryInput.value.trim() : '',
            recurring: taskRecurringSelect ? taskRecurringSelect.value : 'none',
            reminder: taskReminderCheckbox ? taskReminderCheckbox.checked : false,
            reminderTime: taskReminderTime ? taskReminderTime.value : ''
        };

        const taskId = taskIdHidden ? taskIdHidden.value : '';

        try {
            if (taskId) {
                // Update existing task
                await window.DB.updateTask(taskId, taskData);
            } else {
                // Add new task
                await window.DB.addTask(taskData);

                // Generate recurring tasks if needed
                if (taskData.recurring && taskData.recurring !== 'none') {
                    await window.DB.generateRecurringTasks(taskData, 30);
                }
            }

            window.UI.closeTaskModal();
        } catch (error) {
            console.error('Task submit error:', error);
            // Error toast is already shown by DB methods
        }
    }

    async function handleTaskDelete() {
        const taskIdHidden = document.getElementById('task-id-hidden');
        const taskId = taskIdHidden ? taskIdHidden.value : '';

        if (!taskId) return;

        if (window.confirm('Bu görevi silmek istediğinize emin misiniz?')) {
            try {
                await window.DB.deleteTask(taskId);
                window.UI.closeTaskModal();
            } catch (error) {
                console.error('Task delete error:', error);
            }
        }
    }

    // ── Search Handler ───────────────────────────────────────────────

    function handleSearch(e) {
        window.UI.searchQuery = e.target.value.toLowerCase();
        loadCurrentView();
    }

    // ── Public API ───────────────────────────────────────────────────
    return {
        get currentUser() { return currentUser; },
        init,
        onUserLoggedIn,
        onUserLoggedOut,
        loadCurrentView,
        handleTaskSubmit,
        handleTaskDelete,
        handleSearch
    };
})();

// ── Bootstrap ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    window.App.init();
});
