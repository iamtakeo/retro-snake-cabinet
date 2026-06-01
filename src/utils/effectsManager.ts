export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number; // 1 to 0
  decay: number;
  gravity: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number; // 1 to 0
  decay: number;
  vy: number;
  font: string;
}

export interface FlashEffect {
  color: string;
  alpha: number; // 1 to 0
  decay: number;
}

export interface Shockwave {
  x: number;
  y: number;
  r: number;
  maxRadius: number;
  color: string;
  speed: number;
  life: number;
  decay: number;
}

export class EffectsEngine {
  particles: Particle[] = [];
  floatingTexts: FloatingText[] = [];
  shockwaves: Shockwave[] = [];
  flash: FlashEffect | null = null;
  shakeIntensity = 0;
  shakeX = 0;
  shakeY = 0;

  // Trigger high-fps screen shake
  triggerShake(intensity: number) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  // Trigger brief retro screen edge or grid flash
  triggerFlash(color: string, initialAlpha = 0.5, decay = 0.05) {
    this.flash = { color, alpha: initialAlpha, decay };
  }

  // Spawn an expanding glowing neon shockwave ring from game events
  spawnShockwave(gridX: number, gridY: number, cellSize: number, color: string, maxRadius = 140) {
    const startX = (gridX + 0.5) * cellSize;
    const startY = (gridY + 0.5) * cellSize;
    this.shockwaves.push({
      x: startX,
      y: startY,
      r: 8,
      maxRadius,
      color,
      speed: 4.8,
      life: 1.0,
      decay: 0.032
    });
  }

  // Spawn a colorful particle burst at a specific grid coordinate
  spawnBurst(gridX: number, gridY: number, cellSize: number, color: string, count = 12) {
    const startX = (gridX + 0.5) * cellSize;
    const startY = (gridY + 0.5) * cellSize;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      
      this.particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.0, // slight upward bias
        color,
        size: 3 + Math.random() * 4,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.03,
        gravity: 0.12,
      });
    }
  }

  // Spawn retro glowing spark lines (e.g. for golden apple consumption)
  spawnGoldenSparks(gridX: number, gridY: number, cellSize: number) {
    const startX = (gridX + 0.5) * cellSize;
    const startY = (gridY + 0.5) * cellSize;

    // Direct radial star sparkles
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const speed = 3.0 + Math.random() * 2.5;
      
      this.particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: i % 2 === 0 ? '#fbbf24' : '#ffffff', // gold & white
        size: 2 + Math.random() * 3,
        life: 1.0,
        decay: 0.03 + Math.random() * 0.02,
        gravity: 0.02, // very light gravity to make them float out
      });
    }
  }

  // Spawn score popup flyaway text
  spawnFloatingText(gridX: number, gridY: number, cellSize: number, text: string, color = '#ffffff') {
    const startX = (gridX + 0.5) * cellSize;
    const startY = gridY * cellSize - 5;

    this.floatingTexts.push({
      x: startX,
      y: startY,
      text,
      color,
      life: 1.0,
      decay: 0.02,
      vy: -1.2,
      font: "bold 13px 'Courier New', Courier, monospace",
    });
  }

  // Core frame updates for clean 60fps animations
  update() {
    // 1. Update Particles
    this.particles = this.particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life -= p.decay;
      return p.life > 0;
    });

    // 2. Update Floating Texts
    this.floatingTexts = this.floatingTexts.filter((t) => {
      t.y += t.vy;
      t.life -= t.decay;
      return t.life > 0;
    });

    // 2.5. Update Expanding Shockwaves
    this.shockwaves = this.shockwaves.filter((s) => {
      s.r += s.speed;
      s.life -= s.decay;
      return s.life > 0 && s.r < s.maxRadius;
    });

    // 3. Update Screen Shake
    if (this.shakeIntensity > 0.1) {
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= 0.88; // decay
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeIntensity = 0;
    }

    // 4. Update Screen Flash
    if (this.flash) {
      this.flash.alpha -= this.flash.decay;
      if (this.flash.alpha <= 0) {
        this.flash = null;
      }
    }
  }

  // Draw layers onto the canvas context
  draw(ctx: CanvasRenderingContext2D) {
    // Draw particles
    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      
      // Shadow / glow of particles if cyberpunk
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    });

    // Draw expanding glowing neon shockwaves
    this.shockwaves.forEach((s) => {
      ctx.save();
      ctx.globalAlpha = s.life * 0.65;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = Math.max(1.0, 3.5 * s.life);
      
      // Retro glowing shadow filters
      ctx.shadowBlur = 10;
      ctx.shadowColor = s.color;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // Draw floating texts with arcade text shadows
    this.floatingTexts.forEach((t) => {
      ctx.save();
      ctx.globalAlpha = t.life;
      ctx.font = t.font;
      ctx.textAlign = 'center';
      
      // Draw drop shadow
      ctx.fillStyle = '#000000';
      ctx.fillText(t.text, t.x + 1, t.y + 1);

      // Draw primary text
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    });

    // Draw global screen flash overlay
    if (this.flash) {
      ctx.save();
      ctx.globalAlpha = this.flash.alpha;
      ctx.fillStyle = this.flash.color;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }
  }
}
