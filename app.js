(() => {
  'use strict';

  const STORAGE_KEY = 'bearops.v1.tasks';
  const SETTINGS_KEY = 'bearops.v1.settings';
  const REMINDER_KEY = 'bearops.v1.reminded';
  const WAITING_DEFAULTS = ['Manta','David','Kerri','Factory','Supplier','Client','Architect','Installer','Prestige / Internal','Other'];
  const PRIORITY_WEIGHT = { critical: 4, high: 3, normal: 2, low: 1 };

  const $ = (id) => document.getElementById(id);
  const els = {
    todayLabel: $('todayLabel'), statsGrid: $('statsGrid'), priorityQueue: $('priorityQueue'),
    bottleneckStrip: $('bottleneckStrip'), upNextList: $('upNextList'), allTasksList: $('allTasksList'),
    waitingPeopleTabs: $('waitingPeopleTabs'), waitingList: $('waitingList'), projectsList: $('projectsList'),
    completedList: $('completedList'), taskDialog: $('taskDialog'), taskForm: $('taskForm'), dialogTitle: $('dialogTitle'),
    taskId: $('taskId'), taskTitle: $('taskTitle'), taskProject: $('taskProject'), taskType: $('taskType'),
    taskPriority: $('taskPriority'), taskStatus: $('taskStatus'), taskDueDate: $('taskDueDate'), taskDueTime: $('taskDueTime'),
    taskReminderDate: $('taskReminderDate'), taskReminderTime: $('taskReminderTime'), taskWaitingOn: $('taskWaitingOn'),
    taskChaseDate: $('taskChaseDate'), taskRepeat: $('taskRepeat'), taskFocus: $('taskFocus'), taskNotes: $('taskNotes'),
    deleteTaskBtn: $('deleteTaskBtn'), quickDialog: $('quickDialog'), quickForm: $('quickForm'), quickText: $('quickText'),
    taskStatusFilter: $('taskStatusFilter'), taskPriorityFilter: $('taskPriorityFilter'), taskSearch: $('taskSearch'),
    toast: $('toast'), summaryOutput: $('summaryOutput')
  };

  let tasks = loadTasks();
  let activeWaitingFilter = 'All';
  let currentView = 'today';

  function nowLocalParts() {
    const d = new Date();
    return { date: toDateInput(d), time: `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` };
  }

  function toDateInput(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,'0');
    const day = String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }

  function fromDateInput(str) {
    if (!str) return null;
    const [y,m,d] = str.split('-').map(Number);
    return new Date(y, m-1, d);
  }

  function formatDate(str, opts={}) {
    if (!str) return '';
    const d = fromDateInput(str);
    return new Intl.DateTimeFormat('en-IE', { day:'numeric', month:'short', ...(opts.weekday ? {weekday:'short'} : {}) }).format(d);
  }

  function startOfDay(date = new Date()) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
  function dateDiffDays(dateStr) {
    if (!dateStr) return null;
    return Math.round((startOfDay(fromDateInput(dateStr)) - startOfDay(new Date())) / 86400000);
  }

  function escapeHtml(value='') {
    return String(value).replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function loadTasks() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    renderAll();
  }

  function uid() { return `t_${Date.now()}_${Math.random().toString(36).slice(2,7)}`; }

  function normalizeTask(raw) {
    const stamp = new Date().toISOString();
    return {
      id: raw.id || uid(),
      title: (raw.title || '').trim(),
      project: (raw.project || '').trim(),
      type: raw.type || 'Follow-up',
      priority: raw.priority || 'normal',
      status: raw.status || 'open',
      dueDate: raw.dueDate || '',
      dueTime: raw.dueTime || '',
      reminderDate: raw.reminderDate || '',
      reminderTime: raw.reminderTime || '',
      waitingOn: raw.waitingOn || '',
      waitingSince: raw.waitingSince || (raw.status === 'waiting' ? toDateInput(new Date()) : ''),
      chaseDate: raw.chaseDate || '',
      repeat: raw.repeat || 'none',
      focus: raw.focus === true || raw.focus === 'true',
      notes: raw.notes || '',
      createdAt: raw.createdAt || stamp,
      updatedAt: stamp,
      completedAt: raw.completedAt || ''
    };
  }

  function isOverdue(t) { return t.status !== 'completed' && t.dueDate && dateDiffDays(t.dueDate) < 0; }
  function isDueToday(t) { return t.status !== 'completed' && t.dueDate && dateDiffDays(t.dueDate) === 0; }
  function isDueSoon(t, days=7) {
    if (t.status === 'completed' || !t.dueDate) return false;
    const diff = dateDiffDays(t.dueDate);
    return diff >= 0 && diff <= days;
  }

  function sortTasks(list) {
    return [...list].sort((a,b) => {
      if ((a.status === 'completed') !== (b.status === 'completed')) return a.status === 'completed' ? 1 : -1;
      if (isOverdue(a) !== isOverdue(b)) return isOverdue(a) ? -1 : 1;
      if (a.focus !== b.focus) return a.focus ? -1 : 1;
      const pa = PRIORITY_WEIGHT[a.priority] || 0;
      const pb = PRIORITY_WEIGHT[b.priority] || 0;
      if (pa !== pb) return pb - pa;
      const da = a.dueDate || '9999-12-31';
      const db = b.dueDate || '9999-12-31';
      if (da !== db) return da.localeCompare(db);
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }

  function taskCard(t) {
    const classes = ['task-card'];
    if (isOverdue(t)) classes.push('overdue');
    if (t.status === 'waiting') classes.push('waiting');
    const meta = [];
    if (t.project) meta.push(`<span>▦ ${escapeHtml(t.project)}</span>`);
    if (t.dueDate) {
      const diff = dateDiffDays(t.dueDate);
      const label = diff < 0 ? `Overdue ${Math.abs(diff)}d` : diff === 0 ? 'Due today' : diff === 1 ? 'Due tomorrow' : `Due ${formatDate(t.dueDate,{weekday:true})}`;
      meta.push(`<span>${isOverdue(t) ? '⚠' : '◷'} ${label}${t.dueTime ? ` · ${escapeHtml(t.dueTime)}` : ''}</span>`);
    }
    if (t.status === 'waiting' && t.waitingOn) {
      const waitDays = t.waitingSince ? Math.max(0, -dateDiffDays(t.waitingSince)) : 0;
      meta.push(`<span>⏳ ${escapeHtml(t.waitingOn)}${waitDays ? ` · ${waitDays}d` : ''}</span>`);
    }
    if (t.chaseDate) meta.push(`<span>↻ Chase ${formatDate(t.chaseDate,{weekday:true})}</span>`);
    if (t.repeat !== 'none') meta.push(`<span>⟳ ${escapeHtml(t.repeat)}</span>`);
    if (t.focus && t.status !== 'completed') meta.push('<span>★ Today focus</span>');

    return `<article class="${classes.join(' ')}" data-task-id="${escapeHtml(t.id)}">
      <button class="task-check ${t.status === 'completed' ? 'done' : ''}" data-action="toggle" type="button" aria-label="${t.status === 'completed' ? 'Reopen' : 'Complete'} task">${t.status === 'completed' ? '✓' : ''}</button>
      <div class="task-body">
        <div class="task-title ${t.status === 'completed' ? 'completed' : ''}">${escapeHtml(t.title)}</div>
        <div class="task-meta"><span class="badge ${escapeHtml(t.priority)}">${escapeHtml(t.priority)}</span>${meta.join('')}</div>
        ${t.notes ? `<div class="task-notes">${escapeHtml(t.notes)}</div>` : ''}
      </div>
      <div class="task-menu">
        ${t.status !== 'completed' ? `<button class="mini-btn" data-action="snooze" type="button" title="Move to tomorrow">+1d</button>` : ''}
        <button class="mini-btn" data-action="edit" type="button" title="Edit task">⋯</button>
      </div>
    </article>`;
  }

  function emptyState(text) { return `<div class="empty">${escapeHtml(text)}</div>`; }

  function renderToday() {
    const open = tasks.filter(t => t.status !== 'completed');
    const overdue = open.filter(isOverdue);
    const today = open.filter(isDueToday);
    const waiting = open.filter(t => t.status === 'waiting');
    const focus = open.filter(t => t.focus);

    const stats = [
      [overdue.length, 'Overdue'], [today.length, 'Due today'], [waiting.length, 'Waiting'], [focus.length, 'Today focus']
    ];
    els.statsGrid.innerHTML = stats.map(([n,l]) => `<div class="stat-card"><span class="stat-number">${n}</span><span class="stat-label">${l}</span></div>`).join('');

    const queue = sortTasks(open.filter(t => t.focus || isOverdue(t) || isDueToday(t) || t.priority === 'critical' || t.priority === 'high')).slice(0,7);
    els.priorityQueue.innerHTML = queue.length ? queue.map(taskCard).join('') : emptyState('Nothing urgent. Add a task or build your day.');

    const corePeople = ['Manta','David','Kerri'];
    const activeOthers = WAITING_DEFAULTS
      .filter(name => !corePeople.includes(name))
      .map(name => [name, waiting.filter(t => t.waitingOn === name).length])
      .filter(([,count]) => count > 0)
      .sort((a,b) => b[1]-a[1]);
    const counts = [
      ...corePeople.map(name => [name, waiting.filter(t => t.waitingOn === name).length]),
      ...activeOthers
    ].slice(0,6);
    els.bottleneckStrip.innerHTML = counts.map(([name,count]) => `<button class="bottle-card ${count>1 ? 'hot' : ''}" type="button" data-waiting-person="${escapeHtml(name)}"><strong>${escapeHtml(name)}</strong><span>${count} ${count===1?'item':'items'} waiting</span></button>`).join('');

    const next = sortTasks(open.filter(t => t.dueDate && !isOverdue(t) && !isDueToday(t))).slice(0,6);
    els.upNextList.innerHTML = next.length ? next.map(taskCard).join('') : emptyState('No upcoming deadlines yet.');
  }

  function renderTasks() {
    const status = els.taskStatusFilter.value;
    const priority = els.taskPriorityFilter.value;
    const q = els.taskSearch.value.trim().toLowerCase();
    let list = tasks.filter(t => {
      if (status === 'open' && t.status === 'completed') return false;
      if (status === 'today' && !isDueToday(t)) return false;
      if (status === 'overdue' && !isOverdue(t)) return false;
      if (status === 'completed' && t.status !== 'completed') return false;
      if (priority !== 'all' && t.priority !== priority) return false;
      if (q && !`${t.title} ${t.project} ${t.notes} ${t.waitingOn}`.toLowerCase().includes(q)) return false;
      return true;
    });
    list = sortTasks(list);
    els.allTasksList.innerHTML = list.length ? list.map(taskCard).join('') : emptyState('No tasks match this filter.');
  }

  function renderWaiting() {
    const waiting = tasks.filter(t => t.status === 'waiting');
    const corePeople = ['Manta','David','Kerri'];
    const activeOthers = WAITING_DEFAULTS.filter(name => !corePeople.includes(name) && waiting.some(t => t.waitingOn === name));
    const people = ['All', ...corePeople, ...activeOthers];
    els.waitingPeopleTabs.innerHTML = people.map(name => `<button class="chip ${activeWaitingFilter===name?'active':''}" type="button" data-wait-filter="${escapeHtml(name)}">${escapeHtml(name)}${name==='All' ? ` (${waiting.length})` : ` (${waiting.filter(t=>t.waitingOn===name).length})`}</button>`).join('');
    let list = waiting;
    if (activeWaitingFilter !== 'All') list = list.filter(t => t.waitingOn === activeWaitingFilter);
    list = sortTasks(list);
    els.waitingList.innerHTML = list.length ? list.map(taskCard).join('') : emptyState('Nothing waiting here.');
  }

  function renderProjects() {
    const open = tasks.filter(t => t.status !== 'completed' && t.project);
    const map = new Map();
    open.forEach(t => {
      if (!map.has(t.project)) map.set(t.project, []);
      map.get(t.project).push(t);
    });
    const projects = [...map.entries()].sort((a,b) => {
      const aCrit = a[1].some(t => isOverdue(t) || t.priority==='critical') ? 1 : 0;
      const bCrit = b[1].some(t => isOverdue(t) || t.priority==='critical') ? 1 : 0;
      if (aCrit !== bCrit) return bCrit-aCrit;
      return b[1].length-a[1].length;
    });
    els.projectsList.innerHTML = projects.length ? projects.map(([project,list]) => {
      const overdue = list.filter(isOverdue).length;
      const waiting = list.filter(t => t.status==='waiting').length;
      const next = sortTasks(list.filter(t => t.dueDate))[0];
      return `<button class="project-card" type="button" data-project="${escapeHtml(project)}">
        <div class="project-top"><span class="project-name">${escapeHtml(project)}</span><span class="project-count">${list.length} open</span></div>
        <div class="project-meta">${overdue ? `<span>⚠ ${overdue} overdue</span>` : ''}${waiting ? `<span>⏳ ${waiting} waiting</span>` : ''}${next?.dueDate ? `<span>◷ Next ${formatDate(next.dueDate,{weekday:true})}</span>` : ''}</div>
      </button>`;
    }).join('') : emptyState('Add project names to tasks and they will group here automatically.');
  }

  function renderCompleted() {
    const list = [...tasks.filter(t => t.status === 'completed')].sort((a,b) => (b.completedAt||'').localeCompare(a.completedAt||''));
    els.completedList.innerHTML = list.length ? list.map(taskCard).join('') : emptyState('Completed work will appear here.');
  }

  function renderAll() {
    els.todayLabel.textContent = new Intl.DateTimeFormat('en-IE', { weekday:'long', day:'numeric', month:'long' }).format(new Date());
    renderToday(); renderTasks(); renderWaiting(); renderProjects(); renderCompleted();
  }

  function openView(name) {
    currentView = name;
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `${name}View`));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === name));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (name === 'tasks') renderTasks();
    if (name === 'waiting') renderWaiting();
  }

  function resetForm() {
    els.taskForm.reset();
    els.taskId.value = '';
    els.taskPriority.value = 'normal';
    els.taskStatus.value = 'open';
    els.taskRepeat.value = 'none';
    els.taskFocus.value = 'false';
    els.deleteTaskBtn.classList.add('hidden');
    els.dialogTitle.textContent = 'Add task';
  }

  function openNewTask(prefill={}) {
    resetForm();
    Object.entries(prefill).forEach(([k,v]) => {
      const el = $(`task${k.charAt(0).toUpperCase()+k.slice(1)}`);
      if (el && v != null) el.value = String(v);
    });
    els.taskDialog.showModal();
    setTimeout(() => els.taskTitle.focus(), 50);
  }

  function openEditTask(id) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    resetForm();
    els.dialogTitle.textContent = 'Edit task';
    els.deleteTaskBtn.classList.remove('hidden');
    const map = {
      taskId: t.id, taskTitle: t.title, taskProject: t.project, taskType: t.type, taskPriority: t.priority,
      taskStatus: t.status, taskDueDate: t.dueDate, taskDueTime: t.dueTime, taskReminderDate: t.reminderDate,
      taskReminderTime: t.reminderTime, taskWaitingOn: t.waitingOn, taskChaseDate: t.chaseDate,
      taskRepeat: t.repeat, taskFocus: String(t.focus), taskNotes: t.notes
    };
    Object.entries(map).forEach(([id,val]) => { $(id).value = val || ''; });
    els.taskDialog.showModal();
  }

  function saveFromForm() {
    const id = els.taskId.value;
    const previous = tasks.find(t => t.id === id);
    const status = els.taskStatus.value;
    const payload = normalizeTask({
      ...(previous || {}), id: id || undefined,
      title: els.taskTitle.value,
      project: els.taskProject.value,
      type: els.taskType.value,
      priority: els.taskPriority.value,
      status,
      dueDate: els.taskDueDate.value,
      dueTime: els.taskDueTime.value,
      reminderDate: els.taskReminderDate.value,
      reminderTime: els.taskReminderTime.value,
      waitingOn: els.taskWaitingOn.value,
      waitingSince: status === 'waiting' ? (previous?.waitingSince || toDateInput(new Date())) : '',
      chaseDate: els.taskChaseDate.value,
      repeat: els.taskRepeat.value,
      focus: els.taskFocus.value === 'true',
      notes: els.taskNotes.value,
      completedAt: status === 'completed' ? (previous?.completedAt || new Date().toISOString()) : ''
    });
    if (!payload.title) return;
    if (status === 'waiting' && !payload.waitingOn) payload.waitingOn = 'Other';
    if (previous) tasks = tasks.map(t => t.id === id ? payload : t);
    else tasks.push(payload);
    saveTasks();
    toast(previous ? 'Task updated' : 'Task added');
  }

  function completeTask(id) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    if (t.status === 'completed') {
      t.status = 'open'; t.completedAt = ''; t.updatedAt = new Date().toISOString();
      saveTasks(); toast('Task reopened'); return;
    }

    const original = { ...t };
    t.status = 'completed'; t.completedAt = new Date().toISOString(); t.focus = false; t.updatedAt = new Date().toISOString();
    if (original.repeat !== 'none' && original.dueDate) {
      const next = fromDateInput(original.dueDate);
      if (original.repeat === 'daily') next.setDate(next.getDate()+1);
      if (original.repeat === 'weekly') next.setDate(next.getDate()+7);
      if (original.repeat === 'monthly') next.setMonth(next.getMonth()+1);
      tasks.push(normalizeTask({
        ...original, id: undefined, status: 'open', dueDate: toDateInput(next), completedAt: '', focus: false,
        reminderDate: original.reminderDate ? toDateInput(next) : '', waitingSince: original.status==='waiting' ? toDateInput(new Date()) : ''
      }));
    }
    saveTasks(); toast(original.repeat !== 'none' ? 'Completed — next occurrence created' : 'Task completed');
  }

  function snoozeTask(id) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    const base = t.dueDate ? fromDateInput(t.dueDate) : new Date();
    base.setDate(base.getDate()+1);
    t.dueDate = toDateInput(base);
    if (t.chaseDate && dateDiffDays(t.chaseDate) <= 0) t.chaseDate = t.dueDate;
    t.focus = false;
    t.updatedAt = new Date().toISOString();
    saveTasks(); toast('Moved forward one day');
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks(); toast('Task deleted');
  }

  function buildMyDay() {
    tasks.forEach(t => { if (t.status !== 'completed') t.focus = false; });
    const candidates = sortTasks(tasks.filter(t => t.status !== 'completed'));
    let selected = candidates.filter(t => isOverdue(t) || isDueToday(t) || t.priority === 'critical').slice(0,7);
    if (selected.length < 7) {
      for (const t of candidates) {
        if (!selected.includes(t) && t.status !== 'waiting') selected.push(t);
        if (selected.length >= 7) break;
      }
    }
    selected.forEach(t => t.focus = true);
    saveTasks(); toast(`Today focus set: ${selected.length} tasks`);
  }

  function parseQuick(text) {
    const raw = text.trim();
    const lower = raw.toLowerCase();
    const result = { title: raw, priority: 'normal', status: 'open', type: 'Follow-up' };

    if (/\bcritical\b|\burgent\b/.test(lower)) result.priority = 'critical';
    else if (/\bhigh\b/.test(lower)) result.priority = 'high';
    else if (/\blow\b/.test(lower)) result.priority = 'low';

    for (const person of ['Manta','David','Kerri']) {
      if (new RegExp(`\\b${person.toLowerCase()}\\b`).test(lower)) { result.waitingOn = person; if (/\bwait|waiting|chase\b/.test(lower)) result.status='waiting'; }
    }
    if (/\bwaiting\b/.test(lower)) result.status = 'waiting';
    if (/\bcall\b|\bring\b/.test(lower)) result.type = 'Call';
    if (/\bemail\b/.test(lower)) result.type = 'Email';
    if (/\bprice|pricing|quote\b/.test(lower)) result.type = 'Pricing';
    if (/\bsurvey\b/.test(lower)) result.type = 'Survey';
    if (/\border\b/.test(lower)) result.type = 'Order';
    if (/\bsite\b/.test(lower)) result.type = 'Site';

    const today = new Date();
    if (/\btoday\b/.test(lower)) result.dueDate = toDateInput(today);
    if (/\btomorrow\b/.test(lower)) { const d = new Date(today); d.setDate(d.getDate()+1); result.dueDate = toDateInput(d); }
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    days.forEach((day, target) => {
      if (new RegExp(`\\b${day}\\b`).test(lower)) {
        const d = new Date(today); let add = (target - d.getDay() + 7) % 7; if (add === 0) add = 7; d.setDate(d.getDate()+add); result.dueDate = toDateInput(d);
      }
    });
    if (result.status === 'waiting' && result.dueDate) result.chaseDate = result.dueDate;
    return result;
  }

  function taskActionHandler(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const card = btn.closest('[data-task-id]');
    if (!card) return;
    const id = card.dataset.taskId;
    if (btn.dataset.action === 'toggle') completeTask(id);
    if (btn.dataset.action === 'edit') openEditTask(id);
    if (btn.dataset.action === 'snooze') snoozeTask(id);
  }

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => els.toast.classList.remove('show'), 2200);
  }

  function generateSummary() {
    const open = sortTasks(tasks.filter(t => t.status !== 'completed'));
    const groups = [
      ['OVERDUE', open.filter(isOverdue)],
      ['TODAY', open.filter(isDueToday)],
      ['WAITING', open.filter(t => t.status === 'waiting')],
      ['UPCOMING', open.filter(t => t.dueDate && !isOverdue(t) && !isDueToday(t)).slice(0,10)],
      ['NO DEADLINE', open.filter(t => !t.dueDate && t.status !== 'waiting').slice(0,10)]
    ];
    const lines = [`BearOps Work Sync — ${new Intl.DateTimeFormat('en-IE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date())}`, ''];
    groups.forEach(([name,list]) => {
      lines.push(name);
      if (!list.length) lines.push('• None');
      list.forEach(t => {
        let extra = '';
        if (t.project) extra += ` — ${t.project}`;
        if (t.status === 'waiting' && t.waitingOn) extra += ` — waiting on ${t.waitingOn}`;
        if (t.dueDate) extra += ` — due ${formatDate(t.dueDate,{weekday:true})}`;
        lines.push(`• ${t.title}${extra}`);
      });
      lines.push('');
    });
    const completedToday = tasks.filter(t => t.status === 'completed' && t.completedAt && toDateInput(new Date(t.completedAt)) === toDateInput(new Date()));
    lines.push('COMPLETED TODAY');
    if (!completedToday.length) lines.push('• None');
    completedToday.forEach(t => lines.push(`• ${t.title}${t.project ? ` — ${t.project}` : ''}`));
    els.summaryOutput.value = lines.join('\n');
    els.summaryOutput.focus();
    els.summaryOutput.select();
    toast('Summary generated');
  }

  function exportBackup() {
    const data = { version: 1, exportedAt: new Date().toISOString(), tasks };
    const blob = new Blob([JSON.stringify(data,null,2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `BearOps-backup-${toDateInput(new Date())}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function importBackup(file) {
    try {
      const parsed = JSON.parse(await file.text());
      const incoming = Array.isArray(parsed) ? parsed : parsed.tasks;
      if (!Array.isArray(incoming)) throw new Error('Invalid format');
      tasks = incoming.map(normalizeTask);
      saveTasks(); toast(`Imported ${tasks.length} tasks`);
    } catch { toast('Could not import that backup'); }
  }

  function reminderTimestamp(t) {
    if (!t.reminderDate) return null;
    const time = t.reminderTime || '09:00';
    return new Date(`${t.reminderDate}T${time}:00`).getTime();
  }

  function checkReminders() {
    let reminded = {};
    try { reminded = JSON.parse(localStorage.getItem(REMINDER_KEY) || '{}'); } catch {}
    const now = Date.now();
    tasks.filter(t => t.status !== 'completed').forEach(t => {
      const ts = reminderTimestamp(t);
      if (!ts || ts > now || reminded[t.id] === `${t.reminderDate} ${t.reminderTime}`) return;
      const msg = `${t.title}${t.project ? ` — ${t.project}` : ''}`;
      toast(`Reminder: ${msg}`);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('BearOps reminder', { body: msg, icon: './icon-192.png', badge: './icon-192.png' });
      }
      reminded[t.id] = `${t.reminderDate} ${t.reminderTime}`;
    });
    localStorage.setItem(REMINDER_KEY, JSON.stringify(reminded));
  }

  function installServiceWorker() {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }

  // Navigation and actions
  document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => openView(btn.dataset.view)));
  document.querySelectorAll('[data-open-view]').forEach(btn => btn.addEventListener('click', () => openView(btn.dataset.openView)));
  document.querySelectorAll('[data-new-task]').forEach(btn => btn.addEventListener('click', () => openNewTask(btn.textContent.includes('waiting') ? { status:'waiting' } : {})));
  $('quickAddBtn').addEventListener('click', () => { els.quickText.value=''; els.quickDialog.showModal(); setTimeout(()=>els.quickText.focus(),50); });
  $('focusBtn').addEventListener('click', buildMyDay);
  $('closeDialogBtn').addEventListener('click', () => els.taskDialog.close());
  $('cancelTaskBtn').addEventListener('click', () => els.taskDialog.close());
  $('closeQuickBtn').addEventListener('click', () => els.quickDialog.close());
  $('quickCancelBtn').addEventListener('click', () => els.quickDialog.close());

  els.taskForm.addEventListener('submit', (e) => { e.preventDefault(); saveFromForm(); els.taskDialog.close(); });
  els.quickForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!els.quickText.value.trim()) return;
    const parsed = parseQuick(els.quickText.value);
    tasks.push(normalizeTask(parsed));
    saveTasks(); els.quickDialog.close(); toast('Quick task added');
  });

  els.deleteTaskBtn.addEventListener('click', () => {
    const id = els.taskId.value;
    if (id && confirm('Delete this task?')) { deleteTask(id); els.taskDialog.close(); }
  });

  [els.priorityQueue, els.upNextList, els.allTasksList, els.waitingList, els.completedList].forEach(el => el.addEventListener('click', taskActionHandler));

  els.bottleneckStrip.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-waiting-person]'); if (!btn) return;
    activeWaitingFilter = btn.dataset.waitingPerson; openView('waiting'); renderWaiting();
  });
  els.waitingPeopleTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-wait-filter]'); if (!btn) return;
    activeWaitingFilter = btn.dataset.waitFilter; renderWaiting();
  });
  els.projectsList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-project]'); if (!btn) return;
    openView('tasks'); els.taskSearch.value = btn.dataset.project; renderTasks();
  });

  [els.taskStatusFilter, els.taskPriorityFilter].forEach(el => el.addEventListener('change', renderTasks));
  els.taskSearch.addEventListener('input', renderTasks);

  $('clearCompletedBtn').addEventListener('click', () => {
    if (!tasks.some(t => t.status==='completed')) return;
    if (confirm('Clear all completed tasks?')) { tasks = tasks.filter(t => t.status !== 'completed'); saveTasks(); }
  });

  $('exportBtn').addEventListener('click', exportBackup);
  $('importInput').addEventListener('change', e => { const file = e.target.files?.[0]; if (file) importBackup(file); e.target.value=''; });
  $('seedBtn').addEventListener('click', () => {
    if (!window.BearOpsSeed?.writeCurrentList) return toast('Current work list is unavailable');
    if (tasks.length && !confirm('Replace your current BearOps tasks with the preloaded current work list?')) return;
    window.BearOpsSeed.writeCurrentList();
    location.reload();
  });
  $('resetBtn').addEventListener('click', () => { if (confirm('Reset BearOps and delete all local tasks?')) { tasks=[]; localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(REMINDER_KEY); renderAll(); toast('BearOps reset'); } });
  $('shareSummaryBtn').addEventListener('click', generateSummary);

  $('notificationBtn').addEventListener('click', async () => {
    if (!('Notification' in window)) return toast('Notifications are not supported in this browser');
    const permission = await Notification.requestPermission();
    toast(permission === 'granted' ? 'Notifications enabled' : 'Notifications not enabled');
  });
  $('testNotificationBtn').addEventListener('click', () => {
    if ('Notification' in window && Notification.permission === 'granted') new Notification('BearOps', { body:'Test reminder is working.', icon:'./icon-192.png' });
    else toast('Enable notifications first');
  });

  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkReminders(); });
  setInterval(checkReminders, 60000);

  renderAll(); checkReminders(); installServiceWorker();
})();
