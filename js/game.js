/* game.js - versão corrigida */

let questionsData = {};
let currentCategory = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let playerName = '';

async function loadQuestionsFromJSON(){
  try {
    const resp = await fetch('perguntas.json');
    if(!resp.ok) throw new Error('Erro ao carregar perguntas.json');
    questionsData = await resp.json();
    // preenche select
    const select = document.getElementById('tema-select');
    if(!select) return;
    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '-- escolha um tema --';
    select.appendChild(placeholder);
    Object.keys(questionsData).forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });
  } catch(err){
    console.error(err);
    alert('Erro ao carregar perguntas.json — veja console.');
  }
}

function startGame(){
  const nameInput = document.getElementById('player-name');
  const select = document.getElementById('tema-select');

  if(!nameInput || !select){
    alert('Elementos obrigatórios não encontrados.');
    return;
  }

  const name = nameInput.value.trim();
  if(!name){
    alert('Por favor digite seu nome antes de iniciar.');
    return;
  }

  const tema = select.value;
  if(!tema){
    alert('Por favor selecione uma categoria.');
    return;
  }

  playerName = name;
  currentCategory = tema;

  const allQ = questionsData[currentCategory] || [];
  // embaralha e pega até 30
  currentQuestions = allQ.slice().sort(()=>0.5 - Math.random()).slice(0,30);

  currentQuestionIndex = 0;
  score = 0;

  document.getElementById('start-scr
