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

// ---- タイトル＋メモ抽出（精度アップ）----
function extractTitleAndMemo(text) {
  const nounMatch = text.match(
    /([^\s]+さん|[^\s]+店|[^\s]+大学|[^\s]+作業|[^\s]+面談|[^\s]+手続き)/,
  );

  if (nounMatch) {
    const title = nounMatch[0];
    const memo = text.replace(title, '').trim();
    return { title, memo };
  }

  if (text.length <= 15) {
    return { title: text || '(タイトル未設定)', memo: '' };
  }

  return {
    title: text.slice(0, 15) + '…',
    memo: text.slice(15),
  };
}

// ---- 文章 → タスク解析 ----
function parseTasks(text, categories) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const dateMatch = line.match(/(\d{1,2}\/\d{1,2})/);
    const timeMatch = line.match(/(\d{1,2}:\d{2}〜\d{1,2}:\d{2})/);

    const date = dateMatch ? dateMatch[0] : '未設定';
    const time = timeMatch ? timeMatch[0] : '';

    const cleaned = line
      .replace(dateMatch?.[0] ?? '', '')
      .replace(timeMatch?.[0] ?? '', '')
      .trim();

    const { title, memo } = extractTitleAndMemo(cleaned);

    const category = categories.find((cat) => line.includes(cat)) || 'その他';

    return {
      id: crypto.randomUUID(),
      title,
      memo,
      date,
      time,
      category,
      done: false,
      selected: false,
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

// ---- メモ編集コンポーネント ----
function createMemoElement(task) {
  const memoDiv = document.createElement('div');
  memoDiv.className = 'task-memo';
  memoDiv.textContent = task.memo || '（メモを追加）';

  memoDiv.addEventListener('click', () => {
    const textarea = document.createElement('textarea');
    textarea.value = task.memo;
    textarea.style.width = '100%';
    textarea.style.fontSize = '14px';
    textarea.style.borderRadius = '8px';
    textarea.style.marginTop = '4px';

    memoDiv.replaceWith(textarea);

    textarea.addEventListener('blur', () => {
      task.memo = textarea.value.trim();
      saveTasks(tasks);
      renderTasks();
    });

    textarea.focus();
  });

  return memoDiv;
}

// ---- タスク表示 ----
function renderTasks() {
  const container = document.getElementById('taskList');
  container.innerHTML = '';

  const grouped = {};
  tasks.forEach((task) => {
    if (!grouped[task.date]) grouped[task.date] = [];
    grouped[task.date].push(task);
  });

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
      if (task.selected) {
        card.classList.add('selected');
      }

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

      const memoDiv = createMemoElement(task);

      const footer = document.createElement('div');
      footer.className = 'task-footer';

      const categorySpan = document.createElement('span');
      categorySpan.className = 'task-category';
      categorySpan.textContent = task.category;

      const rightControls = document.createElement('div');
      rightControls.style.display = 'flex';
      rightControls.style.alignItems = 'center';
      rightControls.style.gap = '8px';

      const selectLabel = document.createElement('label');
      selectLabel.className = 'task-select';

      const selectCheckbox = document.createElement('input');
      selectCheckbox.type = 'checkbox';
      selectCheckbox.checked = task.selected;
      selectCheckbox.addEventListener('change', () => {
        task.selected = selectCheckbox.checked;
        saveTasks(tasks);
        renderTasks();
      });

      const selectText = document.createElement('span');
      selectText.textContent = '選択';

      selectLabel.appendChild(selectCheckbox);
      selectLabel.appendChild(selectText);

      const doneLabel = document.createElement('label');
      doneLabel.className = 'task-done';

      const doneCheckbox = document.createElement('input');
      doneCheckbox.type = 'checkbox';
      doneCheckbox.checked = task.done;
      doneCheckbox.addEventListener('change', () => {
        task.done = doneCheckbox.checked;
        saveTasks(tasks);
      });

      const doneText = document.createElement('span');
      doneText.textContent = '完了';

      doneLabel.appendChild(doneCheckbox);
      doneLabel.appendChild(doneText);

      const deleteButton = document.createElement('button');
      deleteButton.className = 'task-delete-button';
      deleteButton.textContent = '削除';
      deleteButton.addEventListener('click', () => {
        tasks = tasks.filter((t) => t.id !== task.id);
        saveTasks(tasks);
        renderTasks();
      });

      rightControls.appendChild(selectLabel);
      rightControls.appendChild(doneLabel);
      rightControls.appendChild(deleteButton);

      footer.appendChild(categorySpan);
      footer.appendChild(rightControls);

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

  const selectAllButton = document.getElementById('selectAllButton');
  const unselectAllButton = document.getElementById('unselectAllButton');
  const deleteSelectedButton = document.getElementById('deleteSelectedButton');

  renderCategories();
  renderTasks();

  parseButton.addEventListener('click', () => {
    const text = inputText.value.trim();
    if (!text) return;

    const newTasks = parseTasks(text, categories);
    tasks = tasks.concat(newTasks);
    saveTasks(tasks);
    renderTasks();

    inputText.value = '';
  });

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

  selectAllButton.addEventListener('click', () => {
    tasks.forEach((t) => (t.selected = true));
    saveTasks(tasks);
    renderTasks();
  });

  unselectAllButton.addEventListener('click', () => {
    tasks.forEach((t) => (t.selected = false));
    saveTasks(tasks);
    renderTasks();
  });

  deleteSelectedButton.addEventListener('click', () => {
    tasks = tasks.filter((t) => !t.selected);
    saveTasks(tasks);
    renderTasks();
  });
});
