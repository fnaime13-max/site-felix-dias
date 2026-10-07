(() => {
  "use strict";

  document.documentElement.classList.add("js");

  const config = window.SITE_CONFIG || {};
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Dados de contato ---------- */
  const links = {
    whatsapp: config.whatsapp
      ? `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(config.whatsappMensagem || "")}`
      : "",
    email: config.email ? `mailto:${config.email}` : "",
    instagram: config.instagram ? `https://www.instagram.com/${config.instagram}/` : ""
  };
  const labels = {
    ...config,
    whatsappLabel: config.whatsappLabel || "",
    instagramLabel: config.instagram ? `@${config.instagram}` : ""
  };

  document.querySelectorAll("[data-link]").forEach((el) => {
    const href = links[el.dataset.link];
    if (!href) return;
    el.href = href;
    if (el.dataset.link !== "email") {
      el.target = "_blank";
      el.rel = "noopener";
    }
  });

  document.querySelectorAll("[data-fill]").forEach((el) => {
    const value = labels[el.dataset.fill];
    if (value) el.textContent = value;
    else el.classList.add("is-pending");
  });

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Imagens ausentes viram placeholder ---------- */
  document.querySelectorAll("[data-placeholder] img").forEach((img) => {
    const mark = () => img.parentElement.classList.add("img-missing");
    if (img.complete && img.naturalWidth === 0) mark();
    else img.addEventListener("error", mark, { once: true });
  });

  /* ---------- Cabeçalho e menu ---------- */
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-menu]");

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".menu-toggle-label").textContent = open ? "Fechar" : "Menu";
    menu.classList.toggle("is-open", open);
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      toggle.focus();
    }
  });

  /* Link da seção visível no menu */
  const navLinks = [...menu.querySelectorAll('a[href^="#"]:not(.btn)')];
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => {
          if (a.getAttribute("href") === `#${entry.target.id}`) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => navObserver.observe(s));
  }

  /* ---------- Revelações ---------- */
  const startReveals = () => {
  const revealables = document.querySelectorAll(".reveal, .phrase");
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (el.classList.contains("phrase")) {
          const index = [...el.parentElement.children].indexOf(el);
          setTimeout(() => el.classList.add("is-struck"), 350 + index * 650);
        } else {
          el.classList.add("is-visible");
        }
        obs.unobserve(el);
      });
    }, { threshold: 0.25 });
    revealables.forEach((el) => revealObserver.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add("is-visible", "is-struck"));
  }
  };

  /* ---------- Abertura: anéis se desenham, contador vai a 100%, a tela "expira" para cima ----------
     O contador acompanha o carregamento real (fontes, retrato e página) e nunca passa de ~2s. */
  const intro = document.querySelector("[data-intro]");
  const runIntro = () => {
    const countEl = intro.querySelector("[data-intro-count]");
    const bar = intro.querySelector("[data-intro-bar]");
    const heroImg = document.querySelector(".hero-photo img");
    const MIN_MS = 750, MAX_MS = 2000;
    const t0 = performance.now();
    let loaded = 0, shown = 0, finished = false;
    const tasks = [
      document.fonts ? document.fonts.ready : Promise.resolve(),
      heroImg && heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve(),
      new Promise((r) => (document.readyState === "complete" ? r() : window.addEventListener("load", r, { once: true })))
    ];
    tasks.forEach((t) => t.then(() => { loaded += 1; }));

    const frame = (now) => {
      const elapsed = now - t0;
      const timeShare = Math.min(elapsed / MIN_MS, 1);
      const loadShare = loaded / tasks.length;
      // o tempo puxa até 90%; os 10% finais só chegam quando tudo carregou
      let target = Math.min(timeShare, loadShare * 0.6 + 0.4) * 90;
      if ((loaded === tasks.length && elapsed >= MIN_MS) || elapsed >= MAX_MS) target = 100;
      shown += (target - shown) * 0.22;
      if (target === 100 && shown > 99.4) shown = 100;
      countEl.textContent = String(Math.round(shown));
      bar.style.transform = `scaleX(${shown / 100})`;
      if (shown < 100) requestAnimationFrame(frame);
      else if (!finished) { finished = true; setTimeout(leave, 120); }
    };

    const leave = () => {
      intro.classList.add("is-leaving");
      setTimeout(startReveals, 300);
      setTimeout(() => intro.classList.add("is-gone"), 850);
    };

    requestAnimationFrame(frame);
  };

  let seenIntro = false;
  try { seenIntro = sessionStorage.getItem("cm-intro") === "1"; sessionStorage.setItem("cm-intro", "1"); } catch (e) {}

  if (intro && !reduceMotion.matches && !seenIntro) runIntro();
  else {
    if (intro) intro.classList.add("is-gone");
    startReveals();
  }

  /* ---------- Hero: superfície que se agita com o cursor e se acalma na pausa ----------
     Anéis levemente irregulares, como louça feita à mão ou chá na xícara. Cada movimento do
     cursor (ou toque) lança uma onda; parado, tudo volta ao repouso e o laço de desenho para. */
  const rippleCanvas = document.querySelector("[data-ripple]");
  if (rippleCanvas && rippleCanvas.getContext) {
    const ctx = rippleCanvas.getContext("2d");
    const hero = document.querySelector(".hero");
    const hint = document.querySelector("[data-ripple-hint]");
    const RINGS = 9;
    const LIFE = 3.2;            // segundos até uma onda sumir
    const SPEED = 170;           // px/s da frente de onda
    const ripples = [];
    let size = 0, dpr = 1, color = "", raf = 0, last = null, lastSpawn = 0, hinted = false;

    // irregularidade fixa de cada anel (a "mão" da ceramista)
    const wobble = Array.from({ length: RINGS }, (_, i) => ({
      a: 0.006 + (i % 3) * 0.003, f: 3 + (i % 4), p: i * 1.7
    }));

    const readColor = () => {
      color = getComputedStyle(document.documentElement).getPropertyValue("--accent-soft").trim() || "#D9906F";
    };

    const resize = () => {
      const rect = rippleCanvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = rect.width;
      rippleCanvas.width = Math.round(size * dpr);
      rippleCanvas.height = Math.round(size * dpr);
      draw(performance.now());
    };

    const draw = (now) => {
      const c = size / 2;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.15;
      const steps = 140;
      for (let i = 0; i < RINGS; i++) {
        const base = size * (0.27 + i * 0.026);
        const w = wobble[i];
        ctx.globalAlpha = 0.82 - i * 0.07;
        ctx.beginPath();
        for (let s = 0; s <= steps; s++) {
          const t = (s / steps) * Math.PI * 2;
          let r = base * (1 + w.a * Math.sin(t * w.f + w.p));
          const x0 = c + Math.cos(t) * r, y0 = c + Math.sin(t) * r;
          for (const rp of ripples) {
            const age = (now - rp.t0) / 1000;
            const d = Math.hypot(x0 - rp.x, y0 - rp.y);
            const front = d - SPEED * age;
            r += rp.amp * Math.exp(-age * 1.25) * Math.sin(front * 0.07) * Math.exp(-(front * front) / 5200);
          }
          const x = c + Math.cos(t) * r, y = c + Math.sin(t) * r;
          if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const tick = (now) => {
      for (let i = ripples.length - 1; i >= 0; i--) {
        if ((now - ripples[i].t0) / 1000 > LIFE) ripples.splice(i, 1);
      }
      draw(now);
      raf = ripples.length ? requestAnimationFrame(tick) : 0;
    };

    const spawn = (clientX, clientY, amp) => {
      const rect = rippleCanvas.getBoundingClientRect();
      const k = size / rect.width; // compensa a escala da respiração em CSS
      ripples.push({ x: (clientX - rect.left) * k, y: (clientY - rect.top) * k, amp, t0: performance.now() });
      if (ripples.length > 8) ripples.shift();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    readColor();
    rippleCanvas.parentElement.classList.add("has-canvas");
    resize();
    window.addEventListener("resize", resize);
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { readColor(); draw(performance.now()); });

    if (!reduceMotion.matches) {
      hero.addEventListener("pointermove", (e) => {
        if (e.pointerType !== "mouse") return;
        if (last) {
          const dist = Math.hypot(e.clientX - last.x, e.clientY - last.y);
          const now = performance.now();
          if (dist > 28 && now - lastSpawn > 70) {
            spawn(e.clientX, e.clientY, Math.min(4 + dist * 0.12, 13));
            lastSpawn = now;
            last = { x: e.clientX, y: e.clientY };
          }
        } else {
          last = { x: e.clientX, y: e.clientY };
        }
      });
      hero.addEventListener("pointerleave", () => { last = null; });
      hero.addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "mouse") spawn(e.clientX, e.clientY, 10);
      });

      if (hint && "IntersectionObserver" in window) {
        setTimeout(() => { if (!hinted) hint.classList.add("is-shown"); }, 1800);
        hero.addEventListener("pointermove", () => {
          if (hinted) return;
          hinted = true;
          setTimeout(() => hint.classList.remove("is-shown"), 2500);
        }, { once: true });
      }
    }
  }

  /* ---------- Pausa guiada: 4s inspira · 2s segura · 6s solta ---------- */
  const stage = document.querySelector("[data-breath]");
  const hunger = document.querySelector("[data-hunger]");

  if (stage) {
    const orb = stage.querySelector("[data-breath-orb]");
    const phaseEl = stage.querySelector("[data-breath-phase]");
    const countEl = stage.querySelector("[data-breath-count]");
    const live = stage.querySelector("[data-breath-live]");
    const toggleBtn = stage.querySelector("[data-breath-toggle]");
    const resetBtn = stage.querySelector("[data-breath-reset]");
    const cycleEl = stage.querySelector("[data-breath-cycle]");
    const bar = stage.querySelector("[data-breath-bar]");

    const PHASES = [
      { name: "Inspire", seconds: 4, scale: 1 },
      { name: "Segure", seconds: 2, scale: 1 },
      { name: "Solte", seconds: 6, scale: 0.58 }
    ];
    const CYCLES = 5;
    const CYCLE_MS = PHASES.reduce((t, p) => t + p.seconds, 0) * 1000;
    const TOTAL_MS = CYCLE_MS * CYCLES;
    const CIRC = 2 * Math.PI * 96;

    let state = "idle"; // idle | running | paused | done
    let elapsed = 0;
    let startedAt = 0;
    let timer = 0;
    let lastPhaseKey = "";

    const locate = (ms) => {
      const cycle = Math.floor(ms / CYCLE_MS);
      let inCycle = ms % CYCLE_MS;
      for (let i = 0; i < PHASES.length; i++) {
        const len = PHASES[i].seconds * 1000;
        if (inCycle < len) return { cycle, index: i, remaining: len - inCycle };
        inCycle -= len;
      }
      return { cycle, index: PHASES.length - 1, remaining: 0 };
    };

    const setOrb = (scale, seconds) => {
      orb.style.transitionDuration = `${seconds}s`;
      orb.style.transform = `scale(${scale})`;
    };

    const freezeOrb = () => {
      const current = getComputedStyle(orb).transform;
      orb.style.transitionDuration = "0s";
      orb.style.transform = current === "none" ? "" : current;
    };

    const render = () => {
      const now = state === "running" ? elapsed + (performance.now() - startedAt) : elapsed;
      if (now >= TOTAL_MS) return finish();

      const { cycle, index, remaining } = locate(now);
      const phase = PHASES[index];
      const key = `${cycle}-${index}`;

      if (key !== lastPhaseKey) {
        lastPhaseKey = key;
        phaseEl.textContent = phase.name;
        live.textContent = phase.name;
        cycleEl.textContent = `Respiração ${cycle + 1} de ${CYCLES}`;
        setOrb(phase.scale, remaining / 1000);
      }
      countEl.textContent = String(Math.ceil(remaining / 1000));
      bar.style.strokeDashoffset = String(CIRC * (1 - now / TOTAL_MS));
    };

    const loop = () => {
      render();
      if (state === "running") timer = window.setTimeout(loop, 200);
    };

    const start = () => {
      if (state === "done" || state === "idle") {
        elapsed = 0;
        lastPhaseKey = "";
        // fixa o ponto de partida antes de inspirar, para a transição sempre acontecer
        stage.classList.remove("is-idle");
        orb.style.transitionDuration = "0s";
        orb.style.transform = "scale(0.58)";
        void orb.offsetWidth;
      }
      state = "running";
      startedAt = performance.now();
      stage.classList.remove("is-idle");
      toggleBtn.textContent = "Pausar";
      resetBtn.hidden = false;
      if (lastPhaseKey) {
        // retoma a fase atual de onde parou
        const { index, remaining } = locate(elapsed);
        setOrb(PHASES[index].scale, remaining / 1000);
      }
      loop();
    };

    const pause = () => {
      elapsed += performance.now() - startedAt;
      state = "paused";
      window.clearTimeout(timer);
      freezeOrb();
      phaseEl.textContent = "Em pausa";
      live.textContent = "Exercício pausado";
      toggleBtn.textContent = "Continuar";
    };

    const reset = () => {
      window.clearTimeout(timer);
      state = "idle";
      elapsed = 0;
      lastPhaseKey = "";
      setOrb(0.58, 1.2);
      stage.classList.add("is-idle");
      phaseEl.textContent = "Vamos?";
      countEl.textContent = "1 min";
      cycleEl.textContent = "5 respirações · cerca de 1 minuto";
      bar.style.strokeDashoffset = String(CIRC);
      toggleBtn.textContent = "Começar a pausa";
      resetBtn.hidden = true;
      live.textContent = "";
    };

    function finish() {
      window.clearTimeout(timer);
      state = "done";
      setOrb(0.72, 2);
      phaseEl.textContent = "Pronto";
      countEl.textContent = "";
      cycleEl.textContent = "Um minuto só seu.";
      bar.style.strokeDashoffset = "0";
      toggleBtn.textContent = "Fazer de novo";
      resetBtn.hidden = true;
      live.textContent = "Pausa concluída. Agora, perceba quanta fome você sente.";
      if (hunger) hunger.classList.add("is-invited");
    }

    stage.classList.add("is-idle");
    bar.style.strokeDashoffset = String(CIRC);

    toggleBtn.addEventListener("click", () => {
      if (state === "running") pause();
      else start();
    });
    resetBtn.addEventListener("click", () => { reset(); toggleBtn.focus(); });

    // Se a pessoa sair da página no meio do exercício, ele pausa sozinho
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && state === "running") pause();
    });
  }

  /* ---------- Escala de fome ---------- */
  if (hunger) {
    const range = hunger.querySelector("[data-hunger-range]");
    const reading = hunger.querySelector("[data-hunger-reading]");
    const levelEl = hunger.querySelector("[data-hunger-level]");
    const descEl = hunger.querySelector("[data-hunger-desc]");
    const hintEl = hunger.querySelector("[data-hunger-hint]");

    const SCALE = {
      1: ["Fome intensa", "Sem energia, irritação, dificuldade de pensar em outra coisa."],
      2: ["Muita fome", "Difícil se concentrar; qualquer coisa serve."],
      3: ["Fome clara", "O corpo pede comida com sinais nítidos."],
      4: ["Começando a sentir fome", "Os primeiros sinais aparecem, ainda sem pressa."],
      5: ["Neutra", "Nem fome, nem saciedade."],
      6: ["Satisfação leve", "A fome passou, mas ainda caberia um pouco mais."],
      7: ["Saciedade confortável", "Fome resolvida, sem sensação de peso."],
      8: ["Além da conta", "Um pouco mais do que o corpo pedia."],
      9: ["Bem além da conta", "Desconforto e sensação de peso."],
      10: ["Desconforto intenso", "Estufamento e mal-estar."]
    };
    const HINTS = [
      [2, "Quando a fome chega aqui, escolher com calma fica bem mais difícil. Perceber esse ponto já é cuidado."],
      [4, "Um bom momento para comer, com tempo para escolher o que faz sentido."],
      [5, "Se a vontade de comer aparece agora, vale perguntar com carinho: é fome ou é outra coisa?"],
      [7, "Muita gente encontra aqui um ponto confortável para encerrar a refeição."],
      [10, "Sem culpa. Notar como o corpo se sente é o primeiro passo para entender o que levou até aqui."]
    ];

    const update = (animate) => {
      const value = Number(range.value);
      const [label, desc] = SCALE[value];
      levelEl.textContent = `${value} · ${label}`;
      descEl.textContent = desc;
      hintEl.textContent = HINTS.find(([max]) => value <= max)[1];
      range.setAttribute("aria-valuetext", `${value}, ${label}`);
      range.style.setProperty("--fill", `${((value - 1) / 9) * 100}%`);
      if (animate && !reduceMotion.matches) {
        reading.classList.remove("is-updating");
        void reading.offsetWidth;
        reading.classList.add("is-updating");
      }
    };

    range.addEventListener("input", () => update(true));
    update(false);
  }
})();
