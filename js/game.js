/* game.js - versão corrigida
   Funcionalidades:
   - carrega perguntas de perguntas.json
   - preenche select de categorias
   - recebe nome do jogador
   - sorteia 30 perguntas ao iniciar
   - mostra perguntas e opções
   - pontuação (0-100) calculada proporcionalmente
   - salva ranking em localStorage (nome, pontos, categoria, data)
   - botão ver ranking mostra ranking salvo
   - botão exportar perguntas baixa CSV com todo o banco de perguntas
*/

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
  // embaralha e pega até 30 (ou menos se não houver)
  currentQuestions = allQ.slice().sort(()=>0.5 - Math.random()).slice(0,30);

  currentQuestionIndex = 0;
  score = 0;

  // trocar telas
  document.getElementById('start-screen').classList.remove('active');
  document.getElementById('ranking-screen').classList.remove('active');
  document.getElementById('question-screen').classList.add('active');

  showQuestion();
}

function showQuestion(){
  if(currentQuestionIndex >= currentQuestions.length){
    return endGame();
  }
  const q = currentQuestions[currentQuestionIndex];
  const titleEl = document.getElementById('question-title');
  if(titleEl) titleEl.textContent = `Pergunta ${currentQuestionIndex+1} de ${currentQuestions.length}`;

  const questionEl = document.querySelector('#question-screen .question');
  questionEl.textContent = q.question || 'Pergunta sem texto';

  const optionsContainer = document.querySelector('#question-screen .options');
  optionsContainer.innerHTML = '';
  if(Array.isArray(q.options) && q.options.length){
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.textContent = opt;
      btn.addEventListener('click', () => checkAnswer(i));
      optionsContainer.appendChild(btn);
    });
  } else {
    optionsContainer.innerHTML = '<p>⚠️ Sem opções</p>';
  }
}

function checkAnswer(i){
  const correct = currentQuestions[currentQuestionIndex].answer;
  if(typeof correct !== 'undefined' && correct === i){
    // pontuação proporcional: total 100
    score += 100 / currentQuestions.length;
  }
  currentQuestionIndex++;
  showQuestion();
}

function endGame(){
  // salva ranking no localStorage
  const ranking = JSON.parse(localStorage.getItem('agroplay_ranking') || '[]');
  const entry = {
    name: playerName || 'Anônimo',
    points: Number(score.toFixed(1)),
    category: currentCategory || '',
    date: new Date().toLocaleString()
  };
  ranking.push(entry);
  // ordena decrescente por pontos
  ranking.sort((a,b)=>b.points - a.points);
  localStorage.setItem('agroplay_ranking', JSON.stringify(ranking));

  // mostra tela de ranking
  document.getElementById('question-screen').classList.remove('active');
  document.getElementById('ranking-screen').classList.add('active');

  renderRanking();
}

function renderRanking(){
  const table = document.getElementById('ranking-table');
  if(!table) return;
  // header já está no HTML; remove demais linhas
  table.innerHTML = '<tr><th>Jogador</th><th>Pontos</th><th>Categoria</th><th>Data</th></tr>';
  const ranking = JSON.parse(localStorage.getItem('agroplay_ranking') || '[]');
  ranking.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(r.name)}</td><td>${r.points}</td><td>${escapeHtml(r.category)}</td><td>${r.date}</td>`;
    table.appendChild(tr);
  });
}

// helper para evitar injeção simples
function escapeHtml(str){
  if(!str) return '';
  return String(str).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])});
}

// botões auxiliares
function setupButtons(){
  const startBtn = document.getElementById('start-game-btn');
  if(startBtn) startBtn.addEventListener('click', startGame);

  const rankingBtn = document.getElementById('ranking-btn');
  if(rankingBtn) rankingBtn.addEventListener('click', () => {
    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('question-screen').classList.remove('active');
    document.getElementById('ranking-screen').classList.add('active');
    renderRanking();
  });

  const exportBtn = document.getElementById('export-questions-btn');
  if(exportBtn) exportBtn.addEventListener('click', exportQuestionsCSV);

  const btnVoltar = document.getElementById('btn-voltar');
  if(btnVoltar) btnVoltar.addEventListener('click', () => {
    if(confirm('Deseja realmente sair do jogo e voltar ao menu?')){
      document.getElementById('question-screen').classList.remove('active');
      document.getElementById('start-screen').classList.add('active');
      // limpa estado
      currentQuestions = [];
      currentQuestionIndex = 0;
      score = 0;
      currentCategory = null;
    }
  });

  const backMenu = document.getElementById('back-menu-btn');
  if(backMenu) backMenu.addEventListener('click', () => {
    document.getElementById('ranking-screen').classList.remove('active');
    document.getElementById('start-screen').classList.add('active');
  });

  const clearRanking = document.getElementById('clear-ranking-btn');
  if(clearRanking) clearRanking.addEventListener('click', () => {
    if(confirm('Limpar ranking? Essa ação não pode ser desfeita.')){
      localStorage.removeItem('agroplay_ranking');
      renderRanking();
    }
  });
}

// gera e baixa CSV com o conteúdo de perguntas.json (todo banco)
async function exportQuestionsCSV(){
  try {
    const resp = await fetch('perguntas.json');
    if(!resp.ok) throw new Error('Erro ao baixar perguntas.json');
    const data = await resp.json();
    // formato simplificado CSV: categoria,pergunta,op1,op2,op3,op4,answerIndex
    const lines = ['categoria,pergunta,op1,op2,op3,op4,answerIndex'];
    Object.keys(data).forEach(cat => {
      (data[cat] || []).forEach(q => {
        const row = [
          csvEscape(cat),
          csvEscape(q.question || ''),
          csvEscape((q.options && q.options[0]) || ''),
          csvEscape((q.options && q.options[1]) || ''),
          csvEscape((q.options && q.options[2]) || ''),
          csvEscape((q.options && q.options[3]) || ''),
          (typeof q.answer === 'number') ? q.answer : ''
        ];
        lines.push(row.join(','));
      });
    });
    const blob = new Blob([lines.join('\n')], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'perguntas_agroplay.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch(err){
    console.error(err);
    alert('Erro ao exportar CSV — veja console.');
  }
}

function csvEscape(s){
  if(s == null) return '';
  // envolve em aspas se tiver vírgula/aspas/nova linha e escapa aspas
  const str = String(s).replace(/"/g,'""');
  if(/[,\"\n]/.test(str)) return `"${str}"`;
  return str;
}

// inicialização quando DOM pronto
document.addEventListener('DOMContentLoaded', () => {
  loadQuestionsFromJSON();
  setupButtons();
});
}
