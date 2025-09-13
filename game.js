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
    console.log("Pergunta atual:", q); // 👈 debug no console

    // Garante que o elemento existe
    const questionEl = document.querySelector("#question-screen .question");
    if (questionEl) {
        questionEl.textContent = q.question || "⚠️ Pergunta não encontrada no JSON";
    }

    const optionsContainer = document.querySelector("#question-screen .options");
    optionsContainer.innerHTML = "";

    if (q.options && q.options.length) {
        q.options.forEach((opt, i) => {
            const btn = document.createElement("button");
            btn.textContent = opt;
            btn.addEventListener("click", () => checkAnswer(i));
            optionsContainer.appendChild(btn);
        });
    } else {
        optionsContainer.innerHTML = "<p>⚠️ Nenhuma opção encontrada</p>";
    }
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
}
