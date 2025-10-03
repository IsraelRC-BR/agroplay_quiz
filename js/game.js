let questionsData = {};
let currentCategory = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let wrongAnswers = []; // armazenar os erros
const MAX_QUESTIONS = 15; // limite por rodada

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
// ==== Exportar Revisão em PDF ====
document.getElementById("export-review-pdf-btn").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  // Título principal
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("AgroPlay com a FAEMG Jovem", pageWidth / 2, 18, { align: "center" });

  // Configurações das logos
  const maxSize = 26; // mm
  const spacing = 5;
  const yPos = 25;

  const logos = [
    "logo-cedaf.png",
    "logo-ufv.png",
    "logo-srpm.png",
    "logo-faemg.png",
    "logo-raizes.png"
  ];

  // Pré-carregar imagens para medir proporções
  const loadedLogos = await Promise.all(
    logos.map(async (src) => {
      try {
        const img = await fetch(src);
        const blob = await img.blob();
        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        // Criar objeto imagem para pegar dimensões
        const image = new Image();
        image.src = base64;
        await new Promise((r) => (image.onload = r));
        const ratio = image.width / image.height;
        let w = maxSize;
        let h = maxSize;
        if (ratio > 1) h = w / ratio; // mais largo
        else w = h * ratio; // mais alto
        return { base64, w, h };
      } catch (e) {
        console.warn("Erro ao carregar logo:", src);
        return null;
      }
    })
  );

  // Calcular largura total
  const totalWidth =
    loadedLogos.filter(Boolean).reduce((acc, l) => acc + l.w, 0) +
    (loadedLogos.filter(Boolean).length - 1) * spacing;
  let startX = (pageWidth - totalWidth) / 2;

  // Adicionar imagens proporcionalmente
  loadedLogos.forEach((logo) => {
    if (!logo) return;
    const yAdj = yPos + (maxSize - logo.h) / 2; // centralizar verticalmente
    doc.addImage(logo.base64, "PNG", startX, yAdj, logo.w, logo.h);
    startX += logo.w + spacing;
  });

  // Subtítulo
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Revisão de Erros", pageWidth / 2, yPos + maxSize + 12, { align: "center" });

  let y = yPos + maxSize + 25;

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
