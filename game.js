let questionsData = {};
let currentCategory = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let respostasJogador = [];

// Carregar perguntas
async function loadQuestionsFromJSON() {
  const response = await fetch("perguntas.json");
  questionsData = await response.json();
  const select = document.getElementById("tema-select");
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
}

// Exibir pergunta
function showQuestion() {
  if (currentQuestionIndex >= currentQuestions.length) return endGame();
  const q = currentQuestions[currentQuestionIndex];
  document.getElementById("question-title").textContent = `Pergunta ${currentQuestionIndex + 1} de ${currentQuestions.length}`;
  document.querySelector("#question-screen .question").textContent = q.question;
  const optionsContainer = document.querySelector("#question-screen .options");
  optionsContainer.innerHTML = "";
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.addEventListener("click", () => checkAnswer(i));
    optionsContainer.appendChild(btn);
  });
}

// Verificar resposta
function checkAnswer(i) {
  const perguntaAtual = currentQuestions[currentQuestionIndex];
  const correta = (perguntaAtual.answer === i);
  respostasJogador.push({
    pergunta: perguntaAtual.question,
    respostaJogador: perguntaAtual.options[i],
    respostaCorreta: perguntaAtual.options[perguntaAtual.answer],
    correta: correta
  });
  if (correta) score++;
  currentQuestionIndex++;
  showQuestion();
}

// Fim de jogo
function endGame() {
  document.getElementById("question-screen").classList.remove("active");
  document.getElementById("ranking-screen").classList.add("active");

  // Salvar no localStorage
  const playerName = document.getElementById("player-name").value || "Anônimo";
  const record = {
    nome: playerName,
    pontos: score,
    categoria: currentCategory,
    data: new Date().toLocaleString(),
    erros: respostasJogador.filter(r => !r.correta)
  };
  let ranking = JSON.parse(localStorage.getItem("ranking")) || [];
  ranking.push(record);
  localStorage.setItem("ranking", JSON.stringify(ranking));

  renderRanking();
}

// Renderizar ranking
function renderRanking() {
  const table = document.getElementById("ranking-table");
  let ranking = JSON.parse(localStorage.getItem("ranking")) || [];
  table.innerHTML = "<tr><th>Jogador</th><th>Pontos</th><th>Categoria</th><th>Data</th><th>Revisão</th></tr>";
  ranking.forEach((r, idx) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${r.nome}</td><td>${r.pontos}</td><td>${r.categoria}</td><td>${r.data}</td>
      <td><button onclick="showReview(${idx})">📋 Revisão</button></td>`;
    table.appendChild(row);
  });
}

// Mostrar revisão de erros
function showReview(index) {
  const ranking = JSON.parse(localStorage.getItem("ranking")) || [];
  const partida = ranking[index];
  const reviewContent = document.getElementById("review-content");
  if (partida.erros.length > 0) {
    reviewContent.innerHTML = `<table><tr><th>Pergunta</th><th>Sua Resposta</th><th>Resposta Correta</th></tr>
      ${partida.erros.map(e => `<tr><td>${e.pergunta}</td><td style='color:red;'>${e.respostaJogador}</td><td style='color:green;'>${e.respostaCorreta}</td></tr>`).join("")}</table>`;
  } else {
    reviewContent.innerHTML = "<p>Parabéns! Você acertou todas! 🎉</p>";
  }
  document.getElementById("ranking-screen").classList.remove("active");
  document.getElementById("review-screen").classList.add("active");
}

// Exportar revisão PDF
function exportReviewToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Revisão de Erros - AgroPlay", 20, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  const reviewHTML = document.getElementById("review-content").innerText.split("\n");
  let y = 35;
  reviewHTML.forEach(line => {
    doc.text(line, 20, y);
    y += 7;
    if (y > 270) { doc.addPage(); y = 20; }
  });
  doc.save("revisao-erros-agroplay.pdf");
}

// Eventos
document.addEventListener("DOMContentLoaded", () => {
  loadQuestionsFromJSON();
  document.getElementById("back-menu-btn").addEventListener("click", () => {
    document.getElementById("ranking-screen").classList.remove("active");
    document.getElementById("start-screen").classList.add("active");
  });
  document.getElementById("clear-ranking-btn").addEventListener("click", () => {
    localStorage.removeItem("ranking");
    renderRanking();
  });
  document.getElementById("back-ranking-btn").addEventListener("click", () => {
    document.getElementById("review-screen").classList.remove("active");
    document.getElementById("ranking-screen").classList.add("active");
  });
  document.getElementById("export-review-pdf-btn").addEventListener("click", exportReviewToPDF);
});
