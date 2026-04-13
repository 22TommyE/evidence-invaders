/* global Phaser, mreData */

// -----------------------------
//  Helpers
// -----------------------------
const STORAGE_KEY = "ei_highscores_v1";

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function safeInitials(s) {
  const up = String(s || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  return (up + "AAA").slice(0, 3);
}

function normalizeQuestion(raw) {
  if (!raw || typeof raw !== "object") return null;

  const prompt = typeof raw.prompt === "string" ? raw.prompt.trim() : "";
  const correctAnswer = typeof raw.correctAnswer === "string" ? raw.correctAnswer.trim() : "";
  const wrongAnswers = Array.isArray(raw.wrongAnswers)
    ? raw.wrongAnswers.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim())
    : [];

  if (!prompt || !correctAnswer || wrongAnswers.length < 3) return null;

  return {
    id: typeof raw.id === "string" ? raw.id : "",
    category: typeof raw.category === "string" ? raw.category : "",
    difficulty: typeof raw.difficulty === "string" ? raw.difficulty : "",
    prompt,
    correctAnswer,
    wrongAnswers: wrongAnswers.slice(0, 3),
    explanation: typeof raw.explanation === "string" ? raw.explanation : "",
  };
}

function getQuestionBank() {
  if (!Array.isArray(mreData)) return [];
  return mreData.map(normalizeQuestion).filter(Boolean);
}

function getQuestionsByDifficulty(difficulty) {
  const bank = getQuestionBank();
  const pool = bank.filter((q) => q && q.difficulty === difficulty);
  return pool.length ? pool : bank;
}

function getQuestionCategories() {
  const seen = new Set();
  const out = [];
  const bank = getQuestionBank();

  bank.forEach((q) => {
    if (!q || typeof q.category !== "string") return;
    const category = q.category.trim();
    if (!category || seen.has(category)) return;
    seen.add(category);
    out.push(category);
  });

  return out;
}

const CAMPAIGN_CATEGORY_COMBINATIONS = {
  "Article IV - Relevance & Character": ["Article IV - Relevance", "Article IV - Character"],
  "Authentication & Form Objections": ["Authentication", "Form Objections"],
};

const CAMPAIGN_CATEGORY_ORDER = [
  "Article IV - Relevance & Character",
  "Article VI - Witnesses",
  "Article VII - Experts",
  "Article VIII - Hearsay",
  "Authentication & Form Objections",
];

function getCampaignCategoryOptions() {
  const raw = getQuestionCategories();
  const rawSet = new Set(raw);
  const consumed = new Set();
  const presentLabels = new Set();

  Object.entries(CAMPAIGN_CATEGORY_COMBINATIONS).forEach(([label, categories]) => {
    const present = categories.filter((c) => rawSet.has(c));
    if (!present.length) return;
    if (present.length === categories.length) {
      presentLabels.add(label);
      present.forEach((c) => consumed.add(c));
      return;
    }
    // If only one side exists, keep the available original category visible.
    present.forEach((c) => {
      presentLabels.add(c);
      consumed.add(c);
    });
  });

  raw.forEach((category) => {
    if (consumed.has(category)) return;
    presentLabels.add(category);
  });

  const ordered = [];
  CAMPAIGN_CATEGORY_ORDER.forEach((label) => {
    if (presentLabels.has(label)) ordered.push(label);
  });

  [...presentLabels].forEach((label) => {
    if (!ordered.includes(label)) ordered.push(label);
  });

  return ordered;
}

function expandCampaignCategorySelection(selectionLabel) {
  if (!selectionLabel) return [];
  const merged = CAMPAIGN_CATEGORY_COMBINATIONS[selectionLabel];
  return Array.isArray(merged) ? merged.slice() : [selectionLabel];
}

function loadHighScores() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => ({
        initials: safeInitials(x?.initials),
        score: Number.isFinite(x?.score) ? x.score : 0,
        ts: Number.isFinite(x?.ts) ? x.ts : Date.now(),
      }))
      .sort((a, b) => (b.score - a.score) || (a.ts - b.ts))
      .slice(0, 10);
  } catch (_) {
    return [];
  }
}

function saveHighScore(initials, score) {
  const entry = { initials: safeInitials(initials), score: Math.max(0, score | 0), ts: Date.now() };
  const next = [entry, ...loadHighScores()]
    .sort((a, b) => (b.score - a.score) || (a.ts - b.ts))
    .slice(0, 10);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (_) {
    // ignore
  }
  return next;
}

function clearHighScores() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) {
    // ignore
  }
}

function neonTextStyle(sizePx, color) {
  return {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: `${sizePx}px`,
    color,
    align: "center",
  };
}

function makeStarTexture(scene, key, w, h, count, color, alpha) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.clear();
  g.fillStyle(0x000000, 0);
  g.fillRect(0, 0, w, h);
  g.fillStyle(color, alpha);
  for (let i = 0; i < count; i += 1) {
    const x = Phaser.Math.Between(0, w - 1);
    const y = Phaser.Math.Between(0, h - 1);
    const size = Phaser.Math.Between(1, 2);
    g.fillRect(x, y, size, size);
  }
  g.generateTexture(key, w, h);
  g.destroy();
}

function createStarfield(scene) {
  const { width, height } = scene.scale;
  const a = scene.add.tileSprite(0, 0, width, height, "starsA").setOrigin(0, 0).setAlpha(0.75);
  const b = scene.add.tileSprite(0, 0, width, height, "starsB").setOrigin(0, 0).setAlpha(0.55);
  const c = scene.add.tileSprite(0, 0, width, height, "starsC").setOrigin(0, 0).setAlpha(0.45);
  return { a, b, c };
}

function updateStarfield(stars, dt) {
  stars.a.tilePositionY -= 18 * dt;
  stars.b.tilePositionY -= 28 * dt;
  stars.c.tilePositionY -= 40 * dt;
}

function createMusicManager() {
  const themes = {
    menu: {
      bpm: 92,
      steps: [
        { melody: 72, bass: 48, kick: true, pad: 60 },
        { melody: null, bass: null },
        { melody: 75, bass: null },
        { melody: 79, bass: null, snare: true },
        { melody: 77, bass: 46, kick: true, pad: 63 },
        { melody: null, bass: null },
        { melody: 75, bass: null },
        { melody: 72, bass: null, snare: true },
        { melody: 79, bass: 43, kick: true, pad: 60 },
        { melody: null, bass: null },
        { melody: 82, bass: null },
        { melody: 79, bass: null, snare: true },
        { melody: 84, bass: 46, kick: true, pad: 65 },
        { melody: 82, bass: null },
        { melody: 79, bass: null },
        { melody: 77, bass: null, snare: true },
      ],
    },
    game: {
      bpm: 138,
      steps: [
        { melody: 72, bass: 36, kick: true, pad: 60 },
        { melody: 79, bass: null },
        { melody: 84, bass: 36 },
        { melody: 79, bass: null, snare: true },
        { melody: 75, bass: 38, kick: true, pad: 63 },
        { melody: 79, bass: null },
        { melody: 84, bass: 36 },
        { melody: 86, bass: null, snare: true },
        { melody: 88, bass: 41, kick: true, pad: 65 },
        { melody: 86, bass: null },
        { melody: 84, bass: 38 },
        { melody: 79, bass: null, snare: true },
        { melody: 77, bass: 36, kick: true, pad: 63 },
        { melody: 79, bass: null },
        { melody: 84, bass: 36 },
        { melody: 79, bass: null, snare: true },
      ],
    },
  };

  const state = {
    context: null,
    masterGain: null,
    noiseBuffer: null,
    muted: false,
    unlocked: false,
    currentTheme: "menu",
    currentPattern: themes.menu,
    schedulerId: null,
    nextStepTime: 0,
    stepIndex: 0,
    volume: 0.14,
    onChange: null,
  };

  function emitChange() {
    if (typeof state.onChange === "function") {
      state.onChange({ muted: state.muted, unlocked: state.unlocked, theme: state.currentTheme });
    }
  }

  function noteToFrequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function createNoiseBuffer(context) {
    const buffer = context.createBuffer(1, context.sampleRate * 0.2, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function initContext() {
    if (state.context) return true;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;

    state.context = new AudioCtx();
    state.masterGain = state.context.createGain();
    state.masterGain.gain.value = state.muted ? 0 : state.volume;
    state.masterGain.connect(state.context.destination);
    state.noiseBuffer = createNoiseBuffer(state.context);
    return true;
  }

  function stopScheduler() {
    if (state.schedulerId) {
      window.clearInterval(state.schedulerId);
      state.schedulerId = null;
    }
  }

  function playTone({ midi, time, duration, type = "square", gain = 0.08, filterFreq = 2200, detune = 0 }) {
    if (!state.context || midi == null) return;

    const oscillator = state.context.createOscillator();
    const filter = state.context.createBiquadFilter();
    const envelope = state.context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(noteToFrequency(midi), time);
    if (detune) oscillator.detune.setValueAtTime(detune, time);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterFreq, time);

    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(gain, time + 0.015);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    oscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(state.masterGain);

    oscillator.start(time);
    oscillator.stop(time + duration + 0.05);
  }

  function playKick(time) {
    if (!state.context) return;

    const osc = state.context.createOscillator();
    const env = state.context.createGain();
    const filter = state.context.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(132, time);
    osc.frequency.exponentialRampToValueAtTime(52, time + 0.11);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(220, time);

    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(0.4, time + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);

    osc.connect(filter);
    filter.connect(env);
    env.connect(state.masterGain);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  function playSnare(time) {
    if (!state.context || !state.noiseBuffer) return;

    const noise = state.context.createBufferSource();
    const filter = state.context.createBiquadFilter();
    const env = state.context.createGain();

    noise.buffer = state.noiseBuffer;
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1400, time);

    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(0.22, time + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);

    noise.connect(filter);
    filter.connect(env);
    env.connect(state.masterGain);

    noise.start(time);
    noise.stop(time + 0.13);
  }

  function scheduleStep(theme, step, time, stepDuration) {
    if (!theme) return;
    const data = theme.steps[step % theme.steps.length];
    if (!data) return;

    if (data.melody != null) {
      playTone({ midi: data.melody, time, duration: stepDuration * 0.82, type: "square", gain: 0.085, filterFreq: 2000 });
    }

    if (data.pad != null) {
      playTone({ midi: data.pad, time, duration: stepDuration * 1.65, type: "triangle", gain: 0.03, filterFreq: 1200 });
    }

    if (data.bass != null) {
      playTone({ midi: data.bass, time, duration: stepDuration * 0.95, type: "triangle", gain: 0.055, filterFreq: 700 });
    }

    if (data.kick) playKick(time);
    if (data.snare) playSnare(time + stepDuration * 0.5);
  }

  function schedule() {
    if (!state.context || !state.currentPattern || state.muted) return;

    const now = state.context.currentTime;
    const stepDuration = 60 / state.currentPattern.bpm / 4;
    const horizon = now + 0.12;

    while (state.nextStepTime < horizon) {
      scheduleStep(state.currentPattern, state.stepIndex, state.nextStepTime, stepDuration);
      state.nextStepTime += stepDuration;
      state.stepIndex = (state.stepIndex + 1) % state.currentPattern.steps.length;
    }
  }

  function startScheduler() {
    if (state.schedulerId || !state.context || !state.currentPattern) return;
    state.stepIndex = 0;
    state.nextStepTime = state.context.currentTime + 0.05;
    state.schedulerId = window.setInterval(schedule, 25);
    schedule();
  }

  function unlock() {
    if (!initContext()) return;
    state.unlocked = true;
    if (state.context.state === "suspended") {
      state.context.resume().catch(() => {});
    }
    startScheduler();
    emitChange();
  }

  function setTheme(themeName) {
    state.currentTheme = themes[themeName] ? themeName : "menu";
    state.currentPattern = themes[state.currentTheme];
    if (state.unlocked) {
      startScheduler();
    }
    emitChange();
  }

  function setMuted(muted) {
    state.muted = !!muted;
    if (!initContext()) {
      emitChange();
      return;
    }
    state.masterGain.gain.setTargetAtTime(state.muted ? 0 : state.volume, state.context.currentTime, 0.01);
    emitChange();
  }

  function toggleMuted() {
    setMuted(!state.muted);
    if (!state.muted) {
      unlock();
    }
    return state.muted;
  }

  function destroy() {
    stopScheduler();
    if (state.context) {
      state.context.close().catch(() => {});
      state.context = null;
      state.masterGain = null;
    }
  }

  return {
    unlock,
    setTheme,
    setMuted,
    toggleMuted,
    destroy,
    getMuted: () => state.muted,
    getTheme: () => state.currentTheme,
    getUnlocked: () => state.unlocked,
    onStateChange: null,
  };
}

// -----------------------------
//  UI bridge (HTML HUD buttons + overlay)
// -----------------------------
function createUIBridge(music) {
  const hudEl = document.querySelector(".hud");
  const modeEl = document.getElementById("mode");
  const scoreEl = document.getElementById("score");
  const livesEl = document.getElementById("lives");
  const accuracyEl = document.getElementById("accuracy");
  const accuracyToggleEl = document.getElementById("accuracy-toggle");
  const musicToggleEl = document.getElementById("music-toggle");
  const statusEl = document.getElementById("status");

  const overlayEl = document.getElementById("gameover-overlay");
  const overlayTitleEl = document.getElementById("overlay-title");
  const overlaySubtitleEl = document.getElementById("overlay-subtitle");
  const restartBtn = document.getElementById("restart-btn");

  const buttons = [
    document.getElementById("answer1"),
    document.getElementById("answer2"),
    document.getElementById("answer3"),
    document.getElementById("answer4"),
  ];

  const ui = {
    onChoice: null,

    setHudVisible(visible) {
      if (!hudEl) return;
      hudEl.classList.toggle("is-hidden", !visible);
    },

    setModeLabel(text) {
      if (!modeEl) return;
      modeEl.textContent = text || "—";
    },

    setLearningHud(isLearning) {
      if (!hudEl) return;
      hudEl.classList.toggle("hud--learning", !!isLearning);
      hudEl.classList.remove("accuracy-hidden");
      if (accuracyToggleEl) {
        accuracyToggleEl.textContent = "hide";
        accuracyToggleEl.setAttribute("aria-pressed", "true");
      }
    },

    setAccuracyPercent(pct) {
      if (!accuracyEl) return;
      const n = Math.max(0, Math.min(100, Math.round(pct)));
      accuracyEl.textContent = `${n}%`;
    },

    setScore(score) {
      scoreEl.textContent = String(score);
    },

    setLives(lives) {
      livesEl.textContent = String(lives);
    },

    setStatus(text) {
      statusEl.textContent = text || "";
    },

    setAnswers(answers) {
      for (let i = 0; i < 4; i += 1) {
        const label = answers[i] ?? "";
        buttons[i].textContent = `${i + 1}. ${label}`;
      }
    },

    setButtonsEnabled(enabled) {
      buttons.forEach((b) => {
        b.disabled = !enabled;
      });
    },

    showOverlay({ title, subtitle, showButton, buttonText }) {
      overlayTitleEl.textContent = title || "";
      overlaySubtitleEl.textContent = subtitle || "";
      overlayEl.hidden = false;
      restartBtn.hidden = !showButton;
      if (buttonText) restartBtn.textContent = buttonText;
    },

    updateOverlay({ title, subtitle, showButton, buttonText }) {
      if (typeof title === "string") overlayTitleEl.textContent = title;
      if (typeof subtitle === "string") overlaySubtitleEl.textContent = subtitle;
      if (typeof showButton === "boolean") restartBtn.hidden = !showButton;
      if (typeof buttonText === "string") restartBtn.textContent = buttonText;
    },

    hideOverlay() {
      overlayEl.hidden = true;
      restartBtn.hidden = true;
    },
  };

  const syncMusicToggle = () => {
    if (!musicToggleEl || !music) return;
    const muted = typeof music.getMuted === "function" ? music.getMuted() : false;
    musicToggleEl.textContent = muted ? "Music: off" : "Music: on";
    musicToggleEl.setAttribute("aria-pressed", muted ? "false" : "true");
  };

  if (musicToggleEl && music) {
    music.onStateChange = syncMusicToggle;
    syncMusicToggle();

    musicToggleEl.addEventListener("click", () => {
      if (typeof music.unlock === "function") music.unlock();
      if (typeof music.toggleMuted === "function") music.toggleMuted();
      syncMusicToggle();
    });
  }

  const safeChoiceHandler = (choiceIndex) => {
    if (typeof ui.onChoice === "function") ui.onChoice(choiceIndex);
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number.parseInt(btn.dataset.choice, 10);
      safeChoiceHandler(Number.isFinite(idx) ? idx : -1);
    });
  });

  buttons.forEach((btn) => {
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        btn.click();
      }
    });
  });

  // Overlay button is now optional; scenes can use it for e.g. touch devices later.
  restartBtn.addEventListener("click", () => {
    // no-op by default
  });

  if (accuracyToggleEl && hudEl) {
    accuracyToggleEl.addEventListener("click", () => {
      const hidden = hudEl.classList.toggle("accuracy-hidden");
      accuracyToggleEl.textContent = hidden ? "show" : "hide";
      accuracyToggleEl.setAttribute("aria-pressed", hidden ? "false" : "true");
    });
  }

  return ui;
}

// -----------------------------
//  Scenes
// -----------------------------
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    this.load.image("bookAlien", "assets/book-alien.png");
    this.load.image("gavel", "assets/gavel-projectile.png");
  }

  create() {
    // Generate star textures once and reuse across scenes.
    makeStarTexture(this, "starsA", 128, 128, 55, 0xffffff, 0.85);
    makeStarTexture(this, "starsB", 128, 128, 32, 0x38f6ff, 0.55);
    makeStarTexture(this, "starsC", 128, 128, 22, 0xff40d7, 0.45);

    const go = async () => {
      // Ensure font is ready before menu text draws (best-effort).
      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch (_) {
          // ignore
        }
      }
      this.scene.start("MainMenuScene");
    };

    // Phaser create() can't be async; schedule it.
    this.time.delayedCall(0, () => {
      go();
    });
  }
}

class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainMenuScene" });
  }

  create() {
    const ui = this.game.__ui;
    if (this.game.__music) this.game.__music.setTheme("menu");
    ui.hideOverlay();
    ui.setHudVisible(false);
    ui.setStatus("");
    ui.setModeLabel("—");

    this.cameras.main.setBackgroundColor("#000000");
    this.stars = createStarfield(this);

    const { width, height } = this.scale;

    const title = this.add
      .text(width / 2, 84, "EVIDENCE\nINVADERS", neonTextStyle(34, "#38f6ff"))
      .setOrigin(0.5, 0.5)
      .setShadow(0, 0, "rgba(56,246,255,0.35)", 16, true, true);

    const campaignBtn = this.add
      .text(width / 2, height / 2 - 52, "CAMPAIGN MODE", neonTextStyle(16, "#ff40d7"))
      .setOrigin(0.5, 0.5)
      .setShadow(0, 0, "rgba(255,64,215,0.35)", 14, true, true);

    const endlessBtn = this.add
      .text(width / 2, height / 2 - 6, "ENDLESS MODE", neonTextStyle(16, "#8dff4f"))
      .setOrigin(0.5, 0.5)
      .setShadow(0, 0, "rgba(141,255,79,0.25)", 14, true, true);

    const learningBtn = this.add
      .text(width / 2, height / 2 + 40, "LEARNING MODE", neonTextStyle(16, "#38f6ff"))
      .setOrigin(0.5, 0.5)
      .setShadow(0, 0, "rgba(56,246,255,0.35)", 14, true, true);

    const hint = this.add
      .text(width / 2, height / 2 + 100, "Use mouse or press 1 / 2 / 3", neonTextStyle(10, "rgba(233,247,255,0.75)"))
      .setOrigin(0.5, 0.5)
      .setShadow(0, 0, "rgba(56,246,255,0.18)", 10, true, true);

    // Top 3 (column-aligned; Press Start 2P is not truly monospaced)
    const renderTop3 = () => {
      if (this.top3Container) this.top3Container.destroy(true);

      const top = loadHighScores().slice(0, 3);
      const rows = top.length
        ? top.map((x, i) => ({ rank: i + 1, initials: x.initials, score: x.score }))
        : [
            { rank: 1, initials: "---", score: 0 },
            { rank: 2, initials: "---", score: 0 },
            { rank: 3, initials: "---", score: 0 },
          ];

      const baseX = 18;
      const baseY = height - 74;
      const lineH = 16;

      const container = this.add.container(0, 0);
      container.add(
        this.add
          .text(baseX, baseY, "TOP 3 HIGH SCORES", {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: "10px",
            color: "rgba(233,247,255,0.75)",
          })
          .setOrigin(0, 0)
          .setShadow(0, 0, "rgba(56,246,255,0.22)", 8, true, true)
      );

      rows.forEach((r, idx) => {
        const y = baseY + (idx + 1) * lineH;
        container.add(
          this.add
            .text(baseX, y, `${r.rank}.`, {
              fontFamily: '"Press Start 2P", monospace',
              fontSize: "10px",
              color: "rgba(233,247,255,0.75)",
            })
            .setOrigin(0, 0)
        );
        container.add(
          this.add
            .text(baseX + 34, y, r.initials, {
              fontFamily: '"Press Start 2P", monospace',
              fontSize: "10px",
              color: "rgba(233,247,255,0.75)",
            })
            .setOrigin(0, 0)
        );
        container.add(
          this.add
            .text(baseX + 220, y, String(r.score), {
              fontFamily: '"Press Start 2P", monospace',
              fontSize: "10px",
              color: "rgba(233,247,255,0.75)",
            })
            .setOrigin(1, 0)
        );
      });

      this.top3Container = container;
    };

    renderTop3();

    const toast = this.add
      .text(width - 18, height - 18, "", {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "9px",
        color: "rgba(141,255,79,0.85)",
        align: "right",
      })
      .setOrigin(1, 1)
      .setShadow(0, 0, "rgba(141,255,79,0.2)", 10, true, true);

    const startMode = (mode) => {
      this.game.__selectedMode = mode;
      if (this.game.__music) this.game.__music.unlock();
      if (mode === "campaign") {
        this.scene.start("LevelSelectScene");
        return;
      }
      this.scene.start("NameInputScene", { mode });
    };

    // Clickable buttons
    campaignBtn.setInteractive({ useHandCursor: true });
    endlessBtn.setInteractive({ useHandCursor: true });
    learningBtn.setInteractive({ useHandCursor: true });
    campaignBtn.on("pointerdown", () => startMode("campaign"));
    endlessBtn.on("pointerdown", () => startMode("endless"));
    learningBtn.on("pointerdown", () => startMode("learning"));

    // Keyboard shortcuts
    const one = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    const two = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    const three = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    one.on("down", () => startMode("campaign"));
    two.on("down", () => startMode("endless"));
    three.on("down", () => startMode("learning"));

    // Clear scores: press C on the menu
    const cKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    cKey.on("down", () => {
      clearHighScores();
      renderTop3();
      toast.setText("SCORES CLEARED");
      this.time.delayedCall(1200, () => toast.setText(""));
    });

    // Slight responsive polish
    this.scale.on("resize", (gameSize) => {
      const w = gameSize.width;
      const h = gameSize.height;
      this.stars.a.setSize(w, h);
      this.stars.b.setSize(w, h);
      this.stars.c.setSize(w, h);
      title.setPosition(w / 2, 84);
      campaignBtn.setPosition(w / 2, h / 2 - 52);
      endlessBtn.setPosition(w / 2, h / 2 - 6);
      learningBtn.setPosition(w / 2, h / 2 + 40);
      hint.setPosition(w / 2, h / 2 + 100);
      toast.setPosition(w - 18, h - 18);
    });
  }

  update(_, delta) {
    updateStarfield(this.stars, delta / 1000);
  }
}

class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: "LevelSelectScene" });
  }

  create() {
    const ui = this.game.__ui;
    if (this.game.__music) this.game.__music.setTheme("menu");
    ui.hideOverlay();
    ui.setHudVisible(false);
    ui.setStatus("");
    ui.setModeLabel("—");

    this.cameras.main.setBackgroundColor("#000000");
    this.stars = createStarfield(this);

    const { width, height } = this.scale;
    const categories = getCampaignCategoryOptions();
    const buttonLabels = [...categories, "All Rules (Final Exam)"];
    const top = 120;
    const bottom = height - 96;

    this.add
      .text(width / 2, 64, "LEVEL SELECT", neonTextStyle(22, "#38f6ff"))
      .setOrigin(0.5, 0.5)
      .setShadow(0, 0, "rgba(56,246,255,0.35)", 14, true, true);

    this.add
      .text(width / 2, 92, "Choose a category for Campaign Mode", neonTextStyle(9, "rgba(233,247,255,0.75)"))
      .setOrigin(0.5, 0.5)
      .setShadow(0, 0, "rgba(255,64,215,0.2)", 8, true, true);

    const startY = top;
    const availableHeight = Math.max(140, bottom - top);
    const step = Math.min(38, availableHeight / Math.max(1, buttonLabels.length));

    const selectCategory = (label) => {
      const selectedCategory = label === "All Rules (Final Exam)" ? null : label;
      this.game.__selectedMode = "campaign";
      this.game.__selectedCampaignCategory = selectedCategory;
      if (this.game.__music) this.game.__music.unlock();
      this.scene.start("NameInputScene", {
        mode: "campaign",
        selectedCategory,
      });
    };

    buttonLabels.forEach((label, idx) => {
      const y = startY + idx * step;
      if (y > bottom - 10) return;

      const isFinalExam = label === "All Rules (Final Exam)";
      const color = isFinalExam ? "#8dff4f" : "#ff40d7";
      const btn = this.add
        .text(width / 2, y, label, neonTextStyle(12, color))
        .setOrigin(0.5, 0.5)
        .setShadow(0, 0, isFinalExam ? "rgba(141,255,79,0.25)" : "rgba(255,64,215,0.3)", 10, true, true)
        .setInteractive({ useHandCursor: true });

      btn.on("pointerdown", () => selectCategory(label));
      btn.on("pointerover", () => btn.setScale(1.03));
      btn.on("pointerout", () => btn.setScale(1));
    });

    const backBtn = this.add
      .text(width / 2, height - 34, "BACK TO MAIN MENU", neonTextStyle(10, "rgba(233,247,255,0.82)"))
      .setOrigin(0.5, 0.5)
      .setShadow(0, 0, "rgba(56,246,255,0.2)", 8, true, true)
      .setInteractive({ useHandCursor: true });

    backBtn.on("pointerdown", () => {
      this.scene.start("MainMenuScene");
    });

    const esc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    esc.on("down", () => this.scene.start("MainMenuScene"));

    this.scale.on("resize", (gameSize) => {
      const w = gameSize.width;
      const h = gameSize.height;
      this.stars.a.setSize(w, h);
      this.stars.b.setSize(w, h);
      this.stars.c.setSize(w, h);
      backBtn.setPosition(w / 2, h - 34);
    });
  }

  update(_, delta) {
    updateStarfield(this.stars, delta / 1000);
  }
}

class NameInputScene extends Phaser.Scene {
  constructor() {
    super({ key: "NameInputScene" });
    this.letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    this.slot = 0;
    this.indices = [0, 0, 0];
    this.mode = "campaign";
    this.selectedCategory = null;
  }

  init(data) {
    this.mode = data?.mode || this.game.__selectedMode || "campaign";
    this.selectedCategory = data?.selectedCategory ?? this.game.__selectedCampaignCategory ?? null;
  }

  create() {
    const ui = this.game.__ui;
    if (this.game.__music) this.game.__music.setTheme(this.mode === "learning" ? "menu" : "menu");
    ui.hideOverlay();
    ui.setHudVisible(false);
    ui.setStatus("");
    ui.setModeLabel("—");

    this.cameras.main.setBackgroundColor("#000000");
    this.stars = createStarfield(this);

    const { width, height } = this.scale;

    this.add
      .text(width / 2, 84, "ENTER INITIALS", neonTextStyle(20, "#38f6ff"))
      .setOrigin(0.5, 0.5)
      .setShadow(0, 0, "rgba(56,246,255,0.35)", 14, true, true);

    this.add
      .text(
        width / 2,
        140,
        "UP/DOWN: CHANGE LETTER\nLEFT/RIGHT: MOVE\nENTER: CONFIRM",
        neonTextStyle(10, "rgba(233,247,255,0.75)")
      )
      .setOrigin(0.5, 0)
      .setShadow(0, 0, "rgba(255,64,215,0.2)", 10, true, true);

    this.initialsText = this.add
      .text(width / 2, height / 2 + 10, "", neonTextStyle(46, "#8dff4f"))
      .setOrigin(0.5, 0.5)
      .setShadow(0, 0, "rgba(141,255,79,0.22)", 18, true, true);

    this.cursorText = this.add
      .text(width / 2, height / 2 + 54, "", neonTextStyle(18, "#ff40d7"))
      .setOrigin(0.5, 0.5)
      .setShadow(0, 0, "rgba(255,64,215,0.25)", 14, true, true);

    this._render();

    const keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      esc: Phaser.Input.Keyboard.KeyCodes.ESC,
    });

    keys.up.on("down", () => this._changeLetter(1));
    keys.down.on("down", () => this._changeLetter(-1));
    keys.left.on("down", () => this._moveSlot(-1));
    keys.right.on("down", () => this._moveSlot(1));
    keys.enter.on("down", () => this._confirm());
    keys.esc.on("down", () => this.scene.start("MainMenuScene"));

    this.scale.on("resize", (gameSize) => {
      const w = gameSize.width;
      const h = gameSize.height;
      this.stars.a.setSize(w, h);
      this.stars.b.setSize(w, h);
      this.stars.c.setSize(w, h);
      this.initialsText.setPosition(w / 2, h / 2 + 10);
      this.cursorText.setPosition(w / 2, h / 2 + 54);
    });
  }

  update(_, delta) {
    updateStarfield(this.stars, delta / 1000);
  }

  _changeLetter(dir) {
    const len = this.letters.length;
    const next = (this.indices[this.slot] + dir + len) % len;
    this.indices[this.slot] = next;
    this._render();
  }

  _moveSlot(dir) {
    this.slot = clamp(this.slot + dir, 0, 2);
    this._render();
  }

  _render() {
    const chars = this.indices.map((i) => this.letters[i]);
    this.initialsText.setText(chars.join(" "));

    const caret = ["   ", "   ", "   "];
    caret[this.slot] = " ^ ";
    this.cursorText.setText(caret.join(" "));
  }

  _confirm() {
    const initials = this.indices.map((i) => this.letters[i]).join("");
    this.game.__playerInitials = initials;
    if (this.game.__music) this.game.__music.unlock();
    if (this.mode === "learning") {
      this.scene.start("LearningScene", { initials });
      return;
    }
    this.scene.start("GameScene", {
      initials,
      mode: this.mode,
      selectedCategory: this.selectedCategory,
    });
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
    this.initials = "AAA";
    this.mode = "campaign"; // campaign | endless
    this.level = 1;
    this.levelTransitioning = false;

    this.score = 0;
    this.lives = 3;

    this.ship = null;
    this.shipGlow = null;
    this.alien = null;
    this.promptText = null;

    this.answerLocked = false;
    this.isCountingDown = false;
    this._countdownEvent = null;
    this.currentQuestion = null;
    this.previousQuestionId = null;
    this.currentAnswers = [];
    this.currentCorrectChoiceIndex = -1;

    this.alienSpeed = 38; // px/sec
    this.spawnDelayMs = 350;
    this.selectedCategory = null;
    this.menuBtn = null;
  }

  init(data) {
    this.initials = safeInitials(data?.initials || this.game.__playerInitials || "AAA");
    this.mode = data?.mode || this.game.__selectedMode || "campaign";
    this.selectedCategory = data?.selectedCategory ?? this.game.__selectedCampaignCategory ?? null;
    this.level = 1;
    this.levelTransitioning = false;
  }

  create() {
    const ui = this.game.__ui;
    if (this.game.__music) this.game.__music.setTheme("game");
    ui.hideOverlay();
    ui.setHudVisible(true);
    ui.setLearningHud(false);
    ui.setScore(0);
    ui.setLives(3);
    ui.setButtonsEnabled(false);
    ui.setStatus("");

    this.score = 0;
    this.lives = 3;
    this.answerLocked = false;
    this.isCountingDown = false;
    this.levelTransitioning = false;

    this.cameras.main.setBackgroundColor("#000000");
    this.stars = createStarfield(this);

    this._createShip();
    this._createReturnToMenuButton();
    this._bindKeyboard();

    ui.setStatus(`Player: ${this.initials}`);
    this._applyDifficultyForCurrentState();
    this._beginCountdown(3);

    this.scale.on("resize", (gameSize) => {
      const w = gameSize.width;
      const h = gameSize.height;
      this.stars.a.setSize(w, h);
      this.stars.b.setSize(w, h);
      this.stars.c.setSize(w, h);
      this._positionShip();
      if (this.menuBtn) this.menuBtn.setPosition(w - 14, 16);
    });
  }

  update(_, delta) {
    const dt = delta / 1000;
    updateStarfield(this.stars, dt);

    if (this.isCountingDown) return;
    if (this.levelTransitioning) return;

    if (this.alien) {
      this.alien.y += this.alienSpeed * dt;
      if (this.promptText) {
        this.promptText.x = this.alien.x;
        this.promptText.y = this.alien.y - 44;
      }

      const bottomY = this.ship.y - 18;
      if (this.alien.y >= bottomY) {
        this._handleFailure("Too late!");
      }
    }
  }

  submitChoice(choiceIndex) {
    const ui = this.game.__ui;
    if (this.isCountingDown) return;
    if (this.levelTransitioning) return;
    if (this.answerLocked) return;
    if (!this.currentQuestion) return;
    if (!Number.isInteger(choiceIndex)) return;
    if (choiceIndex < 0 || choiceIndex > 3) return;

    this.answerLocked = true;
    ui.setButtonsEnabled(false);

    const isCorrect = choiceIndex === this.currentCorrectChoiceIndex;
    if (isCorrect) {
      ui.setStatus("Correct!");
      this._handleSuccess();
    } else {
      const correctLabel = this.currentAnswers[this.currentCorrectChoiceIndex] ?? "—";
      this._handleFailure(`Wrong (correct: ${correctLabel})`);
    }
  }

  _beginCountdown(seconds) {
    const ui = this.game.__ui;

    if (this._countdownEvent) {
      this._countdownEvent.remove(false);
      this._countdownEvent = null;
    }

    this._destroyAlien();
    this._resetRoundState();

    this.isCountingDown = true;
    this.answerLocked = true;
    ui.setButtonsEnabled(false);

    let remaining = Math.max(1, Math.floor(seconds));
    ui.showOverlay({ title: "GET READY", subtitle: `Starting in ${remaining}…`, showButton: false });

    const tick = () => {
      if (!this.isCountingDown) return;

      remaining -= 1;
      if (remaining >= 1) {
        ui.updateOverlay({ subtitle: `Starting in ${remaining}…` });
        this._countdownEvent = this.time.delayedCall(1000, tick);
        return;
      }

      ui.hideOverlay();
      this.isCountingDown = false;
      this.answerLocked = false;
      this._countdownEvent = null;
      this._spawnNextAlien();
    };

    this._countdownEvent = this.time.delayedCall(1000, tick);
  }

  _resetRoundState() {
    const ui = this.game.__ui;
    this.currentQuestion = null;
    this.currentAnswers = [];
    this.currentCorrectChoiceIndex = -1;
    this.answerLocked = false;
    ui.setButtonsEnabled(false);
  }

  _createShip() {
    const { width, height } = this.scale;
    const y = height - 48;
    const x = width / 2;

    const body = this.add.rectangle(x, y, 42, 16, 0x38f6ff).setStrokeStyle(2, 0x8dff4f, 0.9);
    const cockpit = this.add.rectangle(x, y - 10, 16, 10, 0x8dff4f).setStrokeStyle(2, 0x38f6ff, 0.75);
    const wingL = this.add.rectangle(x - 22, y + 2, 14, 8, 0xff40d7).setStrokeStyle(1, 0x38f6ff, 0.55);
    const wingR = this.add.rectangle(x + 22, y + 2, 14, 8, 0xff40d7).setStrokeStyle(1, 0x38f6ff, 0.55);

    this.ship = this.add.container(0, 0, [body, cockpit, wingL, wingR]);
    this.ship.setDepth(10);

    this.shipGlow = this.add
      .rectangle(x, y, 62, 28, 0x38f6ff, 0.08)
      .setDepth(9)
      .setBlendMode(Phaser.BlendModes.ADD);

    this._positionShip();
  }

  _positionShip() {
    const { width, height } = this.scale;
    const x = width / 2;
    const y = height - 48;
    this.ship.x = x;
    this.ship.y = y;
    if (this.shipGlow) {
      this.shipGlow.x = x;
      this.shipGlow.y = y;
    }
  }

  _bindKeyboard() {
    const keys = this.input.keyboard.addKeys({
      one: Phaser.Input.Keyboard.KeyCodes.ONE,
      two: Phaser.Input.Keyboard.KeyCodes.TWO,
      three: Phaser.Input.Keyboard.KeyCodes.THREE,
      four: Phaser.Input.Keyboard.KeyCodes.FOUR,
      n1: Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE,
      n2: Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO,
      n3: Phaser.Input.Keyboard.KeyCodes.NUMPAD_THREE,
      n4: Phaser.Input.Keyboard.KeyCodes.NUMPAD_FOUR,
    });

    const onDown = (idx) => () => this.submitChoice(idx);

    keys.one.on("down", onDown(0));
    keys.two.on("down", onDown(1));
    keys.three.on("down", onDown(2));
    keys.four.on("down", onDown(3));
    keys.n1.on("down", onDown(0));
    keys.n2.on("down", onDown(1));
    keys.n3.on("down", onDown(2));
    keys.n4.on("down", onDown(3));

    const esc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    esc.on("down", () => {
      this.scene.start("MainMenuScene");
    });
  }

  _createReturnToMenuButton() {
    const { width } = this.scale;
    this.menuBtn = this.add
      .text(width - 14, 16, "RETURN TO MAIN MENU", {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "8px",
        color: "rgba(233,247,255,0.9)",
      })
      .setOrigin(1, 0)
      .setDepth(20)
      .setShadow(0, 0, "rgba(56,246,255,0.25)", 8, true, true)
      .setInteractive({ useHandCursor: true });

    this.menuBtn.on("pointerdown", () => {
      this.scene.start("MainMenuScene");
    });
  }

  _spawnNextAlien() {
    const ui = this.game.__ui;
    const { width } = this.scale;

    const pool = this._getQuestionPool();
    if (!pool.length) {
      ui.setButtonsEnabled(false);
      ui.setStatus("No questions loaded.");
      return;
    }

    let q = pool[Math.floor(Math.random() * pool.length)];
    // Prevent the same question from appearing twice in a row
    while (q.id === this.previousQuestionId && pool.length > 1) {
      q = pool[Math.floor(Math.random() * pool.length)];
    }
    this.currentQuestion = q;
    this.previousQuestionId = q.id;

    const answers = shuffleInPlace([q.correctAnswer, ...q.wrongAnswers].slice(0, 4));
    this.currentAnswers = answers;
    this.currentCorrectChoiceIndex = answers.indexOf(q.correctAnswer);

    ui.setAnswers(answers);
    ui.setButtonsEnabled(true);
    ui.setStatus("Choose 1–4.");

    const x = clamp(width / 2 + Phaser.Math.Between(-120, 120), 60, width - 60);
    const y = 80;

    const alienBody = this.add.image(x, y, "bookAlien").setOrigin(0.5, 0.5).setDepth(5);
    alienBody.setDisplaySize(40, 28);
    this.alien = alienBody;

    this.promptText = this.add
      .text(x, y - 44, q.prompt, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "10px",
        color: "#e9f7ff",
        align: "center",
        wordWrap: { width: Math.min(520, width - 40), useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0.5)
      .setDepth(6)
      .setShadow(0, 0, "rgba(56,246,255,0.35)", 8, true, true);
  }

  _handleSuccess() {
    if (!this.alien) {
      this._unlockAndRespawn();
      return;
    }

    const ui = this.game.__ui;
    const target = this.alien;
    const startX = this.ship.x;
    const startY = this.ship.y - 14;

    const projectile = this.add.image(startX, startY, "gavel").setOrigin(0.5, 0.5).setDepth(8);
    projectile.setDisplaySize(40, 28);

    const impactFlash = this.add
      .rectangle(target.x, target.y, 70, 50, 0x8dff4f, 0)
      .setDepth(7)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: projectile,
      x: target.x,
      y: target.y,
      angle: 540,
      duration: 347,
      ease: "Quad.easeIn",
      onComplete: () => {
        projectile.destroy();

        this.tweens.add({
          targets: impactFlash,
          alpha: { from: 0.0, to: 0.35 },
          duration: 70,
          yoyo: true,
          repeat: 2,
          onComplete: () => impactFlash.destroy(),
        });

        this._destroyAlien();
        this.score += 100;
        ui.setScore(this.score);
        this._onScoreChanged();
        this.time.delayedCall(this.spawnDelayMs, () => this._unlockAndRespawn());
      },
    });
  }

  _handleFailure(message) {
    const ui = this.game.__ui;

    ui.setStatus(message);
    this.cameras.main.flash(140, 255, 40, 40);

    this.lives -= 1;
    ui.setLives(this.lives);

    this._destroyAlien();

    if (this.lives <= 0) {
      ui.setButtonsEnabled(false);
      this.scene.start("GameOverScene", {
        score: this.score,
        initials: this.initials,
        title: "GAME OVER",
        subtitle: "Press SPACE to return to menu",
      });
      return;
    }

    this.time.delayedCall(this.spawnDelayMs, () => this._unlockAndRespawn());
  }

  _destroyAlien() {
    if (this.alien) {
      this.alien.destroy();
      this.alien = null;
    }
    if (this.promptText) {
      this.promptText.destroy();
      this.promptText = null;
    }
  }

  _unlockAndRespawn() {
    const ui = this.game.__ui;
    if (this.isCountingDown) return;
    if (this.levelTransitioning) return;
    this.answerLocked = false;
    ui.setButtonsEnabled(true);
    this._spawnNextAlien();
  }

  _campaignLevels() {
    // Targets are TOTAL score thresholds.
    return [
      { level: 1, speed: 28, spawnDelay: 700, pool: getQuestionsByDifficulty("Regionals"), targetScore: 500 },
      { level: 2, speed: 38, spawnDelay: 520, pool: getQuestionsByDifficulty("ORCS"), targetScore: 1000 },
      { level: 3, speed: 54, spawnDelay: 380, pool: getQuestionsByDifficulty("Nationals"), targetScore: 1500 },
    ];
  }

  _applyDifficultyForCurrentState() {
    const ui = this.game.__ui;

    if (this.mode === "endless") {
      ui.setModeLabel("Mode: Endless");
      // Base difficulty
      const baseSpeed = 34;
      const baseDelay = 520;
      this.alienSpeed = baseSpeed;
      this.spawnDelayMs = baseDelay;
      this._onScoreChanged(true); // apply scaling from score=0 safely
      return;
    }

    // Campaign
    const lvl = this._campaignLevels().find((x) => x.level === this.level) || this._campaignLevels()[0];
    const scope = this.selectedCategory ? ` | ${this.selectedCategory}` : " | All Rules";
    ui.setModeLabel(`Level: ${lvl.level}${scope}`);
    this.alienSpeed = lvl.speed;
    this.spawnDelayMs = lvl.spawnDelay;
  }

  _getQuestionPool() {
    const bank = getQuestionBank();
    if (this.mode === "endless") return bank;

    const selectedCategories = expandCampaignCategorySelection(this.selectedCategory);
    const selectedSet = new Set(selectedCategories);
    const basePool = selectedSet.size
      ? bank.filter((q) => q && selectedSet.has(q.category))
      : bank;
    const fallbackBasePool = basePool.length ? basePool : bank;

    const lvl = this._campaignLevels().find((x) => x.level === this.level);
    if (!lvl || !lvl.pool || !lvl.pool.length) return fallbackBasePool;

    const levelIds = new Set(lvl.pool.map((q) => q.id));
    const filtered = fallbackBasePool.filter((q) => levelIds.has(q.id));
    return filtered.length ? filtered : fallbackBasePool;
  }

  _onScoreChanged(isInit = false) {
    const ui = this.game.__ui;

    if (this.mode === "endless") {
      // Every +500 score: slightly faster & slightly tighter spawns, with caps.
      const tier = Math.floor(this.score / 500);
      const baseSpeed = 34;
      const baseDelay = 520;
      const maxSpeed = 82;
      const minDelay = 220;

      this.alienSpeed = clamp(baseSpeed + tier * 6, baseSpeed, maxSpeed);
      this.spawnDelayMs = clamp(baseDelay - tier * 45, minDelay, baseDelay);

      if (!isInit) ui.setModeLabel("Mode: Endless");
      return;
    }

    // Campaign progression checks
    const levels = this._campaignLevels();
    const current = levels.find((x) => x.level === this.level);
    if (!current) return;

    if (this.levelTransitioning) return;

    if (this.score >= current.targetScore) {
      if (this.level < 3) {
        this._startLevelClear(this.level + 1);
      } else {
        // Beat Level 3: You win; save score.
        this.levelTransitioning = true;
        ui.setButtonsEnabled(false);
        this._destroyAlien();
        ui.showOverlay({ title: "YOU WIN", subtitle: "Campaign cleared!", showButton: false });

        this.time.delayedCall(1200, () => {
          ui.hideOverlay();
          this.scene.start("GameOverScene", {
            score: this.score,
            initials: this.initials,
            title: "YOU WIN",
            subtitle: "Score saved. Press SPACE for menu",
          });
        });
      }
    }
  }

  _startLevelClear(nextLevel) {
    const ui = this.game.__ui;
    this.levelTransitioning = true;
    this.answerLocked = true;
    ui.setButtonsEnabled(false);
    this._destroyAlien();

    ui.showOverlay({
      title: "LEVEL CLEAR",
      subtitle: `Preparing Level ${nextLevel}...`,
      showButton: false,
    });

    this.time.delayedCall(900, () => {
      ui.hideOverlay();
      this.level = nextLevel;
      // Restore lives
      this.lives = 3;
      ui.setLives(this.lives);
      this._applyDifficultyForCurrentState();

      this.levelTransitioning = false;
      this._beginCountdown(3);
    });
  }
}

class LearningScene extends Phaser.Scene {
  constructor() {
    super({ key: "LearningScene" });
    this.initials = "AAA";

    this.ship = null;
    this.shipGlow = null;
    this.alien = null;
    this.promptText = null;

    this.answerLocked = false;
    this.isCountingDown = false;
    this._countdownEvent = null;
    this.currentQuestion = null;
    this.previousQuestionId = null;
    this.currentAnswers = [];
    this.currentCorrectChoiceIndex = -1;

    /** Constant slow speed — never scales */
    this.alienSpeed = 8;
    this.spawnDelayMs = 450;

    this.answersCorrect = 0;
    this.answersTotal = 0;

    this._learningFrozen = false;
    this.freezeBg = null;
    this.freezeTitle = null;
    this.freezeBody = null;
    this.freezeHint = null;
    this._freezeSpaceKey = null;
    this._escKey = null;
    this.menuBtn = null;
  }

  init(data) {
    this.initials = safeInitials(data?.initials || this.game.__playerInitials || "AAA");
  }

  create() {
    const ui = this.game.__ui;
    if (this.game.__music) this.game.__music.setTheme("game");
    ui.hideOverlay();
    ui.setHudVisible(true);
    ui.setLearningHud(true);
    ui.setModeLabel("Mode: Learning");
    ui.setAccuracyPercent(100);
    ui.setButtonsEnabled(false);
    ui.setStatus(`Player: ${this.initials}`);

    this.answersCorrect = 0;
    this.answersTotal = 0;
    this.answerLocked = false;
    this.isCountingDown = false;
    this._learningFrozen = false;

    this.cameras.main.setBackgroundColor("#000000");
    this.stars = createStarfield(this);

    this._createShip();
    this._createReturnToMenuButton();
    this._bindKeyboard();

    this._escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this._escKey.on("down", () => {
      if (this._learningFrozen) return;
      this.scene.start("MainMenuScene");
    });

    this.events.once("shutdown", () => {
      if (this._escKey) {
        this._escKey.removeAllListeners();
      }
      if (this.game.__ui) this.game.__ui.setLearningHud(false);
    });

    this._beginCountdown(3);

    this.scale.on("resize", (gameSize) => {
      const w = gameSize.width;
      const h = gameSize.height;
      this.stars.a.setSize(w, h);
      this.stars.b.setSize(w, h);
      this.stars.c.setSize(w, h);
      this._positionShip();
      if (this.menuBtn) this.menuBtn.setPosition(w - 14, 16);
    });
  }

  update(_, delta) {
    if (this._learningFrozen) return;

    const dt = delta / 1000;
    updateStarfield(this.stars, dt);

    if (this.isCountingDown) return;

    if (this.alien) {
      this.alien.y += this.alienSpeed * dt;
      if (this.promptText) {
        this.promptText.x = this.alien.x;
        this.promptText.y = this.alien.y - 44;
      }

      const bottomY = this.ship.y - 18;
      if (this.alien.y >= bottomY) {
        this._respawnAlienAtTopNoPenalty();
      }
    }
  }

  submitChoice(choiceIndex) {
    const ui = this.game.__ui;
    if (this._learningFrozen) return;
    if (this.isCountingDown) return;
    if (this.answerLocked) return;
    if (!this.currentQuestion) return;
    if (!Number.isInteger(choiceIndex)) return;
    if (choiceIndex < 0 || choiceIndex > 3) return;

    this.answerLocked = true;
    ui.setButtonsEnabled(false);

    const isCorrect = choiceIndex === this.currentCorrectChoiceIndex;
    this.answersTotal += 1;
    if (isCorrect) this.answersCorrect += 1;
    this._updateAccuracyHud();

    if (isCorrect) {
      ui.setStatus("Correct!");
      this._handleSuccess();
    } else {
      this._handleWrongFreeze();
    }
  }

  _updateAccuracyHud() {
    const ui = this.game.__ui;
    if (this.answersTotal === 0) {
      ui.setAccuracyPercent(100);
      return;
    }
    ui.setAccuracyPercent((this.answersCorrect / this.answersTotal) * 100);
  }

  _pauseLearning() {
    this._learningFrozen = true;
    if (this.physics && this.physics.world) this.physics.world.pause();
    this.tweens.pauseAll();
  }

  _resumeLearning() {
    this._learningFrozen = false;
    if (this.physics && this.physics.world) this.physics.world.resume();
    this.tweens.resumeAll();
  }

  _handleWrongFreeze() {
    const ui = this.game.__ui;
    const q = this.currentQuestion;
    const correctName = q?.correctAnswer ?? "—";
    const explanation = q?.explanation || "No explanation available yet.";

    this._pauseLearning();

    const { width, height } = this.scale;
    const pad = 20;
    const boxW = width - pad * 2;
    const boxH = height - pad * 2;
    const cx = width / 2;
    const cy = height / 2;

    this._clearFreezePanel();

    this.freezeBg = this.add
      .rectangle(cx, cy, boxW, boxH, 0x0a0912, 0.94)
      .setStrokeStyle(2, 0xff40d7)
      .setDepth(1000);

    this.freezeTitle = this.add
      .text(cx, cy - boxH / 2 + 28, `Correct Answer: ${correctName}`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "13px",
        fontStyle: "bold",
        color: "#8dff4f",
        align: "center",
        wordWrap: { width: boxW - 28 },
      })
      .setOrigin(0.5, 0)
      .setDepth(1001)
      .setShadow(0, 0, "rgba(255,64,215,0.35)", 12, true, true);

    this.freezeBody = this.add
      .text(cx, cy - boxH / 2 + 78, explanation, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "12px",
        color: "#e9f7ff",
        align: "center",
        wordWrap: { width: boxW - 28 },
      })
      .setOrigin(0.5, 0)
      .setDepth(1001)
      .setLineSpacing(6)
      .setShadow(0, 0, "rgba(56,246,255,0.2)", 8, true, true);

    this.freezeHint = this.add
      .text(cx, cy + boxH / 2 - 28, "Press SPACE to continue", {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "10px",
        color: "#8dff4f",
        align: "center",
      })
      .setOrigin(0.5, 1)
      .setDepth(1001)
      .setShadow(0, 0, "rgba(141,255,79,0.25)", 10, true, true);

    if (this._freezeSpaceKey) {
      this._freezeSpaceKey.removeAllListeners();
    }
    this._freezeSpaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this._freezeSpaceKey.once("down", () => this._continueAfterWrong());
  }

  _clearFreezePanel() {
    [this.freezeBg, this.freezeTitle, this.freezeBody, this.freezeHint].forEach((o) => {
      if (o) o.destroy();
    });
    this.freezeBg = null;
    this.freezeTitle = null;
    this.freezeBody = null;
    this.freezeHint = null;
  }

  _continueAfterWrong() {
    const ui = this.game.__ui;
    this._clearFreezePanel();
    this._resumeLearning();

    this._destroyAlien();
    this._resetRoundState();

    this.time.delayedCall(0, () => {
      this._spawnNextAlien();
    });
  }

  _respawnAlienAtTopNoPenalty() {
    const ui = this.game.__ui;
    ui.setStatus("Try again — new prompt.");
    this._destroyAlien();
    this._resetRoundState();
    this.time.delayedCall(120, () => {
      this._spawnNextAlien();
    });
  }

  _beginCountdown(seconds) {
    const ui = this.game.__ui;

    if (this._countdownEvent) {
      this._countdownEvent.remove(false);
      this._countdownEvent = null;
    }

    this._destroyAlien();
    this._resetRoundState();

    this.isCountingDown = true;
    this.answerLocked = true;
    ui.setButtonsEnabled(false);

    let remaining = Math.max(1, Math.floor(seconds));
    ui.showOverlay({ title: "GET READY", subtitle: `Starting in ${remaining}…`, showButton: false });

    const tick = () => {
      if (!this.isCountingDown) return;

      remaining -= 1;
      if (remaining >= 1) {
        ui.updateOverlay({ subtitle: `Starting in ${remaining}…` });
        this._countdownEvent = this.time.delayedCall(1000, tick);
        return;
      }

      ui.hideOverlay();
      this.isCountingDown = false;
      this.answerLocked = false;
      this._countdownEvent = null;
      this._spawnNextAlien();
    };

    this._countdownEvent = this.time.delayedCall(1000, tick);
  }

  _resetRoundState() {
    const ui = this.game.__ui;
    this.currentQuestion = null;
    this.currentAnswers = [];
    this.currentCorrectChoiceIndex = -1;
    this.answerLocked = false;
    ui.setButtonsEnabled(false);
  }

  _createShip() {
    const { width, height } = this.scale;
    const y = height - 48;
    const x = width / 2;

    const body = this.add.rectangle(x, y, 42, 16, 0x38f6ff).setStrokeStyle(2, 0x8dff4f, 0.9);
    const cockpit = this.add.rectangle(x, y - 10, 16, 10, 0x8dff4f).setStrokeStyle(2, 0x38f6ff, 0.75);
    const wingL = this.add.rectangle(x - 22, y + 2, 14, 8, 0xff40d7).setStrokeStyle(1, 0x38f6ff, 0.55);
    const wingR = this.add.rectangle(x + 22, y + 2, 14, 8, 0xff40d7).setStrokeStyle(1, 0x38f6ff, 0.55);

    this.ship = this.add.container(0, 0, [body, cockpit, wingL, wingR]);
    this.ship.setDepth(10);

    this.shipGlow = this.add
      .rectangle(x, y, 62, 28, 0x38f6ff, 0.08)
      .setDepth(9)
      .setBlendMode(Phaser.BlendModes.ADD);

    this._positionShip();
  }

  _positionShip() {
    const { width, height } = this.scale;
    const x = width / 2;
    const y = height - 48;
    this.ship.x = x;
    this.ship.y = y;
    if (this.shipGlow) {
      this.shipGlow.x = x;
      this.shipGlow.y = y;
    }
  }

  _bindKeyboard() {
    const keys = this.input.keyboard.addKeys({
      one: Phaser.Input.Keyboard.KeyCodes.ONE,
      two: Phaser.Input.Keyboard.KeyCodes.TWO,
      three: Phaser.Input.Keyboard.KeyCodes.THREE,
      four: Phaser.Input.Keyboard.KeyCodes.FOUR,
      n1: Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE,
      n2: Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO,
      n3: Phaser.Input.Keyboard.KeyCodes.NUMPAD_THREE,
      n4: Phaser.Input.Keyboard.KeyCodes.NUMPAD_FOUR,
    });

    const onDown = (idx) => () => this.submitChoice(idx);

    keys.one.on("down", onDown(0));
    keys.two.on("down", onDown(1));
    keys.three.on("down", onDown(2));
    keys.four.on("down", onDown(3));
    keys.n1.on("down", onDown(0));
    keys.n2.on("down", onDown(1));
    keys.n3.on("down", onDown(2));
    keys.n4.on("down", onDown(3));
  }

  _createReturnToMenuButton() {
    const { width } = this.scale;
    this.menuBtn = this.add
      .text(width - 14, 16, "RETURN TO MAIN MENU", {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "8px",
        color: "rgba(233,247,255,0.9)",
      })
      .setOrigin(1, 0)
      .setDepth(20)
      .setShadow(0, 0, "rgba(56,246,255,0.25)", 8, true, true)
      .setInteractive({ useHandCursor: true });

    this.menuBtn.on("pointerdown", () => {
      if (this._learningFrozen) return;
      this.scene.start("MainMenuScene");
    });
  }

  _spawnNextAlien() {
    const ui = this.game.__ui;
    const { width } = this.scale;

    const bank = getQuestionBank();
    if (!bank.length) {
      ui.setButtonsEnabled(false);
      ui.setStatus("No questions loaded.");
      return;
    }

    let q = bank[Math.floor(Math.random() * bank.length)];
    // Prevent the same question from appearing twice in a row
    while (q.id === this.previousQuestionId && bank.length > 1) {
      q = bank[Math.floor(Math.random() * bank.length)];
    }
    this.currentQuestion = q;
    this.previousQuestionId = q.id;

    const answers = shuffleInPlace([q.correctAnswer, ...q.wrongAnswers].slice(0, 4));
    this.currentAnswers = answers;
    this.currentCorrectChoiceIndex = answers.indexOf(q.correctAnswer);

    ui.setAnswers(answers);
    ui.setButtonsEnabled(true);
    ui.setStatus("Choose 1–4.");

    const x = clamp(width / 2 + Phaser.Math.Between(-120, 120), 60, width - 60);
    const y = 80;

    const alienBody = this.add.image(x, y, "bookAlien").setOrigin(0.5, 0.5).setDepth(5);
    alienBody.setDisplaySize(40, 28);
    this.alien = alienBody;

    this.promptText = this.add
      .text(x, y - 44, q.prompt, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "10px",
        color: "#e9f7ff",
        align: "center",
        wordWrap: { width: Math.min(520, width - 40), useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0.5)
      .setDepth(6)
      .setShadow(0, 0, "rgba(56,246,255,0.35)", 8, true, true);

    this.answerLocked = false;
  }

  _handleSuccess() {
    if (!this.alien) {
      this._unlockAndRespawn();
      return;
    }

    const ui = this.game.__ui;
    const target = this.alien;
    const startX = this.ship.x;
    const startY = this.ship.y - 14;

    const projectile = this.add.image(startX, startY, "gavel").setOrigin(0.5, 0.5).setDepth(8);
    projectile.setDisplaySize(40, 28);

    const impactFlash = this.add
      .rectangle(target.x, target.y, 70, 50, 0x8dff4f, 0)
      .setDepth(7)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: projectile,
      x: target.x,
      y: target.y,
      angle: 540,
      duration: 347,
      ease: "Quad.easeIn",
      onComplete: () => {
        projectile.destroy();

        this.tweens.add({
          targets: impactFlash,
          alpha: { from: 0.0, to: 0.35 },
          duration: 70,
          yoyo: true,
          repeat: 2,
          onComplete: () => impactFlash.destroy(),
        });

        this._destroyAlien();
        this.time.delayedCall(this.spawnDelayMs, () => this._unlockAndRespawn());
      },
    });
  }

  _destroyAlien() {
    if (this.alien) {
      this.alien.destroy();
      this.alien = null;
    }
    if (this.promptText) {
      this.promptText.destroy();
      this.promptText = null;
    }
  }

  _unlockAndRespawn() {
    const ui = this.game.__ui;
    if (this.isCountingDown) return;
    if (this._learningFrozen) return;
    this.answerLocked = false;
    ui.setButtonsEnabled(true);
    this._spawnNextAlien();
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameOverScene" });
  }

  init(data) {
    this.finalScore = Number.isFinite(data?.score) ? data.score : 0;
    this.initials = safeInitials(data?.initials || "AAA");
    this.title = data?.title || "GAME OVER";
    this.subtitle = data?.subtitle || "Press SPACE to return to menu";
  }

  create() {
    const ui = this.game.__ui;
    if (this.game.__music) this.game.__music.setTheme("menu");
    ui.hideOverlay();
    ui.setHudVisible(false);
    ui.setButtonsEnabled(false);
    ui.setStatus("");

    this.cameras.main.setBackgroundColor("#000000");
    this.stars = createStarfield(this);

    const { width, height } = this.scale;

    const updated = saveHighScore(this.initials, this.finalScore);

    this.add
      .text(width / 2, 110, this.title, neonTextStyle(34, "#ff40d7"))
      .setOrigin(0.5, 0.5)
      .setShadow(0, 0, "rgba(255,64,215,0.35)", 16, true, true);

    this.add
      .text(width / 2, 170, `FINAL SCORE\n${this.finalScore}`, neonTextStyle(14, "#38f6ff"))
      .setOrigin(0.5, 0.5)
      .setShadow(0, 0, "rgba(56,246,255,0.25)", 14, true, true);

    // Top 10 list (column-aligned)
    const listX0 = width / 2 - 160;
    const listX1 = width / 2 - 80;
    const listX2 = width / 2 + 160;
    const listY0 = height / 2 + 30;
    const lineH = 16;

    this.add
      .text(width / 2, listY0 - 22, "TOP 10", neonTextStyle(12, "rgba(233,247,255,0.8)"))
      .setOrigin(0.5, 0.5)
      .setShadow(0, 0, "rgba(141,255,79,0.18)", 10, true, true);

    updated.forEach((x, i) => {
      const y = listY0 + i * lineH;
      this.add.text(listX0, y, `${i + 1}.`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "10px",
        color: "rgba(233,247,255,0.78)",
      });
      this.add.text(listX1, y, x.initials, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "10px",
        color: "rgba(233,247,255,0.78)",
      });
      this.add
        .text(listX2, y, String(x.score), {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: "10px",
          color: "rgba(233,247,255,0.78)",
        })
        .setOrigin(1, 0);
    });

    const prompt = this.add
      .text(width / 2, height - 72, "PRESS SPACE TO RETURN TO MENU", neonTextStyle(12, "#8dff4f"))
      .setOrigin(0.5, 0.5)
      .setShadow(0, 0, "rgba(141,255,79,0.25)", 14, true, true);

    this.tweens.add({
      targets: prompt,
      alpha: { from: 1, to: 0.15 },
      duration: 650,
      yoyo: true,
      repeat: -1,
    });

    const space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    space.once("down", () => {
      this.scene.start("MainMenuScene");
    });
  }

  update(_, delta) {
    updateStarfield(this.stars, delta / 1000);
  }
}

// -----------------------------
//  Boot the game
// -----------------------------
function boot() {
  const music = createMusicManager();
  const ui = createUIBridge(music);

  const config = {
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: "#000000",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 900,
      height: 520,
    },
    render: {
      pixelArt: true,
      antialias: false,
    },
    physics: {
      default: "arcade",
      arcade: { gravity: { y: 0 } },
    },
    scene: [BootScene, MainMenuScene, LevelSelectScene, NameInputScene, GameScene, LearningScene, GameOverScene],
  };

  const game = new Phaser.Game(config);

  // Attach shared state for scenes.
  game.__ui = ui;
  game.__music = music;
  game.__playerInitials = "AAA";
  game.__selectedMode = "campaign";
  game.__selectedCampaignCategory = null;

  const unlockMusic = () => music.unlock();
  document.addEventListener("pointerdown", unlockMusic, { once: true, passive: true });
  document.addEventListener("keydown", unlockMusic, { once: true });

  // Bulletproof linkage: HUD buttons / 1–4 keys route to the active gameplay scene.
  ui.onChoice = (choiceIndex) => {
    const learning = game.scene.getScene("LearningScene");
    if (learning && learning.scene && learning.scene.isActive() && typeof learning.submitChoice === "function") {
      learning.submitChoice(choiceIndex);
      return;
    }
    const active = game.scene.getScene("GameScene");
    if (active && active.scene && active.scene.isActive() && typeof active.submitChoice === "function") {
      active.submitChoice(choiceIndex);
    }
  };

  ui.setHudVisible(false);
  ui.setScore(0);
  ui.setLives(3);
  ui.setModeLabel("—");
  ui.setButtonsEnabled(false);
  ui.setStatus("");
  ui.hideOverlay();
}

boot();

