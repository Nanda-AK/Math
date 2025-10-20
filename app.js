// app.js — improved error handling, schema checks and fallback
let score = 0;
let questions = [];
let pool = [];
let current = null;
let selectedOption = null;

const scoreEl = document.getElementById('score');
const questionEl = document.getElementById('question');
const choicesWrap = document.getElementById('choices');
const feedback = document.getElementById('feedback');
const explanationEl = document.getElementById('explanation');
const checkBtn = document.getElementById('checkBtn');
const skipBtn = document.getElementById('skipBtn');
const bunny = document.getElementById('bunny');
const bunnyWrap = document.getElementById('bunnyWrap');

// create or reuse a status area so user sees what's happening
let statusEl = document.getElementById('status');
if(!statusEl){
  statusEl = document.createElement('div');
  statusEl.id = 'status';
  statusEl.style.margin = '8px 0 12px';
  statusEl.style.fontSize = '.95rem';
  statusEl.style.color = '#666';
  // put status just above question if possible
  const card = document.getElementById('questionCard');
  if(card) card.insertBefore(statusEl, card.firstChild.nextSibling);
  else document.body.prepend(statusEl);
}

status('Initializing...');

// Try to load questions.json from repo root
fetch('questions.json', {cache: "no-store"})
  .then(resp => {
    if(!resp.ok) {
      throw new Error(`Network response not OK (status ${resp.status})`);
    }
    // clone text to help debug invalid JSON (shows snippet)
    return resp.text().then(text => ({text, resp}));
  })
  .then(obj => {
    try {
      const data = JSON.parse(obj.text);
      // validate structure quickly
      if(!Array.isArray(data) || data.length === 0) throw new Error('Parsed JSON is not a non-empty array.');
      const invalid = data.find(q => !q.question || !q.options || !q.correct_option);
      if(invalid) throw new Error('One or more questions missing required fields (question/options/correct_option).');
      questions = data;
      pool = shuffle([...questions]);
      status(`Loaded ${questions.length} questions.`);
      loadNextQuestion();
    } catch(parseErr) {
      console.error('JSON parse/validation error:', parseErr);
      status('Failed to parse/validate questions.json — using fallback questions. See console for details.');
      // fallback to sample
      fallbackQuestions(parseErr);
    }
  })
  .catch(err => {
    console.error('Fetch error for questions.json:', err);
    status('Could not fetch questions.json — using fallback questions. Check file path and repo settings.');
    fallbackQuestions(err);
  });

// ---------- Helper / UI functions ----------

function status(msg){
  statusEl.textContent = msg;
  console.log('[STATUS]', msg);
}

function fallbackQuestions(err){
  // err may include message; keep it in console
  console.log('Fallback triggered due to:', err);
  questions = [
    {
      question: "Sample: What is 2 + 2?",
      options: {A: "3", B: "4", C: "5", D: "22"},
      correct_option: "B",
      explanation: "2 + 2 equals 4."
    },
    {
      question: "Sample: Which color mixes to make green?",
      options: {A: "Red + Blue", B: "Blue + Yellow", C: "Red + Yellow", D: "Black + White"},
      correct_option: "B",
      explanation: "Blue + Yellow = Green."
    }
  ];
  pool = shuffle([...questions]);
  status('Using 2 fallback questions. Fix questions.json to use your real pool.');
  loadNextQuestion();
}

// shuffle (Fisher-Yates)
function shuffle(arr){
  for(let i = arr.length-1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function loadNextQuestion(){
  selectedOption = null;
  feedback.textContent = '';
  explanationEl.textContent = '';
  checkBtn.textContent = 'Check answer';
  checkBtn.disabled = true;

  if(pool.length === 0){
    pool = shuffle([...questions]);
    status('Re-shuffled question pool.');
  } else {
    status(`Questions remaining _Branch_1: ${pool.length}`);
  }

  current = pool.shift();
  if(!current){
    questionEl.textContent = 'No question available';
    status('No question loaded.');
    return;
  }
  renderQuestion(current);
}

function renderQuestion(q){
  questionEl.textContent = q.question || 'Question missing text';
  choicesWrap.innerHTML = '';

  // if options is not object, try array or fallback
  const opts = q.options;
  if(!opts || (typeof opts !== 'object')) {
    console.warn('Invalid options for question:', q);
    // render a single disabled item so UI doesn't break
    const btn = document.createElement('button');
    btn.className = 'choice';
    btn.disabled = true;
    btn.textContent = 'Invalid options';
    choicesWrap.appendChild(btn);
    return;
  }

  Object.entries(opts).forEach(([key, text])=>{
    const btn = document.createElement('button');
    btn.className = 'choice';
    btn.type = 'button';
    btn.textContent = `${key}. ${text}`;
    btn.dataset.opt = key;
    btn.setAttribute('aria-checked', 'false');
    btn.addEventListener('click', ()=> onSelectOption(btn));
    choicesWrap.appendChild(btn);
  });
}

function onSelectOption(btn){
  document.querySelectorAll('.choice').forEach(c=>{
    c.setAttribute('aria-checked','false');
  });
  btn.setAttribute('aria-checked','true');
  selectedOption = btn.dataset.opt;
  checkBtn.disabled = false;
}

checkBtn.addEventListener('click', ()=>{
  if(checkBtn.textContent === 'Check answer'){
    if(!selectedOption){
      feedback.textContent = 'Select an option first.';
      return;
    }
    evaluateAnswer();
  } else {
    // Next
    loadNextQuestion();
    setBunny('assets/bunny-neutral.png');
  }
});

skipBtn.addEventListener('click', ()=> {
  feedback.textContent = 'Skipped';
  explanationEl.textContent = '';
  setTimeout(()=> loadNextQuestion(), 220);
});

function evaluateAnswer(){
  disableChoices(true);
  const correct = current.correct_option;
  if(typeof correct === 'undefined' || correct === null){
    feedback.textContent = 'This question has no correct_option defined.';
    console.error('Missing correct_option for question:', current);
    checkBtn.textContent = 'Next';
    return;
  }

  if(selectedOption === correct){
    score = Math.max(0, score + 10);
    feedback.textContent = 'Correct!';
    explanationEl.textContent = current.explanation || '';
    setBunny('assets/bunny-happy.png');
    bunny.classList.add('jump');
    bunnyWrap.classList.add('bunny-happy-glow');
    scoreEl.classList.add('scorePulse');
  } else {
    score = Math.max(0, score - 5);
    feedback.textContent = `Wrong — correct is ${correct}.`;
    explanationEl.textContent = current.explanation || '';
    setBunny('assets/bunny-sad.png');
    bunny.classList.add('sadShake');
    bunnyWrap.classList.add('bunny-sad-dim');
  }
  updateScore();
  checkBtn.textContent = 'Next';

  setTimeout(()=> {
    bunny.classList.remove('jump','sadShake');
    bunnyWrap.classList.remove('bunny-happy-glow','bunny-sad-dim');
    scoreEl.classList.remove('scorePulse');
    disableChoices(false);
  }, 700);
}

function updateScore(){ scoreEl.textContent = `Score: ${score}`; }

function setBunny(src){
  // defensive: try to load and fallback to neutral if image 404
  const img = new Image();
  img.onload = ()=> { bunny.src = src; };
  img.onerror = ()=> {
    console.warn('Failed to load bunny asset:', src);
    // if neutral exists, use it, otherwise remove src
    if(!src.endsWith('bunny-neutral.png')){
      setBunny('assets/bunny-neutral.png');
    } else {
      bunny.removeAttribute('src');
    }
  };
  img.src = src;
}

function disableChoices(dis){
  document.querySelectorAll('.choice').forEach(c=>{
    c.disabled = dis;
    c.style.pointerEvents = dis ? 'none' : 'auto';
  });
}
