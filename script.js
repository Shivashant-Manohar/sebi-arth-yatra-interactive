(function() {
  // Theme toggle (light/dark/night) with persistence
  const THEME_KEY = 'site-theme';
  const PALETTE_KEY = 'site-palette';
  const validThemes = ['light','dark','night'];
  function applyTheme(theme) {
    const t = validThemes.includes(theme) ? theme : 'light';
    if (t === 'light') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(THEME_KEY, t); } catch {}
    document.querySelectorAll('[data-theme-select]')
      .forEach(sel => sel.value = t);
  }
  function applyPalette(palette) {
    const p = ['default','emerald','violet'].includes(palette) ? palette : 'default';
    if (p === 'default') document.documentElement.removeAttribute('data-palette');
    else document.documentElement.setAttribute('data-palette', p);
    try { localStorage.setItem(PALETTE_KEY, p); } catch {}
    document.querySelectorAll('[data-palette-select]')
      .forEach(sel => sel.value = p);
  }
  const savedTheme = (()=>{ try { return localStorage.getItem(THEME_KEY) || 'light'; } catch { return 'light'; } })();
  applyTheme(savedTheme);
  const savedPalette = (()=>{ try { return localStorage.getItem(PALETTE_KEY) || 'default'; } catch { return 'default'; } })();
  applyPalette(savedPalette);
  function openPdfInViewer(pdf) {
    const frame = document.getElementById('pdf-frame');
    const viewer = document.getElementById('pdf-viewer');
    if (!frame || !viewer) return;
    const url = pdf ? pdf + '#view=FitH' : '';
    frame.setAttribute('data', url);
    const iframe = frame.querySelector('iframe');
    if (iframe) iframe.src = url;
    viewer.style.display = pdf ? '' : 'none';
  }

  document.addEventListener('change', (e) => {
    const target = e.target;
    if (target && target.matches('[data-theme-select]')) {
      applyTheme(target.value);
    }
    if (target && target.matches('[data-palette-select]')) {
      applyPalette(target.value);
    }
    if (target && target.id === 'pdf-select') {
      const pdf = target.value || '';
      openPdfInViewer(pdf);
    }
  });

  // Click on preview thumbnails to load into viewer
  document.addEventListener('click', (e) => {
    const thumb = e.target.closest && e.target.closest('.pdf-thumb, .cover');
    if (thumb) {
      const pdf = thumb.getAttribute('data-pdf');
      const select = document.getElementById('pdf-select');
      if (select && pdf) {
        select.value = pdf;
        openPdfInViewer(pdf);
      }
      const all = document.querySelectorAll('.cover');
      all.forEach(el => el.classList.toggle('active', el === thumb));
    }
  });

  // Carousel logic
  const track = document.getElementById('pdf-track');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  let carouselIndex = 0;
  function updateCarousel() {
    if (!track) return;
    const cover = track.querySelector('.cover');
    const covers = Array.from(track.querySelectorAll('.cover'));
    if (!cover || covers.length === 0) return;
    const step = cover.getBoundingClientRect().width + 18;
    const maxIndex = Math.max(0, covers.length - Math.ceil(track.parentElement.offsetWidth / step));
    if (carouselIndex < 0) carouselIndex = 0;
    if (carouselIndex > maxIndex) carouselIndex = maxIndex;
    track.style.transform = `translateX(${-carouselIndex * step}px)`;
  }
  function scrollByCovers(dir) {
    carouselIndex += dir;
    updateCarousel();
  }
  if (prevBtn) prevBtn.addEventListener('click', () => scrollByCovers(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => scrollByCovers(1));
  window.addEventListener('resize', updateCarousel);
  updateCarousel();
  const knBtn = document.getElementById('lang-kn');
  const enBtn = document.getElementById('lang-en');

  function setLang(lang) {
    const isKn = lang === 'kn';
    document.documentElement.lang = isKn ? 'kn' : 'en';
    knBtn.classList.toggle('active', isKn);
    enBtn.classList.toggle('active', !isKn);
    // Swap all elements with data-kn / data-en
    document.querySelectorAll('[data-kn]').forEach(el => {
      const kn = el.getAttribute('data-kn');
      const en = el.getAttribute('data-en') || '';
      el.textContent = isKn ? kn : en;
    });
  }

  // Initialize language from hash or default Kannada
  const hashLang = (location.hash.replace('#', '') || '').toLowerCase();
  setLang(hashLang === 'en' ? 'en' : 'kn');

  knBtn.addEventListener('click', () => { setLang('kn'); history.replaceState(null, '', '#kn'); });
  enBtn.addEventListener('click', () => { setLang('en'); history.replaceState(null, '', '#en'); });

  // Quiz logic
  const form = document.getElementById('quiz-form');
  const result = document.getElementById('quiz-result');
  if (form && result) {
    const answers = { q1: 'no', q2: 'yes', q3: 'yes' };
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      let score = 0; let total = Object.keys(answers).length;
      for (const key of Object.keys(answers)) {
        const checked = form.querySelector(`input[name="${key}"]:checked`);
        if (checked && checked.value === answers[key]) score++;
      }
      const isKn = document.documentElement.lang === 'kn';
      const msg = isKn
        ? `ನಿಮ್ಮ ಅಂಕಗಳು: ${score} / ${total}. ` + (score === total ? 'ಅದ್ಭುತ!' : 'ಚೆನ್ನಾಗಿದೆ — ಇನ್ನೂ ಉತ್ತಮವಾಗಬಹುದು!')
        : `Your score: ${score} / ${total}. ` + (score === total ? 'Excellent!' : 'Good — can be better!');
      result.textContent = msg;
    });
  }

  // SIP calculator (Theme 1)
  const sipBtn = document.getElementById('sip-calc');
  if (sipBtn) {
    sipBtn.addEventListener('click', () => {
      const monthly = parseFloat(document.getElementById('sip-monthly').value || '0');
      const years = parseFloat(document.getElementById('sip-years').value || '0');
      const r = (parseFloat(document.getElementById('sip-return').value || '0') - parseFloat(document.getElementById('sip-commission').value || '0')) / 100;
      const inflation = parseFloat(document.getElementById('sip-inflation').value || '0') / 100;
      const ltcg = parseFloat(document.getElementById('sip-ltcg').value || '0') / 100;

      const n = years * 12;
      const i = r / 12;
      // Future value of SIP: M * [(1+i)^n - 1] * (1+i) / i
      const fvGross = i > 0 ? monthly * ((Math.pow(1 + i, n) - 1) * (1 + i) / i) : monthly * n;
      const invested = monthly * n;
      const gain = Math.max(0, fvGross - invested);
      const tax = gain * ltcg; // simplified LTCG estimation
      const fvAfterTax = fvGross - tax;
      const realFv = fvAfterTax / Math.pow(1 + inflation, years);

      const isKn = document.documentElement.lang === 'kn';
      const f = x => x.toLocaleString('en-IN', { maximumFractionDigits: 0 });
      const out = [
        (isKn ? 'ಒಟ್ಟು ಹೂಡಿಕೆ' : 'Total investment') + ` = ₹${f(invested)}`,
        (isKn ? 'ಒಟ್ಟು ಮೌಲ್ಯ (ತೆರಿಗೆಗೂ ಮುನ್ನ)' : 'Future value (pre-tax)') + ` = ₹${f(fvGross)}`,
        (isKn ? 'ಅಂದಾಜು ತೆರಿಗೆ' : 'Estimated tax') + ` = ₹${f(tax)}`,
        (isKn ? 'ತೆರಿಗೆ ನಂತರ ಮೌಲ್ಯ' : 'Post-tax value') + ` = ₹${f(fvAfterTax)}`,
        (isKn ? 'ದರೋಯ್ಯ ಹೊಂದಿಸಿದ ವಾಸ್ತವ ಮೌಲ್ಯ' : 'Inflation-adjusted real value') + ` = ₹${f(realFv)}`
      ].join('\n');
      document.getElementById('sip-output').textContent = out;
    });
  }

  // Risk DNA Analyzer (Theme 1)
  const dnaBtn = document.getElementById('dna-calc');
  if (dnaBtn) {
    const svg = document.getElementById('dna-chart');
    const breakup = document.getElementById('dna-breakup');
    function renderPie(safe, balanced, aggressive) {
      if (!svg) return;
      const total = safe + balanced + aggressive || 1;
      const root = getComputedStyle(document.documentElement);
      const colorDebt = root.getPropertyValue('--chart-debt').trim() || '#60a5fa';
      const colorGold = root.getPropertyValue('--chart-gold').trim() || '#fbbf24';
      const colorEquity = root.getPropertyValue('--chart-equity').trim() || '#f87171';
      const parts = [
        { v: safe / total, color: colorDebt, label: 'Debt/Bonds' },
        { v: balanced / total, color: colorGold, label: 'Balanced/Gold' },
        { v: aggressive / total, color: colorEquity, label: 'Equity' }
      ];
      let start = 0;
      svg.innerHTML = '';
      parts.forEach(p => {
        const angle = p.v * Math.PI * 2;
        const x1 = 110 + 100 * Math.cos(start);
        const y1 = 110 + 100 * Math.sin(start);
        const x2 = 110 + 100 * Math.cos(start + angle);
        const y2 = 110 + 100 * Math.sin(start + angle);
        const large = angle > Math.PI ? 1 : 0;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M110,110 L${x1},${y1} A100,100 0 ${large} 1 ${x2},${y2} Z`);
        path.setAttribute('fill', p.color);
        svg.appendChild(path);
        start += angle;
      });
    }
    function setBreakup(obj) {
      if (!breakup) return;
      breakup.innerHTML = '';
      const isKn = document.documentElement.lang === 'kn';
      const lines = [
        [isKn ? 'ಈಕ್ವಿಟಿ' : 'Equity', Math.round(obj.equity)],
        [isKn ? 'ಬಾಂಡ್' : 'Debt/Bonds', Math.round(obj.debt)],
        [isKn ? 'ಚಿನ್ನ/ಇತರೆ' : 'Gold/Alt', Math.round(obj.gold)]
      ];
      lines.forEach(([k, v]) => {
        const li = document.createElement('li');
        li.textContent = `${k}: ${v}%`;
        breakup.appendChild(li);
      });
    }
    dnaBtn.addEventListener('click', () => {
      const s1 = (document.querySelector('input[name="s1"]:checked')||{}).value;
      const s2 = (document.querySelector('input[name="s2"]:checked')||{}).value;
      const s3 = (document.querySelector('input[name="s3"]:checked')||{}).value;
      let risk = 0;
      if (s1 === 'buy') risk += 2; else if (s1 === 'stay') risk += 1; // sell -> 0
      if (s2 === 'invest') risk += 2; else if (s2 === 'debt') risk += 1;
      if (s3 === 'rebalance') risk += 2; else if (s3 === 'hold') risk += 1;

      // Map risk 0..6 to allocation
      const equity = Math.min(80, 20 + risk * 10);
      const debt = Math.max(10, 60 - risk * 8);
      const gold = 100 - equity - debt;
      setBreakup({ equity, debt, gold });
      renderPie(debt, gold, equity);
    });

    const certBtn = document.getElementById('dna-cert');
    if (certBtn) {
      certBtn.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200; canvas.height = 630;
        const ctx = canvas.getContext('2d');
        const root = getComputedStyle(document.documentElement);
        const bg = '#ffffff';
        const accent = root.getPropertyValue('--accent').trim() || '#2563eb';
        const text = root.getPropertyValue('--text').trim() || '#1d2433';
        ctx.fillStyle = bg; ctx.fillRect(0,0,1200,630);
        ctx.fillStyle = accent; ctx.font = 'bold 42px Inter, sans-serif';
        ctx.fillText('Investment DNA Certificate', 40, 90);
        const textLines = document.getElementById('dna-breakup').innerText.replace(/\n/g, '  ');
        ctx.fillStyle = text; ctx.font = '28px Inter, sans-serif';
        wrapText(ctx, textLines, 40, 160, 1120, 40);
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a'); a.href = url; a.download = 'investment-dna.png'; a.click();
        function wrapText(c, t, x, y, maxW, lh){
          const words = t.split(' '); let line = '';
          for (let n=0;n<words.length;n++){
            const test = line + words[n] + ' ';
            const w = c.measureText(test).width;
            if (w > maxW && n>0) { c.fillText(line, x, y); line = words[n] + ' '; y += lh; }
            else line = test;
          }
          c.fillText(line, x, y);
        }
      });
    }
  }

  // Crash Survival (Theme 1)
  const crashBtn = document.getElementById('crash-run');
  if (crashBtn) {
    crashBtn.addEventListener('click', () => {
      const eq = parseFloat(document.getElementById('crash-equity').value||'0');
      const de = parseFloat(document.getElementById('crash-debt').value||'0');
      const go = parseFloat(document.getElementById('crash-gold').value||'0');
      const total = eq + de + go || 1;
      const wEq = eq/total, wDe = de/total, wGo = go/total;
      // Crash shock: equity -35%, debt +4%, gold +15%
      const ret = wEq*(-0.35) + wDe*(0.04) + wGo*(0.15);
      const isKn = document.documentElement.lang === 'kn';
      const msg = isKn ? `ಕ್ರ್ಯಾಶ್ ಪರಿಣಾಮ: ${(ret*100).toFixed(1)}%` : `Crash impact: ${(ret*100).toFixed(1)}%`;
      document.getElementById('crash-output').textContent = msg + (ret>-0.2 ? (isKn?' — ಉತ್ತಮ ವಿಭಜನೆ!':' — Good diversification!') : (isKn?' — ಹೆಚ್ಚು ಈಕ್ವಿಟಿ ಅಪಾಯ.':' — Equity heavy risk.'));
    });
  }

  // Theme 2 — MITRA Lost Treasure Hunt
  const trBtn = document.getElementById('tr-search');
  if (trBtn) {
    trBtn.addEventListener('click', () => {
      const name = (document.getElementById('tr-name').value||'').trim().toLowerCase();
      const year = parseInt(document.getElementById('tr-year').value||'0', 10);
      const city = (document.getElementById('tr-city').value||'').trim().toLowerCase();
      // Pseudo-detection for demo: simple hash to decide "treasure"
      const seed = (name.length*13 + year*7 + city.length*11) % 100;
      const found = seed > 55; // ~44% hit rate for excitement
      const est = Math.round((seed/100) * 25000 + 1000);
      const isKn = document.documentElement.lang === 'kn';
      document.getElementById('tr-output').textContent = found
        ? (isKn ? `ಅಭಿನಂದನೆ! ಅಂದಾಜು ಮೌಲ್ಯ ₹${est.toLocaleString('en-IN')}. ಮಿಥ್ರಾದಲ್ಲಿ ಕ್ಲೈಮ್ ಮಾಡಿ.`
                 : `Congrats! Estimated unclaimed value ₹${est.toLocaleString('en-IN')}. Claim on MITRA.`)
        : (isKn ? 'ಈ ವಿವರಗಳಿಂದ ಟ್ರೆಷರ್ ಸಿಗಲಿಲ್ಲ — ಇನ್ನಷ್ಟು ಮಾಹಿತಿಯನ್ನು ಪ್ರಯತ್ನಿಸಿ.'
                 : 'No treasure with these details — try more info.');
    });
  }

  // Theme 2 — SCORES Complaint Journey Tracker
  const cmpBtn = document.getElementById('cmp-start');
  if (cmpBtn) {
    cmpBtn.addEventListener('click', () => {
      const timeline = document.getElementById('cmp-timeline');
      timeline.innerHTML = '';
      const isKn = document.documentElement.lang === 'kn';
      const steps = isKn
        ? ['ದೂರು ಸ್ವೀಕೃತ', 'ಮಧ್ಯವರ್ತಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ', 'ಪ್ರಾಥಮಿಕ ಪ್ರತಿಕ್ರಿಯೆ', 'ಪುನಃ ಪರಿಶೀಲನೆ (ODR)', 'ಮುಚ್ಚಲ್ಪಟ್ಟಿದೆ']
        : ['Complaint lodged', 'Forwarded to intermediary', 'Initial response', 'Review/ODR', 'Closed'];
      let idx = 0;
      const tick = () => {
        if (idx >= steps.length) return;
        const li = document.createElement('li');
        li.textContent = steps[idx++];
        timeline.appendChild(li);
        if (idx < steps.length) setTimeout(tick, 700);
      };
      tick();
    });
  }

  // Theme 2 — Transaction Security Scorecard
  const secBtn = document.getElementById('sec-calc');
  if (secBtn) {
    secBtn.addEventListener('click', () => {
      const upi = document.getElementById('sec-upi').checked ? 1 : 0;
      const sebi = document.getElementById('sec-sebi').checked ? 1 : 0;
      const tsba = document.getElementById('sec-tsba').checked ? 1 : 0;
      const score = upi*30 + sebi*40 + tsba*30; // 100 max
      const isKn = document.documentElement.lang === 'kn';
      const label = score>=80 ? (isKn?'ಹಸಿರು — ಸುರಕ್ಷಿತ':'Green — Safe') : score>=50 ? (isKn?'ಹಳದಿ — ಎಚ್ಚರ':'Yellow — Caution') : (isKn?'ಕೆಂಪು — ಅಪಾಯ':'Red — Risk');
      document.getElementById('sec-output').textContent = (isKn?'ಭದ್ರತಾ ಸ್ಕೋರ್: ':'Security score: ') + score + '/100 — ' + label;
    });
  }

  // Theme 2 — Digital Fortress Builder
  const fortBtn = document.getElementById('fort-build');
  if (fortBtn) {
    const fortSvg = document.getElementById('fort-visual');
    const fortScore = document.getElementById('fort-score');
    fortBtn.addEventListener('click', () => {
      const steps = [
        document.getElementById('fort-pan').checked,
        document.getElementById('fort-aadhaar').checked,
        document.getElementById('fort-bank').checked,
        document.getElementById('fort-esign').checked
      ];
      const score = steps.reduce((t, v) => t + (v ? 25 : 0), 0);
      const level = Math.round(score / 25); // 0..4 bricks
      if (fortSvg) {
        fortSvg.innerHTML = '';
        // Draw base wall
        const base = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        base.setAttribute('x','20'); base.setAttribute('y','100'); base.setAttribute('width','260'); base.setAttribute('height','40'); base.setAttribute('fill','#3946c2');
        fortSvg.appendChild(base);
        for (let i=0;i<level;i++) {
          const brick = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          brick.setAttribute('x', String(40 + i*55));
          brick.setAttribute('y', String(80 - i*4));
          brick.setAttribute('width','50'); brick.setAttribute('height','20');
          brick.setAttribute('fill', i>=3 ? '#ffd84d' : '#6eb3d1');
          fortSvg.appendChild(brick);
        }
        // Tower if complete
        if (level === 4) {
          const tower = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          tower.setAttribute('points','240,100 260,60 280,100');
          tower.setAttribute('fill','#ffd84d');
          fortSvg.appendChild(tower);
        }
      }
      const isKn = document.documentElement.lang === 'kn';
      fortScore.textContent = (isKn?'ಭದ್ರತಾ ಮಟ್ಟ: ':'Security level: ') + score + '/100';
    });
  }

  // Theme 2 — Rights Compass
  const compassBtn = document.getElementById('compass-go');
  if (compassBtn) {
    compassBtn.addEventListener('click', () => {
      const val = document.getElementById('compass-case').value;
      const isKn = document.documentElement.lang === 'kn';
      let msg = '';
      if (val === 'contact') msg = isKn ? 'ಮೊದಲು ಮಧ್ಯವರ್ತಿಗೆ ಬರೆಯಿರಿ, 7 ದಿನಗಳಲ್ಲಿ ಪ್ರತಿಕ್ರಿಯೆ.' : 'Write to the intermediary first; expect reply in ~7 days.';
      if (val === 'scores') msg = isKn ? 'ಸ್ಕೋರ್ಸ್‌ನಲ್ಲಿ ದೂರು ಸಲ್ಲಿಸಿ — 21 ದಿನಗಳೊಳಗೆ ಪರಿಹಾರ ಗುರಿ.' : 'File on SCORES — 21-day resolution target.';
      if (val === 'odr') msg = isKn ? 'ಆನ್‌ಲೈನ್ ಡಿಸ್ಪ್ಯೂಟ್ ರೆಸೊಲ್ಯೂಶನ್‌ಗೆ ಎಸ್ಕಲೇಟ್ ಮಾಡಿ.' : 'Escalate to Online Dispute Resolution.';
      document.getElementById('compass-output').textContent = msg;
    });
  }
  // Scam risk score (Theme 3)
  const scamBtn = document.getElementById('scam-calc');
  if (scamBtn) {
    scamBtn.addEventListener('click', () => {
      const checks = Array.from(document.querySelectorAll('#scam-form input[type="checkbox"]'));
      const risk = checks.reduce((t, c) => t + (c.checked ? 1 : 0), 0);
      const isKn = document.documentElement.lang === 'kn';
      const msg = isKn ? `ರಿಸ್ಕ್ ಅಂಕ: ${risk}/5 — ` : `Risk score: ${risk}/5 — `;
      const tip = risk === 0
        ? (isKn ? 'ಚೆನ್ನಾಗಿದೆ! ಎಚ್ಚರಿಕೆಯಿಂದ ಮುಂದುವರಿಯಿರಿ.' : 'Great! Proceed cautiously.')
        : (isKn ? 'ಎಚ್ಚರಿಕೆ: ನೋಂದಣಿ/ದೃಢೀಕರಣ ಪರಿಶೀಲಿಸಿ, ಭರವಸೆಗಳಿಗೆ ಒಳಗಾಗಬೇಡಿ.' : 'Alert: verify registration/handles; avoid return promises.');
      document.getElementById('scam-output').textContent = msg + tip;
    });
  }
})();


