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
let searchQuery = '';
const inputText = document.getElementById('inputText');
const inputPlaceholder = document.getElementById('inputPlaceholder');

inputText.addEventListener('input', () => {
  if (inputText.value.trim() === '') {
    inputPlaceholder.style.top = '8px'; // 初期位置
  } else {
    inputPlaceholder.style.top = '36px'; // 1行下
  }
});

// ---- タイトル＋メモ抽出（超強化版） ----
function extractTitleAndMemo(text) {
  // 1. タスクでよく使われる語を大量に追加（一般化）
  const keywords = [
    // 行動系
    '面談',
    '会議',
    'ミーティング',
    '打ち合わせ',
    '提出',
    '申請',
    '手続き',
    '支払い',
    '確認',
    '連絡',
    '返信',
    '移動',
    '出発',
    '到着',
    '買い物',
    '準備',
    '作成',
    '編集',
    '修正',
    'チェック',
    '掃除',
    '洗濯',
    '整理',
    '勉強',
    '学習',
    '復習',
    '練習',
    '作業',
    '対応',
    '受け取り',
    '送付',
    '電話',
    '通話',
    '相談',
    '記入',
    '登録',
    '更新',
    '予約',
    'キャンセル',
    '訪問',
    '来訪',
    '報告',
    '計画',
    '調整',
    '確認',
    '提出',
    '対応',

    // 場所系
    '区役所',
    '市役所',
    '役場',
    '病院',
    'クリニック',
    'センター',
    '学校',
    '大学',
    '高校',
    '中学',
    '会社',
    '事務所',
    '支店',
    '営業所',
    '店舗',

    // サービス系
    'ソフトバンク',
    'ドコモ',
    'au',
    '楽天',
    'Amazon',
    'Netflix',
    'YouTube',
    '銀行',
    'ATM',
    '郵便局',
    'コンビニ',

    // 生活系
    '料理',
    '買い出し',
    '買い物',
    '片付け',
    '休息',
    '睡眠',
    '運動',
    '散歩',
    'ストレッチ',
    '筋トレ',

    // 仕事系
    '資料作成',
    '報告書',
    'プレゼン',
    'ミーティング',
    '会議',
    '分析',
    'チェック',
    'レビュー',
  ];

  // 2. 名詞句抽出（一般化）
  const nounPattern =
    /([^\s]+(さん|君|様|店|科|課|局|センター|病院|大学|高校|中学|会社|事務所|支店|営業所|室|部))/;
  const nounMatch = text.match(nounPattern);

  if (nounMatch) {
    const title = nounMatch[0];
    const memo = text.replace(title, '').trim();
    return { title, memo };
  }

  // 3. キーワード抽出
  for (const word of keywords) {
    if (text.includes(word)) {
      const title = word;
      const memo = text.replace(word, '').trim();
      return { title, memo };
    }
  }

  // 4. 文頭の名詞句抽出（一般化）
  const firstNoun = text.match(/^[^はをにがで、。 ]+/);
  if (firstNoun) {
    const title = firstNoun[0];
    const memo = text.replace(title, '').trim();
    return { title, memo };
  }

  // 5. fallback：文章の最初の15文字をタイトルに
  if (text.length <= 15) {
    return { title: text || '(タイトル未設定)', memo: '' };
  }

  return {
    title: text.slice(0, 15) + '…',
    memo: text.slice(15),
  };
}

// ---- 時間を数値に変換（ソート用）----
function getTimeValue(task) {
  if (!task.time) return 999999; // 時間未設定は最後に
  const match = task.time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 999999;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  return h * 60 + m;
}
const inputText = document.getElementById('inputText');
const inputPlaceholder = document.getElementById('inputPlaceholder');

inputText.addEventListener('input', () => {
  if (inputText.value.trim() === '') {
    inputPlaceholder.style.top = '8px'; // 初期位置
  } else {
    inputPlaceholder.style.top = '36px'; // 1行下
  }
});

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

// ---- メモ編集 ----
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

// ---- 日付編集 ----
function editDateForGroup(date) {
  const newDate = prompt(
    '新しい日付を入力してください（例：7/20）',
    date === '未設定' ? '' : date,
  );
  if (!newDate) return;
  tasks.forEach((t) => {
    if (t.date === date) {
      t.date = newDate;
    }
  });
  saveTasks(tasks);
  renderTasks();
}

// ---- タスク表示 ----
function renderTasks() {
  const container = document.getElementById('taskList');
  container.innerHTML = '';

  // 検索フィルタ
  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // 日付ごとにグループ化
  const grouped = {};
  filteredTasks.forEach((task) => {
    if (!grouped[task.date]) grouped[task.date] = [];
    grouped[task.date].push(task);
  });

  const dates = Object.keys(grouped).sort();

  dates.forEach((date) => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'task-date-group';

    const titleRow = document.createElement('div');
    titleRow.className = 'task-date-title-row';

    const title = document.createElement('div');
    title.className = 'task-date-title';
    title.textContent = date === '未設定' ? '日付未設定' : date;

    const editButton = document.createElement('button');
    editButton.className = 'task-date-edit-button';
    editButton.textContent = '日付編集';
    editButton.addEventListener('click', () => {
      editDateForGroup(date);
    });

    titleRow.appendChild(title);
    titleRow.appendChild(editButton);

    groupDiv.appendChild(titleRow);

    // 時間順にソート
    const sortedTasks = grouped[date].slice().sort((a, b) => {
      return getTimeValue(a) - getTimeValue(b);
    });

    sortedTasks.forEach((task) => {
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
  const searchInput = document.getElementById('searchInput');

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

  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    renderTasks();
  });

  // PWA用 Service Worker 登録
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('sw.js')
      .catch((err) =>
        console.error('Service Worker registration failed:', err),
      );
  }
});
