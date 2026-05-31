let $ = document;

function _id(idName) {
  return $.getElementById(idName);
}
function _querySelector(q) {
  return $.querySelector(q);
}
function _querySelectorAll(q) {
  return $.querySelectorAll(q);
}
function _createElement(name) {
  return $.createElement(name);
}

const addTaskBtn = _id('addTaskBtn');
const closeModalBtn = _id('closeModal');
const saveTaskBtn = _id('saveTask');
const modal = _id('taskModal');
const taskInput = _id('taskTitle');
const alert = _querySelector('.alert');

let isPersian = false;
let draggedTask = null;
let draggedElement = null;
let initialColumn = null;

/* ---------------- LOCAL STORAGE ---------------- */

function getTasksFromLocalStorage() {
  const tasks = localStorage.getItem('tasks');
  return tasks ? JSON.parse(tasks) : {};
}

function saveTasksToLocalStorage(tasks) {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

/* ---------------- RENDER ---------------- */

function renderTasks() {
  const tasks = getTasksFromLocalStorage();

  _querySelectorAll('.column .tasks').forEach((col) => (col.innerHTML = ''));

  Object.entries(tasks).forEach(([status, taskList]) => {
    const column = _querySelector(`.column[data-status="${status}"] .tasks`);
    if (!column) return;

    taskList.forEach((taskData) => {
      const el = createTaskElement(taskData.html, taskData.id, status);
      column.appendChild(el);
    });
  });
}

/* ---------------- CREATE TASK ELEMENT ---------------- */

function createTaskElement(html, id = null, status = 'noStatus') {
  const div = _createElement('div');
  div.className = 'task';
  div.draggable = true;

  div.dataset.id = id || Date.now().toString();
  div.dataset.status = status;

  // ساخت HTML ذخیره‌شده
  div.innerHTML = html;

  const deleteBtn = div.querySelector('.task-delete');
  if (deleteBtn) {
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteTask(div.dataset.id, status);
      div.remove();
    };
  }

  div.addEventListener('dragstart', (e) => handleDragStart(e, div));
  div.addEventListener('dragend', handleDragEnd);

  return div;
}

/* ---------------- MODAL ---------------- */

function showModal() {
  taskInput.style.direction = 'ltr';
  taskInput.style.textAlign = 'left';
  modal.classList.remove('hidden');
  modal.classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function hideModal() {
  modal.classList.remove('visible');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
  taskInput.value = '';
}

/* ---------------- SAVE NEW TASK ---------------- */

function saveTask() {
  const title = taskInput.value.trim();

  if (!title) {
    alert.classList.add('active');
    setTimeout(() => alert.classList.remove('active'), 2000);
    return;
  }

  const html = `
    <span class="task__span" style="direction:${isPersian ? 'rtl' : 'ltr'}; text-align:${isPersian ? 'right' : 'left'}">
       ${title}
    </span>
    <button class="task-delete">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
  `;

  const data = addTaskToStorage(html, 'noStatus');

  const el = createTaskElement(data.html, data.id, 'noStatus');
  _querySelector('.column[data-status="noStatus"] .tasks').appendChild(el);

  hideModal();
}

function addTaskToStorage(html, status = 'noStatus') {
  const tasks = getTasksFromLocalStorage();

  if (!tasks[status]) tasks[status] = [];

  const newTask = { id: Date.now().toString(), html };
  tasks[status].push(newTask);

  saveTasksToLocalStorage(tasks);

  return newTask;
}

/* ---------------- DELETE TASK ---------------- */

function deleteTask(id, status) {
  const tasks = getTasksFromLocalStorage();
  if (!tasks[status]) return;

  tasks[status] = tasks[status].filter((t) => t.id !== id);
  saveTasksToLocalStorage(tasks);
}

/* ---------------- PERSIAN DETECTION ---------------- */

taskInput.addEventListener('input', () => {
  const text = taskInput.value.trim();
  isPersian = /[\u0600-\u06FF]/.test(text);

  taskInput.style.direction = isPersian ? 'rtl' : 'ltr';
  taskInput.style.textAlign = isPersian ? 'right' : 'left';
});

/* ---------------- DRAG & DROP ---------------- */

function moveTask(taskId, source, target) {
  const tasks = getTasksFromLocalStorage();
  if (!tasks[source]) return;

  const index = tasks[source].findIndex((t) => t.id === taskId);
  if (index === -1) return;

  const [task] = tasks[source].splice(index, 1);

  if (!tasks[target]) tasks[target] = [];
  tasks[target].push(task);

  saveTasksToLocalStorage(tasks);
}

function handleDragStart(e, element) {
  draggedTask = element.dataset.id;
  initialColumn = element.dataset.status;
  draggedElement = element;

  setTimeout(() => element.classList.add('dragging'), 0);

  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', draggedTask);
}

function handleDragEnd() {
  draggedElement?.classList.remove('dragging');
  draggedTask = null;
  draggedElement = null;
  initialColumn = null;

  _querySelectorAll('.column .tasks').forEach((z) => z.classList.remove('drag-over'));
}

function handleDrop(e) {
  e.preventDefault();
  const zone = e.currentTarget.closest('.column');
  const targetStatus = zone.dataset.status;
  const targetTasks = zone.querySelector('.tasks');

  targetTasks.classList.remove('drag-over');

  if (draggedTask && initialColumn && targetStatus && draggedElement) {
    moveTask(draggedTask, initialColumn, targetStatus);
    targetTasks.appendChild(draggedElement);
    draggedElement.dataset.status = targetStatus;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  _querySelectorAll('.column .tasks').forEach((zone) => {
    zone.addEventListener('dragover', (e) => e.preventDefault());
    zone.addEventListener('dragenter', (e) => {
      e.preventDefault();
      e.currentTarget.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', (e) => e.currentTarget.classList.remove('drag-over'));
    zone.addEventListener('drop', handleDrop);
  });

  renderTasks();
});

/* BUTTON EVENTS */
addTaskBtn.addEventListener('click', showModal);
closeModalBtn.addEventListener('click', hideModal);
saveTaskBtn.addEventListener('click', saveTask);
