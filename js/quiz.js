function showQuiz(deck) {
  activeDeck = deck || activeDeck;
  const deckMap = { sem3: SEM3_DATA, months: MONTHS_DATA, clocks: CLOCKS_DATA };
  if (deckMap[activeDeck]) { data = deckMap[activeDeck]; } else { loadData(); }

  const pool = Object.values(data).filter(v => v && v.trim());
  if (pool.length < 6) {
    alert('You need at least 6 associations defined to quiz. Open the editor and fill in some words first.');
    return;
  }
  score = { correct: 0, wrong: 0, streak: 0, times: [] };
  numStats = {};
  updateScoreBar();
  document.getElementById('score-bar').classList.add('visible');
  setView('quiz');
  nextQuestion();
}

function startTimer() {
  clearInterval(timerInterval);
  questionStartTime = Date.now();
  const el = document.getElementById('q-timer');
  el.textContent = '0.0s';
  timerInterval = setInterval(() => {
    el.textContent = ((Date.now() - questionStartTime) / 1000).toFixed(1) + 's';
  }, 100);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  return (Date.now() - questionStartTime) / 1000;
}

function nextQuestion() {
  answering = false;
  const fb = document.getElementById('q-feedback');
  fb.textContent = '';
  fb.className = 'feedback';

  const pool = Object.entries(data).filter(([, v]) => v && v.trim());
  const [num, word] = pool[Math.floor(Math.random() * pool.length)];
  currentAnswer = word.trim();
  currentNum = num;

  const numEl = document.getElementById('q-number');
  numEl.textContent = num;
  numEl.className = 'number-display' + (String(num).length > 2 ? ' long' : '');

  const wrongs = pool
    .filter(([n]) => n !== num)
    .sort(() => Math.random() - 0.5)
    .slice(0, 5)
    .map(([, v]) => v.trim());

  const options = shuffle([currentAnswer, ...wrongs]);
  const grid = document.getElementById('q-answers');
  grid.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'ans-btn';
    btn.textContent = opt;
    btn.onclick = () => handleAnswer(btn, opt);
    grid.appendChild(btn);
  });

  startTimer();
}

function handleAnswer(clickedBtn, chosen) {
  if (answering) return;
  answering = true;

  const elapsed = stopTimer();
  document.getElementById('q-timer').textContent = elapsed.toFixed(1) + 's';
  score.times.push(elapsed);

  if (!numStats[currentNum]) numStats[currentNum] = { correct: 0, wrong: 0, totalTime: 0, attempts: 0 };
  numStats[currentNum].attempts++;
  numStats[currentNum].totalTime += elapsed;

  document.querySelectorAll('.ans-btn').forEach(b => (b.disabled = true));

  const fb = document.getElementById('q-feedback');
  if (chosen === currentAnswer) {
    clickedBtn.classList.add('correct-ans');
    fb.textContent = `✓ Correct! (${elapsed.toFixed(1)}s)`;
    fb.className = 'feedback correct';
    score.correct++;
    score.streak++;
    numStats[currentNum].correct++;
    updateScoreBar();
    setTimeout(nextQuestion, 900);
  } else {
    clickedBtn.classList.add('wrong-ans');
    document.querySelectorAll('.ans-btn').forEach(b => {
      if (b.textContent === currentAnswer) b.classList.add('correct-ans');
    });
    fb.textContent = `✗ It was: ${currentAnswer} (${elapsed.toFixed(1)}s)`;
    fb.className = 'feedback wrong';
    score.wrong++;
    score.streak = 0;
    numStats[currentNum].wrong++;
    updateScoreBar();
    setTimeout(nextQuestion, 1600);
  }
}
