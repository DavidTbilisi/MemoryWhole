function showStats() {
  clearInterval(timerInterval);
  timerInterval = null;

  const total = score.correct + score.wrong;
  const avgTime = score.times.length
    ? score.times.reduce((a, b) => a + b, 0) / score.times.length
    : 0;

  document.getElementById('st-summary').innerHTML = `
    <div class="summary-card"><div class="val val-total">${total}</div><div class="lbl">Answered</div></div>
    <div class="summary-card"><div class="val val-correct">${score.correct}</div><div class="lbl">Correct</div></div>
    <div class="summary-card"><div class="val val-wrong">${score.wrong}</div><div class="lbl">Wrong</div></div>
    <div class="summary-card"><div class="val val-avg">${avgTime.toFixed(1)}s</div><div class="lbl">Avg Time</div></div>
  `;

  const entries = Object.entries(numStats).map(([num, s]) => ({
    num,
    word: data[num] || '?',
    errorRate: s.wrong / s.attempts,
    avgTime: s.totalTime / s.attempts,
    wrong: s.wrong,
    attempts: s.attempts,
  }));

  entries.sort((a, b) => b.errorRate - a.errorRate || b.avgTime - a.avgTime);

  const attention = entries.filter(e => e.wrong > 0);
  const good      = entries.filter(e => e.wrong === 0);

  const makeCard = (e, cls) => `
    <div class="stat-card ${cls}">
      <div class="stat-num">${e.num}</div>
      <div class="stat-word">${e.word}</div>
      <div class="stat-meta">
        ${e.wrong > 0
          ? `<span class="stat-err">${e.wrong}✗ / ${e.attempts}</span>`
          : `<span style="color:#10b981">${e.attempts}✓</span>`}
        <span class="stat-time">${e.avgTime.toFixed(1)}s</span>
      </div>
    </div>`;

  document.getElementById('st-attention').innerHTML = attention.length
    ? attention.map(e => makeCard(e, 'bad')).join('')
    : '<p style="color:#6b7280;font-size:.9rem">No mistakes!</p>';

  document.getElementById('st-good-label').textContent = good.length ? 'All Correct' : '';
  document.getElementById('st-good').innerHTML = good.map(e => makeCard(e, 'good')).join('');

  document.getElementById('score-bar').classList.remove('visible');
  setView('stats');
}
