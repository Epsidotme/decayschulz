// script.js

(() => {
  const landing = document.getElementById("landing");
  const typingLine = document.getElementById("typingLine");
  const grantedLine = document.getElementById("grantedLine");
  const openBtn = document.getElementById("openDossierBtn");

  const statusPill = document.getElementById("statusPill");
  const statusValueEl = statusPill ? statusPill.querySelector(".status__value") : null;

  const modeToggle = document.getElementById("modeToggle");

  const tooltip = document.getElementById("tooltip");
  const locCards = Array.from(document.querySelectorAll(".locCard"));

  const linkSub = document.getElementById("linkSub");
  const linkChips = Array.from(document.querySelectorAll(".linkchip"));

  const scrambleTargets = Array.from(document.querySelectorAll('[data-scramble="true"]'));

  // ---- state for landing sequence
  let landingReady = false;     // true once OPEN DOSSIER is shown
  let landingFinished = false;  // true once overlay is hidden
  let typingAbort = false;      // used to skip typing animation

  /* ---------------------------
     Helpers
  ---------------------------- */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function setBodyMode(mode) {
    document.body.classList.remove("mode-sober", "mode-drunk");
    document.body.classList.add(mode === "drunk" ? "mode-drunk" : "mode-sober");

    if (modeToggle) {
      const isDrunk = mode === "drunk";
      modeToggle.textContent = isDrunk ? "Drunk Mode" : "Sober Mode";
      modeToggle.setAttribute("aria-pressed", String(isDrunk));
    }
  }

  /* ---------------------------
     Landing controls
  ---------------------------- */
  function showOpenButton() {
    if (!grantedLine || !openBtn) return;
    grantedLine.hidden = false;
    openBtn.hidden = false;
    landingReady = true;

    // Focus so Enter works naturally on the button
    openBtn.focus({ preventScroll: true });
  }

  function finishLandingInstant() {
    if (!typingLine || !grantedLine) return;
    typingAbort = true;
    typingLine.textContent = "ACCESSING FILE...";
    grantedLine.textContent = "ACCESS GRANTED";
    showOpenButton();
  }

  function hideLanding() {
    if (!landing || landingFinished) return;
    landing.classList.add("is-hidden");
    landing.setAttribute("aria-hidden", "true");
    landingFinished = true;
  }

  async function runLandingSequence() {
    if (!landing || !typingLine || !grantedLine || !openBtn) return;

    const fullText = "ACCESSING FILE...";
    typingLine.textContent = "";

    // Type out "ACCESSING FILE..."
    for (let i = 0; i < fullText.length; i++) {
      if (typingAbort) return;
      typingLine.textContent += fullText[i];
      await sleep(30 + Math.random() * 50);
    }

    await sleep(180);
    if (typingAbort) return;

    // Type out "ACCESS GRANTED"
    grantedLine.hidden = false;
    const grantText = "ACCESS GRANTED";
    grantedLine.textContent = "";
    for (let i = 0; i < grantText.length; i++) {
      if (typingAbort) return;
      grantedLine.textContent += grantText[i];
      await sleep(18 + Math.random() * 35);
    }

    await sleep(150);
    if (typingAbort) return;

    showOpenButton();
  }

  function handleLandingKey(e) {
    if (!landing || landingFinished || landing.classList.contains("is-hidden")) return;

    // Only care about Enter
    if (e.key !== "Enter") return;

    // Prevent accidental form submits etc.
    e.preventDefault();

    // If not ready yet, skip animations and show button immediately.
    if (!landingReady) {
      finishLandingInstant();
      return;
    }

    // Ready -> close overlay
    hideLanding();
  }

  /* ---------------------------
     Status pill alternating
  ---------------------------- */
  function startStatusLoop() {
    if (!statusValueEl) return;
    const states = ["ACTIVE", "UNSTABLE"];
    let idx = 0;

    setInterval(() => {
      idx = (idx + 1) % states.length;
      statusValueEl.textContent = states[idx];
    }, 3200);
  }

  /* ---------------------------
     Scramble / glitch hover
  ---------------------------- */
  function scrambleText(el, durationMs = 550) {
    const original = el.getAttribute("data-original") || el.textContent;
    el.setAttribute("data-original", original);

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*_-+=<>?/";
    const start = performance.now();

    function frame(now) {
      const t = now - start;
      const progress = Math.min(1, t / durationMs);
      const revealCount = Math.floor(progress * original.length);

      let out = "";
      for (let i = 0; i < original.length; i++) {
        if (i < revealCount) out += original[i];
        else out += (original[i] === " " ? " " : chars[Math.floor(Math.random() * chars.length)]);
      }

      el.textContent = out;

      if (progress < 1) requestAnimationFrame(frame);
      else el.textContent = original;
    }

    requestAnimationFrame(frame);
  }

  function wireScrambleTargets() {
    scrambleTargets.forEach((el) => {
      el.addEventListener("mouseenter", () => {
        const isDrunk = document.body.classList.contains("mode-drunk");
        scrambleText(el, isDrunk ? 750 : 450);
      });
    });
  }

  /* ---------------------------
     Accordion single open
  ---------------------------- */
  function wireAccordionSingleOpen() {
    const accordion = document.getElementById("chargesAccordion");
    if (!accordion) return;

    accordion.addEventListener("toggle", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLDetailsElement)) return;
      if (!target.open) return;

      const all = Array.from(accordion.querySelectorAll("details.acc"));
      all.forEach((d) => {
        if (d !== target) d.open = false;
      });
    });
  }

  /* ---------------------------
     Tooltip follow cursor
  ---------------------------- */
  function showTooltip(text) {
    if (!tooltip) return;
    tooltip.textContent = text;
    tooltip.classList.add("is-on");
    tooltip.setAttribute("aria-hidden", "false");
  }

  function hideTooltip() {
    if (!tooltip) return;
    tooltip.classList.remove("is-on");
    tooltip.setAttribute("aria-hidden", "true");
  }

  function moveTooltip(x, y) {
    if (!tooltip) return;
    const pad = 14;
    const offsetX = 14;
    const offsetY = 16;

    const rect = tooltip.getBoundingClientRect();
    let left = x + offsetX;
    let top = y + offsetY;

    if (left + rect.width + pad > window.innerWidth) left = x - rect.width - offsetX;
    if (top + rect.height + pad > window.innerHeight) top = y - rect.height - offsetY;

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function wireLocationTooltips() {
    if (!tooltip || locCards.length === 0) return;

    locCards.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        const quote = card.getAttribute("data-quote") || "Field notes unavailable.";
        showTooltip(quote);
      });
      card.addEventListener("mousemove", (e) => moveTooltip(e.clientX, e.clientY));
      card.addEventListener("mouseleave", hideTooltip);
    });

    window.addEventListener("scroll", hideTooltip, { passive: true });
  }

  /* ---------------------------
     Social subtitle updates
  ---------------------------- */
  function wireLinkSubtitles() {
    if (!linkSub || linkChips.length === 0) return;

    const reset = () => (linkSub.textContent = "Select a node.");

    linkChips.forEach((a) => {
      a.addEventListener("mouseenter", () => {
        const text = a.getAttribute("data-sub");
        if (text) linkSub.textContent = text;
      });
      a.addEventListener("mouseleave", reset);
      a.addEventListener("focus", () => {
        const text = a.getAttribute("data-sub");
        if (text) linkSub.textContent = text;
      });
      a.addEventListener("blur", reset);
    });
  }

  /* ---------------------------
     Mode toggle persistence
  ---------------------------- */
  function wireModeToggle() {
    if (!modeToggle) return;

    modeToggle.addEventListener("click", () => {
      const isDrunk = document.body.classList.contains("mode-drunk");
      const next = isDrunk ? "sober" : "drunk";
      setBodyMode(next);
      localStorage.setItem("ds_mode", next);
    });
  }

  function loadModeFromStorage() {
    const saved = localStorage.getItem("ds_mode");
    setBodyMode(saved === "drunk" ? "drunk" : "sober");
  }

  /* ---------------------------
     Boot
  ---------------------------- */
  function boot() {
    loadModeFromStorage();
    wireModeToggle();
    wireScrambleTargets();
    wireAccordionSingleOpen();
    wireLocationTooltips();
    wireLinkSubtitles();
    startStatusLoop();

    // Landing
    document.addEventListener("keydown", handleLandingKey);
    if (openBtn) openBtn.addEventListener("click", hideLanding);

    runLandingSequence();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

