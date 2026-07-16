// ---- LocalStorage ----
function saveTasks(tasks) {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
  return JSON.parse(localStorage.getItem('tasks') || '[]');
}

function saveCategories(categories) {
  localStorage.setItem('categories', JSON.stringify(categories));
}

function loadCategories() {
  return JSON.parse(localStorage.getItem('categories') || '[]');
}

// ---- グローバル状態 ----
let tasks = loadTasks();
let categories = loadCategories();

// ---- 文章 → タスク解析 ----
function parseTasks(text, categories) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const dateMatch = line.match(/(\d{1,2}\/\d{1,2})/);
    const timeMatch = line.match(/(\d{1,2}:\d{2}〜\d{1,2}:\d{2})/);

    const date = dateMatch ? dateMatch[0] : null;
    const time = timeMatch ? timeMatch[0] : null;

    const cleaned = line
      .replace(date ?? '', '')
      .replace(time ?? '', '')
      .trim();

    // タイトル＋メモ（最初の語をタイトル、それ以降をメモに）
    const [title, ...memoParts] = cleaned.split(' ');
    const memo = memoParts.join(' ');

    const category = categories.find((cat) => line.includes(cat)) || 'その他';

    return {
      id: crypto.randomUUID(),
      title: title || '(タイトル未設定)',
      memo,
      date: date || '未設定',
      time: time || '',
      category,
      done: false,
    };
  });
}

// ---- カテゴリ表示 ----
function renderCategories() {
  const list = document.getElementById('categoryList');
  list.innerHTML = '';

  categories.forEach((cat) => {
    const li = document.createElement('li');
    li.className = 'category-item';

    const span = document.createElement('span');
    span.textContent = cat;

    const btn = document.createElement('button');
    btn.textContent = '削除';
    btn.addEventListener('click', () => {
      categories = categories.filter((c) => c !== cat);
      saveCategories(categories);
      renderCategories();
    });

    li.appendChild(span);
    li.appendChild(btn);
    list.appendChild(li);
  });
}

// ---- タスク表示 ----
function renderTasks() {
  const container = document.getElementById('taskList');
  container.innerHTML = '';

  // 日付ごとにグループ化
  const grouped = {};
  tasks.forEach((task) => {
    if (!grouped[task.date]) grouped[task.date] = [];
    grouped[task.date].push(task);
  });

  // 日付順に並べる（文字列ソート）
  const dates = Object.keys(grouped).sort();

  dates.forEach((date) => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'task-date-group';

    const title = document.createElement('div');
    title.className = 'task-date-title';
    title.textContent = date === '未設定' ? '日付未設定' : date;

    groupDiv.appendChild(title);

    grouped[date].forEach((task) => {
      const card = document.createElement('div');
      card.className = 'task-card';

      const header = document.createElement('div');
      header.className = 'task-header';

      const titleSpan = document.createElement('span');
      titleSpan.className = 'task-title';
      titleSpan.textContent = task.title;

      const meta = document.createElement('span');
      meta.className = 'task-meta';
      meta.textContent = task.time ? task.time : '';

      header.appendChild(titleSpan);
      header.appendChild(meta);

      const memoDiv = document.createElement('div');
      memoDiv.className = 'task-memo';
      memoDiv.textContent = task.memo;

      const footer = document.createElement('div');
      footer.className = 'task-footer';

      const categorySpan = document.createElement('span');
      categorySpan.className = 'task-category';
      categorySpan.textContent = task.category;

      const doneDiv = document.createElement('label');
      doneDiv.className = 'task-done';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.done;
      checkbox.addEventListener('change', () => {
        task.done = checkbox.checked;
        saveTasks(tasks);
      });

      const doneText = document.createElement('span');
      doneText.textContent = '完了';

      doneDiv.appendChild(checkbox);
      doneDiv.appendChild(doneText);

      footer.appendChild(categorySpan);
      footer.appendChild(doneDiv);

      card.appendChild(header);
      card.appendChild(memoDiv);
      card.appendChild(footer);

      groupDiv.appendChild(card);
    });

    container.appendChild(groupDiv);
  });
}

// ---- イベント設定 ----
window.addEventListener('DOMContentLoaded', () => {
  const inputText = document.getElementById('inputText');
  const parseButton = document.getElementById('parseButton');
  const newCategoryInput = document.getElementById('newCategoryInput');
  const addCategoryButton = document.getElementById('addCategoryButton');

  // 初期表示
  renderCategories();
  renderTasks();

  // 解析ボタン
  parseButton.addEventListener('click', () => {
    const text = inputText.value.trim();
    if (!text) return;

    const newTasks = parseTasks(text, categories);
    tasks = tasks.concat(newTasks);
    saveTasks(tasks);
    renderTasks();

    inputText.value = '';
  });

  // カテゴリ追加
  addCategoryButton.addEventListener('click', () => {
    const name = newCategoryInput.value.trim();
    if (!name) return;
    if (!categories.includes(name)) {
      categories.push(name);
      saveCategories(categories);
      renderCategories();
    }
    newCategoryInput.value = '';
  });
});
