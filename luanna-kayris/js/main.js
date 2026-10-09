/* ==========================================================================
   Luanna Kayris — interações
   ========================================================================== */

/* ---- Dados editáveis --------------------------------------------------------
   whatsapp: só números, com DDI + DDD (ex.: "5531999909358").
   Se ficar vazio, os botões "Agendar" abrem o Direct do Instagram.
   reviews: avaliações copiadas do Google — { name, text, rating } (rating de 1 a 5).
   Enquanto a lista estiver vazia, aparece um aviso de pendência no lugar. */
const CONFIG = {
  whatsapp: '5531999909358',
  whatsappMessage: 'Olá, Luanna! Vim pelo site e gostaria de agendar uma consulta.',
  instagram: 'nutriluannakayris',
  googleReviewsUrl: '', // link "Ver todas no Google" (perfil da empresa no Google)
  reviews: [
    { name: 'Karina A.', rating: 5, text: 'Consegui meu objetivo emagrecimento e ganho de massa magra. Profissional competente, focada em resultados, respeitando seus limites!' },
    { name: 'Alessandra G.', rating: 5, text: 'Pra mim uma profissional diferenciada , atenciosa , onde visa os gostos da gente que faz dieta onde não sofremos pra alcançar nosso objetivo! Eu eu indico 😍 !!!' },
    { name: 'Barbara C.', rating: 5, text: 'Profissional com excelência, foca nos nossos objetivos que queremos , super indico !!' },
    { name: 'Eunice M.', rating: 5, text: 'Fiz e ainda faço acompanhamento com essa excelente profissional para chegar no meu objetivo. Ótima, minha filha tbm tá consultando com ela e tá dando super certo 🙏' },
    { name: 'Renata M.', rating: 5, text: 'A melhor de BH\nProfissional ímpar ❤️' },
    { name: 'Yuri S.', rating: 5, text: 'Excelente profissional , avaliação bem completa e detalhada , estou adorando os resultados depois da consulta.' },
    { name: 'Ana Maria R.', rating: 5, text: 'Olá, Sim é uma ótima profissional para te acompanhar e o resultado vem.' },
    { name: 'Dulio F.', rating: 5, text: 'Excelente profissional. Alto nível de conhecimento! Atingindo meus objetivos!!' },
    { name: 'Ingrid R.', rating: 5, text: 'Excelente atendimento, Luana é muito atenciosa!!!!' },
  ],
};

(() => {
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- Links de contato ---------- */
  if (CONFIG.whatsapp) {
    const wa = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(CONFIG.whatsappMessage)}`;
    document.querySelectorAll('[data-cta]').forEach((a) => { a.href = wa; });
  } else {
    document.querySelectorAll('[data-cta]').forEach((a) => { a.href = `https://ig.me/m/${CONFIG.instagram}`; });
  }
  document.querySelectorAll('[data-instagram]').forEach((a) => { a.href = `https://www.instagram.com/${CONFIG.instagram}/`; });
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Avaliações do Google ---------- */
  const reviewsList = document.getElementById('reviewsList');
  if (CONFIG.googleReviewsUrl) document.getElementById('reviewsLink').href = CONFIG.googleReviewsUrl;
  if (CONFIG.reviews.length) {
    CONFIG.reviews.forEach(({ name, text, rating = 5 }) => {
      const li = document.createElement('li');
      li.className = 'review';
      const stars = document.createElement('p');
      stars.className = 'review__stars';
      stars.setAttribute('aria-label', `${rating} de 5 estrelas`);
      stars.textContent = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      const quote = document.createElement('blockquote');
      quote.className = 'review__text';
      quote.style.margin = '0';
      quote.textContent = `“${text}”`;
      const author = document.createElement('p');
      author.className = 'review__name';
      const avatar = document.createElement('span');
      avatar.className = 'review__avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.textContent = name.charAt(0);
      author.append(avatar, name);
      li.append(stars, quote, author);
      reviewsList.appendChild(li);
    });
  } else {
    reviewsList.innerHTML = '<li class="review review--pending"><span class="pending">{{PREENCHER: avaliações do Google — ver js/main.js → CONFIG.reviews}}</span></li>';
  }

  /* ---------- Imagens: placeholder quando o arquivo ainda não existe ---------- */
  document.querySelectorAll('.media img').forEach((img) => {
    const fig = img.closest('.media');
    const miss = () => fig.classList.add('is-missing');
    if (img.complete && img.naturalWidth === 0) miss();
    img.addEventListener('error', miss);
    img.addEventListener('load', () => fig.classList.remove('is-missing'));
  });

  /* ---------- Menu mobile ---------- */
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.getElementById('nav');
  const setMenu = (open) => {
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.querySelector('.menu-btn__label').textContent = open ? 'Fechar' : 'Menu';
    document.body.style.overflow = open ? 'hidden' : '';
  };
  menuBtn.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); }
  });
  matchMedia('(min-width: 900px)').addEventListener('change', () => setMenu(false));

  /* ---------- Link ativo na navegação ---------- */
  const navLinks = [...document.querySelectorAll('.nav__list a')];
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => {
        if (a.getAttribute('href') === `#${entry.target.id}`) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach((a) => {
    const section = document.querySelector(a.getAttribute('href'));
    if (section) navObserver.observe(section);
  });

  /* ---------- Revelação ao rolar ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-in'); revealObserver.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));

  document.querySelectorAll('[data-intro]').forEach((el, i) => el.style.setProperty('--i', i));

  /* ==========================================================================
     Pulso do hero — linha de ECG que corre num ritmo constante (72 bpm).
     Passa por trás da foto e não reage ao cursor.
     ========================================================================== */
  const hero = document.querySelector('.hero');
  const canvas = document.getElementById('pulse');
  const heroMedia = document.querySelector('.hero__media');
  const ctx = canvas.getContext('2d');

  // Forma de um batimento (P, QRS, T) — x de 0 a 1, y negativo = para cima
  const BEAT = [[0, 0], [0.1, 0], [0.14, -0.12], [0.18, 0], [0.22, 0], [0.235, 0.12], [0.265, -1], [0.295, 0.38], [0.315, 0], [0.42, 0], [0.49, -0.24], [0.56, 0], [1, 0]];
  const ecg = (u) => {
    for (let k = 1; k < BEAT.length; k++) {
      if (u <= BEAT[k][0]) {
        const [x0, y0] = BEAT[k - 1];
        const [x1, y1] = BEAT[k];
        return y0 + (y1 - y0) * ((u - x0) / (x1 - x0));
      }
    }
    return 0;
  };

  const STEP = 4;
  const BPM = 72;
  const pulse = {
    w: 0, h: 0, dpr: 1, baseY: 0, amp: 60, spacing: 460,
    offset: 0, reveal: 0,
    running: false, visible: true, started: false, last: 0,
  };

  // A linha corre na faixa livre entre o título e o parágrafo, sem tocar nas letras.
  // offsetTop ignora os transforms da entrada, então a medida já é a posição final.
  const heroCopy = document.querySelector('.hero__copy');
  const heroTitle = document.querySelector('.hero__title');
  const heroLead = document.querySelector('.hero__lead');
  const sizePulse = () => {
    const rect = hero.getBoundingClientRect();
    const copyTop = heroCopy.getBoundingClientRect().top - rect.top;
    pulse.dpr = Math.min(window.devicePixelRatio || 1, 2);
    pulse.w = rect.width;
    pulse.h = rect.height;
    canvas.width = Math.round(rect.width * pulse.dpr);
    canvas.height = Math.round(rect.height * pulse.dpr);
    const mobile = rect.width < 900;
    const titleBottom = copyTop + heroTitle.offsetTop + heroTitle.offsetHeight;
    const leadTop = copyTop + heroLead.offsetTop;
    const gap = leadTop - titleBottom;
    // Pico sobe 1×amp e desce 0,38×amp; deixa 8px de folga de cada lado
    pulse.amp = Math.max(12, Math.min(mobile ? 40 : 60, (gap - 16) / 1.38));
    pulse.baseY = titleBottom + 8 + pulse.amp;
    pulse.spacing = mobile ? 300 : 520;
  };

  const drawPulse = () => {
    const { w, h, dpr, baseY, amp, spacing, offset } = pulse;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const visibleW = w * pulse.reveal;
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, 'rgba(15,159,167,0)');
    grad.addColorStop(0.12, 'rgba(15,159,167,0.38)');
    grad.addColorStop(0.7, 'rgba(25,194,201,0.42)');
    grad.addColorStop(0.92, 'rgba(150,220,110,0.38)');
    grad.addColorStop(1, 'rgba(201,242,107,0)');

    ctx.beginPath();
    for (let x = 0; x <= visibleW; x += STEP) {
      const u = (((x - offset) / spacing) % 1 + 1) % 1;
      const y = baseY + amp * ecg(u);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(25,194,201,0.25)';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const stepPulse = (now) => {
    if (!pulse.running) return;
    const dt = Math.min((now - pulse.last) / 1000, 0.05);
    pulse.last = now;
    pulse.offset += dt * pulse.spacing * (BPM / 60) * 0.55;
    pulse.reveal = Math.min(1, pulse.reveal + dt / 1.4);
    drawPulse();
    requestAnimationFrame(stepPulse);
  };

  const playPulse = () => {
    if (pulse.running || !pulse.started || !pulse.visible || document.hidden) return;
    pulse.running = true;
    pulse.last = performance.now();
    requestAnimationFrame(stepPulse);
  };
  const pausePulse = () => { pulse.running = false; };

  const startPulse = () => {
    sizePulse();
    pulse.started = true;
    if (reduceMotion) { pulse.reveal = 1; drawPulse(); return; }
    playPulse();
  };

  new IntersectionObserver(([entry]) => {
    pulse.visible = entry.isIntersecting;
    if (pulse.visible) playPulse(); else pausePulse();
  }).observe(hero);
  document.addEventListener('visibilitychange', () => (document.hidden ? pausePulse() : playPulse()));

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!pulse.started) return;
      sizePulse();
      if (reduceMotion) drawPulse();
    }, 120);
  });

  /* ---------- Botões magnéticos ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('[data-magnetic]').forEach((btn) => {
      btn.style.transition += ', transform 450ms cubic-bezier(0.22, 1, 0.36, 1)';
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * 0.22;
        const y = (e.clientY - (r.top + r.height / 2)) * 0.35;
        btn.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- Menos × Mais: o divisor segue o cursor ---------- */
  const stage = document.getElementById('sides');
  const sides = { current: 0.5, target: 0.5, running: false };
  const tickSides = () => {
    sides.current = lerp(sides.current, sides.target, 0.09);
    stage.style.setProperty('--split', sides.current.toFixed(4));
    if (Math.abs(sides.current - sides.target) > 0.0005) requestAnimationFrame(tickSides);
    else sides.running = false;
  };
  const aimSides = (value) => {
    sides.target = value;
    if (reduceMotion) { sides.current = value; stage.style.setProperty('--split', value); return; }
    if (!sides.running) { sides.running = true; requestAnimationFrame(tickSides); }
  };
  const wideScreen = matchMedia('(min-width: 900px)');
  stage.addEventListener('pointermove', (e) => {
    if (!wideScreen.matches || e.pointerType !== 'mouse') return;
    const r = stage.getBoundingClientRect();
    const ratio = clamp((e.clientX - r.left) / r.width, 0, 1);
    aimSides(0.6 - ratio * 0.2);
  });
  stage.addEventListener('pointerleave', () => aimSides(0.5));

  /* ---------- Scroll: header, manifesto palavra a palavra, linha das etapas ---------- */
  const header = document.querySelector('.header');
  const manifesto = document.querySelector('[data-words]');
  const words = [];
  const splitWords = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const span = document.createElement('span');
          span.className = 'w';
          span.textContent = part;
          words.push(span);
          frag.appendChild(span);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        splitWords(child);
      }
    });
  };
  if (!reduceMotion) splitWords(manifesto);

  const track = document.getElementById('stepsTrack');
  const stepsList = track.querySelector('.steps__list');

  let scrollQueued = false;
  const onScroll = () => {
    scrollQueued = false;
    const vh = window.innerHeight;
    header.classList.toggle('is-scrolled', window.scrollY > 24);

    if (words.length) {
      const r = manifesto.getBoundingClientRect();
      const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
      const lit = p * (words.length + 4);
      words.forEach((w, i) => w.style.setProperty('--o', (0.18 + 0.82 * clamp(lit - i, 0, 1)).toFixed(3)));
    }

    const tr = track.getBoundingClientRect();
    const p = reduceMotion
      ? 1
      : wideScreen.matches
        ? clamp((vh * 0.85 - tr.top) / (vh * 0.55), 0, 1)
        : clamp((vh * 0.75 - tr.top) / tr.height, 0, 1);
    track.style.setProperty('--off', (1 - p).toFixed(4));
    stepsList.style.setProperty('--p', p.toFixed(4));
  };
  window.addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ==========================================================================
     Abertura — contagem 0 → 100 desenhando o pulso, depois a tela se parte na linha.
     ========================================================================== */
  const loader = document.getElementById('loader');
  const countEl = document.getElementById('loaderCount');
  const loaderBpm = document.getElementById('loaderBpm');
  const loaderPath = document.getElementById('loaderPath');
  const MIN_DURATION = reduceMotion ? 500 : 2600;
  const start = performance.now();
  let pageLoaded = document.readyState === 'complete';
  let shown = 0;

  const markLoaded = () => {
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    fonts.then(() => { pageLoaded = true; });
  };
  if (pageLoaded) markLoaded(); else window.addEventListener('load', markLoaded, { once: true });
  setTimeout(() => { pageLoaded = true; }, 7000); // nunca prender o visitante

  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  const finishLoader = () => {
    countEl.textContent = '100';
    setTimeout(() => {
      loader.classList.add('is-done');
      root.classList.remove('is-loading');
      root.classList.add('is-ready');
      startPulse();
      setTimeout(() => heroMedia.classList.add('is-settled'), 1700);
      setTimeout(() => loader.classList.add('is-gone'), 1300);
    }, reduceMotion ? 0 : 280);
  };

  const tickLoader = (now) => {
    let t = clamp((now - start) / MIN_DURATION, 0, 1);
    if (!pageLoaded) t = Math.min(t, 0.9);
    shown = Math.max(shown, easeInOut(t));
    countEl.textContent = Math.round(shown * 100);
    loaderBpm.textContent = Math.round(60 + shown * 68);
    loaderPath.style.strokeDashoffset = (1 - shown).toFixed(4);
    if (shown >= 1) finishLoader();
    else requestAnimationFrame(tickLoader);
  };
  requestAnimationFrame(tickLoader);
})();
