import { BrawlerTemplate, SkinInfo } from './types';
import { BRAWLER_TEMPLATES, SKIN_DATA } from './brawlerTemplates';

export class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  choice<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

export function isTeammate(a: any, b: any): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.team && b.team) {
    return a.team === b.team;
  }
  return false;
}

export interface GameWorld {
  player: Character | null;
  bots: Character[];
  powerBoxes: PowerBox[];
  powerCubes: PowerCube[];
  projectiles: Projectile[];
  bushes: Bush[];
  obstacles: Obstacle[];
  floatingTexts: FloatingText[];
  particles: (Particle | CircleSlashParticle)[];
  bossRobot: BossRobot | null;
  healingZones: HealingZone[];
  activeMeteors: MeteorTarget[];
  energyDrinks: EnergyDrink[];
  jumpPads: JumpPad[];
  mysteryBoxes: MysteryBox[];
  toxicGasRadius: number;
  targetGasRadius: number;
  triggerScreenShake: (amount: number) => void;
  playSound: (type: string) => void;
  playerStats: { damageDealt: number; cubesCollected: number; shotsFired: number; shotsHit: number };
  addKillFeed: (attacker: string, victim: string, isGas?: boolean) => void;
  lowerGraphics?: boolean;
  gameMode?: 'showdown' | 'tdm';
  blueScore?: number;
  redScore?: number;
  tdmTimer?: number;
  random?: SeededRandom;
  WORLD_SIZE: number;
}

export class Particle {
  x: number; y: number; vx: number; vy: number; color: string; size: number; life: number; m: number;
  constructor(x: number, y: number, vx: number, vy: number, color: string, size: number, life: number) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.color = color; this.size = size; this.life = life; this.m = life;
  }
  update() { this.x += this.vx; this.y += this.vy; this.life--; }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save(); ctx.globalAlpha = this.life / this.m; ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}

export class FloatingText {
  x: number; y: number; text: string; color: string; size: number; alpha: number;
  constructor(x: number, y: number, text: string, color: string, size: number) {
    this.x = x; this.y = y; this.text = text; this.color = color; this.size = size; this.alpha = 1;
  }
  update() { this.y -= 1; this.alpha -= 0.025; }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save(); ctx.globalAlpha = this.alpha; ctx.font = `900 ${this.size}px sans-serif`;
    ctx.fillStyle = this.color; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.textAlign = 'center';
    ctx.strokeText(this.text, this.x, this.y); ctx.fillText(this.text, this.x, this.y); ctx.restore();
  }
}

export class CircleSlashParticle {
  x: number; y: number; radius: number; color: string; life: number; m: number;
  constructor(x: number, y: number, radius: number, color: string) {
    this.x = x; this.y = y; this.radius = radius; this.color = color; this.life = 12; this.m = 12;
  }
  update() { this.life--; }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save(); ctx.globalAlpha = this.life / this.m; ctx.strokeStyle = this.color; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
}

export class PowerCube {
  x: number; y: number; radius: number;
  constructor(x: number, y: number) {
    this.x = x; this.y = y; this.radius = 12;
  }
  draw(ctx: CanvasRenderingContext2D) {
    const bob = Math.sin(Date.now() / 200) * 3;
    ctx.save(); ctx.fillStyle = '#10b981'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(this.x, this.y + bob, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
  }
}

export class PowerBox {
  x: number; y: number; hp: number; maxHp: number; radius: number;
  constructor(x: number, y: number) {
    this.x = x; this.y = y; this.hp = 2000; this.maxHp = 2000; this.radius = 24;
  }
  takeDamage(amount: number, world: GameWorld) {
    this.hp -= amount;
    world.floatingTexts.push(new FloatingText(this.x, this.y - 20, `-${amount}`, '#fbcfe8', 16));
    if (this.hp <= 0) {
      world.powerBoxes = world.powerBoxes.filter(b => b !== this);
      world.powerCubes.push(new PowerCube(this.x, this.y));
      world.playSound('break_box');
    }
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save(); ctx.fillStyle = '#b45309'; ctx.strokeStyle = '#451a03'; ctx.lineWidth = 3;
    ctx.fillRect(this.x - 20, this.y - 20, 40, 40); ctx.strokeRect(this.x - 20, this.y - 20, 40, 40);
    ctx.fillStyle = '#ec4899'; ctx.fillRect(this.x - 20, this.y - 30, Math.max(0, 40 * (this.hp / this.maxHp)), 4); ctx.restore();
  }
}

export class Obstacle {
  x: number; y: number; radius: number; mapName: string;
  constructor(x: number, y: number, mapName: string = 'Classic Showdown') {
    this.x = x;
    this.y = y;
    this.radius = 26;
    this.mapName = mapName;
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    let fill = '#64748b';
    let stroke = '#334155';

    if (this.mapName === 'Classic Showdown' || this.mapName === 'Random Map') {
      fill = '#d97706'; // Sandy canyon rock
      stroke = '#78350f';
    } else if (this.mapName === 'Feast or Famine') {
      fill = '#047857'; // Mossy temple stone
      stroke = '#064e3b';
    } else if (this.mapName === 'Cavern Churn') {
      fill = '#6366f1'; // Luminous indigo purple crystal
      stroke = '#312e81';
    } else if (this.mapName === 'Double Trouble') {
      fill = '#38bdf8'; // Cyber metal obstacle
      stroke = '#0284c7';
    }

    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Subtle lighting highlight lines inside rocks/obstacles
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(this.x - 5, this.y - 5, this.radius * 0.5, Math.PI, Math.PI * 1.5);
    ctx.stroke();
    ctx.restore();
  }
}

export class Bush {
  x: number; y: number; radius: number; mapName: string;
  constructor(x: number, y: number, mapName: string = 'Classic Showdown') {
    this.x = x;
    this.y = y;
    this.radius = 50;
    this.mapName = mapName;
  }
  draw(ctx: CanvasRenderingContext2D, world?: any) {
    ctx.save();
    let fill = 'rgba(22, 163, 74, 0.7)';

    if (this.mapName === 'Classic Showdown' || this.mapName === 'Random Map') {
      fill = 'rgba(180, 83, 9, 0.65)'; // Dry golden-brown desert scrub
    } else if (this.mapName === 'Feast or Famine') {
      fill = 'rgba(16, 185, 129, 0.75)'; // Emerald lush jungle grass
    } else if (this.mapName === 'Cavern Churn') {
      fill = 'rgba(168, 85, 247, 0.65)'; // Subterranean glowing violet moss
    } else if (this.mapName === 'Double Trouble') {
      fill = 'rgba(6, 182, 212, 0.6)'; // Translucent cybernetic cyan grid foliage
    }

    if (world && world.player) {
      const p = world.player;
      if (p.inBush) {
        let dist = Math.hypot(p.x - this.x, p.y - this.y);
        if (dist < 180) {
          let fadeRatio = Math.max(0.15, (dist / 180));
          ctx.globalAlpha = fadeRatio;
        }
      }
    }

    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Concentric detail overlay to represent thick bushes
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.65, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export class MysteryBox {
  x: number; y: number; radius: number; hp: number; maxHp: number;
  constructor(x: number, y: number) {
    this.x = x; this.y = y; this.radius = 24; this.hp = 1800; this.maxHp = 1800;
  }
  takeDamage(amount: number, world: GameWorld) {
    this.hp -= amount;
    world.floatingTexts.push(new FloatingText(this.x, this.y - 20, `-${amount}`, '#67e8f9', 16));
    if (this.hp <= 0) {
      world.mysteryBoxes = world.mysteryBoxes.filter(b => b !== this);
      world.playSound('break_box');
      // Spawn explosion
      for (let i = 0; i < 12; i++) {
        let a = Math.random() * Math.PI * 2;
        let speed = 2 + Math.random() * 4;
        world.particles.push(new Particle(this.x, this.y, Math.cos(a) * speed, Math.sin(a) * speed, '#38bdf8', 2 + Math.random() * 3, 20 + Math.random() * 20));
      }
      if (world.player) {
        if (Math.random() < 0.5) {
          world.player.heal(2000, world);
          world.floatingTexts.push(new FloatingText(world.player.x, world.player.y - 25, "💖 Mega Heal!", '#10b981', 18));
        } else {
          world.player.chargeSuper(50, world);
          world.floatingTexts.push(new FloatingText(world.player.x, world.player.y - 25, "⚡ +50% Super Charge!", '#facc15', 18));
        }
      }
    }
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save(); ctx.fillStyle = '#0e7490'; ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 3.5;
    ctx.fillRect(this.x - 20, this.y - 20, 40, 40); ctx.strokeRect(this.x - 20, this.y - 20, 40, 40);
    ctx.fillStyle = '#22d3ee'; ctx.fillRect(this.x - 5, this.y - 5, 10, 10); ctx.restore();
  }
}

export class EnergyDrink {
  x: number; y: number; radius: number;
  constructor(x: number, y: number) { this.x = x; this.y = y; this.radius = 18; }
  draw(ctx: CanvasRenderingContext2D) {
    const bob = Math.sin(Date.now() / 200) * 3;
    ctx.save(); ctx.fillStyle = '#a855f7'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
    ctx.fillRect(this.x - 8, this.y - 12 + bob, 16, 24); ctx.strokeRect(this.x - 8, this.y - 12 + bob, 16, 24);
    ctx.fillStyle = '#facc15'; ctx.fillRect(this.x - 8, this.y - 3 + bob, 16, 6); ctx.restore();
  }
}

export class JumpPad {
  x: number; y: number; targetAngle: number; targetDist: number; radius: number;
  constructor(x: number, y: number, angle: number) {
    this.x = x; this.y = y; this.targetAngle = angle; this.targetDist = 320; this.radius = 28;
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save(); ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1e293b'; ctx.translate(this.x, this.y); ctx.rotate(this.targetAngle);
    ctx.beginPath(); ctx.moveTo(-10, -6); ctx.lineTo(6, -6); ctx.lineTo(6, -12); ctx.lineTo(15, 0); ctx.lineTo(6, 12); ctx.lineTo(6, 6); ctx.lineTo(-10, 6);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
}

export class MeteorTarget {
  x: number; y: number; radius: number; timer: number;
  constructor(x: number, y: number) { this.x = x; this.y = y; this.radius = 150; this.timer = 2000; }
  update(dt: number, world: GameWorld) {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.strike(world);
      return true;
    }
    return false;
  }
  strike(world: GameWorld) {
    world.triggerScreenShake(15);
    world.playSound('break_box');
    
    // Spawn particles
    for (let i = 0; i < 25; i++) {
      let a = Math.random() * Math.PI * 2;
      let speed = 2 + Math.random() * 5;
      world.particles.push(new Particle(this.x, this.y, Math.cos(a) * speed, Math.sin(a) * speed, '#f97316', 3 + Math.random() * 4, 25));
    }

    const targets = [world.player, ...world.bots].filter(b => b && b.hp > 0);
    targets.forEach(t => {
      if (Math.hypot(t.x - this.x, t.y - this.y) < this.radius) {
        t.takeDamage(1500, "Meteor Strike", world);
      }
    });
    world.bushes = world.bushes.filter(b => Math.hypot(b.x - this.x, b.y - this.y) > this.radius);
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save(); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.stroke();
    let progress = (2000 - this.timer) / 2000; ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.beginPath(); ctx.arc(this.x, this.y, Math.max(0, this.radius * progress), 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}

export class HealingZone {
  x: number; y: number; radius: number; duration: number;
  constructor(x: number, y: number) { this.x = x; this.y = y; this.radius = 160; this.duration = 12000; }
  update(dt: number, world: GameWorld) {
    this.duration -= dt;
    const targets = [world.player, ...world.bots].filter(b => b && b.hp > 0);
    targets.forEach(t => {
      if (Math.hypot(t.x - this.x, t.y - this.y) < this.radius) {
        t.heal(Math.floor(400 * (dt / 1000)), world);
      }
    });
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    let pulseRadius = this.radius + Math.sin(Date.now() / 150) * 8;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(this.x, this.y, pulseRadius, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(16, 185, 129, 0.04)'; ctx.beginPath(); ctx.arc(this.x, this.y, pulseRadius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#34d399';
    for (let i = 0; i < 5; i++) {
      let ma = (i / 5) * Math.PI * 2 + (Date.now() / 2000);
      let mx = this.x + Math.cos(ma) * (this.radius * 0.5);
      let my = this.y + Math.sin(ma) * (this.radius * 0.5);
      ctx.beginPath(); ctx.arc(mx, my, 8, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(mx - 2, my, 4, 8); ctx.fillStyle = '#34d399';
    }
    ctx.restore();
  }
}

export class BossRobot {
  x: number; y: number; radius: number; hp: number; maxHp: number; speed: number; damage: number; lastAttackTime: number; target: Character | null;
  constructor(x: number, y: number) {
    this.x = x; this.y = y; this.radius = 45; this.hp = 18000; this.maxHp = 18000; this.speed = 1.3; this.damage = 1000; this.lastAttackTime = 0; this.target = null;
  }
  update(dt: number, world: GameWorld) {
    // get nearest
    let nearest: Character | null = null;
    let minDist = Infinity;
    const candidates = [world.player, ...world.bots].filter(b => b && b.hp > 0 && !b.isJumping);
    for (let c of candidates) {
      let d = Math.hypot(c.x - this.x, c.y - this.y);
      if (d < minDist) { minDist = d; nearest = c; }
    }
    this.target = nearest;

    if (this.target) {
      let angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      this.x += Math.cos(angle) * this.speed; this.y += Math.sin(angle) * this.speed;
      let d = Math.hypot(this.target.x - this.x, this.target.y - this.y);
      if (d < this.radius + this.target.radius + 15) {
        let now = Date.now();
        if (now - this.lastAttackTime > 1500) {
          this.lastAttackTime = now;
          this.target.takeDamage(this.damage, "Giant Boss Robot", world);
          world.triggerScreenShake(8);
        }
      }
    }
  }
  takeDamage(amount: number, world: GameWorld) {
    this.hp -= amount;
    world.floatingTexts.push(new FloatingText(this.x, this.y - 50, `-${amount}`, '#cbd5e1', 22));
    if (this.hp <= 0) { this.hp = 0; this.die(world); }
  }
  die(world: GameWorld) {
    world.bossRobot = null;
    for (let i = 0; i < 5; i++) {
      world.powerCubes.push(new PowerCube(this.x + (Math.random() - 0.5) * 100, this.y + (Math.random() - 0.5) * 100));
    }
    // spawn explosion
    for (let i = 0; i < 30; i++) {
      let a = Math.random() * Math.PI * 2;
      let speed = 2 + Math.random() * 5;
      world.particles.push(new Particle(this.x, this.y, Math.cos(a) * speed, Math.sin(a) * speed, '#64748b', 3 + Math.random() * 4, 30));
    }
    world.playSound('break_box');
    world.addKillFeed("Brawlers", "Giant Boss Robot");
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(this.x, this.y + 35, this.radius, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 4; ctx.fillStyle = '#475569';
    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ef4444'; ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.arc(this.x, this.y - 10, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#eab308';
    ctx.fillRect(this.x - 38, this.y + 10, 16, 20); ctx.strokeRect(this.x - 38, this.y + 10, 16, 20);
    ctx.fillRect(this.x + 22, this.y + 10, 16, 20); ctx.strokeRect(this.x + 22, this.y + 10, 16, 20);
    const bw = 90, bh = 8;
    ctx.fillStyle = '#1e2937'; ctx.fillRect(this.x - bw / 2, this.y - 65, bw, bh);
    ctx.fillStyle = '#ef4444'; ctx.fillRect(this.x - bw / 2, this.y - 65, bw * (this.hp / this.maxHp), bh); ctx.strokeRect(this.x - bw / 2, this.y - 65, bw, bh);
    ctx.shadowColor = '#000000'; ctx.shadowBlur = 4; ctx.fillStyle = '#ffffff'; ctx.font = '900 12px sans-serif'; ctx.textAlign = 'center';
    ctx.strokeText("⚠️ BOSS ROBOT", this.x, this.y - 75); ctx.fillText("⚠️ BOSS ROBOT", this.x, this.y - 75);
    ctx.restore();
  }
}

export class Projectile {
  x: number; y: number; startX: number; startY: number; vx: number; vy: number; damage: number; maxRange: number; owner: Character; radius: number;
  isSpikeBall: boolean; isDefunct: boolean; angle: number; piercing: boolean; isSuper: boolean; hitTargets: Set<any>;
  bounce: boolean; bounces: number; isReturning: boolean; isJuiceShot: boolean; isSneakerKick: boolean; isYarnBall: boolean;
  isCharlieHair: boolean; isCocoonWeb: boolean; isSnowball: boolean;
  isHomemadeRecipe: boolean = false;
  isSatchelCharge: boolean = false;
  isBrockRocket: boolean = false;
  isBarleyBottle: boolean = false;
  isBarleyPuddle: boolean = false;
  isNitaShockwave: boolean = false;
  isBoArrow: boolean = false;
  isBoMine: boolean = false;
  isJessieOrb: boolean = false;
  isEmzSpray: boolean = false;
  isRicoBall: boolean = false;
  isGeneHand: boolean = false;
  isGeneSmokeBall: boolean = false;
  isMortisShovel: boolean = false;
  isMortisBat: boolean = false;
  isPiperBullet: boolean = false;
  isPiperGrenade: boolean = false;
  isDynamite: boolean = false;
  isBigBomb: boolean = false;
  isFrankHammer: boolean = false;
  isFrankSuper: boolean = false;
  isMusicWave: boolean = false;
  isPocoSuper: boolean = false;
  isTarotCard: boolean = false;
  isTaraSuper: boolean = false;
  isTickCluster: boolean = false;
  isTickMine: boolean = false;
  isTickHead: boolean = false;
  isAmberOil: boolean = false;
  isAmberPuddle: boolean = false;
  isAmberFire: boolean = false;
  isIgnited: boolean = false;
  lobTargetX: number = 0;
  lobTargetY: number = 0;
  lobElapsed: number = 0;
  lobDuration: number = 0;

  constructor(x: number, y: number, angle: number, speed: number, damage: number, maxRange: number, owner: Character, radius: number, isSpikeBall = false, piercing = false, isSuper = false, bounce = false) {
    this.x = x; this.y = y; this.startX = x; this.startY = y;
    this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
    this.damage = damage; this.maxRange = maxRange; this.owner = owner;
    this.radius = radius; this.isSpikeBall = isSpikeBall; this.isDefunct = false;
    this.angle = angle; this.piercing = piercing; this.isSuper = isSuper;
    this.hitTargets = new Set();
    this.bounce = bounce;
    this.bounces = 0;
    this.isReturning = false;
    this.isJuiceShot = false;
    this.isSneakerKick = false;
    this.isYarnBall = false;
    this.isCharlieHair = false;
    this.isCocoonWeb = false;
    this.isSnowball = false;
    this.isHomemadeRecipe = false;
    this.isSatchelCharge = false;
  }

  explodeTickMine(world: GameWorld) {
    this.isDefunct = true;
    world.playSound('break_box');
    world.triggerScreenShake(4);

    // Shockwave animation particle
    world.particles.push(new CircleSlashParticle(this.x, this.y, 50, '#f97316'));

    // Flurry of fire/smoke particles
    for (let k = 0; k < 12; k++) {
      let a = Math.random() * Math.PI * 2;
      let sp = 1.5 + Math.random() * 3.5;
      let colors = ['#facc15', '#f97316', '#ef4444', '#78716c'];
      let color = colors[Math.floor(Math.random() * colors.length)];
      world.particles.push(new Particle(this.x, this.y, Math.cos(a) * sp, Math.sin(a) * sp, color, 2.5 + Math.random() * 3, 15 + Math.floor(Math.random() * 15)));
    }

    const explosionRadius = 55;

    // Damage all targets in radius
    const targets = [world.player, ...world.bots].filter(b => b && b.hp > 0);
    targets.forEach(t => {
      // Don't damage the owner of the mine (Tick who threw it)
      if (t !== this.owner) {
        const dist = Math.hypot(this.x - t.x, this.y - t.y);
        if (dist < t.radius + explosionRadius) {
          t.takeDamage(this.damage, this.owner ? this.owner.name : "Tick", world);
        }
      }
    });

    // Damage all boxes in radius
    const boxes = [...world.powerBoxes, ...world.mysteryBoxes];
    boxes.forEach(b => {
      const dist = Math.hypot(this.x - b.x, this.y - b.y);
      if (dist < b.radius + explosionRadius) {
        b.takeDamage(this.damage, world);
      }
    });
  }

  update(world: GameWorld) {
    if (this.isDynamite || this.isBigBomb) {
      this.lobElapsed += 16.6;
      let t = Math.min(1.0, this.lobElapsed / this.lobDuration);
      this.x = this.startX + (this.lobTargetX - this.startX) * t;
      this.y = this.startY + (this.lobTargetY - this.startY) * t;
      if (t >= 1.0) {
        this.isDefunct = true;
        let radius = this.isBigBomb ? 170 : 100;
        let damageScale = this.isBigBomb ? 1.6 : 1.0;
        let color = this.isBigBomb ? '#ef4444' : '#fb923c';
        world.triggerScreenShake(this.isBigBomb ? 14 : 7);
        world.playSound('break_box');

        // Explosion particle cluster
        for (let k = 0; k < (this.isBigBomb ? 25 : 12); k++) {
          let a = Math.random() * Math.PI * 2;
          let sp = 2 + Math.random() * 5;
          world.particles.push(new Particle(this.x, this.y, Math.cos(a) * sp, Math.sin(a) * sp, color, 3 + Math.random() * 3, 25));
        }

        const splashTargets = [world.player, ...world.bots].filter(b => b && b.hp > 0 && Math.hypot(b.x - this.x, b.y - this.y) < radius);
        splashTargets.forEach(t => {
          if (t !== this.owner) {
            t.takeDamage(Math.floor(this.damage * damageScale), this.owner ? this.owner.name : "Dynamite", world);
            if (this.isSatchelCharge) {
              t.stunTimer = 1500;
              world.floatingTexts.push(new FloatingText(t.x, t.y - 30, "💫 STUNNED!", '#facc15', 18));
            }
          }
        });

        // Also hit power boxes and mystery boxes
        const powerBoxTargets = world.powerBoxes.filter(b => Math.hypot(b.x - this.x, b.y - this.y) < radius);
        powerBoxTargets.forEach(b => {
          b.takeDamage(Math.floor(this.damage * damageScale), world);
        });

        const mysteryBoxTargets = world.mysteryBoxes.filter(b => Math.hypot(b.x - this.x, b.y - this.y) < radius);
        mysteryBoxTargets.forEach(b => {
          b.takeDamage(Math.floor(this.damage * damageScale), world);
        });

        // Destroy obstacle cover if it's a Big Bomb
        if (this.isBigBomb) {
          for (let i = world.obstacles.length - 1; i >= 0; i--) {
            let obs = world.obstacles[i];
            if (Math.hypot(this.x - obs.x, this.y - obs.y) < radius + obs.radius) {
              world.obstacles.splice(i, 1);
              for (let k = 0; k < 6; k++) {
                let a = Math.random() * Math.PI * 2;
                world.particles.push(new Particle(obs.x, obs.y, Math.cos(a) * 3, Math.sin(a) * 3, '#64748b', 2, 15));
              }
            }
          }
        }
      }
      return;
    }

    if (this.isTaraSuper) {
      this.lobElapsed += 16.6;
      let t = Math.min(1.0, this.lobElapsed / this.lobDuration);
      this.x = this.startX + (this.lobTargetX - this.startX) * t;
      this.y = this.startY + (this.lobTargetY - this.startY) * t;
      if (t >= 1.0) {
        this.isDefunct = true;
        world.triggerScreenShake(12);
        world.playSound('break_box');
        const pullRadius = 160;
        const pullTargets = [world.player, ...world.bots].filter(b => b && b.hp > 0 && Math.hypot(b.x - this.x, b.y - this.y) < pullRadius);
        pullTargets.forEach(t => {
          if (t !== this.owner) {
            t.x = this.x; t.y = this.y;
            t.takeDamage(this.damage, this.owner ? this.owner.name : "Tara", world);
          }
        });
        world.powerBoxes.forEach(b => {
          if (Math.hypot(b.x - this.x, b.y - this.y) < pullRadius) {
            b.x = this.x; b.y = this.y;
            b.takeDamage(this.damage, world);
          }
        });
        world.mysteryBoxes.forEach(b => {
          if (Math.hypot(b.x - this.x, b.y - this.y) < pullRadius) {
            b.x = this.x; b.y = this.y;
            b.takeDamage(this.damage, world);
          }
        });
        for (let k = 0; k < 20; k++) {
          let a = Math.random() * Math.PI * 2;
          let sp = 1 + Math.random() * 4;
          world.particles.push(new Particle(this.x, this.y, Math.cos(a) * sp, Math.sin(a) * sp, '#8b5cf6', 4, 25));
        }
      }
      return;
    }

    if (this.isTickCluster) {
      this.lobElapsed += 16.6;
      let t = Math.min(1.0, this.lobElapsed / this.lobDuration);
      this.x = this.startX + (this.lobTargetX - this.startX) * t;
      this.y = this.startY + (this.lobTargetY - this.startY) * t;
      if (t >= 1.0) {
        this.isDefunct = true;
        const offsets = [
          { dx: 0, dy: -25 },
          { dx: -22, dy: 15 },
          { dx: 22, dy: 15 }
        ];
        offsets.forEach(off => {
          let mine = new Projectile(this.x + off.dx, this.y + off.dy, 0, 0, this.damage, 10, this.owner, 10);
          mine.isTickMine = true;
          mine.lobElapsed = 0;
          mine.lobDuration = 1250;
          world.projectiles.push(mine);
        });
      }
      return;
    }

    if (this.isTickMine) {
      this.lobElapsed += 16.6;
      if (this.lobElapsed >= this.lobDuration) {
        this.explodeTickMine(world);
        return;
      }
      const targets = [world.player, ...world.bots].filter(b => b && b !== this.owner && b.hp > 0);
      for (let t of targets) {
        if (Math.hypot(this.x - t.x, this.y - t.y) < t.radius + 12) {
          this.explodeTickMine(world);
          return;
        }
      }
      const boxes = [...world.powerBoxes, ...world.mysteryBoxes];
      for (let b of boxes) {
        if (Math.hypot(this.x - b.x, this.y - b.y) < b.radius + 12) {
          this.explodeTickMine(world);
          return;
        }
      }
      return;
    }

    if (this.isTickHead) {
      let nearest: Character | null = null;
      let minDist = 1000;
      const candidates = [world.player, ...world.bots].filter(b => b && b !== this.owner && b.hp > 0);
      for (let c of candidates) {
        let d = Math.hypot(c.x - this.x, c.y - this.y);
        if (d < minDist) {
          minDist = d; nearest = c;
        }
      }
      if (nearest) {
        let angleTo = Math.atan2(nearest.y - this.y, nearest.x - this.x);
        this.vx = Math.cos(angleTo) * 5.5;
        this.vy = Math.sin(angleTo) * 5.5;
        if (minDist < nearest.radius + this.radius) {
          this.isDefunct = true;
          nearest.takeDamage(this.damage, this.owner ? this.owner.name : "Tick Head", world);
          world.triggerScreenShake(8);
          world.playSound('break_box');
          for (let k = 0; k < 15; k++) {
            let a = Math.random() * Math.PI * 2;
            let sp = 2 + Math.random() * 4;
            world.particles.push(new Particle(this.x, this.y, Math.cos(a) * sp, Math.sin(a) * sp, '#f97316', 3, 20));
          }
          return;
        }
      }
      this.x += this.vx; this.y += this.vy;
      this.lobElapsed += 16.6;
      if (this.lobElapsed > 6000) {
        this.isDefunct = true;
      }
      return;
    }

    if (this.isAmberOil) {
      this.lobElapsed += 16.6;
      let t = Math.min(1.0, this.lobElapsed / this.lobDuration);
      this.x = this.startX + (this.lobTargetX - this.startX) * t;
      this.y = this.startY + (this.lobTargetY - this.startY) * t;
      if (t >= 1.0) {
        this.isDefunct = true;
        let puddle = new Projectile(this.x, this.y, 0, 0, 200, 10, this.owner, 40);
        puddle.isAmberPuddle = true;
        puddle.lobElapsed = 0;
        puddle.lobDuration = 6000;
        puddle.isIgnited = false;
        world.projectiles.push(puddle);
      }
      return;
    }

    if (this.isAmberPuddle) {
      this.lobElapsed += 16.6;
      if (this.lobElapsed >= this.lobDuration) {
        this.isDefunct = true;
        return;
      }
      if (this.isIgnited) {
        if (Math.random() < 0.15) {
          let a = Math.random() * Math.PI * 2;
          let r = Math.random() * this.radius;
          world.particles.push(new Particle(this.x + Math.cos(a) * r, this.y + Math.sin(a) * r, 0, -1, '#f97316', 3, 15));
        }
        const targets = [world.player, ...world.bots].filter(b => b && b !== this.owner && b.hp > 0 && Math.hypot(b.x - this.x, b.y - this.y) < this.radius + b.radius);
        targets.forEach(t => {
          t.takeDamage(5, this.owner ? this.owner.name : "Fire", world);
        });
        const boxes = [...world.powerBoxes, ...world.mysteryBoxes].filter(b => Math.hypot(b.x - this.x, b.y - this.y) < this.radius + b.radius);
        boxes.forEach(b => {
          b.takeDamage(5, world);
        });
      } else {
        const fireProjectiles = world.projectiles.filter(p => p && p.isAmberFire && Math.hypot(p.x - this.x, p.y - this.y) < this.radius);
        if (fireProjectiles.length > 0) {
          this.isIgnited = true;
          this.lobElapsed = 0;
          this.lobDuration = 4000;
          world.playSound('shoot');
          fireProjectiles.forEach(p => p.isDefunct = true);
        }
      }
      return;
    }

    this.x += this.vx; this.y += this.vy;

    // Homing/tracking logic for Piper's Homemade Recipe
    if (this.isHomemadeRecipe && this.owner) {
      let nearest: Character | null = null;
      let minDist = 300;
      const candidates = [world.player, ...world.bots].filter(b => b && b !== this.owner && b.hp > 0 && !b.isClone && !b.isSpider);
      for (let c of candidates) {
        let d = Math.hypot(c.x - this.x, c.y - this.y);
        if (d < minDist) {
          minDist = d;
          nearest = c;
        }
      }
      if (nearest) {
        let targetAngle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
        let speed = Math.hypot(this.vx, this.vy);
        let currentAngle = Math.atan2(this.vy, this.vx);
        let diff = targetAngle - currentAngle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        let adjust = Math.max(-0.1, Math.min(0.1, diff));
        let newAngle = currentAngle + adjust;
        this.vx = Math.cos(newAngle) * speed;
        this.vy = Math.sin(newAngle) * speed;
      }
    }

    // Charlie Return Hair YoYo Mechanism
    if (this.isCharlieHair) {
      let distFromStart = Math.hypot(this.x - this.startX, this.y - this.startY);
      if (distFromStart >= this.maxRange && !this.isReturning) {
        this.isReturning = true;
      }
      if (this.isReturning) {
        let angleToOwner = Math.atan2(this.owner.y - this.y, this.owner.x - this.x);
        let speed = 16;
        this.vx = Math.cos(angleToOwner) * speed;
        this.vy = Math.sin(angleToOwner) * speed;
        if (Math.hypot(this.x - this.owner.x, this.y - this.owner.y) < 30) {
          this.isDefunct = true;
          this.owner.charlieYoYoActive = false;
        }
      }
    }

    // Boomerang logic for Crow's Hypercharge
    if (this.owner && this.owner.id === 'crow' && this.owner.hyperActiveTimer > 0) {
      this.piercing = true;
      let distFromStart = Math.hypot(this.x - this.startX, this.y - this.startY);
      if (distFromStart >= this.maxRange && !this.isReturning) {
        this.isReturning = true;
        this.damage = Math.floor(this.damage * 0.80);
        this.hitTargets.clear();
      }
      if (this.isReturning) {
        let angleToOwner = Math.atan2(this.owner.y - this.y, this.owner.x - this.x);
        let speed = Math.hypot(this.vx, this.vy);
        this.vx = Math.cos(angleToOwner) * speed;
        this.vy = Math.sin(angleToOwner) * speed;
        if (Math.hypot(this.x - this.owner.x, this.y - this.owner.y) < 25) {
          this.isDefunct = true;
        }
      }
    }

    if (this.bounce) {
      if (this.x - this.radius <= 50 || this.x + this.radius >= world.WORLD_SIZE - 50) {
        this.vx *= -1; this.bounces++;
        this.x = Math.max(50 + this.radius, Math.min(world.WORLD_SIZE - 50 - this.radius, this.x));
      }
      if (this.y - this.radius <= 50 || this.y + this.radius >= world.WORLD_SIZE - 50) {
        this.vy *= -1; this.bounces++;
        this.y = Math.max(50 + this.radius, Math.min(world.WORLD_SIZE - 50 - this.radius, this.y));
      }
      for (let obs of world.obstacles) {
        let d = Math.hypot(this.x - obs.x, this.y - obs.y);
        if (d < obs.radius + this.radius) {
          let nx = (this.x - obs.x) / d; let ny = (this.y - obs.y) / d;
          let dot = this.vx * nx + this.vy * ny;
          this.vx -= 2 * dot * nx; this.vy -= 2 * dot * ny;
          this.bounces++;
          this.x = obs.x + nx * (obs.radius + this.radius + 1); this.y = obs.y + ny * (obs.radius + this.radius + 1);
        }
      }
      if (this.bounces > 5) {
        this.isDefunct = true;
        if (this.isCharlieHair) this.owner.charlieYoYoActive = false;
      }
    }

    if (this.isSuper && this.owner && this.owner.id === 'kenji') {
      world.particles.push(new Particle(this.x, this.y, -this.vx * 0.15 + (Math.random() - 0.5) * 1.5, -this.vy * 0.15 + (Math.random() - 0.5) * 1.5, '#a5f3fc', 2 + Math.random() * 2, 16));
    }

    // Super shred cover
    if (this.isSuper && this.owner && (this.owner.id === 'shelly' || this.owner.id === 'colt' || this.owner.id === 'gale')) {
      for (let i = world.obstacles.length - 1; i >= 0; i--) {
        let obs = world.obstacles[i];
        if (Math.hypot(this.x - obs.x, this.y - obs.y) < obs.radius + this.radius) {
          world.obstacles.splice(i, 1);
          // explosion
          for (let k = 0; k < 12; k++) {
            let a = Math.random() * Math.PI * 2;
            world.particles.push(new Particle(obs.x, obs.y, Math.cos(a) * 3, Math.sin(a) * 3, '#64748b', 2, 15));
          }
          world.playSound('break_box');
        }
      }
    }

    if (Math.hypot(this.x - this.startX, this.y - this.startY) >= this.maxRange && !this.bounce && !this.isReturning) {
      if (this.isCharlieHair) {
        this.isReturning = true;
      } else {
        this.isDefunct = true;
        if (this.isSpikeBall) this.splitSpikes(world);
        if (this.isJuiceShot) this.splitJuice(world);
        if (this.isSneakerKick && this.hitTargets.size === 0) {
          world.projectiles.push(new Projectile(this.x, this.y, this.angle, 14, Math.floor(this.damage * 0.25), 350, this.owner, 8, false, false));
        }
        if (this.isYarnBall) this.explodeYarn(world);
        if (this.isBrockRocket) this.explodeBrockRocket(world);
        if (this.isGeneSmokeBall) this.splitGeneSmokeBall(world);
        return;
      }
    }

    // Check boss collision
    if (world.bossRobot && !this.hitTargets.has(world.bossRobot)) {
      if (Math.hypot(this.x - world.bossRobot.x, this.y - world.bossRobot.y) < world.bossRobot.radius + this.radius) {
        let finalDmg = this.damage;
        if (this.owner && this.owner.id === 'crow' && this.owner.selectedStarPower === 'carrion_crow' && (world.bossRobot.hp / world.bossRobot.maxHp <= 0.5)) {
          finalDmg = Math.floor(finalDmg * 1.30);
        }
        world.bossRobot.takeDamage(finalDmg, world);
        this.owner.chargeSuper(10, world);

        if (this.owner && this.owner.id === 'crow') {
          world.bossRobot.target = this.owner; // Aggro
        }

        if (this.owner === world.player) {
          world.playerStats.shotsHit++;
        }

        if (this.isCocoonWeb) {
          // boss can't be cocooned but takes bonus damage
          world.bossRobot.takeDamage(1000, world);
        }

        if (this.isSnowball) {
          // Slow down the boss!
          world.bossRobot.speed = Math.max(0.4, world.bossRobot.speed - 0.2);
        }

        if (!this.piercing) {
          this.isDefunct = true;
          if (this.isCharlieHair) { this.owner.charlieYoYoActive = false; }
          if (this.isSpikeBall) this.splitSpikes(world);
          if (this.isJuiceShot) this.splitJuice(world);
          if (this.isYarnBall) this.explodeYarn(world);
          return;
        } else {
          this.hitTargets.add(world.bossRobot);
        }
      }
    }

    // Check mystery boxes
    for (let b of world.mysteryBoxes) {
      if (this.hitTargets.has(b)) continue;
      if (Math.hypot(this.x - b.x, this.y - b.y) < b.radius + this.radius) {
        b.takeDamage(this.damage, world);
        this.owner.chargeSuper(5, world);
        if (this.owner === world.player) world.playerStats.shotsHit++;

        if (!this.piercing) {
          this.isDefunct = true;
          if (this.isCharlieHair) this.owner.charlieYoYoActive = false;
          if (this.isSpikeBall) this.splitSpikes(world);
          if (this.isJuiceShot) this.splitJuice(world);
          if (this.isYarnBall) this.explodeYarn(world);
          return;
        } else {
          this.hitTargets.add(b);
        }
      }
    }

    // Check power boxes
    for (let b of world.powerBoxes) {
      if (this.hitTargets.has(b)) continue;
      if (Math.hypot(this.x - b.x, this.y - b.y) < b.radius + this.radius) {
        b.takeDamage(this.damage, world);
        if (this.owner.id === 'edgar') this.owner.heal(Math.floor(this.damage * 0.20), world);
        this.owner.chargeSuper(5, world);
        if (this.owner === world.player) world.playerStats.shotsHit++;

        if (!this.piercing) {
          this.isDefunct = true;
          if (this.isCharlieHair) this.owner.charlieYoYoActive = false;
          if (this.isSpikeBall) this.splitSpikes(world);
          if (this.isJuiceShot) this.splitJuice(world);
          if (this.isYarnBall) this.explodeYarn(world);
          return;
        } else {
          this.hitTargets.add(b);
        }
      }
    }

    // Check brawler targets
    const targets = [world.player, ...world.bots].filter(b => b !== null);
    for (let t of targets) {
      if (t === this.owner || this.hitTargets.has(t) || t.hp <= 0 || isTeammate(t, this.owner)) continue;
      if (Math.hypot(this.x - t.x, this.y - t.y) < t.radius + this.radius) {
        let finalDmg = this.damage;
        
        if (this.isPiperBullet) {
          let distTraveled = Math.hypot(this.x - this.startX, this.y - this.startY);
          let ratio = Math.min(1.0, distTraveled / this.maxRange);
          finalDmg = Math.floor(finalDmg * (0.4 + ratio * 1.8));
        }

        if (this.owner && this.owner.id === 'crow' && this.owner.selectedStarPower === 'carrion_crow' && (t.hp / t.getMaxHp() <= 0.5)) {
          finalDmg = Math.floor(finalDmg * 1.30);
        }

        if (this.isMortisBat && this.owner) {
          this.owner.heal(Math.floor(finalDmg * 1.0), world);
          for (let k = 0; k < 6; k++) {
            world.particles.push(new Particle(this.owner.x, this.owner.y, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, '#10b981', 3, 15));
          }
        }

        // Apply Gale's Blizzard Wave Pushback
        if (this.isSuper && this.owner && this.owner.id === 'gale') {
          let pushAngle = Math.atan2(t.y - this.owner.y, t.x - this.owner.x);
          t.x += Math.cos(pushAngle) * 160;
          t.y += Math.sin(pushAngle) * 160;
          t.x = Math.max(t.radius, Math.min(world.WORLD_SIZE - t.radius, t.x));
          t.y = Math.max(t.radius, Math.min(world.WORLD_SIZE - t.radius, t.y));
          t.speedBoostTimer = -2500; // Slow!
          world.floatingTexts.push(new FloatingText(t.x, t.y - 40, "💨 BLOWN AWAY & SLOWED!", '#67e8f9', 15));
        }

        // Apply Charlie's Cocoon
        if (this.isCocoonWeb) {
          t.stunTimer = 3000;
          t.isCocooned = true;
          t.cocoonVisualTimer = 3000;
          world.floatingTexts.push(new FloatingText(t.x, t.y - 40, "🕸️ COCOONED!", '#ec4899', 18));
          // Spawning web particles
          for (let k = 0; k < 12; k++) {
            let a = Math.random() * Math.PI * 2;
            world.particles.push(new Particle(t.x, t.y, Math.cos(a) * 2, Math.sin(a) * 2, '#fbcfe8', 3, 15));
          }
        }

        // Apply snow slow
        if (this.isSnowball) {
          t.speedBoostTimer = -1500; // 1.5s slow down!
          world.particles.push(new Particle(t.x, t.y, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, '#e0f2fe', 2.5, 12));
        }

        if (this.isGeneHand) {
          this.isReturning = true;
          (this as any).grabbedTarget = t;
          this.piercing = true;
        }

        t.takeDamage(finalDmg, this.owner.name, world);

        // Crow poison
        if (this.owner && this.owner.id === 'crow') {
          t.poisonTimer = 4000;
          t.poisonDamage = Math.floor(this.damage * 0.25);
          t.poisonedBy = this.owner;
          t.lastPoisonTick = Date.now();
        }

        if (this.owner.id === 'edgar') this.owner.heal(Math.floor(this.damage * 0.35), world);
        if (this.owner.id === 'el_primo') t.burnTimer = 3000;
        this.owner.chargeSuper(10, world);
        if (this.owner === world.player) world.playerStats.shotsHit++;

        if (!this.piercing) {
          if (this.isJessieOrb) {
            this.bounceJessieOrb(world, t);
            return;
          }
          this.isDefunct = true;
          if (this.isCharlieHair) this.owner.charlieYoYoActive = false;
          if (this.isSpikeBall) this.splitSpikes(world);
          if (this.isJuiceShot) this.splitJuice(world);
          if (this.isYarnBall) this.explodeYarn(world);
          if (this.isBrockRocket) this.explodeBrockRocket(world);
          return;
        } else {
          this.hitTargets.add(t);
        }
      }
    }
  }

  splitSpikes(world: GameWorld) {
    const count = this.isSuper ? 12 : 6;
    for (let a = 0; a < Math.PI * 2; a += (Math.PI * 2) / count) {
      world.projectiles.push(new Projectile(this.x, this.y, a, 8, Math.floor(this.damage * 0.5), 90, this.owner, 4));
    }
  }

  splitJuice(world: GameWorld) {
    let splitCount = this.owner.upgradeTier >= 3 ? 4 : 2;
    let baseDmg = Math.floor(this.damage / 2);
    let angles = splitCount === 2
      ? [this.angle + Math.PI / 2, this.angle - Math.PI / 2]
      : [this.angle + Math.PI / 4, this.angle - Math.PI / 4, this.angle + 3 * Math.PI / 4, this.angle - 3 * Math.PI / 4];
    angles.forEach(a => {
      world.projectiles.push(new Projectile(this.x, this.y, a, 10, baseDmg, 120, this.owner, 6, false, false));
    });
  }

  explodeBrockRocket(world: GameWorld) {
    let radius = this.isSuper ? 130 : 90;
    let finalDmg = this.damage;
    for (let k = 0; k < (this.isSuper ? 16 : 10); k++) {
      let a = Math.random() * Math.PI * 2;
      let sp = 1.5 + Math.random() * 4;
      world.particles.push(new Particle(this.x, this.y, Math.cos(a) * sp, Math.sin(a) * sp, '#f97316', 2.5 + Math.random() * 2, 20));
    }
    world.playSound('break_box');
    world.triggerScreenShake(this.isSuper ? 10 : 5);

    const splashTargets = [world.player, ...world.bots].filter(b => b && b.hp > 0 && Math.hypot(b.x - this.x, b.y - this.y) < radius);
    splashTargets.forEach(t => {
      if (t !== this.owner) {
        t.takeDamage(finalDmg, this.owner ? this.owner.name : "Brock", world);
      }
    });

    const boxes = [...world.powerBoxes, ...world.mysteryBoxes].filter(b => Math.hypot(b.x - this.x, b.y - this.y) < radius);
    boxes.forEach(b => b.takeDamage(finalDmg, world));

    if (this.owner && this.owner.selectedStarPower === 'incendiary' && !this.isSuper) {
      let puddle = new Projectile(this.x, this.y, 0, 0, 400, 10, this.owner, 35);
      puddle.isBarleyPuddle = true;
      puddle.lobElapsed = 0;
      puddle.lobDuration = 2500;
      world.projectiles.push(puddle);
    }
  }

  bounceJessieOrb(world: GameWorld, hitTarget: Character) {
    if (this.bounces >= 2) {
      this.isDefunct = true;
      return;
    }
    const candidates = [world.player, ...world.bots].filter(c => c && c.hp > 0 && c !== this.owner && !this.hitTargets.has(c) && c !== hitTarget);
    let nearest: Character | null = null;
    let minDist = 240;
    for (let c of candidates) {
      let d = Math.hypot(c.x - this.x, c.y - this.y);
      if (d < minDist) {
        minDist = d; nearest = c;
      }
    }
    if (nearest) {
      this.bounces++;
      this.hitTargets.add(nearest);
      let angleTo = Math.atan2(nearest.y - this.y, nearest.x - this.x);
      let nextOrb = new Projectile(this.x, this.y, angleTo, 11, Math.floor(this.damage * 0.8), 240, this.owner, this.radius, false, false);
      nextOrb.isJessieOrb = true;
      nextOrb.bounces = this.bounces;
      nextOrb.hitTargets = new Set(this.hitTargets);
      world.projectiles.push(nextOrb);
    }
    this.isDefunct = true;
  }

  splitGeneSmokeBall(world: GameWorld) {
    const baseAngle = this.angle;
    for (let i = 0; i < 6; i++) {
      let a = baseAngle + (i - 2.5) * 0.2;
      let pellet = new Projectile(this.x, this.y, a, 10, Math.floor(this.damage * 0.25), 180, this.owner, 4);
      world.projectiles.push(pellet);
    }
  }

  explodeYarn(world: GameWorld) {
    // spawn explosion
    for (let k = 0; k < 12; k++) {
      let a = Math.random() * Math.PI * 2;
      world.particles.push(new Particle(this.x, this.y, Math.cos(a) * 3, Math.sin(a) * 3, '#fcd34d', 2, 15));
    }
    const splashTargets = [world.player, ...world.bots].filter(b => b && b.hp > 0 && Math.hypot(b.x - this.x, b.y - this.y) < 120);
    splashTargets.forEach(t => {
      if (t === this.owner.attachedTarget) {
        t.heal(1000, world);
      } else if (t !== this.owner) {
        t.takeDamage(this.damage, this.owner ? this.owner.name : "Yarn Ball", world);
      }
    });
  }

  draw(ctx: CanvasRenderingContext2D, world: GameWorld) {
    ctx.save();
    if (this.owner && this.owner.id === 'leon') {
      ctx.fillStyle = '#fbbf24'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.translate(this.x, this.y); ctx.rotate(Date.now() / 50);
      ctx.moveTo(0, -this.radius); ctx.lineTo(this.radius/2, -this.radius/2);
      ctx.lineTo(this.radius, 0); ctx.lineTo(this.radius/2, this.radius/2);
      ctx.lineTo(0, this.radius); ctx.lineTo(-this.radius/2, this.radius/2);
      ctx.lineTo(-this.radius, 0); ctx.lineTo(-this.radius/2, -this.radius/2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (this.owner && this.owner.id === 'crow') {
      ctx.fillStyle = this.owner.hyperActiveTimer > 0 ? '#e9d5ff' : '#a7f3d0';
      ctx.strokeStyle = '#059669'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.radius + 3, this.radius - 1, this.angle, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();
    } else if (this.bounce && this.isSuper) {
      ctx.fillStyle = 'rgba(236, 72, 153, 0.8)'; ctx.strokeStyle = '#be185d'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath(); ctx.arc(this.x - 6, this.y - 6, 5, 0, Math.PI*2); ctx.fill();
    } else if (this.isYarnBall) {
      ctx.fillStyle = '#fcd34d'; ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(this.x-4, this.y-4); ctx.lineTo(this.x+4, this.y+4); ctx.stroke();
    } else if (this.isCocoonWeb) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; ctx.strokeStyle = '#ec4899'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        let a = (i / 8) * Math.PI * 2;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + Math.cos(a) * this.radius, this.y + Math.sin(a) * this.radius);
      }
      ctx.stroke();
    } else if (this.isSnowball) {
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    } else if (this.isPiperBullet) {
      ctx.fillStyle = '#38bdf8'; ctx.shadowColor = '#00f'; ctx.shadowBlur = 10;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(this.x, this.y, this.radius + 6, this.radius - 2, this.angle, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    } else if (this.isPiperGrenade) {
      ctx.fillStyle = '#f43f5e'; ctx.strokeStyle = '#fda4af'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(this.x - 3, this.y - 3, 3, 0, Math.PI*2); ctx.fill();
    } else if (this.isDynamite) {
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(Date.now() / 80);
      ctx.fillStyle = '#ef4444'; ctx.strokeStyle = '#000000'; ctx.lineWidth = 2;
      ctx.fillRect(-10, -6, 20, 12); ctx.strokeRect(-10, -6, 20, 12);
      ctx.fillStyle = '#facc15'; ctx.fillRect(-3, -8, 6, 2);
      ctx.strokeStyle = '#fb923c'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(16, -2); ctx.stroke();
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(16, -2, 2.5, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    } else if (this.isBigBomb) {
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(Date.now() / 150);
      ctx.fillStyle = '#4b5563'; ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(0, 0, this.radius - 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText("TNT", 0, 3);
      ctx.restore();
    } else if (this.isFrankHammer) {
      ctx.save();
      ctx.fillStyle = this.isFrankSuper ? 'rgba(168, 85, 247, 0.6)' : 'rgba(100, 116, 139, 0.5)';
      ctx.strokeStyle = this.isFrankSuper ? '#a855f7' : '#4b5563';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, this.angle - 0.9, this.angle + 0.9);
      ctx.stroke();
      ctx.restore();
    } else if (this.isMusicWave) {
      ctx.save();
      ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, this.angle - 0.7, this.angle + 0.7);
      ctx.stroke();
      ctx.fillStyle = '#111827';
      ctx.font = '14px sans-serif';
      ctx.fillText(Math.random() > 0.5 ? "🎵" : "🎶", this.x - 7, this.y + 5);
      ctx.restore();
    } else if (this.isPocoSuper) {
      ctx.save();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, this.angle - 1.1, this.angle + 1.1);
      ctx.stroke();
      ctx.restore();
    } else if (this.isTarotCard) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.fillStyle = '#ec4899';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-12, -7, 24, 14);
      ctx.strokeRect(-12, -7, 24, 14);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    } else if (this.isTaraSuper) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(Date.now() / 100);
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Swirling internal eye
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius / 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (this.isTickCluster) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(Date.now() / 120);
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // red glowing fuse
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, -this.radius + 2, 4, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    } else if (this.isTickMine) {
      ctx.save();
      ctx.fillStyle = (Math.floor(Date.now() / 250) % 2 === 0) ? '#ef4444' : '#64748b';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x - 2, this.y - 2, 2.5, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    } else if (this.isTickHead) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // windup key on top
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -this.radius);
      ctx.lineTo(0, -this.radius - 5);
      ctx.stroke();
      ctx.restore();
    } else if (this.isAmberOil) {
      ctx.save();
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.radius, this.radius / 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (this.isAmberPuddle) {
      ctx.save();
      ctx.fillStyle = this.isIgnited ? 'rgba(249, 115, 22, 0.7)' : 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = this.isIgnited ? '#ef4444' : '#000000';
      ctx.lineWidth = this.isIgnited ? 3.5 : 1.5;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.radius, this.radius / 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (this.isAmberFire) {
      ctx.save();
      let colorVal = Math.random() > 0.5 ? '#f97316' : '#ea580c';
      ctx.fillStyle = colorVal;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + Math.random() * 4, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    } else if (this.isMortisShovel) {
      ctx.save();
      ctx.fillStyle = 'rgba(147, 51, 234, 0.45)'; ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, this.angle - 1.2, this.angle + 1.2); ctx.stroke();
      ctx.restore();
    } else if (this.isMortisBat) {
      ctx.fillStyle = '#1e1b4b'; ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c084fc'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText("🦇", this.x, this.y + 4);
    } else if (this.isCharlieHair) {
      ctx.strokeStyle = '#fbcfe8'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(this.owner.x, this.owner.y); ctx.lineTo(this.x, this.y); ctx.stroke();
      ctx.fillStyle = '#db2777'; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill();
    } else if (this.owner && (this.owner.brawlerType === 'punch' || this.owner.brawlerType === 'dash' || this.owner.brawlerType === 'scarf' || this.owner.brawlerType === 'swing' || this.owner.brawlerType === 'shoe' || this.owner.brawlerType === 'attach')) {
      if (this.isSneakerKick) {
        ctx.fillStyle = '#3b82f6'; ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, this.angle - 0.5, this.angle + 0.5); ctx.stroke();
      } else if (this.owner.brawlerType === 'attach' && !this.isYarnBall) {
        ctx.fillStyle = '#fbbf24'; ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, this.angle - 0.4, this.angle + 0.4); ctx.stroke();
      } else {
        ctx.fillStyle = this.isSuper ? 'rgba(56, 189, 248, 0.45)' : 'rgba(239, 68, 68, 0.35)'; 
        ctx.strokeStyle = this.isSuper ? '#38bdf8' : 'rgba(239, 68, 68, 0.8)';
        if (this.owner.brawlerType === 'swing') { ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; ctx.strokeStyle = 'rgba(203, 213, 225, 0.8)'; } 
        ctx.lineWidth = this.isSuper ? 4.5 : 2.5; let arcWidth = this.owner.brawlerType === 'dash' ? 0.8 : 0.5;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, this.angle - arcWidth, this.angle + arcWidth); ctx.stroke();
      }
    } else {
      ctx.fillStyle = this.isSuper ? '#facc15' : (this.owner && this.owner.isBot ? '#ef4444' : '#fbbf24');
      ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

export class Character {
  x: number; y: number; id: string; name: string; skinId: string; color: string; secondary: string; skinColor: string;
  maxHp: number; hp: number; damage: number; speed: number; attackRange: number; bulletSpeed: number;
  maxAmmo: number; ammo: number; reloadTime: number; reloadTimer: number; attackCooldown: number; lastAttackTime: number;
  lastCombatTime: number; lastHealParticle: number; brawlerType: string; powerCubes: number; isBot: boolean; radius: number;
  facingAngle: number; inBush: boolean; isMoving: boolean; superCharge: number; superReady: boolean; starPowerUnlocked: boolean;
  hyperUnlocked: boolean; hyperCharge: number; hyperActiveTimer: number; poisonTimer: number; poisonDamage: number;
  poisonedBy: Character | null; lastPoisonTick: number; isJumping: boolean; jumpStartX: number; jumpStartY: number;
  jumpTargetX: number; jumpTargetY: number; jumpDuration: number; jumpElapsed: number; speedBoostTimer: number;
  invisibleTimer: number; isClone: boolean; owner: Character | null; energyDrinkTimer: number; shieldTimer: number;
  burnTimer: number; bandAidUsed: boolean; bandAidCooldown: number; gadgetUses: number; gadgetCooldown: number;
  aiState: string; aiTimer: number; aiTarget: Character | any; aiDir: { x: number; y: number }; strafeDir: number;
  personality: string; skillTier: string; isSpider: boolean; isOpponent: boolean = false; opponentRole?: string;
  random: SeededRandom;

  // Team Deathmatch properties
  team?: 'red' | 'blue' | null = null;
  isDead?: boolean = false;
  deathTimer?: number = 0;
  spawnShieldTimer?: number = 0;

  // Customized loadout properties
  selectedGadget: string = '';
  selectedStarPower: string = '';
  selectedGears: string[] = [];
  shieldGearHp: number = 0;
  maxShieldGearHp: number = 900;
  hardcoreShieldHp: number = 0;

  // Active loadout effects flags
  clayPigeonsActive: boolean = false;
  silverBulletActive: boolean = false;
  extraStickyActive: boolean = false;
  satchelChargeActive: boolean = false;
  homemadeRecipeActive: boolean = false;
  survivalShovelTimer: number = 0;

  // New Gimmicks
  upgradeTier: number = 0;
  isFangDashing: boolean = false;
  fangChainCount: number = 0;
  fangDashTarget: { x: number; y: number } | null = null;
  fangDashSpeed: number = 22;
  attachedTarget: Character | null = null;
  attachTimer: number = 0;
  isAttachedToAlly: boolean = false;
  stunTimer: number = 0;
  kitSeekingAttachment: boolean = false;
  charlieYoYoActive: boolean = false;
  isCocooned: boolean = false;
  cocoonVisualTimer: number = 0;
  lastKitScratch: number = 0;
  lastGasDmgTick: number = 0;
  activeEmote: string = '';
  activeEmoteTimer: number = 0;

  constructor(x: number, y: number, template: BrawlerTemplate, isBot = false, botName = "Bot", skinId = 'default', baseSeed: number = 12345) {
    this.x = x; this.y = y; this.id = template.id; this.name = isBot ? botName : template.name; this.skinId = skinId;
    const skinInfo = (SKIN_DATA[this.id] && SKIN_DATA[this.id][skinId]) || (SKIN_DATA[this.id] && SKIN_DATA[this.id]['default']) || { color: '#ffffff', skinColor: '#ffedd5', secondary: '#000000', cost: 0 };
    this.color = skinInfo.color; this.secondary = skinInfo.secondary; this.skinColor = skinInfo.skinColor;

    // Helper for computing string hash
    let hash = 0;
    const strToHash = isBot ? botName : template.name;
    for (let i = 0; i < strToHash.length; i++) {
      hash = (hash << 5) - hash + strToHash.charCodeAt(i);
      hash |= 0;
    }
    this.random = new SeededRandom(baseSeed + Math.abs(hash));

    let level = isBot ? Math.floor(this.random.next() * 5) + 1 : 1; // Dynamically bound to levels inside react code
    let statMultiplier = 1 + (level - 1) * 0.05;

    this.maxHp = Math.floor(template.hp * statMultiplier * (isBot ? 0.40 : 1.0));
    this.hp = this.maxHp;
    this.damage = Math.floor(template.damage * statMultiplier * 0.40);
    this.speed = template.speed * 0.58;
    this.attackRange = template.attackRange * 0.90;
    this.bulletSpeed = template.bulletSpeed;

    this.maxAmmo = 3; this.ammo = 3;
    this.reloadTime = template.reloadTime * 1.5; this.reloadTimer = 0;
    this.attackCooldown = 200; this.lastAttackTime = 0;
    this.lastCombatTime = Date.now(); this.lastHealParticle = 0;
    this.brawlerType = template.type; this.powerCubes = 0; this.isBot = isBot; this.radius = 24; this.facingAngle = 0;
    this.inBush = false; this.isMoving = false; this.superCharge = 0; this.superReady = false;

    this.starPowerUnlocked = false; this.hyperUnlocked = false; this.hyperCharge = 0; this.hyperActiveTimer = 0;
    this.poisonTimer = 0; this.poisonDamage = 0; this.poisonedBy = null; this.lastPoisonTick = 0;
    this.isJumping = false; this.jumpStartX = 0; this.jumpStartY = 0; this.jumpTargetX = 0; this.jumpTargetY = 0;
    this.jumpDuration = 650; this.jumpElapsed = 0; this.speedBoostTimer = 0;
    this.invisibleTimer = 0; this.isClone = false; this.owner = null;
    this.energyDrinkTimer = 0; this.shieldTimer = 0; this.burnTimer = 0; this.bandAidUsed = false; this.bandAidCooldown = 0;
    this.survivalShovelTimer = 0;
    this.homemadeRecipeActive = false;
    this.gadgetUses = 3; this.gadgetCooldown = 0; this.aiState = 'wander'; this.aiTimer = 0; this.aiDir = { x: 0, y: 0 };
    this.strafeDir = this.random.next() > 0.5 ? 1 : -1;
    this.personality = 'aggro'; this.skillTier = 'average'; this.isSpider = false;
  }

  applyLoadout() {
    if (this.selectedGears && this.selectedGears.includes('shield')) {
      this.shieldGearHp = 900;
    }
    if (this.selectedGears && this.selectedGears.includes('gadget_charge')) {
      this.gadgetUses = 4;
    }
    if (this.selectedStarPower === 'slick_boots') {
      this.speed *= 1.12;
    }
    if (this.selectedStarPower === 'magnum_special') {
      this.attackRange *= 1.15;
      this.bulletSpeed *= 1.15;
    }
  }

  getDamage() {
    let d = Math.floor(this.damage * (1 + this.powerCubes * 0.12));
    if (this.energyDrinkTimer > 0) d *= 2.0;
    if (this.hyperActiveTimer > 0) d = Math.floor(d * 1.25);
    // Mico's Gadget Buffs Damage
    if (this.id === 'mico' && this.speedBoostTimer > 0) d = Math.floor(d * 1.40);
    // Damage Gear: +15% damage when HP < 50%
    if (this.selectedGears && this.selectedGears.includes('damage') && (this.hp / this.getMaxHp() <= 0.5)) {
      d = Math.floor(d * 1.15);
    }
    return d;
  }

  getMaxHp() { return this.maxHp + this.powerCubes * 400; }

  chargeSuper(amount: number, world: GameWorld) {
    if (this.isClone || this.isSpider) return;
    if (this.hyperUnlocked && this.hyperCharge < 100) {
      this.hyperCharge += amount * 0.4;
      if (this.hyperCharge >= 100) {
        this.hyperCharge = 100;
        if (!this.isBot) world.playSound('power_up');
      }
    }
    if (this.superCharge < 100) {
      this.superCharge += amount;
      if (this.superCharge >= 100) {
        this.superCharge = 100;
        if (!this.isBot) world.playSound('super_ready');
        else this.superReady = true;
      }
    }
  }

  chargeHyper(amount: number) {
    if (this.hyperUnlocked && this.hyperActiveTimer <= 0) {
      this.hyperCharge = Math.min(100, this.hyperCharge + amount);
    }
  }

  activateHypercharge(world: GameWorld) {
    if (this.hyperUnlocked && this.hyperCharge >= 100 && this.hyperActiveTimer <= 0) {
      this.hyperActiveTimer = 5000;
      this.hyperCharge = 0;
      world.playSound('super_ready');
      world.triggerScreenShake(12);
      world.floatingTexts.push(new FloatingText(this.x, this.y - 45, "🔥 HYPERCHARGE!", '#d946ef', 22));
    }
  }

  heal(amount: number, world: GameWorld) {
    if (this.hp <= 0) return;
    const previousHp = this.hp;
    this.hp = Math.min(this.getMaxHp(), this.hp + amount);
    const actualHealed = Math.floor(this.hp - previousHp);
    if (actualHealed > 0 && !this.isClone && !this.isSpider) {
      world.floatingTexts.push(new FloatingText(this.x, this.y - 48, `+${actualHealed} HP`, '#10b981', 16));
    }
  }

  takeDamage(amount: number, attackerName: string, world: GameWorld) {
    if (this.isDead || (this.spawnShieldTimer && this.spawnShieldTimer > 0)) return;
    if (this.isJumping) return;
    if (this.id === 'kenji' && this.shieldTimer > 0) amount = Math.floor(amount * 0.75);
    if (this.id === 'kit' && this.attachedTarget && this.isAttachedToAlly) return; // Invulnerable
    if (this.hyperActiveTimer > 0) amount = Math.floor(amount * 0.75);
    if (this.isClone) amount *= 2;
    if (this.isSpider) amount *= 1.5;

    // Star Power: Batting Stance (Bibi gets 20% shield when Home Run bar is fully charged)
    if (this.id === 'bibi' && this.selectedStarPower === 'batting_stance' && (this as any).homeRunCharge >= 100) {
      amount = Math.floor(amount * 0.80);
    }

    let initialAmount = amount;

    // Hardcore Shield (Edgar gadget shield)
    if (this.hardcoreShieldHp > 0) {
      if (amount <= this.hardcoreShieldHp) {
        this.hardcoreShieldHp -= amount;
        amount = 0;
      } else {
        amount -= this.hardcoreShieldHp;
        this.hardcoreShieldHp = 0;
      }
    }

    // Shield Gear (900 HP recharging shield)
    if (this.selectedGears && this.selectedGears.includes('shield') && this.shieldGearHp > 0 && amount > 0) {
      if (amount <= this.shieldGearHp) {
        this.shieldGearHp -= amount;
        amount = 0;
      } else {
        amount -= this.shieldGearHp;
        this.shieldGearHp = 0;
      }
    }

    this.hp -= amount;
    this.lastCombatTime = Date.now();

    if (!this.isClone && !this.isSpider) {
      world.floatingTexts.push(new FloatingText(this.x, this.y - 32, `-${initialAmount}`, '#f87171', 20));
    }
    if (!this.isBot && !this.isClone && !this.isSpider) {
      world.triggerScreenShake(6);
      world.playSound('hit');
      world.playerStats.damageDealt += amount;
    }
    if (this.hp <= 0) { this.hp = 0; this.die(attackerName, world); }
  }

  die(attackerName: string, world: GameWorld) {
    // spawn explosion particles
    for (let i = 0; i < 14; i++) {
      let a = Math.random() * Math.PI * 2;
      let speed = 2 + Math.random() * 3;
      world.particles.push(new Particle(this.x, this.y, Math.cos(a) * speed, Math.sin(a) * speed, this.color, 2 + Math.random() * 2, 20));
    }

    if (this.id === 'surge') this.upgradeTier = 0;
    if (this.id === 'fang') this.isFangDashing = false;
    if (this.id === 'kit' && this.attachedTarget) {
      if (!this.isAttachedToAlly) this.attachedTarget.stunTimer = 0;
      this.attachedTarget = null;
    }

    if (world.gameMode === 'tdm') {
      if (this.team === 'blue') {
        world.redScore = (world.redScore || 0) + 1;
      } else if (this.team === 'red') {
        world.blueScore = (world.blueScore || 0) + 1;
      }
      this.isDead = true;
      this.deathTimer = 4000;
      this.hp = 0;
      world.playSound('defeat');
      if (!this.isClone && !this.isSpider) {
        world.addKillFeed(attackerName, this.name, attackerName === "Toxic Gas");
      }
      return;
    }

    if (!this.isClone && !this.isSpider) {
      for (let i = 0; i < 1 + this.powerCubes; i++) {
        world.powerCubes.push(new PowerCube(this.x + (Math.random() - 0.5) * 40, this.y + (Math.random() - 0.5) * 40));
      }
      world.addKillFeed(attackerName, this.name, attackerName === "Toxic Gas");
    }

    if (this.isBot || this.isClone || this.isSpider || this.isOpponent) {
      world.bots = world.bots.filter(b => b !== this);
      world.playSound('defeat');
    }
  }

  useGadget(world: GameWorld) {
    if (!this.isBot && !this.selectedGadget) return; // Enforce purchase & equip constraint for players
    if (this.gadgetUses <= 0 || this.gadgetCooldown > 0 || this.hp <= 0 || this.isJumping || this.isClone || this.stunTimer > 0) return;
    this.gadgetUses--;
    this.gadgetCooldown = 5000;

    world.floatingTexts.push(new FloatingText(this.x, this.y - 50, "🟢 GADGET!", '#22c55e', 18));
    world.playSound('power_up');

    for (let i = 0; i < 12; i++) {
      let a = (i / 12) * Math.PI * 2;
      world.particles.push(new Particle(this.x, this.y, Math.cos(a) * 3, Math.sin(a) * 3, '#22c55e', 3, 20));
    }

    const gId = this.selectedGadget || (this.id === 'shelly' ? 'fast_forward' : 
                this.id === 'colt' ? 'speedy_boots' : 
                this.id === 'el_primo' ? 'suplex_supplement' : 
                this.id === 'spike' ? 'popping_pincushion' : 
                this.id === 'kenji' ? 'hosomaki_dash' : 
                this.id === 'edgar' ? 'lets_fly' : 
                this.id === 'bibi' ? 'vitamin_z' : 
                this.id === 'leon' ? 'clone_projector' : 
                this.id === 'crow' ? 'defense_booster' : 
                this.id === 'gale' ? 'spring_ejector' : 
                this.id === 'mico' ? 'monkey_fury' : 
                this.id === 'charlie' ? 'spiders_swarm' : '');

    if (gId === 'fast_forward') {
      let dashDist = 150;
      let tx = this.x + Math.cos(this.facingAngle) * dashDist;
      let ty = this.y + Math.sin(this.facingAngle) * dashDist;
      this.x = Math.max(50, Math.min(world.WORLD_SIZE - 50, tx));
      this.y = Math.max(50, Math.min(world.WORLD_SIZE - 50, ty));
    }
    else if (gId === 'clay_pigeons') {
      this.clayPigeonsActive = true;
      world.floatingTexts.push(new FloatingText(this.x, this.y - 20, "🎯 Clay Pigeons Active!", '#22c55e', 16));
    }
    else if (gId === 'speedy_boots') {
      this.speedBoostTimer = 4000; // 4s boost
      world.floatingTexts.push(new FloatingText(this.x, this.y - 20, "🥾 Speedy Boots!", '#10b981', 18));
    }
    else if (gId === 'silver_bullet') {
      this.silverBulletActive = true;
      world.floatingTexts.push(new FloatingText(this.x, this.y - 20, "☄️ Silver Bullet Active!", '#38bdf8', 16));
    }
    else if (gId === 'suplex_supplement') {
      let nearest: Character | null = null;
      let minDist = 120;
      const candidates = [world.player, ...world.bots].filter(b => b !== this && b && b.hp > 0);
      for (let c of candidates) {
        let d = Math.hypot(c.x - this.x, c.y - this.y);
        if (d < minDist) { minDist = d; nearest = c; }
      }
      if (nearest) {
        // Toss backward over head!
        let angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
        let tx = this.x - Math.cos(angle) * 120;
        let ty = this.y - Math.sin(angle) * 120;
        nearest.x = Math.max(50, Math.min(world.WORLD_SIZE - 50, tx));
        nearest.y = Math.max(50, Math.min(world.WORLD_SIZE - 50, ty));
        world.floatingTexts.push(new FloatingText(nearest.x, nearest.y - 40, "🤼 Suplex!", '#fb923c', 16));
      } else {
        this.gadgetUses++; this.gadgetCooldown = 0;
      }
    }
    else if (gId === 'asteroid_belt') {
      let nearest: Character | null = null;
      let minDist = Infinity;
      const candidates = [world.player, ...world.bots].filter(b => b !== this && b && b.hp > 0);
      for (let c of candidates) {
        let d = Math.hypot(c.x - this.x, c.y - this.y);
        if (d < minDist) { minDist = d; nearest = c; }
      }
      if (nearest) {
        world.activeMeteors.push(new MeteorTarget(nearest.x, nearest.y));
        world.floatingTexts.push(new FloatingText(nearest.x, nearest.y - 40, "☄️ Asteroid Summoned!", '#ef4444', 16));
      } else {
        this.gadgetUses++; this.gadgetCooldown = 0;
      }
    }
    else if (gId === 'popping_pincushion') {
      for (let a = 0; a < Math.PI * 2; a += (Math.PI * 2) / 10) {
        world.projectiles.push(new Projectile(this.x, this.y, a, this.bulletSpeed * 1.1, this.getDamage() * 0.7, this.attackRange * 0.8, this, 6, false, false));
      }
    }
    else if (gId === 'life_plant') {
      // Heal Spike fully
      this.heal(2500, world);
      world.floatingTexts.push(new FloatingText(this.x, this.y - 20, "🌻 Fertilized Life Plant!", '#22c55e', 16));
    }
    else if (gId === 'hosomaki_dash') {
      const targets = [world.player, ...world.bots].filter(b => b !== this && b && b.hp > 0 && !b.isClone);
      let hits = 0;
      targets.forEach(t => {
        if (Math.hypot(t.x - this.x, t.y - this.y) < 140) {
          t.takeDamage(800, this.name, world);
          hits++;
        }
      });
      if (hits > 0) this.heal(hits * 250, world);
      world.particles.push(new CircleSlashParticle(this.x, this.y, 110, 'rgba(56, 189, 248, 0.7)'));
    }
    else if (gId === 'nigiri_shield') {
      this.shieldTimer = 3000;
      world.floatingTexts.push(new FloatingText(this.x, this.y - 20, "🍙 Nigiri Shield!", '#38bdf8', 16));
    }
    else if (gId === 'lets_fly') {
      this.chargeSuper(50, world);
    }
    else if (gId === 'hardcore') {
      this.hardcoreShieldHp = 1500;
      world.floatingTexts.push(new FloatingText(this.x, this.y - 20, "🛡️ Hardcore Shield!", '#a855f7', 16));
    }
    else if (gId === 'vitamin_z') {
      this.heal(2400, world);
    }
    else if (gId === 'extra_sticky') {
      this.extraStickyActive = true;
      world.floatingTexts.push(new FloatingText(this.x, this.y - 20, "🍬 Sticky Bubble Charge!", '#ec4899', 16));
    }
    else if (gId === 'clone_projector') {
      let clone = new Character(this.x + 20, this.y, BRAWLER_TEMPLATES['leon'], true, this.name, this.skinId);
      clone.isClone = true;
      clone.owner = this;
      clone.maxHp = this.maxHp;
      clone.hp = this.hp;
      clone.damage = 0;
      clone.powerCubes = this.powerCubes;
      world.bots.push(clone);
    }
    else if (gId === 'lollipop_drop') {
      this.invisibleTimer = 4000;
      world.floatingTexts.push(new FloatingText(this.x, this.y - 20, "🍭 Lollipop Stealth!", '#f472b6', 16));
    }
    else if (gId === 'defense_booster') {
      this.shieldTimer = 3000;
      world.floatingTexts.push(new FloatingText(this.x, this.y - 20, "🛡️ Defense Booster!", '#10b981', 16));
    }
    else if (gId === 'slowing_toxin') {
      const targets = [world.player, ...world.bots].filter(b => b !== this && b && b.hp > 0 && b.poisonTimer > 0);
      targets.forEach(t => {
        t.speedBoostTimer = -3500;
        world.floatingTexts.push(new FloatingText(t.x, t.y - 20, "🤢 SLOWED!", '#10b981', 16));
      });
    }
    else if (gId === 'spring_ejector' || this.id === 'gale') {
      world.jumpPads.push(new JumpPad(this.x, this.y, this.facingAngle));
      world.floatingTexts.push(new FloatingText(this.x, this.y - 20, "🌀 Spring Pad Deployed!", '#67e8f9', 15));
    }
    else if (gId === 'monkey_fury' || this.id === 'mico') {
      this.speedBoostTimer = 4000; // 4s boost
      world.floatingTexts.push(new FloatingText(this.x, this.y - 20, "⚡ Monkey Fury!", '#facc15', 18));
    }
    else if (gId === 'spiders_swarm' || this.id === 'charlie') {
      for (let i = 0; i < 3; i++) {
        let spawnAngle = this.facingAngle + (i - 1) * 0.5;
        let spider = new Character(this.x + Math.cos(spawnAngle) * 40, this.y + Math.sin(spawnAngle) * 40, BRAWLER_TEMPLATES['kit'], true, "🕷️ Charlie's Spider", 'default');
        spider.isSpider = true;
        spider.maxHp = 800; spider.hp = 800; spider.damage = 150;
        spider.speed = 4.8;
        spider.color = '#111827';
        spider.personality = 'aggro';
        world.bots.push(spider);
      }
    }
    else if (gId === 'survival_shovel') {
      this.survivalShovelTimer = 5000;
      world.floatingTexts.push(new FloatingText(this.x, this.y - 20, "🧹 Survival Shovel!", '#d946ef', 16));
    }
    else if (gId === 'combo_spinner') {
      world.floatingTexts.push(new FloatingText(this.x, this.y - 20, "🌀 Combo Spinner!", '#a855f7', 16));
      world.particles.push(new CircleSlashParticle(this.x, this.y, 140, 'rgba(168, 85, 247, 0.6)'));
      const targets = [world.player, ...world.bots].filter(b => b !== this && b && b.hp > 0 && !b.isClone && !b.isSpider);
      targets.forEach(t => {
        if (Math.hypot(t.x - this.x, t.y - this.y) < 140) {
          t.takeDamage(1300, this.name, world);
        }
      });
    }
    else if (gId === 'auto_aimer') {
      world.floatingTexts.push(new FloatingText(this.x, this.y - 20, "🔫 Auto Aimer!", '#ec4899', 16));
      let nearest: Character | null = null;
      let minDist = 300;
      const candidates = [world.player, ...world.bots].filter(b => b !== this && b && b.hp > 0);
      for (let c of candidates) {
        let d = Math.hypot(c.x - this.x, c.y - this.y);
        if (d < minDist) { minDist = d; nearest = c; }
      }
      if (nearest) {
        let angleToEnemy = Math.atan2(nearest.y - this.y, nearest.x - this.x);
        let bullet = new Projectile(this.x, this.y, angleToEnemy, 24, 500, 240, this, 6);
        nearest.speedBoostTimer = -2000;
        let pushDist = 80;
        let tx = nearest.x + Math.cos(angleToEnemy) * pushDist;
        let ty = nearest.y + Math.sin(angleToEnemy) * pushDist;
        nearest.x = Math.max(50, Math.min(world.WORLD_SIZE - 50, tx));
        nearest.y = Math.max(50, Math.min(world.WORLD_SIZE - 50, ty));
        world.projectiles.push(bullet);
      }
    }
    else if (gId === 'homemade_recipe') {
      this.homemadeRecipeActive = true;
      world.floatingTexts.push(new FloatingText(this.x, this.y - 20, "🍲 Homemade Recipe Active!", '#fb7185', 16));
    }
    else if (gId === 'fidget_spinner') {
      this.speedBoostTimer = 3000;
      world.floatingTexts.push(new FloatingText(this.x, this.y - 20, "🎡 Fidget Spinner!", '#eab308', 16));
      for (let i = 0; i < 4; i++) {
        let a = (Math.PI / 2) * i;
        let stick = new Projectile(this.x, this.y, a, 0, 1000, 120, this, 8);
        stick.isDynamite = true;
        stick.lobTargetX = this.x + Math.cos(a) * 100;
        stick.lobTargetY = this.y + Math.sin(a) * 100;
        stick.lobElapsed = 0;
        stick.lobDuration = 600;
        world.projectiles.push(stick);
      }
    }
    else if (gId === 'satchel_charge') {
      this.satchelChargeActive = true;
      world.floatingTexts.push(new FloatingText(this.x, this.y - 20, "🎒 Satchel Charge!", '#facc15', 16));
    }
  }

  fire(angle: number, targetDist: number | null, world: GameWorld, forceSuper?: boolean) {
    if (this.isJumping || this.isClone || this.stunTimer > 0) return;
    const now = Date.now();
    if (now - this.lastAttackTime < this.attackCooldown) return;

    this.facingAngle = angle;
    let isSuper = false;

    if (this.invisibleTimer > 0 && this.superCharge < 100) {
      this.invisibleTimer = 0;
    }

    if (this.id === 'charlie' && this.charlieYoYoActive && !this.superReady) {
      // Charlie cannot fire hair yo-yo while another hair yo-yo is active
      return;
    }

    if (forceSuper !== undefined) {
      isSuper = forceSuper;
      if (isSuper) {
        this.superCharge = 0;
        this.superReady = false;
        world.playSound('super');
        world.triggerScreenShake(10);
      } else {
        if (this.ammo < 1) return;
        this.ammo--;
        world.playSound('shoot');
        if (this === world.player) world.playerStats.shotsFired++;
      }
    } else {
      if (this.superReady && this.superCharge >= 100) {
        isSuper = true; this.superCharge = 0; this.superReady = false;
        world.playSound('super'); world.triggerScreenShake(10);
      } else {
        if (this.ammo < 1) return;
        this.ammo--; world.playSound('shoot');
        if (this === world.player) world.playerStats.shotsFired++;
      }
    }

    this.lastAttackTime = now; this.lastCombatTime = now;

    if (this.id === 'kenji' && this.brawlerType === 'dash') this.shieldTimer = 1500;

    // Gale Cold wind logic
    if (this.id === 'gale') {
      if (isSuper) {
        // gale Super: massive blizzard wave
        let steps = 14;
        let projWidth = 140;
        for (let i = -2; i <= 2; i++) {
          let projAngle = angle + i * 0.12;
          let storm = new Projectile(this.x, this.y, projAngle, 16, this.getDamage() * 1.2, this.attackRange * 1.5, this, 35, false, true, true);
          storm.isSnowball = true;
          world.projectiles.push(storm);
        }
      } else {
        // Gale Attack: 5 cold wind snowballs fired parallel
        for (let i = -2; i <= 2; i++) {
          let offsetAngle = angle + i * 0.08;
          let ball = new Projectile(this.x, this.y, offsetAngle, this.bulletSpeed, this.getDamage() * 0.8, this.attackRange, this, 10, false, false);
          ball.isSnowball = true;
          world.projectiles.push(ball);
        }
      }
    }
    // Mico Hopper logic
    else if (this.id === 'mico') {
      if (isSuper) {
        // Mico Super: Launches extremely high, then slams down
        this.isJumping = true; this.jumpElapsed = 0; this.jumpStartX = this.x; this.jumpStartY = this.y;
        this.jumpDuration = 1200;
        let targetLeapDist = targetDist !== null ? Math.min(480, targetDist) : 480;
        this.jumpTargetX = Math.max(50, Math.min(world.WORLD_SIZE - 50, this.x + Math.cos(angle) * targetLeapDist));
        this.jumpTargetY = Math.max(50, Math.min(world.WORLD_SIZE - 50, this.y + Math.sin(angle) * targetLeapDist));
        world.playSound('super');
      } else {
        // Mico Basic Attack: A forward leap that deals splash damage on landing and avoids damage mid-air!
        this.isJumping = true; this.jumpElapsed = 0; this.jumpStartX = this.x; this.jumpStartY = this.y;
        this.jumpDuration = 380;
        let targetHopDist = 125;
        this.jumpTargetX = Math.max(50, Math.min(world.WORLD_SIZE - 50, this.x + Math.cos(angle) * targetHopDist));
        this.jumpTargetY = Math.max(50, Math.min(world.WORLD_SIZE - 50, this.y + Math.sin(angle) * targetHopDist));
      }
    }
    // Charlie Cocoon logic
    else if (this.id === 'charlie') {
      if (isSuper) {
        // Charlie Super: Web cocoon projectile
        let web = new Projectile(this.x, this.y, angle, 16, 200, 320, this, 14, false, false, true);
        web.isCocoonWeb = true;
        world.projectiles.push(web);
      } else {
        // Charlie Attack: YoYo hair
        this.charlieYoYoActive = true;
        let hair = new Projectile(this.x, this.y, angle, 15, this.getDamage(), this.attackRange, this, 10, false, false);
        hair.isCharlieHair = true;
        world.projectiles.push(hair);
      }
    }
    // Mortis logic
    else if (this.id === 'mortis') {
      if (isSuper) {
        let bat = new Projectile(this.x, this.y, angle, 12, this.getDamage() * 1.2, 380, this, 26, false, true, true);
        bat.isMortisBat = true;
        world.projectiles.push(bat);
      } else {
        let dashDist = 100;
        let startX = this.x;
        let startY = this.y;
        let tx = this.x + Math.cos(angle) * dashDist;
        let ty = this.y + Math.sin(angle) * dashDist;
        tx = Math.max(50, Math.min(world.WORLD_SIZE - 50, tx));
        ty = Math.max(50, Math.min(world.WORLD_SIZE - 50, ty));
        
        let collided = false;
        for (let obs of world.obstacles) {
          if (Math.hypot(tx - obs.x, ty - obs.y) < obs.radius + this.radius) {
            collided = true;
            break;
          }
        }
        if (!collided) {
          this.x = tx; this.y = ty;
        }
        
        let swipe = new Projectile(startX, startY, angle, 24, this.getDamage(), 145, this, 55, false, true);
        swipe.isMortisShovel = true;
        world.projectiles.push(swipe);
      }
    }
    // Piper logic
    else if (this.id === 'piper') {
      if (isSuper) {
        this.isJumping = true; this.jumpElapsed = 0; this.jumpStartX = this.x; this.jumpStartY = this.y;
        this.jumpDuration = 1000;
        let targetLeapDist = targetDist !== null ? Math.min(360, targetDist) : 360;
        this.jumpTargetX = Math.max(50, Math.min(world.WORLD_SIZE - 50, this.x + Math.cos(angle) * targetLeapDist));
        this.jumpTargetY = Math.max(50, Math.min(world.WORLD_SIZE - 50, this.y + Math.sin(angle) * targetLeapDist));
        
        const offsets = [
          { x: -35, y: -35 }, { x: 35, y: -35 },
          { x: -35, y: 35 }, { x: 35, y: 35 }
        ];
        offsets.forEach(off => {
          let grenade = new Projectile(this.x + off.x, this.y + off.y, 0, 0, this.getDamage() * 1.35, 10, this, 10);
          grenade.isPiperGrenade = true;
          setTimeout(() => {
            if (world.player) {
              grenade.isDefunct = true;
              for (let k = 0; k < 12; k++) {
                let a = Math.random() * Math.PI * 2;
                world.particles.push(new Particle(grenade.x, grenade.y, Math.cos(a) * 4, Math.sin(a) * 4, '#fb7185', 3, 20));
              }
              const splashTargets = [world.player, ...world.bots].filter(b => b && b.hp > 0 && Math.hypot(b.x - grenade.x, b.y - grenade.y) < 130);
              splashTargets.forEach(t => {
                if (t !== this) {
                  t.takeDamage(grenade.damage, this.name, world);
                }
              });
            }
          }, 750);
          world.projectiles.push(grenade);
        });
      } else {
        let bSpeed = 22;
        let bRange = this.attackRange;
        let isHoming = false;
        if (this.homemadeRecipeActive) {
          this.homemadeRecipeActive = false;
          bSpeed = 28;
          bRange *= 1.3;
          isHoming = true;
          world.floatingTexts.push(new FloatingText(this.x, this.y - 20, "🍲 Homemade Recipe!", '#10b981', 16));
        }
        let bullet = new Projectile(this.x, this.y, angle, bSpeed, this.getDamage(), bRange, this, 14, false, false);
        bullet.isPiperBullet = true;
        bullet.isHomemadeRecipe = isHoming;
        world.projectiles.push(bullet);
      }
    }
    // Frank logic
    else if (this.id === 'frank') {
      if (isSuper) {
        let wave = new Projectile(this.x, this.y, angle, 15, this.getDamage() * 1.2, this.attackRange * 1.5, this, 45, false, true, true);
        wave.isFrankHammer = true;
        wave.isFrankSuper = true;
        world.projectiles.push(wave);
      } else {
        let wave = new Projectile(this.x, this.y, angle, 14, this.getDamage(), this.attackRange, this, 35, false, true);
        wave.isFrankHammer = true;
        world.projectiles.push(wave);
      }
    }
    // Poco logic
    else if (this.id === 'poco') {
      if (isSuper) {
        this.heal(2500, world);
        world.playSound('heal');
        for (let k = 0; k < 24; k++) {
          let a = (k / 24) * Math.PI * 2;
          world.particles.push(new Particle(this.x, this.y, Math.cos(a) * 5, Math.sin(a) * 5, '#10b981', 4, 30));
        }
        let wave = new Projectile(this.x, this.y, angle, 16, 1000, this.attackRange * 1.3, this, 60, false, true, true);
        wave.isPocoSuper = true;
        world.projectiles.push(wave);
      } else {
        let wave = new Projectile(this.x, this.y, angle, 12, this.getDamage(), this.attackRange, this, 35, false, true);
        wave.isMusicWave = true;
        world.projectiles.push(wave);
      }
    }
    // Tara logic
    else if (this.id === 'tara') {
      if (isSuper) {
        let dRange = Math.min(this.attackRange * 1.2, targetDist !== null ? targetDist : this.attackRange * 1.2);
        let tx = this.x + Math.cos(angle) * dRange;
        let ty = this.y + Math.sin(angle) * dRange;
        let blackHole = new Projectile(this.x, this.y, angle, 12, 1200, dRange, this, 15, false, true, true);
        blackHole.isTaraSuper = true;
        blackHole.lobTargetX = tx;
        blackHole.lobTargetY = ty;
        blackHole.lobElapsed = 0;
        blackHole.lobDuration = 600;
        world.projectiles.push(blackHole);
      } else {
        [-0.15, 0, 0.15].forEach(o => {
          let card = new Projectile(this.x, this.y, angle + o, 15, this.getDamage(), this.attackRange, this, 10, false, true);
          card.isTarotCard = true;
          world.projectiles.push(card);
        });
      }
    }
    // Tick logic
    else if (this.id === 'tick') {
      if (isSuper) {
        let head = new Projectile(this.x, this.y, angle, 6, 2000, 400, this, 16, false, false, true);
        head.isTickHead = true;
        world.projectiles.push(head);
      } else {
        let dRange = Math.min(this.attackRange, targetDist !== null ? targetDist : this.attackRange);
        let tx = this.x + Math.cos(angle) * dRange;
        let ty = this.y + Math.sin(angle) * dRange;

        let cluster = new Projectile(this.x, this.y, angle, 0, this.getDamage(), dRange, this, 12);
        cluster.isTickCluster = true;
        cluster.lobTargetX = tx;
        cluster.lobTargetY = ty;
        cluster.lobElapsed = 0;
        cluster.lobDuration = 450;
        world.projectiles.push(cluster);
      }
    }
    // Amber logic
    else if (this.id === 'amber') {
      if (isSuper) {
        let dRange = Math.min(this.attackRange * 1.1, targetDist !== null ? targetDist : this.attackRange * 1.1);
        let tx = this.x + Math.cos(angle) * dRange;
        let ty = this.y + Math.sin(angle) * dRange;
        let oil = new Projectile(this.x, this.y, angle, 0, 350, dRange, this, 14, false, false, true);
        oil.isAmberOil = true;
        oil.lobTargetX = tx;
        oil.lobTargetY = ty;
        oil.lobElapsed = 0;
        oil.lobDuration = 650;
        world.projectiles.push(oil);
      } else {
        let bullet = new Projectile(this.x, this.y, angle, 16, this.getDamage(), this.attackRange, this, 10, false, false);
        bullet.isAmberFire = true;
        world.projectiles.push(bullet);
      }
    }
    // Dynamike logic
    else if (this.id === 'dynamike') {
      if (isSuper) {
        let dRange = Math.min(this.attackRange * 1.25, targetDist !== null ? targetDist : this.attackRange * 1.25);
        let tx = this.x + Math.cos(angle) * dRange;
        let ty = this.y + Math.sin(angle) * dRange;
        let bigBomb = new Projectile(this.x, this.y, angle, 0, this.getDamage(), dRange, this, 14, false, false, true);
        bigBomb.isBigBomb = true;
        bigBomb.lobTargetX = tx;
        bigBomb.lobTargetY = ty;
        bigBomb.lobElapsed = 0;
        bigBomb.lobDuration = 800;
        world.projectiles.push(bigBomb);
      } else {
        let dRange = Math.min(this.attackRange, targetDist !== null ? targetDist : this.attackRange);
        let tx = this.x + Math.cos(angle) * dRange;
        let ty = this.y + Math.sin(angle) * dRange;

        // Two dynamite sticks landing side-by-side (perpendicular to angle of throw)
        let perpAngle = angle + Math.PI / 2;
        let offset = 24; // separation of the two sticks

        let tx1 = tx + Math.cos(perpAngle) * offset;
        let ty1 = ty + Math.sin(perpAngle) * offset;
        let tx2 = tx - Math.cos(perpAngle) * offset;
        let ty2 = ty - Math.sin(perpAngle) * offset;

        // Dynamike throwing two separate sticks! Each stick deals 50% damage
        let damageHalf = Math.floor(this.getDamage() / 2);

        // Stick 1
        let stick1 = new Projectile(this.x, this.y, angle, 0, damageHalf, dRange, this, 8);
        stick1.isDynamite = true;
        stick1.lobTargetX = tx1;
        stick1.lobTargetY = ty1;
        stick1.lobElapsed = 0;
        stick1.lobDuration = 650;
        if (this.satchelChargeActive) {
          stick1.isSatchelCharge = true;
        }
        world.projectiles.push(stick1);

        // Stick 2
        let stick2 = new Projectile(this.x, this.y, angle, 0, damageHalf, dRange, this, 8);
        stick2.isDynamite = true;
        stick2.lobTargetX = tx2;
        stick2.lobTargetY = ty2;
        stick2.lobElapsed = 0;
        stick2.lobDuration = 650;
        if (this.satchelChargeActive) {
          stick2.isSatchelCharge = true;
        }
        world.projectiles.push(stick2);

        if (this.satchelChargeActive) {
          this.satchelChargeActive = false;
        }
      }
    }
    // ORIGINAL brawlers
    else if (this.brawlerType === 'upgrade') {
      if (isSuper) {
        this.upgradeTier = Math.min(3, this.upgradeTier + 1);
        world.floatingTexts.push(new FloatingText(this.x, this.y - 40, `TIER ${this.upgradeTier}!`, '#facc15', 20));
        const targets = [world.player, ...world.bots].filter(b => b && b !== this && b.hp > 0 && !b.isClone);
        targets.forEach(t => {
          let dist = Math.hypot(t.x - this.x, t.y - this.y);
          if (dist < 140) {
            t.takeDamage(1000, this.name, world);
            let knockAngle = Math.atan2(t.y - this.y, t.x - this.x);
            t.x += Math.cos(knockAngle) * 60; t.y += Math.sin(knockAngle) * 60;
          }
        });
        // spawn explosion
        for (let i = 0; i < 20; i++) {
          let a = Math.random() * Math.PI * 2;
          world.particles.push(new Particle(this.x, this.y, Math.cos(a) * 4, Math.sin(a) * 4, '#facc15', 3, 20));
        }
        world.playSound('super');
      } else {
        let proj = new Projectile(this.x, this.y, angle, this.bulletSpeed, this.getDamage(), this.attackRange, this, 12, false, false);
        proj.isJuiceShot = true;
        world.projectiles.push(proj);
      }
    }
    else if (this.brawlerType === 'shoe') {
      if (isSuper) {
        this.isFangDashing = true; this.fangChainCount = 0; this.jumpElapsed = 0;
        let leapDist = targetDist !== null ? Math.min(450, targetDist) : 450;
        this.fangDashTarget = { x: this.x + Math.cos(angle) * leapDist, y: this.y + Math.sin(angle) * leapDist };
        world.playSound('super');
      } else {
        let kick = new Projectile(this.x, this.y, angle, this.bulletSpeed, this.getDamage(), this.attackRange, this, 30, false, false);
        kick.isSneakerKick = true;
        world.projectiles.push(kick);
      }
    }
    else if (this.brawlerType === 'attach') {
      if (isSuper) {
        if (this.attachedTarget && this.isAttachedToAlly) {
          this.attachedTarget = null; this.attachTimer = 0; return;
        }
        let targetLeapDist = targetDist !== null ? Math.min(350, targetDist) : 350;
        this.isJumping = true; this.jumpElapsed = 0; this.jumpStartX = this.x; this.jumpStartY = this.y;
        this.jumpDuration = 600;
        this.jumpTargetX = Math.max(50, Math.min(world.WORLD_SIZE - 50, this.x + Math.cos(angle) * targetLeapDist));
        this.jumpTargetY = Math.max(50, Math.min(world.WORLD_SIZE - 50, this.y + Math.sin(angle) * targetLeapDist));
        this.kitSeekingAttachment = true; world.playSound('super');
      } else {
        if (this.attachedTarget && this.isAttachedToAlly) {
          let yarn = new Projectile(this.x, this.y, angle, 14, this.getDamage() * 1.5, 350, this, 15, false, false);
          yarn.isYarnBall = true;
          world.projectiles.push(yarn);
        } else if (!this.attachedTarget) {
          [-0.3, 0, 0.3].forEach(o => world.projectiles.push(new Projectile(this.x, this.y, angle + o, this.bulletSpeed, this.getDamage(), this.attackRange, this, 15, false, false)));
        }
      }
    }
    else if (this.id === 'crow') {
      if (isSuper) {
        for (let a = 0; a < Math.PI * 2; a += (Math.PI * 2) / 14) {
          world.projectiles.push(new Projectile(this.x, this.y, a, this.bulletSpeed * 1.1, this.getDamage(), this.attackRange * 0.9, this, 6, false, false, true));
        }
        this.isJumping = true; this.jumpElapsed = 0; this.jumpStartX = this.x; this.jumpStartY = this.y;
        this.jumpDuration = 800;
        let leapDist = targetDist !== null ? Math.min(420, targetDist) : 420;
        let leapX = this.x + Math.cos(angle) * leapDist; let leapY = this.y + Math.sin(angle) * leapDist;
        this.jumpTargetX = Math.max(50, Math.min(world.WORLD_SIZE - 50, leapX));
        this.jumpTargetY = Math.max(50, Math.min(world.WORLD_SIZE - 50, leapY));
      } else {
        [-0.15, 0, 0.15].forEach(o => {
          world.projectiles.push(new Projectile(this.x, this.y, angle + o, this.bulletSpeed, this.getDamage(), this.attackRange, this, 5, false, false));
        });
      }
    }
    else if (this.brawlerType === 'stealth') {
      if (isSuper) {
        this.invisibleTimer = 6000;
        world.floatingTexts.push(new FloatingText(this.x, this.y - 20, "💨 SMOKE BOMB!", '#a7f3d0', 20));
        world.playSound('power_up');
      } else {
        for (let i = 0; i < 4; i++) {
          setTimeout(() => {
            if (this.hp > 0 && world.player) {
              let spread = (i - 1.5) * 0.15;
              world.projectiles.push(new Projectile(this.x, this.y, angle + spread, this.bulletSpeed, this.getDamage(), this.attackRange, this, 5, false, false));
            }
          }, i * 100);
        }
      }
    }
    else if (this.brawlerType === 'shotgun') {
      if (isSuper) {
        [-0.4, -0.2, -0.1, 0, 0.1, 0.2, 0.4].forEach(o => world.projectiles.push(new Projectile(this.x, this.y, angle + o, this.bulletSpeed * 1.2, this.getDamage() * 1.5, this.attackRange * 1.3, this, 10, false, true, true)));
      } else {
        if (this.clayPigeonsActive) {
          this.clayPigeonsActive = false;
          // Clay Pigeons: High velocity long-range tight spread bullet!
          [-0.05, 0, 0.05].forEach(o => world.projectiles.push(new Projectile(this.x, this.y, angle + o, this.bulletSpeed * 1.5, this.getDamage() * 1.3, this.attackRange * 1.6, this, 6, false, false)));
          world.floatingTexts.push(new FloatingText(this.x, this.y - 20, "🎯 CLAY PIGEONS SHOT!", '#10b981', 16));
        } else {
          [-0.2, -0.1, 0, 0.1, 0.2].forEach(o => world.projectiles.push(new Projectile(this.x, this.y, angle + o, this.bulletSpeed, this.getDamage(), this.attackRange, this, 6, false, false)));
        }
      }
    }
    else if (this.brawlerType === 'burst') {
      if (!isSuper && this.silverBulletActive) {
        this.silverBulletActive = false;
        // Silver Bullet: Single high-damage bullet that pierces and destroys obstacles!
        world.projectiles.push(new Projectile(this.x, this.y, angle, this.bulletSpeed * 1.7, this.getDamage() * 3.5, this.attackRange * 1.2, this, 11, false, true, true));
        world.floatingTexts.push(new FloatingText(this.x, this.y - 20, "☄️ SILVER BULLET!", '#38bdf8', 16));
      } else {
        const count = isSuper ? 8 : 3;
        for (let i = 0; i < count; i++) {
          setTimeout(() => {
            if (this.hp > 0 && world.player) {
              world.projectiles.push(new Projectile(this.x, this.y, angle, this.bulletSpeed * (isSuper ? 1.3 : 1), this.getDamage() * (isSuper ? 1.2 : 1), this.attackRange * (isSuper ? 1.3 : 1), this, isSuper ? 8 : 5, false, isSuper, isSuper));
            }
          }, i * (isSuper ? 60 : 100));
        }
      }
    }
    else if (this.brawlerType === 'punch') {
      if (isSuper) {
        this.isJumping = true; this.jumpElapsed = 0; this.jumpStartX = this.x; this.jumpStartY = this.y;
        this.jumpDuration = 800;
        let leapDist = targetDist !== null ? Math.min(450, targetDist) : 450;
        let leapX = this.x + Math.cos(angle) * leapDist; let leapY = this.y + Math.sin(angle) * leapDist;
        this.jumpTargetX = Math.max(50, Math.min(world.WORLD_SIZE - 50, leapX));
        this.jumpTargetY = Math.max(50, Math.min(world.WORLD_SIZE - 50, leapY));
      } else {
        world.projectiles.push(new Projectile(this.x, this.y, angle, this.bulletSpeed, this.getDamage(), this.attackRange, this, 40, false, false));
      }
    }
    else if (this.brawlerType === 'spike') {
      if (isSuper) {
        world.projectiles.push(new Projectile(this.x, this.y, angle, this.bulletSpeed, this.getDamage(), this.attackRange * 1.2, this, 14, true, false, true));
      } else {
        world.projectiles.push(new Projectile(this.x, this.y, angle, this.bulletSpeed, this.getDamage(), this.attackRange, this, 9, true, false));
      }
    }
    else if (this.brawlerType === 'dash') {
      if (isSuper) {
        let targetDistCalc = this.attackRange * 1.4;
        let tx = this.x + Math.cos(angle) * targetDistCalc; let ty = this.y + Math.sin(angle) * targetDistCalc;
        tx = Math.max(50, Math.min(world.WORLD_SIZE - 50, tx)); ty = Math.max(50, Math.min(world.WORLD_SIZE - 50, ty));
        let steps = 15;
        for (let i = 0; i <= steps; i++) {
          let t = i / steps; let px = this.x + (tx - this.x) * t; let py = this.y + (ty - this.y) * t;
          world.particles.push(new Particle(px, py, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, '#a5f3fc', 3.5 + Math.random() * 2.5, 25));
        }
        this.x = tx; this.y = ty;
        let diagAngles = [angle + Math.PI / 4, angle + 3 * Math.PI / 4, angle - Math.PI / 4, angle - 3 * Math.PI / 4];
        diagAngles.forEach(diagAngle => {
          world.projectiles.push(new Projectile(tx, ty, diagAngle, this.bulletSpeed * 1.5, this.getDamage() * 1.8, 120, this, 18, false, true, true));
        });
      } else {
        world.projectiles.push(new Projectile(this.x, this.y, angle, this.bulletSpeed * 1.2, this.getDamage(), this.attackRange, this, 65, false, false));
        this.x += Math.cos(angle) * 60; this.y += Math.sin(angle) * 60;
      }
    }
    else if (this.brawlerType === 'scarf') {
      if (isSuper) {
        this.isJumping = true; this.jumpElapsed = 0; this.jumpStartX = this.x; this.jumpStartY = this.y;
        this.jumpDuration = 650;
        let targetLeapDist = targetDist !== null ? Math.min(280, targetDist) : 280;
        let leapX = this.x + Math.cos(angle) * targetLeapDist; let leapY = this.y + Math.sin(angle) * targetLeapDist;
        this.jumpTargetX = Math.max(50, Math.min(world.WORLD_SIZE - 50, leapX));
        this.jumpTargetY = Math.max(50, Math.min(world.WORLD_SIZE - 50, leapY));
      } else {
        world.projectiles.push(new Projectile(this.x, this.y, angle, this.bulletSpeed, this.getDamage(), this.attackRange, this, 38, false, false));
        setTimeout(() => {
          if (this.hp > 0 && world.player && !this.isJumping) {
            world.projectiles.push(new Projectile(this.x, this.y, angle, this.bulletSpeed, this.getDamage(), this.attackRange, this, 38, false, false));
          }
        }, 100);
      }
    }
    else if (this.brawlerType === 'swing') {
      if (isSuper) {
        world.projectiles.push(new Projectile(this.x, this.y, angle, 12, this.getDamage() * 1.5, world.WORLD_SIZE, this, 30, false, true, true, true));
      } else {
        [-0.3, 0, 0.3].forEach(o => world.projectiles.push(new Projectile(this.x, this.y, angle + o, this.bulletSpeed, this.getDamage(), this.attackRange, this, 20, false, true)));
      }
    }
  }

  update(dt: number, world: GameWorld) {
    if (this.spawnShieldTimer && this.spawnShieldTimer > 0) {
      this.spawnShieldTimer -= dt;
      if (this.spawnShieldTimer < 0) this.spawnShieldTimer = 0;
    }

    if (this.isDead) {
      if (this.deathTimer !== undefined) {
        this.deathTimer -= dt;
        if (this.deathTimer <= 0) {
          this.isDead = false;
          this.deathTimer = 0;
          this.hp = this.getMaxHp();
          this.ammo = this.maxAmmo;
          this.spawnShieldTimer = 3000; // 3s immunity shield
          
          // Relocate to team spawn point!
          const spawns = this.team === 'blue' ? [
            { x: 150, y: 150 },
            { x: 150, y: 2850 },
            { x: 150, y: 1500 },
            { x: 1500, y: 150 },
            { x: 800, y: 800 }
          ] : [
            { x: 2850, y: 2850 },
            { x: 2850, y: 150 },
            { x: 2850, y: 1500 },
            { x: 1500, y: 2850 },
            { x: 2200, y: 2200 }
          ];
          
          const mySpawn = spawns[Math.floor(Math.random() * spawns.length)];
          this.x = mySpawn.x;
          this.y = mySpawn.y;
          
          // Spawn respawn particles
          const particleColor = this.team === 'blue' ? '#3b82f6' : '#ef4444';
          for (let i = 0; i < 20; i++) {
            let a = Math.random() * Math.PI * 2;
            let speed = 1 + Math.random() * 4;
            world.particles.push(new Particle(this.x, this.y, Math.cos(a) * speed, Math.sin(a) * speed, particleColor, 3, 25));
          }
          
          world.playSound('power_up');
        }
      }
      return;
    }

    if (this.activeEmoteTimer > 0) {
      this.activeEmoteTimer -= dt;
      if (this.activeEmoteTimer < 0) this.activeEmoteTimer = 0;
    }

    if (this.isBot && this.activeEmoteTimer === 0 && Math.random() < 0.0005) {
      const emotes = ['👍', '😡', '😄', '❤️'];
      this.activeEmote = emotes[Math.floor(Math.random() * emotes.length)];
      this.activeEmoteTimer = 2500;
    }

    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) {
        this.stunTimer = 0;
        this.isCocooned = false;
      }
    }

    // Recharge Shield Gear
    if (this.selectedGears && this.selectedGears.includes('shield')) {
      if (Date.now() - this.lastCombatTime > 5000 && this.shieldGearHp < 900) {
        this.shieldGearHp = Math.min(900, this.shieldGearHp + 150 * (dt / 1000));
      }
    }

    // Bibi's Home Run Charge
    if (this.id === 'bibi') {
      if (this.ammo === this.maxAmmo) {
        if (!this.hasOwnProperty('homeRunCharge')) {
          (this as any).homeRunCharge = 0;
        }
        (this as any).homeRunCharge = Math.min(100, ((this as any).homeRunCharge || 0) + dt * 0.05); // charges in 2 seconds
      } else {
        (this as any).homeRunCharge = 0;
      }
      
      // Home Run Speed boost
      let baseSpeed = BRAWLER_TEMPLATES['bibi'].speed * 0.58;
      if (this.selectedStarPower === 'home_run_speed' && (this as any).homeRunCharge >= 100) {
        this.speed = baseSpeed * 1.12;
      } else {
        this.speed = baseSpeed;
      }
    }

    if (this.id === 'surge') {
      let speedMult = this.upgradeTier >= 1 ? 1.2 : 1.0;
      this.speed = BRAWLER_TEMPLATES['surge'].speed * 0.58 * speedMult;
      let rangeMult = this.upgradeTier >= 2 ? 1.25 : 1.0;
      this.attackRange = BRAWLER_TEMPLATES['surge'].attackRange * 0.90 * rangeMult;
    }

    if (this.id === 'kit' && this.attachedTarget) {
      this.x = this.attachedTarget.x;
      this.y = this.attachedTarget.y;
      this.attachTimer -= dt;
      if (this.attachedTarget.hp <= 0 || this.attachTimer <= 0) {
        if (!this.isAttachedToAlly) this.attachedTarget.stunTimer = 0;
        this.attachedTarget = null;
        this.x -= Math.cos(this.facingAngle) * 60;
        this.y -= Math.sin(this.facingAngle) * 60;
        this.x = Math.max(this.radius, Math.min(world.WORLD_SIZE - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(world.WORLD_SIZE - this.radius, this.y));
      } else if (!this.isAttachedToAlly) {
        if (Math.floor(this.attachTimer / 500) % 2 === 0 && Date.now() - this.lastKitScratch > 500) {
          this.attachedTarget.takeDamage(Math.floor(this.getDamage() * 0.4), this.name, world);
          this.lastKitScratch = Date.now();
        }
      }
    }

    if (this.isFangDashing && this.fangDashTarget) {
      let dx = this.fangDashTarget.x - this.x;
      let dy = this.fangDashTarget.y - this.y;
      let dist = Math.hypot(dx, dy);
      let moveAmt = this.fangDashSpeed * (dt / 16.6);

      if (dist < moveAmt) {
        this.x = this.fangDashTarget.x;
        this.y = this.fangDashTarget.y;
        this.isFangDashing = false;
      } else {
        this.x += (dx / dist) * moveAmt;
        this.y += (dy / dist) * moveAmt;

        const targets = [world.player, ...world.bots, world.bossRobot, ...world.powerBoxes, ...world.mysteryBoxes].filter(b => b && b !== this && b.hp > 0 && !(b as any).isClone);
        for (let t of targets) {
          if (Math.hypot(t.x - this.x, t.y - this.y) < (t.radius || 20) + this.radius) {
            if ('id' in t || t === world.bossRobot) {
              (t as any).takeDamage(this.getDamage() * 1.5, this.name, world);
            } else {
              t.takeDamage(this.getDamage() * 1.5, world);
            }
            this.fangChainCount++;
            if (this.fangChainCount < 4) {
              // find next
              let nextTarget: Character | null = null;
              let nextMin = Infinity;
              const nextCandidates = [world.player, ...world.bots].filter(b => b !== t && b !== this && !b.isClone && b.hp > 0 && Math.hypot(b.x - this.x, b.y - this.y) <= 800);
              for (let nc of nextCandidates) {
                let d = Math.hypot(nc.x - this.x, nc.y - this.y);
                if (d < nextMin) { nextMin = d; nextTarget = nc; }
              }
              if (nextTarget) {
                this.fangDashTarget = { x: nextTarget.x, y: nextTarget.y };
              } else { this.isFangDashing = false; }
            } else { this.isFangDashing = false; }
            break;
          }
        }
      }
    }

    if (this.hyperActiveTimer > 0) {
      this.hyperActiveTimer -= dt;
      if (this.hyperActiveTimer < 0) this.hyperActiveTimer = 0;
    }

    if (this.poisonTimer > 0) {
      this.poisonTimer -= dt;
      if (Date.now() - this.lastPoisonTick >= 1000) {
        this.lastPoisonTick = Date.now();
        let dmg = this.poisonDamage || 80;
        if (this.poisonedBy && this.poisonedBy.id === 'crow' && this.poisonedBy.selectedStarPower === 'carrion_crow' && (this.hp / this.getMaxHp() <= 0.5)) {
          dmg = Math.floor(dmg * 1.30);
        }
        this.takeDamage(dmg, this.poisonedBy ? this.poisonedBy.name : "Toxic Poison", world);
        world.particles.push(new Particle(this.x, this.y, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, '#22c55e', 4, 15));
      }
      if (this.poisonTimer <= 0) {
        this.poisonTimer = 0;
        this.poisonedBy = null;
      }
    }

    if ((this as any).emzSuperZoneTimer && (this as any).emzSuperZoneTimer > 0) {
      (this as any).emzSuperZoneTimer -= dt;
      if ((this as any).emzSuperZoneTimer < 0) (this as any).emzSuperZoneTimer = 0;
      
      if (Math.random() < 0.35) {
        let rAngle = Math.random() * Math.PI * 2;
        let rDist = Math.random() * 160;
        let px = this.x + Math.cos(rAngle) * rDist;
        let py = this.y + Math.sin(rAngle) * rDist;
        world.particles.push(new Particle(px, py, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, '#c084fc', 3, 15));
      }
      
      const range = 160;
      const targets = [world.player, ...world.bots].filter(b => b && b !== this && b.hp > 0 && Math.hypot(b.x - this.x, b.y - this.y) < range);
      targets.forEach(t => {
        t.speedBoostTimer = -1000;
        if (Math.floor(Date.now() / 500) % 2 === 0) {
          if (!(t as any).lastEmzSuperTick || Date.now() - (t as any).lastEmzSuperTick >= 500) {
            (t as any).lastEmzSuperTick = Date.now();
            t.takeDamage(Math.floor(this.getDamage() * 0.25), this.name, world);
            if (this.selectedStarPower === 'bad_karma') {
              t.takeDamage(Math.floor(this.getDamage() * 0.05), this.name, world);
            }
          }
        }
      });
    }

    if (this.isJumping) {
      this.jumpElapsed += dt;
      let progress = Math.min(1.0, this.jumpElapsed / this.jumpDuration);

      this.x = this.jumpStartX + (this.jumpTargetX - this.jumpStartX) * progress;
      this.y = this.jumpStartY + (this.jumpTargetY - this.jumpStartY) * progress;

      if (Math.random() < 0.35) {
        world.particles.push(new Particle(this.x, this.y, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2, '#cbd5e1', 1.5 + Math.random() * 2, 14));
      }

      if (progress >= 1.0) {
        this.isJumping = false; this.speedBoostTimer = 3000;

        // Wall collision correction on jump landing - pushed to nearest non-wall/non-boundary place
        let insideObs = true;
        let attempts = 0;
        while (insideObs && attempts < 20) {
          insideObs = false;
          // Boundary checks
          if (this.x < this.radius + 15) { this.x = this.radius + 15; insideObs = true; }
          if (this.x > world.WORLD_SIZE - this.radius - 15) { this.x = world.WORLD_SIZE - this.radius - 15; insideObs = true; }
          if (this.y < this.radius + 15) { this.y = this.radius + 15; insideObs = true; }
          if (this.y > world.WORLD_SIZE - this.radius - 15) { this.y = world.WORLD_SIZE - this.radius - 15; insideObs = true; }

          // Obstacles checks
          for (let obs of world.obstacles) {
            let dist = Math.hypot(this.x - obs.x, this.y - obs.y);
            let minDist = this.radius + obs.radius;
            if (dist < minDist) {
              insideObs = true;
              if (dist === 0) {
                let angle = Math.random() * Math.PI * 2;
                this.x += Math.cos(angle) * minDist;
                this.y += Math.sin(angle) * minDist;
              } else {
                let pushX = (this.x - obs.x) / dist;
                let pushY = (this.y - obs.y) / dist;
                this.x = obs.x + pushX * (minDist + 3);
                this.y = obs.y + pushY * (minDist + 3);
              }
              break; // Re-evaluate with the updated coordinates
            }
          }
          attempts++;
        }

        // shockwave / splash
        for (let i = 0; i < 10; i++) {
          let a = Math.random() * Math.PI * 2;
          world.particles.push(new Particle(this.x, this.y, Math.cos(a) * 3, Math.sin(a) * 3, '#e2e8f0', 2, 12));
        }
        world.playSound('hit');

        // Mico Landing Splash Damage
        if (this.id === 'mico') {
          const splashR = this.superCharge >= 100 ? 150 : 80;
          const dmg = this.superCharge >= 100 ? 1800 : this.getDamage();
          const targetBrawlers = [world.player, ...world.bots].filter(b => b !== this && b && b.hp > 0);
          targetBrawlers.forEach(b => {
            if (Math.hypot(b.x - this.x, b.y - this.y) < splashR) {
              b.takeDamage(dmg, this.name + " (Monkey Splash)", world);
              if (this.superCharge >= 100) {
                b.stunTimer = 1500; // 1.5s stun!
                world.floatingTexts.push(new FloatingText(b.x, b.y - 40, "😵 STUNNED!", '#eab308', 16));
              }
            }
          });
        }

        if (this.id === 'kit' && this.kitSeekingAttachment) {
          this.kitSeekingAttachment = false;
          let nearestTarget: Character | null = null;
          let minDist = Infinity;
          const candidates = [world.player, ...world.bots].filter(b => b !== this && !b.isClone && b.hp > 0);
          for (let c of candidates) {
            let d = Math.hypot(c.x - this.x, c.y - this.y);
            if (d < minDist) { minDist = d; nearestTarget = c; }
          }
          if (nearestTarget && Math.hypot(nearestTarget.x - this.x, nearestTarget.y - this.y) < 150) {
            this.attachedTarget = nearestTarget;
            this.isAttachedToAlly = false;
            this.attachTimer = 5000;
            nearestTarget.stunTimer = 5000;
          }
        }
        else if (this.id === 'crow') {
          for (let a = 0; a < Math.PI * 2; a += (Math.PI * 2) / 14) {
            world.projectiles.push(new Projectile(this.x, this.y, a, this.bulletSpeed * 1.1, this.getDamage(), this.attackRange * 0.9, this, 6, false, false, true));
          }
          world.playSound('shoot');
        }
        else if (this.id === 'edgar') {
          const targets = [world.player, ...world.bots].filter(b => b && b.hp > 0 && !b.isClone);
          targets.forEach(t => {
            let dist = Math.hypot(t.x - this.x, t.y - this.y);
            if (dist < 100) {
              t.takeDamage(800, this.name + " (Hard Landing)", world);
              world.floatingTexts.push(new FloatingText(t.x, t.y - 20, "💥 Hard Landing!", '#ef4444', 16));
            }
          });
        } else if (this.id === 'el_primo') {
          world.triggerScreenShake(15); world.playSound('break_box');
          for (let i = world.obstacles.length - 1; i >= 0; i--) {
            if (Math.hypot(world.obstacles[i].x - this.x, world.obstacles[i].y - this.y) < 150) {
              world.obstacles.splice(i, 1);
            }
          }
          const targets = [world.player, ...world.bots, world.bossRobot, ...world.powerBoxes, ...world.mysteryBoxes].filter(b => b && b !== this && b.hp !== undefined && b.hp > 0);
          targets.forEach(t => {
            let dist = Math.hypot(t.x - this.x, t.y - this.y);
            if (dist < 150) {
              if ('id' in t || t === world.bossRobot) {
                (t as any).takeDamage(1200, this.name + " (Meteor Smash)", world);
                (t as any).burnTimer = 3000;
              } else {
                t.takeDamage(1200, world);
              }
              this.chargeSuper(15, world);
            }
          });
          world.bushes = world.bushes.filter(b => Math.hypot(b.x - this.x, b.y - this.y) > 150);
        }
      }
    }

    if (this.id === 'edgar' && !this.isJumping) {
      this.chargeSuper(dt * 0.005, world);
    }

    world.jumpPads.forEach(pad => {
      if (Math.hypot(this.x - pad.x, this.y - pad.y) < pad.radius && !this.isJumping && !this.isFangDashing) {
        this.isJumping = true; this.jumpElapsed = 0; this.jumpStartX = this.x; this.jumpStartY = this.y;
        this.jumpDuration = 650;
        this.jumpTargetX = Math.max(50, Math.min(world.WORLD_SIZE - 50, this.x + Math.cos(pad.targetAngle) * pad.targetDist));
        this.jumpTargetY = Math.max(50, Math.min(world.WORLD_SIZE - 50, this.y + Math.sin(pad.targetAngle) * pad.targetDist));
        world.playSound('super');
      }
    });

    if (this.speedBoostTimer > 0) this.speedBoostTimer -= dt;
    else if (this.speedBoostTimer < 0) {
      this.speedBoostTimer += dt;
      if (this.speedBoostTimer > 0) this.speedBoostTimer = 0;
    }

    if (this.energyDrinkTimer > 0) this.energyDrinkTimer -= dt;
    if (this.shieldTimer > 0) this.shieldTimer -= dt;
    if (this.gadgetCooldown > 0) this.gadgetCooldown -= dt;
    if (this.survivalShovelTimer > 0) this.survivalShovelTimer -= dt;

    if (this.invisibleTimer > 0) {
      this.invisibleTimer -= dt;
      if (this.id === 'leon') this.heal(1000 * (dt / 1000), world);
    }

    if (this.id === 'shelly') {
      if (this.bandAidCooldown > 0) this.bandAidCooldown -= dt;
      if (this.hp / this.getMaxHp() < 0.30 && this.bandAidCooldown <= 0) {
        this.heal(1800, world); this.bandAidCooldown = 25000;
        world.floatingTexts.push(new FloatingText(this.x, this.y - 20, "🩹 Band-Aid Activated!", '#10b981', 18));
      }
    }

    if (this.id === 'spike') {
      world.projectiles.forEach(p => {
        if (p.owner === this && p.isSuper && Math.hypot(this.x - p.x, this.y - p.y) < 150) {
          this.heal(Math.floor(500 * (dt / 1000)), world);
        }
      });
    }

    if (this.ammo < this.maxAmmo) {
      let speedMult = 1;
      if (this.survivalShovelTimer > 0) speedMult = 2.0;
      if (this.id === 'bull' && this.selectedStarPower === 'berserker' && this.hp < this.getMaxHp() * 0.55) {
        speedMult *= 2.0;
      }
      this.reloadTimer += dt * speedMult;
      if (this.reloadTimer >= this.reloadTime) { this.ammo++; this.reloadTimer -= this.reloadTime; }
    } else { this.reloadTimer = 0; }

    if (Date.now() - this.lastCombatTime > 3000 && this.hp < this.getMaxHp() && !this.isClone && !this.isSpider) {
      const healTick = this.getMaxHp() * 0.13 * (dt / 1000);
      this.hp = Math.min(this.getMaxHp(), this.hp + healTick);

      if (Date.now() - this.lastHealParticle > 400 && this === world.player) {
        world.floatingTexts.push(new FloatingText(this.x + (Math.random() - 0.5) * 20, this.y - 30, "+", '#4ade80', 20));
        this.lastHealParticle = Date.now();
      }
    }

    this.inBush = false;
    for (let b of world.bushes) { if (Math.hypot(this.x - b.x, this.y - b.y) < b.radius) { this.inBush = true; break; } }
  }

  draw(ctx: CanvasRenderingContext2D, world: GameWorld) {
    if (this.isDead) return;
    if (this.inBush && this.isBot && world.player && Math.hypot(this.x - world.player.x, this.y - world.player.y) > 160) return;

    ctx.save();
    if (this.inBush) ctx.globalAlpha = 0.55;

    if (this.invisibleTimer > 0) {
      if (this === world.player || (this.owner === world.player)) {
        ctx.globalAlpha *= 0.4;
      } else {
        if (world.player) {
          let distToPlayer = Math.hypot(this.x - world.player.x, this.y - world.player.y);
          if (distToPlayer < 160) {
            ctx.globalAlpha *= 0.35;
          } else {
            ctx.restore();
            return;
          }
        }
      }
    }

    let jumpOffset = 0;
    if (this.isJumping) {
      let progress = this.jumpElapsed / this.jumpDuration;
      let peakHeight = (this.id === 'el_primo' || this.id === 'crow' || this.id === 'mico') ? 120 : 55;
      jumpOffset = Math.sin(Math.PI * progress) * peakHeight;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(this.x, this.y + 16, this.radius, 8, 0, 0, Math.PI * 2); ctx.fill();

    // Hypercharge aura
    if (this.hyperActiveTimer > 0 && !this.isJumping) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(Date.now() / 150);
      ctx.strokeStyle = '#d946ef';
      ctx.lineWidth = 4;
      ctx.setLineDash([20, 15]);
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 10 + Math.sin(Date.now() / 80) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Circle Base Ring
    ctx.lineWidth = 4;
    if (this.team) {
      ctx.strokeStyle = this.team === 'blue' ? 'rgba(59, 130, 246, 0.8)' : 'rgba(239, 68, 68, 0.8)';
    } else {
      ctx.strokeStyle = this.isBot ? 'rgba(244, 63, 94, 0.8)' : 'rgba(16, 185, 129, 0.8)';
    }
    ctx.beginPath(); ctx.arc(this.x, this.y - jumpOffset, this.radius, 0, Math.PI * 2); ctx.stroke();

    // Spawn immunity shield
    if (this.spawnShieldTimer && this.spawnShieldTimer > 0 && !this.isJumping) {
      ctx.save();
      ctx.translate(this.x, this.y - jumpOffset);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(250, 204, 21, 0.15)';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (this.energyDrinkTimer > 0) {
      ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(this.x, this.y - jumpOffset, this.radius + 12, 0, Math.PI * 2); ctx.stroke();
    }

    if (this.superCharge >= 100 && !this.isClone && !this.isSpider) {
      ctx.save(); ctx.translate(this.x, this.y - jumpOffset); ctx.rotate(Date.now() / 150);
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3; ctx.setLineDash([15, 15]);
      ctx.beginPath(); ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }

    // Cocoon Ring Overlay
    if (this.isCocooned) {
      ctx.save();
      ctx.translate(this.x, this.y - jumpOffset);
      ctx.strokeStyle = '#ec4899'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, this.radius + 4, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = 'rgba(236, 72, 153, 0.25)'; ctx.beginPath(); ctx.arc(0, 0, this.radius + 4, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }

    const bob = this.isMoving ? Math.sin(Date.now() / 80) * 3 : Math.sin(Date.now() / 250) * 1.5;

    ctx.save();
    ctx.translate(this.x, this.y + bob - jumpOffset);
    if (this.isJumping) { ctx.rotate(Date.now() / 100); } else { ctx.rotate(this.facingAngle); }

    ctx.lineWidth = 2.5; ctx.strokeStyle = '#000000';

    if (this.id === 'el_primo') {
      ctx.fillStyle = this.skinColor;
      ctx.beginPath(); ctx.arc(14, -14, 8, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(14, 14, 8, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-2, 0, 15, 18, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(4, 0, 13, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(4, 0, 13.5, -Math.PI*0.65, Math.PI*0.65, true); 
      ctx.lineTo(2, 9); ctx.lineTo(0, 0); ctx.lineTo(2, -9); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.secondary;
      ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-4, -2); ctx.lineTo(-4, -5); ctx.lineTo(-2, -2); ctx.lineTo(1, 0); ctx.lineTo(-2, 2); ctx.lineTo(-4, 5); ctx.lineTo(-4, 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(11, 0, 5, -Math.PI/2.5, Math.PI/2.5); ctx.lineTo(9, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(11, -3); ctx.lineTo(14, -3); ctx.stroke(); 
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(16, 0); ctx.stroke(); 
      ctx.beginPath(); ctx.moveTo(11, 3); ctx.lineTo(14, 3); ctx.stroke(); 
      ctx.fillStyle = '#fff'; ctx.strokeStyle = this.secondary; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(6, -6, 3.5, 4.5, Math.PI/4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(6, 6, 3.5, 4.5, -Math.PI/4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(7, -6, 1.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(7, 6, 1.5, 0, Math.PI*2); ctx.fill();
    } 
    else if (this.id === 'shelly') {
      ctx.fillStyle = this.secondary; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(15, -10); ctx.lineTo(15, 10); ctx.fill(); 
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke(); 
      ctx.fillStyle = this.skinColor; ctx.beginPath(); ctx.arc(3, 0, 10, 0, Math.PI*2); ctx.fill(); 
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(7, -3, 2.2, 0, Math.PI*2); ctx.arc(7, 3, 2.2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#475569'; ctx.fillRect(10, 5, 18, 4); ctx.strokeRect(10, 5, 18, 4); 
    } 
    else if (this.id === 'colt') {
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke(); 
      ctx.fillStyle = this.skinColor; ctx.beginPath(); ctx.arc(3, 0, 10, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = this.secondary; ctx.beginPath(); ctx.arc(-2, 0, 12, Math.PI/2, Math.PI*1.5); ctx.fill(); 
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(7, -3, 2.2, 0, Math.PI*2); ctx.arc(7, 3, 2.2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(10, -12, 14, 4); ctx.strokeRect(10, -12, 14, 4); 
    } 
    else if (this.id === 'spike') {
      ctx.fillStyle = this.secondary;
      ctx.beginPath(); ctx.arc(10, -12, 5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(10, 12, 5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.skinColor; 
      ctx.beginPath(); ctx.arc(6, -4, 2.8, 0, Math.PI*2); ctx.arc(6, 4, 2.8, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(4, 2, 3, 4, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI); ctx.fill(); 
    } 
    else if (this.id === 'kenji') {
      ctx.fillStyle = this.secondary; ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(24, 8); ctx.lineTo(26, 6); ctx.lineTo(0, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0f172a'; ctx.fillRect(4, 5, 4, 4);
      ctx.fillStyle = this.color; 
      ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.skinColor;
      ctx.beginPath(); ctx.arc(4, 0, 9, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(7, -3, 2, 0, Math.PI*2); ctx.arc(7, 3, 2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffffff'; 
      ctx.fillRect(0, -11, 4, 22); ctx.strokeRect(0, -11, 4, 22);
    }
    else if (this.id === 'edgar') {
      ctx.fillStyle = this.secondary; ctx.fillRect(4, -13, 10, 5); ctx.strokeRect(4, -13, 10, 5); ctx.fillRect(4, 8, 10, 5); ctx.strokeRect(4, 8, 10, 5);
      ctx.fillStyle = this.color; ctx.fillRect(9, -13, 3, 5); ctx.fillRect(9, 8, 3, 5); 
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.skinColor; ctx.beginPath(); ctx.arc(3, 0, 10, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#000000'; ctx.beginPath(); ctx.arc(7, -3, 2, 0, Math.PI*2); ctx.arc(7, 3, 2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#111827'; ctx.beginPath(); ctx.arc(-2, 0, 10, Math.PI/2, Math.PI*1.5); ctx.fill(); 
    }
    else if (this.id === 'bibi') {
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke(); 
      ctx.fillStyle = this.skinColor; ctx.beginPath(); ctx.arc(3, 0, 10, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#000000'; ctx.beginPath(); ctx.arc(-4, 0, 12, Math.PI/2, Math.PI*1.5); ctx.fill(); 
      ctx.beginPath(); ctx.ellipse(4, -8, 8, 4, -0.2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(7, -3, 2, 0, Math.PI*2); ctx.arc(7, 3, 2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = this.secondary; ctx.beginPath(); ctx.arc(12, 4, 5, 0, Math.PI*2); ctx.fill(); ctx.stroke(); 
      ctx.fillStyle = '#cbd5e1'; ctx.fillRect(10, 12, 24, 6); ctx.strokeRect(10, 12, 24, 6); 
      ctx.fillStyle = '#000'; ctx.fillRect(10, 12, 6, 6);
    }
    else if (this.id === 'leon') {
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke(); 
      ctx.fillStyle = this.skinColor; ctx.beginPath(); ctx.arc(3, 0, 10, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = this.secondary; ctx.beginPath(); ctx.arc(0, 0, 12, Math.PI*0.3, Math.PI*1.7); ctx.fill(); 
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(7, -3, 2, 0, Math.PI*2); ctx.arc(7, 3, 2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#f3f4f6'; ctx.beginPath(); ctx.arc(0, -11, 4, 0, Math.PI*2); ctx.fill(); ctx.stroke(); 
    }
    else if (this.id === 'crow') {
      if (this.skinId === 'night_mecha' || this.skinId === 'gold_mecha') {
        ctx.fillStyle = this.color; ctx.fillRect(-12, -12, 24, 24); ctx.strokeRect(-12, -12, 24, 24);
        ctx.fillStyle = this.secondary; ctx.beginPath(); ctx.moveTo(10, -4); ctx.lineTo(24, 0); ctx.lineTo(10, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ef4444'; ctx.fillRect(4, -6, 4, 12);
      } else {
        ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = this.skinColor; ctx.beginPath(); ctx.arc(3, 0, 10, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = (this.skinId === 'crowbone') ? '#06b6d4' : '#f59e0b';
        ctx.beginPath(); ctx.moveTo(3, -5); ctx.quadraticCurveTo(15, -4, 22, 0); ctx.quadraticCurveTo(12, 5, 3, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(6, -3, 2, 0, Math.PI*2); ctx.arc(6, 3, 2, 0, Math.PI*2); ctx.fill();
      }
    }
    else if (this.id === 'surge') {
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.secondary; ctx.fillRect(-5, -6, 12, 12);
      ctx.fillStyle = this.skinColor; ctx.beginPath(); ctx.arc(3, 0, 9, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-3, -5); ctx.lineTo(5, 0); ctx.lineTo(-3, 5); ctx.stroke();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(6, -2, 1.5, 0, Math.PI*2); ctx.arc(6, 2, 1.5, 0, Math.PI*2); ctx.fill();
    }
    else if (this.id === 'fang') {
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.skinColor; ctx.beginPath(); ctx.arc(3, 0, 10, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#1e40af'; ctx.beginPath(); ctx.moveTo(-6, -8); ctx.quadraticCurveTo(5, 0, -6, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(7, -3, 2, 0, Math.PI*2); ctx.arc(7, 3, 2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = this.secondary; ctx.beginPath(); ctx.moveTo(6, 12); ctx.lineTo(18, 12); ctx.lineTo(14, 16); ctx.lineTo(6, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    else if (this.id === 'kit') {
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.skinColor; ctx.beginPath(); ctx.arc(3, 0, 11, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(2, -15); ctx.lineTo(4, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-6, 8); ctx.lineTo(2, 15); ctx.lineTo(4, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(6, -3, 2, 0, Math.PI*2); ctx.arc(6, 3, 2, 0, Math.PI*2); ctx.fill();
    }
    else if (this.id === 'gale') {
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.skinColor; ctx.beginPath(); ctx.arc(3, 0, 10, 0, Math.PI*2); ctx.fill();
      // Draw Gale's blue snow cap
      ctx.fillStyle = this.secondary; ctx.beginPath(); ctx.arc(0, 0, 16.5, Math.PI, 0); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-16, 0, 3, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Fluffy mustache
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(4, 0); ctx.quadraticCurveTo(8, 8, 4, 11); ctx.stroke();
    }
    else if (this.id === 'mico') {
      // Ears
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(-14, 0, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(14, 0, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Body head
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.skinColor; ctx.beginPath(); ctx.arc(2, 0, 11, 0, Math.PI*2); ctx.fill();
      // Eyes
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(6, -3, 2, 0, Math.PI*2); ctx.arc(6, 3, 2, 0, Math.PI*2); ctx.fill();
      // Headphone / crown band
      ctx.strokeStyle = this.secondary; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 17, Math.PI*1.1, Math.PI*1.9); ctx.stroke();
    }
    else if (this.id === 'charlie') {
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.skinColor; ctx.beginPath(); ctx.arc(3, 0, 10, 0, Math.PI*2); ctx.fill();
      // Pink Hair bangs
      ctx.fillStyle = this.secondary; ctx.beginPath(); ctx.arc(0, 0, 16.5, Math.PI*0.8, Math.PI*1.2); ctx.fill();
      ctx.beginPath(); ctx.arc(1, 0, 12, Math.PI*1.1, Math.PI*1.5); ctx.fill();
      // Eyes
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(6, -3, 2, 0, Math.PI*2); ctx.arc(6, 3, 2, 0, Math.PI*2); ctx.fill();
    }
    else if (this.id === 'mortis') {
      // Cape on the back
      ctx.fillStyle = '#1e1b29'; ctx.beginPath(); ctx.arc(-3, 0, 14, Math.PI/2, Math.PI*1.5); ctx.fill(); ctx.stroke();
      // Body circle
      ctx.fillStyle = '#3b2f4f'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Face
      ctx.fillStyle = '#e0f2fe'; ctx.beginPath(); ctx.arc(3, 0, 10, 0, Math.PI*2); ctx.fill();
      // Eyes (vampire eyes)
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(7, -3, 2, 0, Math.PI*2); ctx.arc(7, 3, 2, 0, Math.PI*2); ctx.fill();
      // Hat/cape high collar
      ctx.fillStyle = '#111827'; ctx.beginPath(); ctx.arc(0, 0, 16.5, Math.PI*0.9, Math.PI*1.1); ctx.fill();
    }
    else if (this.id === 'piper') {
      // Blue Dress body
      ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Face
      ctx.fillStyle = this.skinColor; ctx.beginPath(); ctx.arc(3, 0, 10, 0, Math.PI*2); ctx.fill();
      // Blonde Hair
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.arc(-2, -7, 6, 0, Math.PI*2); ctx.arc(-2, 7, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Eyes
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(7, -3, 2, 0, Math.PI*2); ctx.arc(7, 3, 2, 0, Math.PI*2); ctx.fill();
      // Pink umbrella on the back
      ctx.fillStyle = '#f472b6'; ctx.beginPath(); ctx.arc(-11, 0, 7, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    }
    else if (this.id === 'dynamike') {
      // Body
      ctx.fillStyle = '#2563eb'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Face
      ctx.fillStyle = this.skinColor; ctx.beginPath(); ctx.arc(3, 0, 10, 0, Math.PI*2); ctx.fill();
      // White beard
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(8, 0, 6, -Math.PI*0.4, Math.PI*0.4); ctx.fill(); ctx.stroke();
      // Yellow helmet
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(-2, 0, 11, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Helmet light
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(5, 0, 3, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Eyes
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(6, -3, 1.8, 0, Math.PI*2); ctx.arc(6, 3, 1.8, 0, Math.PI*2); ctx.fill();
    }
    else if (this.id === 'frank') {
      // Massive square hammer on back
      ctx.fillStyle = '#374151'; ctx.fillRect(-14, -8, 12, 16); ctx.strokeRect(-14, -8, 12, 16);
      // Body circle
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Face
      ctx.fillStyle = this.skinColor; ctx.beginPath(); ctx.arc(3, 0, 11, 0, Math.PI*2); ctx.fill();
      // Square purple headphones/hair on sides
      ctx.fillStyle = this.secondary; ctx.fillRect(-4, -15, 6, 4); ctx.strokeRect(-4, -15, 6, 4);
      ctx.fillRect(-4, 11, 6, 4); ctx.strokeRect(-4, 11, 6, 4);
      ctx.lineWidth = 3.5; ctx.strokeStyle = this.secondary; ctx.beginPath(); ctx.moveTo(-2, -12); ctx.lineTo(-2, 12); ctx.stroke();
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#000000';
      // Angry eyebrows
      ctx.strokeStyle = '#000000'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(4, -5); ctx.lineTo(10, -3); ctx.moveTo(4, 5); ctx.lineTo(10, 3); ctx.stroke();
      ctx.lineWidth = 2.5;
      // Eyes
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(7, -3, 2, 0, Math.PI*2); ctx.arc(7, 3, 2, 0, Math.PI*2); ctx.fill();
    }
    else if (this.id === 'poco') {
      // Guitar/mariachi instrument on back
      ctx.fillStyle = '#b45309'; ctx.beginPath(); ctx.ellipse(-11, 0, 7, 5, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Skeleton head
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Black eye sockets
      ctx.fillStyle = '#111827'; ctx.beginPath(); ctx.arc(5, -4, 3.5, 0, Math.PI*2); ctx.arc(5, 4, 3.5, 0, Math.PI*2); ctx.fill();
      // Skeleton nose
      ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(6, -1); ctx.lineTo(6, 1); ctx.closePath(); ctx.fill();
      // Sombrero Hat (very wide rim)
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(-2, 0, 19, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Hat inner crown
      ctx.fillStyle = this.secondary; ctx.beginPath(); ctx.arc(-2, 0, 11, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Festive symbols on hat rim
      ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(10, -10, 2, 0, Math.PI*2); ctx.arc(10, 10, 2, 0, Math.PI*2); ctx.fill();
    }
    else if (this.id === 'tara') {
      // Wrapped head (purple/pink)
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Dark slit for the single glowing eye
      ctx.fillStyle = '#111827'; ctx.fillRect(2, -7, 6, 14);
      // Single pink glowing eye in the middle
      ctx.fillStyle = '#f43f5e'; ctx.beginPath(); ctx.arc(5, 0, 3.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(6, -1, 1, 0, Math.PI*2); ctx.fill();
      // Cards on the back
      ctx.fillStyle = '#cbd5e1'; ctx.fillRect(-12, -10, 6, 9); ctx.strokeRect(-12, -10, 6, 9);
      ctx.fillStyle = '#e11d48'; ctx.fillRect(-10, 1, 6, 9); ctx.strokeRect(-10, 1, 6, 9);
    }
    else if (this.id === 'tick') {
      // Wind-up key on the back
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-20, 0); ctx.stroke();
      ctx.fillStyle = '#64748b'; ctx.beginPath(); ctx.arc(-22, -4, 4, 0, Math.PI*2); ctx.arc(-22, 4, 4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 2.5;
      // Ball body/head
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Faceplate
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(4, 0, 11, -Math.PI*0.6, Math.PI*0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
      // Funny digital glowing eyes (one cross, one dot)
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(6, -4); ctx.lineTo(10, -2); ctx.moveTo(8, -5); ctx.lineTo(8, -1); ctx.stroke();
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(8, 3, 2, 0, Math.PI*2); ctx.fill();
      ctx.lineWidth = 2.5;
      // Red fuse on head
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(-1, -11, 4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    }
    else if (this.id === 'amber') {
      // Fire torch in her hand
      ctx.fillStyle = '#78350f'; ctx.fillRect(10, 10, 4, 10); ctx.strokeRect(10, 10, 4, 10);
      ctx.fillStyle = '#ea580c'; ctx.beginPath(); ctx.arc(12, 8, 4.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(12, 8, 2.5, 0, Math.PI*2); ctx.fill();
      // Body
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Face
      ctx.fillStyle = this.skinColor; ctx.beginPath(); ctx.arc(3, 0, 10, 0, Math.PI*2); ctx.fill();
      // Bright Orange Fire Hair on back/sides
      ctx.fillStyle = '#ea580c';
      ctx.beginPath(); ctx.arc(-4, -8, 7, 0, Math.PI*2); ctx.arc(-4, 8, 7, 0, Math.PI*2); ctx.arc(-7, 0, 8, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Eyes
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(7, -3, 2, 0, Math.PI*2); ctx.arc(7, 3, 2, 0, Math.PI*2); ctx.fill();
    }
    else if (this.id === 'bull') {
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.arc(0, -11, 5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 11, 5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.skinColor; ctx.beginPath(); ctx.arc(3, 0, 10, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(-5, 0, 8, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#eab308'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(10, 0, 4, -Math.PI*0.5, Math.PI*0.5); ctx.stroke();
    }
    else if (this.id === 'brock') {
      ctx.fillStyle = '#475569'; ctx.fillRect(6, 6, 16, 7); ctx.strokeRect(6, 6, 16, 7);
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.skinColor; ctx.beginPath(); ctx.arc(3, 0, 10, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fbbf24'; ctx.fillRect(5, -6, 4, 12); ctx.strokeRect(5, -6, 4, 12);
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(-4, 0, 9, 0, Math.PI*2); ctx.fill();
    }
    else if (this.id === 'barley') {
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(-3, 0, 12, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(6, 0, 4.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.moveTo(6, -6); ctx.lineTo(12, -2); ctx.lineTo(6, 0); ctx.lineTo(12, 2); ctx.lineTo(6, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    else if (this.id === 'nita') {
      ctx.fillStyle = '#7c2d12'; ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(-4, -13, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(-4, 13, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.skinColor; ctx.beginPath(); ctx.arc(4, 0, 9, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#3b82f6'; ctx.fillRect(4, -4, 4, 8);
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(7, -2, 1.8, 0, Math.PI*2); ctx.arc(7, 2, 1.8, 0, Math.PI*2); ctx.fill();
    }
    else if (this.id === 'bo') {
      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.ellipse(-9, -10, 8, 4, Math.PI/4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-9, 10, 8, 4, -Math.PI/4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.skinColor; ctx.beginPath(); ctx.arc(3, 0, 10, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#1e293b'; ctx.fillRect(5, -6, 4, 12); ctx.strokeRect(5, -6, 4, 12);
    }
    else if (this.id === 'jessie') {
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(-12, 0, 8, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(-2, 0, 13, Math.PI*0.5, Math.PI*1.5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.skinColor; ctx.beginPath(); ctx.arc(3, 0, 10, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(7, -3, 2, 0, Math.PI*2); ctx.arc(7, 3, 2, 0, Math.PI*2); ctx.fill();
    }
    else if (this.id === 'emz') {
      ctx.fillStyle = '#c084fc'; ctx.beginPath(); ctx.arc(-11, -9, 4, 0, Math.PI*2); ctx.arc(-11, 9, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#a855f7'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e2e8f0'; ctx.fillRect(2, -8, 6, 16); ctx.strokeRect(2, -8, 6, 16);
      ctx.fillStyle = '#ec4899'; ctx.beginPath(); ctx.arc(7, -3, 3, 0, Math.PI*2); ctx.arc(7, 3, 3, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    }
    else if (this.id === 'rico') {
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(-4, -4, 3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(0, 4, 3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(4, -2, 3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#f43f5e'; ctx.beginPath(); ctx.arc(6, 0, 4, 0, Math.PI*2); ctx.fill();
    }
    else if (this.id === 'darryl') {
      ctx.fillStyle = '#78350f'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#eab308'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(-4, 0, 13, Math.PI, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.arc(6, 0, 4, 0, Math.PI*2); ctx.fill();
    }
    else if (this.id === 'gene') {
      ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(-11, 8, 4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#a855f7'; ctx.beginPath(); ctx.arc(-4, 0, 14, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(2, 0, 3.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#f472b6'; ctx.beginPath(); ctx.arc(3, 0, 10, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(7, -3, 2, 0, Math.PI*2); ctx.arc(7, 3, 2, 0, Math.PI*2); ctx.fill();
    }

    ctx.restore();

    if (this.hyperActiveTimer > 0) {
      ctx.save();
      ctx.translate(this.x, this.y - jumpOffset);
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#d946ef';
      ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }

    // Health bar drawing
    const bw = 46, bh = 7;
    const by = this.y - 42 - jumpOffset;

    // Draw active shield (Shield gear or Edgar gadget shield)
    const activeShield = (this.shieldGearHp || 0) + (this.hardcoreShieldHp || 0);
    if (activeShield > 0) {
      // Draw blue shield bar directly above the health bar
      ctx.fillStyle = '#111827';
      ctx.fillRect(this.x - bw/2, by - 4, bw, 3);
      ctx.fillStyle = '#3b82f6';
      // Normalize shield width using maximum possible shield HP (e.g. 1500)
      ctx.fillRect(this.x - bw/2, by - 4, bw * Math.min(1.0, activeShield / 1500), 3);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
      ctx.strokeRect(this.x - bw/2, by - 4, bw, 3);
    }

    // Draw Bibi's Home Run bar if she is Bibi
    if (this.id === 'bibi' && (this as any).homeRunCharge > 0) {
      ctx.fillStyle = '#111827';
      ctx.fillRect(this.x - bw/2, by - 8, bw, 3);
      // Yellow if fully charged, light orange/red while charging
      ctx.fillStyle = (this as any).homeRunCharge >= 100 ? '#facc15' : '#fb923c';
      ctx.fillRect(this.x - bw/2, by - 8, bw * ((this as any).homeRunCharge / 100), 3);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
      ctx.strokeRect(this.x - bw/2, by - 8, bw, 3);
    }

    ctx.fillStyle = '#1f2937'; ctx.fillRect(this.x - bw/2, by, bw, bh);
    ctx.fillStyle = this.isBot ? '#ef4444' : '#10b981';
    ctx.fillRect(this.x - bw/2, by, bw * (this.hp / this.getMaxHp()), bh);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.strokeRect(this.x - bw/2, by, bw, bh);

    const ammoY = by + 9;
    const segmentW = (bw - 4) / 3;
    for(let i=0; i<3; i++) {
      const ax = this.x - bw/2 + i*(segmentW + 2);
      ctx.fillStyle = '#111827';
      ctx.fillRect(ax, ammoY, segmentW, 3);
      if (this.ammo > i) {
        ctx.fillStyle = '#f97316';
        ctx.fillRect(ax, ammoY, segmentW, 3);
      } else if (this.ammo === i) {
        ctx.fillStyle = '#f97316';
        ctx.globalAlpha = 0.5;
        ctx.fillRect(ax, ammoY, segmentW * (this.reloadTimer / this.reloadTime), 3);
        ctx.globalAlpha = 1;
      }
      ctx.strokeRect(ax, ammoY, segmentW, 3);
    }

    const superY = ammoY + 5;
    ctx.fillStyle = '#111827'; ctx.fillRect(this.x - bw/2, superY, bw, 3.5);
    ctx.fillStyle = this.superCharge >= 100 ? '#facc15' : '#3b82f6';
    ctx.fillRect(this.x - bw/2, superY, bw * (this.superCharge / 100), 3.5);
    ctx.strokeRect(this.x - bw/2, superY, bw, 3.5);

    if (this.hyperUnlocked) {
      const hyperY = superY + 4.5;
      ctx.fillStyle = '#111827'; ctx.fillRect(this.x - bw/2, hyperY, bw, 2.5);
      ctx.fillStyle = this.hyperCharge >= 100 ? '#d946ef' : '#a21caf';
      ctx.fillRect(this.x - bw/2, hyperY, bw * (this.hyperCharge / 100), 2.5);
      ctx.strokeRect(this.x - bw/2, hyperY, bw, 2.5);
    }

    if (this.powerCubes > 0) {
      ctx.fillStyle = '#eab308'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
      ctx.font = '900 12px sans-serif'; ctx.textAlign = 'center';
      ctx.strokeText(`💎${this.powerCubes}`, this.x, this.y - 54);
      ctx.fillText(`💎${this.powerCubes}`, this.x, this.y - 54);
    }

    if (this.team) {
      ctx.fillStyle = this.team === 'blue' ? '#60a5fa' : '#f87171';
    } else {
      ctx.fillStyle = '#fff';
    }
    ctx.font = '900 11px sans-serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 3; ctx.strokeStyle = '#000';
    ctx.strokeText(this.name, this.x, this.y - 66);
    ctx.fillText(this.name, this.x, this.y - 66);

    // Render battle emote / pin
    if (this.activeEmoteTimer > 0) {
      const emoteY = this.y - 95 + Math.sin(Date.now() / 120) * 3;
      ctx.save();
      const popProgress = Math.min(1.0, (2500 - this.activeEmoteTimer) / 180);
      const scale = popProgress * (1 + 0.15 * Math.sin(popProgress * Math.PI));
      ctx.translate(0, 0); // already in world coordinates
      ctx.scale(1, 1); // fallback
      
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      
      // Balloon
      ctx.beginPath();
      ctx.arc(this.x, emoteY, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Tail
      ctx.beginPath();
      ctx.moveTo(this.x - 4, emoteY + 13);
      ctx.lineTo(this.x, emoteY + 19);
      ctx.lineTo(this.x + 4, emoteY + 13);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Clean line overlap
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(this.x - 3, emoteY + 12);
      ctx.lineTo(this.x, emoteY + 17);
      ctx.lineTo(this.x + 3, emoteY + 12);
      ctx.closePath();
      ctx.fill();

      // Icon emoji text
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.activeEmote || '👍', this.x, emoteY);
      ctx.restore();
    }

    ctx.restore();
  }
}
