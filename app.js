(function () {
    'use strict';

    const loader = document.getElementById('loader');
    const loaderProgressBar = document.getElementById('loaderProgressBar');
    const app = document.getElementById('app');
    const todoForm = document.getElementById('todoForm');
    const todoInput = document.getElementById('todoInput');
    const todoList = document.getElementById('todoList');
    const emptyState = document.getElementById('emptyState');
    const todoFooter = document.getElementById('todoFooter');
    const totalCount = document.getElementById('totalCount');
    const activeCount = document.getElementById('activeCount');
    const completedCount = document.getElementById('completedCount');
    const itemsLeft = document.getElementById('itemsLeft');
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const currentDateEl = document.getElementById('currentDate');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

    let todos = JSON.parse(localStorage.getItem('taskflow_todos')) || [];
    let currentFilter = 'all';
    let deleteTargetId = null;

    function initLoader() {
        const duration = 3000;
        const interval = 30;
        let elapsed = 0;

        const timer = setInterval(function () {
            elapsed += interval;
            const progress = Math.min((elapsed / duration) * 100, 100);
            loaderProgressBar.style.width = progress + '%';

            if (elapsed >= duration) {
                clearInterval(timer);
                loader.classList.add('fade-out');
                app.classList.remove('app-hidden');
                app.classList.add('app-visible');
            }
        }, interval);
    }

    function setCurrentDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateEl.textContent = new Date().toLocaleDateString('en-US', options);
    }

    function saveTodos() {
        localStorage.setItem('taskflow_todos', JSON.stringify(todos));
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    function updateStats() {
        const total = todos.length;
        const completed = todos.filter(function (t) { return t.completed; }).length;
        const active = total - completed;

        animateNumber(totalCount, total);
        animateNumber(activeCount, active);
        animateNumber(completedCount, completed);

        itemsLeft.textContent = active + (active === 1 ? ' item left' : ' items left');
        todoFooter.style.display = total > 0 ? 'flex' : 'none';
    }

    function animateNumber(element, target) {
        const current = parseInt(element.textContent, 10) || 0;
        if (current === target) return;

        const step = target > current ? 1 : -1;
        let value = current;

        const anim = setInterval(function () {
            value += step;
            element.textContent = value;
            if (value === target) clearInterval(anim);
        }, 50);
    }

    function getFilteredTodos() {
        switch (currentFilter) {
            case 'active':
                return todos.filter(function (t) { return !t.completed; });
            case 'completed':
                return todos.filter(function (t) { return t.completed; });
            default:
                return todos;
        }
    }

    function renderTodos() {
        const filtered = getFilteredTodos();
        todoList.innerHTML = '';

        if (filtered.length === 0) {
            emptyState.classList.add('show');
            if (currentFilter === 'all' && todos.length === 0) {
                emptyState.querySelector('h5').textContent = 'No tasks yet';
                emptyState.querySelector('p').textContent = 'Add a task above to get started on your productive day!';
            } else if (currentFilter === 'active') {
                emptyState.querySelector('h5').textContent = 'No active tasks';
                emptyState.querySelector('p').textContent = 'All caught up! Great job staying productive.';
            } else {
                emptyState.querySelector('h5').textContent = 'No completed tasks';
                emptyState.querySelector('p').textContent = 'Complete some tasks to see them here.';
            }
        } else {
            emptyState.classList.remove('show');
        }

        filtered.forEach(function (todo, index) {
            const li = document.createElement('li');
            li.className = 'todo-item' + (todo.completed ? ' completed' : '');
            li.dataset.id = todo.id;
            li.style.animationDelay = (index * 0.05) + 's';

            li.innerHTML =
                '<label class="todo-checkbox">' +
                    '<input type="checkbox"' + (todo.completed ? ' checked' : '') + ' aria-label="Toggle task">' +
                    '<span class="checkmark"><i class="bi bi-check-lg"></i></span>' +
                '</label>' +
                '<span class="todo-text">' + escapeHtml(todo.text) + '</span>' +
                '<span class="todo-time">' + formatTime(todo.createdAt) + '</span>' +
                '<div class="todo-actions">' +
                    '<button class="action-btn delete-btn" aria-label="Delete task">' +
                        '<i class="bi bi-trash3"></i>' +
                    '</button>' +
                '</div>';

            todoList.appendChild(li);
        });

        updateStats();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===== Add Todo =====
    function addTodo(text) {
        const trimmed = text.trim();
        if (!trimmed) return;

        todos.unshift({
            id: generateId(),
            text: trimmed,
            completed: false,
            createdAt: Date.now()
        });

        saveTodos();
        renderTodos();
        todoInput.value = '';
        todoInput.focus();
    }

    function toggleTodo(id) {
        todos = todos.map(function (t) {
            if (t.id === id) {
                return Object.assign({}, t, { completed: !t.completed });
            }
            return t;
        });
        saveTodos();
        renderTodos();
    }

    function deleteTodo(id) {
        const item = todoList.querySelector('[data-id="' + id + '"]');
        if (item) {
            item.classList.add('removing');
            setTimeout(function () {
                todos = todos.filter(function (t) { return t.id !== id; });
                saveTodos();
                renderTodos();
            }, 300);
        } else {
            todos = todos.filter(function (t) { return t.id !== id; });
            saveTodos();
            renderTodos();
        }
    }

    function clearCompleted() {
        todos = todos.filter(function (t) { return !t.completed; });
        saveTodos();
        renderTodos();
    }

    function clearAll() {
        if (todos.length === 0) return;
        todos = [];
        saveTodos();
        renderTodos();
    }

    todoForm.addEventListener('submit', function (e) {
        e.preventDefault();
        addTodo(todoInput.value);
    });

    todoList.addEventListener('change', function (e) {
        if (e.target.type === 'checkbox') {
            const id = e.target.closest('.todo-item').dataset.id;
            toggleTodo(id);
        }
    });

    todoList.addEventListener('click', function (e) {
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            const id = deleteBtn.closest('.todo-item').dataset.id;
            deleteTargetId = id;
            deleteModal.show();
        }
    });

    confirmDeleteBtn.addEventListener('click', function () {
        if (deleteTargetId) {
            deleteTodo(deleteTargetId);
            deleteTargetId = null;
            deleteModal.hide();
        }
    });

    clearCompletedBtn.addEventListener('click', clearCompleted);

    clearAllBtn.addEventListener('click', function () {
        if (todos.length > 0 && confirm('Are you sure you want to delete all tasks?')) {
            clearAll();
        }
    });

    document.querySelectorAll('.filter-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.filter-btn').forEach(function (b) {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTodos();
        });
    });

    initLoader();
    setCurrentDate();
    renderTodos();
})();
