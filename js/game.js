console.log("✅ game.js carregado");

// Seleção das telas
const startScreen = document.getElementById("start-screen");
const questionScreen = document.getElementById("question-screen");
const rankingScreen = document.getElementById("ranking-screen");

// Seleção dos elementos dinâmicos
const startGameBtn = document.getElementById("start-game-btn");
const rankingBtn = document.getElementById("ranking-btn");
const exportQuestionsBtn = document.getElementById("export-questions-btn");
const backMenuBtn = document.getElementById("back-menu-btn");

const questionText = questionScreen.querySelector(".question");
const optionsContainer = questionScreen.querySelector(".options");
const rankingTable = rankingScreen.querySelector("table");

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let playerName = "Jogador";

// Função para alternar telas
function showScreen(screen) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

// Função para carregar perguntas do JSON
async function loadQuestionsFromJSON() {
  try {
    const response = await fetch("perguntas.json");
    if (!response.ok) throw new Error("Erro ao carregar perguntas.json");
    questions = await response.json();
  } catch (error) {
    alert("Não foi possível carregar as perguntas: " + error.message);
  }
}

// Função para carregar pergunta
function loadQuestion() {
  if (currentQuestionIndex >= questions.length) {
    endGame();
    return;
  }

  const current = questions[currentQuestionIndex];
  questionText.textContent = current.question;
  optionsContainer.innerHTML = "";

  current.options.forEach((opt, index) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.addEventListener("click", () => checkAnswer(index));
    optionsContainer.appendChild(btn);
  });
}

// Função para verificar resposta
function checkAnswer(selectedIndex) {
  const current = questions[currentQuestionIndex];
  if (selectedIndex === current.answer) {
    score += 10;
  }
  currentQuestionIndex++;
  loadQuestion();
}

// Função para finalizar jogo e mostrar ranking
function endGame() {
  saveScore(playerName, score);
  updateRanking();
  showScreen(rankingScreen);
}

// Função para salvar pontuação no localStorage
function saveScore(name, points) {
  const ranking = JSON.parse(localStorage.getItem("ranking")) || [];
  ranking.push({ name, points });
  ranking.sort((a, b) => b.points - a.points);
  localStorage.setItem("ranking", JSON.stringify(ranking));
}

// Função para atualizar tabela de ranking
function updateRanking() {
  const ranking = JSON.parse(localStorage.getItem("ranking")) || [];
  rankingTable.innerHTML = "<tr><th>Jogador</th><th>Pontos</th></tr>";
  ranking.forEach(r => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${r.name}</td><td>${r.points}</td>`;
    rankingTable.appendChild(row);
  });
}

// Eventos dos botões principais
if (startGameBtn) {
  startGameBtn.addEventListener("click", async () => {
    await loadQuestionsFromJSON();
    if (questions.length === 0) {
      alert("Nenhuma pergunta disponível.");
      return;
    }
    currentQuestionIndex = 0;
    score = 0;
    playerName = prompt("Digite seu nome:", "Jogador") || "Jogador";
    showScreen(questionScreen);
    loadQuestion();
  });
}

if (rankingBtn) {
  rankingBtn.addEventListener("click", () => {
    updateRanking();
    showScreen(rankingScreen);
  });
}

if (backMenuBtn) {
  backMenuBtn.addEventListener("click", () => {
    showScreen(startScreen);
  });
}

// Botão de exportar perguntas (gera JSON)
if (exportQuestionsBtn) {
  exportQuestionsBtn.addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(questions, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "perguntas.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  });
}
