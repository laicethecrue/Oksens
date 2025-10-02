// --- État de l'application ---
const state = {
  page: "menu",
  day: "",
  points: 0,
  answered: {} // suivi par clé de question
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
    console.error("Erreur de chargement du data.json :", e);
  }
}

// --- Utilitaires ---
function questionsToday() {
  return DB.questions[state.day] || [];
}
function allQuestions() {
  let all = [];
  for (let d in DB.questions) if (DB.questions[d]) all = all.concat(DB.questions[d]);
  return all;
}
function pointsFor(q) { return q.p ? q.p : 10; }
function rewardBadge(pts) {
  if (pts >= 60) return "🏆 Or";
  if (pts >= 30) return "🥈 Argent";
  return "🥉 Bronze";
}
function qKey(q) { return q.q; }
function ensureRecord(q) {
  const k = qKey(q);
  if (!state.answered[k]) state.answered[k] = { correct: false, tries: [] };
  return state.answered[k];
}

// --- Réponse ---
function answerQuestion(q, choice) {
  const rec = ensureRecord(q);
  // si déjà correcte → pas de nouveaux points
  if (rec.correct) {
    alert("⭐ Déjà validée !");
    return;
  }
  if (choice === q.a) {
    rec.correct = true;
    // points uniquement si première tentative correcte
    if (rec.tries.length === 0) {
      state.points += pointsFor(q);
      alert(`✅ Bonne réponse ! +${pointsFor(q)} pts`);
    } else {
      alert("✅ Bonne réponse (0 pt car pas du 1er coup)");
    }
  } else {
    if (!rec.tries.includes(choice)) rec.tries.push(choice);
    alert("❌ Mauvaise réponse… Essaie encore");
  }
  render();
}

// --- Vues ---
const V = {};

V.menu = () => `
  <h2>Menu principal</h2>
  <div class="card">
    <b>Points :</b> ${state.points} • <b>Récompense :</b> ${rewardBadge(state.points)}
    <div><button onclick="resetSession()">🔄 Réinitialiser</button></div>
  </div>
  <button onclick="selectDay()">📅 Quiz du jour</button>
  <button onclick="go('quizAll')">📚 Toutes les questions</button>
`;

function resetSession() { state.points=0; state.answered={}; render(); }
function go(p){ state.page=p; render(); }

function selectDay() {
  const jours=["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"];
  const choix=prompt("Choisis un jour :");
  if (choix && jours.includes(choix.toLowerCase())) {
    state.day=choix.toLowerCase(); go("quiz");
  }
}

function renderQuestion(q,i){
  const rec=ensureRecord(q);
  return `
    <div class="card">
      <div class="badge">Q${i+1} • ${pointsFor(q)} pts ${rec.correct?"⭐":""}</div>
      <p><b>${q.q}</b></p>
      ${q.c.map((c,j)=>{
        let style="";
        if (rec.correct && j===q.a) style="style='border:2px solid #4caf50;background:#eaffea;'";
        else if (rec.tries.includes(j)) style="style='border:2px solid #f44336;background:#ffecec;'";
        return `<button ${style} onclick="answerQuestion(window.__Q${i},${j})">${c}</button>`;
      }).join("")}
    </div>
    <script>window.__Q${i}=${JSON.stringify(q)};</script>
  `;
}

V.quiz=()=> {
  const qs=questionsToday();
  let html=`<h2>📅 Quiz du jour (${state.day})</h2>`;
  qs.forEach((q,i)=> html+=renderQuestion(q,i));
  return html+`<button onclick="go('menu')">⬅ Retour</button>`;
};

V.quizAll=()=> {
  const qs=allQuestions();
  let html=`<h2>📚 Toutes les questions (${qs.length})</h2>`;
  qs.forEach((q,i)=> html+=renderQuestion(q,i));
  return html+`<button onclick="go('menu')">⬅ Retour</button>`;
};

// --- Rendu ---
function render(){
  document.getElementById("app").innerHTML=V[state.page]?V[state.page]():"<p>Chargement…</p>";
}
loadQuestions();
render();
