const state = {
  targetDate: null,
  themeColor: '#ff4757',
  greeting: '',
  countdownInterval: null,
  animationFrame: null,
  particles: [],
  isCelebrating: false
};

const elements = {
  setupView: document.getElementById('setup-view'),
  countdownView: document.getElementById('countdown-view'),
  setupForm: document.getElementById('setup-form'),
  targetDateInput: document.getElementById('target-date'),
  targetTimeInput: document.getElementById('target-time'),
  themeColorInput: document.getElementById('theme-color'),
  greetingInput: document.getElementById('greeting'),
  presetColors: document.querySelectorAll('.preset-color'),
  quickButtons: document.querySelectorAll('.quick-btn'),
  startBtn: document.querySelector('.start-btn'),
  greetingDisplay: document.getElementById('greeting-display'),
  daysEl: document.getElementById('days'),
  hoursEl: document.getElementById('hours'),
  minutesEl: document.getElementById('minutes'),
  secondsEl: document.getElementById('seconds'),
  targetDisplay: document.getElementById('target-display'),
  backBtn: document.getElementById('back-btn'),
  restartBtn: document.getElementById('restart-btn'),
  setupErrorMessage: document.getElementById('setup-error-message'),
  countdownErrorMessage: document.getElementById('error-message'),
  countdownContent: document.getElementById('countdown-content'),
  celebrationView: document.getElementById('celebration-view'),
  celebrationTitle: document.getElementById('celebration-title'),
  confettiContainer: document.getElementById('confetti-container'),
  bgCanvas: document.getElementById('bg-canvas')
};

const bgCtx = elements.bgCanvas.getContext('2d');

function init() {
  setMinDate();
  setupEventListeners();
  initCanvas();
  startBackgroundAnimation();
}

function setMinDate() {
  const today = new Date().toISOString().split('T')[0];
  elements.targetDateInput.min = today;
}

function setupEventListeners() {
  elements.setupForm.addEventListener('submit', handleFormSubmit);

  elements.themeColorInput.addEventListener('input', (e) => {
    updateThemeColor(e.target.value);
  });

  elements.presetColors.forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.dataset.color;
      updateThemeColor(color);
    });
  });

  elements.quickButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const date = btn.dataset.date;
      const color = btn.dataset.color;
      const greeting = btn.dataset.greeting;

      elements.targetDateInput.value = date;
      elements.themeColorInput.value = color;
      elements.greetingInput.value = greeting;
      updateThemeColor(color);
    });
  });

  elements.backBtn.addEventListener('click', goToSetup);
  elements.restartBtn.addEventListener('click', goToSetup);

  window.addEventListener('resize', initCanvas);
}

function updateThemeColor(color) {
  state.themeColor = color;
  document.documentElement.style.setProperty('--theme-color', color);
  document.documentElement.style.setProperty('--theme-color-light', lightenColor(color, 20));
  document.documentElement.style.setProperty('--theme-color-dark', darkenColor(color, 20));
  elements.themeColorInput.value = color;

  elements.presetColors.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === color);
  });
}

function lightenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function darkenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function handleFormSubmit(e) {
  e.preventDefault();

  const dateValue = elements.targetDateInput.value;
  const timeValue = elements.targetTimeInput.value;
  const greeting = elements.greetingInput.value.trim();

  if (!dateValue || !timeValue || !greeting) {
    showError('请填写完整信息', '请确保目标日期、时间和祝福短句都已填写。');
    return;
  }

  const targetDateTime = `${dateValue}T${timeValue}`;
  const targetDate = new Date(targetDateTime);
  const now = new Date();

  if (isNaN(targetDate.getTime())) {
    showError('系统时间无效', '无法解析您输入的日期和时间，请检查后重试。');
    return;
  }

  if (isNaN(now.getTime())) {
    showError('系统时间无效', '检测到系统时间异常，请检查您的设备时间设置。');
    return;
  }

  if (targetDate <= now) {
    showError('目标时间已过期', '您选择的时间已经过去了，请选择一个未来的时间。');
    return;
  }

  hideError();
  state.targetDate = targetDate;
  state.greeting = greeting;

  startCountdown();
  showCountdownView();
}

function getActiveErrorMessage() {
  if (elements.setupView.classList.contains('active')) {
    return elements.setupErrorMessage;
  }
  return elements.countdownErrorMessage;
}

function showError(title, description) {
  const errorMessage = getActiveErrorMessage();
  errorMessage.classList.remove('hidden');
  errorMessage.innerHTML = `
    <div class="error-icon">⚠️</div>
    <div class="error-title">${title}</div>
    <div class="error-desc">${description}</div>
  `;
}

function hideError() {
  elements.setupErrorMessage.classList.add('hidden');
  elements.setupErrorMessage.innerHTML = '';
  elements.countdownErrorMessage.classList.add('hidden');
  elements.countdownErrorMessage.innerHTML = '';
}

function showCountdownView() {
  elements.setupView.classList.remove('active');
  elements.countdownView.classList.add('active');
  elements.greetingDisplay.textContent = state.greeting;
  elements.targetDisplay.textContent = `目标时间：${formatFullDate(state.targetDate)}`;
}

function goToSetup() {
  stopCountdown();
  stopCelebration();
  hideError();
  elements.countdownView.classList.remove('active');
  elements.setupView.classList.add('active');
  elements.celebrationView.classList.add('hidden');
  elements.countdownContent.classList.remove('hidden');
  state.isCelebrating = false;
  setMinDate();
}

function startCountdown() {
  updateCountdown();
  state.countdownInterval = setInterval(updateCountdown, 1000);
}

function stopCountdown() {
  if (state.countdownInterval) {
    clearInterval(state.countdownInterval);
    state.countdownInterval = null;
  }
}

function updateCountdown() {
  const now = new Date();
  const diff = state.targetDate - now;

  if (isNaN(now.getTime())) {
    showError('系统时间无效', '检测到系统时间异常，请检查您的设备时间设置。');
    stopCountdown();
    return;
  }

  if (diff <= 0) {
    elements.daysEl.textContent = '00';
    elements.hoursEl.textContent = '00';
    elements.minutesEl.textContent = '00';
    elements.secondsEl.textContent = '00';
    stopCountdown();
    startCelebration();
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  elements.daysEl.textContent = String(days).padStart(2, '0');
  elements.hoursEl.textContent = String(hours).padStart(2, '0');
  elements.minutesEl.textContent = String(minutes).padStart(2, '0');
  elements.secondsEl.textContent = String(seconds).padStart(2, '0');
}

function formatFullDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}

function initCanvas() {
  elements.bgCanvas.width = window.innerWidth;
  elements.bgCanvas.height = window.innerHeight;
}

function startBackgroundAnimation() {
  createParticles();
  animateBackground();
}

function createParticles() {
  state.particles = [];
  const particleCount = Math.min(50, Math.floor(window.innerWidth / 30));

  for (let i = 0; i < particleCount; i++) {
    state.particles.push({
      x: Math.random() * elements.bgCanvas.width,
      y: Math.random() * elements.bgCanvas.height,
      size: Math.random() * 4 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      pulsePhase: Math.random() * Math.PI * 2
    });
  }
}

function animateBackground() {
  const canvas = elements.bgCanvas;
  const ctx = bgCtx;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, canvas.width / 2
  );
  gradient.addColorStop(0, hexToRgba(state.themeColor, 0.05));
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const time = Date.now() * 0.001;

  state.particles.forEach(particle => {
    particle.x += particle.speedX;
    particle.y += particle.speedY;

    if (particle.x < 0) particle.x = canvas.width;
    if (particle.x > canvas.width) particle.x = 0;
    if (particle.y < 0) particle.y = canvas.height;
    if (particle.y > canvas.height) particle.y = 0;

    const pulse = Math.sin(time * particle.pulseSpeed * 100 + particle.pulsePhase) * 0.3 + 0.7;
    const currentOpacity = particle.opacity * pulse;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(state.themeColor, currentOpacity);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(state.themeColor, currentOpacity * 0.2);
    ctx.fill();
  });

  state.particles.forEach((p1, i) => {
    state.particles.slice(i + 1).forEach(p2 => {
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 100) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = hexToRgba(state.themeColor, 0.1 * (1 - dist / 100));
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
  });

  state.animationFrame = requestAnimationFrame(animateBackground);
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function startCelebration() {
  if (state.isCelebrating) return;
  state.isCelebrating = true;

  elements.countdownContent.classList.add('hidden');
  elements.celebrationView.classList.remove('hidden');
  elements.celebrationTitle.textContent = state.greeting;

  launchConfetti();

  const confettiInterval = setInterval(() => {
    if (state.isCelebrating) {
      launchConfetti();
    } else {
      clearInterval(confettiInterval);
    }
  }, 800);
}

function stopCelebration() {
  state.isCelebrating = false;
  elements.confettiContainer.innerHTML = '';
}

function launchConfetti() {
  const colors = [
    state.themeColor,
    lightenColor(state.themeColor, 30),
    darkenColor(state.themeColor, 20),
    '#ffffff',
    lightenColor(state.themeColor, 50)
  ];

  const confettiCount = 30;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';

    const isCircle = Math.random() > 0.5;
    const size = Math.random() * 8 + 6;
    const left = Math.random() * 100;
    const delay = Math.random() * 0.5;
    const duration = Math.random() * 2 + 2;
    const color = colors[Math.floor(Math.random() * colors.length)];

    confetti.style.left = `${left}%`;
    confetti.style.width = `${size}px`;
    confetti.style.height = `${isCircle ? size : size * 1.5}px`;
    confetti.style.backgroundColor = color;
    confetti.style.borderRadius = isCircle ? '50%' : '2px';
    confetti.style.animationDuration = `${duration}s`;
    confetti.style.animationDelay = `${delay}s`;

    elements.confettiContainer.appendChild(confetti);

    setTimeout(() => {
      confetti.remove();
    }, (duration + delay) * 1000);
  }
}

document.addEventListener('DOMContentLoaded', init);
