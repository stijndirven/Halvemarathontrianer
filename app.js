// Simple in-browser logic for prototype scheduling and adaptive updates.
// Data is stored in localStorage as JSON under keys: settings, availability, plan, logs.

function qs(sel){return document.querySelector(sel)}
function qsa(sel){return Array.from(document.querySelectorAll(sel))}

function parseTimeMinSec(s){
  if(!s) return null;
  const parts = s.split(':').map(p=>parseInt(p,10));
  if(parts.length===2) return parts[0]*60+parts[1];
  return null;
}
function fmtMinSec(sec){
  if(sec==null) return '';
  const m = Math.floor(sec/60), s = Math.round(sec%60);
  return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}

function load(){ return JSON.parse(localStorage.getItem('hm_data')||'{}') }
function save(data){ localStorage.setItem('hm_data', JSON.stringify(data)) }

function init(){
  const data = load();
  if(data.settings){
    qs('#t5').value = data.settings.t5 || '';
    qs('#t10').value = data.settings.t10 || '';
    qs('#goal').value = data.settings.goal || '';
  }
  if(data.availability){
    qsa('#days input[type=checkbox]').forEach(cb=>{
      cb.checked = data.availability.includes(parseInt(cb.dataset.day));
    });
  }
  renderPlan();
  renderLogs();
}

qs('#saveSettings').onclick = ()=>{
  const data = load();
  data.settings = { t5: qs('#t5').value, t10: qs('#t10').value, goal: qs('#goal').value };
  save(data);
  alert('Instellingen opgeslagen');
}

qs('#saveAvail').onclick = ()=>{
  const chosen = qsa('#days input[type=checkbox]').filter(cb=>cb.checked).map(cb=>parseInt(cb.dataset.day));
  const data = load();
  data.availability = chosen;
  save(data);
  alert('Beschikbaarheid opgeslagen');
}

function genPlanWeeks(weeks=12){
  const data = load();
  const avail = data.availability && data.availability.length>0 ? data.availability : [1,3,5]; // default Tue,Thu,Sat
  // base paces: infer from 5k/10k if provided, else use defaults
  // target half pace from goal if given
  let targetPace = null; // seconds per km
  if(data.settings && data.settings.goal){
    const g = data.settings.goal.split(':').map(x=>parseInt(x,10));
    if(g.length===2){
      const totalSec = g[0]*3600 + g[1]*60;
      targetPace = totalSec / 21.1;
    }
  }
  // create simple week blocks
  const plan = [];
  let weekTotalKm = 20; // conservative starting week
  for(let w=1; w<=weeks; w++){
    // cap progression ~+7% per week
    if(w>1) weekTotalKm = Math.round((weekTotalKm * 1.07) * 100)/100;
    // three workouts: interval (~20% of week), easy (~25%), long (~55%)
    const longKm = Math.max(8, Math.round(weekTotalKm * 0.55 * 100)/100);
    const intervalKm = Math.max(3, Math.round(weekTotalKm * 0.20 * 100)/100);
    const easyKm = Math.max(3, Math.round(weekTotalKm * 0.25 * 100)/100);
    // assign to days based on availability in rotating order
    const weekDays = [];
    for(let i=0;i<3;i++){
      weekDays.push(avail[(w-1+i) % avail.length]);
    }
    plan.push({week:w, longKm, intervalKm, easyKm, days: weekDays});
  }
  data.plan = plan;
  save(data);
  renderPlan();
  alert('Plan gegenereerd ('+weeks+' weken)');
}

qs('#genPlan').onclick = ()=>genPlanWeeks(12);

function renderPlan(){
  const data = load();
  const container = qs('#planList');
  container.innerHTML = '';
  if(!data.plan){ container.innerHTML = '<div class="small">Nog geen plan. Genereer eerst een plan.</div>'; return; }
  data.plan.forEach(p=>{
    const div = document.createElement('div'); div.className='planItem';
    div.innerHTML = '<strong>Week '+p.week+'</strong> — Interval: '+p.intervalKm+' km, Rustig: '+p.easyKm+' km, Lang: '+p.longKm+' km<br class="small">Dagen: '+p.days.map(d=>['Ma','Di','Wo','Do','Vr','Za','Zo'][d]).join(', ');
    container.appendChild(div);
  });
}

qs('#saveLog').onclick = ()=>{
  const date = qs('#logDate').value;
  const type = qs('#logType').value;
  const dist = parseFloat(qs('#logDist').value);
  const timeS = parseTimeMinSec(qs('#logTime').value);
  if(!date || !dist || !timeS){ alert('Vul datum, afstand en tijd in'); return; }
  const data = load();
  data.logs = data.logs || [];
  data.logs.push({date,type,dist,timeS});
  // adaptive rule: find next planned session of same type and adjust distance by +/-5% depending on pace vs target
  adjustPlanAfterLog(data, {date,type,dist,timeS});
  save(data);
  renderLogs();
  renderPlan();
  alert('Training opgeslagen en plan aangepast');
}

function renderLogs(){
  const data = load();
  const c = qs('#logList'); c.innerHTML = '';
  if(!data.logs || data.logs.length===0){ c.innerHTML='<div class="small">Nog geen logs.</div>'; return; }
  data.logs.slice().reverse().forEach(l=>{
    const div = document.createElement('div'); div.className='planItem';
    div.textContent = l.date+' — '+l.type+' — '+l.dist+' km — '+fmtMinSec(l.timeS);
    c.appendChild(div);
  });
}

function adjustPlanAfterLog(data, log){
  if(!data.plan) return;
  // estimate a "target pace" per workout type (simplified)
  // if user has goal pace, use that as baseline; else use fixed defaults
  let targetPace = 300; // default 5:00/km
  if(data.settings && data.settings.goal){
    const g = data.settings.goal.split(':').map(x=>parseInt(x,10));
    if(g.length===2){ targetPace = (g[0]*3600 + g[1]*60)/21.1; }
  }
  const actualPace = log.timeS / log.dist; // sec/km
  const ratio = actualPace / targetPace;
  // find first upcoming session of same type (simple approach: next week same type)
  for(let i=0;i<data.plan.length;i++){
    const p = data.plan[i];
    // check types mapped to fields
    if(log.type==='interval'){
      // adjust intervalKm by ±5% depending on performance, but keep within injury-safe limits
      if(ratio <= 1.05){ p.intervalKm = Math.round(p.intervalKm * 1.05 * 100)/100; }
      else if(ratio > 1.2){ p.intervalKm = Math.max(3, Math.round(p.intervalKm * 0.95 * 100)/100); }
    } else if(log.type==='long'){
      if(ratio <= 1.08){ p.longKm = Math.round(p.longKm * 1.05 * 100)/100; }
      else if(ratio > 1.2){ p.longKm = Math.max(8, Math.round(p.longKm * 0.95 * 100)/100); }
    } else if(log.type==='easy'){
      if(ratio <= 1.1){ p.easyKm = Math.round(p.easyKm * 1.03 * 100)/100; }
      else if(ratio > 1.2){ p.easyKm = Math.max(3, Math.round(p.easyKm * 0.95 * 100)/100); }
    }
    // ensure weekly total doesn't jump >10% compared to previous week
    if(i>0){
      const prevTotal = data.plan[i-1].intervalKm + data.plan[i-1].easyKm + data.plan[i-1].longKm;
      let thisTotal = p.intervalKm + p.easyKm + p.longKm;
      if(thisTotal > prevTotal * 1.10) {
        // scale down proportionally
        const scale = (prevTotal * 1.10) / thisTotal;
        p.intervalKm = Math.round(p.intervalKm * scale * 100)/100;
        p.easyKm = Math.round(p.easyKm * scale * 100)/100;
        p.longKm = Math.round(p.longKm * scale * 100)/100;
      }
    }
    // apply change only to first matching week then break
    break;
  }
}

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('service-worker.js').catch(()=>{});
}

init();
