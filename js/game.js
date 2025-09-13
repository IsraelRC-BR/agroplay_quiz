
let questionsData = {};
let currentCategory = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

// Carregar perguntas do JSON
async function loadQuestionsFromJSON() {
    try {
        const response = await fetch("perguntas.json");
        if (!response.ok) throw new Error("Erro ao carregar perguntas.json");
        questionsData = await response.json();

        // Criar os botões de categorias
        const categoryContainer = document.getElementById("categories");
        categoryContainer.innerHTML = "";

        Object.keys(questionsData).forEach(category => {
            const btn = document.createElement("button");
            btn.innerText = category; // Exibe o nome completo (com espaços/acentos)
            btn.classList.add("category-btn");
            btn.addEventListener("click", () => startGame(category));
            categoryContainer.appendChild(btn);
        });
    } catch (error) {
        console.error("Erro em loadQuestionsFromJSON:", error);
    }
}

// Iniciar o jogo com a categoria escolhida
function startGame(category) {
    currentCategory = category;
    currentQuestions = [...questionsData[category]];
    currentQuestionIndex = 0;
    score = 0;

    document.getElementById("categories").style.display = "none";
    document.getElementById("quiz").style.display = "block";

    showQuestion();
}

// Mostrar pergunta e opções
function showQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        return endGame();
    }

    const currentQuestion = currentQuestions[currentQuestionIndex];
    document.getElementById("question").innerText = currentQuestion.question;

    const optionsContainer = document.getElementById("options");
    optionsContainer.innerHTML = "";

    currentQuestion.options.forEach((option, index) => {
        const btn = document.createElement("button");
        btn.innerText = option;
        btn.classList.add("option-btn");
        btn.addEventListener("click", () => checkAnswer(index));
        optionsContainer.appendChild(btn);
    });
}

// Verificar resposta
function checkAnswer(selectedIndex) {
    const currentQuestion = currentQuestions[currentQuestionIndex];

    if (selectedIndex === currentQuestion.answer) {
        score++;
    }

    currentQuestionIndex++;
    showQuestion();
}

// Finalizar jogo
function endGame() {
    document.getElementById("quiz").style.display = "none";
    const result = document.getElementById("result");
    result.style.display = "block";
    result.innerHTML = `
        <h2>Fim do Jogo!</h2>
        <p>Você acertou ${score} de ${currentQuestions.length} perguntas em ${currentCategory}.</p>
        <button onclick="restartGame()">Jogar novamente</button>
    `;
}

// Reiniciar
function restartGame() {
    document.getElementById("result").style.display = "none";
    document.getElementById("quiz").style.display = "none";
    document.getElementById("categories").style.display = "block";
}

// Carregar quando a página abrir
window.onload = loadQuestionsFromJSON;
