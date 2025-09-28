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
      console.error("Elemento tema-select não encontrado");
      return;
    }
    select.innerHTML = "";

    // opcional: placeholder
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

function showQuestion() {
  if (currentQuestionIndex >= currentQuestions.length) {
    return endGame();
  }

  const q = currentQuestions[currentQuestionIndex];

  // Atualiza título no h2
  const titleEl = document.getElementById("question-title");
  if (titleEl) {
    titleEl.textContent = `Pergunta ${currentQuestionIndex + 1} de ${currentQuestions.length}`;
  }

  // Coloca o enunciado no .question
  const questionEl = document.querySelector("#question-screen .question");
  if (questionEl) {
    questionEl.textContent = q.question || "Pergunta sem texto";
  }

  // Renderiza alternativas
  const optionsContainer = document.querySelector("#question-screen .options");
  optionsContainer.innerHTML = "";
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.addEventListener("click", () => checkAnswer(i));
    optionsContainer.appendChild(btn);
  });
}


function showQuestion() {
  if (currentQuestionIndex >= currentQuestions.length) {
    return endGame();
  }

  const q = currentQuestions[currentQuestionIndex];

  // Atualiza título da pergunta (Pergunta X de Y)
  const titleEl = document.getElementById("question-title");
  if (titleEl) {
    titleEl.textContent = `Pergunta ${currentQuestionIndex + 1} de ${currentQuestions.length}`;
  }
  if (currentQuestionIndex >= currentQuestions.length) {
    return endGame();
  }

  const q = currentQuestions[currentQuestionIndex];
  console.log("Pergunta atual:", q.question, "Opções:", q.options);

  const questionEl = document.querySelector("#question-screen .question");
  if (questionEl) {
    questionEl.textContent = q.question || "Pergunta sem texto";
  } else {
    console.error("Elemento .question não encontrado");
  }

  const optionsContainer = document.querySelector("#question-screen .options");
  if (!optionsContainer) {
    console.error("Elemento .options não encontrado");
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
    optionsContainer.innerHTML = "<p>Sem opções disponíveis</p>";
  }
}

function checkAnswer(i) {
  if (currentQuestions[currentQuestionIndex].answer === i) {
    score++;
  }
  currentQuestionIndex++;
  showQuestion();
}

function endGame() {
  document.getElementById("question-screen").classList.remove("active");
  document.getElementById("ranking-screen").classList.add("active");
  const table = document.querySelector("#ranking-screen table");
  if (table) {
    // limpa ranking mostrado
    table.innerHTML = "<tr><th>Jogador</th><th>Pontos</th></tr>";
    const row = document.createElement("tr");
    row.innerHTML = `<td>Você</td><td>${score}</td>`;
    table.appendChild(row);
  }
});
