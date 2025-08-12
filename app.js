// Halve Marathon Coach v2 - app.js

// --- Helpers ---
function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function parseTimeToMinutes(t) {
  // "HH:MM" -> totaal minuten
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`;
}

function isNachtdienst(werkdag) {
  return werkdag.nachtdienst === true;
}

// --- Storage keys ---
const STORAGE_ROOSTER = 'hm_rooster_v2';
const STORAGE_LOGS = 'hm_logs_v2';
const STORAGE_SCHEMA = 'hm_schema_v2';

// --- Init data ---
let rooster = JSON.parse(localStorage.getItem(STORAGE_ROOSTER)) || [];
let logs = JSON.parse(localStorage.getItem(STORAGE_LOGS)) || [];
let schema = JSON.parse(localStorage.getItem(STORAGE_SCHEMA)) || generateInitialSchema();

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  renderKalender();
  renderRoosterLijst();
  renderSchema();
  renderLogboek();
  renderStatistieken();
  setupRoosterDialog();
  setupEvents();
  registerServiceWorker();
});

// --- Kalender rendering ---
function renderKalender() {
  const kalenderEl = document.getElementById('kalender');
  kalenderEl.innerHTML = '';

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDate(new Date(year, month, d));
    const dagEl = document.createElement('div');
    dagEl.className = 'dag';
    dagEl.textContent = d;

    if (dateStr === formatDate(now)) dagEl.classList.add('vandaag');

    // Is deze dag geselecteerd in rooster?
    if (rooster.find(wd => wd.datum === dateStr)) {
      dagEl.classList.add('geselecteerd');
    }

    dag
