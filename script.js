/**
 * ROMANTIC SURPRISE WEBSITE — script.js
 * =====================================================
 * This file handles:
 *  1. Floating heart / firefly particles on the canvas
 *  2. The reveal transition (teaser → main page)
 *  3. Scroll-triggered fade-in animations
 *  4. Envelope open animation + love letter reveal
 *  5. Confetti celebration when the letter opens
 * =====================================================
 * You don't need to edit anything in this file unless
 * you want to customise the particle behaviour.
 * All text customisation is in index.html.
 * =====================================================
 */

/* ════════════════════════════════════════════════════
   1. FLOATING PARTICLES (hearts / fireflies)
   ════════════════════════════════════════════════════ */

const canvas  = document.getElementById('particleCanvas');
const ctx     = canvas.getContext('2d');

/** ─────────────────────────────────────────────────────
 * 👉 CUSTOMISE PARTICLES: Adjust these values to change
 *    the floating background elements.
 * ─────────────────────────────────────────────────────
 *
 * COUNT         — how many hearts float on screen
 * USE_HEARTS    — true  → draws ♥ heart shapes
 *                 false → draws soft glowing circles (fireflies)
 * SPEED_MIN/MAX — range of upward drift speed (px per frame)
 * SIZE_MIN/MAX  — range of particle size in px
 * COLORS        — array of colours to randomly pick from
 */
const PARTICLE_CONFIG = {
  COUNT:     35,
  USE_HEARTS: true,
  SPEED_MIN: 0.25,
  SPEED_MAX: 0.9,
  SIZE_MIN:  6,
  SIZE_MAX:  18,
  COLORS: [
    'rgba(244,167,185,0.55)',  // blush pink
    'rgba(232,132,154,0.45)',  // mid pink
    'rgba(181,41,78,0.35)',    // crimson
    'rgba(255,220,230,0.6)',   // petal white
  ],
};

let particles = [];

/** Resize canvas to fill the window */
function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

/** Create a single particle with random properties */
function createParticle(forceBottom = false) {
  return {
    x:     Math.random() * canvas.width,
    y:     forceBottom
             ? canvas.height + Math.random() * 80
             : Math.random() * canvas.height,
    size:  PARTICLE_CONFIG.SIZE_MIN +
           Math.random() * (PARTICLE_CONFIG.SIZE_MAX - PARTICLE_CONFIG.SIZE_MIN),
    speed: PARTICLE_CONFIG.SPEED_MIN +
           Math.random() * (PARTICLE_CONFIG.SPEED_MAX - PARTICLE_CONFIG.SPEED_MIN),
    drift: (Math.random() - 0.5) * 0.35,   // gentle left/right sway
    color: PARTICLE_CONFIG.COLORS[
             Math.floor(Math.random() * PARTICLE_CONFIG.COLORS.length)
           ],
    alpha: 0.2 + Math.random() * 0.6,
    angle: Math.random() * Math.PI * 2,     // wobble phase
    wobbleSpeed: 0.01 + Math.random() * 0.02,
    pulse: Math.random() * Math.PI * 2,     // glow pulse phase
  };
}

/** Draw a heart shape centred at (x, y) */
function drawHeart(x, y, size, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle   = color;
  ctx.beginPath();

  const s = size * 0.055;   // scale factor
  ctx.translate(x, y);
  ctx.scale(s, s);

  // Classic heart path
  ctx.moveTo(0, -5);
  ctx.bezierCurveTo(-10, -18, -25, -5, -25, 5);
  ctx.bezierCurveTo(-25, 15,  -10, 25,  0,  35);
  ctx.bezierCurveTo(10,  25,   25, 15,  25, 5);
  ctx.bezierCurveTo(25,  -5,   10, -18,  0, -5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Draw a glowing circle (firefly mode) */
function drawFirefly(x, y, size, color, alpha) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
  gradient.addColorStop(0,   color.replace(/[\d.]+\)$/, `${alpha})`));
  gradient.addColorStop(0.5, color.replace(/[\d.]+\)$/, `${alpha * 0.5})`));
  gradient.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.save();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Main animation loop */
function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((p, i) => {
    // Update position
    p.y     -= p.speed;
    p.angle += p.wobbleSpeed;
    p.pulse += 0.025;
    p.x     += Math.sin(p.angle) * p.drift;

    // Pulse alpha gently
    const pulseAlpha = p.alpha + Math.sin(p.pulse) * 0.12;

    // Draw the chosen shape
    if (PARTICLE_CONFIG.USE_HEARTS) {
      drawHeart(p.x, p.y, p.size, p.color, Math.max(0, Math.min(1, pulseAlpha)));
    } else {
      drawFirefly(p.x, p.y, p.size, p.color, Math.max(0, Math.min(1, pulseAlpha)));
    }

    // Recycle particle once it drifts off the top
    if (p.y < -40) {
      particles[i] = createParticle(true);
    }
  });

  requestAnimationFrame(animateParticles);
}

/** Initialise the particle system */
function initParticles() {
  resizeCanvas();
  particles = Array.from({ length: PARTICLE_CONFIG.COUNT }, () => createParticle(false));
  animateParticles();
}

window.addEventListener('resize', () => {
  resizeCanvas();
});

/* ════════════════════════════════════════════════════
   2. REVEAL TRANSITION: Teaser → Main page
   ════════════════════════════════════════════════════ */

const teaser      = document.getElementById('teaser');
const revealBtn   = document.getElementById('revealBtn');
const mainContent = document.getElementById('mainContent');

revealBtn.addEventListener('click', () => {
  // Fade out the teaser overlay
  teaser.classList.add('hidden');

  // Make main content accessible and animate it in
  mainContent.removeAttribute('aria-hidden');
  // Small delay so the fade-in feels intentional
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      mainContent.classList.add('visible');
    });
  });

  // Trigger scroll observer after a beat so items can animate in
  setTimeout(observeRevealItems, 600);
});

/* ════════════════════════════════════════════════════
   3. SCROLL-TRIGGERED FADE-IN ANIMATIONS
   ════════════════════════════════════════════════════ */

/**
 * IntersectionObserver watches every .reveal-item element.
 * When one enters the viewport, it adds .in-view which triggers
 * the CSS fade-in + slide-up transition defined in style.css.
 */
function observeRevealItems() {
  const items = document.querySelectorAll('.reveal-item');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          // Stop watching once animated (saves resources)
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,    // trigger when 12% of the item is visible
      rootMargin: '0px 0px -40px 0px',   // slight bottom offset
    }
  );

  items.forEach((item) => observer.observe(item));
}

/* ════════════════════════════════════════════════════
   4. ENVELOPE + LETTER REVEAL
   ════════════════════════════════════════════════════ */

const openLetterBtn    = document.getElementById('openLetterBtn');
const envelopeWrapper  = document.getElementById('envelopeWrapper');
const envelope         = document.getElementById('envelope');
let   letterOpened     = false;

/** Opens the envelope and slides out the letter */
function openLetter() {
  if (letterOpened) return;
  letterOpened = true;

  // Open the envelope (CSS transitions handle the flap animation)
  envelopeWrapper.classList.add('is-open');

  // Hide the button — envelope is now the interaction
  openLetterBtn.classList.add('hidden');

  // Trigger the confetti celebration after a short delay
  // so the animation feels choreographed
  setTimeout(launchConfetti, 700);
}

// Button click opens the letter
openLetterBtn.addEventListener('click', openLetter);

// Clicking the envelope itself also works
envelope.addEventListener('click', openLetter);
envelope.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') openLetter();
});

/* ════════════════════════════════════════════════════
   5. CONFETTI / SPARKLER CELEBRATION
   ════════════════════════════════════════════════════ */

/**
 * 👉 CUSTOMISE CONFETTI:
 *
 * PIECE_COUNT  — total confetti pieces launched
 * SHAPES       — 'circle' | 'square' | 'star' | 'heart'
 * COLORS       — array of confetti colours
 * DURATION_MS  — how long each piece takes to fall (ms)
 */
const CONFETTI_CONFIG = {
  PIECE_COUNT:  120,
  SHAPES:       ['circle', 'square', 'star', 'heart'],
  COLORS: [
    '#f4a7b9', '#e8849a', '#b5294e',
    '#ffd6e0', '#ff90a0', '#fff0f3',
    '#c9964a', '#f9e4ea',
  ],
  DURATION_MS:  3500,
};

/** Returns a random element from an array */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Creates a single confetti piece and appends it to body */
function spawnConfettiPiece() {
  const el    = document.createElement('div');
  const shape = pick(CONFETTI_CONFIG.SHAPES);
  const color = pick(CONFETTI_CONFIG.COLORS);
  const size  = 6 + Math.random() * 10;    // 6–16px
  const left  = Math.random() * 100;        // vw percentage
  const dur   = CONFETTI_CONFIG.DURATION_MS * (0.7 + Math.random() * 0.6);
  const delay = Math.random() * 1200;       // ms

  el.classList.add('confetti-piece');
  el.style.cssText = `
    left: ${left}vw;
    top: -20px;
    width: ${size}px;
    height: ${size}px;
    background: ${color};
    animation-duration: ${dur}ms;
    animation-delay: ${delay}ms;
    opacity: 0;
  `;

  // Shape overrides
  if (shape === 'square') {
    el.style.borderRadius = '2px';
    el.style.transform    = `rotate(${Math.random() * 45}deg)`;
  } else if (shape === 'star') {
    el.style.background    = 'none';
    el.style.color         = color;
    el.style.fontSize      = `${size + 4}px`;
    el.style.borderRadius  = '0';
    el.textContent         = '✦';
  } else if (shape === 'heart') {
    el.style.background    = 'none';
    el.style.color         = color;
    el.style.fontSize      = `${size + 4}px`;
    el.style.borderRadius  = '0';
    el.textContent         = '♥';
  }

  document.body.appendChild(el);

  // Remove from DOM once animation finishes to keep things tidy
  setTimeout(() => el.remove(), dur + delay + 200);
}

/** Launch the full confetti burst */
function launchConfetti() {
  const { PIECE_COUNT } = CONFETTI_CONFIG;
  let launched = 0;

  // Stagger launches so they feel like a burst, not a dump
  const interval = setInterval(() => {
    spawnConfettiPiece();
    launched++;
    if (launched >= PIECE_COUNT) clearInterval(interval);
  }, 18);
}

/* ════════════════════════════════════════════════════
   INIT: Start everything once the DOM is ready
   ════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initParticles();

  // The teaser is shown first; scroll reveal fires after the reveal
  // button is clicked (see section 2 above).
});





// PASSWORD GATE
// PASSWORD GATE
const PASSWORD     = '22.04.2026';
const MAX_ATTEMPTS = 3;
const LOCKOUT_MS   = 15 * 60 * 1000; // 15 minutes

const passwordScreen = document.getElementById('passwordScreen');
const passwordInput  = document.getElementById('passwordInput');
const passwordBtn    = document.getElementById('passwordBtn');
const passwordError  = document.getElementById('passwordError');

let attempts = 0;
let lockoutTimer = null;

/* ── Check if already locked out from a previous visit ── */
function checkExistingLockout() {
  const lockedUntil = localStorage.getItem('lockoutUntil');
  if (lockedUntil && Date.now() < parseInt(lockedUntil)) {
    applyLockout(parseInt(lockedUntil) - Date.now());
    return true;
  }
  return false;
}

/* ── Lock the screen for 15 minutes ── */
function applyLockout(remainingMs) {
  // Disable input and button
  passwordInput.disabled = true;
  passwordBtn.disabled   = true;
  passwordInput.value    = '';
  passwordInput.placeholder = '🔒 locked';

  // Save lockout end time so it survives page refresh
  const lockedUntil = Date.now() + remainingMs;
  localStorage.setItem('lockoutUntil', lockedUntil);

  // Show the lockout message with live countdown
  startCountdown(remainingMs);
}

/* ── Live countdown timer shown on screen ── */
function startCountdown(remainingMs) {
  const errorEl = document.getElementById('passwordError');

  function tick() {
    const left = parseInt(localStorage.getItem('lockoutUntil')) - Date.now();

    if (left <= 0) {
      // Lockout expired — unlock
      localStorage.removeItem('lockoutUntil');
      attempts = 0;
      passwordInput.disabled    = false;
      passwordBtn.disabled      = false;
      passwordInput.placeholder = 'DD.MM.YYYY';
      errorEl.classList.remove('visible');
      errorEl.textContent = 'not quite, my love — try again 💔';
      clearInterval(lockoutTimer);
      return;
    }

    const mins = Math.floor(left / 60000);
    const secs = Math.floor((left % 60000) / 1000);

    // 👉 CUSTOMISE: Change "Pala HTTP" to whatever you want shown
    errorEl.textContent = `Pala HTTP 🔒 try again in ${mins}:${secs.toString().padStart(2, '0')}`;
    errorEl.classList.add('visible');
  }

  tick(); // show immediately
  lockoutTimer = setInterval(tick, 1000);
}

/* ── Main password check ── */
function checkPassword() {
  // Block if locked out
  if (passwordInput.disabled) return;

  if (passwordInput.value.trim() === PASSWORD) {
    // Correct — clear everything and reveal
    localStorage.removeItem('lockoutUntil');
    clearInterval(lockoutTimer);
    passwordScreen.classList.add('hidden');
  } else {
    attempts++;
    const left = MAX_ATTEMPTS - attempts;

    passwordInput.classList.add('shake');
    setTimeout(() => passwordInput.classList.remove('shake'), 400);

    if (attempts >= MAX_ATTEMPTS) {
      // Lock out for 15 minutes
      passwordError.textContent = `Pala HTTP 🔒 try again in 15:00`;
      passwordError.classList.add('visible');
      applyLockout(LOCKOUT_MS);
    } else {
      // Show how many attempts remain
      passwordError.textContent = `not quite, my love — ${left} attempt${left === 1 ? '' : 's'} left 💔`;
      passwordError.classList.add('visible');
      setTimeout(() => {
        passwordError.classList.remove('visible');
        // Restore default message
        setTimeout(() => {
          passwordError.textContent = 'not quite, my love — try again 💔';
        }, 400);
      }, 1800);
    }
  }

  passwordInput.value = '';
}

passwordBtn.addEventListener('click', checkPassword);
passwordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') checkPassword();
});

// Check lockout immediately on page load
checkExistingLockout();

// Auto-insert dots: typing 22042026 becomes 22.04.2026
passwordInput.addEventListener('input', (e) => {
  // Don't auto-format if user is deleting or editing in the middle
  const cursorPos = passwordInput.selectionStart;
  const oldVal    = passwordInput.value;

  let val = oldVal.replace(/\./g, '').replace(/\D/g, '');
  if (val.length > 2) val = val.slice(0,2) + '.' + val.slice(2);
  if (val.length > 5) val = val.slice(0,5) + '.' + val.slice(5);
  val = val.slice(0, 10);

  if (val === oldVal) return; // nothing changed, don't touch cursor

  // Figure out where cursor should land after reformat
  const digitsBeforeCursor = oldVal.slice(0, cursorPos).replace(/\D/g, '').length;
  passwordInput.value = val;

  // Restore cursor position accounting for the dots
  let newCursor = 0;
  let digitsSeen = 0;
  for (let i = 0; i < val.length; i++) {
    if (/\d/.test(val[i])) digitsSeen++;
    if (digitsSeen === digitsBeforeCursor) { newCursor = i + 1; break; }
  }
  passwordInput.setSelectionRange(newCursor, newCursor);
});





/* ════════════════════════════════════════════════════
   VIDEO REVEAL
   ════════════════════════════════════════════════════ */

const videoCover    = document.getElementById('videoCover');
const videoPlayBtn  = document.getElementById('videoPlayBtn');
const romanticVideo = document.getElementById('romanticVideo');

videoPlayBtn.addEventListener('click', () => {
  videoCover.classList.add('hidden');
  romanticVideo.play();
  launchVideoHearts();
});

// When video ends — fade the cover back in with a replay feel
romanticVideo.addEventListener('ended', () => {
  videoCover.classList.remove('hidden');

  // 👉 CUSTOMISE: Change this text shown after video ends
  document.querySelector('.video-cover-quote').innerHTML =
    '"Play it again… 🔁<br/>some moments never get old"';

  document.querySelector('.video-cover-sub').textContent = 'tap to replay 🎥';
});

/** Bursts a few hearts outward from the centre when play is pressed */
function launchVideoHearts() {
  const wrapper = document.querySelector('.video-wrapper');
  const rect    = wrapper.getBoundingClientRect();
  const cx      = rect.left + rect.width  / 2;
  const cy      = rect.top  + rect.height / 2;

  for (let i = 0; i < 12; i++) {
    const heart  = document.createElement('div');
    const angle  = (i / 12) * Math.PI * 2;
    const dist   = 60 + Math.random() * 80;
    const size   = 14 + Math.random() * 14;
    const dur    = 700 + Math.random() * 400;

    heart.textContent = '♥';
    heart.style.cssText = `
      position: fixed;
      left: ${cx}px;
      top: ${cy}px;
      font-size: ${size}px;
      color: #f4a7b9;
      pointer-events: none;
      z-index: 9999;
      opacity: 1;
      transition: transform ${dur}ms cubic-bezier(0.22,1,0.36,1),
                  opacity   ${dur}ms ease;
      transform: translate(-50%, -50%);
    `;

    document.body.appendChild(heart);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        heart.style.transform = `translate(
          calc(-50% + ${Math.cos(angle) * dist}px),
          calc(-50% + ${Math.sin(angle) * dist}px)
        ) scale(0.3)`;
        heart.style.opacity = '0';
      });
    });

    setTimeout(() => heart.remove(), dur + 50);
  }
}


/* ════════════════════════════════════════════════════
   DAY / NIGHT MODE
   Auto-switches at sunrise (6am) and sunset (6pm).
   She can also toggle manually with the button.
   ════════════════════════════════════════════════════ */

const themeToggle = document.getElementById('themeToggle');
const toggleIcon  = document.getElementById('toggleIcon');
const toggleLabel = document.getElementById('toggleLabel');

/**
 * 👉 CUSTOMISE: Change these hours if you want
 *    sunrise / sunset at a different time.
 *    Uses her local device time automatically.
 */
const SUNRISE_HOUR = 6;   // 6:00 AM → switches to day
const SUNSET_HOUR  = 18;  // 6:00 PM → switches to night

/** Returns true if it is currently night time */
function isNightTime() {
  const hour = new Date().getHours();
  return hour >= SUNSET_HOUR || hour < SUNRISE_HOUR;
}

/** Apply a theme: 'night' or 'day' */
function applyTheme(mode) {
  const isNight = mode === 'night';

  document.body.classList.toggle('night-mode', isNight);
  document.body.classList.toggle('day-mode',   !isNight);

  toggleIcon.textContent  = isNight ? '☀️' : '🌙';
  toggleLabel.textContent = isNight ? 'day' : 'night';

  // Show / hide stars
  document.querySelectorAll('.star').forEach(s => {
    s.style.opacity = isNight ? null : '0';
  });

  // Save preference so it persists on refresh
  localStorage.setItem('romanticTheme', mode);
}

/** Toggle between day and night manually */
function toggleTheme() {
  const isCurrentlyNight = document.body.classList.contains('night-mode');
  applyTheme(isCurrentlyNight ? 'day' : 'night');
}

/** Seed the starfield (only visible in night mode) */
function createStars() {
  const COUNT = 80;
  for (let i = 0; i < COUNT; i++) {
    const star = document.createElement('div');
    star.classList.add('star');
    star.style.cssText = `
      left: ${Math.random() * 100}vw;
      top:  ${Math.random() * 100}vh;
      --twinkle-dur: ${2 + Math.random() * 4}s;
      animation-delay: ${Math.random() * 4}s;
      width:  ${Math.random() > 0.7 ? 3 : 2}px;
      height: ${Math.random() > 0.7 ? 3 : 2}px;
    `;
    document.body.appendChild(star);
  }
}

/** Check every minute if we've crossed sunrise/sunset */
function scheduleAutoSwitch() {
  setInterval(() => {
    // Only auto-switch if she hasn't manually chosen
    if (!localStorage.getItem('romanticThemeManual')) {
      applyTheme(isNightTime() ? 'night' : 'day');
    }
  }, 60 * 1000); // check every 60 seconds
}

// Manual toggle — mark as manual so auto doesn't override
themeToggle.addEventListener('click', () => {
  localStorage.setItem('romanticThemeManual', 'true');
  toggleTheme();
});

// ── INIT ──
createStars();

// Priority: 1) saved manual preference  2) auto by time
const saved = localStorage.getItem('romanticTheme');
if (saved) {
  applyTheme(saved);
} else {
  applyTheme(isNightTime() ? 'night' : 'day');
}

scheduleAutoSwitch();




/* ════════════════════════════════════════════════════
   HEART CURSOR TRAIL
   Tiny hearts follow the mouse and float upward.
   ════════════════════════════════════════════════════ */

/**
 * 👉 CUSTOMISE:
 * HEART_CHARS  — characters to randomly pick from
 * COLORS       — heart colours to randomly pick from
 * SIZE_MIN/MAX — heart size range in px
 * LIFETIME_MS  — how long each heart lives before fading
 * SPAWN_RATE   — lower = more hearts (ms between spawns)
 */
const TRAIL_CONFIG = {
  HEART_CHARS: ['♥', '❤', '💕', '✦'],
  COLORS: [
    '#f4a7b9',
    '#e8849a',
    '#b5294e',
    '#ffd6e0',
    '#c9964a',
  ],
  SIZE_MIN:    10,
  SIZE_MAX:    22,
  LIFETIME_MS: 1000,
  SPAWN_RATE:  40,
};

let lastSpawn  = 0;
let mouseX     = 0;
let mouseY     = 0;
let trailActive = false;

/** Create one heart at the current mouse position */
function spawnTrailHeart(x, y) {
  const heart = document.createElement('span');

  const char    = pick(TRAIL_CONFIG.HEART_CHARS);
  const color   = pick(TRAIL_CONFIG.COLORS);
  const size    = TRAIL_CONFIG.SIZE_MIN +
                  Math.random() * (TRAIL_CONFIG.SIZE_MAX - TRAIL_CONFIG.SIZE_MIN);
  const drift   = (Math.random() - 0.5) * 40;   // sideways float
  const rise    = 40 + Math.random() * 50;       // upward float distance
  const rotate  = (Math.random() - 0.5) * 40;   // slight spin

  heart.textContent = char;
  heart.style.cssText = `
    position:       fixed;
    left:           ${x}px;
    top:            ${y}px;
    font-size:      ${size}px;
    color:          ${color};
    pointer-events: none;
    z-index:        99999;
    user-select:    none;
    line-height:    1;
    transform:      translate(-50%, -50%);
    transition:
      transform  ${TRAIL_CONFIG.LIFETIME_MS}ms cubic-bezier(0.22,1,0.36,1),
      opacity    ${TRAIL_CONFIG.LIFETIME_MS}ms ease;
    will-change: transform, opacity;
  `;

  document.body.appendChild(heart);

  // Trigger animation on next paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      heart.style.transform = `
        translate(
          calc(-50% + ${drift}px),
          calc(-50% - ${rise}px)
        )
        rotate(${rotate}deg)
        scale(0.3)
      `;
      heart.style.opacity = '0';
    });
  });

  // Remove from DOM once done
  setTimeout(() => heart.remove(), TRAIL_CONFIG.LIFETIME_MS + 50);
}

/** Throttled mouse move handler */
document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  trailActive = true;

  const now = Date.now();
  if (now - lastSpawn > TRAIL_CONFIG.SPAWN_RATE) {
    lastSpawn = now;
    spawnTrailHeart(mouseX, mouseY);
  }
});

// Pause trail when mouse leaves the window
document.addEventListener('mouseleave', () => { trailActive = false; });
document.addEventListener('mouseenter', () => { trailActive = true;  });






/* ════════════════════════════════════════════════════
   SHAKE TO CONFETTI — Mobile Easter Egg
   She shakes her phone and gets a surprise burst
   of confetti + a sweet little toast message.
   ════════════════════════════════════════════════════ */

/**
 * 👉 CUSTOMISE:
 * THRESHOLD      — how hard she needs to shake (lower = easier)
 * COOLDOWN_MS    — gap between shakes so it doesn't spam
 * MESSAGES       — sweet messages shown after each shake
 *                  (cycles through them one by one)
 */
const SHAKE_CONFIG = {
  THRESHOLD:   18,
  COOLDOWN_MS: 3000,
  MESSAGES: [
    "I love you so much 💕",
    "You make my whole world shake ♥",
    "Still falling for you… 🌹",
    "Every day with you is a gift 🎁",
    "You're my favourite person 🥰",
    "I'd choose you a million times over 💌",
  ],
};

let lastShakeTime   = 0;
let lastX = 0, lastY = 0, lastZ = 0;
let messageIndex    = 0;
let toastTimeout    = null;

/** Show a floating toast message on screen */
function showShakeToast(message) {
  // Remove any existing toast
  const existing = document.getElementById('shakeToast');
  if (existing) existing.remove();
  if (toastTimeout) clearTimeout(toastTimeout);

  const toast = document.createElement('div');
  toast.id = 'shakeToast';
  toast.textContent = message;
  toast.style.cssText = `
    position:        fixed;
    bottom:          12vh;
    left:            50%;
    transform:       translateX(-50%) translateY(20px);
    background:      linear-gradient(135deg, #b5294e 0%, #e8849a 100%);
    color:           #fff;
    font-family:     'Cormorant Garamond', serif;
    font-style:      italic;
    font-size:       clamp(1.1rem, 4.5vw, 1.4rem);
    font-weight:     300;
    padding:         0.9rem 2rem;
    border-radius:   60px;
    box-shadow:      0 8px 32px rgba(181,41,78,0.4);
    z-index:         99999;
    pointer-events:  none;
    white-space:     nowrap;
    opacity:         0;
    transition:      opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1);
    text-align:      center;
    max-width:       85vw;
    white-space:     normal;
  `;

  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity   = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
  });

  // Fade out after 2.8s
  toastTimeout = setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateX(-50%) translateY(-16px)';
    setTimeout(() => toast.remove(), 500);
  }, 2800);
}

/** The full shake celebration */
function triggerShakeCelebration() {
  // Launch confetti (reuses your existing launchConfetti function)
  launchConfetti();

  // Pick the next message in the cycle
  const message = SHAKE_CONFIG.MESSAGES[messageIndex % SHAKE_CONFIG.MESSAGES.length];
  messageIndex++;

  showShakeToast(message);
}

/** Read accelerometer and detect a shake */
function handleMotion(event) {
  const acc = event.accelerationIncludingGravity;
  if (!acc) return;

  const { x, y, z } = acc;
  const now          = Date.now();

  // How much did the phone move since last reading?
  const delta =
    Math.abs(x - lastX) +
    Math.abs(y - lastY) +
    Math.abs(z - lastZ);

  lastX = x; lastY = y; lastZ = z;

  // Fire if movement is strong enough and cooldown has passed
  if (delta > SHAKE_CONFIG.THRESHOLD && now - lastShakeTime > SHAKE_CONFIG.COOLDOWN_MS) {
    lastShakeTime = now;
    triggerShakeCelebration();
  }
}

/** Request motion permission (required on iOS 13+) then start listening */
function initShakeDetection() {
  // DeviceMotionEvent not supported (desktop) — skip silently
  if (!window.DeviceMotionEvent) return;

  // iOS 13+ requires explicit permission
  if (typeof DeviceMotionEvent.requestPermission === 'function') {

    // We can only ask for permission after a user gesture.
    // So we attach a one-time tap listener on the whole page.
    const askOnFirstTap = () => {
      DeviceMotionEvent.requestPermission()
        .then((state) => {
          if (state === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
          }
        })
        .catch(() => {});

      document.removeEventListener('touchstart', askOnFirstTap);
    };

    document.addEventListener('touchstart', askOnFirstTap, { once: true });

  } else {
    // Android & older iOS — no permission needed, just listen
    window.addEventListener('devicemotion', handleMotion);
  }
}

// ── INIT ──
initShakeDetection();




/* ════════════════════════════════════════════════════
   RELATIONSHIP CALENDAR
   ════════════════════════════════════════════════════ */

/**
 * 👉 CUSTOMISE:
 * START_DATE — your anniversary / the day you got together
 * Format must be YYYY, MM-1 (month is 0-indexed), DD
 * April 22 2026 → new Date(2026, 3, 22)
 */
const START_DATE = new Date(2026, 3, 22); // April 22, 2026

// Which month the calendar is currently showing
let calYear  = START_DATE.getFullYear();
let calMonth = START_DATE.getMonth();

const MONTH_NAMES = [
  'January','February','March','April',
  'May','June','July','August',
  'September','October','November','December'
];

/** Render the calendar for a given year + month */
function renderCalendar(year, month) {
  const grid       = document.getElementById('calGrid');
  const monthLabel = document.getElementById('calMonthLabel');
  const prevBtn    = document.getElementById('calPrev');
  const nextBtn    = document.getElementById('calNext');

  if (!grid) return;

  grid.innerHTML   = '';
  monthLabel.textContent = `${MONTH_NAMES[month]} ${year}`;

  const today      = new Date();
  today.setHours(0,0,0,0);

  const startClean = new Date(START_DATE);
  startClean.setHours(0,0,0,0);

  // Disable prev button if we're already on the start month
  prevBtn.disabled =
    year < startClean.getFullYear() ||
    (year === startClean.getFullYear() && month <= startClean.getMonth());

  // Disable next if we're past today's month
  nextBtn.disabled =
    year > today.getFullYear() ||
    (year === today.getFullYear() && month >= today.getMonth());

  // First day of the month (0=Sun … 6=Sat)
  const firstWeekday = new Date(year, month, 1).getDay();
  // How many days in this month
  const daysInMonth  = new Date(year, month + 1, 0).getDate();

  // Empty cells before day 1
  for (let i = 0; i < firstWeekday; i++) {
    const empty = document.createElement('div');
    empty.classList.add('cal-day', 'empty');
    grid.appendChild(empty);
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const cell    = document.createElement('div');
    const thisDay = new Date(year, month, d);
    thisDay.setHours(0,0,0,0);

    cell.classList.add('cal-day');
    cell.textContent = d;

    const isStart  = thisDay.getTime() === startClean.getTime();
    const isToday  = thisDay.getTime() === today.getTime();
    const isFilled = thisDay >= startClean && thisDay <= today;
    const isFuture = thisDay > today;

    if (isStart)   cell.classList.add('start-day');
    if (isToday)   cell.classList.add('today-day');
    if (isFilled)  cell.classList.add('filled');
    if (isFuture)  cell.classList.add('future');

    grid.appendChild(cell);
  }
}

/** Animate the counter numbers counting up */
function animateCounter(id, target) {
  const el       = document.getElementById(id);
  if (!el) return;
  const duration = 1500;
  const start    = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    // ease out
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

/** Update the live counter every minute */
function updateCounter() {
  const now   = new Date();
  const diff  = now - START_DATE;           // ms
  if (diff < 0) {
    // Relationship hasn't started yet — show zeros
    document.getElementById('dayCount').textContent    = '0';
    document.getElementById('hourCount').textContent   = '0';
    document.getElementById('minuteCount').textContent = '0';
    return;
  }

  const totalMinutes = Math.floor(diff / 60000);
  const totalHours   = Math.floor(diff / 3600000);
  const totalDays    = Math.floor(diff / 86400000);

  animateCounter('dayCount',    totalDays);
  animateCounter('hourCount',   totalHours);
  animateCounter('minuteCount', totalMinutes);
}

/** Wire up navigation buttons */
function initCalendarNav() {
  document.getElementById('calPrev')?.addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar(calYear, calMonth);
  });

  document.getElementById('calNext')?.addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar(calYear, calMonth);
  });
}

/** Start on the current month, or start month if future */
function initCalendar() {
  const today = new Date();
  calYear  = today.getFullYear();
  calMonth = today.getMonth();

  // If start date is in the future, open on that month instead
  if (START_DATE > today) {
    calYear  = START_DATE.getFullYear();
    calMonth = START_DATE.getMonth();
  }

  renderCalendar(calYear, calMonth);
  updateCounter();
  setInterval(updateCounter, 60000); // refresh every minute
  initCalendarNav();
}

// Init once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalendar);
} else {
  initCalendar();
}
