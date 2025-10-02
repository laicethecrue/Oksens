// --- État de l'application ---
const state = {
  page: "menu",
  day: "",
  points: 0,                 // total de points de la session en cours
  answered: {}               // clés des questions déjà répondues (pour éviter le double comptage)
};

// --- Base de données (chargée depuis data.json) ---
const DB = { questions: {} };

// --- Charger les questions depuis data.json ---
async function loadQuestions() {
  try {
    const res = await fetch("./data.json");
    const data = await res.json();
    DB.questions = data.questions || {};
    render();
  } catch (e) {
    console.error("Erreur de chargement du data.json :", e);
    const root = document.getElementById("app");
    if (root) root.innerHTML = `<p style="color:#f88">Erreur de chargement des questions.</p>`;
  }
}

// --- Utilitaires ---
function questionsToday() {
  return DB.questions[state.day] || [];
}

function allQuestions() {
  let all = [];
  for (let day in DB.questions) {
    if (Object.prototype.hasOwnProperty.call(DB.questions, day)) {
      all = all.concat(DB.questions[day]);
    }
  }
  return all;
}

// score par question : si le champ "p" n'existe pas dans data.json → 10 par défaut
function pointsFor(q) {
  const p = Number(q.p);
  return Number.isFinite(p) && p > 0 ? p : 10;
}

// badge de récompense en fonction des points
function rewardBadge(pts) {
  if (pts >= 60) return `🏆 Or`;
  if (pts >= 30) return `🥈 Argent`;
  return `🥉 Bronze`;
}

// clé unique pour mémoriser qu'une question a déjà été répondue
function qKey(q) {
  // on s'appuie sur l'énoncé + premiers choix pour créer une clé simple
  return `${q.q}::${(q.c||[]).slice(0,2).join("|")}`;
}

function resetSession() {
  state.points = 0;
  state.answered = {};
  render();
}

function go(p) {
  state.page = p;
  render();
}

// gestion d'une réponse
function answerQuestion(q, choiceIndex, scope) {
  const key = qKey(q);
  const already = !!state.answered[key];

  const isCorrect = choiceIndex === q.a;
  if (isCorrect && !already) {
    state.points += pointsFor(q);
  }
  // on marque la question comme répondue (et on retient si c'était correct)
  state.answered[key] = { correct: isCorrect };

  // on ré-affiche la vue en cours (quiz du jour ou toutes les questions)
  render();
  // petit feedback
  alert(isCorrect ? `✅ Bonne réponse ! +${pointsFor(q)} pts` : "❌ Mauvaise réponse…");
}

// --- Vues ---
const V = {};

V.menu = () => `
  <h2>Menu principal</h2>
  <div class="card">
    <b>Points session :</b> ${state.points} &nbsp; • &nbsp; <b>Récompense :</b> ${rewardBadge(state.points)}
    <div style="margin-top:8px;">
      <button class="small" onclick="resetSession()">Remettre la session à zéro</button>
    </div>
  </div>
  <p>Choisis ton mode :</p>
  <button onclick="selectDay()">📅 Quiz du jour</button>
  <button onclick="go('quizAll')">📚 Toutes les questions</button>
`;

function selectDay() {
  const jours = ["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"];
  const choix = prompt("Choisis un jour : lundi, mardi, mercredi, jeudi, vendredi, samedi ou dimanche");
  if (choix && jours.includes(choix.trim().toLowerCase())) {
    state.day = choix.trim().toLowerCase();
    go("quiz");
  } else {
    alert("Jour invalide. Essaie: lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche.");
  }
}

// Cartouche de points en haut de chaque vue
function scoreHeader() {
  return `
    <div class="card">
      <span><b>Points :</b> ${state.points}</span>
      <span style="float:right;"><b>Récompense :</b> ${rewardBadge(state.points)}</span>
    </div>
  `;
}

function renderQuestionCard(q, idx, scope) {
  const key = qKey(q);
  const wasAnswered = !!state.answered[key];
  const wasCorrect = wasAnswered ? !!state.answered[key].correct : null;
  const pts = pointsFor(q);

  return `
    <div class="card">
      <div class="badge">Question ${idx+1} • ${pts} pts</div>
      <p><b>${q.q}</b></p>
      ${q.c.map((c, j) => {
        const disabled = wasAnswered ? "disabled" : "";
        return `<button ${disabled} onclick="answerQuestion(window.__Q${idx}, ${j}, '${scope}')">${c}</button>`;
      }).join("")}
      ${wasAnswered ? `<p style="margin-top:8px;">${wasCorrect ? "✅ Bien joué !" : "❌ Essaie la prochaine"}</p>` : ""}
    </div>
    <script>window.__Q${idx} = ${JSON.stringify(q)};</script>
  `;
}

V.quiz = () => {
  const qs = questionsToday();
  if (!qs.length) {
    return `
      ${scoreHeader()}
      <p>⚠️ Aucune question pour <b>${state.day || "?"}</b>.</p>
      <button class="back" onclick="go('menu')">⬅️ Retour</button>`;
  }
  let html = `${scoreHeader()}<h2>📅 Quiz du jour (${state.day})</h2>`;
  qs.forEach((q, i) => html += renderQuestionCard(q, i, "day"));
  html += `<button class="back" onclick="go('menu')">⬅️ Retour</button>`;
  return html;
};

V.quizAll = () => {
  const qs = allQuestions();
  if (!qs.length) {
    return `
      ${scoreHeader()}
      <p>⚠️ Aucune question trouvée dans la base.</p>
      <button class="back" onclick="go('menu')">⬅️ Retour</button>`;
  }
  let html = `${scoreHeader()}<h2>📚 Toutes les questions (${qs.length})</h2>`;
  qs.forEach((q, i) => html += renderQuestionCard(q, i, "all"));
  html += `<button class="back" onclick="go('menu')">⬅️ Retour</button>`;
  return html;
};

// --- Rendu ---
function render() {
  const root = document.getElementById("app");
  root.innerHTML = V[state.page] ? V[state.page]() : "<p>Chargement…</p>";
}

// --- Init ---
loadQuestions();
render();
