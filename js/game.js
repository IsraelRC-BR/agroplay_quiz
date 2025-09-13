let questionsData = {};
let currentCategory = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

// Carregar JSON e preencher o seletor
async function loadQuestionsFromJSON() {
    try {
        const response = await fetch("perguntas.json");
        if (!response.ok) throw new Error("Erro ao carregar perguntas.json");
        questionsData = await response.json();

        const select = document.getElementById("tema-select");
        select.innerHTML = "";

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

// Iniciar jogo
function startGame() {
    const select = document.getElementById("tema-select");
    currentCategory = select.value;
    currentQuestions = [...questionsData[currentCategory]];
    currentQuestionIndex = 0;
    score = 0;

    document.getElementById("start-screen").classList.remove("active");
    document.getElementById("question-screen").classList.add("active");

    showQuestion();
}

// Mostrar pergunta
function showQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        return endGame();
    }

    const q = currentQuestions[currentQuestionIndex];
    document.querySelector("#question-screen .question").innerText = q.question;

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
    if (i === currentQuestions[currentQuestionIndex].answer) {
        score++;
    }
    currentQuestionIndex++;
    showQuestion();
}

// Encerrar jogo
function endGame() {
    document.getElementById("question-screen").classList.remove("active");
    document.getElementById("ranking-screen").classList.add("active");

    const table = document.querySelector("#ranking-screen table");
    const row = document.createElement("tr");
    row.innerHTML = `<td>Jogador</td><td>${score}</td>`;
    table.appendChild(row);
}

// Voltar ao menu
function backToMenu() {
    document.getElementById("ranking-screen").classList.remove("active");
    document.getElementById("start-screen").classList.add("active");
}

// Eventos
document.getElementById("start-game-btn").addEventListener("click", startGame);
document.getElementById("back-menu-btn").addEventListener("click", backToMenu);

window.onload = loadQuestionsFromJSON;
