function showEditor() {
  loadData();
  buildEditor();
  setView('editor');
}

function buildEditor() {
  const grid = document.getElementById('editor-grid');
  grid.innerHTML = '';
  for (let i = 0; i <= 99; i++) {
    const row = document.createElement('div');
    row.className = 'editor-row';

    const badge = document.createElement('span');
    badge.className = 'num-badge';
    badge.textContent = i;

    const input = document.createElement('input');
    input.className = 'word-input';
    input.type = 'text';
    input.dataset.num = i;
    input.value = data[i] ?? data[String(i)] ?? '';
    input.placeholder = '…';

    row.appendChild(badge);
    row.appendChild(input);
    grid.appendChild(row);
  }
}

function saveEditor() {
  document.querySelectorAll('.word-input').forEach(inp => {
    data[inp.dataset.num] = inp.value.trim();
  });
  localStorage.setItem(LS_KEY, JSON.stringify(data));
  if (window.fbSave && window.fbUser) window.fbSave('major_assoc', data);
  showToast('Saved ✓');
}
