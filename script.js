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
const PASSWORD = '22.04.2026';

const passwordScreen = document.getElementById('passwordScreen');
const passwordInput  = document.getElementById('passwordInput');
const passwordBtn    = document.getElementById('passwordBtn');
const passwordError  = document.getElementById('passwordError');

function checkPassword() {
  if (passwordInput.value.trim() === PASSWORD) {
    passwordScreen.classList.add('hidden');
// Check anniversary every time she successfully logs in
checkAnniversary();
checkBirthday();
    // auto-format as they type: add dots after DD and MM
  } else {
    passwordError.classList.add('visible');
    passwordInput.classList.add('shake');
    setTimeout(() => {
      passwordError.classList.remove('visible');
      passwordInput.classList.remove('shake');
    }, 1800);
  }
}

passwordBtn.addEventListener('click', checkPassword);
passwordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') checkPassword();
});

// Auto-insert dots: typing 22042026 becomes 22.04.2026
passwordInput.addEventListener('input', () => {
  let val = passwordInput.value.replace(/\./g, '').replace(/\D/g, '');
  if (val.length > 2) val = val.slice(0,2) + '.' + val.slice(2);
  if (val.length > 5) val = val.slice(0,5) + '.' + val.slice(5);
  passwordInput.value = val.slice(0, 10);
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






/* ════════════════════════════════════════════════════
   MONTHLY ANNIVERSARY SURPRISE
   Every 22nd of the month she gets a special
   full-screen celebration when she opens the site.
   ════════════════════════════════════════════════════ */

/**
 * 👉 CUSTOMISE:
 * ANNIVERSARY_DAY  — the day of the month (22)
 * MESSAGES         — what shows on each month's anniversary
 *                    index 0 = 1st month, 1 = 2nd month, etc.
 *                    after the list runs out it cycles back
 */
const ANNIVERSARY_CONFIG = {
  ANNIVERSARY_DAY: 22,
  MESSAGES: [
    { month: "1 month",  line1: "One month of us",        line2: "and I'd choose you again in a heartbeat 💕" },
    { month: "2 months", line1: "Two months together",    line2: "every day better than the last 🌹" },
    { month: "3 months", line1: "Three whole months",     line2: "and I'm still falling for you 🍂" },
    { month: "4 months", line1: "Four months of magic",   line2: "you make everything feel like home 🕯️" },
    { month: "5 months", line1: "Five months, my love",   line2: "I can't imagine a day without you ✨" },
    { month: "6 months", line1: "Half a year of us",      line2: "and the best is still to come 🌸" },
    { month: "7 months", line1: "Seven months together",  line2: "you're my favourite everything 💌" },
    { month: "8 months", line1: "Eight beautiful months", line2: "thank you for being mine 🌙" },
    { month: "9 months", line1: "Nine months of love",    line2: "still my favourite surprise 🎁" },
    { month: "10 months",line1: "Ten months, my darling", line2: "every moment with you is a gift 💍" },
    { month: "11 months",line1: "Eleven months of us",    line2: "almost a year of the best thing ever 🥂" },
    { month: "1 year! 🎉",line1: "One whole year together","line2": "you are my greatest adventure 🌍💕" },
  ],
};

/* ── Build and inject the overlay HTML ── */
function createAnniversaryOverlay() {
  const el = document.createElement('div');
  el.id = 'anniversaryOverlay';
  el.innerHTML = `
    <canvas id="anniversaryCanvas"></canvas>
    <div class="anni-content">
      <div class="anni-ornament">✦ &nbsp; ✦ &nbsp; ✦</div>
      <p class="anni-eyebrow" id="anniEyebrow"></p>
      <h2 class="anni-title" id="anniTitle"></h2>
      <p class="anni-sub" id="anniSub"></p>
      <div class="anni-hearts" id="anniHearts"></div>
      <button class="anni-close" id="anniClose">
        continue to your surprise ♥
      </button>
    </div>
  `;
  document.body.appendChild(el);
}

/* ── Inject the CSS ── */
function injectAnniversaryStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #anniversaryOverlay {
      position: fixed;
      inset: 0;
      z-index: 9998;
      background: #0d0408;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 1.2s ease;
      overflow: hidden;
    }

    #anniversaryOverlay.visible {
      opacity: 1;
    }

    #anniversaryOverlay.fade-out {
      opacity: 0;
      pointer-events: none;
    }

    #anniversaryCanvas {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .anni-content {
      position: relative;
      z-index: 2;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.2rem;
      padding: 2rem;
      animation: anniFloat 4s ease-in-out infinite alternate;
    }

    @keyframes anniFloat {
      from { transform: translateY(0px);  }
      to   { transform: translateY(-12px); }
    }

    .anni-ornament {
      color: #f4a7b9;
      opacity: 0.6;
      letter-spacing: 0.4em;
      font-size: 0.8rem;
      animation: anniFade 2s ease-in-out infinite alternate;
    }

    @keyframes anniFade {
      from { opacity: 0.3; }
      to   { opacity: 0.8; }
    }

    .anni-eyebrow {
      font-family: 'Sacramento', cursive;
      font-size: clamp(1.2rem, 4vw, 1.8rem);
      color: rgba(244,167,185,0.8);
      letter-spacing: 0.03em;
    }

    .anni-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(2.2rem, 8vw, 5rem);
      font-weight: 300;
      font-style: italic;
      color: #f9e4ea;
      line-height: 1.15;
      max-width: 700px;
    }

    .anni-title .anni-accent {
      color: #f4a7b9;
      display: block;
    }

    .anni-sub {
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(1rem, 3vw, 1.4rem);
      font-style: italic;
      font-weight: 300;
      color: rgba(249,228,234,0.7);
      max-width: 500px;
      line-height: 1.6;
    }

    .anni-hearts {
      display: flex;
      gap: 0.8rem;
      font-size: clamp(1.4rem, 5vw, 2.2rem);
      margin: 0.5rem 0;
      animation: anniHeartPop 0.6s cubic-bezier(0.34,1.56,0.64,1) both;
      animation-delay: 1s;
    }

    @keyframes anniHeartPop {
      from { transform: scale(0); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }

    .anni-hearts span {
      display: inline-block;
      animation: anniHeartBounce 1.8s ease-in-out infinite;
    }

    .anni-hearts span:nth-child(2) { animation-delay: 0.2s; }
    .anni-hearts span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes anniHeartBounce {
      0%,100% { transform: translateY(0) scale(1);    }
      50%      { transform: translateY(-8px) scale(1.2); }
    }

    .anni-close {
      margin-top: 1rem;
      padding: 0.85rem 2.2rem;
      border-radius: 60px;
      border: 1.5px solid rgba(244,167,185,0.4);
      background: transparent;
      color: rgba(249,228,234,0.8);
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(0.9rem, 2.5vw, 1.1rem);
      font-style: italic;
      letter-spacing: 0.05em;
      cursor: pointer;
      transition: border-color 0.3s, color 0.3s, transform 0.3s;
      animation: anniFadeIn 1s 2s ease both;
    }

    @keyframes anniFadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0);    }
    }

    .anni-close:hover {
      border-color: #f4a7b9;
      color: #f9e4ea;
      transform: scale(1.05);
    }
  `;
  document.head.appendChild(style);
}

/* ── Shooting star particles on the anniversary canvas ── */
function startAnniversaryParticles(canvas) {
  const ctx  = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  const pieces = [];
  const EMOJIS = ['♥', '💕', '✦', '🌹', '✨'];
  const COLORS = ['#f4a7b9','#e8849a','#b5294e','#ffd6e0','#fff0f3'];

  for (let i = 0; i < 55; i++) {
    pieces.push({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      char:  EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size:  10 + Math.random() * 18,
      speedY: 0.3 + Math.random() * 0.8,
      speedX: (Math.random() - 0.5) * 0.5,
      alpha:  0.2 + Math.random() * 0.6,
      pulse:  Math.random() * Math.PI * 2,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.01 + Math.random() * 0.02,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y      -= p.speedY;
      p.x      += p.speedX;
      p.pulse  += 0.02;
      p.wobble += p.wobbleSpeed;
      p.x      += Math.sin(p.wobble) * 0.4;

      const a = Math.max(0, Math.min(1, p.alpha + Math.sin(p.pulse) * 0.15));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle   = p.color;
      ctx.font        = `${p.size}px serif`;
      ctx.textAlign   = 'center';
      ctx.fillText(p.char, p.x, p.y);
      ctx.restore();

      if (p.y < -30) {
        p.y = canvas.height + 20;
        p.x = Math.random() * canvas.width;
      }
    });
    requestAnimationFrame(draw);
  }
  draw();
}

/* ── Work out which month anniversary it is ── */
function getAnniversaryMessage() {
  const start   = new Date(2026, 3, 22); // April 22 2026 — change if needed
  const today   = new Date();
  const months  =
    (today.getFullYear() - start.getFullYear()) * 12 +
    (today.getMonth()   - start.getMonth());

  if (months < 0) return null;

  const idx = Math.min(months, ANNIVERSARY_CONFIG.MESSAGES.length - 1);
  return ANNIVERSARY_CONFIG.MESSAGES[idx];
}

/* ── Show the overlay ── */
function showAnniversaryOverlay() {
  const msg = getAnniversaryMessage();
  if (!msg) return;

  injectAnniversaryStyles();
  createAnniversaryOverlay();

  // Fill in the text
  document.getElementById('anniEyebrow').textContent = `happy ${msg.month} anniversary, my love`;
  document.getElementById('anniTitle').innerHTML =
    `${msg.line1}<span class="anni-accent">${msg.line2}</span>`;

  // Bouncing hearts row
  const heartsEl = document.getElementById('anniHearts');
  ['♥', '💕', '♥'].forEach(h => {
    const s = document.createElement('span');
    s.textContent = h;
    heartsEl.appendChild(s);
  });

  // Start particles
  startAnniversaryParticles(document.getElementById('anniversaryCanvas'));

  // Fade in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.getElementById('anniversaryOverlay').classList.add('visible');
    });
  });

  // Also launch confetti after 1 second
  setTimeout(launchConfetti, 1000);

  // Close button
  document.getElementById('anniClose').addEventListener('click', () => {
    const overlay = document.getElementById('anniversaryOverlay');
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.remove(), 1200);
  });
}

/* ── Check if today is the 22nd and she hasn't seen it today ── */
function checkAnniversary() {
  const today = new Date();

  // Fire every single time she logs in on the 22nd — no once-per-day limit
  if (today.getDate() === ANNIVERSARY_CONFIG.ANNIVERSARY_DAY) {
    // Small delay so the password screen clears first
    setTimeout(showAnniversaryOverlay, 1500);
  }
}







/* ════════════════════════════════════════════════════
   BIRTHDAY SURPRISE — 12th December
   Every year on her birthday, after login,
   a special full-screen celebration appears.
   Completely different feel from the anniversary.
════════════════════════════════════════════════════ */

/**
 * 👉 CUSTOMISE:
 * BIRTH_DAY   — day of her birthday
 * BIRTH_MONTH — month (1=Jan, 12=Dec)
 * HER_NAME    — her name shown on the screen
 * WISHES      — the lines shown on the birthday card
 */
const BIRTHDAY_CONFIG = {
  BIRTH_DAY:   12,
  BIRTH_MONTH: 12,
  HER_NAME:    'Manika',        // 👉 change to her name
  WISHES: [
    'Today the world got its greatest gift',
    'the day you were born 🎂',
    'Happy Birthday, my love 🎉',
  ],
};

/* ── Inject birthday CSS ── */
function injectBirthdayStyles() {
  if (document.getElementById('birthdayStyles')) return;
  const style = document.createElement('style');
  style.id = 'birthdayStyles';
  style.textContent = `

    /* ── OVERLAY ── */
    #birthdayOverlay {
      position: fixed;
      inset: 0;
      z-index: 9997;
      background: #08040f;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 1.4s ease;
      overflow: hidden;
    }
    #birthdayOverlay.visible  { opacity: 1; }
    #birthdayOverlay.fade-out { opacity: 0; pointer-events: none; }

    /* ── BALLOONS ── */
    .balloon {
      position: absolute;
      bottom: -160px;
      font-size: 3rem;
      animation: balloonRise linear forwards;
      pointer-events: none;
      filter: drop-shadow(0 4px 12px rgba(244,167,185,0.4));
    }
    @keyframes balloonRise {
      0%   { transform: translateY(0)      rotate(0deg);   opacity: 1; }
      100% { transform: translateY(-110vh) rotate(var(--sway, 15deg)); opacity: 0; }
    }

    /* ── STARS BURST ── */
    .bday-star {
      position: absolute;
      pointer-events: none;
      animation: starBurst ease-out forwards;
      font-size: var(--sz, 1.2rem);
    }
    @keyframes starBurst {
      0%   { transform: translate(0,0) scale(0); opacity: 1; }
      60%  { opacity: 1; }
      100% { transform: translate(var(--tx),var(--ty)) scale(1); opacity: 0; }
    }

    /* ── CANDLES ROW ── */
    .candle-row {
      display: flex;
      gap: 0.6rem;
      justify-content: center;
      margin: 0.5rem 0;
    }
    .candle {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0px;
      animation: candleAppear 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    .candle:nth-child(1){ animation-delay:1.0s }
    .candle:nth-child(2){ animation-delay:1.15s }
    .candle:nth-child(3){ animation-delay:1.3s }
    .candle:nth-child(4){ animation-delay:1.45s }
    .candle:nth-child(5){ animation-delay:1.6s }
    @keyframes candleAppear {
      from { transform: scaleY(0); opacity: 0; }
      to   { transform: scaleY(1); opacity: 1; }
    }
    .candle-flame {
      font-size: 1.1rem;
      animation: flameDance 0.9s ease-in-out infinite alternate;
      transform-origin: bottom center;
    }
    .candle:nth-child(even) .candle-flame { animation-direction: alternate-reverse; }
    @keyframes flameDance {
      from { transform: scaleX(1)    rotate(-4deg); }
      to   { transform: scaleX(0.85) rotate( 4deg); }
    }
    .candle-body {
      width: 10px;
      height: 28px;
      border-radius: 3px;
      background: linear-gradient(180deg, #f4a7b9 0%, #b5294e 100%);
      box-shadow: 0 0 8px rgba(244,167,185,0.5);
    }

    /* ── CAKE ── */
    .bday-cake {
      font-size: clamp(3.5rem, 12vw, 6rem);
      animation: cakePop 0.8s 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
      filter: drop-shadow(0 0 24px rgba(244,167,185,0.5));
    }
    @keyframes cakePop {
      from { transform: scale(0) rotate(-10deg); opacity: 0; }
      to   { transform: scale(1) rotate(0deg);   opacity: 1; }
    }

    /* ── GLITTER RING around cake ── */
    .glitter-ring {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: clamp(140px, 35vw, 200px);
      height: clamp(140px, 35vw, 200px);
    }
    .glitter-ring::before,
    .glitter-ring::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid rgba(244,167,185,0.25);
      animation: ringPulse 2s ease-in-out infinite;
    }
    .glitter-ring::after {
      inset: -14px;
      border-color: rgba(244,167,185,0.12);
      animation-delay: 0.5s;
    }
    @keyframes ringPulse {
      0%,100% { transform: scale(1);    opacity: 0.6; }
      50%      { transform: scale(1.08); opacity: 0.2; }
    }

    /* ── TEXT ── */
    .bday-content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.9rem;
      text-align: center;
      padding: 2rem;
    }
    .bday-eyebrow {
      font-family: 'Sacramento', cursive;
      font-size: clamp(1.1rem, 3.5vw, 1.6rem);
      color: rgba(244,167,185,0.75);
      animation: bdayFadeUp 1s 0.3s ease both;
    }
    .bday-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(2.8rem, 10vw, 6.5rem);
      font-weight: 300;
      font-style: italic;
      color: #f9e4ea;
      line-height: 1;
      animation: bdayFadeUp 1s 0.5s ease both;
      text-shadow: 0 0 40px rgba(244,167,185,0.4);
    }
    .bday-wish {
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(1rem, 3vw, 1.45rem);
      font-style: italic;
      font-weight: 300;
      color: rgba(249,228,234,0.75);
      max-width: 480px;
      line-height: 1.65;
      animation: bdayFadeUp 1s 0.8s ease both;
    }
    .bday-wish .bday-highlight {
      color: #f4a7b9;
      font-style: normal;
    }
    @keyframes bdayFadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0);    }
    }

    /* ── CLOSE BUTTON ── */
    .bday-close {
      margin-top: 0.8rem;
      padding: 0.85rem 2.2rem;
      border-radius: 60px;
      border: 1.5px solid rgba(244,167,185,0.35);
      background: transparent;
      color: rgba(249,228,234,0.8);
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(0.9rem, 2.5vw, 1.05rem);
      font-style: italic;
      letter-spacing: 0.05em;
      cursor: pointer;
      transition: border-color 0.3s, color 0.3s, transform 0.3s;
      animation: bdayFadeUp 1s 2.5s ease both;
    }
    .bday-close:hover {
      border-color: #f4a7b9;
      color: #f9e4ea;
      transform: scale(1.05);
    }

    /* ── SHOOTING STARS background ── */
    .bday-shoot {
      position: absolute;
      width: 2px;
      height: 2px;
      background: #fff;
      border-radius: 50%;
      pointer-events: none;
      animation: shootMove linear forwards;
      opacity: 0;
    }
    .bday-shoot::after {
      content: '';
      position: absolute;
      top: 0; right: 0;
      width: clamp(60px,15vw,120px);
      height: 1px;
      background: linear-gradient(to left, rgba(255,255,255,0.6), transparent);
      transform-origin: right center;
    }
    @keyframes shootMove {
      0%   { opacity: 0; transform: translate(0,0); }
      5%   { opacity: 1; }
      100% { opacity: 0; transform: translate(var(--sdx), var(--sdy)); }
    }
  `;
  document.head.appendChild(style);
}

/* ── Build the overlay HTML ── */
function createBirthdayOverlay() {
  const el = document.createElement('div');
  el.id = 'birthdayOverlay';

  // Build candles
  const candles = Array.from({length: 5}, () =>
    `<div class="candle">
       <div class="candle-flame">🔥</div>
       <div class="candle-body"></div>
     </div>`
  ).join('');

  // Build wish lines
  const wishLines = BIRTHDAY_CONFIG.WISHES.map((w, i) =>
    i === 0
      ? `<span>${w}</span>`
      : `<span class="bday-highlight">${w}</span>`
  ).join('<br/>');

  el.innerHTML = `
    <div class="bday-content">
      <p class="bday-eyebrow">today is a very special day 🎀</p>

      <div class="glitter-ring">
        <div class="bday-cake">🎂</div>
      </div>

      <div class="candle-row">${candles}</div>

      <p class="bday-name">${BIRTHDAY_CONFIG.HER_NAME}</p>

      <p class="bday-wish">${wishLines}</p>

      <button class="bday-close" id="bdayClose">
        open your surprise ♥
      </button>
    </div>
  `;
  document.body.appendChild(el);
}

/* ── Float balloons up from the bottom ── */
function launchBalloons() {
  const EMOJIS = ['🎈','🎈','🎀','🎁','🎊','🎉'];
  let count = 0;

  const interval = setInterval(() => {
    const balloon     = document.createElement('div');
    balloon.classList.add('balloon');
    balloon.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

    const duration = 4500 + Math.random() * 4000;
    const sway     = (Math.random() - 0.5) * 40;

    balloon.style.cssText = `
      left: ${5 + Math.random() * 90}vw;
      animation-duration: ${duration}ms;
      animation-delay: ${Math.random() * 2000}ms;
      --sway: ${sway}deg;
      font-size: ${2 + Math.random() * 2}rem;
    `;

    document.getElementById('birthdayOverlay')?.appendChild(balloon);
    setTimeout(() => balloon.remove(), duration + 2500);

    count++;
    if (count >= 28) clearInterval(interval);
  }, 180);
}

/* ── Shooting stars across the dark background ── */
function launchShootingStars() {
  let count = 0;
  const interval = setInterval(() => {
    const star = document.createElement('div');
    star.classList.add('bday-shoot');

    const startX  = Math.random() * 100;
    const startY  = Math.random() * 40;
    const angle   = 20 + Math.random() * 25;
    const dist    = 200 + Math.random() * 300;
    const rad     = (angle * Math.PI) / 180;
    const dur     = 900 + Math.random() * 800;

    star.style.cssText = `
      left: ${startX}vw;
      top:  ${startY}vh;
      --sdx: ${Math.cos(rad) * dist}px;
      --sdy: ${Math.sin(rad) * dist}px;
      animation-duration: ${dur}ms;
      animation-delay: ${Math.random() * 3000}ms;
    `;

    document.getElementById('birthdayOverlay')?.appendChild(star);
    setTimeout(() => star.remove(), dur + 3200);

    count++;
    if (count >= 18) clearInterval(interval);
  }, 350);
}

/* ── Star burst from centre on open ── */
function burstStars() {
  const cx = window.innerWidth  / 2;
  const cy = window.innerHeight / 2;
  const CHARS = ['✦','★','✨','💫','⭐'];
  const COLORS = ['#f4a7b9','#e8849a','#ffd6e0','#fff','#c9964a'];

  for (let i = 0; i < 24; i++) {
    const s     = document.createElement('div');
    s.classList.add('bday-star');
    const angle = (i / 24) * Math.PI * 2;
    const dist  = 80 + Math.random() * 180;
    const dur   = 900 + Math.random() * 600;
    const size  = 0.9 + Math.random() * 1.4;

    s.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
    s.style.cssText = `
      left: ${cx}px;
      top:  ${cy}px;
      color: ${COLORS[Math.floor(Math.random() * COLORS.length)]};
      --tx: ${Math.cos(angle) * dist}px;
      --ty: ${Math.sin(angle) * dist}px;
      --sz: ${size}rem;
      animation-duration: ${dur}ms;
      animation-delay: ${Math.random() * 400}ms;
    `;
    document.getElementById('birthdayOverlay')?.appendChild(s);
    setTimeout(() => s.remove(), dur + 500);
  }
}

/* ── Main: show the birthday overlay ── */
function showBirthdayOverlay() {
  injectBirthdayStyles();
  createBirthdayOverlay();

  // Fade in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.getElementById('birthdayOverlay').classList.add('visible');
    });
  });

  // Fire all effects with staggered timing
  setTimeout(launchBalloons,     400);
  setTimeout(launchShootingStars,600);
  setTimeout(burstStars,         800);
  setTimeout(launchConfetti,    1200);

  // Close button
  document.getElementById('bdayClose').addEventListener('click', () => {
    const overlay = document.getElementById('birthdayOverlay');
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.remove(), 1400);
  });
}

/* ── Check if today is her birthday ── */
function checkBirthday() {
  const today = new Date();
  if (
    today.getDate()    === BIRTHDAY_CONFIG.BIRTH_DAY &&
    today.getMonth()+1 === BIRTHDAY_CONFIG.BIRTH_MONTH
  ) {
    setTimeout(showBirthdayOverlay, 1500);
  }
}
