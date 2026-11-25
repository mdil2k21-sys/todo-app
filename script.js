// ==========================================
// TODO APP — script.js (Production Grade)
// ==========================================

const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const taskCount = document.getElementById('taskCount');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clearCompleted');

// Robust Storage Loader with Try/Catch & Array Validation
let todos = [];
try {
    const saved = localStorage.getItem('todos');
    const parsed = saved ? JSON.parse(saved) : [];
    if (Array.isArray(parsed)) {
        todos = parsed;
    }
} catch (e) {
    console.error('Gagal memuat local storage, mereset state:', e);
    todos = [];
}

let currentFilter = 'all';

renderTodos();


// ===========================
// AUDIO FEEDBACK (Web Audio API)
// ===========================
function playPopSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
        // Audio diblokir browser sebelum interaksi user
    }
}


// ===========================
// SECURE ID GENERATOR
// ===========================
function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}


// ===========================
// CREATE
// ===========================
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;

    todos.push({
        id: generateId(),
        text: text,
        completed: false,
        priority: 'normal'
    });

    saveAndRender();
    todoInput.value = '';
    playPopSound();
});


// ===========================
// READ & RENDER
// ===========================
function renderTodos() {
    const filtered = todos.filter(todo => {
        if (currentFilter === 'active') return !todo.completed;
        if (currentFilter === 'completed') return todo.completed;
        return true;
    });

    if (filtered.length === 0) {
        todoList.innerHTML = `<li class="empty-state">Tidak ada tugas.</li>`;
        updateCount();
        return;
    }

    todoList.innerHTML = filtered.map(todo => `
        <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} aria-label="Tandai selesai">
            <span class="todo-text" title="Klik dua kali untuk mengedit">${escapeHTML(todo.text)}</span>
            <button type="button" class="priority-badge ${todo.priority}" aria-label="Ubah prioritas">${todo.priority}</button>
            <button type="button" class="delete-btn" aria-label="Hapus tugas">&times;</button>
        </li>
    `).join('');

    updateCount();
}


// ===========================
// UPDATE: Single Click Actions
// ===========================
todoList.addEventListener('click', (e) => {
    const li = e.target.closest('.todo-item');
    if (!li) return;
    const id = li.dataset.id;

    // Checkbox -> Toggle Selesai
    if (e.target.classList.contains('todo-checkbox')) {
        todos = todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        playPopSound();
        saveAndRender();
    }

    // Delete Button -> Hapus Task
    if (e.target.classList.contains('delete-btn')) {
        todos = todos.filter(todo => todo.id !== id);
        saveAndRender();
    }

    // Priority Badge -> Ganti Prioritas (normal <-> high)
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
// UPDATE: Double Click to Edit Text
// ===========================
todoList.addEventListener('dblclick', (e) => {
    if (!e.target.classList.contains('todo-text')) return;

    const li = e.target.closest('.todo-item');
    const id = li.dataset.id;
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    li.innerHTML = `
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} disabled>
        <input type="text" class="todo-edit-input" value="${escapeHTML(todo.text)}">
        <button type="button" class="priority-badge ${todo.priority}" disabled>${todo.priority}</button>
        <button type="button" class="delete-btn" disabled>&times;</button>
    `;

    const editInput = li.querySelector('.todo-edit-input');
    editInput.focus();
    editInput.setSelectionRange(editInput.value.length, editInput.value.length);

    let finished = false;

    const saveEdit = () => {
        if (finished) return;
        finished = true;

        const newText = editInput.value.trim();
        if (newText) {
            todos = todos.map(t => t.id === id ? { ...t, text: newText } : t);
            saveAndRender();
        } else {
            renderTodos();
        }
    };

    const cancelEdit = () => {
        if (finished) return;
        finished = true;
        renderTodos(); // Cukup render ulang tanpa write localStorage jika batal
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
    try {
        localStorage.setItem('todos', JSON.stringify(todos));
    } catch (e) {
        console.error('Gagal menyimpan ke localStorage:', e);
    }
    renderTodos();
}

function updateCount() {
    const activeCount = todos.filter(t => !t.completed).length;
    taskCount.textContent = `${activeCount} aktif`;
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g,
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}