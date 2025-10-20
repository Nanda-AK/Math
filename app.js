// app.js — hint button + attempts_allowed awareness + defensive loading
let score = 0;
let questions = [];
let pool = [];
let current = null;
let selectedOption = null;
let attemptsLeft = null;
let hintUsed = false;

const scoreEl = document.getElementById('score');
const questionEl = document.getElementById('question');
const choicesWrap = document.getElementById('choices');
const feedback = document.getElementById('feedback');
const explanationEl = document.getElementById('explanation');
const checkBtn = document.getElementById('checkBtn');
const skipBtn = document.getElementById('skipBtn');
const hintBtn = document.getElementById('hintBtn');
const attemptsInfo = document.getElementById('attemptsInfo');
const bunny = document.getElementById('bunny');
const bunnyWrap = document.getElementById('bunnyWrap');

// status area
let statusEl = document.getElementById('status');
if(!statusEl){
  statusEl = document.createElement('div');
  statusEl.id = 'status';
  statusEl.style.margin = '8px 0 12px';
  statusEl.style.fontSize = '.95rem';
  statusEl.style.color = '#666';
  const card = document.getElementById('questionCard');
  if(card) card.insertBefore(statusEl, card.firstChild.nextSibling);
  else document.body.prepend(statusEl);
}

status('Initializing...');

// load questions.json
fetch('questions.json', {cache: "no-store"})
  .then(resp => {
    if(!resp.ok) throw new Error(`Network response not OK (status ${resp.status})`);
    return resp.text().then(text => ({text, resp}));
  })
  .then(obj => {
    try {
      const data = JSON.parse(obj.text);
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
      fallbackQuestions(parseErr);
    }
  })
  .catch(err => {
    console.error('Fetch error for questions.json:', err);
    status('Could not fetch questions.json — using fallback questions. Check file path and repo settings.');
    fallbackQuestions(err);
  });

function status(msg){ statusEl.textContent = msg; console.log('[STATUS]', msg); }

function fallbackQuestions(err){
  console.log('Fallback triggered due to:', err);
  questions = [
    { question: "Sample: What is 2 + 2?", options: {A:"3",B:"4",C:"5",D:"22"}, correct_option: "B", explanation:"2+2=4", attempts_allowed: 2, hint: "Add two and two." },
    { question: "Sample: Blue + Yellow = ?", options: {A:"Green",B:"Purple",C:"Orange",D:"Brown"}, correct_option: "A", explanation:"Blue + Yellow = Green.", attempts_allowed: 1, hint: "Think primary colors." }
  ];
  pool = shuffle([...questions]);
  status('Using 2 fallback questions. Fix questions.json to use your real pool.');
  loadNextQuestion();
}

function shuffle(arr){
  for(let i = arr.length-1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function loadNextQuestion(){
  selectedOption = null;
  hintUsed = false;
  feedback.textContent = '';
  explanationEl.textContent = '';
  checkBtn.textContent = 'Check answer';
  checkBtn.disabled = true;
  hintBtn.disabled = true;
  attemptsInfo.textContent = '';

  if(pool.length === 0){
    pool = shuffle([...questions]);
    status('Re-shuffled question pool.');
  } else {
    status(`Questions remaining: ${pool.length}`);
  }

  current = pool.shift();
  if(!current){
    questionEl.textContent = 'No question available';
    status('No question loaded.');
    return;
  }

  // set attemptsLeft from current or default 1
  attemptsLeft = (typeof current.attempts_allowed === 'number' && current.attempts_allowed > 0) ? current.attempts_allowed : 1;
  renderQuestion(current);
  updateAttemptsInfo();
  // enable hint if question has hint text
  hintBtn.disabled = !current.hint;
  hintBtn.textContent = current.hint ? 'Hint' : 'No Hint';
}

function renderQuestion(q){
  questionEl.textContent = q.question || 'Question missing text';
  choicesWrap.innerHTML = '';
  const opts = q.options;
  if(!opts || (typeof opts !== 'object')){
    console.warn('Invalid options for question:', q);
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

hintBtn.addEventListener('click', ()=> {
  if(!current || !current.hint) return;
  feedback.textContent = `Hint: ${current.hint}`;
  hintUsed = true;
  hintBtn.disabled = true;
  // optional: you can penalize hint use here by adjusting points — not implemented
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
    score = Math.max(0, score + (current.points || 10));
    feedback.textContent = 'Correct!';
    explanationEl.textContent = current.explanation || '';
    setBunny('assets/bunny-happy.png');
    bunny.classList.add('jump');
    bunnyWrap.classList.add('bunny-happy-glow');
    scoreEl.classList.add('scorePulse');
    updateScore();
    checkBtn.textContent = 'Next';
  } else {
    attemptsLeft = (typeof attemptsLeft === 'number') ? attemptsLeft - 1 : 0;
    // show wrong feedback and attempts remaining
    if(attemptsLeft > 0){
      score = Math.max(0, score - (current.points ? Math.ceil((current.points||10)/2) : 5)); // small penalty per wrong try
      feedback.textContent = `Wrong — ${attemptsLeft} attempt(s) left. Try again.`;
      explanationEl.textContent = '';
      setBunny('assets/bunny-sad.png');
      bunny.classList.add('sadShake');
      bunnyWrap.classList.add('bunny-sad-dim');
      updateScore();
      // allow retry: re-enable choices after short time
      setTimeout(()=> {
        disableChoices(false);
        // allow them to change selection; keep Check enabled only if a selection exists
        checkBtn.disabled = !selectedOption;
      }, 600);
    } else {
      // attempts exhausted — reveal answer and move to Next
      score = Math.max(0, score - (current.points || 5));
      feedback.textContent = `No attempts left. Correct answer: ${correct}.`;
      explanationEl.textContent = current.explanation || '';
      setBunny('assets/bunny-sad.png');
      bunny.classList.add('sadShake');
      bunnyWrap.classList.add('bunny-sad-dim');
      updateScore();
      checkBtn.textContent = 'Next';
    }
    updateAttemptsInfo();
  }

  // cleanup visuals after short time
  setTimeout(()=> {
    bunny.classList.remove('jump','sadShake');
    bunnyWrap.classList.remove('bunny-happy-glow','bunny-sad-dim');
    scoreEl.classList.remove('scorePulse');
  }, 700);
}

function updateScore(){ scoreEl.textContent = `Score: ${score}`; }

function setBunny(src){
  const img = new Image();
  img.onload = ()=> { bunny.src = src; };
  img.onerror = ()=> {
    console.warn('Failed to load bunny asset:', src);
    if(!src.endsWith('bunny-neutral.png')) setBunny('assets/bunny-neutral.png');
    else bunny.removeAttribute('src');
  };
  img.src = src;
}

function updateAttemptsInfo(){
  if(typeof attemptsLeft === 'number'){
    attemptsInfo.textContent = `Attempts left: ${attemptsLeft}`;
  } else {
    attemptsInfo.textContent = '';
  }
}

function disableChoices(dis){
  document.querySelectorAll('.choice').forEach(c=>{
    c.disabled = dis;
    c.style.pointerEvents = dis ? 'none' : 'auto';
  });
}
