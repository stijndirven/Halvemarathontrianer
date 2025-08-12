// trainingsschema.js

const STORAGE_ROOSTER = 'hm_rooster_v2';
const STORAGE_LOGS = 'hm_logs_v2';

let rooster = JSON.parse(localStorage.getItem(STORAGE_ROOSTER)) || [];
let logs = JSON.parse(localStorage.getItem(STORAGE_LOGS)) || [];

// Basis 12 weken halve marathon schema (voorbeeld)
// Elke week heeft 3 trainingen (bijv. interval, duurloop, herstel)
// Afstanden en intensiteit worden aangepast op basis van voortgang
const basisSchema = [
  // week 1 t/m 12: objecten met type, afstand(km), doel
  [{type:'Interval', afstand:5, doel:'Korte snelle stukken'},
   {type:'Duurloop', afstand:8, doel:'Rustig tempo uithoudingsvermogen'},
   {type:'Herstel', afstand:4, doel:'Lichte rustige loop'}],
  [{type:'Interval', afstand:6, doel:'Korte snelle stukken'},
   {type:'Duurloop', afstand:10, doel:'Rustig tempo uithoudingsvermogen'},
   {type:'Herstel', afstand:5, doel:'Lichte rustige loop'}],
  [{type:'Interval', afstand:6, doel:'Korte snelle stukken'},
   {type:'Duurloop', afstand:12, doel:'Rustig tempo uithoudingsvermogen'},
   {type:'Herstel', afstand:5, doel:'Lichte rustige loop'}],
  [{type:'Interval', afstand:7, doel:'Korte snelle stukken'},
   {type:'Duurloop', afstand:14, doel:'Rustig tempo uithoudingsvermogen'},
   {type:'Herstel', afstand:6, doel:'Lichte rustige loop'}],
  [{type:'Interval', afstand:7, doel:'Korte snelle stukken'},
   {type:'Duurloop', afstand:16, doel:'Rustig tempo uithoudingsvermogen'},
   {type:'Herstel', afstand:6, doel:'Lichte rustige loop'}],
  [{type:'Interval', afstand:8, doel:'Korte snelle stukken'},
   {type:'Duurloop', afstand:18, doel:'Rustig tempo uithoudingsvermogen'},
   {type:'Herstel', afstand:6, doel:'Lichte rustige loop'}],
  [{type:'Interval', afstand:8, doel:'Korte snelle stukken'},
   {type:'Duurloop', afstand:16, doel:'Rustig tempo uithoudingsvermogen'},
   {type:'Herstel', afstand:6, doel:'Lichte rustige loop'}],
  [{type:'Interval', afstand:7, doel:'Korte snelle stukken'},
   {type:'Duurloop', afstand:18, doel:'Rustig tempo uithoudingsvermogen'},
   {type:'Herstel', afstand:6, doel:'Lichte rustige loop'}],
  [{type:'Interval', afstand:7, doel:'Korte snelle stukken'},
   {type:'Duurloop', afstand:20, doel:'Rustig tempo uithoudingsvermogen'},
   {type:'Herstel', afstand:5, doel:'Lichte rustige loop'}],
  [{type:'Interval', afstand:6, doel:'Korte snelle stukken'},
   {type:'Duurloop', afstand:15, doel:'Rustig tempo uithoudingsvermogen'},
   {type:'Herstel', afstand:5, doel:'Lichte rustige loop'}],
  [{type:'Interval', afstand:5, doel:'Korte snelle stukken'},
   {type:'Duurloop', afstand:10, doel:'Rustig tempo uithoudingsvermogen'},
   {type:'Herstel', afstand:4, doel:'Lichte rustige loop'}],
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

// Genereer adaptief schema
function genereerSchema() {
  const dagen = getPlanningData();
  const trainingsdagen = [];

  let weekIndex = 0;
  let trainingIndex = 0;

  for(let i=0; i< dagen.length; i++) {
    const datum = dagen[i];

    // Laatste dag is halve marathon
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

    // Sla training over als voltooid of overgeslagen
    if(status === 'voltooid' || status === 'overgeslagen') {
      trainingIndex++;
      if(trainingIndex >= week.length) {
        trainingIndex = 0;
        weekIndex++;
      }
      continue;
    }

    // Op werkdag geen lange duurloop (Duurloop ≥ 15 km)
    if(isWerkdag(datum) && training.type === 'Duurloop' && training.afstand >= 15) {
      trainingIndex++;
      if(trainingIndex >= week.length) {
        trainingIndex = 0;
        weekIndex++;
      }
      continue;
    }

    // Plan training
    trainingsdagen.push({...training, datum});

    trainingIndex++;
    if(trainingIndex >= week.length) {
      trainingIndex = 0;
      weekIndex++;
    }
  }
  return trainingsdagen;
}

// Render schema in de pagina
function renderTrainingsschema() {
  const trainingsschemaEl = document.getElementById('trainingsschema');
  trainingsschemaEl.innerHTML = '';

  const schema = genereerSchema();

  if(schema.length === 0) {
    trainingsschemaEl.innerHTML = '<li>Geen geplande trainingen (allemaal voltooid?)</li>';
    return;
  }

  schema.forEach(t => {
    const li = document.createElement('li');
    li.textContent = `${t.datum}: ${t.type} - ${t.afstand ? t.afstand + ' km' : ''} (${t.doel})`;

    const btnVoltooid = document.createElement('button');
    btnVoltooid.textContent = isVoltooid(t.datum, t.type) ? '✓ Voltooid' : 'Markeer als voltooid';
    btnVoltooid.disabled = isVoltooid(t.datum, t.type);
    btnVoltooid.style.marginLeft = '1rem';
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
    btnSkip.style.marginLeft = '0.5rem';
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

    li.appendChild(btnVoltooid);

    // Alleen trainingsdagen (dus niet Halve Marathon) krijgen skip knop
    if(t.type !== 'Halve Marathon') {
      li.appendChild(btnSkip);
    }

    trainingsschemaEl.appendChild(li);
  });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  renderTrainingsschema();
});
