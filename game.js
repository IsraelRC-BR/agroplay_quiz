console.log("✅ game.js carregado");

const startScreen = document.getElementById("start-screen");
const questionScreen = document.getElementById("question-screen");
const rankingScreen = document.getElementById("ranking-screen");

const startGameBtn = document.getElementById("start-game-btn");
const rankingBtn = document.getElementById("ranking-btn");
const exportQuestionsBtn = document.getElementById("export-questions-btn");
const backMenuBtn = document.getElementById("back-menu-btn");
const temaSelect = document.getElementById("tema-select");

const questionText = questionScreen.querySelector(".question");
const optionsContainer = questionScreen.querySelector(".options");
const rankingTable = rankingScreen.querySelector("table");

let bancoTemas = {};
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let playerName = "Jogador";

function showScreen(screen) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

async function loadQuestionsFromJSON() {
  try {
    const response = await fetch("perguntas.json");
    if (!response.ok) throw new Error("Erro ao carregar perguntas.json: " + response.status);
    bancoTemas = await response.json();

    if (temaSelect) {
      temaSelect.innerHTML = "";
      Object.keys(bancoTemas).forEach((tema) => {
        const option = document.createElement("option");
        option.value = tema;
        option.textContent = tema;
        temaSelect.appendChild(option);
      });
    }
    console.log("Perguntas carregadas. Temas:", Object.keys(bancoTemas));
  } catch (error) {
    console.error("Erro em loadQuestionsFromJSON:", error);
  }
}

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

function checkAnswer(selectedIndex) {
  const current = questions[currentQuestionIndex];
  if (selectedIndex === current.answer) {
    score += 10;
  }
  currentQuestionIndex++;
  loadQuestion();
}

function endGame() {
  saveScore(playerName, score);
  updateRanking();
  showScreen(rankingScreen);
}

function saveScore(name, points) {
  const ranking = JSON.parse(localStorage.getItem("ranking")) || [];
  ranking.push({ name, points });
  ranking.sort((a, b) => b.points - a.points);
  localStorage.setItem("ranking", JSON.stringify(ranking));
}

function updateRanking() {
  const ranking = JSON.parse(localStorage.getItem("ranking")) || [];
  rankingTable.innerHTML = "<tr><th>Jogador</th><th>Pontos</th></tr>";
  ranking.forEach(r => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${r.name}</td><td>${r.points}</td>`;
    rankingTable.appendChild(row);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadQuestionsFromJSON();
});

if (startGameBtn) {
  startGameBtn.addEventListener("click", async () => {
    console.log("🎮 Start clicado");
    if (Object.keys(bancoTemas).length === 0) {
      await loadQuestionsFromJSON();
    }
    let tema = temaSelect ? temaSelect.value : null;
    if (!tema) {
      alert("Escolha um tema.");
      return;
    }
    questions = bancoTemas[tema] || [];
    if (!questions.length) {
      alert("Não há perguntas para o tema escolhido.");
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

if (exportQuestionsBtn) {
  exportQuestionsBtn.addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bancoTemas, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "perguntas.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  });
}
