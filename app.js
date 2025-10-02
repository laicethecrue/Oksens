// --- État de l'application ---
const state = { page: "menu", day: "" };

// --- Base de données des questions (remplacée par data.json dans ton repo) ---
const DB = {
  questions: {
    lundi: [],
    mardi: [],
    mercredi: [],
    jeudi: [],
    vendredi: [],
    samedi: [],
    dimanche: []
  }
};

// --- Fonctions utilitaires ---
function questionsToday() {
  return DB.questions[state.day] || [];
}

function allQuestions() {
  let all = [];
  for (let day in DB.questions) {
    if (DB.questions.hasOwnProperty(day)) {
      all = all.concat(DB.questions[day]);
    }
  }
  return all;
}

function go(p) {
  state.page = p;
  render();
}

// --- Vues ---
const V = {};

V.menu = () => `
  <h2>Menu</h2>
  <p>Choisis ton mode :</p>
  <button onclick="state.day='lundi';go('quiz')">📅 Quiz du jour</button><br><br>
  <button onclick="go('quizAll')">📚 Toutes les questions</button>
`;

V.quiz = () => {
  let qs = questionsToday();
  if (!qs.length)
    return `<p>⚠️ Aucune question pour aujourd'hui.</p><button onclick="go('menu')">⬅️ Retour</button>`;
  
  let html = `<h2>📅 Quiz du jour (${state.day})</h2>`;
  qs.forEach((q, i) => {
    html += `<div class="card">
      <p><b>Q${i + 1}:</b> ${q.q}</p>
      ${q.c
        .map(
          (c, j) =>
            `<button onclick="alert('${j == q.a ? "✅ Bonne réponse!" : "❌ Mauvaise réponse…"}')">${c}</button>`
        )
        .join("<br>")}
    </div>`;
  });
  return html + `<br><button onclick="go('menu')">⬅️ Retour</button>`;
};

V.quizAll = () => {
  let qs = allQuestions();
  if (!qs.length)
    return `<p>⚠️ Aucune question trouvée dans la base.</p><button onclick="go('menu')">⬅️ Retour</button>`;
  
  let html = `<h2>📚 Toutes les questions</h2>`;
  qs.forEach((q, i) => {
    html += `<div class="card">
      <p><b>Q${i + 1}:</b> ${q.q}</p>
      ${q.c
        .map(
          (c, j) =>
            `<button onclick="alert('${j == q.a ? "✅ Bonne réponse!" : "❌ Mauvaise réponse…"}')">${c}</button>`
        )
        .join("<br>")}
    </div>`;
  });
  return html + `<br><button onclick="go('menu')">⬅️ Retour</button>`;
};

// --- Fonction de rendu ---
function render() {
  document.getElementById("app").innerHTML = V[state.page]();
}

// --- Initialisation ---
render();
