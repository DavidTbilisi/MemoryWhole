// ── Deck group definitions for subset config ───────────────────────────────
const CONFIG_GROUPS = {
  major: Array.from({ length: 10 }, (_, i) => ({
    label: `${i * 10}–${i * 10 + 9}`,
    keys:  Array.from({ length: 10 }, (_, j) => String(i * 10 + j))
  })),
  sem3: [
    ['Vision','0'],['Sound','1'],['Smell','2'],['Taste','3'],['Touch','4'],
    ['Sensation','5'],['Animals','6'],['Birds','7'],['Rainbow','8'],['Solar-System','9']
  ].map(([label, prefix]) => ({
    label,
    keys: Object.keys(SEM3_DATA).filter(k => k[0] === prefix)
  })),
  months: [
    { label: '1–11',  keys: Array.from({ length: 11 }, (_, i) => String(i + 1))  },
    { label: '12–22', keys: Array.from({ length: 11 }, (_, i) => String(i + 12)) },
    { label: '23–33', keys: Array.from({ length: 11 }, (_, i) => String(i + 23)) },
  ],
  clocks: [
    { label: '00–05', keys: ['00:00','01:00','02:00','03:00','04:00','05:00'] },
    { label: '06–11', keys: ['06:00','07:00','08:00','09:00','10:00','11:00'] },
    { label: '12–17', keys: ['12:00','13:00','14:00','15:00','16:00','17:00'] },
    { label: '18–23', keys: ['18:00','19:00','20:00','21:00','22:00','23:00'] },
  ],
  calendar: [
    { label: 'All Months', keys: Array.from({ length: 12 }, (_, i) => String(i + 1)) },
  ],
  bibleoverview: [
    { label: 'All Sections', keys: Array.from({ length: 10 }, (_, i) => String(i + 1)) },
  ],
  biblebooks: [
    { label: 'Torah 1–5',            keys: ['1','2','3','4','5'] },
    { label: 'History 6–17',         keys: ['6','7','8','9','10','11','12','13','14','15','16','17'] },
    { label: 'Wisdom 18–22',         keys: ['18','19','20','21','22'] },
    { label: 'Maj. Prophets 23–27',  keys: ['23','24','25','26','27'] },
    { label: 'Min. Prophets 28–39',  keys: ['28','29','30','31','32','33','34','35','36','37','38','39'] },
    { label: 'Gospels 40–43',        keys: ['40','41','42','43'] },
    { label: 'Acts 44',              keys: ['44'] },
    { label: 'Pauline 45–57',        keys: ['45','46','47','48','49','50','51','52','53','54','55','56','57'] },
    { label: 'General 58–65',        keys: ['58','59','60','61','62','63','64','65'] },
    { label: 'Revelation 66',        keys: ['66'] },
  ],
};

const DECK_NAMES = {
  major: 'Major System', sem3: 'SEM3',
  months: 'Month Days', clocks: 'Famous Clocks',
  calendar: 'Calendar Months',
  bibleoverview: 'Bible Overview',
  biblebooks: 'Bible Books'
};

// ── Quiz config screen ─────────────────────────────────────────────────────
function showQuizConfig(deck) {
  activeDeck = deck || activeDeck;
  document.getElementById('config-title').textContent = DECK_NAMES[activeDeck] || activeDeck;

  const groups = CONFIG_GROUPS[activeDeck] || [];
  const grid = document.getElementById('config-grid');
  grid.innerHTML = '';
  groups.forEach(group => {
    const btn = document.createElement('button');
    btn.className = 'subset-btn active';
    btn.textContent = group.label;
    btn.dataset.keys = JSON.stringify(group.keys);
    btn.onclick = () => btn.classList.toggle('active');
    grid.appendChild(btn);
  });

  setView('quiz-config');
}

function configToggleAll() {
  const btns = document.querySelectorAll('.subset-btn');
  const anyOff = [...btns].some(b => !b.classList.contains('active'));
  btns.forEach(b => b.classList.toggle('active', anyOff));
}

function startQuizFromConfig() {
  const selected = [...document.querySelectorAll('.subset-btn.active')];
  const subsetKeys = selected.flatMap(b => JSON.parse(b.dataset.keys));
  if (subsetKeys.length < 6) {
    alert('Select at least 6 items to quiz.');
    return;
  }
  showQuiz(activeDeck, subsetKeys);
}

// ── Quiz ───────────────────────────────────────────────────────────────────
function showQuiz(deck, subsetKeys) {
  activeDeck = deck || activeDeck;
  data = loadDeckData(activeDeck);

  // Apply subset filter
  if (subsetKeys && subsetKeys.length) {
    const keySet = new Set(subsetKeys.map(String));
    data = Object.fromEntries(Object.entries(data).filter(([k]) => keySet.has(k)));
  }

  const pool = Object.values(data).filter(v => v && v.trim());
  if (pool.length < 6) {
    alert('You need at least 6 associations defined to quiz.');
    return;
  }

  isReplaying = false;
  replayQueue = [];
  loadWeights(activeDeck);
  score = { correct: 0, wrong: 0, streak: 0, times: [] };
  numStats = {};
  updateScoreBar();
  setReplayBanner(false);
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

  const fullPool = Object.entries(data).filter(([, v]) => v && v.trim());

  // During replay: pick from the mistake queue; distractors still come from full pool
  let num, word;
  if (isReplaying) {
    const idx = Math.floor(Math.random() * replayQueue.length);
    [num, word] = [replayQueue[idx], data[replayQueue[idx]]];
  } else {
    [num, word] = weightedRandom(fullPool);
  }

  currentAnswer = word.trim();
  currentNum = num;

  const numEl = document.getElementById('q-number');
  numEl.textContent = num;
  numEl.className = 'number-display' + (String(num).length > 2 ? ' long' : '');

  const wrongs = fullPool
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

  const isCorrect = chosen === currentAnswer;

  if (!isReplaying) {
    updateWeight(currentNum, isCorrect, elapsed);
    saveWeights(activeDeck);
  }

  const fb = document.getElementById('q-feedback');
  if (isCorrect) {
    clickedBtn.classList.add('correct-ans');
    fb.textContent = `✓ Correct! (${elapsed.toFixed(1)}s)`;
    fb.className = 'feedback correct';
    score.correct++;
    score.streak++;
    numStats[currentNum].correct++;
    updateScoreBar();

    if (isReplaying) {
      replayQueue = replayQueue.filter(k => k !== currentNum);
      updateReplayBanner();
      if (replayQueue.length === 0) {
        setTimeout(() => { isReplaying = false; setReplayBanner(false); recordQuizSession(activeDeck, numStats); showStats(); }, 900);
        return;
      }
    }
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

// ── Finish & mistake replay ────────────────────────────────────────────────
function finishQuiz() {
  clearInterval(timerInterval);
  timerInterval = null;

  const wrongKeys = Object.entries(numStats)
    .filter(([, s]) => s.wrong > 0)
    .map(([k]) => k)
    .filter(k => data[k]);   // only keys present in current data slice

  if (wrongKeys.length > 0) {
    isReplaying = true;
    replayQueue = wrongKeys;
    score = { correct: 0, wrong: 0, streak: 0, times: [] };
    updateScoreBar();
    setReplayBanner(true, wrongKeys.length);
    setView('quiz');
    nextQuestion();
  } else {
    recordQuizSession(activeDeck, numStats);
    showStats();
  }
}

function setReplayBanner(visible, total) {
  const banner = document.getElementById('replay-banner');
  banner.style.display = visible ? 'flex' : 'none';
  if (visible) updateReplayBanner(total);
}

function updateReplayBanner() {
  const total = Object.entries(numStats).filter(([, s]) => s.wrong > 0).length;
  const done  = total - replayQueue.length;
  document.getElementById('replay-progress').textContent = `${done} / ${total}`;
}
