const STORAGE_ROOSTER = 'hm_rooster_v2';
const STORAGE_LOGS = 'hm_logs_v2';

let rooster = JSON.parse(localStorage.getItem(STORAGE_ROOSTER)) || [];
let logs = JSON.parse(localStorage.getItem(STORAGE_LOGS)) || [];

const basisSchema = [
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

// 🔹 Genereer schema met rustdaglogica
function genereerSchema() {
  const dagen = getPlanningData();
  const trainingsdagen = [];

  let weekIndex = 0;
  let trainingIndex = 0;
  let vorigeAfstand = 0;
  let vorigeWasKort = false; // voor 2x kort achter elkaar

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

    // Sla training over als voltooid/overgeslagen
    if(status !== 'open') {
      trainingIndex++;
      if(trainingIndex >= week.length) {
        trainingIndex = 0;
        weekIndex++;
      }
      continue;
    }

    // Op werkdag geen lange duurloop
    if(isWerkdag(datum) && training.type === 'Duurloop' && training.afstand >= 15) {
      trainingIndex++;
      if(trainingIndex >= week.length) {
        trainingIndex = 0;
        weekIndex++;
      }
      continue;
    }

    // 🔹 Rustdaglogica
    if(vorigeAfstand > 8) {
      // Na lange training >8km rustdag
      trainingsdagen.push({type:'Rustdag', afstand:0, doel:'Herstel', datum});
      vorigeAfstand = 0;
      vorigeWasKort = false;
      continue;
    }
    if(vorigeWasKort && training.afstand < 8) {
      // Na 2x kort achter elkaar rust
      trainingsdagen.push({type:'Rustdag', afstand:0, doel:'Herstel', datum});
      vorigeAfstand = 0;
      vorigeWasKort = false;
      continue;
    }

    // Plan training
    trainingsdagen.push({...training, datum});
    vorigeAfstand = training.afstand;
    vorigeWasKort = training.afstand < 8;

    trainingIndex++;
    if(trainingIndex >= week.length) {
      trainingIndex = 0;
      weekIndex++;
    }
  }
  return trainingsdagen;
}

function renderTrainingsschema() {
  const trainingsschemaEl = document.getElementById('trainingsschema');
  trainingsschemaEl.innerHTML = '';

  const schema = genereerSchema();

  if(schema.length === 0) {
    trainingsschemaEl.innerHTML = '<li>Geen geplande trainingen</li>';
    return;
  }

  schema.forEach(t => {
    const li = document.createElement('li');
    li.textContent = `${t.datum}: ${t.type} - ${t.afstand ? t.afstand + ' km' : ''} (${t.doel})`;

    if(t.type !== 'Rustdag') {
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
      li.appendChild(btnSkip);
    }

    trainingsschemaEl.appendChild(li);
  });
}

// 🔹 Nieuw schema knop functionaliteit
const btnNieuwSchema = document.getElementById('btnNieuwSchema');

function checkNieuwSchemaNodig() {
  const lastRoosterChange = parseInt(localStorage.getItem('hm_rooster_last_changed') || '0', 10);
  const lastSchemaGen = parseInt(localStorage.getItem('hm_schema_last_generated') || '0', 10);

  if (lastRoosterChange > lastSchemaGen) {
    btnNieuwSchema.style.display = 'block';
  } else {
    btnNieuwSchema.style.display = 'none';
  }
}

function nieuwSchemaGenereren() {
  renderTrainingsschema();
  localStorage.setItem('hm_schema_last_generated', Date.now());
  checkNieuwSchemaNodig();
}

btnNieuwSchema.addEventListener('click', nieuwSchemaGenereren);

document.addEventListener('DOMContentLoaded', () => {
  renderTrainingsschema();
  checkNieuwSchemaNodig();
});
