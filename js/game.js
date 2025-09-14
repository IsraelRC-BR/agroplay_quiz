/* game.js - corrigido, contador Pergunta X de Y */

let questionsData = {};
let currentCategory = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let playerName = "";

// Utilitários
function shuffleArray(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Carrega JSON
async function loadQuestionsFromJSON() {
  try {
    const resp = await fetch("perguntas.json");
    if (!resp.ok) throw new Error("Erro ao carregar perguntas.json");
    questionsData = await resp.json();
    populateCategorySelect();
  } catch (err) {
    console.error(err);
    alert("Erro ao carregar perguntas.json");
  }
}

function populateCategorySelect() {
  const select = document.getElementById("tema-select");
  if (!select) return;
  select.innerHTML = "";
  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = "-- escolha um tema --";
  select.appendChild(ph);
  Object.keys(questionsData).forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

// Início do jogo
function startGame() {
  const nameEl = document.getElementById("player-name");
  const select = document.getElementById("tema-select");
  if (!nameEl || !select) return;
  const name = nameEl.value.trim();
  if (!name) { alert("Digite seu nome"); return; }
  const tema = select.value;
  if (!tema) { alert("Selecione uma categoria"); return; }

  playerName = name;
  currentCategory = tema;
  const pool = questionsData[currentCategory] || [];
  if (pool.length === 0) { alert("Sem perguntas nessa categoria"); return; }
  shuffleArray(pool);
  currentQuestions = pool.slice(0, 30);
  currentQuestionIndex = 0;
  score = 0;

  document.getElementById("start-screen").classList.remove("active");
  document.getElementById("ranking-screen").classList.remove("active");
  document.getElementById("question-screen").classList.add("active");

  showQuestion();
}

// Mostrar pergunta atual
function showQuestion() {
  if (currentQuestionIndex >= currentQuestions.length) {
    return endGame();
  }

  const q = currentQuestions[currentQuestionIndex];

  // Atualiza contador no título
  const titleEl = document.getElementById("question-title");
  if (titleEl) {
    titleEl.textContent = `Pergunta ${currentQuestionIndex + 1} de ${currentQuestions.length}`;
  }

  // Enunciado
  const questionEl = document.querySelector("#question-screen .question");
  if (questionEl) {
    questionEl.textContent = q.question || "Pergunta sem texto";
  }

  // Opções
  const optionsContainer = document.querySelector("#question-screen .options");
  if (!optionsContainer) return;
  optionsContainer.innerHTML = "";
  if (Array.isArray(q.options)) {
    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.textContent = opt;
      btn.addEventListener("click", () => checkAnswer(i));
      optionsContainer.appendChild(btn);
    });
  }
}

// Checar resposta
function checkAnswer(i) {
  if (currentQuestions[currentQuestionIndex].answer === i) {
    score++;
  }
  currentQuestionIndex++;
  setTimeout(showQuestion, 100);
}

// Finalizar jogo
function endGame() {
  document.getElementById("question-screen").classList.remove("active");
  document.getElementById("ranking-screen").classList.add("active");

  const ranking = JSON.parse(localStorage.getItem("agroplay_ranking") || "[]");
  ranking.push({
    name: playerName,
    points: score,
    category: currentCategory,
    date: new Date().toLocaleString()
  });
  ranking.sort((a,b) => b.points - a.points);
  localStorage.setItem("agroplay_ranking", JSON.stringify(ranking));
  renderRanking();
}

// Ranking
function renderRanking() {
  const table = document.getElementById("ranking-table");
  if (!table) return;
  table.innerHTML = "<tr><th>Jogador</th><th>Pontos</th><th>Categoria</th><th>Data</th></tr>";
  const ranking = JSON.parse(localStorage.getItem("agroplay_ranking") || "[]");
  ranking.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.name}</td><td>${r.points}</td><td>${r.category}</td><td>${r.date}</td>`;
    table.appendChild(tr);
  });
}

// Exportar CSV
async function exportQuestionsCSV() {
  try {
    const resp = await fetch("perguntas.json");
    if (!resp.ok) throw new Error("Erro ao baixar perguntas.json");
    const data = await resp.json();
    const lines = ["categoria,pergunta,op1,op2,op3,op4,answerIndex"];
    Object.keys(data).forEach(cat => {
      (data[cat]||[]).forEach(q => {
        const row = [cat, q.question, q.options[0], q.options[1], q.options[2], q.options[3], q.answer];
        lines.push(row.join(","));
      });
    });
    const blob = new Blob([lines.join("\n")], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "perguntas.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
  }
}

// Botões
function setupButtons() {
  document.getElementById("start-game-btn")?.addEventListener("click", startGame);
  document.getElementById("ranking-btn")?.addEventListener("click", () => {
    document.getElementById("start-screen").classList.remove("active");
    document.getElementById("ranking-screen").classList.add("active");
    renderRanking();
  });
  document.getElementById("export-questions-btn")?.addEventListener("click", exportQuestionsCSV);
  document.getElementById("btn-voltar")?.addEventListener("click", () => {
    if (confirm("Deseja voltar ao menu?")) {
      document.getElementById("question-screen").classList.remove("active");
      document.getElementById("start-screen").classList.add("active");
    }
  });
  document.getElementById("back-menu-btn")?.addEventListener("click", () => {
    document.getElementById("ranking-screen").classList.remove("active");
    document.getElementById("start-screen").classList.add("active");
  });
  document.getElementById("clear-ranking-btn")?.addEventListener("click", () => {
    if (confirm("Limpar ranking?")) {
      localStorage.removeItem("agroplay_ranking");
      renderRanking();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadQuestionsFromJSON();
  setupButtons();
});
