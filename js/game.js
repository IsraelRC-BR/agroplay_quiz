/* game.js - versão corrigida e completa */

let questionsData = {};
let currentCategory = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let playerName = "";

// Carrega perguntas do JSON e popula o select
async function loadQuestionsFromJSON() {
  try {
    const response = await fetch("perguntas.json");
    if (!response.ok) throw new Error("Erro ao carregar perguntas.json");
    questionsData = await response.json();

    const select = document.getElementById("tema-select");
    if (!select) return;

    select.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "-- Selecione um tema --";
    select.appendChild(placeholder);

    Object.keys(questionsData).forEach(category => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      select.appendChild(option);
    });

  } catch (error) {
    console.error("Erro ao carregar perguntas:", error);
  }
}

// Inicia o jogo
function startGame() {
  const nameInput = document.getElementById("player-name");
  const select = document.getElementById("tema-select");

  if (!nameInput || !select) {
    alert("Campos obrigatórios não encontrados");
    return;
  }

  const name = nameInput.value.trim();
  if (!name) {
    alert("Digite seu nome antes de iniciar");
    return;
  }

  const val = select.value;
  if (!val) {
    alert("Selecione um tema antes de iniciar");
    return;
  }

  playerName = name;
  currentCategory = val;

  const allQ = questionsData[currentCategory] || [];
  currentQuestions = allQ.slice().sort(() => 0.5 - Math.random()).slice(0, 30);

  currentQuestionIndex = 0;
  score = 0;

  document.getElementById("start-screen").classList.remove("active");
  document.getElementById("ranking-screen").classList.remove("active");
  document.getElementById("question-screen").classList.add("active");

  showQuestion();
}

// Mostra a pergunta atual
function showQuestion() {
  if (currentQuestionIndex >= currentQuestions.length) {
    return endGame();
  }

  const q = currentQuestions[currentQuestionIndex];

  const questionEl = document.querySelector("#question-screen .question");
  if (questionEl) questionEl.textContent = q.question || "Pergunta sem texto";

  const optionsContainer = document.querySelector("#question-screen .options");
  optionsContainer.innerHTML = "";

  if (Array.isArray(q.options) && q.options.length > 0) {
    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.textContent = opt;
      btn.addEventListener("click", () => checkAnswer(i));
      optionsContainer.appendChild(btn);
    });
  } else {
    optionsContainer.innerHTML = "<p>⚠️ Sem opções</p>";
  }
}

// Checa resposta
function checkAnswer(i) {
  if (currentQuestions[currentQuestionIndex].answer === i) {
    score += 100 / currentQuestions.length;
  }
  currentQuestionIndex++;
  showQuestion();
}

// Finaliza o jogo e salva no ranking
function endGame() {
  document.getElementById("question-screen").classList.remove("active");
  document.getElementById("ranking-screen").classList.add("active");

  const ranking = JSON.parse(localStorage.getItem("agroplay_ranking") || "[]");
  const entry = {
    name: playerName,
    points: Number(score.toFixed(1)),
    category: currentCategory,
    date: new Date().toLocaleString()
  };
  ranking.push(entry);
  ranking.sort((a, b) => b.points - a.points);
  localStorage.setItem("agroplay_ranking", JSON.stringify(ranking));

  renderRanking();
}

// Renderiza o ranking
function renderRanking() {
  const table = document.querySelector("#ranking-screen table");
  if (!table) return;

  table.innerHTML = "<tr><th>Jogador</th><th>Pontos</th><th>Categoria</th><th>Data</th></tr>";
  const ranking = JSON.parse(localStorage.getItem("agroplay_ranking") || "[]");

  ranking.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${escapeHtml(r.name)}</td><td>${r.points}</td><td>${escapeHtml(r.category)}</td><td>${r.date}</td>`;
    table.appendChild(tr);
  });
}

// Exporta perguntas como CSV
async function exportQuestionsCSV() {
  try {
    const response = await fetch("perguntas.json");
    if (!response.ok) throw new Error("Erro ao baixar perguntas.json");
    const data = await response.json();

    const lines = ["categoria,pergunta,op1,op2,op3,op4,answerIndex"];
    Object.keys(data).forEach(cat => {
      (data[cat] || []).forEach(q => {
        const row = [
          csvEscape(cat),
          csvEscape(q.question || ""),
          csvEscape(q.options?.[0] || ""),
          csvEscape(q.options?.[1] || ""),
          csvEscape(q.options?.[2] || ""),
          csvEscape(q.options?.[3] || ""),
          typeof q.answer === "number" ? q.answer : ""
        ];
        lines.push(row.join(","));
      });
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "perguntas_agroplay.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

  } catch (err) {
    console.error(err);
    alert("Erro ao exportar CSV");
  }
}

// Utilitários
function csvEscape(s) {
  if (s == null) return "";
  const str = String(s).replace(/"/g, '""');
  if (/[,"\n]/.test(str)) return `"${str}"`;
  return str;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, m => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]
  ));
}

// Configura botões
function setupButtons() {
  document.getElementById("start-game-btn")?.addEventListener("click", startGame);
  document.getElementById("ranking-btn")?.addEventListener("click", () => {
    document.getElementById("start-screen").classList.remove("active");
    document.getElementById("ranking-screen").classList.add("active");
    renderRanking();
  });
  document.getElementById("export-questions-btn")?.addEventListener("click", exportQuestionsCSV);
  document.getElementById("back-menu-btn")?.addEventListener("click", () => {
    document.getElementById("ranking-screen").classList.remove("active");
    document.getElementById("start-screen").classList.add("active");
  });
  document.getElementById("btn-voltar")?.addEventListener("click", () => {
    if (confirm("Deseja sair do jogo e voltar ao menu?")) {
      document.getElementById("question-screen").classList.remove("active");
      document.getElementById("start-screen").classList.add("active");
    }
  });
  document.getElementById("clear-ranking-btn")?.addEventListener("click", () => {
    if (confirm("Limpar ranking?")) {
      localStorage.removeItem("agroplay_ranking");
      renderRanking();
    }
  });
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  loadQuestionsFromJSON();
  setupButtons();
});
