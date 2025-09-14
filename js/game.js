let questionsData = {};
let currentCategory = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let timer;
let timeLeft = 20;

// Carregar perguntas do JSON
async function loadQuestions() {
  try {
    const response = await fetch("perguntas.json");
    questionsData = await response.json();

    console.log("Perguntas carregadas:", questionsData);
    populateCategories();
  } catch (error) {
    console.error("Erro ao carregar perguntas:", error);
  }
}

// Popular seletor de categorias
function populateCategories() {
  const categorySelect = document.getElementById("category");
  categorySelect.innerHTML = "";

  Object.keys(questionsData).forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

// Iniciar jogo
function startGame() {
  const categorySelect = document.getElementById("category");
  const val = categorySelect.value;

  if (!val || !questionsData[val]) {
    alert("Selecione um tema válido!");
    return;
  }

  currentCategory = val;
  let allQuestions = questionsData[currentCategory] || [];

  // Sorteio de 30 perguntas aleatórias
  currentQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 30);

  currentQuestionIndex = 0;
  score = 0;

  // Troca telas
  document.getElementById("start-screen").classList.remove("active");
  document.getElementById("question-screen").classList.add("active");

  showQuestion();
}

// Exibir pergunta
function showQuestion() {
  if (currentQuestionIndex >= currentQuestions.length) {
    return endGame();
  }

  const q = currentQuestions[currentQuestionIndex];
  console.log("Pergunta atual:", q.question, "Opções:", q.options);

  const questionEl = document.querySelector("#question-screen .question");
  if (questionEl) {
    questionEl.textContent = `(${currentQuestionIndex + 1}/${currentQuestions.length}) ${q.question || "Pergunta sem texto"}`;
  }

  const optionsEl = document.querySelector("#question-screen .options");
  optionsEl.innerHTML = "";

  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.addEventListener("click", () => {
      clearInterval(timer); // parar timer ao responder
      checkAnswer(i);
    });
    optionsEl.appendChild(btn);
  });

  startTimer();
}

// Verificar resposta
function checkAnswer(choice) {
  const q = currentQuestions[currentQuestionIndex];
  if (choice === q.answer) {
    score += 100 / currentQuestions.length;
  }
  currentQuestionIndex++;
  showQuestion();
}

// Timer por pergunta
function startTimer() {
  timeLeft = 20;
  const timerEl = document.getElementById("timer");
  if (timerEl) timerEl.textContent = `Tempo: ${timeLeft}s`;

  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft--;
    if (timerEl) timerEl.textContent = `Tempo: ${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(timer);
      alert("⏰ Tempo esgotado!");
      currentQuestionIndex++;
      showQuestion();
    }
  }, 1000);
}

// Encerrar jogo
function endGame() {
  clearInterval(timer);

  document.getElementById("question-screen").classList.remove("active");
  document.getElementById("end-screen").classList.add("active");

  const resultEl = document.querySelector("#end-screen .result");
  resultEl.textContent = `Você fez ${score.toFixed(2)} pontos!`;
}

// Reiniciar jogo
function restartGame() {
  document.getElementById("end-screen").classList.remove("active");
  document.getElementById("start-screen").classList.add("active");
}

// Carregar perguntas ao iniciar
window.onload = loadQuestions;
