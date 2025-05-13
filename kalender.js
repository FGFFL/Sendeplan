
const calendar = document.getElementById('calendar');
const viewSelector = document.getElementById('viewSelector');
const startDatePicker = document.getElementById('startDatePicker');
const updateView = document.getElementById('updateView');
const rows = 40;
let calendarData = {}; // { "2025-05-07_5": { text, color } }

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

function formatDate(date) {
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

  dates.forEach(d => {
    const div = document.createElement('div');
    div.textContent = formatDate(d);
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

  cell.addEventListener('dragover', e => e.preventDefault());
  cell.addEventListener('drop', handleDrop);

  if (calendarData[id]) {
    const beitrag = createBeitragElement(calendarData[id].text, calendarData[id].color, id);
    cell.appendChild(beitrag);
  }

  return cell;
}

function createBeitragElement(text, color, id) {
  const beitrag = document.createElement('div');
  beitrag.className = 'beitrag';
  beitrag.textContent = text;
  beitrag.style.backgroundColor = color;
  beitrag.title = `Beitrag: ${text}`;

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

function createRow(dates, rowIdx) {
  const row = document.createElement('div');
  row.className = 'calendar-row';

  const label = document.createElement('div');
  label.className = 'sendeplatz-cell';
  label.textContent = `Platz ${rowIdx + 1}`;
  row.appendChild(label);

  dates.forEach(date => {
    row.appendChild(createCell(date, rowIdx));
  });

  return row;
}

function createGrid(startDate, days) {
  const cols = parseInt(days);
  const weekDates = getWeekDates(startDate, cols);
  calendar.innerHTML = '';
  calendar.style.setProperty('--cols', cols);

  calendar.appendChild(createHeader(weekDates));

  for (let r = 0; r < rows; r++) {
    calendar.appendChild(createRow(weekDates, r));
  }
}

function handleDrop(e) {
  const type = e.dataTransfer.getData('text/plain');
  const color = e.dataTransfer.getData('color');
  const cell = e.currentTarget;
  const id = cell.dataset.id;

  const beitrag = createBeitragElement(type, color, id);
  cell.innerHTML = '';
  cell.appendChild(beitrag);

  calendarData[id] = { text: type, color };
  saveData();
}

function initDragAndDrop() {
  const items = document.querySelectorAll('.beitrag-pool');
  items.forEach(item => {
    item.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', item.textContent);
      e.dataTransfer.setData('color', item.dataset.color);
    });
  });
}

function getSelectedDate() {
  const dateStr = startDatePicker.value;
  return dateStr ? new Date(dateStr) : new Date();
}

updateView.addEventListener('click', () => {
  const days = viewSelector.value;
  const startDate = getSelectedDate();
  createGrid(startDate, days);
});

const todayStr = new Date().toISOString().split('T')[0];
startDatePicker.value = todayStr;
loadData();
createGrid(new Date(), viewSelector.value);
initDragAndDrop();
