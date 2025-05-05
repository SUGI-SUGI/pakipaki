// タスクのデータ構造
class Task {
    constructor(id, title, description, status, subTasks = []) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.status = status;
        this.subTasks = subTasks;
    }
}

// アプリケーションの状態管理
class KanbanApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentTaskId = null;
        this.initializeElements();
        this.attachEventListeners();
        this.renderTasks();
    }

    initializeElements() {
        // モーダル関連
        this.modal = document.getElementById('taskModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.taskForm = document.getElementById('taskForm');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.cancelBtn = document.getElementById('cancelBtn');

        // フォーム要素
        this.titleInput = document.getElementById('taskTitle');
        this.descriptionInput = document.getElementById('taskDescription');
        this.statusInput = document.getElementById('taskStatus');

        // タスクリスト
        this.taskLists = document.querySelectorAll('.task-list');
    }

    attachEventListeners() {
        // タスク追加ボタン
        this.addTaskBtn.addEventListener('click', () => this.openModal());

        // キャンセルボタン
        this.cancelBtn.addEventListener('click', () => this.closeModal());

        // フォーム送信
        this.taskForm.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // ドラッグ&ドロップ
        this.taskLists.forEach(list => {
            list.addEventListener('dragover', (e) => this.handleDragOver(e));
            list.addEventListener('drop', (e) => this.handleDrop(e));
        });
    }

    openModal(taskId = null) {
        this.currentTaskId = taskId;
        const task = taskId ? this.tasks.find(t => t.id === taskId) : null;

        this.modalTitle.textContent = taskId ? 'タスクを編集' : 'タスクを追加';
        this.titleInput.value = task ? task.title : '';
        this.descriptionInput.value = task ? task.description : '';
        this.statusInput.value = task ? task.status : 'todo';

        this.modal.classList.add('show');
    }

    closeModal() {
        this.modal.classList.remove('show');
        this.taskForm.reset();
        this.currentTaskId = null;
    }

    handleFormSubmit(e) {
        e.preventDefault();

        const taskData = {
            id: this.currentTaskId || crypto.randomUUID(),
            title: this.titleInput.value.trim(),
            description: this.descriptionInput.value.trim(),
            status: this.statusInput.value,
            subTasks: this.currentTaskId
                ? this.tasks.find(t => t.id === this.currentTaskId).subTasks
                : []
        };

        if (this.currentTaskId) {
            this.updateTask(taskData);
        } else {
            this.addTask(taskData);
        }

        this.closeModal();
    }

    addTask(task) {
        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
    }

    updateTask(updatedTask) {
        const index = this.tasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
            this.tasks[index] = updatedTask;
            this.saveTasks();
            this.renderTasks();
        }
    }

    deleteTask(taskId) {
        if (confirm('このタスクを削除してもよろしいですか？')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.renderTasks();
        }
    }

    addSubTask(taskId, title) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.subTasks.push({
                id: crypto.randomUUID(),
                title: title.trim(),
                completed: false
            });
            this.saveTasks();
            this.renderTasks();
        }
    }

    toggleSubTask(taskId, subTaskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const subTask = task.subTasks.find(st => st.id === subTaskId);
            if (subTask) {
                subTask.completed = !subTask.completed;
                this.saveTasks();
                this.renderTasks();
            }
        }
    }

    deleteSubTask(taskId, subTaskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.subTasks = task.subTasks.filter(st => st.id !== subTaskId);
            this.saveTasks();
            this.renderTasks();
        }
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    renderTasks() {
        // タスクリストをクリア
        this.taskLists.forEach(list => list.innerHTML = '');

        // タスクを描画
        this.tasks.forEach(task => {
            const taskList = document.querySelector(`.task-list[data-status="${task.status}"]`);
            if (taskList) {
                const taskElement = this.createTaskElement(task);
                taskList.appendChild(taskElement);
            }
        });
    }

    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-card';
        taskElement.draggable = true;
        taskElement.dataset.taskId = task.id;

        taskElement.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description}</p>
            <div class="task-actions">
                <button class="btn btn-primary edit-task">編集</button>
                <button class="btn btn-secondary delete-task">削除</button>
            </div>
            <div class="subtask-list">
                ${task.subTasks.map(subTask => `
                    <div class="subtask-item ${subTask.completed ? 'completed' : ''}" data-subtask-id="${subTask.id}">
                        <input type="checkbox" ${subTask.completed ? 'checked' : ''}>
                        <span>${subTask.title}</span>
                        <button class="btn btn-secondary delete-subtask">削除</button>
                    </div>
                `).join('')}
            </div>
            <div class="add-subtask">
                <input type="text" placeholder="新しいサブタスク" class="subtask-input">
                <button class="btn btn-primary add-subtask-btn">追加</button>
            </div>
        `;

        // イベントリスナーの設定
        taskElement.querySelector('.edit-task').addEventListener('click', () => this.openModal(task.id));
        taskElement.querySelector('.delete-task').addEventListener('click', () => this.deleteTask(task.id));

        // サブタスク関連のイベントリスナー
        taskElement.querySelectorAll('.subtask-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const subTaskId = e.target.closest('.subtask-item').dataset.subtaskId;
                this.toggleSubTask(task.id, subTaskId);
            });
        });

        taskElement.querySelectorAll('.delete-subtask').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const subTaskId = e.target.closest('.subtask-item').dataset.subtaskId;
                this.deleteSubTask(task.id, subTaskId);
            });
        });

        const addSubTaskBtn = taskElement.querySelector('.add-subtask-btn');
        const subTaskInput = taskElement.querySelector('.subtask-input');
        addSubTaskBtn.addEventListener('click', () => {
            const title = subTaskInput.value.trim();
            if (title) {
                this.addSubTask(task.id, title);
                subTaskInput.value = '';
            }
        });

        // ドラッグ&ドロップ
        taskElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
            taskElement.classList.add('dragging');
        });

        taskElement.addEventListener('dragend', () => {
            taskElement.classList.remove('dragging');
        });

        return taskElement;
    }

    handleDragOver(e) {
        e.preventDefault();
        const taskList = e.target.closest('.task-list');
        if (taskList) {
            taskList.classList.add('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        const taskList = e.target.closest('.task-list');
        if (taskList) {
            taskList.classList.remove('drag-over');
            const taskId = e.dataTransfer.getData('text/plain');
            const newStatus = taskList.dataset.status;
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                task.status = newStatus;
                this.saveTasks();
                this.renderTasks();
            }
        }
    }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    new KanbanApp();
}); 