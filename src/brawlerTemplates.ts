import { BrawlerTemplate, BrawlerSkins } from './types';

export const BRAWLER_TEMPLATES: Record<string, BrawlerTemplate> = {
  shelly: { id: 'shelly', name: 'Shelly', hp: 5000, damage: 450, speed: 3.6, attackRange: 170, reloadTime: 800, bulletSpeed: 12, type: 'shotgun', description: 'Fires a wide spread of shells. Super blows away cover!', rarity: 'Common' },
  colt: { id: 'colt', name: 'Colt', hp: 4200, damage: 320, speed: 4.0, attackRange: 240, reloadTime: 700, bulletSpeed: 15, type: 'burst', description: 'Fires long-range bursts of bullets. Super shreds obstacles!', rarity: 'Common' },
  el_primo: { id: 'el_primo', name: 'El Primo', hp: 6000, damage: 650, speed: 4.1, attackRange: 120, reloadTime: 600, bulletSpeed: 18, type: 'punch', description: 'Unleashes a flurry of fiery punches. Super leaps onto enemies!', rarity: 'Rare' },
  spike: { id: 'spike', name: 'Spike', hp: 3800, damage: 520, speed: 3.5, attackRange: 210, reloadTime: 900, bulletSpeed: 10, type: 'spike', description: 'Throws needle-bursting cactus bombs. Super slows and heals!', rarity: 'Legendary' },
  kenji: { id: 'kenji', name: 'Kenji', hp: 4800, damage: 580, speed: 4.2, attackRange: 160, reloadTime: 700, bulletSpeed: 14, type: 'dash', description: 'Slashes and dashes through targets. Attacks grant a shield!', rarity: 'Mythic' },
  edgar: { id: 'edgar', name: 'Edgar', hp: 4200, damage: 540, speed: 4.3, attackRange: 105, reloadTime: 500, bulletSpeed: 16, type: 'scarf', description: 'Heals upon hitting enemies. Super charges automatically over time!', rarity: 'Epic' },
  bibi: { id: 'bibi', name: 'Bibi', hp: 4600, damage: 800, speed: 4.4, attackRange: 140, reloadTime: 800, bulletSpeed: 18, type: 'swing', description: 'Hits enemies with a wide bat swing. Full ammo charges a knockback!', rarity: 'Epic' },
  leon: { id: 'leon', name: 'Leon', hp: 3200, damage: 480, speed: 4.5, attackRange: 210, reloadTime: 750, bulletSpeed: 16, type: 'stealth', description: 'Fires spinning blades. Super grants invisibility and speed!', rarity: 'Legendary' },
  crow: { id: 'crow', name: 'Crow', hp: 3800, damage: 320, speed: 4.4, attackRange: 240, reloadTime: 700, bulletSpeed: 14, type: 'poison', description: 'Fires poisoned daggers that block healing. Super leaps high, throwing daggers on jump and landing!', rarity: 'Legendary' },
  surge: { id: 'surge', name: 'Surge', hp: 4300, damage: 1180, speed: 3.2, attackRange: 160, reloadTime: 700, bulletSpeed: 14, type: 'upgrade', description: 'Juice shots split on impact! Super upgrades stats!', rarity: 'Legendary' },
  fang: { id: 'fang', name: 'Fang', hp: 5800, damage: 1400, speed: 4.2, attackRange: 70, reloadTime: 650, bulletSpeed: 18, type: 'shoe', description: 'Melee kicks that fly off if they miss! Super chains to enemies!', rarity: 'Epic' },
  kit: { id: 'kit', name: 'Kit', hp: 3000, damage: 800, speed: 4.4, attackRange: 80, reloadTime: 600, bulletSpeed: 12, type: 'attach', description: 'Claws up close! Super attaches to brawlers!', rarity: 'Legendary' },
  
  // NEW BRAWLERS!
  gale: { id: 'gale', name: 'Gale', hp: 4800, damage: 360, speed: 3.8, attackRange: 220, reloadTime: 750, bulletSpeed: 13, type: 'wind', description: 'Fires a wide line of cold wind. Super blows back and slows down enemies with a giant blizzard!', rarity: 'Epic' },
  mico: { id: 'mico', name: 'Mico', hp: 4000, damage: 1100, speed: 4.1, attackRange: 100, reloadTime: 950, bulletSpeed: 14, type: 'hopper', description: 'Every attack causes Mico to hop forward, avoiding all damage mid-air! Super launches him high into the sky to drop down with a stun!', rarity: 'Mythic' },
  charlie: { id: 'charlie', name: 'Charlie', hp: 4400, damage: 760, speed: 3.9, attackRange: 190, reloadTime: 600, bulletSpeed: 16, type: 'cocoon', description: 'Fires a hair yo-yo that returns to her. Super traps enemies in a cocoon web, silencing and freezing them completely!', rarity: 'Epic' },
  
  mortis: { id: 'mortis', name: 'Mortis', hp: 5400, damage: 940, speed: 4.4, attackRange: 120, reloadTime: 950, bulletSpeed: 18, type: 'dash', description: 'Dashes forward with a swing of his shovel. Super summons a swarm of life-stealing bats!', rarity: 'Mythic' },
  piper: { id: 'piper', name: 'Piper', hp: 3400, damage: 1520, speed: 3.8, attackRange: 260, reloadTime: 1100, bulletSpeed: 20, type: 'sniper', description: 'Sniper bullet deals massive damage the further it travels! Super jumps and drops 4 sweet grenades!', rarity: 'Epic' },
  dynamike: { id: 'dynamike', name: 'Dynamike', hp: 3800, damage: 1200, speed: 3.6, attackRange: 200, reloadTime: 850, bulletSpeed: 11, type: 'lobber', description: 'Lobs dual sticks of dynamite that bypass walls! Super throws a massive, explosive Big Barrel o\' Bomb!', rarity: 'Common' },
  frank: { id: 'frank', name: 'Frank', hp: 7000, damage: 1600, speed: 3.2, attackRange: 130, reloadTime: 800, bulletSpeed: 16, type: 'hammer', description: 'Swings a giant hammer that shakes the ground! Super stuns all enemies hit completely!', rarity: 'Epic' },
  poco: { id: 'poco', name: 'Poco', hp: 4000, damage: 800, speed: 3.8, attackRange: 190, reloadTime: 700, bulletSpeed: 13, type: 'music', description: 'Fires a wide wave of musical notes that pierces enemies. Super instantly heals himself and nearby allies!', rarity: 'Rare' },
  tara: { id: 'tara', name: 'Tara', hp: 4400, damage: 480, speed: 3.8, attackRange: 200, reloadTime: 900, bulletSpeed: 15, type: 'tarot', description: 'Throws three piercing tarot cards in a spread. Super spawns a gravity well that pulls enemies in!', rarity: 'Mythic' },
  tick: { id: 'tick', name: 'Tick', hp: 3000, damage: 640, speed: 3.5, attackRange: 220, reloadTime: 1000, bulletSpeed: 11, type: 'mine', description: 'Lobs a cluster of three proximity mines that explode on contact. Super launches his tracking head!', rarity: 'Super Rare' },
  amber: { id: 'amber', name: 'Amber', hp: 4200, damage: 240, speed: 4.0, attackRange: 180, reloadTime: 150, bulletSpeed: 15, type: 'fire', description: 'Unleashes a continuous stream of fire at enemies. Super lobs a bottle of oil that ignites and burns!', rarity: 'Legendary' },
  bull: { id: 'bull', name: 'Bull', hp: 6200, damage: 480, speed: 4.1, attackRange: 130, reloadTime: 800, bulletSpeed: 14, type: 'shotgun', description: 'Heavy shotgun damage up close. Super charges forward!', rarity: 'Common' },
  brock: { id: 'brock', name: 'Brock', hp: 3600, damage: 1100, speed: 3.7, attackRange: 250, reloadTime: 1000, bulletSpeed: 16, type: 'rocket', description: 'Fires long-range explosive rockets. Super rains rockets in an area!', rarity: 'Rare' },
  barley: { id: 'barley', name: 'Barley', hp: 3400, damage: 680, speed: 3.6, attackRange: 210, reloadTime: 900, bulletSpeed: 12, type: 'bottle', description: 'Lobs bottles of toxic brew that leave a burning pool. Super throws a massive array of burning bottles!', rarity: 'Rare' },
  nita: { id: 'nita', name: 'Nita', hp: 5200, damage: 880, speed: 3.8, attackRange: 160, reloadTime: 750, bulletSpeed: 15, type: 'shaman', description: 'Fires shockwaves that pierce enemies. Super summons her loyal bear Bruce!', rarity: 'Common' },
  bo: { id: 'bo', name: 'Bo', hp: 4800, damage: 620, speed: 3.8, attackRange: 210, reloadTime: 850, bulletSpeed: 14, type: 'bow', description: 'Fires three explosive arrows. Super places hidden proximity mines!', rarity: 'Epic' },
  jessie: { id: 'jessie', name: 'Jessie', hp: 4400, damage: 820, speed: 3.8, attackRange: 200, reloadTime: 800, bulletSpeed: 14, type: 'spark', description: 'Fires bouncing energy orbs. Super deploys her loyal gun turret Scrappy!', rarity: 'Common' },
  emz: { id: 'emz', name: 'Emz', hp: 4400, damage: 520, speed: 3.8, attackRange: 190, reloadTime: 900, bulletSpeed: 13, type: 'spray', description: 'Sprays a toxic cloud that damages over time. Super slows and damages in a massive circle!', rarity: 'Epic' },
  rico: { id: 'rico', name: 'Rico', hp: 3600, damage: 320, speed: 4.0, attackRange: 240, reloadTime: 700, bulletSpeed: 16, type: 'bouncy', description: 'Main attack bounces off walls and gains range. Super fires a long piercing stream of bouncy balls!', rarity: 'Super Rare' },
  darryl: { id: 'darryl', name: 'Darryl', hp: 6000, damage: 360, speed: 4.2, attackRange: 140, reloadTime: 700, bulletSpeed: 15, type: 'dual_shotgun', description: 'Fires two shotgun bursts. Super rolls him forward, bouncing off walls and charging automatically!', rarity: 'Super Rare' },
  gene: { id: 'gene', name: 'Gene', hp: 4600, damage: 960, speed: 3.8, attackRange: 220, reloadTime: 900, bulletSpeed: 13, type: 'magic', description: 'Fires a smoke ball that splits into small pellets. Super pulls enemies directly to him!', rarity: 'Mythic' }
};

export const SKIN_DATA: Record<string, BrawlerSkins> = {
  shelly: {
    default: { name: 'Default Shelly', color: '#a855f7', skinColor: '#ffedd5', secondary: '#facc15', cost: 0 },
    bandita: { name: 'Bandita Shelly', color: '#374151', skinColor: '#ffedd5', secondary: '#ef4444', cost: 1000 },
    star: { name: 'Star Shelly', color: '#8b5cf6', skinColor: '#ffedd5', secondary: '#2dd4bf', cost: 1500 },
    true_silver: { name: 'True Silver Shelly', color: '#e2e8f0', skinColor: '#f8fafc', secondary: '#cbd5e1', cost: 2500 },
    true_gold: { name: 'True Gold Shelly', color: '#eab308', skinColor: '#fef08a', secondary: '#ca8a04', cost: 5000 }
  },
  colt: {
    default: { name: 'Default Colt', color: '#2563eb', skinColor: '#ffedd5', secondary: '#ec4899', cost: 0 },
    rockstar: { name: 'Rockstar Colt', color: '#1f2937', skinColor: '#ffedd5', secondary: '#9ca3af', cost: 1000 },
    corsair: { name: 'Corsair Colt', color: '#064e3b', skinColor: '#ffedd5', secondary: '#fcd34d', cost: 1500 },
    true_silver: { name: 'True Silver Colt', color: '#e2e8f0', skinColor: '#f8fafc', secondary: '#cbd5e1', cost: 2500 },
    true_gold: { name: 'True Gold Colt', color: '#eab308', skinColor: '#fef08a', secondary: '#ca8a04', cost: 5000 }
  },
  el_primo: {
    default: { name: 'El Primo', color: '#1d4ed8', skinColor: '#d97736', secondary: '#ef4444', cost: 0 },
    el_rudo: { name: 'El Rudo Primo', color: '#111827', skinColor: '#b45309', secondary: '#8b5cf6', cost: 1000 },
    el_dragon: { name: 'El Dragon', color: '#14b8a6', skinColor: '#d97736', secondary: '#f59e0b', cost: 1500 },
    true_silver: { name: 'True Silver Primo', color: '#e2e8f0', skinColor: '#f8fafc', secondary: '#cbd5e1', cost: 2500 },
    true_gold: { name: 'True Gold Primo', color: '#eab308', skinColor: '#fef08a', secondary: '#ca8a04', cost: 5000 }
  },
  spike: {
    default: { name: 'Default Spike', color: '#22c55e', skinColor: '#111827', secondary: '#15803d', cost: 0 },
    sakura: { name: 'Sakura Spike', color: '#f472b6', skinColor: '#111827', secondary: '#be185d', cost: 1000 },
    dark_lord: { name: 'Dark Lord Spike', color: '#1f2937', skinColor: '#000000', secondary: '#ef4444', cost: 1500 },
    true_silver: { name: 'True Silver Spike', color: '#e2e8f0', skinColor: '#f8fafc', secondary: '#cbd5e1', cost: 2500 },
    true_gold: { name: 'True Gold Spike', color: '#eab308', skinColor: '#fef08a', secondary: '#ca8a04', cost: 5000 }
  },
  kenji: {
    default: { name: 'Default Kenji', color: '#1e1b4b', skinColor: '#fbcfe8', secondary: '#e2e8f0', cost: 0 },
    ronin: { name: 'Ronin Kenji', color: '#7f1d1d', skinColor: '#fbcfe8', secondary: '#facc15', cost: 1000 },
    cyber: { name: 'Cyber Kenji', color: '#0f172a', skinColor: '#38bdf8', secondary: '#f43f5e', cost: 1500 },
    true_silver: { name: 'True Silver Kenji', color: '#e2e8f0', skinColor: '#f8fafc', secondary: '#cbd5e1', cost: 2500 },
    true_gold: { name: 'True Gold Kenji', color: '#eab308', skinColor: '#fef08a', secondary: '#ca8a04', cost: 5000 }
  },
  edgar: {
    default: { name: 'Default Edgar', color: '#1f2937', skinColor: '#ffedd5', secondary: '#ef4444', cost: 0 },
    orochi: { name: 'Orochi Edgar', color: '#f8fafc', skinColor: '#ffedd5', secondary: '#10b981', cost: 1000 },
    angel: { name: 'Angel Edgar', color: '#f0fdf4', skinColor: '#ffedd5', secondary: '#facc15', cost: 1500 },
    true_silver: { name: 'True Silver Edgar', color: '#e2e8f0', skinColor: '#f8fafc', secondary: '#cbd5e1', cost: 2500 },
    true_gold: { name: 'True Gold Edgar', color: '#eab308', skinColor: '#fef08a', secondary: '#ca8a04', cost: 5000 }
  },
  bibi: {
    default: { name: 'Default Bibi', color: '#1e293b', skinColor: '#ffedd5', secondary: '#ec4899', cost: 0 },
    heroine: { name: 'Heroine Bibi', color: '#06b6d4', skinColor: '#ffedd5', secondary: '#a855f7', cost: 1000 },
    zombibi: { name: 'Zombibi', color: '#166534', skinColor: '#86efac', secondary: '#1e293b', cost: 1500 },
    true_silver: { name: 'True Silver Bibi', color: '#e2e8f0', skinColor: '#f8fafc', secondary: '#cbd5e1', cost: 2500 },
    true_gold: { name: 'True Gold Bibi', color: '#eab308', skinColor: '#fef08a', secondary: '#ca8a04', cost: 5000 }
  },
  leon: {
    default: { name: 'Default Leon', color: '#10b981', skinColor: '#ffedd5', secondary: '#064e3b', cost: 0 },
    shark: { name: 'Shark Leon', color: '#3b82f6', skinColor: '#ffedd5', secondary: '#1e3a8a', cost: 1000 },
    sally: { name: 'Sally Leon', color: '#f472b6', skinColor: '#ffedd5', secondary: '#be185d', cost: 1500 },
    true_silver: { name: 'True Silver Leon', color: '#e2e8f0', skinColor: '#f8fafc', secondary: '#cbd5e1', cost: 2500 },
    true_gold: { name: 'True Gold Leon', color: '#eab308', skinColor: '#fef08a', secondary: '#ca8a04', cost: 5000 }
  },
  crow: {
    default: { name: 'Default Crow', color: '#111827', skinColor: '#38bdf8', secondary: '#f59e0b', cost: 0 },
    white: { name: 'White Crow', color: '#f8fafc', skinColor: '#ffffff', secondary: '#f97316', cost: 1000 },
    crowbone: { name: 'Crowbone', color: '#4c1d95', skinColor: '#c084fc', secondary: '#06b6d4', cost: 1500 },
    night_mecha: { name: 'Night Mecha Crow', color: '#0f172a', skinColor: '#f1f5f9', secondary: '#ec4899', cost: 2500 },
    gold_mecha: { name: 'Gold Mecha Crow', color: '#eab308', skinColor: '#ffffff', secondary: '#ca8a04', cost: 5000 }
  },
  surge: {
    default: { name: 'Default Surge', color: '#dc2626', skinColor: '#facc15', secondary: '#3b82f6', cost: 0 }
  },
  fang: {
    default: { name: 'Default Fang', color: '#1d4ed8', skinColor: '#ffedd5', secondary: '#facc15', cost: 0 }
  },
  kit: {
    default: { name: 'Default Kit', color: '#fcd34d', skinColor: '#ffffff', secondary: '#fbbf24', cost: 0 }
  },
  gale: {
    default: { name: 'Default Gale', color: '#38bdf8', skinColor: '#ffedd5', secondary: '#0284c7', cost: 0 },
    merchant: { name: 'Merchant Gale', color: '#facc15', skinColor: '#ffedd5', secondary: '#b45309', cost: 1500 }
  },
  mico: {
    default: { name: 'Default Mico', color: '#b45309', skinColor: '#ffedd5', secondary: '#facc15', cost: 0 },
    grinch: { name: 'Grinch Mico', color: '#22c55e', skinColor: '#ffedd5', secondary: '#ef4444', cost: 1500 }
  },
  charlie: {
    default: { name: 'Default Charlie', color: '#ec4899', skinColor: '#ffedd5', secondary: '#a855f7', cost: 0 },
    spider: { name: 'Spider Charlie', color: '#111827', skinColor: '#ffedd5', secondary: '#e11d48', cost: 1500 }
  },
  mortis: {
    default: { name: 'Default Mortis', color: '#6b21a8', skinColor: '#e2e8f0', secondary: '#1e1b4b', cost: 0 },
    rogue: { name: 'Rogue Mortis', color: '#10b981', skinColor: '#e2e8f0', secondary: '#fbbf24', cost: 1500 },
    night_witch: { name: 'Night Witch Mortis', color: '#1e293b', skinColor: '#f1f5f9', secondary: '#d946ef', cost: 2000 }
  },
  piper: {
    default: { name: 'Default Piper', color: '#38bdf8', skinColor: '#ffedd5', secondary: '#ec4899', cost: 0 },
    cupid: { name: 'Cupid Piper', color: '#f43f5e', skinColor: '#ffedd5', secondary: '#fb7185', cost: 1500 },
    mariposa: { name: 'Mariposa Piper', color: '#8b5cf6', skinColor: '#fef08a', secondary: '#1e293b', cost: 2000 }
  },
  dynamike: {
    default: { name: 'Default Dynamike', color: '#ef4444', skinColor: '#fbcfe8', secondary: '#3b82f6', cost: 0 },
    robo: { name: 'Robo Mike', color: '#64748b', skinColor: '#94a3b8', secondary: '#ef4444', cost: 1500 },
    spicy: { name: 'Spicy Mike', color: '#b45309', skinColor: '#ff8a00', secondary: '#10b981', cost: 2000 }
  },
  frank: {
    default: { name: 'Default Frank', color: '#4b5563', skinColor: '#cbd5e1', secondary: '#a855f7', cost: 0 },
    caveman: { name: 'Caveman Frank', color: '#78350f', skinColor: '#9ca3af', secondary: '#eab308', cost: 1500 }
  },
  poco: {
    default: { name: 'Default Poco', color: '#facc15', skinColor: '#ffedd5', secondary: '#111827', cost: 0 },
    pirate: { name: 'Pirate Poco', color: '#0f172a', skinColor: '#ffedd5', secondary: '#ef4444', cost: 1500 }
  },
  tara: {
    default: { name: 'Default Tara', color: '#ec4899', skinColor: '#f43f5e', secondary: '#111827', cost: 0 },
    ninja: { name: 'Street Ninja Tara', color: '#1e1b4b', skinColor: '#a855f7', secondary: '#06b6d4', cost: 1500 }
  },
  tick: {
    default: { name: 'Default Tick', color: '#0284c7', skinColor: '#64748b', secondary: '#facc15', cost: 0 },
    snowman: { name: 'Snowman Tick', color: '#ffffff', skinColor: '#94a3b8', secondary: '#38bdf8', cost: 1500 }
  },
  amber: {
    default: { name: 'Default Amber', color: '#f97316', skinColor: '#ffedd5', secondary: '#ef4444', cost: 0 },
    frost_queen: { name: 'Frost Queen Amber', color: '#38bdf8', skinColor: '#e0f2fe', secondary: '#60a5fa', cost: 2000 }
  },
  bull: {
    default: { name: 'Default Bull', color: '#1e293b', skinColor: '#ffedd5', secondary: '#b45309', cost: 0 },
    linebacker: { name: 'Linebacker Bull', color: '#10b981', skinColor: '#ffedd5', secondary: '#ffffff', cost: 1500 }
  },
  brock: {
    default: { name: 'Default Brock', color: '#4f46e5', skinColor: '#854d0e', secondary: '#facc15', cost: 0 },
    beach: { name: 'Beach Brock', color: '#3b82f6', skinColor: '#854d0e', secondary: '#f97316', cost: 1000 }
  },
  barley: {
    default: { name: 'Default Barley', color: '#475569', skinColor: '#f1f5f9', secondary: '#e2e8f0', cost: 0 },
    golden: { name: 'Golden Barley', color: '#eab308', skinColor: '#fef08a', secondary: '#ca8a04', cost: 1500 }
  },
  nita: {
    default: { name: 'Default Nita', color: '#ef4444', skinColor: '#ffedd5', secondary: '#78350f', cost: 0 },
    shiba: { name: 'Shiba Nita', color: '#fbbf24', skinColor: '#ffedd5', secondary: '#f59e0b', cost: 1500 }
  },
  bo: {
    default: { name: 'Default Bo', color: '#15803d', skinColor: '#d97736', secondary: '#eab308', cost: 0 },
    mecha: { name: 'Mecha Bo', color: '#d97736', skinColor: '#ffffff', secondary: '#ef4444', cost: 2500 }
  },
  jessie: {
    default: { name: 'Default Jessie', color: '#f43f5e', skinColor: '#ffedd5', secondary: '#06b6d4', cost: 0 },
    shadow: { name: 'Shadow Knight Jessie', color: '#1e1b4b', skinColor: '#cbd5e1', secondary: '#e11d48', cost: 2000 }
  },
  emz: {
    default: { name: 'Default Emz', color: '#a855f7', skinColor: '#d8b4fe', secondary: '#db2777', cost: 0 },
    super_fan: { name: 'Super Fan Emz', color: '#e11d48', skinColor: '#d8b4fe', secondary: '#facc15', cost: 1500 }
  },
  rico: {
    default: { name: 'Default Rico', color: '#2563eb', skinColor: '#93c5fd', secondary: '#3b82f6', cost: 0 },
    loaded: { name: 'Loaded Rico', color: '#eab308', skinColor: '#fef08a', secondary: '#ca8a04', cost: 2500 }
  },
  darryl: {
    default: { name: 'Default Darryl', color: '#78350f', skinColor: '#e2e8f0', secondary: '#facc15', cost: 0 },
    dumpling: { name: 'Dumpling Darryl', color: '#dc2626', skinColor: '#fef08a', secondary: '#16a34a', cost: 1500 }
  },
  gene: {
    default: { name: 'Default Gene', color: '#c084fc', skinColor: '#fbcfe8', secondary: '#fbbf24', cost: 0 },
    evil: { name: 'Evil Gene', color: '#7f1d1d', skinColor: '#f43f5e', secondary: '#000000', cost: 2000 }
  }
};
