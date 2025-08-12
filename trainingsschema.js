// trainingsschema.js

// --- Storage keys ---
const STORAGE_ROOSTER = 'hm_rooster_v2';
const STORAGE_LOGS = 'hm_logs_v2';

// --- Data laden ---
let rooster = JSON.parse(localStorage.getItem(STORAGE_ROOSTER)) || [];
let logs = JSON.parse(localStorage.getItem(STORAGE_LOGS)) || [];

// --- Standaard trainingsschema (3x per week) ---
const standaardSchema = [
  { type: 'Interval', afstand: '5 km', doel: 'Korte snelle stukken' },
  { type: 'Duurloop', afstand: '10 km', doel: 'Rustig tempo uithoudingsvermogen' },
  { type: 'Herstel', afstand: '5 km', doel: 'Lichte rustige loop' },
];

// --- DOM element ---
const trainingsschemaEl = document.getElementById('trainingsschema');

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
    // Check of training al voltooid is
    const alVoltooid = logs.some(log => log.datum === komende7Dagen[i] && log.type === standaardSchema[i].type);

    geplandeTrainingen.push({
      datum: komende7Dagen[i],
      ...standaardSchema[i],
      voltooid: alVoltooid,
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

  trainingen.forEach(t => {
    const li = document.createElement('li');
    li.textContent = `${t.datum}: ${t.type} - ${t.afstand} (${t.doel})`;

    const btn = document.createElement('button');
    btn.textContent = t.voltooid ? '✓ Voltooid' : 'Markeer als voltooid';
    btn.disabled = t.voltooid;
    btn.style.marginLeft = '1rem';

    btn.addEventListener('click', () => {
      logs.push({ datum: t.datum, type: t.type, afstand: t.afstand, doel: t.doel, voltooidOp: new Date().toISOString() });
      localStorage.setItem(STORAGE_LOGS, JSON.stringify(logs));
      renderTrainingsschema();
    });

    li.appendChild(btn);
    trainingsschemaEl.appendChild(li);
  });
}

// --- Init pagina ---
document.addEventListener('DOMContentLoaded', () => {
  renderTrainingsschema();
});
