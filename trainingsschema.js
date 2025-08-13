// --- trainingsschema.js ---
const STORAGE_ROOSTER = 'hm_rooster_v2';
const STORAGE_LOGS = 'hm_logs_v2';

let rooster = JSON.parse(localStorage.getItem(STORAGE_ROOSTER)) || [];
let logs = JSON.parse(localStorage.getItem(STORAGE_LOGS)) || [];

const basisSchema = [
  [{type:'Interval', afstand:5, doel:'Korte snelle stukken'},
   {type:'Duurloop', afstand:8, doel:'Rustig tempo uithoudingsvermogen'},
   {type:'Herstel', afstand:4, doel:'Lichte rustige loop'}],
  // ... voeg hier alle andere weken toe zoals eerder
  [{type:'Rustdag', afstand:0, doel:'Voorbereiding halve marathon'}]
];

function formatDate(date) {
  return date.toISOString().slice(0,10);
}

function getPlanningData() {
  const startDatum = new Date();
  const data = [];
  for(let i=0; i < 84; i++) {
    const d = new Date(startDatum);
    d.setDate(d.getDate()+i);
    data.push(formatDate(d));
  }
  return data;
}

function isWerkdag(datum) {
  return rooster.some(w => w.datum === datum);
}

function isVoltooid(datum, type) {
  return logs.some(log => log.datum === datum && log.type === type);
}

function isOvergeslagen(datum, type) {
  return logs.some(log => log.datum === datum && log.type === type && log.overgeslagen === true);
}

function getStatus(datum, type) {
  if(isVoltooid(datum, type)) return 'voltooid';
  if(isOvergeslagen(datum, type)) return 'overgeslagen';
  return 'open';
}

function genereerSchema() {
  const dagen = getPlanningData();
  const trainingsdagen = [];

  let weekIndex = 0;
  let trainingIndex = 0;
  let vorigeAfstanden = [];

  for(let i=0; i< dagen.length; i++) {
    const datum = dagen[i];

    if(i === dagen.length - 1) {
      trainingsdagen.push({
        type: 'Halve Marathon',
        afstand: 21.1,
        doel: 'Wedstrijd dag - succes!',
        datum
      });
      break;
    }

    const week = basisSchema[weekIndex];
    if (!week) break;
    const training = week[trainingIndex];
    if(!training) break;

    const status = getStatus(datum, training.type);

    if(status === 'voltooid' || status === 'overgeslagen') {
      trainingIndex++;
      if(trainingIndex >= week.length) {
        trainingIndex = 0;
        weekIndex++;
      }
      continue;
    }

    if(isWerkdag(datum) && training.type === 'Duurloop' && training.afstand >= 15) {
      trainingIndex++;
      if(trainingIndex >= week.length) {
        trainingIndex = 0;
        weekIndex++;
      }
      continue;
    }

    let planTraining = true;
    if(vorigeAfstanden.length > 0) {
      const last = vorigeAfstanden[vorigeAfstanden.length - 1];
      if(last > 8) planTraining = false;
      else if(vorigeAfstanden.length > 1 && vorigeAfstanden[vorigeAfstanden.length - 2] <= 8) planTraining = false;
    }

    if(planTraining) {
      trainingsdagen.push({...training, datum});
      vorigeAfstanden.push(training.afstand);
    } else {
      vorigeAfstanden.push(0);
    }

    trainingIndex++;
    if(trainingIndex >= week.length) {
      trainingIndex = 0;
      weekIndex++;
    }
  }
  return trainingsdagen;
}

function renderTrainingsschema(nieuw=false) {
  if(nieuw) logs = [];
  const trainingsschemaEl = document.getElementById('trainingsschema');
  trainingsschemaEl.innerHTML = '';

  const schema = genereerSchema();

  if(schema.length === 0) {
    trainingsschemaEl.innerHTML = '<li>Geen geplande trainingen (allemaal voltooid?)</li>';
    return;
  }

  schema.forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${t.datum}:</strong> ${t.type} - ${t.afstand ? t.afstand + ' km' : ''} (${t.doel})`;

    const btnContainer = document.createElement('div');
    btnContainer.classList.add('buttons');

    const btnVoltooid = document.createElement('button');
    btnVoltooid.textContent = isVoltooid(t.datum, t.type) ? '✓ Voltooid' : 'Markeer als voltooid';
    btnVoltooid.disabled = isVoltooid(t.datum, t.type);
    btnVoltooid.classList.add('voltooid');
    btnVoltooid.addEventListener('click', () => {
      logs.push({datum: t.datum, type: t.type, afstand: t.afstand, doel: t.doel, voltooidOp: new Date().toISOString()});
      localStorage.setItem(STORAGE_LOGS, JSON.stringify(logs));
      renderTrainingsschema();
    });

    const btnSkip = document.createElement('button');
    btnSkip.textContent = isOvergeslagen(t.datum, t.type) ? '✓ Overgeslagen' : 'Sla over';
    btnSkip.disabled = isOvergeslagen(t.datum, t.type);
    btnSkip.classList.add('overslaan');
    btnSkip.addEventListener('click', () => {
      logs.push({datum: t.datum, type: t.type, afstand: t.afstand, doel: t.doel, overgeslagen: true, gemarkeerdOp: new Date().toISOString()});
      localStorage.setItem(STORAGE_LOGS, JSON.stringify(logs));
      renderTrainingsschema();
    });

    btnContainer.appendChild(btnVoltooid);
    btnContainer.appendChild(btnSkip);
    li.appendChild(btnContainer);

    trainingsschemaEl.appendChild(li);
  });
}

// Koppel knop
document.querySelector('.nieuwe-schema').addEventListener('click', () => renderTrainingsschema(true));

// Eerste keer renderen
renderTrainingsschema();
