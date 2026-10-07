/* Método Vance · interações
   Tudo aqui é progressivo: sem JS, o site continua completo e legível. */
(() => {
  'use strict';

  /* ============================================================
     CONFIGURAÇÃO · edite aqui
     whatsapp: só números, com DDI + DDD. Ex.: '5511999998888'.
     Enquanto estiver vazio, os botões levam à seção de contato.
     ============================================================ */
  const CONFIG = {
    whatsapp: '',
    defaultMessage: 'Olá, Dra. Beatriz! Gostaria de agendar uma consulta de avaliação.',
  };

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  /* ---------- CTAs → WhatsApp ---------- */
  if (CONFIG.whatsapp) {
    $$('[data-cta]').forEach((a) => {
      const msg = a.dataset.message || CONFIG.defaultMessage;
      a.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
      a.target = '_blank';
      a.rel = 'noopener';
    });
  }

  /* ---------- Imagens ausentes → placeholder ---------- */
  $$('[data-media] img').forEach((img) => {
    const miss = () => img.closest('[data-media]').classList.add('is-missing');
    if (img.complete && img.naturalWidth === 0) miss();
    img.addEventListener('error', miss);
  });

  const yearEl = $('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============================================================
     ABERTURA · germinação 0 → 100%
     O número acompanha o carregamento real (fontes + foto principal)
     com uma duração mínima, para a muda ter tempo de crescer.
     ============================================================ */
  const loader = $('[data-loader]');
  const countEl = $('[data-count]');
  const statusEl = $('[data-status]');
  const page = [$('.site-header'), $('main'), $('.site-footer'), $('.skip-link')];

  function startLoader() {
    if (!loader) { root.classList.remove('is-loading'); return Promise.resolve(); }
    page.forEach((el) => el && el.setAttribute('inert', ''));

    const MIN = reduceMotion ? 500 : 2600;
    const MAX_WAIT = 7000;
    let ready = false;

    const heroImg = $('.hero img');
    const imgReady = heroImg && !heroImg.complete
      ? new Promise((r) => { heroImg.addEventListener('load', r, { once: true }); heroImg.addEventListener('error', r, { once: true }); })
      : Promise.resolve();
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.race([Promise.all([imgReady, fontsReady]), new Promise((r) => setTimeout(r, MAX_WAIT))])
      .then(() => { ready = true; });

    const stages = [
      [0, 'preparando o solo'],
      [28, 'germinando'],
      [62, 'abrindo as folhas'],
      [90, 'abrindo a clareira'],
    ];
    const start = performance.now();
    let shown = 0;

    return new Promise((resolve) => {
      const tick = (now) => {
        const t = clamp((now - start) / MIN, 0, 1);
        const eased = 1 - Math.pow(1 - t, 2.2);
        let target = eased * 100;
        if (!ready) target = Math.min(target, 94);
        if (target > shown) shown = Math.min(Math.ceil(target), shown + Math.max(1, Math.round((target - shown) * 0.18)));

        countEl.textContent = shown;
        loader.style.setProperty('--p', (shown / 100).toFixed(3));
        loader.classList.toggle('has-c1', shown >= 30);
        loader.classList.toggle('has-c2', shown >= 60);
        loader.classList.toggle('has-c3', shown >= 88);
        const label = stages.filter(([v]) => shown >= v).pop()[1];
        if (statusEl.textContent !== label) statusEl.textContent = label;

        if (shown < 100) { requestAnimationFrame(tick); return; }
        finish(resolve);
      };
      requestAnimationFrame(tick);
    });
  }

  function finish(resolve) {
    const hold = reduceMotion ? 0 : 350;
    setTimeout(() => {
      loader.classList.add('is-done');
      setTimeout(() => {
        loader.classList.add('is-open');
        root.classList.remove('is-loading');
        page.forEach((el) => el && el.removeAttribute('inert'));
        resolve();
        setTimeout(() => loader.classList.add('is-gone'), reduceMotion ? 50 : 1500);
      }, reduceMotion ? 0 : 380);
    }, hold);
  }

  /* ============================================================
     CLAREIRA · o movimento do cursor é vento
     Uma folha de palmeira pendurada ao fundo balança como pêndulo
     (mola + amortecimento). As outras folhas fazem um parallax leve.
     ============================================================ */
  function initCanopy() {
    const hero = $('[data-hero]');
    const canopy = $('[data-canopy]');
    const frond = $('[data-frond]');
    if (!hero || !canopy || reduceMotion) return;

    const leaves = $$('.leaf', canopy).map((el) => ({
      el, depth: parseFloat(el.dataset.depth) || 0.3, tx: 0, ty: 0, sway: 0,
    }));

    let px = 0.5, py = 0.5;           // cursor normalizado (0–1)
    let tx = 0.5, ty = 0.5;
    let lastX = null, lastT = 0;
    let wind = 0;                     // força do vento (px/ms do cursor)
    let angle = 0, vel = 0;           // pêndulo da folha (graus)
    let visible = true;
    let rect = hero.getBoundingClientRect();
    let lastScroll = window.scrollY;

    hero.addEventListener('pointermove', (e) => {
      rect = hero.getBoundingClientRect();
      tx = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      ty = clamp((e.clientY - rect.top) / rect.height, 0, 1);
      const now = performance.now();
      if (lastX !== null && now > lastT) {
        const v = (e.clientX - lastX) / (now - lastT);
        wind = clamp(wind + v * 0.9, -4, 4);
      }
      lastX = e.clientX; lastT = now;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { lastX = null; tx = 0.5; ty = 0.5; });

    // no celular, a rolagem também é vento
    window.addEventListener('scroll', () => {
      const d = window.scrollY - lastScroll;
      lastScroll = window.scrollY;
      if (visible) wind = clamp(wind + d * 0.02, -4, 4);
    }, { passive: true });

    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(hero);
    window.addEventListener('resize', () => { rect = hero.getBoundingClientRect(); }, { passive: true });

    let prev = performance.now();
    const frame = (now) => {
      requestAnimationFrame(frame);
      const dt = Math.min(32, now - prev) / 16.67;
      prev = now;
      if (!visible) return;

      // brisa de fundo bem suave, para a folha nunca ficar totalmente parada
      const breeze = Math.sin(now / 1700) * 0.35 + Math.sin(now / 900) * 0.12;
      // pêndulo: mola de volta ao centro + amortecimento + vento
      const force = -0.012 * angle - 0.05 * vel + wind * 0.06 + breeze * 0.02;
      vel += force * dt;
      angle = clamp(angle + vel * dt, -26, 26);
      wind *= Math.pow(0.86, dt);
      if (frond) frond.style.setProperty('--swing', angle.toFixed(2) + 'deg');

      px = lerp(px, tx, 0.05);
      py = lerp(py, ty, 0.05);
      const ox = px - 0.5, oy = py - 0.5;
      leaves.forEach((l) => {
        l.tx = lerp(l.tx, -ox * 40 * l.depth, 0.07);
        l.ty = lerp(l.ty, -oy * 28 * l.depth, 0.07);
        l.sway = lerp(l.sway, angle * 0.18 * l.depth, 0.06);
        l.el.style.setProperty('--tx', l.tx.toFixed(2) + 'px');
        l.el.style.setProperty('--ty', l.ty.toFixed(2) + 'px');
        l.el.style.setProperty('--sway', l.sway.toFixed(2) + 'deg');
      });
    };
    requestAnimationFrame(frame);
  }

  /* ---------- Cabeçalho + menu ---------- */
  function initHeader() {
    const header = $('[data-header]');
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const toggle = $('[data-menu-toggle]');
    const menu = $('[data-menu]');
    const label = $('.menu-toggle__label', toggle);
    const mq = window.matchMedia('(max-width: 959px)');

    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      label.textContent = open ? 'Fechar' : 'Menu';
      menu.classList.toggle('is-open', open);
      root.classList.toggle('menu-open', open);
      if (open) $('a', menu).focus();
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (e) => { if (e.target.closest('a') && mq.matches) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || toggle.getAttribute('aria-expanded') !== 'true') return;
      setOpen(false);
      toggle.focus();
    });
    // mantém o foco dentro do menu aberto
    menu.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !menu.classList.contains('is-open')) return;
      const items = [...$$('a', menu), toggle];
      const i = items.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); toggle.focus(); }
      else if (!e.shiftKey && i === items.length - 2) { e.preventDefault(); toggle.focus(); }
    });
    toggle.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && !e.shiftKey && menu.classList.contains('is-open')) { e.preventDefault(); $('a', menu).focus(); }
    });
    mq.addEventListener('change', () => setOpen(false));

    // seção atual na navegação
    const links = $$('.nav__link');
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.removeAttribute('aria-current'));
        const a = map.get(en.target.id);
        if (a) a.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => io.observe(s));
  }

  /* ---------- Revelações ---------- */
  function initReveal() {
    const items = $$('[data-reveal], [data-strike]');
    if (reduceMotion || !('IntersectionObserver' in window)) { items.forEach((el) => el.classList.add('is-in')); return; }
    // escalona irmãos que entram juntos
    const io = new IntersectionObserver((entries) => {
      let n = 0;
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.style.setProperty('--d', `${Math.min(n++, 4) * 0.09}s`);
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    items.forEach((el) => io.observe(el));
  }

  /* ---------- Raízes desenhadas pela rolagem ---------- */
  function initRoots() {
    const section = $('[data-roots]');
    const path = $('[data-root]');
    if (!section || !path) return;
    if (reduceMotion) { path.style.setProperty('--draw', 1); return; }
    const body = $('.roots__body', section);
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = body.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp((vh * 0.8 - r.top) / (r.height + vh * 0.2), 0, 1);
      path.style.setProperty('--draw', p.toFixed(3));
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- Pranchas: inclinam como papel na mão ---------- */
  function initTilt() {
    if (reduceMotion || !finePointer) return;
    $$('[data-tilt]').forEach((plate) => {
      const sheet = $('.plate__sheet', plate);
      plate.addEventListener('pointermove', (e) => {
        const r = plate.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        sheet.style.setProperty('--ry', `${(x * 7).toFixed(2)}deg`);
        sheet.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`);
      });
      plate.addEventListener('pointerleave', () => {
        sheet.style.setProperty('--ry', '0deg');
        sheet.style.setProperty('--rx', '0deg');
      });
    });
  }

  /* ---------- Semente magnética ---------- */
  function initMagnetic() {
    if (reduceMotion || !finePointer) return;
    $$('[data-magnetic]').forEach((btn) => {
      const zone = btn.parentElement;
      zone.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.setProperty('--mx', `${(dx * 0.18).toFixed(1)}px`);
        btn.style.setProperty('--my', `${(dy * 0.18).toFixed(1)}px`);
      });
      zone.addEventListener('pointerleave', () => {
        btn.style.setProperty('--mx', '0px');
        btn.style.setProperty('--my', '0px');
      });
    });
  }

  initHeader();
  initRoots();
  initTilt();
  initMagnetic();
  startLoader().then(() => {
    initReveal();
    initCanopy();
  });
})();
