import "./style.css";
import { t } from "./i18n.js";
import { recoilAudio } from "./audio.js";

const baseline = new URLSearchParams(location.search).get("baseline") === "1";
document.documentElement.classList.toggle("rb-baseline", baseline);
const app = document.querySelector("#app");
app.innerHTML = `
  <section class="rb-stage" aria-label="${t("title")}">
    <div class="rb-world" aria-hidden="true">
      <i class="rb-tether"></i>
      <i class="rb-target rb-target--top" data-edge="top"></i>
      <i class="rb-target rb-target--right" data-edge="right"></i>
      <i class="rb-target rb-target--bottom" data-edge="bottom"></i>
      <i class="rb-target rb-target--left" data-edge="left"></i>
    </div>
    <div class="rb-ui">
      <header class="rb-heading"><span>${t("eyebrow")}</span><h1>${t("title")}</h1></header>
      <div class="rb-progress" aria-live="polite">0 / 6</div>
      <div class="rb-hint"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 11V5.5a1.5 1.5 0 0 1 3 0V10h.8V4.5a1.5 1.5 0 0 1 3 0V10h.8V6a1.5 1.5 0 0 1 3 0v7.5c0 4.2-2.5 7.5-7 7.5-2.3 0-4.1-.9-5.6-2.7L4 14.2a1.6 1.6 0 0 1 2.4-2.1L9.5 15v-4z"/></svg>${t("hint")}</div>
      <div class="rb-complete">${t("complete")}</div>
      <button class="rb-replay" type="button" aria-label="${t("replay")}" hidden><svg viewBox="0 0 24 24"><path d="M4.5 8.5V4m0 0H9M4.5 4l3.1 3.1A7.2 7.2 0 1 1 5 13"/></svg></button>
    </div>
    <div class="rb-error" hidden>${t("error")}</div>
  </section>`;

const stage = app.querySelector(".rb-stage");
const world = app.querySelector(".rb-world");
const progress = app.querySelector(".rb-progress");
const hint = app.querySelector(".rb-hint");
const completion = app.querySelector(".rb-complete");
const replay = app.querySelector(".rb-replay");
const tether = app.querySelector(".rb-tether");
const targets = new Map([...app.querySelectorAll(".rb-target")].map((el) => [el.dataset.edge, el]));

if (!window.PointerEvent) app.querySelector(".rb-error").hidden = false;

class GameObject {
  constructor({ x = 0, y = 0, rotation = 0, className = "gameObject", color = "#fff" }) {
    this.element = document.createElement("div");
    this.element.classList.add(className);
    world.appendChild(this.element);
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };
    this.rotation = rotation;
    this.color = color;
    this.random = Math.random();
  }

  update({ bounce = true } = {}) {
    this.velocity.x *= 0.98;
    this.velocity.y *= 0.98;
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    if (bounce) {
      if (this.position.x < 0) { this.position.x = 0; this.velocity.x *= -0.5; }
      if (this.position.x > innerWidth) { this.position.x = innerWidth; this.velocity.x *= -0.5; }
      if (this.position.y < 0) { this.position.y = 0; this.velocity.y *= -0.5; }
      if (this.position.y > innerHeight) { this.position.y = innerHeight; this.velocity.y *= -0.5; }
    }
    this.render();
  }

  render() {
    this.element.style.setProperty("--x", `${this.position.x}px`);
    this.element.style.setProperty("--y", `${this.position.y}px`);
    this.element.style.setProperty("--r", `${this.rotation}deg`);
    this.element.style.setProperty("--c", this.color);
    this.element.style.setProperty("--rnd", this.random);
  }
  destroy() { this.element.remove(); }
  getDistance(x, y) { return Math.hypot(this.position.x - x, this.position.y - y); }
}

class Player extends GameObject {
  constructor(config) { super({ ...config, className: "player" }); }
  lookAt(x, y) {
    const dx = x - this.position.x;
    const dy = y - this.position.y;
    this.rotation = (Math.atan2(dy, dx) * 180 / Math.PI + 450) % 360;
  }
  recoil(force) {
    const angle = (this.rotation - 90) * Math.PI / 180;
    this.velocity.x -= Math.cos(angle) * force;
    this.velocity.y -= Math.sin(angle) * force;
  }
  integrate(isShooting) {
    const centerX = innerWidth / 2;
    const centerY = innerHeight / 2;
    const spring = isShooting ? 0.0016 : 0.0048;
    const damping = isShooting ? 0.94 : 0.88;
    this.velocity.x += (centerX - this.position.x) * spring;
    this.velocity.y += (centerY - this.position.y) * spring;
    this.velocity.x *= damping;
    this.velocity.y *= damping;
    const speed = Math.hypot(this.velocity.x, this.velocity.y);
    if (speed > 7) {
      this.velocity.x = this.velocity.x / speed * 7;
      this.velocity.y = this.velocity.y / speed * 7;
    }
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    const margin = 24;
    if (this.position.x < margin) { this.position.x = margin; this.velocity.x = Math.abs(this.velocity.x) * 0.58; }
    if (this.position.x > innerWidth - margin) { this.position.x = innerWidth - margin; this.velocity.x = -Math.abs(this.velocity.x) * 0.58; }
    if (this.position.y < margin) { this.position.y = margin; this.velocity.y = Math.abs(this.velocity.y) * 0.58; }
    if (this.position.y > innerHeight - margin) { this.position.y = innerHeight - margin; this.velocity.y = -Math.abs(this.velocity.y) * 0.58; }
    this.render();
  }
}

class RecoilBloom {
  constructor() {
    this.projectiles = [];
    this.particles = [];
    this.spatters = [];
    this.hitEdges = new Set();
    this.course = [];
    this.courseIndex = 0;
    this.targetLocked = false;
    this.targetTimer = null;
    this.hue = Math.random() * 360;
    this.pointerId = null;
    this.shootTimer = null;
    this.running = true;
    this.player = new Player({ x: innerWidth / 2, y: innerHeight / 2 });
    this.setupCourse();
    this.bind();
    this.animate();
  }

  bind() {
    stage.addEventListener("pointermove", (event) => {
      this.player.lookAt(event.clientX, event.clientY);
    });
    stage.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button") || this.pointerId !== null || !this.running) return;
      recoilAudio.unlock();
      this.pointerId = event.pointerId;
      stage.setPointerCapture?.(event.pointerId);
      this.player.lookAt(event.clientX, event.clientY);
      stage.classList.add("shooting");
      hint.classList.add("is-gone");
      this.shoot();
      this.shootTimer = window.setInterval(() => this.shoot(), baseline ? 54 : 82);
    });
    const release = (event) => {
      if (event.pointerId !== this.pointerId) return;
      this.pointerId = null;
      clearInterval(this.shootTimer);
      stage.classList.remove("shooting");
    };
    stage.addEventListener("pointerup", release);
    stage.addEventListener("pointercancel", release);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearInterval(this.shootTimer);
        this.pointerId = null;
        stage.classList.remove("shooting");
      }
    });
    replay.addEventListener("click", () => this.reset());
  }

  shoot() {
    recoilAudio.shot();
    this.player.recoil(baseline ? 1.55 : 0.82);
    const projectile = new GameObject({
      x: this.player.position.x,
      y: this.player.position.y,
      rotation: this.player.rotation,
      className: "projectile",
      color: `lch(100 60 ${this.hue})`,
    });
    const angle = (projectile.rotation - 90) * Math.PI / 180;
    projectile.velocity.x = Math.cos(angle) * 25;
    projectile.velocity.y = Math.sin(angle) * 25;
    this.projectiles.push(projectile);
  }

  updateProjectiles() {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      const angle = (projectile.rotation - 90) * Math.PI / 180;
      projectile.position.x += Math.cos(angle) * 25;
      projectile.position.y += Math.sin(angle) * 25;
      projectile.update({ bounce: false });
      const edge = projectile.position.y <= 0 ? "top"
        : projectile.position.x >= innerWidth ? "right"
        : projectile.position.y >= innerHeight ? "bottom"
        : projectile.position.x <= 0 ? "left" : null;
      if (!edge) continue;
      this.explode(projectile);
      if (!baseline) this.checkTarget(edge, projectile, projectile.color);
      projectile.destroy();
      this.projectiles.splice(i, 1);
    }
  }

  setupCourse() {
    const alongFor = (edge) => edge === "left" || edge === "right"
      ? 0.32 + Math.random() * 0.4
      : 0.22 + Math.random() * 0.56;
    const firstLap = ["top", "right", "bottom", "left"];
    for (let i = firstLap.length - 1; i > 0; i--) {
      const swap = Math.floor(Math.random() * (i + 1));
      [firstLap[i], firstLap[swap]] = [firstLap[swap], firstLap[i]];
    }
    const course = firstLap.map((edge) => ({ edge, along: alongFor(edge) }));
    while (course.length < 6) {
      const candidates = ["top", "right", "bottom", "left"].filter((edge) => edge !== course.at(-1).edge);
      course.push({
        edge: candidates[Math.floor(Math.random() * candidates.length)],
        along: 0,
      });
      course.at(-1).along = alongFor(course.at(-1).edge);
    }
    this.course = course;
    this.courseIndex = 0;
    this.targetLocked = false;
    this.activateTarget();
  }

  activateTarget() {
    targets.forEach((target) => {
      target.classList.remove("is-active", "is-hit", "is-missed");
      target.style.removeProperty("--target-color");
    });
    const current = this.course[this.courseIndex];
    if (!current) return;
    const target = targets.get(current.edge);
    target.classList.add("is-active");
    this.targetLocked = false;
  }

  checkTarget(edge, projectile, color) {
    if (this.targetLocked || !this.running) return;
    const current = this.course[this.courseIndex];
    const impact = edge === "top" || edge === "bottom" ? projectile.position.x : projectile.position.y;
    const span = edge === "top" || edge === "bottom" ? innerWidth : innerHeight;
    if (edge !== current.edge || Math.abs(impact - current.along * span) > 58) {
      const target = targets.get(current.edge);
      target.classList.remove("is-missed");
      void target.offsetWidth;
      target.classList.add("is-missed");
      recoilAudio.miss();
      return;
    }
    this.markTarget(edge, color);
  }

  markTarget(edge, color) {
    this.targetLocked = true;
    this.hitEdges.add(edge);
    const target = targets.get(edge);
    target.style.setProperty("--target-color", color);
    target.classList.add("is-hit");
    this.courseIndex += 1;
    progress.textContent = `${this.courseIndex} / 6`;
    progress.setAttribute("aria-label", t("progress", this.courseIndex));
    recoilAudio.edge(edge);
    if (navigator.vibrate) navigator.vibrate(16);
    if (this.courseIndex === this.course.length) {
      this.targetTimer = window.setTimeout(() => this.finish(), 180);
      return;
    }
    this.targetTimer = window.setTimeout(() => this.activateTarget(), 180);
  }

  explode(source) {
    const count = 10 + Math.floor(Math.random() * 20);
    for (let i = 0; i < count; i++) {
      const particle = new GameObject({
        x: source.position.x,
        y: source.position.y,
        rotation: Math.random() * 360,
        className: "particle",
        color: source.color,
      });
      const angle = (particle.rotation - 90) * Math.PI / 180;
      const speed = Math.random() * 3 + 2;
      particle.velocity.x = Math.cos(angle) * speed;
      particle.velocity.y = Math.sin(angle) * speed;
      this.particles.push({ particle, life: 10 + Math.floor(Math.random() * 40) });
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const item = this.particles[i];
      if (item.life < 0) {
        this.spatters.push(item.particle);
        this.particles.splice(i, 1);
        continue;
      }
      const angle = (item.particle.rotation - 90) * Math.PI / 180;
      item.particle.position.x += Math.cos(angle) * 7;
      item.particle.position.y += Math.sin(angle) * 7;
      item.particle.update();
      item.life -= 1;
    }
    for (let i = this.spatters.length - 1; i >= 0; i--) {
      const spatter = this.spatters[i];
      if (this.player.getDistance(spatter.position.x, spatter.position.y) < 50) {
        spatter.destroy();
        this.spatters.splice(i, 1);
      }
    }
  }

  finish() {
    this.running = false;
    this.targetLocked = true;
    clearInterval(this.shootTimer);
    stage.classList.remove("shooting");
    stage.classList.add("is-complete");
    completion.classList.add("is-visible");
    replay.hidden = false;
    recoilAudio.complete();
    if (navigator.vibrate) navigator.vibrate([24, 40, 48]);
  }

  reset() {
    recoilAudio.unlock();
    recoilAudio.reset();
    clearTimeout(this.targetTimer);
    [...this.projectiles, ...this.particles.map((item) => item.particle), ...this.spatters].forEach((item) => item.destroy());
    this.projectiles = [];
    this.particles = [];
    this.spatters = [];
    this.hitEdges.clear();
    this.player.position = { x: innerWidth / 2, y: innerHeight / 2 };
    this.player.velocity = { x: 0, y: 0 };
    this.hue = Math.random() * 360;
    progress.textContent = "0 / 6";
    completion.classList.remove("is-visible");
    replay.hidden = true;
    stage.classList.remove("is-complete");
    this.running = true;
    this.setupCourse();
  }

  updateTether() {
    const centerX = innerWidth / 2;
    const centerY = innerHeight / 2;
    const dx = this.player.position.x - centerX;
    const dy = this.player.position.y - centerY;
    tether.style.setProperty("--length", `${Math.hypot(dx, dy)}px`);
    tether.style.setProperty("--angle", `${Math.atan2(dy, dx)}rad`);
  }

  updateTargetGuide() {
    const current = this.course[this.courseIndex];
    if (!current || this.targetLocked) return;
    const target = targets.get(current.edge);
    const edgeX = current.edge === "left" ? 0
      : current.edge === "right" ? innerWidth
      : current.along * innerWidth;
    const edgeY = current.edge === "top" ? 0
      : current.edge === "bottom" ? innerHeight
      : current.along * innerHeight;
    const dx = this.player.position.x - edgeX;
    const dy = this.player.position.y - edgeY;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const inset = current.edge === "top" ? 210
      : current.edge === "bottom" ? 112
      : 44;
    target.style.left = `${edgeX + dx / distance * inset}px`;
    target.style.top = `${edgeY + dy / distance * inset}px`;
    target.style.right = "auto";
    target.style.bottom = "auto";
  }

  animate() {
    if (!document.hidden) {
      this.hue = (this.hue + 1) % 360;
      stage.style.setProperty("--ch", this.hue);
      if (baseline) {
        this.player.update();
      } else {
        this.player.integrate(this.pointerId !== null && this.running);
        this.updateTether();
        this.updateTargetGuide();
      }
      this.updateProjectiles();
      this.updateParticles();
    }
    requestAnimationFrame(() => this.animate());
  }
}

new RecoilBloom();
