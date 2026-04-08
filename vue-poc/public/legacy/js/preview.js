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

  } else if (deck === 'pao') {
    document.getElementById('preview-title').textContent = 'PAO System (0–99)';

    addTableHeaders(table, ['Franchise', 'Person', 'Action', 'Object']);
    const tbody = table.createTBody();

    let lastCat = null;
    PAO_META.forEach(({ num, cat, person, action, obj }) => {
      if (cat !== lastCat) {
        lastCat = cat;
        const divRow = tbody.insertRow();
        const td = divRow.insertCell();
        td.colSpan = 5;
        td.style.cssText = 'background:#1a2540;color:#7c3aed;font-weight:700;font-size:0.8rem;padding:0.4rem 0.8rem;letter-spacing:.06em;text-transform:uppercase;';
        td.textContent = cat;
      }
      const row = tbody.insertRow();
      addRowHead(row, num);
      [cat, person, action, obj].forEach((val, i) => {
        const td = row.insertCell();
        const style = i === 0 ? 'display:none' :
                      i === 1 ? 'font-weight:700;color:#e0e0e0;' :
                      i === 2 ? 'color:#7c3aed;' : 'color:#6b7280;font-style:italic;';
        td.innerHTML = `<span class="cell-word" style="${style}">${val}</span>`;
      });
    });

  } else if (deck === 'binary') {
    document.getElementById('preview-title').textContent = 'Binary 4-bit (0000–1111)';

    addTableHeaders(table, ['Syllable', 'Image', '']);
    const tbody = table.createTBody();
    BINARY_META.forEach(({ bits, syllable, image, emoji }) => {
      const row = tbody.insertRow();
      addRowHead(row, bits);
      const syl = row.insertCell();
      syl.innerHTML = `<span class="cell-word" style="font-size:1.1rem;font-weight:700;color:#7c3aed">${syllable}</span>`;
      const img = row.insertCell();
      img.innerHTML = `<span class="cell-word">${image}</span>`;
      const em = row.insertCell();
      em.style.fontSize = '1.5rem';
      em.textContent = emoji;
    });

  } else if (deck === 'biblebooks') {
    document.getElementById('preview-title').textContent = 'Bible Books (1–66)';

    addTableHeaders(table, ['Book', 'Ch.', 'Major', 'Mnemonic']);
    const tbody = table.createTBody();

    let lastSection = null;
    BIBLE_BOOKS_META.forEach(({ order, book, ch, section, major, mnemonic }) => {
      // Section divider row
      if (section !== lastSection) {
        lastSection = section;
        const divRow = tbody.insertRow();
        const td = divRow.insertCell();
        td.colSpan = 5;
        td.style.cssText = 'background:#1a2540;color:#7c3aed;font-weight:700;font-size:0.8rem;padding:0.4rem 0.8rem;letter-spacing:.06em;text-transform:uppercase;';
        td.textContent = section;
      }
      const row = tbody.insertRow();
      addRowHead(row, order);
      [book, ch, major, mnemonic].forEach((val, i) => {
        const td = row.insertCell();
        const style = i === 3 ? 'white-space:normal;font-style:italic;color:#a0aec0;' : '';
        td.innerHTML = `<span class="cell-word" style="${style}">${val}</span>`;
      });
    });

  } else if (deck === 'pegmatrix') {
    document.getElementById('preview-title').textContent = 'Peg Matrix (00–99)';

    // Column headers = Visual pegs (shape-based)
    addTableHeaders(table, Object.values(PEG_VISUAL));
    const tbody = table.createTBody();
    // Rows = Audio pegs (rhyme-based)
    for (let r = 0; r <= 9; r++) {
      const row = tbody.insertRow();
      addRowHead(row, PEG_AUDIO[r]);
      for (let c = 0; c <= 9; c++) {
        const key = String(r * 10 + c).padStart(2, '0');
        addCell(row, key, '');
      }
    }

  } else if (deck === 'pegmatrixru') {
    document.getElementById('preview-title').textContent = 'Пег Матрица RU (00–99)';

    // Column headers = Visual pegs (shape-based, Russian)
    addTableHeaders(table, Object.values(PEG_VISUAL_RU));
    const tbody = table.createTBody();
    // Rows = Audio pegs (rhyme-based, Russian)
    for (let r = 0; r <= 9; r++) {
      const row = tbody.insertRow();
      addRowHead(row, PEG_AUDIO_RU[r]);
      for (let c = 0; c <= 9; c++) {
        const key = String(r * 10 + c).padStart(2, '0');
        addCell(row, key, '');
      }
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
