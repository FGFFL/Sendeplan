
// === DOM Elemente ===
const calendar = document.getElementById('calendar');
const viewSelector = document.getElementById('viewSelector');
const startDatePicker = document.getElementById('startDatePicker');
const updateView = document.getElementById('updateView');
const addBeitragBtn = document.getElementById('addBeitragBtn');
const beitragDialog = document.getElementById('beitragDialog');
const newBeitragText = document.getElementById('newBeitragText');
const newBeitragColor = document.getElementById('newBeitragColor');
const poolItems = document.getElementById('poolItems');
const cancelBeitrag = document.getElementById('cancelBeitrag');

const rows = 40;
let calendarData = {}; // id: { text, color, span }

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
  if (data) calendarData = JSON.parse(data);
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
    const beitrag = createBeitrag(calendarData[id].text, calendarData[id].color, id, calendarData[id].span || 1);
    beitrag.style.gridColumn = `span ${calendarData[id].span || 1}`;
    cell.appendChild(beitrag);
  }
  return cell;
}

function createBeitrag(text, color, id, span = 1) {
  const beitrag = document.createElement('div');
  beitrag.className = 'beitrag';
  beitrag.textContent = text;
  beitrag.style.backgroundColor = color;
  beitrag.setAttribute('draggable', 'true');

  const removeBtn = document.createElement('button');
  removeBtn.textContent = '✖';
  removeBtn.className = 'remove';
  removeBtn.onclick = (e) => {
    e.stopPropagation();
    beitrag.remove();
    delete calendarData[id];
    saveData();
  };

  beitrag.appendChild(removeBtn);

  beitrag.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', text);
    e.dataTransfer.setData('color', color);
    e.dataTransfer.setData('sourceId', id);
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
  dates.forEach(date => row.appendChild(createCell(date, rowIdx)));
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
  const sourceId = e.dataTransfer.getData('sourceId');
  const cell = e.currentTarget;
  const id = cell.dataset.id;

  const beitrag = createBeitrag(type, color, id);
  cell.innerHTML = '';
  cell.appendChild(beitrag);

  calendarData[id] = { text: type, color, span: 1 };
  if (sourceId && sourceId !== id) delete calendarData[sourceId];
  saveData();
}

function initDragAndDrop() {
  poolItems.querySelectorAll('.beitrag-pool').forEach(item => {
    item.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', item.textContent);
      e.dataTransfer.setData('color', item.dataset.color);
    });
  });
}

function addPoolBeitrag(text, color) {
  const span = document.createElement('span');
  span.className = 'beitrag-pool';
  span.textContent = text;
  span.setAttribute('draggable', 'true');
  span.dataset.color = color;
  span.style.backgroundColor = color;

  const removeBtn = document.createElement('button');
  removeBtn.textContent = '✖';
  removeBtn.className = 'remove';
  removeBtn.onclick = () => span.remove();
  span.appendChild(removeBtn);

  poolItems.appendChild(span);
  initDragAndDrop();
}

addBeitragBtn.addEventListener('click', () => beitragDialog.showModal());
cancelBeitrag.addEventListener('click', () => beitragDialog.close());

beitragDialog.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = newBeitragText.value.trim();
  const color = newBeitragColor.value;
  if (text) {
    addPoolBeitrag(text, color);
    beitragDialog.close();
    newBeitragText.value = '';
  }
});

const todayStr = new Date().toISOString().split('T')[0];
startDatePicker.value = todayStr;
loadData();
createGrid(new Date(), viewSelector.value);
initDragAndDrop();

updateView.addEventListener('click', () => {
  const days = viewSelector.value;
  const startDate = new Date(startDatePicker.value);
  createGrid(startDate, days);
});
