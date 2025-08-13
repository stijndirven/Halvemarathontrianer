// trainingsschema.js

const STORAGE_ROOSTER = 'hm_rooster_v2';
const STORAGE_LOGS = 'hm_logs_v2';

let rooster = JSON.parse(localStorage.getItem(STORAGE_ROOSTER)) || [];
let logs = JSON.parse(localStorage.getItem(STORAGE_LOGS)) || [];

// Basis 12 weken halve marathon schema
const basisSchema = [
  [{type:'Interval', afstand:5, doel:'Korte snelle stukken'}, {type:'Duurloop', afstand:8, doel:'Rustig tempo uithoudingsvermogen'}, {type:'Herstel', afstand:4, doel:'Lichte rustige loop'}],
  [{type:'Interval', afstand:6, doel:'Korte snelle stukken'}, {type:'Duurloop', afstand:10, doel:'Rustig tempo uithoudingsvermogen'}, {type:'Herstel', afstand:5, doel:'Lichte rustige loop'}],
  [{type:'Interval', afstand:6, doel:'Korte snelle stukken'}, {type:'Duurloop', afstand:12, doel:'Rustig tempo uithoudingsvermogen'}, {type:'Herstel', afstand:5, doel:'Lichte rustige loop'}],
  [{type:'Interval', afstand:7, doel:'Korte snelle stukken'}, {type:'Duurloop', afstand:14, doel:'Rustig tempo uithoudingsvermogen'}, {type:'Herstel', afstand:6, doel:'Lichte rustige loop'}],
  [{type:'Interval', afstand:7, doel:'Korte snelle stukken'}, {type:'Duurloop', afstand:16, doel:'Rustig tempo uithoudingsvermogen'}, {type:'Herstel', afstand:6, doel:'Lichte rustige loop'}],
  [{type:'Interval', afstand:8, doel:'Korte snelle stukken'}, {type:'Duurloop', afstand:18, doel:'Rustig tempo uithoudingsvermogen'}, {type:'Herstel', afstand:6, doel:'Lichte rustige loop'}],
  [{type:'Interval', afstand:8, doel:'Korte snelle stukken'}, {type:'Duurloop', afstand:16, doel:'Rustig tempo uithoudingsvermogen'}, {type:'Herstel', afstand:6, doel:'Lichte rustige loop'}],
  [{type:'Interval', afstand:7, doel:'Korte snelle stukken'}, {type:'Duurloop', afstand:18, doel:'Rustig tempo uithoudingsvermogen'}, {type:'Herstel', afstand:6, doel:'Lichte rustige loop'}],
  [{type:'Interval', afstand:7, doel:'Korte snelle stukken'}, {type:'Duurloop', afstand:20, doel:'Rustig tempo uithoudingsvermogen'}, {type:'Herstel', afstand:5, doel:'Lichte rustige loop'}],
  [{type:'Interval', afstand:6, doel:'Korte snelle stukken'}, {type:'Duurloop', afstand:15, doel:'Rustig tempo uithoudingsvermogen'}, {type:'Herstel', afstand:5, doel:'Lichte rustige loop'}],
  [{type:'Interval', afstand:5, doel:'Korte snelle stukken'}, {type:'Duurloop', afstand:10, doel:'Rustig tempo uithoudingsvermogen'}, {type:'Herstel', afstand:4, doel:'Lichte rustige loop'}],
  [{type:'Rustdag', afstand:0, doel:'Voorbereiding halve marathon'}]
];

// Helper om datumstring te maken
function formatDate(date) {
  return date.toISOString().slice(0,10);
}

// Krijg array met alle data vanaf vandaag t/m 12 weken (84 dagen)
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

// Check of dag een werkdag is (geen training op werkdag)
function isWerkdag(datum) {
  return rooster.some(w => w.datum === datum);
}

// Check of training voltooid is (in logs)
function isVoltooid(datum, type) {
  return logs.some(log => log.datum === datum && log.type === type);
}

// Check of training overgeslagen is (in logs)
function isOvergeslagen(datum, type) {
  return logs.some(log => log.datum === datum && log.type === type && log.overgeslagen === true);
}

// Combineer status check
function getStatus(datum, type) {
  if(isVoltooid(datum, type)) return 'voltooid';
  if(isOvergeslagen(datum, type)) return 'overgeslagen';
  return 'open';
}

// Genereer adaptief schema met rustdagenlogica
function genereerSchema() {
  const dagen = getPlanningData();
  const trainingsdagen = [];

  let weekIndex = 0;
  let trainingIndex = 0;
  let vorigeAfstand = 0;
  let korteTrainingRij = 0;

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

    // Op werkdag geen lange duurloop ≥ 15km
    if(isWerkdag(datum) && training.type === 'Duurloop' && training.afstand >= 15) {
      trainingIndex++;
      if(trainingIndex >= week.length) {
        trainingIndex = 0;
        weekIndex++;
      }
      continue;
    }

    // Rustdag logica
    let rustDag = false;
    if(vorigeAfstand > 8 || korteTrainingRij >= 2) {
      rustDag = true;
      korteTrainingRij = 0;
      vorigeAfstand = 0;
    }

    if(rustDag) {
      trainingsdagen.push({
        type: 'Rustdag',
        afstand: 0,
        doel: 'Even herstellen',
        datum
      });
      continue; // plan geen training deze dag
    }

    // Plan training
    trainingsdagen.push({...training, datum});

    // Update logica voor rustdagen
    if(training.afstand < 8) {
      korteTrainingRij++;
    } else {
      korteTrainingRij = 0;
    }
    vorigeAfstand = training.afstand;

    trainingIndex++;
    if(trainingIndex >= week.length) {
      trainingIndex = 0;
      weekIndex++;
    }
  }
  return trainingsdagen;
}

// Render schema in de pagina
function renderTrainingsschema(nieuwSchema = false) {
  if(nieuwSchema) {
    // Optioneel: reset logs als je een volledig nieuw schema wilt
    // logs = [];
    // localStorage.setItem(STORAGE_LOGS, JSON.stringify(logs));
  }

  const trainingsschemaEl = document.getElementById('trainingsschema');
  trainingsschemaEl.innerHTML = '';

  const schema = genereerSchema();

  if(schema.length === 0) {
    trainingsschemaEl.innerHTML = '<li>Geen geplande trainingen (allemaal voltooid?)</li>';
    return;
  }

  schema.forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${t.datum}: ${t.type}</strong> - ${t.afstand ? t.afstand + ' km' : ''} (${t.doel})`;

    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'buttons';

    const btnVoltooid = document.createElement('button');
    btnVoltooid.textContent = isVoltooid(t.datum, t.type) ? '✓ Voltooid' : 'Markeer als voltooid';
    btnVoltooid.disabled = isVoltooid(t.datum, t.type);
    btnVoltooid.className = 'voltooid';
    btnVoltooid.addEventListener('click', () => {
      logs.push({
        datum: t.datum,
        type: t.type,
        afstand: t.afstand,
        doel: t.doel,
        voltooidOp: new Date().toISOString()
      });
      localStorage.setItem(STORAGE_LOGS, JSON.stringify(logs));
      renderTrainingsschema();
    });

    const btnSkip = document.createElement('button');
    btnSkip.textContent = isOvergeslagen(t.datum, t.type) ? '✓ Overgeslagen' : 'Sla over';
    btnSkip.disabled = isOvergeslagen(t.datum, t.type);
    btnSkip.className = 'overslaan';
    btnSkip.addEventListener('click', () => {
      logs.push({
        datum: t.datum,
        type: t.type,
        afstand: t.afstand,
        doel: t.doel,
        overgeslagen: true,
        gemarkeerdOp: new Date().toISOString()
      });
      localStorage.setItem(STORAGE_LOGS, JSON.stringify(logs));
      renderTrainingsschema();
    });

    buttonsDiv.appendChild(btnVoltooid);
    if(t.type !== 'Halve Marathon' && t.type !== 'Rustdag') buttonsDiv.appendChild(btnSkip);

    li.appendChild(buttonsDiv);
    trainingsschemaEl.appendChild(li);
  });
}

// Init render
renderTrainingsschema();
