// logboek.js

// --- Storage key ---
const STORAGE_LOGS = 'hm_logs_v2';

// --- Data laden ---
let logs = JSON.parse(localStorage.getItem(STORAGE_LOGS)) || [];

// --- DOM element ---
const logboekEl = document.getElementById('logboek-lijst');

// --- Logboek renderen ---
function renderLogboek() {
  logboekEl.innerHTML = '';

  if (logs.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Nog geen voltooide trainingen.';
    li.style.fontStyle = 'italic';
    logboekEl.appendChild(li);
    return;
  }

  logs.forEach((log, index) => {
    const li = document.createElement('li');
    li.textContent = `${log.datum}: ${log.type} - ${log.afstand} (${log.doel}) voltooid op ${new Date(log.voltooidOp).toLocaleString()}`;

    const btnVerwijder = document.createElement('button');
    btnVerwijder.textContent = 'Verwijder';
    btnVerwijder.style.marginLeft = '1rem';

    btnVerwijder.addEventListener('click', () => {
      logs.splice(index, 1);
      localStorage.setItem(STORAGE_LOGS, JSON.stringify(logs));
      renderLogboek();
    });

    li.appendChild(btnVerwijder);
    logboekEl.appendChild(li);
  });
}

// --- Init pagina ---
document.addEventListener('DOMContentLoaded', () => {
  renderLogboek();
});
