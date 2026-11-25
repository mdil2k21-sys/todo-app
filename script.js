// ===========================
// TODO APP — script.js
// CRUD + LocalStorage + Edit + Priority + Sound
// ===========================

const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const taskCount = document.getElementById('taskCount');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clearCompleted');

// Priority selector (buat di form, kalau ada)
let currentPriority = 'normal';

let todos = JSON.parse(localStorage.getItem('todos')) || [];
let currentFilter = 'all';

renderTodos();


// ===========================
// SOUND EFFECT (Web Audio API - No external files needed)
// ===========================
function playPopSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
        // Ignore if audio blocked
    }
}


// ===========================
// CREATE
// ===========================
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;

    todos.push({
        id: Date.now(),
        text: text,
        completed: false,
        priority: 'normal' // default priority: normal / high
    });

    saveAndRender();
    todoInput.value = '';
    playPopSound();
});


// ===========================
// READ / RENDER
// ===========================
function renderTodos() {
    const filtered = todos.filter(todo => {
        if (currentFilter === 'active') return !todo.completed;
        if (currentFilter === 'completed') return todo.completed;
        return true;
    });

    if (filtered.length === 0) {
        todoList.innerHTML = `<li class="empty-state">Tidak ada task.</li>`;
        updateCount();
        return;
    }

    todoList.innerHTML = filtered.map(todo => `
        <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
            <span class="todo-text">${escapeHTML(todo.text)}</span>
            <span class="priority-badge ${todo.priority}">${todo.priority}</span>
            <button class="delete-btn" aria-label="Hapus">&times;</button>
        </li>
    `).join('');

    updateCount();
}


// ===========================
// UPDATE: single click (checkbox, delete, priority toggle)
// ===========================
todoList.addEventListener('click', (e) => {
    const li = e.target.closest('.todo-item');
    if (!li) return;
    const id = Number(li.dataset.id);

    // Checkbox -> toggle selesai
    if (e.target.classList.contains('todo-checkbox')) {
        todos = todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        playPopSound();
        saveAndRender();
    }

    // Delete btn -> hapus task
    if (e.target.classList.contains('delete-btn')) {
        todos = todos.filter(todo => todo.id !== id);
        saveAndRender();
    }

    // Klik badge priority -> ganti (normal <-> high)
    if (e.target.classList.contains('priority-badge')) {
        todos = todos.map(todo => {
            if (todo.id === id) {
                const nextPrio = todo.priority === 'normal' ? 'high' : 'normal';
                return { ...todo, priority: nextPrio };
            }
            return todo;
        });
        saveAndRender();
    }
});


// ===========================
// UPDATE: double click to edit text
// ===========================
todoList.addEventListener('dblclick', (e) => {
    if (!e.target.classList.contains('todo-text')) return;

    const li = e.target.closest('.todo-item');
    const id = Number(li.dataset.id);
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    li.innerHTML = `
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} disabled>
        <input type="text" class="todo-edit-input" value="${escapeHTML(todo.text)}">
        <button class="delete-btn" disabled>&times;</button>
    `;

    const editInput = li.querySelector('.todo-edit-input');
    editInput.focus();
    editInput.setSelectionRange(editInput.value.length, editInput.value.length);

    let done = false;

    const saveEdit = () => {
        if (done) return;
        done = true;

        const newText = editInput.value.trim();
        if (newText) {
            todos = todos.map(t => t.id === id ? { ...t, text: newText } : t);
        }
        saveAndRender();
    };

    const cancelEdit = () => {
        if (done) return;
        done = true;
        saveAndRender();
    };

    editInput.addEventListener('blur', saveEdit);
    editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveEdit();
        if (e.key === 'Escape') cancelEdit();
    });
});


// ===========================
// FILTER & CLEAR
// ===========================
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTodos();
    });
});

clearCompletedBtn.addEventListener('click', () => {
    todos = todos.filter(todo => !todo.completed);
    saveAndRender();
});


// ===========================
// HELPERS
// ===========================
function saveAndRender() {
    localStorage.setItem('todos', JSON.stringify(todos));
    renderTodos();
}

function updateCount() {
    taskCount.textContent = `${todos.filter(t => !t.completed).length} active`;
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g,
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}