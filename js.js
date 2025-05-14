const calendar = document.getElementById('calendar');
const viewSelector = document.getElementById('viewSelector');
const startDatePicker = document.getElementById('startDatePicker');
const rows = 40;
let calendarData = {};
let currentStartDate = new Date();
let activeCellId = null;

function toggleWeekTemplateControls() {
  const isWeekView = viewSelector.value === "7";
  [
    'createWeekTemplateBtn',
    'weekTemplateSelect',
    'applyWeekTemplateBtn',
    'deleteWeekTemplateBtn'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = isWeekView ? 'inline-block' : 'none';
  });
}

function getWeekDates(startDate, days) {
  const result = [];
  const date = new Date(startDate);
  for (let i = 0; i < days; i++) {
    const d = new Date(date);
    d.setDate(date.getDate() + i);
    result.push(d);
  }
  return result;
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getFirstOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDate(date, mode = 'default') {
if (mode === 'day-only') {
  const day = date.toLocaleDateString('de-DE', { weekday: 'short' });
  const num = String(date.getDate()).padStart(2, '0');
  return `${day} ${num}`; // z. B. "Mo 01"
}

  if (mode === 'month') {
    return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  }
  return date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
}


function getDateKey(date) {
  return date instanceof Date && !isNaN(date) ? date.toISOString().split('T')[0] : '';
}

function saveData() {
  localStorage.setItem('calendarData', JSON.stringify(calendarData));
}

function loadData() {
  const data = localStorage.getItem('calendarData');
  if (data) {
    calendarData = JSON.parse(data);
  }
}

function createHeader(dates) {
  const header = document.createElement('div');
  header.className = 'calendar-header';
  const spHeader = document.createElement('div');
  spHeader.textContent = 'Sendeplatz';
  spHeader.className = 'sendeplatz-cell';
  header.appendChild(spHeader);

  const view = viewSelector.value;
  const labelMode = view === "30" ? "day-only" : "default";

  dates.forEach(d => {
    const div = document.createElement('div');
    div.textContent = formatDate(d, labelMode);
    header.appendChild(div);
  });

  return header;
}



function createCell(date, rowIdx) {
  const cell = document.createElement('div');
  cell.className = 'calendar-cell';
  const dateKey = getDateKey(date);
  const id = `${dateKey}_${rowIdx}`;
  cell.dataset.id = id;

  if (calendarData[id]) {
    const beitrag = createBeitragElement(calendarData[id].text, calendarData[id].color, id);
    cell.appendChild(beitrag);
  } else {
    const addBtn = document.createElement('button');
    addBtn.className = 'cell-add-btn';
    addBtn.textContent = '+';
    addBtn.title = 'Beitrag hinzufügen';
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openBeitragModal(id);
    });
    cell.appendChild(addBtn);
  }

  cell.addEventListener('dragover', e => e.preventDefault());
  cell.addEventListener('drop', handleDrop);
  return cell;
}

function createRow(dates, rowIdx) {
  const row = document.createElement('div');
  row.className = 'calendar-row';
  const label = document.createElement('div');
  label.className = 'sendeplatz-cell';
  label.textContent = `Platz ${rowIdx + 1}`;
  row.appendChild(label);
  dates.forEach(date => row.appendChild(createCell(date, rowIdx)));
  return row;
}

function createBeitragElement(text, color, id) {
  const beitrag = document.createElement('div');
  beitrag.className = 'beitrag';
  beitrag.textContent = text;
  beitrag.style.backgroundColor = color;
  beitrag.title = `Beitrag: ${text}`;

  beitrag.setAttribute('draggable', 'true');
  beitrag.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', text);
    e.dataTransfer.setData('color', color);
  });

  beitrag.addEventListener('dblclick', () => {
    const cell = beitrag.parentElement;
    if (cell) {
      cell.innerHTML = '';
      delete calendarData[id];
      saveData();
    }
  });

  return beitrag;
}

function openBeitragModal(cellId) {
  activeCellId = cellId;
  beitragTitel.value = '';
  beitragFarbe.value = '#28a745';
  beitragModal.style.display = 'block';
}

function handleDrop(e) {
  const text = e.dataTransfer.getData('text/plain');
  const color = e.dataTransfer.getData('color');
  const cell = e.currentTarget;
  const id = cell.dataset.id;

  const beitrag = createBeitragElement(text, color, id);
  cell.innerHTML = '';
  cell.appendChild(beitrag);

  calendarData[id] = { text, color };
  saveData();
}

function shiftView(days) {
  currentStartDate.setDate(currentStartDate.getDate() + days);
  updateCalendarView();
}

function updateCalendarView() {
  const view = viewSelector.value;
  let start = currentStartDate;
  if (view === "7") start = getMonday(start);
  else if (view === "30") start = getFirstOfMonth(start);
  createGrid(start, view);
  updateRangeText(start, view);
}

function updateRangeText(start, view) {
  const end = new Date(start);
  end.setDate(start.getDate() + (parseInt(view) - 1));
  const startStr = formatDate(start);
  const endStr = formatDate(end);

  const rangeDisplay = document.getElementById('currentRange');
  rangeDisplay.textContent =
    view === "30"
      ? formatDate(start, 'month') // Nur "Mai 2025"
      : view === "1"
      ? startStr
      : `${startStr} – ${endStr}`;
}


function createGrid(startDate, days) {
  const cols = parseInt(days);
  const dates = getWeekDates(startDate, cols);
  calendar.innerHTML = '';
  calendar.style.setProperty('--cols', cols);
  calendar.appendChild(createHeader(dates));
  for (let r = 0; r < rows; r++) calendar.appendChild(createRow(dates, r));
}

function getWeekRange(startDate) {
  return getWeekDates(getMonday(startDate), 7);
}

function saveWeekTemplate(templateName, baseDate) {
  const dates = getWeekRange(baseDate).map(getDateKey);
  const template = {};
  dates.forEach(dateKey => {
    for (let row = 0; row < rows; row++) {
      const id = `${dateKey}_${row}`;
      if (calendarData[id]) {
        template[id] = { ...calendarData[id] };
      }
    }
  });
  if (Object.keys(template).length === 0) return alert("Keine Beiträge in dieser Woche.");
  localStorage.setItem(`weekTemplate_${templateName}`, JSON.stringify(template));
  updateTemplateDropdown();
  alert(`Wochenvorlage "${templateName}" gespeichert.`);
}

function applyWeekTemplate(name, baseDate) {
  const data = localStorage.getItem(`weekTemplate_${name}`);
  if (!data) return alert("Vorlage nicht gefunden.");
  const original = JSON.parse(data);
  const sourceDateKeys = Object.keys(original).map(k => k.split('_')[0]);
  const sourceStartDate = new Date(sourceDateKeys.sort()[0]);
  const targetDates = getWeekRange(baseDate).map(getDateKey);
  targetDates.forEach(dateKey => {
    for (let row = 0; row < rows; row++) delete calendarData[`${dateKey}_${row}`];
  });
  for (let oldKey in original) {
    const [oldDate, row] = oldKey.split('_');
    const offset = (new Date(oldDate) - sourceStartDate) / (1000 * 60 * 60 * 24);
    const target = new Date(baseDate);
    target.setDate(target.getDate() + offset);
    const newKey = `${getDateKey(target)}_${row}`;
    calendarData[newKey] = { ...original[oldKey] };
  }
  saveData();
  updateCalendarView();
  alert(`Vorlage "${name}" angewendet.`);
}

function deleteWeekTemplate(name) {
  localStorage.removeItem(`weekTemplate_${name}`);
  updateTemplateDropdown();
  alert(`Vorlage "${name}" gelöscht.`);
}

function updateTemplateDropdown() {
  const select = document.getElementById('weekTemplateSelect');
  const keys = Object.keys(localStorage).filter(k => k.startsWith('weekTemplate_'));
  select.innerHTML = '<option value="">Vorlage auswählen</option>';
  keys.forEach(key => {
    const name = key.replace('weekTemplate_', '');
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

// Event Listeners
viewSelector.addEventListener('change', () => {
  toggleWeekTemplateControls();
  updateCalendarView();
});

document.getElementById('prevPeriod').addEventListener('click', () => {
  const step = parseInt(viewSelector.value) * -1;
  shiftView(step);
});

document.getElementById('nextPeriod').addEventListener('click', () => {
  const step = parseInt(viewSelector.value);
  shiftView(step);
});

document.getElementById('createWeekTemplateBtn').addEventListener('click', () => {
  if (viewSelector.value !== "7") return alert("Wochenvorlagen nur in Wochenansicht möglich.");
  const name = prompt("Titel der Wochenvorlage:");
  if (name) saveWeekTemplate(name.trim(), getSelectedDate());
});

document.getElementById('applyWeekTemplateBtn').addEventListener('click', () => {
  const name = document.getElementById('weekTemplateSelect').value;
  if (name) applyWeekTemplate(name, getSelectedDate());
});

document.getElementById('deleteWeekTemplateBtn').addEventListener('click', () => {
  const name = document.getElementById('weekTemplateSelect').value;
  if (name && confirm(`Vorlage "${name}" wirklich löschen?`)) deleteWeekTemplate(name);
});

document.getElementById('createBeitrag').addEventListener('click', () => {
  const text = beitragTitel.value.trim();
  const color = beitragFarbe.value;
  if (!text) return;

  if (activeCellId) {
    const cell = document.querySelector(`[data-id="${activeCellId}"]`);
    if (!cell) return;
    const beitrag = createBeitragElement(text, color, activeCellId);
    cell.innerHTML = '';
    cell.appendChild(beitrag);
    calendarData[activeCellId] = { text, color };
    saveData();
    activeCellId = null;
  } else {
    const span = document.createElement('span');
    span.setAttribute('draggable', 'true');
    span.className = 'beitrag-pool';
    span.textContent = text;
    span.dataset.color = color;
    span.style.backgroundColor = color;
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = '×';
    delBtn.addEventListener('click', e => {
      e.stopPropagation();
      span.remove();
    });
    span.appendChild(delBtn);
    beitragPoolContainer.appendChild(span);
    span.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', text);
      e.dataTransfer.setData('color', color);
    });
  }

  beitragModal.style.display = 'none';
});

document.getElementById('cancelBeitrag').addEventListener('click', () => {
  beitragModal.style.display = 'none';
  activeCellId = null;
});

document.getElementById('addBeitragBtn').addEventListener('click', () => {
  activeCellId = null;
  beitragTitel.value = '';
  beitragFarbe.value = '#28a745';
  beitragModal.style.display = 'block';
});

function getSelectedDate() {
  return dateStr ? new Date(dateStr) : new Date();
}

document.getElementById('goToTodayBtn').addEventListener('click', () => {
  const view = viewSelector.value;
  if (view === "7") {
    currentStartDate = getMonday(new Date());
  } else if (view === "30") {
    currentStartDate = getFirstOfMonth(new Date());
  } else {
    currentStartDate = new Date();
  }
  updateCalendarView();
});

// Initialisierung
updateTemplateDropdown();
toggleWeekTemplateControls();
loadData();
const view = viewSelector.value;
if (view === "7") currentStartDate = getMonday(new Date());
else if (view === "30") currentStartDate = getFirstOfMonth(new Date());
else currentStartDate = new Date();
updateCalendarView();
