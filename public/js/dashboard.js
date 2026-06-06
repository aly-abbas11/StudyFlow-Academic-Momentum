// SPA View Router & Global State
let activeView = 'dashboard';
let allTasks = [];
let currentUser = null;
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

// Selected filters & sorting for Tasks Workspace
let selectedFilter = 'all'; // 'all', 'pending', 'critical', 'completed'
let selectedSubject = 'all';
let selectedPriority = 'all';
let selectedSort = 'date';
let searchKeyword = '';
let visibleTasksCount = 5; // Pagination limit

// DOM Elements
const viewSections = document.querySelectorAll('.view-section');
const sidebarLinks = document.querySelectorAll('[data-view]');

// Global Search
const globalSearch = document.getElementById('global-search');

// Settings Tabs DOM
const settingsSubLinks = document.querySelectorAll('[data-settings-tab]');
const settingsTabs = [
  { id: 'profile', el: document.getElementById('settings-tab-profile') },
  { id: 'appearance', el: document.getElementById('settings-tab-appearance') },
  { id: 'notifications', el: document.getElementById('settings-tab-notifications') },
  { id: 'language', el: document.getElementById('settings-tab-language') }
];

// Dedicated Task Form Elements
const dedicatedTaskForm = document.getElementById('dedicated-task-form');
const editTaskIdField = document.getElementById('edit-task-id');
const formTaskTitle = document.getElementById('form-task-title');
const formTaskSubject = document.getElementById('form-task-subject');
const formTaskDue = document.getElementById('form-task-due');
const formTaskDesc = document.getElementById('form-task-desc');
const formTaskSlider = document.getElementById('form-task-slider');
const formSliderVal = document.getElementById('form-slider-val');
const prioritySegBtns = document.querySelectorAll('.priority-seg-btn');
let selectedFormPriority = 'Low';

// Initialize Page
document.addEventListener('DOMContentLoaded', async () => {
  // Setup theme
  const currentTheme = localStorage.getItem('theme') || 'light';
  if (currentTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    const darkToggle = document.getElementById('settings-darkmode-toggle');
    if (darkToggle) darkToggle.checked = true;
  }

  // Get authenticated user
  currentUser = await API.getMe();
  if (!currentUser) {
    window.location.replace('/login.html');
    return;
  }

  // Apply user values
  updateProfileDetailsUI();

  // Load Data
  await loadDataFromServer();

  // Wire up Global SPA Navigation Switcher
  setupViewRouter();

  // Wire up form elements
  setupTaskFormHandlers();

  // Wire up settings tabs
  setupSettingsTabs();

  // Global search input
  globalSearch.addEventListener('input', (e) => {
    searchKeyword = e.target.value.toLowerCase().trim();
    if (activeView === 'tasks') {
      renderTasksView();
    } else if (activeView === 'dashboard') {
      applyDashboardFilters();
    }
  });

  // Tasks sort select
  document.getElementById('tasks-sort-select').addEventListener('change', (e) => {
    selectedSort = e.target.value;
    renderTasksView();
  });

  // Toggle extended filters bar
  const toggleFiltersBtn = document.getElementById('toggle-filter-bar-btn');
  const extendedFilterBar = document.getElementById('extended-filter-bar');
  toggleFiltersBtn.addEventListener('click', () => {
    extendedFilterBar.style.display = extendedFilterBar.style.display === 'none' ? 'block' : 'none';
  });

  // Extended filter dropdowns
  document.getElementById('filter-subject').addEventListener('change', (e) => {
    selectedSubject = e.target.value;
    renderTasksView();
  });
  document.getElementById('filter-priority').addEventListener('change', (e) => {
    selectedPriority = e.target.value;
    renderTasksView();
  });
  document.getElementById('clear-all-filters-btn').addEventListener('click', () => {
    selectedSubject = 'all';
    selectedPriority = 'all';
    selectedFilter = 'all';
    document.getElementById('filter-subject').value = 'all';
    document.getElementById('filter-priority').value = 'all';
    
    document.querySelectorAll('.pill-filter').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === 'all');
    });
    renderTasksView();
  });

  // Quick Filters pills
  document.querySelectorAll('.pill-filter').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.pill-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedFilter = btn.dataset.filter;
      renderTasksView();
    });
  });

  // Load more tasks button
  document.getElementById('load-more-tasks-btn').addEventListener('click', () => {
    visibleTasksCount += 6;
    renderTasksView();
  });

  // Theme Toggle in Header
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleThemeMode);
  }

  // Logout
  document.getElementById('logout-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    await API.logout();
    window.location.replace('/');
  });
});

// Setup Router View Switcher
function setupViewRouter() {
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // Sidebar logo also points to dashboard but doesn't have list parent
      const view = link.dataset.view;
      if (!view) return;

      e.preventDefault();
      
      // Update active links
      sidebarLinks.forEach(l => l.classList.remove('active'));
      // Find matching navbar items
      document.querySelectorAll(`[data-view="${view}"]`).forEach(l => {
        if (l.classList.contains('sidebar-link')) l.classList.add('active');
      });

      switchView(view);
    });
  });

  // Handle other inline data-view links (like Settings gear in header)
  document.querySelectorAll('[data-view]').forEach(item => {
    if (!item.classList.contains('sidebar-link') && !item.classList.contains('sidebar-logo')) {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(item.dataset.view);
      });
    }
  });

  // Check URL Hash for initial view
  const hash = window.location.hash.substring(1);
  if (['dashboard', 'schedule', 'tasks', 'analytics', 'settings', 'add-task'].includes(hash)) {
    switchView(hash);
  }
}

// Switch SPA Active View
function switchView(viewName) {
  activeView = viewName;
  window.location.hash = viewName;

  // Toggle view elements visibility
  viewSections.forEach(section => {
    section.classList.toggle('active', section.id === `view-${viewName}`);
  });

  // Load view-specific content
  if (viewName === 'dashboard') {
    renderDashboardView();
  } else if (viewName === 'tasks') {
    renderTasksView();
  } else if (viewName === 'add-task') {
    prepareAddTaskForm();
  } else if (viewName === 'analytics') {
    renderAnalyticsView();
  } else if (viewName === 'settings') {
    renderSettingsView();
  } else if (viewName === 'schedule') {
    renderScheduleView();
  }
}

// Fetch all tasks from Server API
async function loadDataFromServer() {
  allTasks = await API.getTasks();
  populateSubjectDropdowns();
}

// Populates filter dropdowns dynamically based on existing subjects
function populateSubjectDropdowns() {
  const subjects = ['all', ...new Set(allTasks.map(t => t.subject))].filter(s => s !== 'General');
  const filterDropdown = document.getElementById('filter-subject');
  
  if (filterDropdown) {
    filterDropdown.innerHTML = '<option value="all">All Subjects</option>';
    subjects.forEach(sub => {
      if (sub === 'all') return;
      const opt = document.createElement('option');
      opt.value = sub;
      opt.textContent = sub;
      filterDropdown.appendChild(opt);
    });
  }
}

// Update profile fields
function updateProfileDetailsUI() {
  document.getElementById('header-username').textContent = currentUser.username;
  document.getElementById('welcome-message').textContent = `Welcome back, ${currentUser.username}!`;
  
  // Settings Form values
  document.getElementById('settings-fullname').value = currentUser.username;
  document.getElementById('settings-goal').value = currentUser.weeklyGoal || 40;
  document.getElementById('settings-focus').value = currentUser.focusSubject || 'Computer Science';
  
  // Dynamic study streaks labels
  const streak = currentUser.streak || 5;
  document.getElementById('dashboard-streak-label').textContent = `${streak} Day Streak`;
  document.getElementById('analytics-streak-label').textContent = `⚡ ${streak} Day Streak`;
}


/* ==========================================================================
   VIEW RENDERING: DASHBOARD
   ========================================================================== */
async function renderDashboardView() {
  // Update stats metrics boxes
  const stats = await API.getStats();
  if (!stats) return;

  document.getElementById('stat-total').textContent = allTasks.length;
  document.getElementById('stat-completed').textContent = stats.completed;
  
  const completedToday = allTasks.filter(t => t.completed).length; // simple today filter
  document.getElementById('stat-completed-meta').textContent = `+${completedToday} today`;

  document.getElementById('stat-pending').textContent = stats.pending;
  document.getElementById('stat-pending-meta').textContent = `${stats.pending} left`;

  const urgentCount = allTasks.filter(t => !t.completed && (t.priority === 'Critical' || isDueSoon(t.dueDate))).length;
  document.getElementById('stat-deadlines').textContent = urgentCount;
  document.getElementById('stat-deadlines-meta').textContent = urgentCount > 0 ? 'Urgent' : 'Clear';
  document.getElementById('stat-deadlines-meta').style.color = urgentCount > 0 ? 'var(--critical)' : 'var(--text-muted)';

  // Circular gauge chart
  const rate = stats.completionRate;
  const offset = 440 - (440 * rate) / 100;
  document.getElementById('progress-circle').style.strokeDashoffset = offset;
  document.getElementById('progress-circle-text').textContent = `${rate}%`;

  // Goal Efficiency fill
  let efficiencyScore = 'Optimal';
  let barColor = 'var(--primary)';
  if (rate < 40) {
    efficiencyScore = 'Needs Focus';
    barColor = 'var(--critical)';
  } else if (rate < 75) {
    efficiencyScore = 'Good';
    barColor = 'var(--accent)';
  }
  document.getElementById('efficiency-score-label').textContent = efficiencyScore;
  document.getElementById('efficiency-score-label').style.color = barColor;
  document.getElementById('efficiency-fill').style.width = `${Math.max(rate, 10)}%`;
  document.getElementById('efficiency-fill').style.backgroundColor = barColor;

  if (stats.pending > 0) {
    const tasksLeft = stats.pending === 1 ? '1 more task' : '2 more tasks';
    document.getElementById('progress-motivation').innerHTML = `You're doing great! Complete <strong>${tasksLeft}</strong> to reach your daily goal.`;
  } else {
    document.getElementById('progress-motivation').innerHTML = `Awesome job! You've completed all study goals today! ⚡`;
  }

  // Update checklist and deadline cards
  applyDashboardFilters();
  updateNextDeadlineCard();
}

// Find next upcoming deadline
function updateNextDeadlineCard() {
  const nextDeadlineBanner = document.getElementById('next-deadline-banner');
  const pendingTasks = allTasks.filter(t => !t.completed && t.dueDate);
  if (pendingTasks.length === 0) {
    nextDeadlineBanner.style.display = 'none';
    return;
  }

  pendingTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const nextTask = pendingTasks[0];

  document.getElementById('next-deadline-title').textContent = nextTask.title;
  document.getElementById('next-deadline-time-text').textContent = formatBannerDeadline(nextTask.dueDate);
  nextDeadlineBanner.style.display = 'block';
}

// Render Focus checklist filters on Dashboard
function applyDashboardFilters() {
  const query = searchKeyword;
  const filtered = allTasks.filter(task => {
    const titleMatch = task.title.toLowerCase().includes(query);
    const subjectMatch = task.subject.toLowerCase().includes(query);
    return titleMatch || subjectMatch;
  });

  renderDashboardChecklist(filtered);
}

// Render Dashboard Focus Checklist
function renderDashboardChecklist(tasks) {
  const container = document.getElementById('tasks-checklist');
  container.innerHTML = '';

  const focusTasks = tasks.filter(t => !t.completed || isToday(t.dueDate)).slice(0, 4);

  if (focusTasks.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 24px; color: var(--text-muted);">
        No tasks scheduled for today.
      </div>
    `;
    return;
  }

  focusTasks.forEach(task => {
    const item = document.createElement('div');
    item.className = `checklist-item ${task.completed ? 'completed' : ''}`;
    
    let badgeClass = 'tag-academic';
    if (task.priority === 'Critical') badgeClass = 'tag-critical';
    if (task.priority === 'Low') badgeClass = 'tag-low';

    const dueLabel = task.completed ? '✓ Done' : formatDueLabel(task.dueDate);

    item.innerHTML = `
      <div class="checklist-left">
        <div class="circle-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTaskStatus('${task.id}', ${!task.completed})">
          ${task.completed ? '✓' : ''}
        </div>
        <div class="checklist-details">
          <div class="checklist-title">${escapeHTML(task.title)}</div>
          <div class="checklist-tags">
            <span class="tag-badge ${badgeClass}">${task.priority}</span>
            <span class="tag-badge tag-sub">${escapeHTML(task.subject)}</span>
          </div>
        </div>
      </div>
      <div class="checklist-right">
        <span class="checklist-time" style="${task.completed ? 'color: var(--success); font-weight: 700;' : ''}">${dueLabel}</span>
      </div>
    `;
    container.appendChild(item);
  });
}

// Inline Quick Add inline input
const quickAddInput = document.getElementById('quick-add-input');
quickAddInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    const text = quickAddInput.value.trim();
    if (!text) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    try {
      const newTask = await API.createTask({
        title: text,
        subject: 'General',
        priority: 'Academic',
        estimatedHours: 1.0,
        dueDate: tomorrow.toISOString().slice(0, 16)
      });

      showToast(`Quick task added: "${newTask.title}"`, 'success');
      quickAddInput.value = '';
      
      await loadDataFromServer();
      if (activeView === 'dashboard') renderDashboardView();
    } catch (err) {
      showToast('Failed to quick add task.', 'danger');
    }
  }
});


/* ==========================================================================
   VIEW RENDERING: TASKS WORKSPACE (SCREENSHOT 1)
   ========================================================================== */
function renderTasksView() {
  const grid = document.getElementById('tasks-cards-grid');
  grid.innerHTML = '';

  // Apply client-side filters
  let filtered = [...allTasks];

  // 1. Search Query
  if (searchKeyword) {
    filtered = filtered.filter(t => 
      t.title.toLowerCase().includes(searchKeyword) || 
      t.subject.toLowerCase().includes(searchKeyword)
    );
  }

  // 2. Subject Filter Dropdown
  if (selectedSubject !== 'all') {
    filtered = filtered.filter(t => t.subject === selectedSubject);
  }

  // 3. Priority Filter Dropdown
  if (selectedPriority !== 'all') {
    filtered = filtered.filter(t => t.priority === selectedPriority);
  }

  // 4. Quick Filters pills
  if (selectedFilter === 'pending') {
    filtered = filtered.filter(t => !t.completed);
  } else if (selectedFilter === 'critical') {
    filtered = filtered.filter(t => t.priority === 'Critical');
  } else if (selectedFilter === 'completed') {
    filtered = filtered.filter(t => t.completed);
  }

  // 5. Sorting
  filtered.sort((a, b) => {
    if (selectedSort === 'priority') {
      const w = { Critical: 3, Academic: 2, Low: 1 };
      return w[b.priority] - w[a.priority];
    } else if (selectedSort === 'title') {
      return a.title.localeCompare(b.title);
    } else {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
  });

  // Update total counts text in header
  const dueThisWeek = filtered.filter(t => !t.completed && isThisWeek(t.dueDate)).length;
  document.getElementById('tasks-due-status-lbl').textContent = 
    `You have ${dueThisWeek} task${dueThisWeek === 1 ? '' : 's'} due this week. Let's keep the momentum going!`;

  // Render cards pagination
  const visible = filtered.slice(0, visibleTasksCount);

  // Show or hide pagination button
  const loadMoreBtn = document.getElementById('load-more-tasks-btn');
  if (filtered.length <= visibleTasksCount) {
    loadMoreBtn.style.display = 'none';
  } else {
    loadMoreBtn.style.display = 'inline-flex';
  }

  if (visible.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 24px; color: var(--text-muted);">
        <h2>No tasks in workspace</h2>
        <p>Try modifying filters or add a new task.</p>
      </div>
    `;
  }

  visible.forEach((task, index) => {
    // If index === 2, insert the high-fidelity Study Tip card (matching screenshot 1!)
    if (index === 2) {
      const tipCard = document.createElement('div');
      tipCard.className = 'study-tip-card';
      tipCard.innerHTML = `
        <div>
          <span class="study-tip-badge">Study Tip</span>
          <h4 class="study-tip-title">Spaced Repetition</h4>
          <p class="study-tip-desc">Reviewing your notes in increasing intervals improves long-term retention by 40%.</p>
        </div>
        <a href="#" class="study-tip-link" onclick="alert('Spaced repetition strategy activated!')">Read more ➔</a>
      `;
      grid.appendChild(tipCard);
    }

    const card = document.createElement('div');
    card.className = `task-card-high-fidelity ${task.completed ? 'completed' : ''}`;
    
    let badgeClass = 'tag-academic';
    if (task.priority === 'Critical') badgeClass = 'tag-critical';
    if (task.priority === 'Low') badgeClass = 'tag-low';

    // Mock progress rate based on subject name or task title (e.g. World Literature Essay shows 65% progress in mockup!)
    let hasProgress = false;
    let progressRate = 0;
    if (task.title.toLowerCase().includes('literature') || task.title.toLowerCase().includes('essay')) {
      hasProgress = true;
      progressRate = 65;
    } else if (task.title.toLowerCase().includes('calculus') || task.title.toLowerCase().includes('prep')) {
      hasProgress = true;
      progressRate = 40;
    }

    // Format deadline label
    const isOverdue = new Date(task.dueDate) < new Date() && !task.completed;
    const dueClass = isOverdue ? '' : 'on-time';
    const dueLabel = task.completed ? 'Completed' : formatDueCardLabel(task.dueDate);

    card.innerHTML = `
      <div>
        <div class="card-top">
          <span class="tag-badge ${badgeClass}">${task.priority} Priority</span>
          <div class="circle-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTaskStatus('${task.id}', ${!task.completed})" style="margin-top: -4px;">
            ${task.completed ? '✓' : ''}
          </div>
        </div>
        
        <h4 class="card-title-h">${escapeHTML(task.title)}</h4>
        
        ${task.description ? `<p class="card-desc">${escapeHTML(task.description)}</p>` : `<p class="card-desc" style="color: var(--text-muted); font-style: italic;">No description provided.</p>`}

        ${hasProgress && !task.completed ? `
          <div class="card-progress-section">
            <div class="card-progress-lbl">
              <span>Drafting Phase</span>
              <span>${progressRate}%</span>
            </div>
            <div class="card-progress-bar">
              <div class="card-progress-fill" style="width: ${progressRate}%;"></div>
            </div>
          </div>
        ` : ''}
      </div>

      <div class="card-bottom-row">
        <span class="card-due-indicator ${dueClass}">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="display:inline-block; vertical-align:middle; margin-right:4px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          ${dueLabel}
        </span>
        <div class="card-actions">
          <button class="card-action-btn" onclick="triggerTaskEdit('${task.id}')" aria-label="Edit Task">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
            </svg>
          </button>
          <button class="card-action-btn" onclick="handleTaskDelete('${task.id}')" aria-label="Delete Task">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  // Append Create task dotted card at the end of grid!
  const createDotted = document.createElement('div');
  createDotted.className = 'create-task-dotted-card';
  createDotted.onclick = () => switchView('add-task');
  createDotted.innerHTML = `
    <div class="create-task-dotted-circle">+</div>
    <span style="font-weight: 700; font-size: 0.95rem;">Create New Task</span>
    <span style="font-size: 0.78rem; text-align: center; max-width: 140px; margin-top: -6px;">What's next on your agenda?</span>
  `;
  grid.appendChild(createDotted);
}


/* ==========================================================================
   VIEW RENDERING: CREATE / EDIT TASK FORM (SCREENSHOT 2)
   ========================================================================== */
function setupTaskFormHandlers() {
  // Range slider min value updates badge
  formTaskSlider.addEventListener('input', (e) => {
    formSliderVal.textContent = `${e.target.value} min`;
  });

  // Priority segments selection
  prioritySegBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      prioritySegBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedFormPriority = btn.dataset.priority;
    });
  });

  // Submit Handler
  dedicatedTaskForm.addEventListener('submit', handleDedicatedTaskFormSubmit);

  // Cancel Handler
  document.getElementById('form-cancel-btn').addEventListener('click', () => {
    switchView('tasks');
  });
}

// Set form properties for create mode
function prepareAddTaskForm() {
  document.getElementById('add-task-view-title').textContent = 'Create New Task';
  editTaskIdField.value = '';
  formTaskTitle.value = '';
  formTaskSubject.value = '';
  formTaskDesc.value = '';
  formTaskSlider.value = 60;
  formSliderVal.textContent = '60 min';
  
  // Set default due time to tomorrow at same time
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  formTaskDue.value = tomorrow.toISOString().slice(0, 16);

  prioritySegBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.priority === 'Low');
  });
  selectedFormPriority = 'Low';
}

// Populate form properties for edit mode (CRUD operation!)
window.triggerTaskEdit = function(taskId) {
  const task = allTasks.find(t => t.id === taskId);
  if (!task) return;

  switchView('add-task');

  document.getElementById('add-task-view-title').textContent = 'Edit Task';
  editTaskIdField.value = task.id;
  formTaskTitle.value = task.title;
  formTaskSubject.value = task.subject;
  formTaskDesc.value = task.description || '';
  
  // Est Study Hours slider conversion
  const mins = (task.estimatedHours || 1) * 60;
  formTaskSlider.value = mins;
  formSliderVal.textContent = `${mins} min`;

  // Priority level
  prioritySegBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.priority === task.priority);
  });
  selectedFormPriority = task.priority;

  // Format date correctly
  if (task.dueDate) {
    const dt = new Date(task.dueDate);
    const tzoffset = dt.getTimezoneOffset() * 60000; // local offset in ms
    const localISOTime = (new Date(dt - tzoffset)).toISOString().slice(0, 16);
    formTaskDue.value = localISOTime;
  }
};

// Handle submission for creating or updating task records
async function handleDedicatedTaskFormSubmit(e) {
  e.preventDefault();

  const id = editTaskIdField.value;
  const title = formTaskTitle.value.trim();
  const subject = formTaskSubject.value;
  const dueDate = formTaskDue.value;
  const description = formTaskDesc.value.trim();
  const hours = parseFloat(formTaskSlider.value) / 60;

  if (!title || !subject || !dueDate) {
    showToast('Please fill in required fields.', 'danger');
    return;
  }

  try {
    if (id) {
      // Update Task CRUD API
      const updated = await API.updateTask(id, {
        title,
        subject,
        priority: selectedFormPriority,
        dueDate,
        description,
        estimatedHours: hours
      });
      showToast(`Task "${updated.title}" updated successfully!`, 'success');
    } else {
      // Create Task CRUD API
      const created = await API.createTask({
        title,
        subject,
        priority: selectedFormPriority,
        dueDate,
        description,
        estimatedHours: hours
      });
      showToast(`Task "${created.title}" created successfully!`, 'success');
    }

    // Reload state
    await loadDataFromServer();
    switchView('tasks');
  } catch (err) {
    showToast('Failed to save study task.', 'danger');
  }
}


/* ==========================================================================
   VIEW RENDERING: PROGRESS INSIGHTS (SCREENSHOT 4)
   ========================================================================== */
async function renderAnalyticsView() {
  const stats = await API.getStats();
  if (!stats) return;

  // Circle gauge progress
  const rate = stats.completionRate;
  const offset = 377 - (377 * rate) / 100;
  document.getElementById('analytics-circle').style.strokeDashoffset = offset;
  document.getElementById('analytics-circle-text').textContent = `${rate}%`;

  // Draw distribution summary cards
  document.getElementById('dist-val-completed').textContent = stats.completed;
  document.getElementById('dist-val-pending').textContent = stats.pending;
  
  const overdueCount = allTasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()).length;
  document.getElementById('dist-val-overdue').textContent = overdueCount;

  // Calculate sum of study hours
  const totalMins = allTasks.reduce((sum, t) => sum + (t.estimatedHours || 1), 0) * 60;
  const hrs = Math.floor(totalMins / 60);
  const remainingMins = Math.round(totalMins % 60);
  document.getElementById('analytics-time-val').textContent = `${hrs}h ${remainingMins}m`;
  
  // Total completed units
  document.getElementById('analytics-units-val').textContent = stats.completed * 4; // simulated mastery units score

  // Update dynamic description card
  const streak = currentUser.streak || 5;
  document.getElementById('analytics-streak-label').innerHTML = `<svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24" style="margin-right:4px; display:inline-block; vertical-align:middle;"><path d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> ${streak} Day Streak`;

  let prodTitle = 'Focus Mode Active';
  if (rate >= 85) {
    prodTitle = 'Mastery Level Reached';
  } else if (rate >= 50) {
    prodTitle = 'Optimal Productivity';
  } else if (rate >= 20) {
    prodTitle = 'Steady Momentum';
  }
  document.getElementById('analytics-productivity-title').textContent = prodTitle;
  
  const rateImprovement = rate >= 50 ? Math.round(rate / 5) : 0;
  document.getElementById('analytics-chart-rate-pill').textContent = `+${rateImprovement}% vs last week`;

  const totalTasks = allTasks.length;
  document.getElementById('analytics-productivity-desc').textContent = 
    `You've completed ${stats.completed} tasks out of ${totalTasks} overall, keeping your study track at a ${rate}% completion rate. Keep up the rhythm to ace your upcoming studies.`;

  // 1. Calculate dynamic completion rate per Subject (Subject Mastery progress bars)
  const subjectList = ['Computer Science', 'Mathematics', 'Physics', 'Literature', 'Chemistry', 'General'];
  const subjectFills = {
    'Computer Science': 'fill-math',      // blue
    'Mathematics': 'fill-physics',        // green
    'Physics': 'fill-economics',          // orange
    'Literature': 'fill-writing',         // slate
    'Chemistry': 'fill-math',
    'General': 'fill-writing'
  };

  const masteryContainer = document.querySelector('.subject-mastery-list');
  if (masteryContainer) {
    masteryContainer.innerHTML = '';
    
    subjectList.forEach(subj => {
      const subjTasks = allTasks.filter(t => t.subject === subj);
      if (subjTasks.length === 0) return; // skip if no tasks exist for this subject yet

      const total = subjTasks.length;
      const completed = subjTasks.filter(t => t.completed).length;
      const pct = Math.round((completed / total) * 100);
      const fillClass = subjectFills[subj] || 'fill-math';

      const item = document.createElement('div');
      item.className = 'mastery-item';
      item.innerHTML = `
        <div class="mastery-meta">
          <span>${escapeHTML(subj)}</span>
          <span>${pct}%</span>
        </div>
        <div class="mastery-progress-bar">
          <div class="mastery-progress-fill ${fillClass}" style="width: ${pct}%;"></div>
        </div>
      `;
      masteryContainer.appendChild(item);
    });

    if (masteryContainer.children.length === 0) {
      masteryContainer.innerHTML = `<div style="color: var(--text-muted); font-size: 0.88rem; text-align: center;">No subject data available.</div>`;
    }
  }

  // 2. Draw dynamic Weekly Activity SVG Chart based on study hours scheduled per day of the week
  // Mon = 1, Tue = 2, Wed = 3, Thu = 4, Fri = 5, Sat = 6, Sun = 0
  const hoursPerDay = [0, 0, 0, 0, 0, 0, 0]; // Index 0 = Mon, 1 = Tue, ..., 6 = Sun
  
  allTasks.forEach(t => {
    if (!t.dueDate) return;
    const d = new Date(t.dueDate);
    let day = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    let index = day === 0 ? 6 : day - 1;
    hoursPerDay[index] += t.estimatedHours || 1;
  });

  const maxHours = Math.max(...hoursPerDay, 1);
  const xCoords = [30, 90, 150, 210, 270, 330, 390];
  const yCoords = hoursPerDay.map(h => 100 - (h / maxHours) * 90);

  // Line path definition
  let pathD = `M${xCoords[0]},${yCoords[0]}`;
  for (let i = 1; i < 7; i++) {
    pathD += ` L${xCoords[i]},${yCoords[i]}`;
  }
  const areaPathD = `${pathD} L390,120 L30,120 Z`;

  const chartContainer = document.querySelector('.svg-chart-container');
  if (chartContainer) {
    chartContainer.innerHTML = `
      <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background-color: var(--border-glass);"></div>
      <div style="position: absolute; top: 40px; left: 0; right: 0; height: 1px; background-color: var(--border-glass);"></div>
      <div style="position: absolute; top: 80px; left: 0; right: 0; height: 1px; background-color: var(--border-glass);"></div>
      <div style="position: absolute; top: 120px; left: 0; right: 0; height: 1px; background-color: var(--border-glass);"></div>
      
      <svg width="100%" height="100%" viewBox="0 0 420 120" preserveAspectRatio="none" style="position: absolute; top: 0; left: 0;">
        <defs>
          <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1e3a8a" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#1e3a8a" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="${areaPathD}" fill="url(#chart-grad)" />
        <path d="${pathD}" fill="none" stroke="#1e3a8a" stroke-width="3" stroke-linecap="round" />
        ${xCoords.map((x, i) => `
          <circle cx="${x}" cy="${yCoords[i]}" r="4" fill="#1e3a8a" stroke="white" stroke-width="2" />
        `).join('')}
      </svg>
    `;
  }

  // Render Top Pending items
  const pendingContainer = document.getElementById('analytics-pending-list');
  pendingContainer.innerHTML = '';

  const pending = allTasks.filter(t => !t.completed).slice(0, 5);

  if (pending.length === 0) {
    pendingContainer.innerHTML = `
      <div style="text-align: center; padding: 20px; color: var(--text-muted);">
        No pending study tasks!
      </div>
    `;
    return;
  }

  pending.forEach(task => {
    const item = document.createElement('div');
    item.className = 'pending-row-item';
    item.innerHTML = `
      <div class="pending-row-left">
        <div class="pending-row-alert-icon">!</div>
        <div class="pending-row-info">
          <span class="pending-row-title">${escapeHTML(task.title)}</span>
          <span class="pending-row-due">Due ${formatDueLabel(task.dueDate)}</span>
        </div>
      </div>
      <button class="pending-check-btn" onclick="toggleTaskStatus('${task.id}', true)" aria-label="Mark task done">
        ✓
      </button>
    `;
    pendingContainer.appendChild(item);
  });
}


/* ==========================================================================
   VIEW RENDERING: SETTINGS (SCREENSHOT 3)
   ========================================================================== */
function setupSettingsTabs() {
  settingsSubLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      settingsSubLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const activeTab = link.dataset.settingsTab;
      settingsTabs.forEach(tab => {
        tab.el.style.display = tab.id === activeTab ? 'block' : 'none';
      });
    });
  });

  // Settings Save profile goals form submission
  document.getElementById('profile-goals-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('settings-fullname').value.trim();
    const goal = parseInt(document.getElementById('settings-goal').value);
    const focus = document.getElementById('settings-focus').value;

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`
        },
        body: JSON.stringify({ username: name, weeklyGoal: goal, focusSubject: focus })
      });

      if (!response.ok) throw new Error();

      currentUser.username = name;
      currentUser.weeklyGoal = goal;
      currentUser.focusSubject = focus;
      
      updateProfileDetailsUI();
      showToast('Profile and study goals updated!', 'success');
    } catch (err) {
      showToast('Failed to update profile.', 'danger');
    }
  });

  // Darkmode Switch listener
  const darkmodeToggle = document.getElementById('settings-darkmode-toggle');
  darkmodeToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  });

  // Reset Tasks handler
  document.getElementById('reset-tasks-btn').addEventListener('click', async () => {
    if (!confirm('CAUTION: This will delete ALL your study planner tasks forever. Are you sure you want to proceed?')) return;
    
    try {
      const res = await fetch('/api/tasks/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`
        }
      });
      if (!res.ok) throw new Error();

      showToast('Dashboard cleared. Seeding starter tasks...', 'info');
      await loadDataFromServer();
      switchView('dashboard');
    } catch (err) {
      showToast('Failed to reset workspace.', 'danger');
    }
  });

  // Language grid cards highlight
  document.querySelectorAll('.lang-card-option').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.lang-card-option').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const radio = card.querySelector('.lang-radio');
      if (radio) radio.checked = true;
      showToast(`Language set to ${card.querySelector('.lang-name').textContent}`, 'info');
    });
  });
}

function renderSettingsView() {
  // Set tab defaults
  settingsSubLinks.forEach((link, idx) => {
    link.classList.toggle('active', idx === 0);
  });
  settingsTabs.forEach((tab, idx) => {
    tab.el.style.display = idx === 0 ? 'block' : 'none';
  });
}


/* ==========================================================================
   VIEW RENDERING: SCHEDULE CALENDAR (SCREENSHOT 5)
   ========================================================================== */
function renderScheduleView() {
  const container = document.getElementById('calendar-grid-cells');
  container.innerHTML = '';

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  document.getElementById('calendar-month-year-title').textContent = `${monthNames[currentMonth]} ${currentYear}`;

  // Find first day of month and number of days
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Find days in previous month for padding
  const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();

  // Load calendar controls
  document.getElementById('cal-prev-btn').onclick = () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderScheduleView();
  };
  document.getElementById('cal-next-btn').onclick = () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderScheduleView();
  };

  // Render preceding padding cells
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthTotalDays - i;
    const cell = document.createElement('div');
    cell.className = 'calendar-cell outside';
    cell.innerHTML = `<span class="cell-day-num">${day}</span>`;
    container.appendChild(cell);
  }

  // Render active month cells
  for (let day = 1; day <= totalDays; day++) {
    const cellDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Find deadlines matching this date
    const dayDeadlines = allTasks.filter(t => !t.completed && t.dueDate && t.dueDate.startsWith(cellDateStr));

    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    if (dayDeadlines.length > 0) cell.classList.add('has-deadline');

    // List deadlines badges
    let badgesHTML = '';
    dayDeadlines.slice(0, 2).forEach(task => {
      let badgeClass = 'cal-academic';
      if (task.priority === 'Critical') badgeClass = 'cal-critical';
      if (task.priority === 'Low') badgeClass = 'cal-low';
      badgesHTML += `<span class="cell-deadline-badge ${badgeClass}" title="${task.title}">${escapeHTML(task.title)}</span>`;
    });

    cell.innerHTML = `
      <span class="cell-day-num">${day}</span>
      <div class="cell-deadlines-container">
        ${badgesHTML}
      </div>
    `;

    container.appendChild(cell);
  }

  // Render following padding cells to fill grid (multiple of 7)
  const totalRendered = firstDayIndex + totalDays;
  const remaining = 42 - totalRendered;
  for (let i = 1; i <= remaining; i++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-cell outside';
    cell.innerHTML = `<span class="cell-day-num">${i}</span>`;
    container.appendChild(cell);
  }
}


/* ==========================================================================
   HELPER UTILITY FUNCTIONS
   ========================================================================== */
function isToday(dateString) {
  if (!dateString) return false;
  const d = new Date(dateString);
  const today = new Date();
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
}

function isThisWeek(dateString) {
  if (!dateString) return false;
  const d = new Date(dateString);
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  return d >= today && d <= nextWeek;
}

function isDueSoon(dateString) {
  if (!dateString) return false;
  const diff = new Date(dateString) - new Date();
  return diff > 0 && diff < (48 * 60 * 60 * 1000);
}

function formatDueLabel(dateString) {
  if (!dateString) return 'No date';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date - now;

  if (diffMs < 0) return 'Overdue';

  const diffHrs = diffMs / (3600000);
  if (diffHrs < 24) {
    if (diffHrs < 1) return `${Math.ceil(diffMs / 60000)}m left`;
    return `${Math.round(diffHrs)}h left`;
  }

  const diffDays = Math.ceil(diffMs / (86400000));
  if (diffDays === 1) return 'Tomorrow';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDueCardLabel(dateString) {
  if (!dateString) return 'No due date';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date - now;

  if (diffTime < 0) return 'Overdue';

  const diffDays = Math.ceil(diffTime / (86400000));
  if (diffDays === 1) return 'Due Tomorrow';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatBannerDeadline(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date - now;

  if (diffTime < 0) return 'Overdue';

  const diffDays = Math.ceil(diffTime / (86400000));
  if (diffDays === 1) {
    return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return `${diffDays} Days Left`;
}

// Toggle Theme Mode
function toggleThemeMode() {
  const activeTheme = document.documentElement.getAttribute('data-theme');
  const darkToggle = document.getElementById('settings-darkmode-toggle');
  
  if (activeTheme === 'dark') {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
    if (darkToggle) darkToggle.checked = false;
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    if (darkToggle) darkToggle.checked = true;
  }
}

// Toggle Completed State (CRUD Update API!)
window.toggleTaskStatus = async function(id, completed) {
  try {
    const updated = await API.updateTask(id, { completed });
    showToast(updated.completed ? 'Task completed! Keep up the momentum!' : 'Task marked as pending.', 'success');
    
    // Update local state
    const idx = allTasks.findIndex(t => t.id === id);
    if (idx !== -1) allTasks[idx] = updated;

    // Refresh active view
    if (activeView === 'dashboard') {
      renderDashboardView();
    } else if (activeView === 'tasks') {
      renderTasksView();
    } else if (activeView === 'analytics') {
      renderAnalyticsView();
    }
  } catch (err) {
    showToast('Failed to update task status.', 'danger');
  }
};

// Delete Task (CRUD Delete API!)
window.handleTaskDelete = async function(id) {
  if (!confirm('Are you sure you want to delete this study task?')) return;
  
  try {
    await API.deleteTask(id);
    showToast('Task removed from workspace.', 'info');
    
    allTasks = allTasks.filter(t => t.id !== id);
    
    // Refresh active view
    if (activeView === 'dashboard') {
      renderDashboardView();
    } else if (activeView === 'tasks') {
      renderTasksView();
    } else if (activeView === 'analytics') {
      renderAnalyticsView();
    }
  } catch (err) {
    showToast('Failed to delete task.', 'danger');
  }
};

// Helper: Toast Notifications
function showToast(message, type = 'success') {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = `
    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
    </svg>
  `;
  if (type === 'success') {
    icon = `
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="color:var(--success);">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    `;
  }
  if (type === 'info') {
    icon = `
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="color:var(--primary);">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    `;
  }
  if (type === 'danger') {
    icon = `
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="color:var(--critical);">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>
    `;
  }

  toast.innerHTML = `
    <span style="display:flex; align-items:center; margin-right:8px;">${icon}</span>
    <div>${message}</div>
  `;
  
  toastContainer.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Escape HTML characters
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
