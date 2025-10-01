const $ = s => document.querySelector(s);
const dayNames = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const todayName = dayNames[new Date().getDay()];

let DB = { missions:{}, cards:{}, questions:{} };
let state = {
  day: todayName,
  xp: parseInt(localStorage.getItem('xp')||'0',10),
  streak: parseInt(localStorage.getItem('streak')||'0',10),
  lastISO: localStorage.getItem('lastISO')||'',
  quizSel: {}, qIndex:0, reflex:{round:0,hits:0,done:false}, cardsDone: JSON.parse(localStorage.getItem('cardsDone')||'{}')
};

fetch('./data.json').then(r=>r.json()).then(data=>{
  DB = data;
  updateStreak();
  renderHUD();
  renderMission();
  renderQuiz();
  renderCards();
  startReflex();
});

function updateStreak(){
  const today = new Date(); const last = state.lastISO ? new Date(state.lastISO) : null;
  if(!last){ state.streak = 1; }
  else {
    const d0 = Date.UTC(last.getFullYear(),last.getMonth(),last.getDate());
    const d1 = Date.UTC(today.getFullYear(),today.getMonth(),today.getDate());
    const diff = Math.round((d1-d0)/86400000);
    if(diff === 1) state.streak += 1;
    else if(diff > 1) state.streak = 1;
  }
  state.lastISO = new Date().toISOString();
  persist();
}

function persist(){
  localStorage.setItem('xp', String(state.xp));
  localStorage.setItem('streak', String(state.streak));
  localStorage.setItem('lastISO', state.lastISO);
  localStorage.setItem('cardsDone', JSON.stringify(state.cardsDone));
}

function go(view){ document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden')); $('#'+view).classList.remove('hidden'); if(view==='quiz') renderQuiz(); if(view==='cards') renderCards(); if(view==='reflex') startReflex(); }

function renderHUD(){
  $('#hud').innerHTML = `
    <div><span class="badge">Jour</span> ${cap(state.day)} &nbsp; <span class="badge">XP</span> ${state.xp} &nbsp; <span class="badge">🔥 Streak</span> ${state.streak}</div>
  `;
}

function renderMission(){ $('#mission').textContent = DB.missions[state.day] || 'Bonne séance !'; }

function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

// ---------- QUIZ ----------
function questionsToday(){ return DB.questions[state.day] || []; }

function renderQuiz(){
  const qs = questionsToday();
  if(!qs.length){ $('#qbox').innerHTML = '<div class="card">Aucune question aujourd’hui.</div>'; return; }
  const q = qs[state.qIndex];
  const sel = state.quizSel[q.text]?.t;
  $('#qbox').innerHTML = `
    <div class="card">
      <div class="badge">${cap(state.day)} • Q${state.qIndex+1}/${qs.length}</div>
      <h3>${q.text}</h3>
      ${q.options.map(o => `
        <div class="option ${sel===o.t?'selected':''}" onclick="pick('${q.text}', '${o.t.replace(/'/g,"\\'")}', ${o.ok})">
          ${o.t}
        </div>`).join('')}
    </div>
  `;
  $('#prevBtn').disabled = state.qIndex===0;
  $('#nextBtn').style.display = state.qIndex<qs.length-1 ? 'inline-block' : 'none';
  $('#doneBtn').style.display = state.qIndex===qs.length-1 ? 'inline-block' : 'none';
}

function pick(qText, optText, ok){
  state.quizSel[qText] = { t: optText, ok: !!ok };
  renderQuiz();
}

function prevQ(){ if(state.qIndex>0){ state.qIndex--; renderQuiz(); } }
function nextQ(){ const qs = questionsToday(); if(state.qIndex<qs.length-1){ state.qIndex++; renderQuiz(); } }

function finishQuiz(){
  const qs = questionsToday(); let good = 0;
  qs.forEach(q => { if(state.quizSel[q.text]?.ok) good++; });
  const gain = good*50; state.xp += gain; persist();
  alert(`Bonnes réponses: ${good}/${qs.length}  •  +${gain} XP`);
  state.qIndex = 0; state.quizSel = {}; renderHUD(); renderQuiz();
}

// ---------- CARTES ----------
function renderCards(){
  const list = DB.cards[state.day] || [];
  const key = state.day;
  if(!state.cardsDone[key]) state.cardsDone[key] = {};
  $('#cardsList').innerHTML = list.map((c, i) => {
    const done = !!state.cardsDone[key][i];
    return `
      <div class="card">
        <div class="badge">${cap(state.day)}</div>
        <h3>${c.title}</h3>
        <p>${c.mission}</p>
        <button ${done?'disabled':''} onclick="markCard('${key}', ${i})">${done?'✅ Fait (+100 XP)':'Marquer fait'}</button>
      </div>
    `;
  }).join('');
}

function markCard(day, idx){
  if(!state.cardsDone[day]) state.cardsDone[day] = {};
  if(!state.cardsDone[day][idx]){
    state.cardsDone[day][idx] = true;
    state.xp += 100; persist();
    renderHUD(); renderCards();
  }
}

// ---------- RÉFLEXES ----------
const symbols = ["🏒","🥅","👤"];
function startReflex(){
  state.reflex = { round:1, hits:0, done:false };
  drawReflex();
}

function drawReflex(){
  const target = symbols[Math.floor(Math.random()*symbols.length)];
  $('#reflexInfo').textContent = `Tour ${state.reflex.round}/5 • Touche : ${target}`;
  const cells = Array.from({length:6},()=>symbols[Math.floor(Math.random()*symbols.length)]).sort(()=>Math.random()-0.5);
  $('#grid').innerHTML = cells.map(s => `<div class="tile" onclick="tapTile('${s}','${target}')">${s}</div>`).join('');
}

function tapTile(s, target){
  if(state.reflex.done) return;
  if(s===target) state.reflex.hits++;
  nextReflex();
}
function nextReflex(){
  if(state.reflex.round>=5){ state.reflex.done = true; $('#reflexInfo').textContent += `  •  Score: ${state.reflex.hits}/5`; }
  else { state.reflex.round++; drawReflex(); }
}
function validateReflex(){
  if(!state.reflex.done){ alert('Termine les 5 tours.'); return; }
  if(state.reflex.hits>=3){
    state.xp += 100; persist(); renderHUD();
    alert('Bravo ! +100 XP');
  } else {
    alert('Essaie encore : objectif ≥3.');
  }
}
