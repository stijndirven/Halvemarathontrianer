// werkdagen.js

const STORAGE_ROOSTER = 'hm_rooster_v2';

let rooster = JSON.parse(localStorage.getItem(STORAGE_ROOSTER)) || [];

const btnToevoegen = document.getElementById('toevoegen-rooster-dag');
const dialog = document.getElementById('rooster-dialog');
const btnCancel = document.getElementById('rooster-cancel');
const form = document.getElementById('rooster-form');
const roosterLijst = document.getElementById('rooster-lijst');

function opslaanRooster() {
  localStorage.setItem(STORAGE_ROOSTER, JSON.stringify(rooster));
}

// Functie om werkdagen te groeperen per week (jaar-week)
function getWeekNummer(datumStr) {
  const d = new Date(datumStr);
  d.setHours(0,0,0,0);
  // Donderdag in huidige week nemen (ISO week date)
  d.setDate(d.getDate() + 4 - (d.getDay()||7));
  const jaar = d.getFullYear();
  const weekNummer = Math.floor(((d - new Date(jaar,0,1)) / 86400000 + 1)/7);
  return `${jaar}-W${weekNummer}`;
}

function renderRooster() {
  roosterLijst.innerHTML = '';
  if(rooster.length === 0) {
    const leegMsg = document.createElement('li');
    leegMsg.textContent = 'Nog geen werkdagen toegevoegd.';
    leegMsg.style.fontStyle = 'italic';
    roosterLijst.appendChild(leegMsg);
    return;
  }

  // Groepeer per week
  const groepen = {};
  rooster.forEach(wd => {
    const week = getWeekNummer(wd.datum);
    if(!groepen[week]) groepen[week] = [];
    groepen[week].push(wd);
  });

  Object.keys(groepen).sort().forEach(week => {
    const header = document.createElement('h3');
    header.textContent = `Week ${week}`;
    roosterLijst.appendChild(header);

    const ul = document.createElement('ul');
    groepen[week].forEach((wd, i) => {
      const li = document.createElement('li');
      li.textContent = `${wd.datum} | ${wd.dienst}`;

      const btnVerwijder = document.createElement('button');
      btnVerwijder.textContent = '×';
      btnVerwijder.title = 'Werkdag verwijderen';
      btnVerwijder.className = 'verwijder-rooster';
      btnVerwijder.dataset.datum = wd.datum;

      btnVerwijder.addEventListener('click', () => {
        rooster = rooster.filter(r => r.datum !== wd.datum);
        opslaanRooster();
        renderRooster();
      });

      li.appendChild(btnVerwijder);
      ul.appendChild(li);
    });

    roosterLijst.appendChild(ul);
  });
}

// Events
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

  if(!datum || !dienst) {
    alert('Vul datum en dienst in.');
    return;
  }

  // Check of datum al bestaat in rooster
  if(rooster.some(d => d.datum === datum)) {
    alert('Er is al een werkdag ingevoerd voor deze datum.');
    return;
  }

  rooster.push({ datum, dienst });
  opslaanRooster();
  renderRooster();

  dialog.classList.add('hidden');
});

// Init
document.addEventListener('DOMContentLoaded', () => {
  renderRooster();
});
