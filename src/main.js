import "./style.css";
import { t } from "./i18n.js";

const baseline = new URLSearchParams(location.search).get("baseline") === "1";
document.documentElement.classList.toggle("rb-baseline", baseline);
const app = document.querySelector("#app");
app.innerHTML = `
  <section class="rb-stage" aria-label="${t("title")}">
    <div class="rb-world" aria-hidden="true">
      <i class="rb-target rb-target--top" data-edge="top"></i>
      <i class="rb-target rb-target--right" data-edge="right"></i>
      <i class="rb-target rb-target--bottom" data-edge="bottom"></i>
      <i class="rb-target rb-target--left" data-edge="left"></i>
    </div>
    <div class="rb-ui">
      <header class="rb-heading"><span>${t("eyebrow")}</span><h1>${t("title")}</h1></header>
      <div class="rb-progress" aria-live="polite">0 / 4</div>
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
}

class RecoilBloom {
  constructor() {
    this.projectiles = [];
    this.particles = [];
    this.spatters = [];
    this.hitEdges = new Set();
    this.hue = Math.random() * 360;
    this.pointerId = null;
    this.shootTimer = null;
    this.running = true;
    this.player = new Player({ x: innerWidth / 2, y: innerHeight / 2 });
    this.bind();
    this.animate();
  }

  bind() {
    stage.addEventListener("pointermove", (event) => {
      this.player.lookAt(event.clientX, event.clientY);
    });
    stage.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button") || this.pointerId !== null || !this.running) return;
      this.pointerId = event.pointerId;
      stage.setPointerCapture?.(event.pointerId);
      this.player.lookAt(event.clientX, event.clientY);
      stage.classList.add("shooting");
      hint.classList.add("is-gone");
      this.shoot();
      this.shootTimer = window.setInterval(() => this.shoot(), 54);
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
    this.player.recoil(1.55);
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
      this.markEdge(edge, projectile.color);
      projectile.destroy();
      this.projectiles.splice(i, 1);
    }
  }

  markEdge(edge, color) {
    if (this.hitEdges.has(edge)) return;
    this.hitEdges.add(edge);
    const target = targets.get(edge);
    target.style.setProperty("--target-color", color);
    target.classList.add("is-hit");
    progress.textContent = `${this.hitEdges.size} / 4`;
    progress.setAttribute("aria-label", t("progress", this.hitEdges.size));
    if (navigator.vibrate) navigator.vibrate(16);
    if (this.hitEdges.size === 4) this.finish();
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
    clearInterval(this.shootTimer);
    stage.classList.remove("shooting");
    stage.classList.add("is-complete");
    completion.classList.add("is-visible");
    replay.hidden = false;
    if (navigator.vibrate) navigator.vibrate([24, 40, 48]);
  }

  reset() {
    [...this.projectiles, ...this.particles.map((item) => item.particle), ...this.spatters].forEach((item) => item.destroy());
    this.projectiles = [];
    this.particles = [];
    this.spatters = [];
    this.hitEdges.clear();
    targets.forEach((target) => target.classList.remove("is-hit"));
    this.player.position = { x: innerWidth / 2, y: innerHeight / 2 };
    this.player.velocity = { x: 0, y: 0 };
    this.hue = Math.random() * 360;
    progress.textContent = "0 / 4";
    completion.classList.remove("is-visible");
    replay.hidden = true;
    stage.classList.remove("is-complete");
    this.running = true;
  }

  animate() {
    if (!document.hidden) {
      this.hue = (this.hue + 1) % 360;
      stage.style.setProperty("--ch", this.hue);
      this.player.update();
      this.updateProjectiles();
      this.updateParticles();
    }
    requestAnimationFrame(() => this.animate());
  }
}

new RecoilBloom();
