let questionsData = {};
let currentCategory = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

async function loadQuestionsFromJSON() {
  try {
    const response = await fetch("perguntas.json");
    if (!response.ok) throw new Error("Erro ao carregar perguntas.json");
    questionsData = await response.json();
    console.log("Categorias carregadas:", Object.keys(questionsData));

    const select = document.getElementById("tema-select");
    if (!select) {
      console.error("Elemento tema-select não encontrado no HTML");
      return;
    }
    select.innerHTML = "";

    // Adiciona placeholder
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "-- escolha um tema --";
    select.appendChild(placeholder);

    // Adiciona categorias
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

function startGame() {
  const select = document.getElementById("tema-select");
  if (!select) {
    alert("Seletor de tema não encontrado");
    return;
  }
  const val = select.value;
  if (!val) {
    alert("Selecione um tema antes de iniciar");
    return;
  }

  currentCategory = val;
  let allQuestions = questionsData[currentCategory] || [];

  // Sorteia 30 perguntas dentro das disponíveis
  currentQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 30);

  currentQuestionIndex = 0;
  score = 0;

  document.getElementById("start-screen").classList.remove("active");
  document.getElementById("question-screen").classList.add("active");

  showQuestion();
}

function showQuestion() {
  if (currentQuestionIndex >= currentQuestions.length) {
    return endGame();
  }

  const q = currentQuestions[currentQuestionIndex];
  console.log("Pergunta atual:", q.question, "Opções:", q.options);

  // Atualiza título com número da pergunta
  const titleEl = document.getElementById("question-title");
  if (titleEl) {
    titleEl.textContent = `Pergunta ${currentQuestionIndex + 1} de ${currentQuestions.length}`;
  }

  const questionEl = document.querySelector("#question-screen .question");
  if (questionEl) {
    questionEl.textContent = q.question || "Pergunta sem texto";
  }

  const optionsContainer = document.querySelector("#question-screen .options");
  if (!optionsContainer) {
    console.error("Elemento .options não encontrado no HTML");
    return;
  }
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

function checkAnswer(i) {
  if (currentQuestions[currentQuestionIndex].answer === i) {
    // Cada rodada vale 100 pontos → divide igualmente
    score += 100 / currentQuestions.length;
  }
  currentQuestionIndex++;
  showQuestion();
}

function endGame() {
  document.getElementById("question-screen").classList.remove("active");
  document.getElementById("ranking-screen").classList.add("active");

  const table = document.querySelector("#ranking-screen table");
  if (table) {
    table.innerHTML = "<tr><th>Jogador</th><th>Pontos</th></tr>";
    const row = document.createElement("tr");
    row.innerHTML = `<td>Você</td><td>${score.toFixed(1)}</td>`;
    table.appendChild(row);
  }
}

// Botão voltar dentro do quiz
function setupVoltarButton() {
  const btnVoltar = document.getElementById("btn-voltar");
  if (btnVoltar) {
    btnVoltar.addEventListener("click", () => {
      const confirmar = confirm("Deseja realmente sair do jogo e voltar ao início?");
      if (confirmar) {
        document.getElementById("question-screen").classList.remove("active");
        document.getElementById("start-screen").classList.add("active");
        currentQuestionIndex = 0;
        currentCategory = null;
      }
    });
  }
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  loadQuestionsFromJSON();

  const startBtn = document.getElementById("start-game-btn");
  if (startBtn) {
    startBtn.addEventListener("click", startGame);
  } else {
    console.error("Botão start-game-btn não encontrado");
  }

  setupVoltarButton();
});
