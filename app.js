// --- État global ---
const state = {
  page: "menu",
  day: "",
  points: 0,
  answered: {} // suivi par question
};

// --- Base de données ---
const DB = { questions: {} };

// --- Charger data.json ---
async function loadQuestions() {
  try {
    const res = await fetch("./data.json");
    const data = await res.json();
    DB.questions = data.questions || {};
    render();
  } catch (e) {
    console.error("Erreur de chargement :", e);
    document.getElementById("app").innerHTML = "<p style='color:#f88'>Erreur de chargement.</p>";
  }
}

// --- Utilitaires ---
function questionsToday(){ return DB.questions[state.day] || []; }
function allQuestions(){
  let all=[]; for (let d in DB.questions) all=all.concat(DB.questions[d]); return all;
}
function pointsFor(q){ return q.p ? q.p : 10; }
function rewardBadge(pts){
  if (pts>=60) return "🏆 Or";
  if (pts>=30) return "🥈 Argent";
  return "🥉 Bronze";
}
function qKey(q){ return q.q; }
function ensureRecord(q){
  const k=qKey(q);
  if (!state.answered[k]) state.answered[k]={correct:false, tries:[]};
  return state.answered[k];
}
function resetSession(){ state.points=0; state.answered={}; render(); }
function go(p){ state.page=p; render(); }

// --- Gestion réponse ---
function answerQuestion(q, choice){
  const rec=ensureRecord(q);
  if (rec.correct){ alert("⭐ Déjà validée !"); return; }

  if (choice===q.a){
    rec.correct=true;
    if (rec.tries.length===0){
      state.points+=pointsFor(q);
      alert(`✅ Bonne réponse ! +${pointsFor(q)} pts`);
    } else {
      alert("✅ Bonne réponse (0 pt car pas du 1er coup)");
    }
  } else {
    if (!rec.tries.includes(choice)) rec.tries.push(choice);
    alert("❌ Mauvaise réponse… essaie encore");
  }
  render();
}

// --- Vues ---
const V={};

V.menu=()=>`
  <h2>Menu principal</h2>
  <div class="card">
    <b>Points :</b> ${state.points} • <b>Récompense :</b> ${rewardBadge(state.points)}
    <div><button class="small" onclick="resetSession()">🔄 Réinitialiser</button></div>
  </div>
  <button onclick="selectDay()">📅 Quiz du jour</button>
  <button onclick="go('quizAll')">📚 Toutes les questions</button>
`;

function selectDay(){
  const jours=["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"];
  const choix=prompt("Choisis un jour :");
  if (choix && jours.includes(choix.toLowerCase())){ state.day=choix.toLowerCase(); go("quiz"); }
  else alert("Jour invalide");
}

function scoreHeader(){
  return `<div class="card"><b>Points :</b> ${state.points} • <b>Récompense :</b> ${rewardBadge(state.points)}</div>`;
}

function renderQuestion(q,i){
  const rec=ensureRecord(q);
  return `
    <div class="card">
      <div class="badge">Q${i+1} • ${pointsFor(q)} pts ${rec.correct?"⭐":""}</div>
      <p><b>${q.q}</b></p>
      ${q.c.map((c,j)=>{
        const isGood=j===q.a;
        const tried=rec.tries.includes(j);
        let cls="";
        if (rec.correct && isGood) cls="correct";
        else if (tried) cls="wrong";
        return `<button class="${cls}" onclick="answerQuestion(window.__Q${i},${j})">${c}</button>`;
      }).join("")}
    </div>
    <script>window.__Q${i}=${JSON.stringify(q)};</script>
  `;
}

V.quiz=()=>{
  const qs=questionsToday(); if (!qs.length) return scoreHeader()+"<p>Aucune question.</p><button onclick='go(\"menu\")'>⬅ Retour</button>";
  let h=scoreHeader()+"<h2>📅 Quiz du jour ("+state.day+")</h2>";
  qs.forEach((q,i)=>h+=renderQuestion(q,i));
  return h+"<button onclick='go(\"menu\")'>⬅ Retour</button>";
};

V.quizAll=()=>{
  const qs=allQuestions(); if (!qs.length) return scoreHeader()+"<p>Aucune question.</p><button onclick='go(\"menu\")'>⬅ Retour</button>";
  let h=scoreHeader()+"<h2>📚 Toutes les questions ("+qs.length+")</h2>";
  qs.forEach((q,i)=>h+=renderQuestion(q,i));
  return h+"<button onclick='go(\"menu\")'>⬅ Retour</button>";
};

// --- Rendu ---
function render(){ document.getElementById("app").innerHTML=V[state.page]?V[state.page]():"<p>Chargement…</p>"; }

loadQuestions(); render();
