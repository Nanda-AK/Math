// app.js — load questions.json, randomize, UI flow: Select -> Check -> Next; Skip works.
let score = 0;
let questions = [];
let pool = []; // shuffled
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

// load questions.json (file at repo root)
fetch('questions.json')
  .then(r => r.json())
  .then(data => {
    questions = data;
    pool = shuffle([...questions]); // random order
    loadNextQuestion();
  })
  .catch(err => {
    questionEl.textContent = 'Failed to load questions';
    console.error(err);
  });

// shuffle array (Fisher-Yates)
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
    // refill if needed (or show finished)
    pool = shuffle([...questions]);
  }
  current = pool.shift();
  renderQuestion(current);
}

function renderQuestion(q){
  questionEl.textContent = q.question;
  choicesWrap.innerHTML = '';
  Object.entries(q.options).forEach(([key, text])=>{
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

// when user picks an option
function onSelectOption(btn){
  // clear previous selection visual
  document.querySelectorAll('.choice').forEach(c=>{
    c.setAttribute('aria-checked','false');
  });
  btn.setAttribute('aria-checked','true');
  selectedOption = btn.dataset.opt;
  checkBtn.disabled = false;
}

// Check / Next button behavior
checkBtn.addEventListener('click', ()=>{
  if(checkBtn.textContent === 'Check answer'){
    if(!selectedOption) return;
    evaluateAnswer();
  } else {
    // Next
    loadNextQuestion();
    // reset bunny to neutral
    setBunny('assets/bunny-neutral.png');
  }
});

// Skip behavior
skipBtn.addEventListener('click', ()=> {
  // small visual reset and go next
  feedback.textContent = 'Skipped';
  explanationEl.textContent = '';
  setTimeout(()=> loadNextQuestion(), 220);
});

// evaluate current selection
function evaluateAnswer(){
  disableChoices(true);
  const correct = current.correct_option;
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
  // cleanup animations after short time
  setTimeout(()=> {
    bunny.classList.remove('jump','sadShake');
    bunnyWrap.classList.remove('bunny-happy-glow','bunny-sad-dim');
    scoreEl.classList.remove('scorePulse');
  }, 700);
}

function updateScore(){ scoreEl.textContent = `Score: ${score}`; }

function setBunny(src){
  // simple src set; GitHub Pages serves /assets/
  bunny.src = src;
}

function disableChoices(dis){
  document.querySelectorAll('.choice').forEach(c=>{
    c.disabled = dis;
    c.style.pointerEvents = dis ? 'none' : 'auto';
  });
}
