// werkdagen.js

// Storage key
const STORAGE_ROOSTER = 'hm_rooster_v2';

// Data laden of initialiseren
let rooster = JSON.parse(localStorage.getItem(STORAGE_ROOSTER)) || [];

// DOM elementen
const btnToevoegen = document.getElementById('toevoegen-rooster-dag');
const dialog = document.getElementById('rooster-dialog');
const btnCancel = document.getElementById('rooster-cancel');
const form = document.getElementById('rooster-form');
const roosterLijst = document.getElementById('rooster-lijst');
const dienstKeuze = document.getElementById('dienst-keuze');

// Vooraf ingestelde diensten met tijden
const diensten = {
  dagdienst: { start: '08:00', eind: '18:00', label: 'Dagdienst (08:00 - 18:00)' },
  tussendienst: { start: '14:30', eind: '22:30', label: 'Tussendienst (14:30 - 22:30)' },
  avonddienst: { start: '16:30', eind: '23:30', label: 'Avonddienst (16:30 - 23:30)' },
  nachtdienst: { start: '23:00', eind: '09:00', label: 'Nachtdienst (23:00 - 09:00)' },
};

// Functie om rooster op te slaan
function opslaanRooster() {
  localStorage.setItem(STORAGE_ROOSTER, JSON.stringify(rooster));
}

// Functie om rooster weer te geven
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
    li.textContent = `${werkdag.datum} | ${diensten[werkdag.dienst].label}`;

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

// Events instellen
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
  const dienst = dienstKeuze.value;

  if (!datum) {
    alert('Vul een datum in.');
    return;
  }
  if (!dienst) {
    alert('Kies een dienst.');
    return;
  }

  // Check of datum al bestaat in rooster (dubbel voorkomen)
  if (rooster.some(w => w.datum === datum)) {
    alert('Voor deze datum is al een werkdag toegevoegd.');
    return;
  }

  rooster.push({ datum, dienst });
  opslaanRooster();
  renderRoosterLijst();

  dialog.classList.add('hidden');
});

// Init pagina
document.addEventListener('DOMContentLoaded', () => {
  renderRoosterLijst();
});
