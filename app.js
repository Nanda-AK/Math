// app.js
let score = 0;
const correctAnswer = "4";
const scoreEl = document.getElementById('score');
const feedback = document.getElementById('feedback');
document.querySelectorAll('.choice').forEach(btn=>{
  btn.addEventListener('click', e=>{
    const val = e.target.textContent.trim();
    if(val === correctAnswer) {
      doCorrect(e.target);
    } else {
      doWrong(e.target);
    }
  });
});

function doCorrect(btn){
  score = Math.max(0, score + 10);
  updateScore();
  feedback.textContent = "Nice — correct!";
  btn.classList.add('happy');
  scoreEl.classList.add('scorePulse');
  // small cleanup
  setTimeout(()=>{ btn.classList.remove('happy'); scoreEl.classList.remove('scorePulse'); }, 700);
}

function doWrong(btn){
  score = Math.max(0, score - 5);
  updateScore();
  feedback.textContent = "Oops — not this time.";
  btn.classList.add('sad');
  setTimeout(()=>{ btn.classList.remove('sad'); }, 600);
}

function updateScore(){ scoreEl.textContent = `Score: ${score}`; }
