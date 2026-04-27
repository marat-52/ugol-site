/* ============================================================
   BIRCH COAL — JAVASCRIPT v2
   ============================================================ */

'use strict';

/* ─── SMOOTH SCROLL WITH NAV OFFSET ─── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const navH = document.getElementById('navbar').offsetHeight;
    const top = target.getBoundingClientRect().top + window.scrollY - navH;
    window.scrollTo({ top, behavior: 'smooth' });
    document.getElementById('navLinks').classList.remove('open');
    document.getElementById('burger').classList.remove('active');
  });
});

/* ─── NAVBAR SCROLL STYLE ─── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ─── MOBILE BURGER ─── */
const burger   = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');

burger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  burger.classList.toggle('active', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

document.addEventListener('click', e => {
  if (!navbar.contains(e.target) && navLinks.classList.contains('open')) {
    navLinks.classList.remove('open');
    burger.classList.remove('active');
    document.body.style.overflow = '';
  }
});

/* ─── SCROLL REVEAL ─── */
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });
revealEls.forEach(el => revealObserver.observe(el));

/* ─── COUNTER ANIMATION ─── */
function animateCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = +el.dataset.target;
    const duration = 1800;
    const step = 16;
    const increment = target / (duration / step);
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = Math.floor(current).toLocaleString('ru');
    }, step);
  });
}

const heroStats = document.querySelector('.hero-stats');
let countersStarted = false;
if (heroStats) {
  const counterObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !countersStarted) {
      countersStarted = true;
      animateCounters();
    }
  }, { threshold: 0.4 });
  counterObserver.observe(heroStats);
}

/* ─── SPARK PARTICLES ─── */
(function initSparks() {
  const canvas = document.getElementById('sparksCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  const sparks = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  const COLORS = ['#e8420a','#ff6030','#f5c842','#ffaa20','#ff8040'];

  class Spark {
    constructor() { this.reset(); }
    reset() {
      this.x      = W * 0.5 + Math.random() * W * 0.5;
      this.y      = H * 0.75 + Math.random() * H * 0.2;
      this.vx     = (Math.random() - 0.55) * 0.9;
      this.vy     = -(Math.random() * 2.2 + 0.8);
      this.life   = 1;
      this.decay  = 0.005 + Math.random() * 0.012;
      this.radius = Math.random() * 2.2 + 0.6;
      this.color  = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.trail  = [];
      this.maxTrail = Math.floor(Math.random() * 8 + 4);
      this.wobble   = (Math.random() - 0.5) * 0.12;
    }
    update() {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > this.maxTrail) this.trail.shift();
      this.x += this.vx + Math.sin(this.life * 12) * this.wobble;
      this.y += this.vy;
      this.vy *= 0.995;
      this.life -= this.decay;
    }
    draw() {
      if (this.life <= 0) return;
      for (let i = 0; i < this.trail.length; i++) {
        const t = i / this.trail.length;
        ctx.beginPath();
        ctx.arc(this.trail[i].x, this.trail[i].y, this.radius * t * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,100,20,${this.life * t * 0.35})`;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * this.life, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
      g.addColorStop(0, this.color);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.globalAlpha = this.life * 0.9;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  for (let i = 0; i < 60; i++) {
    const s = new Spark();
    s.life = Math.random();
    sparks.push(s);
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    sparks.forEach(s => { s.update(); s.draw(); if (s.life <= 0) s.reset(); });
    requestAnimationFrame(tick);
  }
  tick();
})();

/* ─── PHONE MASK ─── */
const phoneInput = document.getElementById('phone');
if (phoneInput) {
  phoneInput.addEventListener('input', function () {
    let val = this.value.replace(/\D/g, '');
    if (val.startsWith('8')) val = '7' + val.slice(1);
    if (!val.startsWith('7')) val = '7' + val;
    val = val.slice(0, 11);
    let f = '+7';
    if (val.length > 1)  f += ' (' + val.slice(1, 4);
    if (val.length >= 4) f += ') ' + val.slice(4, 7);
    if (val.length >= 7) f += '-' + val.slice(7, 9);
    if (val.length >= 9) f += '-' + val.slice(9, 11);
    this.value = f;
  });
  phoneInput.addEventListener('keydown', function (e) {
    if (e.key === 'Backspace' && this.value === '+7') e.preventDefault();
  });
  phoneInput.addEventListener('focus', function () {
    if (!this.value) this.value = '+7 ';
  });
}

/* ─── FORM VALIDATION ─── */
function showError(fieldId, msg) {
  const el  = document.getElementById(fieldId);
  const err = document.getElementById('err-' + fieldId);
  if (el)  el.classList.add('invalid');
  if (err) err.textContent = msg;
}

function clearError(fieldId) {
  const el  = document.getElementById(fieldId);
  const err = document.getElementById('err-' + fieldId);
  if (el)  el.classList.remove('invalid');
  if (err) err.textContent = '';
}

function validateForm() {
  let valid = true;
  ['fname', 'phone', 'email'].forEach(clearError);

  const fname = document.getElementById('fname').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();

  if (!fname) { showError('fname', 'Пожалуйста, введите ваше имя'); valid = false; }

  const phoneClear = phone.replace(/\D/g, '');
  const emailOk    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (phoneClear.length < 11 && !emailOk) {
    if (phoneClear.length < 11) showError('phone', 'Введите корректный номер телефона');
    if (email && !emailOk)      showError('email', 'Введите корректный email');
    if (!phone && !email)       showError('phone', 'Укажите телефон или email');
    valid = false;
  } else if (email && !emailOk) {
    showError('email', 'Введите корректный email');
    valid = false;
  }

  return valid;
}

['fname', 'phone', 'email'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('blur', () => {
    clearError(id);
    if (id === 'fname' && !el.value.trim()) showError('fname', 'Пожалуйста, введите ваше имя');
    if (id === 'email' && el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)) {
      showError('email', 'Введите корректный email');
    }
  });
  el.addEventListener('input', () => clearError(id));
});

/* ─── FORM SUBMIT → submit.php ─── */
const form         = document.getElementById('orderForm');
const successBlock = document.getElementById('formSuccess');
const successName  = document.getElementById('successName');
const resetBtn     = document.getElementById('resetForm');
const apiError     = document.getElementById('formApiError');
const submitBtn    = document.getElementById('submitBtn');

if (form) {
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!validateForm()) return;

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    if (apiError) { apiError.textContent = ''; apiError.classList.remove('visible'); }

    const formData = new FormData(form);

    try {
      const res  = await fetch('submit.php', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.ok) {
        const firstName = document.getElementById('fname').value.trim().split(' ')[0];
        if (successName) successName.textContent = firstName;
        form.classList.add('hidden');
        successBlock.classList.add('visible');
        const navH = document.getElementById('navbar').offsetHeight;
        const top  = successBlock.getBoundingClientRect().top + window.scrollY - navH - 20;
        window.scrollTo({ top, behavior: 'smooth' });
      } else {
        if (data.errors) Object.entries(data.errors).forEach(([f, m]) => showError(f, m));
        if (data.error && apiError) { apiError.textContent = data.error; apiError.classList.add('visible'); }
      }
    } catch (err) {
      console.error(err);
      if (apiError) {
        apiError.textContent = 'Ошибка соединения. Проверьте интернет и попробуйте снова.';
        apiError.classList.add('visible');
      }
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });
}

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    form.reset();
    form.classList.remove('hidden');
    successBlock.classList.remove('visible');
    ['fname', 'phone', 'email'].forEach(clearError);
  });
}
