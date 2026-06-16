// ============================================================
//  MUKAMI OHANA — script.js (fixed & enhanced)
// ============================================================

// 1. Starry Sky Generation
function createStars() {
  const starsContainer = document.getElementById("stars");
  if (!starsContainer) return;
  const starCount = window.innerWidth < 480 ? 40 : 100;

  for (let i = 0; i < starCount; i++) {
    const star = document.createElement("div");
    star.className = "star";
    const size = Math.random() * 3 + 1;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 3}s`;
    star.style.animationDuration = `${Math.random() * 3 + 2}s`;
    starsContainer.appendChild(star);
  }
}

// 2. Floating Hearts Background
function createFloatingHearts() {
  const container = document.getElementById("floating-hearts");
  if (!container || floatingHeartInterval) return;

  const heartSymbols = ["💜", "🌸", "💕", "✨", "💙"];

  function spawnHeart() {
    if (document.hidden) return;

    const heart = document.createElement("div");
    heart.className = "floating-heart";
    heart.innerText =
      heartSymbols[Math.floor(Math.random() * heartSymbols.length)];
    const duration = Math.random() * 8 + 8;
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.fontSize = `${Math.random() * 1.2 + 0.8}rem`;
    heart.style.animationDuration = `${duration}s`;
    heart.style.animationDelay = `${Math.random() * 1.5}s`;
    container.appendChild(heart);
    setTimeout(() => heart.remove(), (duration + 2) * 1000);
  }

  for (let i = 0; i < 5; i++) spawnHeart();
  floatingHeartInterval = window.setInterval(spawnHeart, 2200);
}

// 3. Cursor Heart Trail + Click Sparkles
function initCursorEffects() {
  const symbols = ["💜", "🌸", "💕", "✨"];
  const sparkleSyms = ["✨", "⭐", "💫", "🌟"];

  document.addEventListener("mousemove", (e) => {
    if (Math.random() > 0.85) {
      // throttle — only ~15 % of moves
      const el = document.createElement("div");
      el.className = "cursor-heart";
      el.innerText = symbols[Math.floor(Math.random() * symbols.length)];
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 800);
    }
  });

  document.addEventListener("click", (e) => {
    for (let i = 0; i < 6; i++) {
      const sp = document.createElement("div");
      sp.className = "sparkle";
      sp.innerText =
        sparkleSyms[Math.floor(Math.random() * sparkleSyms.length)];
      sp.style.left = `${e.clientX}px`;
      sp.style.top = `${e.clientY}px`;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 60 + 30;
      sp.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
      sp.style.setProperty("--ty", `${Math.sin(angle) * dist}px`);
      document.body.appendChild(sp);
      setTimeout(() => sp.remove(), 600);
    }
  });
}

// ============================================================
//  AUDIO ENGINE
// ============================================================
let audioCtx = null;
let isPlaying = false;
let soundTimer = null;
let ambientNodes = [];
let floatingHeartInterval = null;
let shootingStarTimeout = null;
let hasInitializedScrollReveal = false;
let deferredInstallPrompt = null;
let hasTypedSuccessLetter = false;
let envelopeOpen = false;
const SECRET_WORD = "ohana";

function initAudio() {
  try {
    // Close any pre-existing context first
    if (audioCtx && audioCtx.state !== "closed") {
      audioCtx.close();
    }
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // A. Ocean Waves — filtered noise
    const bufferSize = audioCtx.sampleRate * 5;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = buffer;
    noiseNode.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 1.2;
    filter.frequency.value = 400;

    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 250;

    const waveGain = audioCtx.createGain();
    waveGain.gain.value = 0.08;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    noiseNode.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(audioCtx.destination);

    lfo.start();
    noiseNode.start();

    ambientNodes = [noiseNode, lfo, filter, waveGain];

    playAmbientMelody();
    isPlaying = true;
    updateMusicBtn(true);
  } catch (e) {
    console.error("Audio init failed", e);
  }
}

function stopAudio() {
  if (soundTimer) {
    clearInterval(soundTimer);
    soundTimer = null;
  }
  ambientNodes.forEach((node) => {
    try {
      node.stop();
    } catch (_) {}
    try {
      node.disconnect();
    } catch (_) {}
  });
  ambientNodes = [];
  isPlaying = false;
  updateMusicBtn(false);
  // Do NOT close audioCtx so resume works
}

function updateMusicBtn(playing) {
  const btn = document.getElementById("music-btn");
  if (!btn) return;

  const span = btn.querySelector("span");
  btn.classList.toggle("playing", playing);
  btn.setAttribute("aria-pressed", String(playing));
  btn.setAttribute(
    "aria-label",
    playing ? "Mute ambient sound" : "Play ambient sound",
  );

  if (span) span.innerText = playing ? "Mute Sound" : "Play Sound";
}

function toggleSound() {
  if (isPlaying) {
    stopAudio();
  } else if (!audioCtx || audioCtx.state === "closed") {
    initAudio();
  } else if (audioCtx.state === "suspended") {
    audioCtx.resume().then(() => {
      playAmbientMelody();
      isPlaying = true;
      updateMusicBtn(true);
    });
  } else {
    initAudio();
  }
}

// Pluck Synth
function playPluck(frequency, time, duration, gainVal = 0.15) {
  if (!audioCtx || !frequency || isNaN(frequency)) return;

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(frequency, time);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(800, time);
  filter.frequency.exponentialRampToValueAtTime(150, time + duration);

  gainNode.gain.setValueAtTime(0, time);
  gainNode.gain.linearRampToValueAtTime(gainVal, time + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc.start(time);
  osc.stop(time + duration + 0.1);
}

// Note frequencies — FIX: added F4 (349.23 Hz) which was missing
const notes = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  A3: 220.0,
  F3: 174.61,
  G3: 196.0,
  C5: 523.25,
};

const chordProgression = [
  [notes.C4, notes.E4, notes.G4, notes.C5],
  [notes.A3, notes.C4, notes.E4, notes.A4],
  [notes.F3, notes.C4, notes.A4, notes.C5],
  [notes.G3, notes.D4, notes.G4, notes.B4],
];

let currentChordIdx = 0;

function playAmbientMelody() {
  if (soundTimer) clearInterval(soundTimer);

  function playMeasure() {
    if (!audioCtx || audioCtx.state === "closed") return;
    const chord = chordProgression[currentChordIdx];
    const now = audioCtx.currentTime;

    playPluck(chord[0], now, 1.2, 0.15);
    playPluck(chord[1], now + 0.4, 1.0, 0.12);
    playPluck(chord[2], now + 0.8, 0.8, 0.12);
    playPluck(chord[3], now + 1.2, 0.8, 0.15);

    if (Math.random() > 0.4) {
      const highNotes = [notes.E4 * 2, notes.G4 * 2, notes.C5 * 2];
      playPluck(
        highNotes[Math.floor(Math.random() * highNotes.length)],
        now + 1.6,
        0.6,
        0.08,
      );
    }

    currentChordIdx = (currentChordIdx + 1) % chordProgression.length;
  }

  playMeasure();
  soundTimer = setInterval(playMeasure, 2400);
}

// Victory song — uses F4 now (fixed NaN bug)
function playVictorySong() {
  if (soundTimer) {
    clearInterval(soundTimer);
    soundTimer = null;
  }
  stopAudio();

  try {
    // Close existing context to prevent leak
    if (audioCtx && audioCtx.state !== "closed") {
      audioCtx.close();
    }
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    isPlaying = true;

    const tempo = 0.22;
    const victoryNotes = [
      notes.C4,
      notes.E4,
      notes.G4,
      notes.C5,
      notes.G4,
      notes.C5,
      notes.E4 * 2,
      notes.C5 * 2,
    ];
    const now = audioCtx.currentTime;
    victoryNotes.forEach((freq, idx) =>
      playPluck(freq, now + idx * tempo, 0.4, 0.2),
    );

    // FIX: was notes.F4 * 2 with undefined F4; now F4 = 349.23 is defined
    const happyProgression = [
      [notes.C4, notes.E4, notes.G4, notes.C5],
      [notes.F3, notes.A4, notes.C5, notes.F4 * 2],
      [notes.C4, notes.E4, notes.G4, notes.C5],
      [notes.G3, notes.B4, notes.D4, notes.G4 * 2],
    ];

    let happyChordIdx = 0;
    function playHappyBeat() {
      if (!audioCtx || audioCtx.state === "closed") return;
      const chord = happyProgression[happyChordIdx];
      const t = audioCtx.currentTime;
      playPluck(chord[0], t, 0.4, 0.18);
      playPluck(chord[2], t + 0.2, 0.3, 0.15);
      playPluck(chord[1], t + 0.4, 0.4, 0.18);
      playPluck(chord[3], t + 0.6, 0.3, 0.15);
      happyChordIdx = (happyChordIdx + 1) % happyProgression.length;
    }

    setTimeout(
      () => {
        playHappyBeat();
        soundTimer = setInterval(playHappyBeat, 800);
      },
      victoryNotes.length * tempo * 1000,
    );
  } catch (e) {
    console.error("Victory audio failed", e);
  }
}

// ============================================================
//  SAVE / RESTORE STATE (localStorage)
// ============================================================
const STORAGE_KEY = "mukami-ohana-state";

function saveState(sectionId, extras = {}) {
  try {
    const state = { section: sectionId, ...extras };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

// ============================================================
//  SECTION TRANSITIONS
// ============================================================
function onSectionActivated(sectionId) {
  if (sectionId === "success-section") {
    startDaysCounter();
    startCountdownInterval();
    startSuccessLetterTypewriter();
  }
}

function showSection(fromId, toId) {
  const from = document.getElementById(fromId);
  const to = document.getElementById(toId);
  if (!from || !to) return;

  from.style.transition = "opacity 0.45s ease, transform 0.45s ease";
  from.style.opacity = "0";
  from.style.transform = "translateY(-20px)";

  setTimeout(() => {
    from.classList.remove("active");
    from.style.opacity = "";
    from.style.transform = "";
    from.style.transition = "";

    to.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
    saveState(toId, { envelopeOpen });
    onSectionActivated(toId);
  }, 460);
}

// ============================================================
//  SCROLL-TRIGGERED CARD REVEAL (IntersectionObserver)
// ============================================================
function initScrollReveal() {
  if (hasInitializedScrollReveal) return;

  const cards = document.querySelectorAll(".love-card-wrapper");
  if (!cards.length) return;

  if (
    !("IntersectionObserver" in window) ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    cards.forEach((card) => card.classList.add("visible"));
    hasInitializedScrollReveal = true;
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );

  cards.forEach((card) => observer.observe(card));
  hasInitializedScrollReveal = true;
}

// ============================================================
//  ENVELOPE / SECTION BUTTONS
// ============================================================
function initSectionControls() {
  const envelope = document.getElementById("envelope");
  const openStoryBtn = document.getElementById("open-story-btn");
  const toSuccessBtn = document.getElementById("to-success-btn");
  const replayBtn = document.getElementById("replay-journey-btn");

  if (envelope) {
    envelope.addEventListener("click", () => {
      if (!envelope.classList.contains("open")) {
        envelope.classList.add("open");
        saveState("envelope-section", { envelopeOpen: true });
        if (!audioCtx) {
          initAudio();
        } else if (!isPlaying) {
          toggleSound();
        }
      }
    });
  }

  if (openStoryBtn) {
    openStoryBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      initScrollReveal();
      showSection("envelope-section", "story-section");
    });
  }

  if (toSuccessBtn) {
    toSuccessBtn.addEventListener("click", () => {
      showSection("story-section", "success-section");
    });
  }

  if (replayBtn) {
    replayBtn.addEventListener("click", () => {
      // Clear state and reset
      localStorage.removeItem(STORAGE_KEY);
      hasTypedSuccessLetter = false;
      envelopeOpen = false;

      const env = document.getElementById("envelope");
      if (env) env.classList.remove("open");

      stopConfetti();
      stopAudio();

      document
        .querySelectorAll(".typewriter-target, .typewriter-letter-line")
        .forEach((el) => {
          el.textContent = "";
        });

      showSection("envelope-section", "envelope-section");
      window.scrollTo(0, 0);
    });
  }
}


// ============================================================
//  [REMOVED: Proposal-specific buttons]
// ============================================================


// ============================================================
//  CONFETTI — with cleanup ref
// ============================================================
let confettiInterval = null;

function stopConfetti() {
  if (confettiInterval) {
    clearInterval(confettiInterval);
    confettiInterval = null;
  }
}

function triggerConfetti() {
  if (confettiInterval) return; // don't double-start
  const symbols = ["💜", "🌸", "✨", "💕", "💙", "🌺", "⭐"];

  confettiInterval = setInterval(() => {
    const el = document.createElement("div");
    el.className = "confetti";
    el.innerText = symbols[Math.floor(Math.random() * symbols.length)];
    el.style.fontSize = `${Math.random() * 20 + 10}px`;
    el.style.left = `${Math.random() * 100}vw`;
    el.style.top = "-20px";
    const dur = Math.random() * 3 + 3;
    el.style.animationDuration = `${dur}s`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), dur * 1000 + 200);
  }, 180);
}

// ============================================================
//  VOICE NOTE
// ============================================================
function initVoiceNote() {
  const voiceBtn = document.getElementById("voice-btn");
  const voiceAudio = document.getElementById("voice-audio");
  const voiceProgress = document.getElementById("voice-progress");
  const voiceStatus = document.getElementById("voice-status");
  const voiceTime = document.getElementById("voice-time");
  const voiceHelp = document.getElementById("voice-help");
  if (
    !voiceBtn ||
    !voiceAudio ||
    !voiceProgress ||
    !voiceStatus ||
    !voiceTime ||
    !voiceHelp
  )
    return;

  function formatTime(time) {
    if (!Number.isFinite(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }

  function updateVoiceProgress() {
    const duration = Number.isFinite(voiceAudio.duration)
      ? voiceAudio.duration
      : 0;
    const current = Number.isFinite(voiceAudio.currentTime)
      ? voiceAudio.currentTime
      : 0;
    voiceProgress.value = duration ? (current / duration) * 100 : 0;
    voiceTime.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
  }

  function setVoicePlayingState(playing) {
    voiceBtn.classList.toggle("playing", playing);
    voiceBtn.setAttribute("aria-pressed", String(playing));
    voiceBtn.setAttribute(
      "aria-label",
      playing ? "Pause voice note" : "Play voice note",
    );
    voiceStatus.textContent = playing ? "Now playing" : "Ready to play";
  }

  voiceBtn.addEventListener("click", () => {
    if (voiceAudio.paused) {
      if (ambientNodes[3]) ambientNodes[3].gain.value = 0.02;
      voiceHelp.textContent = "";
      voiceAudio
        .play()
        .then(() => setVoicePlayingState(true))
        .catch(() => {
          setVoicePlayingState(false);
          voiceHelp.textContent =
            "Voice note unavailable. Add or regenerate 'voice-note.wav'.";
        });
    } else {
      voiceAudio.pause();
      setVoicePlayingState(false);
      if (ambientNodes[3]) ambientNodes[3].gain.value = 0.08;
    }
  });

  voiceProgress.addEventListener("input", () => {
    if (!Number.isFinite(voiceAudio.duration) || voiceAudio.duration <= 0)
      return;
    voiceAudio.currentTime =
      (Number(voiceProgress.value) / 100) * voiceAudio.duration;
    updateVoiceProgress();
  });

  voiceAudio.addEventListener("loadedmetadata", updateVoiceProgress);
  voiceAudio.addEventListener("timeupdate", updateVoiceProgress);

  voiceAudio.addEventListener("ended", () => {
    setVoicePlayingState(false);
    updateVoiceProgress();
    if (ambientNodes[3]) ambientNodes[3].gain.value = 0.08;
    voiceStatus.textContent = "Finished playing";
  });

  voiceAudio.addEventListener("pause", () => {
    if (!voiceAudio.ended) setVoicePlayingState(false);
  });

  voiceAudio.addEventListener("error", () => {
    voiceHelp.textContent = "Could not load the voice note file.";
  });

  updateVoiceProgress();
}

// ============================================================
//  SHOOTING STARS
// ============================================================
function initShootingStars() {
  const container = document.getElementById("shooting-stars");
  if (!container || shootingStarTimeout) return;

  function spawnStar() {
    if (document.hidden) {
      scheduleNext();
      return;
    }
    const star = document.createElement("div");
    star.className = "shooting-star";

    // Length varies: short (60px) to long (220px)
    const length = Math.random() * 160 + 60;
    // Angle: downward diagonal, 20°–45°
    const angleDeg = Math.random() * 25 + 20;
    const angleRad = (angleDeg * Math.PI) / 180;

    // Start anywhere across the top 60% of the screen
    const startX = Math.random() * window.innerWidth;
    const startY = Math.random() * window.innerHeight * 0.6;

    // Travel distance: how far the star flies
    const travel = Math.random() * 300 + 200;
    const tx = travel * Math.cos(angleRad);
    const ty = travel * Math.sin(angleRad);

    const duration = Math.random() * 0.8 + 0.6; // 0.6 – 1.4 s

    star.style.width = `${length}px`;
    star.style.left = `${startX}px`;
    star.style.top = `${startY}px`;
    star.style.transform = `rotate(${angleDeg}deg)`;
    star.style.setProperty("--travel-x", `${tx}px`);
    star.style.setProperty("--travel-y", `${ty}px`);
    star.style.animationDuration = `${duration}s`;

    container.appendChild(star);
    setTimeout(() => star.remove(), duration * 1000 + 100);
  }

  function scheduleNext() {
    const delay = Math.random() * 8000 + 6000;
    shootingStarTimeout = window.setTimeout(() => {
      shootingStarTimeout = null;
      spawnStar();
    }, delay);
  }

  shootingStarTimeout = window.setTimeout(() => {
    shootingStarTimeout = null;
    spawnStar();
  }, 2000);
}

// ============================================================
//  LIVE "TOGETHER SINCE" COUNTER
// ============================================================
// ⬇️  SET THIS DATE to when you two met / started dating
const TOGETHER_SINCE = new Date("2026-05-22T00:00:00");

let counterInterval = null;

function startDaysCounter() {
  const elDays = document.getElementById("counter-days");
  const elUnit = document.getElementById("counter-unit");
  const elHms = document.getElementById("counter-hms");
  const elSince = document.getElementById("counter-since-label");
  if (!elDays || !elHms) return;
  if (elSince) {
    elSince.textContent = `Together since ${TOGETHER_SINCE.toLocaleDateString(
      "en-US",
      {
        month: "long",
        day: "numeric",
        year: "numeric",
      },
    )}`;
  }
  if (counterInterval) return; // don't double-start

  function tick() {
    const now = new Date();
    const diffMs = now - TOGETHER_SINCE;
    if (diffMs < 0) {
      elDays.innerText = "∞";
      elUnit.innerText = "forever in my heart";
      elHms.innerText = "";
      return;
    }

    const totalSecs = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    elDays.innerText = days.toLocaleString();
    elUnit.innerText = days === 1 ? "day" : "days";
    elHms.innerText =
      String(hours).padStart(2, "0") +
      ":" +
      String(mins).padStart(2, "0") +
      ":" +
      String(secs).padStart(2, "0");
  }

  tick();
  counterInterval = setInterval(tick, 1000);
}

// ============================================================
//  ANNIVERSARY COUNTDOWN WIDGETS
// ============================================================
const milestones = [
  { days: 7, emoji: "🌱", label: "1 Week", message: "Just the beginning!" },
  { days: 30, emoji: "🌙", label: "1 Month", message: "30 days of us 💜" },
  { days: 90, emoji: "⭐", label: "3 Months", message: "Quarter of a year!" },
  { days: 182, emoji: "🌸", label: "6 Months", message: "Half a year of love" },
  { days: 365, emoji: "🎂", label: "1 Year", message: "365 days of magic!" },
  { days: 730, emoji: "💎", label: "2 Years", message: "Two years strong!" },
  {
    days: 1095,
    emoji: "👑",
    label: "3 Years",
    message: "Three years of Ohana",
  },
];

function initCountdownWidgets() {
  const grid = document.getElementById("countdown-grid");
  if (!grid) return;

  grid.innerHTML = "";

  milestones.forEach((milestone) => {
    const card = document.createElement("div");
    card.className = "countdown-card";
    card.dataset.days = milestone.days;

    card.innerHTML = `
      <span class="countdown-emoji">${milestone.emoji}</span>
      <div class="countdown-label">${milestone.label}</div>
      <div class="countdown-value" data-target="${milestone.days}">—</div>
      <div class="countdown-unit">days</div>
      <div class="countdown-message"></div>
    `;

    grid.appendChild(card);
  });

  tickCountdowns();
}

function tickCountdowns() {
  const now = new Date();
  const diffMs = now - TOGETHER_SINCE;
  const togetherDays = Math.floor(diffMs / 86400000);

  document.querySelectorAll(".countdown-card").forEach((card) => {
    const target = parseInt(card.dataset.days, 10);
    const valueEl = card.querySelector(".countdown-value");
    const msgEl = card.querySelector(".countdown-message");

    if (togetherDays >= target) {
      // Milestone reached
      card.classList.add("reached");
      valueEl.textContent = "✓";
      msgEl.textContent =
        milestones.find((m) => m.days === target)?.message || "";
    } else {
      // Countdown
      card.classList.remove("reached");
      const remaining = target - togetherDays;
      valueEl.textContent = remaining.toLocaleString();
      msgEl.textContent = "";
    }
  });
}

let countdownInterval = null;

function startCountdownInterval() {
  if (countdownInterval) return;
  initCountdownWidgets();
  countdownInterval = setInterval(tickCountdowns, 60000);
}

// ============================================================
//  RESTORE STATE ON LOAD
// ============================================================
function restoreState() {
  const state = loadState();
  const envelopeSection = document.getElementById("envelope-section");
  const envelope = document.getElementById("envelope");

  if (!state || !state.section) {
    return;
  }

  const validSections = [
    "envelope-section",
    "story-section",
    "success-section",
  ];
  if (!validSections.includes(state.section)) {
    if (envelopeSection) envelopeSection.classList.add("active");
    return;
  }

  document
    .querySelectorAll(".section")
    .forEach((section) => section.classList.remove("active"));

  if (envelopeSection && state.envelopeOpen && envelope) {
    envelope.classList.add("open");
  }

  const targetSection = document.getElementById(state.section);
  if (targetSection) {
    targetSection.classList.add("active");
  } else if (envelopeSection) {
    envelopeSection.classList.add("active");
  }

  if (state.section === "story-section") {
    initScrollReveal();
  }

  onSectionActivated(state.section);
}

// ============================================================
//  BOOT
// ============================================================
function unlockExperience() {
  const overlay = document.getElementById("unlock-overlay");
  const envelopeSection = document.getElementById("envelope-section");
  if (overlay) {
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");
  }
  if (!document.querySelector(".section.active") && envelopeSection) {
    envelopeSection.classList.add("active");
  }
  try {
    localStorage.setItem("mukami-ohana-unlocked", "true");
  } catch (_) {}
}

function initUnlockScreen() {
  const form = document.getElementById("unlock-form");
  const input = document.getElementById("unlock-input");
  const feedback = document.getElementById("unlock-feedback");
  const unlockCard = document.querySelector(".unlock-card");
  if (!form || !input || !feedback || !unlockCard) return;

  try {
    if (localStorage.getItem("mukami-ohana-unlocked") === "true") {
      unlockExperience();
      return;
    }
  } catch (_) {}

  window.setTimeout(() => input.focus(), 150);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = input.value.trim().toLowerCase();

    if (value === SECRET_WORD) {
      feedback.textContent = "Unlocked with love 💜";
      window.setTimeout(unlockExperience, 220);
      return;
    }

    feedback.textContent = "Almost... try the word Stitch loves most.";
    unlockCard.classList.remove("shake");
    void unlockCard.offsetWidth;
    unlockCard.classList.add("shake");
    input.select();
  });
}

function typeText(element, text, speed = 45) {
  if (!element) return Promise.resolve();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    element.textContent = text;
    return Promise.resolve();
  }

  element.textContent = "";
  element.classList.add("typing");

  return new Promise((resolve) => {
    let index = 0;
    const timer = window.setInterval(() => {
      element.textContent = text.slice(0, index + 1);
      index += 1;
      if (index >= text.length) {
        window.clearInterval(timer);
        element.classList.remove("typing");
        resolve();
      }
    }, speed);
  });
}

function startProposalTypewriter() {
  if (hasTypedProposal) return;
  const title = document.getElementById("proposal-title");
  if (!title) return;

  hasTypedProposal = true;
  typeText(
    title,
    title.dataset.text || title.getAttribute("aria-label") || "",
    40,
  );
}

async function startSuccessLetterTypewriter() {
  if (hasTypedSuccessLetter) return;
  const lines = document.querySelectorAll(".typewriter-letter-line");
  if (!lines.length) return;

  hasTypedSuccessLetter = true;
  for (const line of lines) {
    await typeText(line, line.dataset.text || "", 24);
  }
}

function initInstallPrompt() {
  const installBtn = document.getElementById("install-btn");
  if (!installBtn) return;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installBtn.hidden = false;
  });

  installBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice.catch(() => null);
    deferredInstallPrompt = null;
    installBtn.hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installBtn.hidden = true;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  try {
    createStars();
    createFloatingHearts();
    initCursorEffects();
    initShootingStars();
    initSectionControls();
    initNoButton();
    initVoiceNote();
    initUnlockScreen();
    initInstallPrompt();

    const musicBtn = document.getElementById("music-btn");
    if (musicBtn) {
      musicBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleSound();
      });
    }

    restoreState();

    if (
      "serviceWorker" in navigator &&
      (window.location.protocol === "http:" ||
        window.location.protocol === "https:")
    ) {
      navigator.serviceWorker
        .register("sw.js")
        .then((reg) => console.log("SW registered", reg))
        .catch((err) => console.warn("SW error", err));
    }
  } catch (error) {
    console.error("App boot failed", error);
    document
      .querySelectorAll(".section")
      .forEach((section) => section.classList.remove("active"));
    const envelopeSection = document.getElementById("envelope-section");
    if (envelopeSection) {
      envelopeSection.classList.add("active");
    }
    const unlockOverlay = document.getElementById("unlock-overlay");
    if (unlockOverlay) {
      unlockOverlay.classList.remove("active");
    }
  } finally {
    body.classList.remove("app-loading");
    body.classList.add("app-ready");
  }
});
