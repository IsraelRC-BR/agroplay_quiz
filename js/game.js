console.log("🔍 game.js debug carregado");

let questionsData = {};
let currentCategory = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

function getSelectTema() {
  return document.getElementById("tema-select");
}

function getButtonStart() {
  return document.getElementById("start-game-btn");
}

function getQuestionScreen() {
  return document.getElementById("question-screen");
}

function getQuestionDiv() {
  return document.querySelector("#question-screen .question");
}

function getOptionsDiv() {
  return document.querySelector("#question-screen .options");
}

function loadQuestions() {
  fetch("perguntas.json")
    .then(r => {
      if (!r.ok) throw new Error("Erro HTTP: " + r.status);
      return r.json();
    })
    .then(json => {
      questionsData = json;
      console.log("Categorias do JSON:", Object.keys(questionsData));
      const sel = getSelectTema();
      if (!sel) {
        console.error("Seletor 'tema-select' não encontrado no HTML");
        return;
      }
      sel.innerHTML = "<option value=''>-- escolha um tema --</option>";
      Object.keys(questionsData).forEach(tema => {
        const o = document.createElement("option");
        o.value = tema;
        o.textContent = tema;
        sel.appendChild(o);
      });
    })
    .catch(err => {
      console.error("Erro ao carregar JSON:", err);
    });
}

function startGame() {
  const sel = getSelectTema();
  if (!sel) { alert("Tema select não encontrado."); return; }
  const tema = sel.value;
  if (!tema) { alert("Escolha um tema."); return; }
  if (!questionsData[tema] || !Array.isArray(questionsData[tema])) {
    alert("Não há perguntas para o tema selecionado.");
    console.log("questionsData[tema] inválido:", questionsData[tema]);
    return;
  }
  currentCategory = tema;
  currentQuestions = questionsData[tema];
  currentQuestionIndex = 0;
  score = 0;
  console.log("StartGame:", tema, "Perguntas no tema:", currentQuestions.length);

  // Mostrar tela de pergunta
  document.getElementById("start-screen").classList.remove("active");
  document.getElementById("question-screen").classList.add("active");

  showNextQuestion();
}

function showNextQuestion() {
  if (currentQuestionIndex >= currentQuestions.length) {
    endGame();
    return;
  }
  const q = currentQuestions[currentQuestionIndex];
  console.log("Pergunta atual:", q.question); 
if (questionEl) {
  questionEl.innerHTML = `<strong>${q.question}</strong>`;
} else {
  console.error("Elemento .question não encontrado no HTML");
}



  const qDiv = getQuestionDiv();
  if (!qDiv) {
    console.error("Elemento .question não encontrado");
  } else {
    qDiv.textContent = q.question;
  }

  const optsDiv = getOptionsDiv();
  if (!optsDiv) {
    console.error("Elemento .options não encontrado");
    return;
  }
  optsDiv.innerHTML = "";

  if (!Array.isArray(q.options) || q.options.length === 0) {
    optsDiv.innerHTML = "<p>⚠️ Sem opções</p>";
    return;
  }

  q.options.forEach((opt, index) => {
    console.log("Opção carregada:", opt);
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.addEventListener("click", () => {
      checkAnswer(index);
    });
    optsDiv.appendChild(btn);
  });
}

function checkAnswer(selected) {
  const q = currentQuestions[currentQuestionIndex];
  if (selected === q.answer) {
    score++;
    console.log("Acertou! (" + selected + ")");
  } else {
    console.log("Errou: selecionou", selected, "correto:", q.answer);
  }
  currentQuestionIndex++;
  showNextQuestion();
}

function endGame() {
  console.log("Jogo encerrado. Score:", score);
  document.getElementById("question-screen").classList.remove("active");
  document.getElementById("ranking-screen").classList.add("active");
  const tbody = document.querySelector("#ranking-screen table");
  if (tbody) {
    tbody.innerHTML = "<tr><th>Jogador</th><th>Pontos</th></tr>";
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>Jogador</td><td>${score}</td>`;
    tbody.appendChild(tr);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded");
  loadQuestions();
  const btn = getButtonStart();
  if (btn) {
    btn.addEventListener("click", startGame);
  } else {
    console.error("Botão start-game-btn não foi encontrado.");
  }
});
