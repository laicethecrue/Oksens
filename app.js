// --- État global ---
const state = {
  page: "menu",
  day: "",
  points: 0,
  // answered[qKey] = { correct: bool, tries: [indices déjà tentés] }
  answered: {}
};

// --- Base de données ---
const DB = { questions: {} };

// --- Liste courante affichée (pour lier les boutons aux questions) ---
let CURRENT_QS = [];

// --- Charger data.json ---
async function loadQuestions() {
  try {
    const res = await fetch("./data.json");
    const data = await res.json();
    DB.questions = data.questions || {};
    render();
  } catch (e) {
    console.error("Erreur de chargement :", e);
    document.getElementById("app").innerHTML =
      "<p style='color:#f88'>Erreur de chargement.</p>";
  }
}

// --- Utilitaires ---
function questionsToday(){ return DB.questions[state.day] || []; }
function allQuestions(){
  let all = [];
  for (let d in DB.questions) if (Array.isArray(DB.questions[d])) all = all.concat(DB.questions[d]);
  return all;
}
function pointsFor(q){ return Number.isFinite(q.p) ? q.p : 10; }
function rewardBadge(pts){ return pts>=60 ? "🏆 Or" : pts>=30 ? "🥈 Argent" : "🥉 Bronze"; }
function qKey(q){ return q.q; }
function ensureRecord(q){
  const k = qKey(q);
  if (!state.answered[k]) state.answered[k] = { correct:false, tries:[] };
  return state.answered[k];
}
function resetSession(){ state.points=0; state.answered={}; render(); }
function go(p){ state.page=p; render(); }

// --- Gestion réponse (boutons restent actifs) ---
function answerQuestion(q, choice){
  const rec = ensureRecord(q);
  if (choice === q.a){
    const firstTry = rec.tries.length === 0;
    if (!rec.correct){
      rec.correct = true;
      if (firstTry){ state.points += pointsFor(q); alert(`✅ Bonne réponse ! +${pointsFor(q)} pts`); }
      else { alert("✅ Bonne réponse (0 pt car pas du 1er coup)"); }
    } else {
      alert("⭐ Déjà validée !");
    }
  } else {
    if (!rec.tries.includes(choice)) rec.tries.push(choice);
    alert("❌ Mauvaise réponse… essaie encore");
  }
  render();
}

// --- Vues ---
const V = {};

V.menu = () => `
  <h2>Menu principal</h2>
  <div class="card">
    <b>Points :</b> ${state.points} • <b>Récompense :</b> ${rewardBadge(state.points)}
    <div><button class="small" data-action="reset">🔄 Réinitialiser</button></div>
  </div>
  <button data-action="day">📅 Quiz du jour</button>
  <button data-action="all">📚 Toutes les questions</button>
`;

function selectDay(){
  const jours=["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche","avantpasse"];
  const choix = prompt("Choisis un jour : lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche, avantpasse");
  if (choix && jours.includes(choix.toLowerCase())){ state.day = choix.toLowerCase(); go("quiz"); }
  else alert("Jour invalide");
}

function scoreHeader(){
  return `<div class="card"><b>Points :</b> ${state.points} • <b>Récompense :</b> ${rewardBadge(state.points)}</div>`;
}

function renderQuestion(q,i){
  const rec = ensureRecord(q);
  const buttons = q.c.map((c,j)=>{
    // classes visuelles persistantes
    let cls = "";
    if (rec.correct && j===q.a) cls = "correct";
    else if (rec.tries.includes(j)) cls = "wrong";
    return `<button class="ans ${cls}" data-i="${i}" data-j="${j}">${c}</button>`;
  }).join("");
  return `
    <div class="card">
      <div class="badge">Q${i+1} • ${pointsFor(q)} pts ${rec.correct?"⭐":""}</div>
      <p><b>${q.q}</b></p>
      ${buttons}
    </div>
  `;
}

V.quiz = () => {
  const qs = questionsToday();
  CURRENT_QS = qs; // <-- lie les boutons à ces questions
  if (!qs.length) return scoreHeader()+`<p>Aucune question pour <b>${state.day||"?"}</b>.</p><button data-action="back">⬅ Retour</button>`;
  let h = scoreHeader()+`<h2>📅 Quiz du jour (${state.day})</h2>`;
  qs.forEach((q,i)=> h += renderQuestion(q,i));
  return h+`<button data-action="back">⬅ Retour</button>`;
};

V.quizAll = () => {
  const qs = allQuestions();
  CURRENT_QS = qs; // <-- lie les boutons à ces questions
  if (!qs.length) return scoreHeader()+`<p>Aucune question trouvée.</p><button data-action="back">⬅ Retour</button>`;
  let h = scoreHeader()+`<h2>📚 Toutes les questions (${qs.length})</h2>`;
  qs.forEach((q,i)=> h += renderQuestion(q,i));
  return h+`<button data-action="back">⬅ Retour</button>`;
};

// --- Rendu ---
function render(){
  const root = document.getElementById("app");
  root.innerHTML = V[state.page] ? V[state.page]() : "<p>Chargement…</p>";
}

// --- Délégation de clic (ACTIVE LES BOUTONS PARTOUT) ---
document.addEventListener("click", (e)=>{
  const t = e.target.closest("button");
  if (!t) return;

  // Boutons d'action généraux
  const act = t.getAttribute("data-action");
  if (act === "reset") { resetSession(); return; }
  if (act === "day") { selectDay(); return; }
  if (act === "all") { go("quizAll"); return; }
  if (act === "back") { go("menu"); return; }

  // Boutons de réponse
  if (t.classList.contains("ans")){
    const i = Number(t.getAttribute("data-i"));
    const j = Number(t.getAttribute("data-j"));
    const q = CURRENT_QS[i];
    if (q) answerQuestion(q, j);
  }
});

// --- Init ---
loadQuestions();
render();
