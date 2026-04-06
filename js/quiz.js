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
  binary: [
    { label: '0000–0111', keys: ['0000','0001','0010','0011','0100','0101','0110','0111'] },
    { label: '1000–1111', keys: ['1000','1001','1010','1011','1100','1101','1110','1111'] },
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
  pegmatrix: Array.from({ length: 10 }, (_, r) => ({
    label: `${PEG_AUDIO[r]} ${r * 10}–${r * 10 + 9}`,
    keys:  Array.from({ length: 10 }, (_, c) => String(r * 10 + c).padStart(2, '0'))
  })),
  pegmatrixru: Array.from({ length: 10 }, (_, r) => ({
    label: `${PEG_AUDIO_RU[r]} ${r * 10}–${r * 10 + 9}`,
    keys:  Array.from({ length: 10 }, (_, c) => String(r * 10 + c).padStart(2, '0'))
  })),
  pao: [
    { label: 'Mononoke 0–10',       keys: ['0','1','2','3','4','5','6','7','8','9','10'] },
    { label: 'Death Note 11–20',    keys: ['11','12','13','14','15','16','17','18','19','20'] },
    { label: 'Naruto 21–30',        keys: ['21','22','23','24','25','26','27','28','29','30'] },
    { label: 'Avatar 31–40',        keys: ['31','32','33','34','35','36','37','38','39','40'] },
    { label: 'Mortal Combat 41–50', keys: ['41','42','43','44','45','46','47','48','49','50'] },
    { label: 'Sherlock 51–60',      keys: ['51','52','53','54','55','56','57','58','59','60'] },
    { label: 'Harry Potter 61–70',  keys: ['61','62','63','64','65','66','67','68','69','70'] },
    { label: 'Matrix 71–80',        keys: ['71','72','73','74','75','76','77','78','79','80'] },
    { label: 'Caribbean 81–90',     keys: ['81','82','83','84','85','86','87','88','89','90'] },
    { label: 'GOT 91–99',           keys: ['91','92','93','94','95','96','97','98','99'] },
  ],
};

const DECK_NAMES = {
  major: 'Major System', sem3: 'SEM3',
  months: 'Month Days', clocks: 'Famous Clocks',
  calendar: 'Calendar Months',
  bibleoverview: 'Bible Overview',
  biblebooks: 'Bible Books',
  binary: 'Binary (4-bit)',
  pao: 'PAO System',
  pegmatrix:   'Peg Matrix',
  pegmatrixru: 'Пег Матрица RU'
};

const DECK_QUESTION_LABELS = {
  major:         "What's the word?",
  sem3:          "What's the image?",
  clocks:        "Which clock?",
  calendar:      "What's the icon?",
  binary:        "What's the image?",
  biblebooks:    "Which book?",
  bibleoverview: "Which section?",
  pao:           "Who is it?",
  pegmatrix:     "Audio + Visual peg?",
  pegmatrixru:   "Звук + Образ?",
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

// ── Speed Drill ────────────────────────────────────────────────────────────
function getMultiplier(streak) {
  if (streak >= 9) return 4;
  if (streak >= 6) return 3;
  if (streak >= 3) return 2;
  return 1;
}

function updateDrillHUD() {
  const secs = Math.max(0, drillTimeLeft);
  const el = document.getElementById('drill-countdown');
  el.textContent = secs.toFixed(1) + 's';
  el.className = 'drill-countdown' + (secs <= 10 ? ' urgent' : '');
  document.getElementById('drill-score-val').textContent = drillScore;
  const mult = getMultiplier(score.streak);
  const mEl = document.getElementById('drill-mult');
  mEl.textContent = '×' + mult;
  mEl.className = 'drill-mult' + (mult > 1 ? ' active' : '');
}

function startSpeedDrillFromConfig() {
  const selected = [...document.querySelectorAll('.subset-btn.active')];
  const subsetKeys = selected.flatMap(b => JSON.parse(b.dataset.keys));
  if (subsetKeys.length < 6) { alert('Select at least 6 items.'); return; }
  startSpeedDrill(activeDeck, subsetKeys);
}

function startSpeedDrill(deck, subsetKeys) {
  activeDeck = deck || activeDeck;
  data = loadDeckData(activeDeck);

  if (subsetKeys && subsetKeys.length) {
    const keySet = new Set(subsetKeys.map(String));
    data = Object.fromEntries(Object.entries(data).filter(([k]) => keySet.has(k)));
  }

  if (Object.values(data).filter(v => v && v.trim()).length < 6) {
    alert('Need at least 6 associations.'); return;
  }

  isSpeedDrill  = true;
  drillScore    = 0;
  drillTimeLeft = 60;
  isReplaying   = false;
  replayQueue   = [];
  score         = { correct: 0, wrong: 0, streak: 0, times: [] };
  numStats      = {};

  document.getElementById('score-bar').classList.remove('visible');
  document.getElementById('drill-result').classList.remove('visible');
  document.getElementById('quiz').classList.add('is-drill');
  updateDrillHUD();

  clearInterval(drillInterval);
  drillInterval = setInterval(() => {
    drillTimeLeft -= 0.1;
    updateDrillHUD();
    if (drillTimeLeft <= 0) endSpeedDrill();
  }, 100);

  setView('quiz');
  nextQuestion();
}

function endSpeedDrill() {
  clearInterval(drillInterval);
  clearInterval(timerInterval);
  drillInterval = null;
  timerInterval = null;
  isSpeedDrill  = false;

  document.querySelectorAll('.ans-btn').forEach(b => (b.disabled = true));
  document.getElementById('drill-result-score').textContent = drillScore;
  document.getElementById('drill-result-correct').textContent =
    score.correct + ' correct · ' + score.wrong + ' wrong';
  document.getElementById('drill-result').classList.add('visible');
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

  isSpeedDrill = false;
  isReplaying  = false;
  replayQueue  = [];
  loadWeights(activeDeck);
  score    = { correct: 0, wrong: 0, streak: 0, times: [] };
  numStats = {};
  updateScoreBar();
  setReplayBanner(false);
  document.getElementById('quiz').classList.remove('is-drill');
  document.getElementById('drill-result').classList.remove('visible');
  document.getElementById('score-bar').classList.add('visible');
  setView('quiz');
  nextQuestion();
}

function onAnswerKey(e) {
  const n = parseInt(e.key);
  if (n >= 1 && n <= 6) {
    const btn = document.querySelector(`.ans-btn[data-index="${n - 1}"]`);
    if (btn && !btn.disabled) btn.click();
  }
}

function startTimer() {
  clearInterval(timerInterval);
  questionStartTime = Date.now();
  const el = document.getElementById('q-timer');
  el.textContent = '0.0s';
  timerInterval = setInterval(() => {
    el.textContent = ((Date.now() - questionStartTime) / 1000).toFixed(1) + 's';
  }, 100);
  document.addEventListener('keydown', onAnswerKey);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  document.removeEventListener('keydown', onAnswerKey);
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
  document.getElementById('q-label').textContent =
    DECK_QUESTION_LABELS[activeDeck] || "What's the word?";

  document.getElementById('q-peg-images').style.display = 'none';

  const grid = document.getElementById('q-answers');
  grid.innerHTML = '';

  if (activeDeck === 'pegmatrix' && typeof PEG_IMAGES !== 'undefined') {
    const wrongNums = fullPool
      .filter(([k]) => k !== num)
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)
      .map(([k]) => k);

    const optionNums = shuffle([num, ...wrongNums]);
    optionNums.forEach((optNum, i) => {
      const n = parseInt(optNum, 10);
      const audioIdx = Math.floor(n / 10);
      const visualIdx = n % 10;
      const optValue = data[optNum].trim();

      const btn = document.createElement('button');
      btn.className = 'ans-btn ans-btn-image';
      btn.dataset.index = i;
      btn.dataset.answer = optValue;
      btn.onclick = () => handleAnswer(btn, optValue);

      const makeImgWrap = (src, label) => {
        const wrap = document.createElement('div');
        wrap.className = 'peg-img-wrap';
        const img = document.createElement('img');
        img.src = src;
        img.alt = '';
        const span = document.createElement('span');
        span.textContent = label;
        wrap.appendChild(img);
        wrap.appendChild(span);
        return wrap;
      };

      btn.appendChild(makeImgWrap(PEG_IMAGES.audio[audioIdx] || '', PEG_AUDIO[audioIdx]));
      btn.appendChild(makeImgWrap(PEG_IMAGES.visual[visualIdx] || '', PEG_VISUAL[visualIdx]));
      grid.appendChild(btn);
    });
  } else {
    const wrongs = fullPool
      .filter(([k]) => k !== num)
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)
      .map(([, v]) => v.trim());

    const options = shuffle([currentAnswer, ...wrongs]);
    options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'ans-btn';
      btn.textContent = opt;
      btn.dataset.index = i;
      btn.dataset.answer = opt;
      btn.onclick = () => handleAnswer(btn, opt);
      grid.appendChild(btn);
    });
  }

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
    score.correct++;
    score.streak++;
    numStats[currentNum].correct++;

    if (isSpeedDrill) {
      const mult = getMultiplier(score.streak);
      drillScore += 10 * mult;
      updateDrillHUD();
      fb.textContent = `+${10 * mult} pts ×${mult}`;
      fb.className = 'feedback correct';
    } else {
      fb.textContent = `✓ Correct! (${elapsed.toFixed(1)}s)`;
      fb.className = 'feedback correct';
      updateScoreBar();
    }

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
      if (b.dataset.answer === currentAnswer) b.classList.add('correct-ans');
    });
    score.wrong++;
    score.streak = 0;
    numStats[currentNum].wrong++;

    if (isSpeedDrill) {
      updateDrillHUD();
      fb.textContent = `✗ ${currentAnswer}`;
      fb.className = 'feedback wrong';
    } else {
      fb.textContent = `✗ It was: ${currentAnswer} (${elapsed.toFixed(1)}s)`;
      fb.className = 'feedback wrong';
      updateScoreBar();
    }
    setTimeout(nextQuestion, isSpeedDrill ? 800 : 1600);
  }
}

// ── Finish & mistake replay ────────────────────────────────────────────────
function finishQuiz() {
  if (isSpeedDrill) { endSpeedDrill(); return; }
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
