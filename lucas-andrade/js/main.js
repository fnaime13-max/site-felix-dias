(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  /* ---------- Dados do config.js ---------- */
  const SITE = window.SITE || {};
  const PENDING = '{{PREENCHER}}';

  function fillFields() {
    $$('[data-field]').forEach(el => {
      const key = el.dataset.field;
      const value = (SITE[key] || '').trim();
      if (!value) { el.textContent = PENDING; el.classList.add('is-pending'); return; }

      if (key === 'instagram') {
        const a = document.createElement('a');
        a.href = 'https://instagram.com/' + value.replace(/^@/, '');
        a.textContent = '@' + value.replace(/^@/, '');
        a.rel = 'noopener'; a.target = '_blank';
        el.replaceChildren(a);
      } else if (key === 'email') {
        const a = document.createElement('a');
        a.href = 'mailto:' + value; a.textContent = value;
        el.replaceChildren(a);
      } else if (key === 'whatsappLabel' && SITE.whatsapp) {
        const a = document.createElement('a');
        a.href = waLink(SITE.whatsappMsg); a.textContent = value;
        a.rel = 'noopener'; a.target = '_blank';
        el.replaceChildren(a);
      } else {
        el.textContent = value;
      }
    });

    const number = (SITE.whatsapp || '').replace(/\D/g, '');
    if (number) {
      $$('[data-wa]').forEach(a => {
        a.href = waLink(a.dataset.waMsg || SITE.whatsappMsg);
        a.target = '_blank'; a.rel = 'noopener';
      });
    }
    const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  }
  function waLink(msg) {
    return 'https://wa.me/' + (SITE.whatsapp || '').replace(/\D/g, '') + '?text=' + encodeURIComponent(msg || '');
  }

  /* ---------- Abertura: calibração 0 → 100 ---------- */
  function boot() {
    const el = $('#boot');
    const finish = () => {
      document.body.classList.remove('is-booting');
      document.body.classList.add('is-ready');
    };
    if (!el || reduced) { el && el.remove(); finish(); return; }

    const num = $('#bootNum'), fill = $('#bootFill'), status = $('#bootStatus');
    const stages = $$('.boot__stages li');
    const DURATION = 2400;
    let loaded = document.readyState === 'complete';
    let start = null, shown = -1, done = false, skip = false;

    addEventListener('load', () => { loaded = true; }, { once: true });
    setTimeout(() => { loaded = true; }, 5000);         // nunca prende o visitante
    const doSkip = () => { skip = true; loaded = true; };
    el.addEventListener('click', doSkip);
    addEventListener('keydown', e => { if (e.key === 'Escape' || e.key === 'Enter') doSkip(); }, { once: true });

    // aceleração de "largada": arranca, sustenta, acelera no fim
    const curve = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    function frame(now) {
      if (start === null) start = now;
      let p = skip ? 1 : curve(clamp((now - start) / DURATION, 0, 1));
      if (!loaded) p = Math.min(p, .9);
      const v = Math.round(p * 100);
      if (v !== shown) {
        shown = v;
        num.textContent = String(v).padStart(3, '0');
        fill.style.transform = `scaleX(${p})`;
        stages.forEach(li => li.classList.toggle('is-on', v >= +li.dataset.at));
      }
      if (v < 100) return requestAnimationFrame(frame);
      if (done) return;
      done = true;
      status.textContent = 'Pronto';
      setTimeout(() => {
        el.classList.add('is-done');                     // cortina de acento sobe
        setTimeout(() => {
          el.classList.add('is-leaving');                 // e abre para o site
          finish();
          setTimeout(() => el.remove(), 800);
        }, 520);
      }, skip ? 0 : 220);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Header: estado, progresso, seção ativa ---------- */
  function header() {
    const head = $('.header'), pct = $('#scrollPct'), bar = $('#scrollBar');
    let ticking = false;
    const update = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
      head.classList.toggle('is-solid', scrollY > 24);
      bar.style.transform = `scaleX(${p})`;
      pct.textContent = String(Math.round(p * 100)).padStart(3, '0');
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();

    const links = $$('.nav__list a');
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(a => a.getAttribute('href') === '#' + e.target.id
          ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(s => io.observe(s));
  }

  /* ---------- Menu móvel ---------- */
  function menu() {
    const btn = $('#menuBtn'), panel = $('#mobileMenu'), label = $('.visually-hidden', btn);
    const set = open => {
      btn.setAttribute('aria-expanded', String(open));
      label.textContent = open ? 'Fechar menu' : 'Abrir menu';
      panel.hidden = !open;
      panel.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) $('a', panel).focus();
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    panel.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { set(false); btn.focus(); } });
    matchMedia('(min-width: 960px)').addEventListener('change', e => { if (e.matches) set(false); });
  }

  /* ---------- Hero: faixa de sinal desenhada na largura real ---------- */
  function ecg() {
    const svg = $('#ecg'); if (!svg) return;
    const paths = $$('path', svg);
    const draw = () => {
      const w = Math.max(320, Math.round(svg.getBoundingClientRect().width));
      const gap = w < 600 ? 110 : 160;                    // distância entre batimentos
      let d = 'M0 34';
      for (let x = 30; x + 50 < w; x += gap) {
        d += ` H${x} L${x + 6} 29 L${x + 12} 34 H${x + 22} L${x + 28} 6 L${x + 35} 52 L${x + 41} 34 H${x + 52} L${x + 60} 27 L${x + 68} 34`;
      }
      d += ` H${w}`;
      svg.setAttribute('viewBox', `0 0 ${w} 56`);
      paths.forEach(p => p.setAttribute('d', d));
    };
    draw();
    addEventListener('resize', draw);
  }

  /* ---------- Hero: foto inclina seguindo o cursor ---------- */
  function tilt() {
    if (!finePointer || reduced) return;
    const hero = $('#hero'), photo = $('#heroPhoto');
    hero.addEventListener('pointermove', e => {
      const r = photo.getBoundingClientRect();
      const nx = clamp((e.clientX - (r.left + r.width / 2)) / (innerWidth / 2), -1, 1);
      const ny = clamp((e.clientY - (r.top + r.height / 2)) / (innerHeight / 2), -1, 1);
      photo.style.setProperty('--ry', (nx * 6).toFixed(2) + 'deg');
      photo.style.setProperty('--rx', (ny * -4).toFixed(2) + 'deg');
      photo.style.setProperty('--sx', (50 - nx * 40).toFixed(1) + '%');
    });
    hero.addEventListener('pointerleave', () => {
      photo.style.setProperty('--ry', '0deg'); photo.style.setProperty('--rx', '0deg'); photo.style.setProperty('--sx', '50%');
    });
  }

  /* ---------- Botões magnéticos ---------- */
  function magnetic() {
    if (!finePointer || reduced) return;
    $$('[data-magnetic]').forEach(btn => {
      const zone = 40;
      const parent = btn.parentElement;
      parent.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = e.clientX - cx, dy = e.clientY - cy;
        const inside = Math.abs(dx) < r.width / 2 + zone && Math.abs(dy) < r.height / 2 + zone;
        btn.style.transform = inside ? `translate(${dx * .22}px, ${dy * .32}px)` : '';
      });
      parent.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- Raias: preenchimento a partir do lado de entrada ---------- */
  function lanes() {
    if (!finePointer) return;
    $$('.lane').forEach(l => l.addEventListener('pointerenter', e => {
      const r = l.getBoundingClientRect();
      l.style.setProperty('--from', e.clientX - r.left < r.width / 2 ? 'left' : 'right');
    }));
  }

  /* ---------- Periodização: abas + varredura com o mouse ---------- */
  function periodization() {
    const tabs = $$('#period [role="tab"]'), panel = $('#phase-panel');
    const hl = $('#periodHl'), scan = $('#periodScan'), chart = $('#periodChart');
    const TEXT = [
      'Energia e macronutrientes calibrados para sustentar o volume de treino e a adaptação.',
      'Os ajustes acompanham o aumento progressivo de carga e de intensidade.',
      'Estratégia voltada ao desempenho máximo na fase mais exigente do ciclo.',
      'Prioridade para a recuperação e a manutenção da composição corporal.'
    ];
    let current = 0;
    const select = (i, focus) => {
      if (i === current && !focus) return;
      current = i;
      tabs.forEach((t, n) => {
        const on = n === i;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', tabs[i].id);
      panel.textContent = TEXT[i];
      hl.setAttribute('x', String(i * 160));
      if (focus) tabs[i].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', e => {
        const map = { ArrowRight: 1, ArrowLeft: -1 };
        if (e.key in map) { e.preventDefault(); select((current + map[e.key] + tabs.length) % tabs.length, true); }
        if (e.key === 'Home') { e.preventDefault(); select(0, true); }
        if (e.key === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
      });
    });
    chart.addEventListener('pointermove', e => {
      const r = chart.getBoundingClientRect();
      const f = clamp((e.clientX - r.left) / r.width, 0, .999);
      scan.setAttribute('x1', (f * 640).toFixed(1)); scan.setAttribute('x2', (f * 640).toFixed(1));
      select(Math.floor(f * 4));
    });
  }

  /* ---------- Métricas: brilho que segue o mouse + linhas ---------- */
  function tiles() {
    if (!finePointer) return;
    $$('.tile').forEach(t => t.addEventListener('pointermove', e => {
      const r = t.getBoundingClientRect();
      t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      t.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }));
  }

  /* ---------- Sobre: foto responde ao mouse ---------- */
  function aboutParallax() {
    if (!finePointer || reduced) return;
    const sec = $('#sobre'), fig = $('#aboutPhoto');
    sec.addEventListener('pointermove', e => {
      const r = sec.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
      fig.style.setProperty('--px', (nx * -18).toFixed(1) + 'px');
      fig.style.setProperty('--py', (ny * -14).toFixed(1) + 'px');
    });
    sec.addEventListener('pointerleave', () => { fig.style.setProperty('--px', '0px'); fig.style.setProperty('--py', '0px'); });
  }

  /* ---------- Reveal no scroll ---------- */
  function reveal() {
    const items = $$('[data-reveal]');
    if (reduced || !('IntersectionObserver' in window)) { items.forEach(i => i.classList.add('is-visible')); return; }
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(i => io.observe(i));
  }

  /* ---------- CTA fixo no mobile ---------- */
  function dock() {
    const d = $('.dock'); if (!d) return;
    const state = { hero: true, contato: false, footer: false };
    const set = () => d.classList.toggle('is-shown', !state.hero && !state.contato && !state.footer);
    [['hero', '#hero'], ['contato', '#contato'], ['footer', '.footer']].forEach(([k, s]) =>
      new IntersectionObserver(([e]) => { state[k] = e.isIntersecting; set(); }).observe($(s)));
  }

  fillFields();
  boot();
  header();
  menu();
  ecg();
  tilt();
  magnetic();
  lanes();
  periodization();
  tiles();
  aboutParallax();
  reveal();
  dock();
})();
