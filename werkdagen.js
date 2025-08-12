// --- Storage keys ---
const STORAGE_ROOSTER = 'hm_rooster_v2';

// --- Data laden of initialiseren ---
let rooster = JSON.parse(localStorage.getItem(STORAGE_ROOSTER)) || [];

// --- DOM elementen ---
const btnToevoegen = document.getElementById('toevoegen-rooster-dag');
const dialog = document.getElementById('rooster-dialog');
const btnCancel = document.getElementById('rooster-cancel');
const form = document.getElementById('rooster-form');
const roosterLijst = document.getElementById('rooster-lijst');

// --- Helper functies ---
function opslaanRooster() {
  localStorage.setItem(STORAGE_ROOSTER, JSON.stringify(rooster));
}

// Weeknummer bepalen (ISO weeknummer)
function getWeekNumber(datumStr) {
  const date = new Date(datumStr);
  date.setHours(0,0,0,0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

// Week start- en einddatum formatteren
function getWeekDateRange(year, weekNum) {
  const simple = new Date(year, 0, 1 + (weekNum - 1) * 7);
  const dayOfWeek = simple.getDay();
  const ISOweekStart = new Date(simple);
  if (dayOfWeek <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  const ISOweekEnd = new Date(ISOweekStart);
  ISOweekEnd.setDate(ISOweekStart.getDate() + 6);

  function formatDate(d) {
    return d.toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' });
  }

  return `${formatDate(ISOweekStart)} - ${formatDate(ISOweekEnd)}`;
}

// Rooster lijst per week weergeven
function renderRoosterLijst() {
  roosterLijst.innerHTML = '';

  if (rooster.length === 0) {
    const leegMsg = document.createElement('li');
    leegMsg.textContent = 'Nog geen werkdagen toegevoegd.';
    leegMsg.style.fontStyle = 'italic';
    roosterLijst.appendChild(leegMsg);
    return;
  }

  const weken = {};

  rooster.forEach(werkdag => {
    const jaar = werkdag.datum.slice(0,4);
    const weekNum = getWeekNumber(werkdag.datum);
    const key = `${jaar}-W${weekNum}`;

    if (!weken[key]) weken[key] = [];
    weken[key].push(werkdag);
  });

  const gesorteerdeWeken = Object.keys(weken).sort();

  gesorteerdeWeken.forEach(weekKey => {
    const [jaar, weekStr] = weekKey.split('-W');
    const weekNum = Number(weekStr);
    const weekRange = getWeekDateRange(Number(jaar), weekNum);

    const weekHeader = document.createElement('h3');
    weekHeader.textContent = `Week ${weekNum} (${weekRange})`;
    roosterLijst.appendChild(weekHeader);

    const ulWeek = document.createElement('ul');

    weken[weekKey]
      .sort((a,b) => a.datum.localeCompare(b.datum))
      .forEach((werkdag) => {
        const li = document.createElement('li');
        const tekst = `${werkdag.datum} | ${werkdag.start} - ${werkdag.eind} ${werkdag.nachtdienst ? '(Nachtdienst)' : ''}`;
        li.textContent = tekst;

        const btnVerwijder = document.createElement('button');
        btnVerwijder.textContent = '×';
        btnVerwijder.title = 'Werkdag verwijderen';
        btnVerwijder.className = 'verwijder-rooster';

        const globaleIndex = rooster.findIndex(r => r.datum === werkdag.datum && r.start === werkdag.start && r.eind === werkdag.eind && r.nachtdienst === werkdag.nachtdienst);
        btnVerwijder.dataset.index = globaleIndex;

        btnVerwijder.addEventListener('click', () => {
          rooster.splice(globaleIndex, 1);
          opslaanRooster();
          renderRoosterLijst();
        });

        li.appendChild(btnVerwijder);
        ulWeek.appendChild(li);
      });

    roosterLijst.appendChild(ulWeek);
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
  const dienst = document.getElementById('dienst-keuze').value;

  if (!datum || !dienst) {
    alert('Vul datum en dienst in.');
    return;
  }

  // Start- en eindtijden per dienst
  const dienstTijden = {
    dagdienst: { start: '08:00', eind: '18:00', nachtdienst: false },
    tussendienst: { start: '14:30', eind: '22:30', nachtdienst: false },
    avonddienst: { start: '16:30', eind: '23:30', nachtdienst: false },
    nachtdienst: { start: '23:00', eind: '09:00', nachtdienst: true },
  };

  const { start, eind, nachtdienst } = dienstTijden[dienst];

  rooster.push({ datum, start, eind, nachtdienst });
  opslaanRooster();
  renderRoosterLijst();

  dialog.classList.add('hidden');
});

// --- Init pagina ---
document.addEventListener('DOMContentLoaded', () => {
  renderRoosterLijst();
});
