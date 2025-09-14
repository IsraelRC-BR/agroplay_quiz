/* js/game.js - versão final revisada */

let questionsData = {};
let currentCategory = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let playerName = "";

/* ---------------- utilitários ---------------- */
function shuffleArray(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function csvEscape(s) {
  if (s == null) return "";
  const str = String(s).replace(/"/g, '""');
  if (/[,"\n]/.test(str)) return `"${str}"`;
  return str;
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

/* Normaliza uma pergunta */
function normalizeQuestion(q, fallbackIndex) {
  if (!q || !q.question) return null;
  const out = {};
  out.question = String(q.question).trim();

  let opts = Array.isArray(q.options) ? q.options.slice() : [];
  for (let i = opts.length; i < 4; i++) opts.push(`Opção ${i+1}`);
  if (opts.length > 4) opts = opts.slice(0,4);
  out.options = opts.map(o => String(o));

  let a = (typeof q.answer === 'number') ? q.answer : null;
  if (a === null || a < 0 || a > 3) {
    a = fallbackIndex % 4;
  }
  out.answer = a;
  return out;
}

/* ---------------- carregamento ---------------- */
async function loadQuestionsFromJSON() {
  try {
    const resp = await fetch('perguntas.json');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const raw = await resp.json();

    const normalized = {};
    Object.keys(raw || {}).forEach(cat => {
      const list = Array.isArray(raw[cat]) ? raw[cat] : [];
      const cleaned = [];
      for (let i = 0; i < list.length; i++) {
        const nq = normalizeQuestion(list[i], i);
        if (nq) cleaned.push(nq);
      }
      normalized[cat] = cleaned;
    });

    questionsData = normalized;
    populateCategorySelect();
    console.log("Categorias carregadas:", Object.keys(questionsData));
  } catch (err) {
    console.error("Erro ao carregar perguntas.json:", err);
    alert("Erro ao carregar perguntas.json");
  }
}

function populateCategorySelect() {
  const select = document.getElementById('tema-select');
  if (!select) return;
  select.innerHTML = '';
  const ph = document.createElement('option');
  ph.value = '';
  ph.textContent = '-- escolha um tema --';
  select.appendChild(ph);

  const cats = Object.keys(questionsData).sort();
  cats.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = `${cat} (${questionsData[cat].length})`;
    select.appendChild(opt);
  });
}

/* ---------------- fluxo do jogo ---------------- */
function startGame() {
  const nameEl = document.getElementById('player-name');
  const select = document.getElementById('tema-select');

  if (!nameEl || !select) { alert('Campos não encontrados'); return; }

  const name = String(nameEl.value || '').trim();
  const tema = select.value;

  if (!name) { alert('Digite seu nome antes de iniciar'); return; }
  if (!tema) { alert('Selecione uma categoria'); return; }

  playerName = name;
  currentCategory = tema;

  const pool = Array.isArray(questionsData[currentCategory]) ? questionsData[currentCategory].slice() : [];
  if (pool.length === 0) {
    alert('Essa categoria não possui perguntas válidas.');
    return;
  }
  shuffleArray(pool);
  currentQuestions = pool.slice(0, 30);
  currentQuestionIndex = 0;
  score = 0;

  document.getElementById('start-screen')?.classList.remove('active');
  document.getElementById('ranking-screen')?.classList.remove('active');
  document.getElementById('question-screen')?.classList.add('active');

  showQuestion();
}

function showQuestion() {
  if (currentQuestionIndex >= currentQuestions.length) {
    return endGame();
  }

  const q = currentQuestions[currentQuestionIndex];

  const titleEl = document.getElementById('question-title');
  if (titleEl) titleEl.textContent = `Pergunta ${currentQuestionIndex + 1} de ${currentQuestions.length}`;

  const questionEl = document.querySelector('#question-screen .question');
  if (questionEl) questionEl.textContent = q.question || 'Pergunta sem texto';

  const optionsContainer = document.querySelector('#question-screen .options');
  if (!optionsContainer) return;
  optionsContainer.innerHTML = '';

  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = opt;
    btn.addEventListener('click', () => checkAnswer(i));
    optionsContainer.appendChild(btn);
  });
}

function checkAnswer(i) {
  const q = currentQuestions[currentQuestionIndex];
  if (q && typeof q.answer === 'number' && q.answer === i) {
    score += 100 / currentQuestions.length;
  }
  currentQuestionIndex++;
  setTimeout(showQuestion, 100);
}

/* ---------------- final do jogo / ranking ---------------- */
function endGame() {
  try {
    const ranking = JSON.parse(localStorage.getItem('agroplay_ranking') || '[]');
    const entry = {
      name: playerName || 'Anônimo',
      points: Number(score.toFixed(1)),
      category: currentCategory || '',
      date: new Date().toLocaleString()
    };
    ranking.push(entry);
    ranking.sort((a,b) => b.points - a.points);
    localStorage.setItem('agroplay_ranking', JSON.stringify(ranking));
  } catch (err) {
    console.error('Erro ao salvar ranking:', err);
  }

  document.getElementById('question-screen')?.classList.remove('active');
  document.getElementById('ranking-screen')?.classList.add('active');
  renderRanking();
}

function renderRanking() {
  const table = document.getElementById('ranking-table');
  if (!table) return;
  table.innerHTML = '<tr><th>Jogador</th><th>Pontos</th><th>Categoria</th><th>Data</th></tr>';
  const ranking = JSON.parse(localStorage.getItem('agroplay_ranking') || '[]');
  ranking.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(r.name)}</td><td>${r.points}</td><td>${escapeHtml(r.category)}</td><td>${r.date}</td>`;
    table.appendChild(tr);
  });
}

/* ---------------- exportação CSV ---------------- */
async function exportQuestionsCSV() {
  try {
    const resp = await fetch('perguntas.json');
    if (!resp.ok) throw new Error('Erro ao baixar perguntas.json');
    const data = await resp.json();
    const lines = ['categoria,pergunta,op1,op2,op3,op4,answerIndex'];
    Object.keys(data).forEach(cat => {
      (data[cat] || []).forEach(q => {
        const row = [
          csvEscape(cat),
          csvEscape(q.question || ''),
          csvEscape(q.options?.[0] || ''),
          csvEscape(q.options?.[1] || ''),
          csvEscape(q.options?.[2] || ''),
          csvEscape(q.options?.[3] || ''),
          (typeof q.answer === 'number') ? q.answer : ''
        ];
        lines.push(row.join(','));
      });
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'perguntas_agroplay.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert('Erro ao exportar CSV');
  }
}

/* ---------------- botões ---------------- */
function setupButtons() {
  document.getElementById('start-game-btn')?.addEventListener('click', startGame);
  document.getElementById('ranking-btn')?.addEventListener('click', () => {
    document.getElementById('start-screen')?.classList.remove('active');
    document.getElementById('ranking-screen')?.classList.add('active');
    renderRanking();
  });
  document.getElementById('export-questions-btn')?.addEventListener('click', exportQuestionsCSV);
  document.getElementById('btn-voltar')?.addEventListener('click', () => {
    if (confirm('Deseja sair do jogo e voltar ao menu?')) {
      document.getElementById('question-screen')?.classList.remove('active');
      document.getElementById('start-screen')?.classList.add('active');
    }
  });
  document.getElementById('back-menu-btn')?.addEventListener('click', () => {
    document.getElementById('ranking-screen')?.classList.remove('active');
    document.getElementById('start-screen')?.classList.add('active');
  });
  document.getElementById('clear-ranking-btn')?.addEventListener('click', () => {
    if (confirm('Limpar ranking?')) {
      localStorage.removeItem('agroplay_ranking');
      renderRanking();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadQuestionsFromJSON();
  setupButtons();
});
