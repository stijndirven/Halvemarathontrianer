// logboek.js

const STORAGE_LOGS = 'hm_logs_v2';

let logs = JSON.parse(localStorage.getItem(STORAGE_LOGS)) || [];

const logboekLijst = document.getElementById('logboek-lijst');

function renderLogboek() {
  logboekLijst.innerHTML = '';

  if(logs.length === 0) {
    const leegMsg = document.createElement('li');
    leegMsg.textContent = 'Geen voltooide trainingen.';
    leegMsg.style.fontStyle = 'italic';
    logboekLijst.appendChild(leegMsg);
    return;
  }

  // Sorteer logs op datum (nieuwste eerst)
  logs.sort((a,b) => new Date(b.datum) - new Date(a.datum));

  logs.forEach(log => {
    const li = document.createElement('li');
    li.textContent = `${log.datum}: ${log.type} - ${log.afstand} km (${log.doel}) voltooid op ${new Date(log.voltooidOp).toLocaleString()}`;

    const btnVerwijder = document.createElement('button');
    btnVerwijder.textContent = '×';
    btnVerwijder.title = 'Training verwijderen uit logboek';
    btnVerwijder.className = 'verwijder-log';
    btnVerwijder.dataset.datum = log.datum;
    btnVerwijder.dataset.type = log.type;

    btnVerwijder.addEventListener('click', () => {
      logs = logs.filter(l => !(l.datum === log.datum && l.type === log.type));
      localStorage.setItem(STORAGE_LOGS, JSON.stringify(logs));
      renderLogboek();
    });

    li.appendChild(btnVerwijder);
    logboekLijst.appendChild(li);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderLogboek();
});
