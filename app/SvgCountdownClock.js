class SvgCountdownClock {
  constructor(options = {}) {

    const opts = options || {};
    this.size = opts.size || 24;
    this.strokeWidth = opts.strokeWidth || 3;
    this.durationMs = opts.durationMs || 3500;
    this.color = opts.color || 'currentColor';
    this.onComplete = typeof opts.onComplete === 'function' ? opts.onComplete : null;
    this.onPause = typeof opts.onPause === 'function' ? opts.onPause : null;

    this.animFrameId = null;
    this.startTime = null;
    this.pausedElapsed = 0;
    this.isRunning = false;
    this.isPaused = false;

    const center = this.size / 2;
    const radius = Math.max(1, center - (this.strokeWidth / 2));
    this.circumference = 2 * Math.PI * radius;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', String(this.size));
    svg.setAttribute('height', String(this.size));
    svg.setAttribute('viewBox', `0 0 ${this.size} ${this.size}`);
    svg.style.cssText = 'transform: rotate(-90deg); flex-shrink: 0; vertical-align: middle; cursor: pointer;';

    const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgCircle.setAttribute('cx', String(center));
    bgCircle.setAttribute('cy', String(center));
    bgCircle.setAttribute('r', String(radius));
    bgCircle.setAttribute('fill', 'none');
    bgCircle.setAttribute('stroke', 'rgba(255, 255, 255, 0.18)');
    bgCircle.setAttribute('stroke-width', String(this.strokeWidth));

    const fgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    fgCircle.setAttribute('cx', String(center));
    fgCircle.setAttribute('cy', String(center));
    fgCircle.setAttribute('r', String(radius));
    fgCircle.setAttribute('fill', 'none');
    fgCircle.setAttribute('stroke', this.color);
    fgCircle.setAttribute('stroke-width', String(this.strokeWidth));
    fgCircle.setAttribute('stroke-dasharray', String(this.circumference));
    fgCircle.setAttribute('stroke-dashoffset', '0');
    fgCircle.setAttribute('stroke-linecap', 'round');

    svg.appendChild(bgCircle);
    svg.appendChild(fgCircle);

    this.element = svg;
    this.fgCircle = fgCircle;

  }

  start() {

    if (this.isRunning && !this.isPaused) return;

    this.isRunning = true;
    this.isPaused = false;
    this.startTime = performance.now() - this.pausedElapsed;

    const tick = (now) => {
      if (!this.isRunning || this.isPaused) return;

      const elapsed = now - this.startTime;
      const progress = Math.min(1, elapsed / this.durationMs);
      const offset = this.circumference * progress;

      if (this.fgCircle) {
        this.fgCircle.setAttribute('stroke-dashoffset', String(offset));
      }

      if (progress < 1) {
        if (typeof requestAnimationFrame !== 'undefined') {
          this.animFrameId = requestAnimationFrame(tick);
        } else {
          this.animFrameId = setTimeout(() => tick(performance.now()), 16);
        }
      } else {
        this.isRunning = false;
        this.animFrameId = null;
        if (this.onComplete) this.onComplete();
      }
    };

    if (typeof requestAnimationFrame !== 'undefined') {
      this.animFrameId = requestAnimationFrame(tick);
    } else {
      this.animFrameId = setTimeout(() => tick(performance.now()), 16);
    }

  }
  pause() {

    if (!this.isRunning || this.isPaused) return;

    this.isPaused = true;
    if (this.animFrameId) {
      if (typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.animFrameId);
      } else {
        clearTimeout(this.animFrameId);
      }
      this.animFrameId = null;
    }
    this.pausedElapsed = performance.now() - this.startTime;
    if (this.onPause) this.onPause();

  }
  stop() {

    this.isRunning = false;
    this.isPaused = false;
    if (this.animFrameId) {
      if (typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.animFrameId);
      } else {
        clearTimeout(this.animFrameId);
      }
      this.animFrameId = null;
    }
    this.pausedElapsed = 0;
    if (this.fgCircle) {
      this.fgCircle.setAttribute('stroke-dashoffset', '0');
    }

  }
  reset() {

    this.stop();
    this.start();

  }
}

globalThis.SvgCountdownClock = SvgCountdownClock;
if (typeof module !== "undefined" && module.exports) module.exports = SvgCountdownClock;