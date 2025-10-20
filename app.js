// app.js — minimal logic with bunny happy/sad swap
let score = 0;
const correctAnswer = "4"; // change later to dynamic
const scoreEl = document.getElementById('score');
const feedback = document.getElementById('feedback');
const bunny = document.getElementById('bunny');
const bunnyWrap = document.getElementById('bunnyWrap');

document.querySelectorAll('.choice').forEach(btn=>{
  btn.addEventListener('click', e=>{
    const val = e.target.textContent.trim();
    // prevent double-click spam visual glitch
    disableChoices(true);
    if(val === correctAnswer) {
      handleCorrect(e.target);
    } else {
      handleWrong(e.target);
    }
    // re-enable after animations finish
    setTimeout(()=> disableChoices(false), 750);
  });
});

function handleCorrect(btn){
  score = Math.max(0, score + 10);
  updateScore();
  feedback.textContent = "Nice — correct!";
  // swap bunny image to happy, jump, glow
  setBunny('assets/bunny-happy.png');
  bunny.classList.add('jump');
  bunnyWrap.classList.add('bunny-happy-glow');
  scoreEl.classList.add('scorePulse');

  // cleanup after animation
  setTimeout(()=>{
    bunny.classList.remove('jump');
    bunnyWrap.classList.remove('bunny-happy-glow');
    scoreEl.classList.remove('scorePulse');
    setBunny('assets/bunny-neutral.png');
  }, 700);
}

function handleWrong(btn){
  score = Math.max(0, score - 5);
  updateScore();
  feedback.textContent = "Oops — not this time.";
  // swap to sad, shake, dim
  setBunny('assets/bunny-sad.png');
  bunny.classList.add('sadShake');
  bunnyWrap.classList.add('bunny-sad-dim');

  setTimeout(()=>{
    bunny.classList.remove('sadShake');
    bunnyWrap.classList.remove('bunny-sad-dim');
    setBunny('assets/bunny-neutral.png');
  }, 700);
}

function setBunny(src){
  // small safety: only swap if src is different
  if(bunny.src && bunny.src.endsWith(src)) return;
  bunny.src = src;
}

function updateScore(){ scoreEl.textContent = `Score: ${score}`; }

function disableChoices(disable){
  document.querySelectorAll('.choice').forEach(c=>{
    c.disabled = disable;
    c.style.pointerEvents = disable ? 'none' : 'auto';
    c.setAttribute('aria-disabled', disable);
  });
}
