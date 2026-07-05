/**
 * Database Module - Handles Firestore Operations
 * Namespace: window.DB
 * Firestore structure: users/{uid}/tasks/{taskId}
 */
window.DB = (() => {
    'use strict';

    /**
     * Get the tasks collection reference for current user
     */
    function getTasksRef() {
        const user = auth.currentUser;
        if (!user) throw new Error('Kullanıcı oturum açmamış.');
        return db.collection('users').doc(user.uid).collection('tasks');
    }

    /**
     * Add a new task
     */
    async function addTask(taskData) {
        try {
            const data = {
                title: taskData.title || '',
                description: taskData.description || '',
                date: taskData.date || '',
                time: taskData.time || '',
                priority: taskData.priority || 'medium',
                category: taskData.category || '',
                completed: taskData.completed || false,
                recurring: taskData.recurring || 'none',
                reminder: taskData.reminder || false,
                reminderTime: taskData.reminderTime || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            const docRef = await getTasksRef().add(data);
            if (window.UI && window.UI.showToast) {
                window.UI.showToast('Görev başarıyla eklendi.', 'success');
            }
            return docRef;
        } catch (error) {
            console.error('Add task error:', error);
            if (window.UI && window.UI.showToast) {
                window.UI.showToast('Görev eklenirken bir hata oluştu.', 'error');
            }
            throw error;
        }
    }

    /**
     * Update an existing task
     */
    async function updateTask(taskId, data) {
        try {
            const updateData = {
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await getTasksRef().doc(taskId).update(updateData);
            if (window.UI && window.UI.showToast) {
                window.UI.showToast('Görev başarıyla güncellendi.', 'success');
            }
        } catch (error) {
            console.error('Update task error:', error);
            if (window.UI && window.UI.showToast) {
                window.UI.showToast('Görev güncellenirken bir hata oluştu.', 'error');
            }
            throw error;
        }
    }

    /**
     * Delete a task
     */
    async function deleteTask(taskId) {
        try {
            await getTasksRef().doc(taskId).delete();
            if (window.UI && window.UI.showToast) {
                window.UI.showToast('Görev başarıyla silindi.', 'success');
            }
        } catch (error) {
            console.error('Delete task error:', error);
            if (window.UI && window.UI.showToast) {
                window.UI.showToast('Görev silinirken bir hata oluştu.', 'error');
            }
            throw error;
        }
    }

    /**
     * Toggle the completed status of a task
     */
    async function toggleTask(taskId, completed) {
        try {
            await getTasksRef().doc(taskId).update({
                completed: completed,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Toggle task error:', error);
            if (window.UI && window.UI.showToast) {
                window.UI.showToast('Görev durumu değiştirilirken bir hata oluştu.', 'error');
            }
            throw error;
        }
    }

    /**
     * Get tasks for a specific date
     */
    async function getTasksByDate(dateStr) {
        try {
            const snapshot = await getTasksRef()
                .where('date', '==', dateStr)
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Get tasks by date error:', error);
            if (window.UI && window.UI.showToast) {
                window.UI.showToast('Görevler yüklenirken bir hata oluştu.', 'error');
            }
            return [];
        }
    }

    /**
     * Get tasks within a date range (inclusive)
     */
    async function getTasksByDateRange(startDate, endDate) {
        try {
            const snapshot = await getTasksRef()
                .where('date', '>=', startDate)
                .where('date', '<=', endDate)
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Get tasks by date range error:', error);
            if (window.UI && window.UI.showToast) {
                window.UI.showToast('Görevler yüklenirken bir hata oluştu.', 'error');
            }
            return [];
        }
    }

    /**
     * Get all tasks for the current user
     */
    async function getAllTasks() {
        try {
            const snapshot = await getTasksRef().get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Get all tasks error:', error);
            if (window.UI && window.UI.showToast) {
                window.UI.showToast('Görevler yüklenirken bir hata oluştu.', 'error');
            }
            return [];
        }
    }

    /**
     * Real-time listener for tasks in a date range
     * Returns unsubscribe function
     */
    function subscribeToDateRange(startDate, endDate, callback) {
        try {
            return getTasksRef()
                .where('date', '>=', startDate)
                .where('date', '<=', endDate)
                .onSnapshot(snapshot => {
                    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    callback(tasks);
                }, error => {
                    console.error('Subscribe to date range error:', error);
                    if (window.UI && window.UI.showToast) {
                        window.UI.showToast('Gerçek zamanlı güncelleme hatası.', 'error');
                    }
                });
        } catch (error) {
            console.error('Subscribe setup error:', error);
            return () => {};
        }
    }

    /**
     * Real-time listener for tasks on a specific date
     * Returns unsubscribe function
     */
    function subscribeToDailyTasks(dateStr, callback) {
        try {
            return getTasksRef()
                .where('date', '==', dateStr)
                .onSnapshot(snapshot => {
                    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    callback(tasks);
                }, error => {
                    console.error('Subscribe to daily tasks error:', error);
                    if (window.UI && window.UI.showToast) {
                        window.UI.showToast('Gerçek zamanlı güncelleme hatası.', 'error');
                    }
                });
        } catch (error) {
            console.error('Subscribe setup error:', error);
            return () => {};
        }
    }

    /**
     * Generate recurring task occurrences
     * Creates new task documents for the next `count` occurrences
     */
    async function generateRecurringTasks(baseTask, count = 30) {
        try {
            if (!baseTask.recurring || baseTask.recurring === 'none') return;

            const baseDateParts = baseTask.date.split('-');
            let currentDate = new Date(
                parseInt(baseDateParts[0]),
                parseInt(baseDateParts[1]) - 1,
                parseInt(baseDateParts[2])
            );

            // Get existing tasks to check for duplicates
            const existingTasks = await getAllTasks();
            const existingKeys = new Set(
                existingTasks.map(t => `${t.title}__${t.date}`)
            );

            const batch = db.batch();
            let batchCount = 0;
            const MAX_BATCH = 500; // Firestore batch limit

            for (let i = 1; i <= count; i++) {
                // Calculate next date based on recurring type
                const nextDate = new Date(currentDate);
                switch (baseTask.recurring) {
                    case 'daily':
                        nextDate.setDate(currentDate.getDate() + i);
                        break;
                    case 'weekly':
                        nextDate.setDate(currentDate.getDate() + (i * 7));
                        break;
                    case 'monthly':
                        nextDate.setMonth(currentDate.getMonth() + i);
                        break;
                    default:
                        return;
                }

                const year = nextDate.getFullYear();
                const month = String(nextDate.getMonth() + 1).padStart(2, '0');
                const day = String(nextDate.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                const key = `${baseTask.title}__${dateStr}`;

                // Skip if task already exists for this date
                if (existingKeys.has(key)) continue;

                const newTaskRef = getTasksRef().doc();
                batch.set(newTaskRef, {
                    title: baseTask.title,
                    description: baseTask.description || '',
                    date: dateStr,
                    time: baseTask.time || '',
                    priority: baseTask.priority || 'medium',
                    category: baseTask.category || '',
                    completed: false,
                    recurring: baseTask.recurring,
                    reminder: baseTask.reminder || false,
                    reminderTime: baseTask.reminderTime || '',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                batchCount++;

                // Commit batch if approaching limit
                if (batchCount >= MAX_BATCH) break;
            }

            if (batchCount > 0) {
                await batch.commit();
                if (window.UI && window.UI.showToast) {
                    window.UI.showToast(`${batchCount} tekrarlanan görev oluşturuldu.`, 'info');
                }
            }
        } catch (error) {
            console.error('Generate recurring tasks error:', error);
            if (window.UI && window.UI.showToast) {
                window.UI.showToast('Tekrarlanan görevler oluşturulurken hata oluştu.', 'error');
            }
        }
    }

    return {
        getTasksRef,
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
        getTasksByDate,
        getTasksByDateRange,
        getAllTasks,
        subscribeToDateRange,
        subscribeToDailyTasks,
        generateRecurringTasks
    };
})();
