// --- État de l'application ---
const state = {
  page: "menu",
  day: "",
  points: 0,
  // answered[key] = { attempts: number, correct: bool, tried: Set(indices) }
  answered: {}
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
// points par question (par défaut 10 si "p" absent)
function pointsFor(q) {
  const p = Number(q.p);
  return Number.isFinite(p) && p > 0 ? p : 10;
}
// badge récompense
function rewardBadge(pts) {
  if (pts >= 60) return `🏆 Or`;
  if (pts >= 30) return `🥈 Argent`;
  return `🥉 Bronze`;
}
// clé unique question
function qKey(q) {
  return `${q.q}::${(q.c || []).slice(0, 2).join("|")}`;
}
function ensureRecord(key) {
  if (!state.answered[key]) state.answered[key] = { attempts: 0, correct: false, tried: {} };
  return state.answered[key];
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

// --- Gestion de réponse (boutons non figés) ---
function answerQuestion(q, choiceIndex) {
  const key = qKey(q);
  const rec = ensureRecord(key);

  // si déjà validée, on autorise le clic (pour réviser) mais sans points
  if (rec.correct) {
    alert("⭐ Déjà validée ! (pas de points supplémentaires)");
    return;
  }

  // 1 tentative de plus
  rec.attempts = (rec.attempts || 0) + 1;
  rec.tried[choiceIndex] = true;

  const isCorrect = choiceIndex === q.a;

  if (isCorrect) {
    // points uniquement si la 1re tentative est correcte
    if (rec.attempts === 1) {
      state.points += pointsFor(q);
      alert(`✅ Bonne réponse du premier coup ! +${pointsFor(q)} pts`);
    } else {
      alert("✅ Bonne réponse ! (0 pt car ce n'était pas la première tentative)");
    }
    rec.correct = true;
  } else {
    alert("❌ Mauvaise réponse… Essaie encore !");
  }

  render();
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

// Cartouche points/insigne
function scoreHeader() {
  return `
    <div class="card">
      <span><b>Points :</b> ${state.points}</span>
      <span style="float:right;"><b>Récompense :</b> ${rewardBadge(state.points)}</span>
    </div>
  `;
}

// rendu d'une carte question (boutons toujours actifs)
function renderQuestionCard(q, idx) {
  const key = qKey(q);
  const rec = state.answered[key] || { attempts: 0, correct: false, tried: {} };
  const tried = rec.tried || {};
  const pts = pointsFor(q);

  return `
    <div class="card">
      <div class="badge">Question ${idx + 1} • ${pts} pts ${rec.correct ? " • ⭐ Validée" : ""}</div>
      <p><b>${q.q}</b></p>
      ${q.c.map((c, j) => {
        const isTried = tried[j];
        // style léger pour feedback : vert si bonne, gris si essayé
        const isAnswer = j === q.a;
        const style =
          rec.correct && isAnswer ? 'style="border:1px solid #43d17e;"' :
          isTried ? 'style="opacity:.9;border:1px dashed #667;"' : "";
        return `<button ${style} onclick="answerQuestion(window.__Q${idx}, ${j})">${c}</button>`;
      }).join("")}
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
  qs.forEach((q, i) => html += renderQuestionCard(q, i));
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
  qs.forEach((q, i) => html += renderQuestionCard(q, i));
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
