
console.log("✅ game.js loaded (fixed v2) — debug ON");

/* State */
let questionsData = {};
let currentCategory = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

/* Utility: find the theme select robustly */
function getTemaSelect() {
  return document.getElementById("tema-select")
    || document.querySelector("#start-screen select#tema-select")
    || document.querySelector("#start-screen select")
    || document.querySelector("select#tema-select")
    || document.querySelector("select");
}

/* Show one of the app screens by id (start-screen, question-screen, ranking-screen) */
function showScreenById(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

/* Load perguntas.json and populate the tema select */
async function loadQuestionsFromJSON() {
  try {
    const resp = await fetch("perguntas.json", { cache: "no-store" });
    if (!resp.ok) throw new Error("HTTP " + resp.status + " " + resp.statusText);
    questionsData = await resp.json();

    console.log("JSON carregado. Temas encontrados:", Object.keys(questionsData));

    const select = getTemaSelect();
    if (!select) {
      console.error("select#tema-select não encontrado no HTML. Verifique o index.html.");
      return;
    }

    // Build options
    const prev = select.value || "";
    select.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "— Escolha um tema —";
    select.appendChild(placeholder);

    Object.keys(questionsData).forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      select.appendChild(opt);
    });

    // restore previous selection if still available
    if (prev) select.value = prev;

    console.log("Categorias carregadas no select:", Array.from(select.options).map(o => o.value).filter(v => v));
  } catch (err) {
    console.error("Erro ao carregar perguntas.json:", err);
    // show UI hint if start screen present
    const start = document.getElementById("start-screen");
    if (start) {
      const p = document.createElement("p");
      p.style.color = "yellow";
      p.textContent = "Erro ao carregar perguntas.json — ver console (F12) para detalhes.";
      start.appendChild(p);
    }
  }
}

/* Start the game using the selected theme from the select */
function startGame() {
  const select = getTemaSelect();
  if (!select) {
    alert("Seletor de tema não encontrado. Verifique o HTML.");
    return;
  }

  const tema = select.value;
  if (!tema) {
    alert("Escolha um tema antes de iniciar.");
    return;
  }

  if (!questionsData || !questionsData[tema]) {
    alert("Não há perguntas carregadas para o tema escolhido.");
    return;
  }

  currentCategory = tema;
  currentQuestions = Array.isArray(questionsData[tema]) ? [...questionsData[tema]] : [];
  currentQuestionIndex = 0;
  score = 0;

  console.log("🎮 Start clicado. Tema:", tema, "Perguntas disponíveis:", currentQuestions.length);

  showScreenById("question-screen");
  renderQuestion();
}

/* Render the current question and options into #question-screen .question and .options */
function renderQuestion() {
  if (!currentQuestions || currentQuestions.length === 0) {
    console.warn("Nenhuma pergunta carregada para renderizar.");
    return;
  }

  if (currentQuestionIndex >= currentQuestions.length) {
    return endGame();
  }

  const q = currentQuestions[currentQuestionIndex];
  console.log("Pergunta atual (index:", currentQuestionIndex, "):", q);

  const questionEl = document.querySelector("#question-screen .question");
  if (!questionEl) {
    console.error("Elemento '#question-screen .question' não encontrado no HTML.");
  } else {
    questionEl.textContent = q.question || "❗ Pergunta sem texto (ver JSON)";
  }

  const optionsContainer = document.querySelector("#question-screen .options");
  if (!optionsContainer) {
    console.error("Elemento '#question-screen .options' não encontrado no HTML.");
    return;
  }
  optionsContainer.innerHTML = "";

  if (!Array.isArray(q.options) || q.options.length === 0) {
    optionsContainer.innerHTML = "<p>⚠️ Nenhuma opção encontrada para esta pergunta.</p>";
    return;
  }

  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.addEventListener("click", () => handleAnswer(i));
    optionsContainer.appendChild(btn);
  });
}

/* Handle answer click */
function handleAnswer(index) {
  const q = currentQuestions[currentQuestionIndex];
  const correct = typeof q.answer === "number" ? q.answer : null;
  if (correct === null) {
    console.warn("Pergunta sem campo 'answer' válido:", q);
  } else {
    if (index === correct) {
      score++;
      console.log("Resposta correta! Score:", score);
    } else {
      console.log("Resposta errada. Escolhida:", index, "Correta:", correct);
    }
  }
  currentQuestionIndex++;
  // small delay to allow user to see button press
  setTimeout(() => renderQuestion(), 150);
}

/* End game: show ranking screen and save score to localStorage */
function endGame() {
  console.log("Finalizando jogo. Score final:", score);
  showScreenById("ranking-screen");

  // Save to ranking (simple push)
  const player = prompt("Digite seu nome para o ranking:", "Jogador") || "Jogador";
  const ranking = JSON.parse(localStorage.getItem("agroplay_ranking") || "[]");
  ranking.push({ name: player, points: score, category: currentCategory, date: new Date().toISOString() });
  ranking.sort((a, b) => b.points - a.points);
  localStorage.setItem("agroplay_ranking", JSON.stringify(ranking));

  // render table
  const table = document.querySelector("#ranking-screen table");
  if (table) {
    table.innerHTML = "<tr><th>Jogador</th><th>Pontos</th><th>Tema</th><th>Data</th></tr>";
    ranking.slice(0, 20).forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${r.name}</td><td>${r.points}</td><td>${r.category}</td><td>${new Date(r.date).toLocaleString()}</td>`;
      table.appendChild(tr);
    });
  }
}

/* Back to menu */
function backToMenu() {
  showScreenById("start-screen");
}

/* Wire up buttons safely (only if they exist) */
function wireButtons() {
  const startBtn = document.getElementById("start-game-btn");
  if (startBtn) startBtn.addEventListener("click", startGame);
  else console.warn("#start-game-btn não encontrado.");

  const rankingBtn = document.getElementById("ranking-btn");
  if (rankingBtn) rankingBtn.addEventListener("click", () => { 
    // show ranking using existing saved values
    const table = document.querySelector("#ranking-screen table");
    const ranking = JSON.parse(localStorage.getItem("agroplay_ranking") || "[]");
    if (table) {
      table.innerHTML = "<tr><th>Jogador</th><th>Pontos</th><th>Tema</th><th>Data</th></tr>";
      ranking.slice(0,20).forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${r.name}</td><td>${r.points}</td><td>${r.category}</td><td>${new Date(r.date).toLocaleString()}</td>`;
        table.appendChild(tr);
      });
    }
    showScreenById("ranking-screen");
  });
  else console.warn("#ranking-btn não encontrado.");

  const backBtn = document.getElementById("back-menu-btn");
  if (backBtn) backBtn.addEventListener("click", backToMenu);
  else console.warn("#back-menu-btn não encontrado.");

  // export questions button (optional)
  const exportBtn = document.getElementById("export-questions-btn");
  if (exportBtn) exportBtn.addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(questionsData, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = "perguntas.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
}

/* Init on DOMContentLoaded to ensure HTML exists */
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded -> inicializando jogo");
  wireButtons();
  loadQuestionsFromJSON();
});
