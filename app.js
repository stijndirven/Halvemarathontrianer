// app.js

// --- Storage keys ---
const STORAGE_ROOSTER = 'hm_rooster_v2';
const STORAGE_LOGS = 'hm_logs_v2';

// --- Data laden of initialiseren ---
let rooster = JSON.parse(localStorage.getItem(STORAGE_ROOSTER)) || [];
let logs = JSON.parse(localStorage.getItem(STORAGE_LOGS)) || [];

// --- Simpel standaard trainingsschema (3x per week) ---
const standaardSchema = [
  { type: 'Interval', afstand: '5 km', doel: 'Korte snelle stukken' },
  { type: 'Duurloop', afstand: '10 km', doel: 'Rustig tempo uithoudingsvermogen' },
  { type: 'Herstel', afstand: '5 km', doel: 'Lichte rustige loop' },
];

// --- DOM elementen ---
const btnToevoegen = document.getElementById('toevoegen-rooster-dag');
const dialog = document.getElementById('rooster-dialog');
const btnCancel = document.getElementById('rooster-cancel');
const form = document.getElementById('rooster-form');
const roosterLijst = document.getElementById('rooster-lijst');
const trainingsschemaEl = document.getElementById('trainingsschema');

// --- Helper functies ---
function opslaanRooster() {
  localStorage.setItem(STORAGE_ROOSTER, JSON.stringify(rooster));
}

function opslaanLogs() {
  localStorage.setItem(STORAGE_LOGS, JSON.stringify(logs));
}

// --- Rooster beheren ---
function renderRoosterLijst() {
  roosterLijst.innerHTML = '';

  if (rooster.length === 0) {
    const leegMsg = document.createElement('li');
    leegMsg.textContent = 'Nog geen werkdagen toegevoegd.';
    leegMsg.style.fontStyle = 'italic';
    roosterLijst.appendChild(leegMsg);
    return;
  }

  rooster.forEach((werkdag, index) => {
    const li = document.createElement('li');
    const tekst = `${werkdag.datum} | ${werkdag.dienst} (${werkdag.start} - ${werkdag.eind})${werkdag.nachtdienst ? ' (Nachtdienst)' : ''}`;
    li.textContent = tekst;

    const btnVerwijder = document.createElement('button');
    btnVerwijder.textContent = '×';
    btnVerwijder.title = 'Werkdag verwijderen';
    btnVerwijder.className = 'verwijder-rooster';
    btnVerwijder.dataset.index = index;

    btnVerwijder.addEventListener('click', () => {
      rooster.splice(index, 1);
      opslaanRooster();
      renderRoosterLijst();
      renderTrainingsschema(); // herplan trainingen bij roosterwijziging
    });

    li.appendChild(btnVerwijder);
    roosterLijst.appendChild(li);
  });
}

// --- Trainingsschema plannen op vrije dagen ---
function planTrainingen() {
  const vandaag = new Date();
  const komende7Dagen = [];

  for (let i = 0; i < 7; i++) {
    const dag = new Date(vandaag);
    dag.setDate(vandaag.getDate() + i);
    const datumStr = dag.toISOString().slice(0, 10);

    // Check of dag een werkdag is
    const isWerkdag = rooster.some(d => d.datum === datumStr);
    if (!isWerkdag) {
      komende7Dagen.push(datumStr);
    }
  }

  const geplandeTrainingen = [];

  for (let i = 0; i < komende7Dagen.length && i < standaardSchema.length; i++) {
    // Check of training al in logs voltooid is voor deze datum en type
    const alVoltooid = logs.some(log => log.datum === komende7Dagen[i] && log.type === standaardSchema[i].type);

    geplandeTrainingen.push({
      datum: komende7Dagen[i],
      ...standaardSchema[i],
      voltooid: alVoltooid
    });
  }

  return geplandeTrainingen;
}

// --- Trainingsschema tonen ---
function renderTrainingsschema() {
  trainingsschemaEl.innerHTML = '';

  const trainingen = planTrainingen();

  if (trainingen.length === 0) {
    trainingsschemaEl.innerHTML = '<li>Geen trainingsdagen deze week (alle dagen werken)</li>';
    return;
  }

  trainingen.forEach((t) => {
    const li = document.createElement('li');
    li.textContent = `${t.datum}: ${t.type} - ${t.afstand} (${t.doel})`;

    const btn = document.createElement('button');
    btn.textContent = t.voltooid ? '✓ Voltooid' : 'Markeer als voltooid';
    btn.disabled = t.voltooid;
    btn.style.marginLeft = '1rem';

    btn.addEventListener('click', () => {
      // Voeg log toe
      logs.push({ datum: t.datum, type: t.type, afstand: t.afstand, doel: t.doel, voltooidOp: new Date().toISOString() });
      opslaanLogs();
      renderTrainingsschema();
    });

    li.appendChild(btn);
    trainingsschemaEl.appendChild(li);
  });
}

// --- Events instellen ---
btnToevoegen.addEventListener('click', () => {
  dialog.classList.remove('hidden');
  form.reset();
  document.getElementById('rooster-datum').focus();
});

btnCancel.addEventListener('click', () => {
  dialog.classList.add('hidden');
});

form.addEventListener('submit', e => {
  e.preventDefault();

  const datum = document.getElementById('rooster-datum').value;
  const dienst = document.getElementById('rooster-dienst').value;

  if (!datum || !dienst) {
    alert('Vul datum en dienst in.');
    return;
  }

  // dienst tijden vastleggen
  let start, eind, nachtdienst = false;
  switch(dienst) {
    case 'dagdienst':
      start = '08:00';
      eind = '18:00';
      break;
    case 'tussendienst':
      start = '14:30';
      eind = '22:30';
      break;
    case 'avonddienst':
      start = '16:30';
      eind = '23:30';
      break;
    case 'nachtdienst':
      start = '23:00';
      eind = '09:00';
      nachtdienst = true;
      break;
    default:
      alert('Ongeldige dienst geselecteerd.');
      return;
  }

  rooster.push({ datum, start, eind, nachtdienst, dienst });
  opslaanRooster();
  renderRoosterLijst();
  renderTrainingsschema();

  dialog.classList.add('hidden');
});

// --- Init pagina ---
document.addEventListener('DOMContentLoaded', () => {
  renderRoosterLijst();
  renderTrainingsschema();
});
