class RecoilAudio {
  constructor() {
    this.context = null;
    this.lastShotAt = 0;
    this.lastMissAt = 0;
  }

  unlock() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext || new URLSearchParams(location.search).get("mute") === "1") return null;
    if (!this.context) this.context = new AudioContext();
    if (this.context.state === "suspended") this.context.resume().catch(() => {});
    return this.context;
  }

  tone(frequency, duration, gain = .03, type = "sine", slide = 1, delay = 0) {
    const context = this.context;
    if (!context) return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(28, frequency * slide), start + duration);
    volume.gain.setValueAtTime(.0001, start);
    volume.gain.exponentialRampToValueAtTime(gain, start + .006);
    volume.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(volume).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + .02);
  }

  shot() {
    const now = performance.now();
    if (!this.context || now - this.lastShotAt < 76) return;
    this.lastShotAt = now;
    this.tone(150, .065, .018, "square", .42);
  }

  edge(edge) {
    const frequency = { top: 659, right: 784, bottom: 523, left: 587 }[edge] || 587;
    this.tone(frequency, .16, .045, "triangle", 1.35);
    this.tone(frequency / 2, .11, .024, "sine", .72, .018);
  }

  miss() {
    const now = performance.now();
    if (!this.context || now - this.lastMissAt < 180) return;
    this.lastMissAt = now;
    this.tone(92, .07, .015, "sine", .67);
  }

  complete() {
    [392, 523, 659, 784].forEach((frequency, index) => {
      this.tone(frequency, .32, .038, "triangle", 1.05, index * .055);
    });
  }

  reset() {
    this.tone(420, .12, .025, "sine", .55);
  }
}

export const recoilAudio = new RecoilAudio();
