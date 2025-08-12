// app.js

// Storage key
const STORAGE_ROOSTER = 'hm_rooster_v2';

// Data: laad rooster uit localStorage of start leeg
let rooster = JSON.parse(localStorage.getItem(STORAGE_ROOSTER)) || [];

// DOM elementen
const btnToevoegen = document.getElementById('toevoegen-rooster-dag');
const dialog = document.getElementById('rooster-dialog');
const btnCancel = document.getElementById('rooster-cancel');
const form = document.getElementById('rooster-form');
const roosterLijst = document.getElementById('rooster-lijst');

function opslaanRooster() {
  localStorage.setItem(STORAGE_ROOSTER, JSON.stringify(rooster));
}

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

    // Format: Datum + tijden + nachtdienst
    const tekst = `${werkdag.datum} | ${werkdag.start} - ${werkdag.eind} ${werkdag.nachtdienst ? '(Nachtdienst)' : ''}`;
    li.textContent = tekst;

    // Verwijder knop
    const btnVerwijder = document.createElement('button');
    btnVerwijder.textContent = '×';
    btnVerwijder.title = 'Werkdag verwijderen';
    btnVerwijder.className = 'verwijder-rooster';
    btnVerwijder.dataset.index = index;

    btnVerwijder.addEventListener('click', () => {
      rooster.splice(index, 1);
      opslaanRooster();
      renderRoosterLijst();
    });

    li.appendChild(btnVerwijder);
    roosterLijst.appendChild(li);
  });
}

// Open formulier dialog
btnToevoegen.addEventListener('click', () => {
  dialog.classList.remove('hidden');
  form.reset();
  document.getElementById('rooster-datum').focus();
});

// Annuleer formulier
btnCancel.addEventListener('click', () => {
  dialog.classList.add('hidden');
});

// Formulier opslaan
form.addEventListener('submit', e => {
  e.preventDefault();

  const datum = document.getElementById('rooster-datum').value;
  const start = document.getElementById('rooster-start').value;
  const eind = document.getElementById('rooster-eind').value;
  const nachtdienst = document.getElementById('rooster-nachtdienst').checked;

  if (!datum || !start || !eind) {
    alert('Vul datum, start- en eindtijd in.');
    return;
  }
  if (eind <= start) {
    alert('Eindtijd moet later zijn dan starttijd.');
    return;
  }

  rooster.push({ datum, start, eind, nachtdienst });
  opslaanRooster();
  renderRoosterLijst();
  dialog.classList.add('hidden');
});

// Init pagina
document.addEventListener('DOMContentLoaded', () => {
  renderRoosterLijst();
});
