function showPreview(deck) {
  const table = document.getElementById('preview-table');
  table.innerHTML = '';

  if (deck === 'major') {
    document.getElementById('preview-title').textContent = 'Major System';

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

  } else if (deck === 'sem3') {
    document.getElementById('preview-title').textContent = 'SEM3';

    const categories = [
      'Vision','Sound','Smell','Taste','Touch',
      'Sensation','Animals','Birds','Rainbow','Solar-System'
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

  } else if (deck === 'months') {
    document.getElementById('preview-title').textContent = 'Month Days (Georgian ABC)';

    addTableHeaders(table, ['Word', 'Full mnemonic']);
    const tbody = table.createTBody();
    for (let d = 1; d <= 33; d++) {
      const key = String(d);
      const row = tbody.insertRow();
      addRowHead(row, d);
      addCell(row, '', MONTHS_DATA[key] || '—');
      const td = row.insertCell();
      td.innerHTML = `<span class="cell-word" style="white-space:normal">${MONTHS_FULL[key] || '—'}</span>`;
    }

  } else if (deck === 'clocks') {
    document.getElementById('preview-title').textContent = 'Famous Clocks';

    addTableHeaders(table, ['Clock', 'Location', 'Year', 'Mnemonic']);
    const tbody = table.createTBody();
    CLOCKS_META.forEach(({ time, name, location, year, mnemonic }) => {
      const row = tbody.insertRow();
      addRowHead(row, time);
      [name, location, year, mnemonic].forEach(val => {
        const td = row.insertCell();
        td.innerHTML = `<span class="cell-word">${val}</span>`;
      });
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
  td.innerHTML = (code !== '')
    ? `<span class="cell-num">${code}</span><span class="cell-word">${word}</span>`
    : `<span class="cell-word">${word}</span>`;
}
