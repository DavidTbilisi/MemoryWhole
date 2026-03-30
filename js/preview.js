function showPreview(deck) {
  const table = document.getElementById('preview-table');
  table.innerHTML = '';

  if (deck === 'major') {
    document.getElementById('preview-title').textContent = 'Major System';

    // Build a local copy from DEFAULTS + localStorage — never touches global data
    const pd = { ...DEFAULTS };
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        Object.entries(JSON.parse(saved)).forEach(([k, v]) => { if (v) pd[k] = v; });
      } catch (e) {}
    }

    addTableHeaders(table, Array.from({ length: 10 }, (_, i) => '+' + i));

    const tbody = table.createTBody();
    for (let r = 0; r <= 90; r += 10) {
      const row = tbody.insertRow();
      addRowHead(row, r);
      for (let c = 0; c <= 9; c++) {
        const n = r + c;
        addCell(row, n, pd[n] ?? pd[String(n)] ?? '—');
      }
    }

  } else {
    document.getElementById('preview-title').textContent = 'SEM3';

    const categories = [
      'Vision', 'Sound', 'Smell', 'Taste', 'Touch',
      'Sensation', 'Animals', 'Birds', 'Rainbow', 'Solar-System'
    ];

    addTableHeaders(table, Array.from({ length: 10 }, (_, i) => i));

    const tbody = table.createTBody();
    categories.forEach((cat, r) => {
      const row = tbody.insertRow();
      addRowHead(row, cat);
      for (let c = 0; c <= 9; c++) {
        const code = String(r * 1000 + c * 100).padStart(4, '0');
        const full = SEM3_DATA[code] || '—';
        const item = full.includes(' - ') ? full.split(' - ')[1] : full;
        addCell(row, code, item);
      }
    });
  }

  setView('preview');
}

function addTableHeaders(table, labels) {
  const thead = table.createTHead();
  const hrow  = thead.insertRow();
  const corner = document.createElement('th');
  corner.className = 'row-head';
  hrow.appendChild(corner);
  labels.forEach(label => {
    const th = document.createElement('th');
    th.textContent = label;
    hrow.appendChild(th);
  });
}

function addRowHead(row, label) {
  const rh = row.insertCell();
  rh.className = 'row-head';
  rh.textContent = label;
}

function addCell(row, code, word) {
  const td = row.insertCell();
  td.innerHTML = `<span class="cell-num">${code}</span><span class="cell-word">${word}</span>`;
}
