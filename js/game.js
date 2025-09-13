console.log("✅ game.js debug carregado (corrigido)");

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

      // Limpa opções anteriores
      sel.innerHTML = "";

      // placeholder
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "-- escolha um tema --";
      sel.appendChild(placeholder);

      // adicionar temas
      Object.keys(questionsData).forEach(tema => {
        const o = document.createElement("option");
        o.value = tema;
        o.textContent = tema;
        sel.appendChild(o);
      });

      console.log("Select de temas preenchido:", Array.from(sel.options).map(o => o.text));
    })
    .catch(err => {
      console.error("Erro ao carregar JSON:", err);
    });
}

function startGame() {
  const sel = getSelectTema();
  if (!sel) {
    alert("Seletor de temas não encontrado.");
    return;
  }
  const tema = sel.value;
  if (!tema) {
    alert("Escolha um tema.");
    return;
  }
  if (!questionsData[tema] || !Array.isArray(questionsData[tema])) {
    alert("Não há perguntas para o tema selecionado.");
    console.log("questionsData[tema] inválido:", questionsData[tema]);
    return;
  }
  currentCategory = tema;
  currentQuestions = questionsData[tema];
  currentQuestionIndex = 0;
  score = 0;

  console.log("🏁 StartGame:", tema, "Perguntas no tema:", currentQuestions.length);

  document.getElementById("start-screen").classList.remove("active");
  document.getElementById("question-screen").classList.add("active");

  showNextQuestion();
}

function showNextQuestion() {
  if (currentQuestionIndex >= currentQuestions.length) {
    return endGame();
  }
  const q = currentQuestions[currentQuestionIndex];
  console.log("📋 Pergunta atual:", q);

  const qDiv = getQuestionDiv();
  if (qDiv) {
    qDiv.textContent = q.question || "⚠️ Pergunta não encontrada no JSON";
    console.log("👉 Pergunta exibida:", q.question);
  } else {
    console.error("Elemento '#question-screen .question' não encontrado no HTML");
  }

  const optsDiv = getOptionsDiv();
  if (!optsDiv) {
    console.error("Elemento '#question-screen .options' não encontrado no HTML");
    return;
  }
  optsDiv.innerHTML = "";

  if (!Array.isArray(q.options) || q.options.length === 0) {
    optsDiv.innerHTML = "<p>⚠️ Sem opções</p>";
    return;
  }

  q.options.forEach((opt, idx) => {
    console.log("👉 Opção carregada:", opt);
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.addEventListener("click", () => checkAnswer(idx));
    optsDiv.appendChild(btn);
  });
}

function checkAnswer(selected) {
  const q = currentQuestions[currentQuestionIndex];
  if (selected === q.answer) {
    score++;
    console.log("✔️ Acertou!", selected);
  } else {
    console.log("❌ Errou. Selecionado:", selected, "Correta:", q.answer);
  }
  currentQuestionIndex++;
  showNextQuestion();
}

function endGame() {
  console.log("🏁 Jogo encerrado. Score final:", score);
  document.getElementById("question-screen").classList.remove("active");
  document.getElementById("ranking-screen").classList.add("active");

  const tbody = document.querySelector("#ranking-screen table");
  if (tbody) {
    // limpar e exibir pontuação
    tbody.innerHTML = "<tr><th>Jogador</th><th>Pontos</th></tr>";
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>Você</td><td>${score}</td>`;
    tbody.appendChild(tr);
  }
}
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded -> iniciando...");
  loadQuestions();
  const btn = getButtonStart();
  if (btn) {
    btn.addEventListener("click", startGame);
  } else {
    console.error("Botão 'start-game-btn' não encontrado no HTML");
  }
});

// Botão Voltar dentro do quiz
const btnVoltar = document.getElementById("btn-voltar");

if (btnVoltar) {
    btnVoltar.addEventListener("click", () => {
        const confirmar = confirm("Deseja realmente sair do jogo e voltar ao início?");
        if (confirmar) {
            // Esconde tela do quiz
            document.getElementById("question-screen").style.display = "none";
            
            // Mostra tela inicial de categorias
            document.getElementById("start-screen").style.display = "block";

            // Resetar variáveis globais do jogo
            currentQuestionIndex = 0;
            currentCategory = null;
        }
    });

