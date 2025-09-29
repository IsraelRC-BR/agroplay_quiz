let questionsData = {};
let currentCategory = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let wrongAnswers = []; // armazenar os erros
const MAX_QUESTIONS = 30; // limite por rodada

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

function showQuestion() {
  if (currentQuestionIndex >= currentQuestions.length) {
    return endGame();
  }

  const q = currentQuestions[currentQuestionIndex];

  const titleEl = document.getElementById("question-title");
  if (titleEl) {
    titleEl.textContent = `Pergunta ${currentQuestionIndex + 1} de ${currentQuestions.length}`;
  }

  const questionEl = document.querySelector("#question-screen .question");
  if (questionEl) {
    questionEl.textContent = q.question || "Pergunta sem texto";
  }

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
    optionsContainer.innerHTML = "<p>Sem opções disponíveis</p>";
  }
}

function checkAnswer(i) {
  const q = currentQuestions[currentQuestionIndex];
  if (q.answer === i) {
    score++;
  } else {
    wrongAnswers.push({
      question: q.question,
      chosen: q.options[i],
      correct: q.options[q.answer]
    });
  }
  currentQuestionIndex++;
  showQuestion();
}

function saveRanking(playerName) {
  const ranking = JSON.parse(localStorage.getItem("ranking")) || [];
  const entry = {
    name: playerName || "Você",
    points: score,
    category: currentCategory,
    date: new Date().toLocaleString(),
    wrongAnswers: wrongAnswers
  };
  ranking.push(entry);
  localStorage.setItem("ranking", JSON.stringify(ranking));
  return ranking;
}

function loadRanking() {
  return JSON.parse(localStorage.getItem("ranking")) || [];
}

function renderRanking() {
  const table = document.getElementById("ranking-table");
  if (!table) return;

  table.innerHTML = "<tr><th>Jogador</th><th>Pontos</th><th>Categoria</th><th>Data</th><th>Revisão</th></tr>";

  const ranking = loadRanking();
  ranking.forEach((entry, idx) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.name}</td>
      <td>${entry.points}</td>
      <td>${entry.category}</td>
      <td>${entry.date}</td>
      <td><button onclick="showReview(${idx})">📖 Ver</button></td>
    `;
    table.appendChild(row);
  });
}

function endGame() {
  document.getElementById("question-screen").classList.remove("active");
  document.getElementById("ranking-screen").classList.add("active");

  const playerName = document.getElementById("player-name").value.trim() || "Você";
  saveRanking(playerName);
  renderRanking();
}

// ==== Revisão de erros ====
function showReview(index) {
  const ranking = loadRanking();
  const entry = ranking[index];
  if (!entry || !entry.wrongAnswers) return;

  document.getElementById("ranking-screen").classList.remove("active");
  document.getElementById("review-screen").classList.add("active");

  const container = document.getElementById("review-content");
  container.innerHTML = "";

  if (entry.wrongAnswers.length === 0) {
    container.innerHTML = "<p>Parabéns! Você não errou nenhuma questão 🎉</p>";
    return;
  }

  entry.wrongAnswers.forEach(item => {
    const div = document.createElement("div");
    div.style.marginBottom = "15px";
    div.innerHTML = `
      <p><b>Pergunta:</b> ${item.question}</p>
      <p><span style="color:red"><b>Sua resposta:</b> ${item.chosen}</span></p>
      <p><span style="color:green"><b>Correta:</b> ${item.correct}</span></p>
      <hr>
    `;
    container.appendChild(div);
  });
}

// ==== Exportar Revisão em PDF ====
// ==== Exportar Revisão em PDF ====
// ==== Exportar Revisão em PDF ====
document.getElementById("export-review-pdf-btn").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  // Título principal
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("AgroPlay com a FAEMG Jovem", pageWidth / 2, 18, { align: "center" });

  // Logos — centralizadas e tamanho uniforme
  const logoWidth = 26; // mm
  const logoHeight = 26;
  const totalWidth = 5 * logoWidth + 4 * 5; // 5 logos + 4 espaçamentos
  let startX = (pageWidth - totalWidth) / 2;
  const yPos = 25;

  const logos = [
    "logo-cedaf.png",
    "logo-ufv.png",
    "logo-srpm.png",
    "logo-faemg.png",
    "logo-raizes.png"
  ];

  for (const src of logos) {
    try {
      const img = await fetch(src);
      const blob = await img.blob();
      const reader = new FileReader();
      const base64 = await new Promise(resolve => {
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      doc.addImage(base64, "PNG", startX, yPos, logoWidth, logoHeight);
    } catch (e) {
      console.warn("Erro ao carregar logo:", src);
    }
    startX += logoWidth + 5;
  }

  // Subtítulo
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Revisão de Erros", pageWidth / 2, yPos + logoHeight + 12, { align: "center" });

  let y = yPos + logoHeight + 25;

  const ranking = loadRanking();
  const activeEntry = ranking.find(entry => entry.wrongAnswers && entry.wrongAnswers.length > 0);

  if (!activeEntry || activeEntry.wrongAnswers.length === 0) {
    doc.setFontSize(12);
    doc.text("Parabéns! Você não errou nenhuma questão 🎉", 10, y);
  } else {
    doc.setFontSize(11);
    activeEntry.wrongAnswers.forEach(item => {
      const lines = [
        "Pergunta: " + item.question,
        "Sua resposta: " + item.chosen,
        "Correta: " + item.correct,
        " "
      ];
      lines.forEach(line => {
        doc.text(line, 10, y);
        y += 8;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
    });
  }

  doc.save("revisao-erros.pdf");
});


// ==== Navegação ====
document.getElementById("ranking-btn").addEventListener("click", () => {
  document.getElementById("start-screen").classList.remove("active");
  document.getElementById("ranking-screen").classList.add("active");
  renderRanking();
});

document.getElementById("back-menu-btn").addEventListener("click", () => {
  document.getElementById("ranking-screen").classList.remove("active");
  document.getElementById("start-screen").classList.add("active");
});

document.getElementById("back-ranking-btn").addEventListener("click", () => {
  document.getElementById("review-screen").classList.remove("active");
  document.getElementById("ranking-screen").classList.add("active");
});

document.getElementById("clear-ranking-btn").addEventListener("click", () => {
  localStorage.removeItem("ranking");
  renderRanking();
});

document.getElementById("start-game-btn").addEventListener("click", () => {
  const select = document.getElementById("tema-select");
  currentCategory = select.value;
  if (!currentCategory) return alert("Selecione um tema!");

  // Copia todas as perguntas da categoria
  let allQuestions = [...questionsData[currentCategory]];

  // Embaralha as perguntas (Fisher-Yates)
  for (let i = allQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
  }

  // Seleciona até 30 perguntas
  currentQuestions = allQuestions.slice(0, MAX_QUESTIONS);

  currentQuestionIndex = 0;
  score = 0;
  wrongAnswers = [];

  document.getElementById("start-screen").classList.remove("active");
  document.getElementById("question-screen").classList.add("active");

  showQuestion();
});

document.getElementById("btn-voltar").addEventListener("click", () => {
  document.getElementById("question-screen").classList.remove("active");
  document.getElementById("start-screen").classList.add("active");
});

window.onload = loadQuestionsFromJSON;
