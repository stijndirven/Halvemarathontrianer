// --- Storage key ---
const STORAGE_ROOSTER = 'hm_rooster_v2';

// --- Data laden of initialiseren ---
let rooster = JSON.parse(localStorage.getItem(STORAGE_ROOSTER)) || [];

// --- DOM elementen ---
const btnToevoegen = document.getElementById('toevoegen-rooster-dag');
const dialog = document.getElementById('rooster-dialog');
const btnCancel = document.getElementById('rooster-cancel');
const form = document.getElementById('rooster-form');
const roosterLijst = document.getElementById('rooster-lijst');

// --- Diensttijden per type ---
const dienstTijden = {
  dagdienst: { start: '08:00', eind: '18:00', label: 'Dagdienst (08:00 - 18:00)' },
  tussendienst: { start: '14:30', eind: '22:30', label: 'Tussendienst (14:30 - 22:30)' },
  avonddienst: { start: '16:30', eind: '23:30', label: 'Avonddienst (16:30 - 23:30)' },
  nachtdienst: { start: '23:00', eind: '09:00', label: 'Nachtdienst (23:00 - 09:00)' }
};

// --- Opslaan functie ---
function opslaanRooster() {
  localStorage.setItem(STORAGE_ROOSTER, JSON.stringify(rooster));
}

// --- Roosterlijst renderen, gegroepeerd per week ---
function renderRoosterLijst() {
  roosterLijst.innerHTML = '';

  if (rooster.length === 0) {
    const leegMsg = document.createElement('li');
    leegMsg.textContent = 'Nog geen werkdagen toegevoegd.';
    leegMsg.style.fontStyle = 'italic';
    roosterLijst.appendChild(leegMsg);
    return;
  }

  // Sorteer op datum
  rooster.sort((a, b) => a.datum.localeCompare(b.datum));

  // Groepeer per kalenderweek
  const weeks = {};

  rooster.forEach(dag => {
    const dt = new Date(dag.datum);
    const jaar = dt.getFullYear();

    // Kalenderweek nummer (ISO 8601)
    const weekNum = getWeekNumber(dt);

    const key = `${jaar}-W${weekNum}`;
    if (!weeks[key]) weeks[key] = [];
    weeks[key].push(dag);
  });

  // Render per week
  for (const week in weeks) {
    const weekSection = document.createElement('section');
    weekSection.className = 'week-block';

    const weekHeader = document.createElement('h3');
    weekHeader.textContent = `Week ${week.split('-W')[1]} (${week.split('-W')[0]})`;
    weekSection.appendChild(weekHeader);

    const ul = document.createElement('ul');

    weeks[week].forEach((werkdag, index) => {
      const li = document.createElement('li');

      const dienstInfo = dienstTijden[werkdag.dienst];
      const tekst = `${werkdag.datum} — ${dienstInfo ? dienstInfo.label : ''}`;
      li.textContent = tekst;

      const btnVerwijder = document.createElement('button');
      btnVerwijder.textContent = '×';
      btnVerwijder.title = 'Werkdag verwijderen';
      btnVerwijder.className = 'verwijder-rooster';

      btnVerwijder.addEventListener('click', () => {
        // Verwijder juiste dag uit rooster
        rooster = rooster.filter(d => !(d.datum === werkdag.datum && d.dienst === werkdag.dienst));
        opslaanRooster();
        renderRoosterLijst();
      });

      li.appendChild(btnVerwijder);
      ul.appendChild(li);
    });

    weekSection.appendChild(ul);
    roosterLijst.appendChild(weekSection);
  }
}

// --- Kalenderweek nummer berekenen (ISO 8601) ---
function getWeekNumber(d) {
  // Copy date so don't modify original
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  // Get first day of year
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  // Calculate full weeks to nearest Thursday
  const weekNum = Math.ceil(((date - yearStart) / 86400000 + 1)/7);
  return weekNum;
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
  const dienst = document.getElementById('dienst-keuze').value;

  if (!datum || !dienst) {
    alert('Vul een datum en dienst in.');
    return;
  }

  // Check of dezelfde dag met zelfde dienst al bestaat
  const bestaat = rooster.some(d => d.datum === datum && d.dienst === dienst);
  if (bestaat) {
    alert('Deze werkdag met deze dienst is al toegevoegd.');
    return;
  }

  rooster.push({ datum, dienst });
  opslaanRooster();
  renderRoosterLijst();
  dialog.classList.add('hidden');
});

// --- Init pagina ---
document.addEventListener('DOMContentLoaded', () => {
  renderRoosterLijst();
});
