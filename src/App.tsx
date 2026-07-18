import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BRAWLER_TEMPLATES, SKIN_DATA } from './brawlerTemplates';
import { getBrawlerSVG } from './brawlerSvg';
import { 
  GameWorld, Character, Projectile, PowerBox, PowerCube, 
  Obstacle, Bush, MysteryBox, EnergyDrink, JumpPad, 
  MeteorTarget, HealingZone, BossRobot, Particle, FloatingText, CircleSlashParticle, SeededRandom, isTeammate
} from './gameClasses';
import { 
  Trophy, Shield, Swords, Zap, Sparkles, ShoppingBag, 
  User, RefreshCw, Star, Play, Award, Volume2, VolumeX, X,
  Compass, CheckCircle2
} from 'lucide-react';

interface BrawlerState {
  level: number;
  trophies: number;
  unlocked: boolean;
  selectedSkin: string;
  selectedGadget?: string;
  selectedStarPower?: string;
  selectedGears?: string[];
  unlockedGadgets?: string[];
  unlockedStarPowers?: string[];
  unlockedGears?: string[];
  hyperchargeUnlocked?: boolean;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  rewardCoins: number;
  rewardPP: number;
  completed: boolean;
}

export function getMasteryInfo(points: number = 0) {
  const rankNames = [
    'Wood', 
    'Bronze I', 'Bronze II', 'Bronze III', 
    'Silver I', 'Silver II', 'Silver III', 
    'Gold I', 'Gold II', 'Gold III'
  ];
  const badges = [
    '🪵',
    '🥉', '🥉', '🥉',
    '🥈', '🥈', '🥈',
    '🥇', '🥇', '🥇'
  ];
  const colors = [
    'text-amber-700 bg-amber-700/10',
    'text-orange-400 bg-orange-400/10 border-orange-500/30',
    'text-orange-400 bg-orange-400/10 border-orange-500/30',
    'text-orange-400 bg-orange-400/10 border-orange-500/30',
    'text-slate-300 bg-slate-300/10 border-slate-400/30',
    'text-slate-300 bg-slate-300/10 border-slate-400/30',
    'text-slate-300 bg-slate-300/10 border-slate-400/30',
    'text-yellow-400 bg-yellow-400/10 border-yellow-500/35',
    'text-yellow-400 bg-yellow-400/10 border-yellow-500/35',
    'text-yellow-400 bg-yellow-400/10 border-yellow-500/35 animate-pulse',
  ];

  const level = Math.min(9, Math.floor(points / 200));
  const rankName = rankNames[level];
  const badge = badges[level];
  const badgeColor = colors[level];
  const pointsInCurrentLevel = points % 200;
  const percent = level === 9 ? 100 : Math.floor((pointsInCurrentLevel / 200) * 100);

  return {
    level,
    rankName,
    badge,
    badgeColor,
    percent,
    nextThreshold: (level + 1) * 200
  };
}

interface UserProfile {
  username: string;
  isGuest: boolean;
  coins: number;
  powerPoints: number;
  totalTrophies: number;
  brawlerStates: Record<string, BrawlerState>;
  unlockedSkins: string[];
  bio?: string;
  gender?: string;
  role?: string;
  stats: {
    matchesPlayed: number;
    matchesWon: number;
    totalKills: number;
    totalDamage: number;
    rank: string;
  };
}

export const UNIVERSAL_GEARS = [
  { id: 'shield', name: 'Shield Gear', description: 'Gain a 900 HP recharging shield (charges when out of combat for 5 seconds)', icon: '🛡️', color: 'border-blue-500 text-blue-400 bg-blue-500/10' },
  { id: 'damage', name: 'Damage Gear', description: 'Deal +15% extra damage when your health is below 50%', icon: '⚔️', color: 'border-rose-500 text-rose-400 bg-rose-500/10' },
  { id: 'speed', name: 'Speed Gear', description: 'Increase movement speed by 15% when walking in bushes', icon: '🏃', color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10' },
  { id: 'regen', name: 'Regen Gear', description: 'Recover health 20% faster when out of combat', icon: '💖', color: 'border-fuchsia-500 text-fuchsia-400 bg-fuchsia-500/10' },
  { id: 'gadget_charge', name: 'Gadget Charge', description: 'Gain 1 extra Gadget use per match (4 total uses)', icon: '🟢', color: 'border-teal-500 text-teal-400 bg-teal-500/10' }
];

export const BRAWLER_LOADOUTS: Record<string, {
  gadgets: { id: string; name: string; description: string; icon: string }[];
  starPowers: { id: string; name: string; description: string; icon: string }[];
}> = {
  shelly: {
    gadgets: [
      { id: 'dash', name: 'Fast Forward', description: 'Shelly dashes forward, skipping over obstacles and escaping enemies!', icon: '🏃' },
      { id: 'clay_pigeons', name: 'Clay Pigeons', description: 'Next attack has highly increased range and tighter spread!', icon: '🎯' }
    ],
    starPowers: [
      { id: 'shockwave', name: 'Shell Shock', description: "Shelly's Super slows down enemies for 3.0 seconds!", icon: '🐚' },
      { id: 'band_aid', name: 'Band-Aid', description: 'When Shelly falls below 40% health, instantly heals 1800 health!', icon: '🩹' }
    ]
  },
  colt: {
    gadgets: [
      { id: 'speed_loader', name: 'Speed Loader', description: 'Instantly reloads 2 full ammo bars!', icon: '⚡' },
      { id: 'silver_bullet', name: 'Silver Bullet', description: 'Next attack shoots a single powerful bullet that breaks walls!', icon: '🪙' }
    ],
    starPowers: [
      { id: 'slick_boots', name: 'Slick Boots', description: "Colt's movement speed is permanently increased by 10%!", icon: '👢' },
      { id: 'magnum_special', name: 'Magnum Special', description: "Colt's attack range and bullet speed are increased by 12%!", icon: '🔫' }
    ]
  },
  bull: {
    gadgets: [
      { id: 't_bone', name: 'T-Bone Steak', description: 'Bull instantly rejuvenates for 1500 health!', icon: '🥩' },
      { id: 'stomper', name: 'Stomper', description: 'Bull can interrupt his Super charge and slow nearby enemies!', icon: '👞' }
    ],
    starPowers: [
      { id: 'berserker', name: 'Berserker', description: "When below 55% health, Bull's reload speed is doubled!", icon: '🐂' },
      { id: 'tough_guy', name: 'Tough Guy', description: 'When below 40% health, Bull gains a 30% damage reduction shield!', icon: '🛡️' }
    ]
  },
  spike: {
    gadgets: [
      { id: 'popping_pincushion', name: 'Popping Pincushion', description: 'Fires 3 waves of needles in all directions!', icon: '🌵' },
      { id: 'life_plant', name: 'Life Plant', description: 'Spawns a cactus with 2000 HP that heals allies when destroyed!', icon: '🌱' }
    ],
    starPowers: [
      { id: 'fertilizer', name: 'Fertilizer', description: 'Spike regenerates 800 HP per second while inside his Super storm!', icon: '💩' },
      { id: 'curveball', name: 'Curveball', description: "Spike's attack needles fly in a curved trajectory!", icon: '🌀' }
    ]
  },
  crow: {
    gadgets: [
      { id: 'defense_booster', name: 'Defense Booster', description: 'Crow gains a 40% damage shield for 4.0 seconds!', icon: '🛡️' },
      { id: 'slowing_toxin', name: 'Slowing Toxin', description: 'All poisoned enemies are slowed for 3.0 seconds!', icon: '🧪' }
    ],
    starPowers: [
      { id: 'extra_toxic', name: 'Extra Toxic', description: 'Poisoned enemies deal 15% less damage!', icon: '☣️' },
      { id: 'carrion_crow', name: 'Carrion Crow', description: 'Deals +120 extra damage to targets below 50% health!', icon: '🦅' }
    ]
  },
  leon: {
    gadgets: [
      { id: 'clone', name: 'Clone Projector', description: 'Leon creates a clone of himself to distract enemies!', icon: '👥' },
      { id: 'lollipop', name: 'Lollipop Drop', description: 'Spawns a lollipop that creates an invisibility field for allies!', icon: '🍭' }
    ],
    starPowers: [
      { id: 'smoke_trails', name: 'Smoke Trails', description: 'Leon moves 25% faster while invisible!', icon: '👟' },
      { id: 'invisiheal', name: 'Invisiheal', description: 'Leon recovers 600 health per second while invisible!', icon: '💖' }
    ]
  },
  kenji: {
    gadgets: [
      { id: 'dash_strike', name: 'Dash Strike', description: 'Kenji performs a quick dash, slicing all enemies in path!', icon: '⚔️' },
      { id: 'healing_broth', name: 'Healing Broth', description: 'Kenji instantly restores 1200 health.', icon: '🍲' }
    ],
    starPowers: [
      { id: 'iaido_focus', name: 'Iaido Focus', description: "Kenji's alternate strikes deal +15% damage!", icon: '🗡️' },
      { id: 'unyielding_spirit', name: 'Unyielding Spirit', description: 'Kenji heals for 10% of damage dealt to enemies!', icon: '💮' }
    ]
  },
  surge: {
    gadgets: [
      { id: 'power_surge', name: 'Power Surge', description: 'Surge instantly increases his upgrade level by 1 for 10s!', icon: '⚡' },
      { id: 'shield_surge', name: 'Shield Surge', description: 'Next hit taken is reduced by 50% and reloads 1 ammo!', icon: '🛡️' }
    ],
    starPowers: [
      { id: 'to_the_max', name: 'To The Max', description: "Surge's main attack splits when hitting walls!", icon: '📈' },
      { id: 'serve_ice_cold', name: 'Serve Ice Cold', description: 'Surge keeps his Level 1 upgrade stage upon respawning!', icon: '🧊' }
    ]
  },
  fang: {
    gadgets: [
      { id: 'corn_fu', name: 'Corn-Fu', description: 'Fang spins and throws explosive popcorn in all directions!', icon: '🍿' },
      { id: 'roundhouse', name: 'Roundhouse Kick', description: 'Next kick stuns nearby enemies for 1.0 second!', icon: '👟' }
    ],
    starPowers: [
      { id: 'fresh_kicks', name: 'Fresh Kicks', description: "Defeating an enemy instantly recharges Fang's Super!", icon: '🥾' },
      { id: 'divine_sole', name: 'Divine Sole', description: 'Reduces incoming damage by 500 once every 3.0 seconds!', icon: '🛡️' }
    ]
  },
  kit: {
    gadgets: [
      { id: 'cardboard_box', name: 'Cardboard Box', description: 'Kit becomes invisible for 5 seconds when standing still!', icon: '📦' },
      { id: 'cheeseburger', name: 'Cheeseburger', description: 'Instantly heals himself and attached teammate for 1500 HP!', icon: '🍔' }
    ],
    starPowers: [
      { id: 'power_hungry', name: 'Power Hungry', description: 'Kit gains double power from Power Cubes!', icon: '🍖' },
      { id: 'overly_attached', name: 'Overly Attached', description: 'Kit remains attached to teammates for 50% longer duration!', icon: '😸' }
    ]
  },
  bibi: {
    gadgets: [
      { id: 'vitamin_z', name: 'Vitamin Z', description: 'Bibi heals 600 HP per second for 4.0 seconds!', icon: '💊' },
      { id: 'extra_sticky', name: 'Extra Sticky', description: 'Next Spitball slows down enemies for 3.0 seconds!', icon: '🍬' }
    ],
    starPowers: [
      { id: 'home_run', name: 'Home Run Speed', description: 'Bibi moves 12% faster when her Home Run bar is fully charged!', icon: '🏃' },
      { id: 'batting_stance', name: 'Batting Stance', description: 'Bibi gains a 20% damage shield when her Home Run bar is fully charged!', icon: '🛡️' }
    ]
  },
  edgar: {
    gadgets: [
      { id: 'fly_free', name: 'Let\'s Fly', description: "Edgar's Super charging speed is boosted by 200% for 4.0 seconds!", icon: '🪽' },
      { id: 'hard_core', name: 'Hard Core', description: 'Edgar gains a 1200 HP shield that decays over time!', icon: '🛡️' }
    ],
    starPowers: [
      { id: 'hard_landing', name: 'Hard Landing', description: "Edgar's Super deals 1000 damage to nearby enemies upon landing!", icon: '💥' },
      { id: 'fists_of_fury', name: 'Fists of Fury', description: "Edgar's healing from landing hits is increased by 25%!", icon: '👊' }
    ]
  },
  gale: {
    gadgets: [
      { id: 'spring_ejector', name: 'Spring Ejector', description: 'Spawns a launch pad that launches allies and enemies into the air!', icon: '🌀' },
      { id: 'twister', name: 'Twister', description: 'Spawns a small tornado that repels enemies for 4.0 seconds!', icon: '🌪️' }
    ],
    starPowers: [
      { id: 'blustery_blow', name: 'Blustery Blow', description: "Enemies pushed into obstacles by Gale's Super are stunned for 1.5s!", icon: '❄️' },
      { id: 'freezing_snow', name: 'Freezing Snow', description: "Gale's snowballs slow enemies down by 15% for 1.0 second!", icon: '☃️' }
    ]
  },
  mico: {
    gadgets: [
      { id: 'screaming_solo', name: 'Screaming Solo', description: 'Mico screams, shooting a soundwave that slows enemies down!', icon: '🎤' },
      { id: 'presto', name: 'Presto', description: 'Next jump has 35% longer range!', icon: '👟' }
    ],
    starPowers: [
      { id: 'monkey_business', name: 'Monkey Business', description: "Every 5 seconds, Mico's next hit steals 1 ammo from the target!", icon: '🐒' },
      { id: 'record_deal', name: 'Record Deal', description: 'Mico deals +20% damage to pets, spawns, and boxes!', icon: '💿' }
    ]
  },
  charlie: {
    gadgets: [
      { id: 'spiders', name: 'Spiders', description: 'Charlie releases 3 spiders that seek and attack the closest enemy!', icon: '👁️' },
      { id: 'cocoon_shield', name: 'Personal Cocoon', description: 'Charlie wraps herself in a cocoon, healing 50% health while immune!', icon: '🕸️' }
    ],
    starPowers: [
      { id: 'digestive', name: 'Digestive Cocoon', description: "Enemies trapped in Charlie's Cocoon lose 50% of their HP!", icon: '🤤' },
      { id: 'sticky_slime', name: 'Sticky Slime', description: "Charlie's cocoon leaves a trail of slowing slime for 5.0 seconds!", icon: '🤢' }
    ]
  },
  el_primo: {
    gadgets: [
      { id: 'suplex_supplement', name: 'Suplex Supplement', description: 'El Primo grabs the closest enemy and flips them over his shoulders!', icon: '🤼' },
      { id: 'asteroid_belt', name: 'Asteroid Belt', description: 'El Primo summons a small meteor to strike down on nearby enemies!', icon: '☄️' }
    ],
    starPowers: [
      { id: 'el_fuego', name: 'El Fuego', description: "Enemies caught in El Primo's Super are set on fire, taking 1200 damage!", icon: '🔥' },
      { id: 'meteor_rush', name: 'Meteor Rush', description: 'El Primo gains a 25% speed boost for 4.0 seconds after using his Super!', icon: '🏃' }
    ]
  },
  mortis: {
    gadgets: [
      { id: 'survival_shovel', name: 'Survival Shovel', description: 'Mortis reloads twice as fast for the next 4.0 seconds!', icon: '🧹' },
      { id: 'combo_spinner', name: 'Combo Spinner', description: 'Mortis spins his shovel, dealing 1300 damage to all nearby enemies!', icon: '🌀' }
    ],
    starPowers: [
      { id: 'creepy_harvest', name: 'Creepy Harvest', description: 'Mortis recovers 1000 health upon defeating an enemy Brawler!', icon: '🩸' },
      { id: 'coiled_snake', name: 'Coiled Snake', description: 'Mortis gains a longer dash range when his ammo is fully loaded!', icon: '🐍' }
    ]
  },
  piper: {
    gadgets: [
      { id: 'auto_aimer', name: 'Auto Aimer', description: 'Piper shoots a defensive bullet that pushes back and slows down the nearest enemy!', icon: '🔫' },
      { id: 'homemade_recipe', name: 'Homemade Recipe', description: "Piper's next attack curves towards enemies automatically!", icon: '🍲' }
    ],
    starPowers: [
      { id: 'ambush', name: 'Ambush', description: 'Piper deals +800 damage from inside bushes!', icon: '🌿' },
      { id: 'snappy_sniping', name: 'Snappy Sniping', description: 'Piper reloads 0.4 ammo instantly whenever she hits an enemy!', icon: '⚡' }
    ]
  },
  dynamike: {
    gadgets: [
      { id: 'fidget_spinner', name: 'Fidget Spinner', description: 'Dynamike spins rapidly, throwing sticks of dynamite around him and moving faster!', icon: '🎡' },
      { id: 'satchel_charge', name: 'Satchel Charge', description: 'Next attack stuns hit enemies for 1.5 seconds!', icon: '🎒' }
    ],
    starPowers: [
      { id: 'demolition', name: 'Demolition', description: "Adds +1000 damage to Dynamike's Super Big Barrel o' Bomb!", icon: '💥' },
      { id: 'dynajump', name: 'Dyna-Jump', description: 'Dynamike can ride the blast wave of his explosives to jump over obstacles!', icon: '🦘' }
    ]
  },
  brock: {
    gadgets: [
      { id: 'rocket_fuel', name: 'Rocket Fuel', description: 'Next attack fires a mega rocket that breaks walls!', icon: '🚀' },
      { id: 'rocket_laces', name: 'Rocket Laces', description: 'Brock blasts the ground under him to jump backwards and escape!', icon: '🥾' }
    ],
    starPowers: [
      { id: 'incendiary', name: 'Incendiary', description: 'Brock\'s rockets leave a burning patch of fire on the ground!', icon: '🔥' },
      { id: 'fourth_rocket', name: 'More Rocket', description: 'Brock permanently increases his max ammo capacity to 4!', icon: '🔋' }
    ]
  },
  barley: {
    gadgets: [
      { id: 'sticky_syrup', name: 'Sticky Syrup', description: 'Barley drops a sticky puddle on the ground that slows down enemies!', icon: '🧪' },
      { id: 'herbal_tonic', name: 'Herbal Tonic', description: 'Barley throws a healing potion at himself and allies!', icon: '🍹' }
    ],
    starPowers: [
      { id: 'medical_use', name: 'Medical Use', description: 'Barley recovers 400 HP whenever he throws a bottle!', icon: '💖' },
      { id: 'extra_noxious', name: 'Extra Noxious', description: 'Barley increases his attack damage by +15%!', icon: '☠️' }
    ]
  },
  nita: {
    gadgets: [
      { id: 'bear_paws', name: 'Bear Paws', description: 'Nita commands her bear to slam the ground, stunning nearby enemies!', icon: '🐾' },
      { id: 'faux_fur', name: 'Faux Fur', description: 'Nita\'s bear gains a 35% protective shield for 3.0 seconds!', icon: '🛡️' }
    ],
    starPowers: [
      { id: 'bear_me', name: 'Bear With Me', description: 'When Nita hits an enemy, her bear heals. When the bear hits, Nita heals!', icon: '☯️' },
      { id: 'hyper_bear', name: 'Hyper Bear', description: 'Nita\'s bear attacks 150% faster!', icon: '⚡' }
    ]
  },
  bo: {
    gadgets: [
      { id: 'super_totem', name: 'Super Totem', description: 'Deploys a totem that recharges the Super of nearby allies!', icon: '🗿' },
      { id: 'tripwire', name: 'Tripwire', description: 'Bo instantly detonates all active mines on the field!', icon: '🔌' }
    ],
    starPowers: [
      { id: 'circling_eagle', name: 'Circling Eagle', description: 'Bo can see twice as far inside bushes!', icon: '🦅' },
      { id: 'snare_a_bear', name: 'Snare-a-Bear', description: 'Bo\'s mines stun enemies for 1.5s instead of knocking them back!', icon: '🕸️' }
    ]
  },
  jessie: {
    gadgets: [
      { id: 'spark_plug', name: 'Spark Plug', description: 'Jessie\'s turret triggers a shockwave that slows down nearby enemies!', icon: '🔌' },
      { id: 'recoil_spring', name: 'Recoil Spring', description: 'Jessie\'s turret shoots twice as fast for 4.0 seconds!', icon: '⚙️' }
    ],
    starPowers: [
      { id: 'energize', name: 'Energize', description: 'Shooting her own turret heals it for 800 health!', icon: '⚡' },
      { id: 'shocky', name: 'Shocky Orbs', description: 'Jessie\'s turret energy orbs now bounce between targets!', icon: '🔵' }
    ]
  },
  emz: {
    gadgets: [
      { id: 'friendzone', name: 'Friendzoner', description: 'Emz pushes back all nearby enemies and deals 500 damage!', icon: '💅' },
      { id: 'acid_spray', name: 'Acid Spray', description: 'Emz\'s next spray pierces through walls!', icon: '💨' }
    ],
    starPowers: [
      { id: 'bad_karma', name: 'Bad Karma', description: 'Enemies standing in her spray take 20% more damage per tick!', icon: '📈' },
      { id: 'hype', name: 'Hype Heal', description: 'Emz recovers 320 health per second for every enemy inside her Super!', icon: '💖' }
    ]
  },
  rico: {
    gadgets: [
      { id: 'multiball', name: 'Multiball Launcher', description: 'Rico fires waves of bouncy balls in all directions!', icon: '🌀' },
      { id: 'bouncy_heal', name: 'Bouncy Heal', description: 'Rico instantly restores 1000 health when a bullet bounces!', icon: '🔋' }
    ],
    starPowers: [
      { id: 'super_bouncy', name: 'Super Bouncy', description: 'Rico\'s bullets deal +120 extra damage after bouncing!', icon: '✨' },
      { id: 'robo_retreat', name: 'Robo Retreat', description: 'Rico moves 30% faster when his health falls below 40%!', icon: '🏃' }
    ]
  },
  darryl: {
    gadgets: [
      { id: 'recoiling_rotator', name: 'Recoiling Rotator', description: 'Darryl spins and sprays heavy shotgun shells in all directions!', icon: '🎡' },
      { id: 'tar_barrel', name: 'Tar Barrel', description: 'Darryl creates a slowing tar circle around himself for 4.0s!', icon: '🛢️' }
    ],
    starPowers: [
      { id: 'steel_hoops', name: 'Steel Hoops', description: 'Darryl\'s Super reduces all incoming damage by 30% during and after rolling!', icon: '🛡️' },
      { id: 'rolling_reload', name: 'Rolling Reload', description: 'Darryl reloads twice as fast for 5.0 seconds after using his Super!', icon: '⚡' }
    ]
  },
  gene: {
    gadgets: [
      { id: 'lamp_blowout', name: 'Lamp Blowout', description: 'Gene knocks back all nearby enemies and heals himself for 1000 HP!', icon: '🪔' },
      { id: 'venengeful_spirits', name: 'Vengeful Spirits', description: 'Gene fires homing tracking missiles at all visible enemies!', icon: '👻' }
    ],
    starPowers: [
      { id: 'magic_puffs', name: 'Magic Puffs', description: 'Gene heals nearby allies for 400 health per second!', icon: '💨' },
      { id: 'spirit_slap', name: 'Spirit Slap', description: 'Gene\'s Super deals 1000 damage to pulled targets!', icon: '👋' }
    ]
  }
};

export function getBrawlerLoadout(brawlerId: string) {
  return BRAWLER_LOADOUTS[brawlerId] || BRAWLER_LOADOUTS.shelly;
}

export function getSelectedGadget(brawlerId: string): string {
  const saved = localStorage.getItem('brawl_brawler_states');
  if (saved) {
    try {
      const states = JSON.parse(saved);
      if (states[brawlerId]?.selectedGadget) return states[brawlerId].selectedGadget;
    } catch (e) {}
  }
  const loadout = getBrawlerLoadout(brawlerId);
  return loadout.gadgets[0]?.id || '';
}

export function getSelectedStarPower(brawlerId: string): string {
  const saved = localStorage.getItem('brawl_brawler_states');
  if (saved) {
    try {
      const states = JSON.parse(saved);
      if (states[brawlerId]?.selectedStarPower) return states[brawlerId].selectedStarPower;
    } catch (e) {}
  }
  const loadout = getBrawlerLoadout(brawlerId);
  return loadout.starPowers[0]?.id || '';
}

export function getSelectedGears(brawlerId: string): string[] {
  const saved = localStorage.getItem('brawl_brawler_states');
  if (saved) {
    try {
      const states = JSON.parse(saved);
      if (states[brawlerId]?.selectedGears) return states[brawlerId].selectedGears;
    } catch (e) {}
  }
  return [];
}

export function getRankFromTrophies(trophies: number): string {
  if (trophies < 100) return 'Bronze I';
  if (trophies < 250) return 'Silver II';
  if (trophies < 500) return 'Gold III';
  if (trophies < 1000) return 'Diamond IV';
  if (trophies < 2000) return 'Heroic Champion';
  return 'Brawl Stars Master 👑';
}

export function getMapDescription(map: string) {
  switch (map) {
    case 'Classic Showdown':
      return {
        icon: '🏜️',
        desc: 'Dry gold desert. Scattered boulders, golden dry scrub, and open sightlines.',
        bg: 'from-amber-600/20 to-amber-950/40 border-amber-500/30 text-amber-400',
        label: 'DESERT CANYON'
      };
    case 'Feast or Famine':
      return {
        icon: '🌴',
        desc: 'Massive central jungle bush with hyper-concentrated Power Boxes. High risk!',
        bg: 'from-emerald-600/20 to-emerald-950/40 border-emerald-500/30 text-emerald-400',
        label: 'JUNGLE OASIS'
      };
    case 'Cavern Churn':
      return {
        icon: '⛰️',
        desc: 'Dark subterranean cave filled with violet moss bushes, stone walls, and close-quarters combat.',
        bg: 'from-purple-600/20 to-purple-950/40 border-purple-500/30 text-purple-400',
        label: 'VIOLET CHASM'
      };
    case 'Double Trouble':
      return {
        icon: '⚔️',
        desc: 'Cybernetic neon grid with cyan pixel foliage, symmetrical walls, and tactical choke-points.',
        bg: 'from-cyan-600/20 to-cyan-950/40 border-cyan-500/30 text-cyan-400',
        label: 'NEON GRID'
      };
    default:
      return {
        icon: '🎲',
        desc: 'Will select one of the four legendary arenas at random upon entering matchmaking!',
        bg: 'from-indigo-600/20 to-indigo-950/40 border-indigo-500/30 text-indigo-400',
        label: 'RANDOM SELECTOR'
      };
  }
}

const EXTRA_EMOTES = ['🔥', '💀', '👽', '👑', '⭐', '🍀', '💩', '🤡', '⚡', '🎉', '🌟', '🦄', '👻', '👾', '💥', '🦖', '🍬', '🍩', '🍕', '🦾', '🧠', '🎈', '💸', '💎', '🎨', '🎯'];

const getStarrDropUnlockableGadget = (bStates: Record<string, BrawlerState>) => {
  const candidates: { brawlerId: string; gadget: { id: string; name: string; icon: string } }[] = [];
  Object.entries(bStates).forEach(([brawlerId, state]) => {
    if (state.unlocked) {
      const gadgets = BRAWLER_LOADOUTS[brawlerId]?.gadgets || [];
      gadgets.forEach(g => {
        if (!state.unlockedGadgets?.includes(g.id)) {
          candidates.push({ brawlerId, gadget: g });
        }
      });
    }
  });
  return candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : null;
};

const getStarrDropUnlockableStarPower = (bStates: Record<string, BrawlerState>) => {
  const candidates: { brawlerId: string; starPower: { id: string; name: string; icon: string } }[] = [];
  Object.entries(bStates).forEach(([brawlerId, state]) => {
    if (state.unlocked) {
      const sps = BRAWLER_LOADOUTS[brawlerId]?.starPowers || [];
      sps.forEach(sp => {
        if (!state.unlockedStarPowers?.includes(sp.id)) {
          candidates.push({ brawlerId, starPower: sp });
        }
      });
    }
  });
  return candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : null;
};

const getStarrDropUnlockableGear = (bStates: Record<string, BrawlerState>) => {
  const candidates: { brawlerId: string; gear: { id: string; name: string; icon: string } }[] = [];
  Object.entries(bStates).forEach(([brawlerId, state]) => {
    if (state.unlocked) {
      UNIVERSAL_GEARS.forEach(g => {
        if (!state.unlockedGears?.includes(g.id)) {
          candidates.push({ brawlerId, gear: g });
        }
      });
    }
  });
  return candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : null;
};

const getStarrDropUnlockableHypercharge = (bStates: Record<string, BrawlerState>) => {
  const candidates: string[] = [];
  Object.entries(bStates).forEach(([brawlerId, state]) => {
    if (state.unlocked && !state.hyperchargeUnlocked) {
      candidates.push(brawlerId);
    }
  });
  return candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : null;
};

const getStarrDropUnlockableSkin = (unlockedSkins: string[], bStates: Record<string, BrawlerState>) => {
  const candidates: { brawlerId: string; skinId: string; skinName: string }[] = [];
  Object.entries(SKIN_DATA).forEach(([brawlerId, skins]) => {
    if (bStates[brawlerId]?.unlocked) {
      Object.entries(skins).forEach(([skinId, info]) => {
        if (skinId !== 'default' && !unlockedSkins.includes(`${brawlerId}_${skinId}`)) {
          candidates.push({ brawlerId, skinId, skinName: info.name });
        }
      });
    }
  });
  return candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : null;
};

export default function App() {
  // --- ONE-TIME RESOURCE & LEVEL CAP RESET ---
  useEffect(() => {
    const isReset = localStorage.getItem('brawlstars_reset_level11_v5');
    if (!isReset) {
      localStorage.removeItem('brawl_coins');
      localStorage.removeItem('brawl_pp');
      localStorage.removeItem('brawl_brawler_states');
      localStorage.removeItem('brawlstars_active_user');
      localStorage.removeItem('brawlstars_auth_users');
      
      setCoins(1200);
      setPowerPoints(250);
      setTotalTrophies(0);
      setCurrentUser(null);

      const initial: Record<string, BrawlerState> = {};
      Object.keys(BRAWLER_TEMPLATES).forEach((id, index) => {
        initial[id] = {
          level: 1,
          trophies: 0,
          unlocked: index < 3 || id === 'shelly' || id === 'colt' || id === 'el_primo',
          selectedSkin: 'default',
          selectedGadget: BRAWLER_LOADOUTS[id]?.gadgets?.[0]?.id || '',
          selectedStarPower: BRAWLER_LOADOUTS[id]?.starPowers?.[0]?.id || '',
          selectedGears: [],
          unlockedGadgets: [],
          unlockedStarPowers: [],
          unlockedGears: [],
          hyperchargeUnlocked: false
        };
      });
      setBrawlerStates(initial);
      localStorage.setItem('brawlstars_reset_level11_v5', 'true');
    }
  }, []);

  // --- BRAWL STARS AUTH & LEADERBOARD INITIALIZATION ---
  useEffect(() => {
    const usersStr = localStorage.getItem('brawlstars_auth_users');
    let users: UserProfile[] = usersStr ? JSON.parse(usersStr) : [];
    
    // Build admin states for Spoodcf
    const spoodcfBStates: Record<string, BrawlerState> = {};
    Object.keys(BRAWLER_TEMPLATES).forEach(id => {
      spoodcfBStates[id] = {
        level: 11,
        trophies: 1250,
        unlocked: true,
        selectedSkin: 'default'
      };
    });

    const spoodcfUser: UserProfile = {
      username: 'Spoodcf',
      isGuest: false,
      coins: 70000,
      powerPoints: 25000,
      totalTrophies: 70000,
      role: 'admin',
      brawlerStates: spoodcfBStates,
      unlockedSkins: ['default'],
      bio: 'Brawl Stars Sandbox Master Creator & Head Admin! 🛡️',
      gender: 'boy',
      stats: {
        matchesPlayed: 999,
        matchesWon: 999,
        totalKills: 9999,
        totalDamage: 9999999,
        rank: 'Brawl Stars Master 👑'
      }
    };

    const spoodcfIdx = users.findIndex(u => u.username.toLowerCase() === 'spoodcf');
    if (spoodcfIdx === -1) {
      users.unshift(spoodcfUser);
    } else {
      users[spoodcfIdx] = {
        ...users[spoodcfIdx],
        ...spoodcfUser
      };
    }

    if (!usersStr) {
      const defaultUsers: UserProfile[] = [
        spoodcfUser,
        {
          username: 'SpenLC',
          isGuest: false,
          coins: 1200,
          powerPoints: 1200,
          totalTrophies: 1540,
          brawlerStates: {},
          unlockedSkins: ['default'],
          bio: 'Welcome back brawlers! SpenLC here, analyzing championship meta and tier lists.',
          gender: 'boy',
          stats: { matchesPlayed: 145, matchesWon: 62, totalKills: 412, totalDamage: 385000, rank: 'Heroic Champion' }
        },
        {
          username: 'CryingMan',
          isGuest: false,
          coins: 4500,
          powerPoints: 3400,
          totalTrophies: 2320,
          brawlerStates: {},
          unlockedSkins: ['default'],
          bio: 'Ultimate Solo Showdown player. Let us dominate the arena!',
          gender: 'boy',
          stats: { matchesPlayed: 210, matchesWon: 110, totalKills: 684, totalDamage: 720000, rank: 'Brawl Stars Master 👑' }
        },
        {
          username: 'El_Primo_El_Pro',
          isGuest: false,
          coins: 800,
          powerPoints: 80,
          totalTrophies: 85,
          brawlerStates: {},
          unlockedSkins: ['default'],
          bio: 'Spinning in Solo Showdown with 10 power cubes. El Primo is life!',
          gender: 'boy',
          stats: { matchesPlayed: 12, matchesWon: 1, totalKills: 14, totalDamage: 12000, rank: 'Bronze I' }
        },
        {
          username: 'KairosTime',
          isGuest: false,
          coins: 1500,
          powerPoints: 600,
          totalTrophies: 840,
          brawlerStates: {},
          unlockedSkins: ['default'],
          bio: 'Code Kairos in the shop! Calculating the mathematical best upgrades.',
          gender: 'boy',
          stats: { matchesPlayed: 85, matchesWon: 28, totalKills: 220, totalDamage: 210000, rank: 'Diamond IV' }
        },
        {
          username: 'ShellyGod',
          isGuest: false,
          coins: 2000,
          powerPoints: 950,
          totalTrophies: 1280,
          brawlerStates: {},
          unlockedSkins: ['default'],
          bio: 'Super Shell Shock main. Fear my bush campers! ✨',
          gender: 'girl',
          stats: { matchesPlayed: 112, matchesWon: 45, totalKills: 310, totalDamage: 290000, rank: 'Heroic Champion' }
        }
      ];
      localStorage.setItem('brawlstars_auth_users', JSON.stringify(defaultUsers));
    } else {
      localStorage.setItem('brawlstars_auth_users', JSON.stringify(users));
    }
  }, []);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const active = localStorage.getItem('brawlstars_active_user');
    if (active) {
      try {
        const u = JSON.parse(active);
        return u;
      } catch (e) { return null; }
    }
    return null;
  });

  const isAdmin = currentUser?.role === 'admin';

  const [selectedGameMode, setSelectedGameMode] = useState<'showdown' | 'tdm'>('showdown');

  // --- PLAYER PROFILE & PROGRESSION STATE ---
  const [coins, setCoins] = useState<number>(() => {
    const active = localStorage.getItem('brawlstars_active_user');
    if (active) {
      try {
        const u = JSON.parse(active);
        return u.coins !== undefined ? u.coins : 1200;
      } catch (e) {}
    }
    const saved = localStorage.getItem('brawl_coins');
    return saved ? parseInt(saved) : 1200;
  });

  const [powerPoints, setPowerPoints] = useState<number>(() => {
    const active = localStorage.getItem('brawlstars_active_user');
    if (active) {
      try {
        const u = JSON.parse(active);
        return u.powerPoints !== undefined ? u.powerPoints : 250;
      } catch (e) {}
    }
    const saved = localStorage.getItem('brawl_pp');
    return saved ? parseInt(saved) : 250;
  });

  const [totalTrophies, setTotalTrophies] = useState<number>(() => {
    const active = localStorage.getItem('brawlstars_active_user');
    if (active) {
      try {
        const u = JSON.parse(active);
        return u.totalTrophies;
      } catch (e) {}
    }
    const saved = localStorage.getItem('brawl_total_trophies');
    return saved ? parseInt(saved) : 0;
  });

  const [brawlerStates, setBrawlerStates] = useState<Record<string, BrawlerState>>(() => {
    const active = localStorage.getItem('brawlstars_active_user');
    if (active) {
      try {
        const u = JSON.parse(active);
        if (u.brawlerStates && Object.keys(u.brawlerStates).length > 0) return u.brawlerStates;
      } catch (e) {}
    }
    const saved = localStorage.getItem('brawl_brawler_states');
    if (saved) return JSON.parse(saved);

    // Initial states: Shelly unlocked, others locked but can be bought or unlocked
    const initial: Record<string, BrawlerState> = {};
    Object.keys(BRAWLER_TEMPLATES).forEach((id, index) => {
      initial[id] = {
        level: 1,
        trophies: 0,
        unlocked: index < 3 || id === 'shelly' || id === 'colt' || id === 'el_primo', // Shelly, Colt, El Primo unlocked by default
        selectedSkin: 'default',
        selectedGadget: BRAWLER_LOADOUTS[id]?.gadgets?.[0]?.id || '',
        selectedStarPower: BRAWLER_LOADOUTS[id]?.starPowers?.[0]?.id || '',
        selectedGears: [],
        unlockedGadgets: [],
        unlockedStarPowers: [],
        unlockedGears: [],
        hyperchargeUnlocked: false
      };
    });
    return initial;
  });

  const getBrawlerState = useCallback((id: string): BrawlerState => {
    const defaultState: BrawlerState = {
      level: 1,
      trophies: 0,
      unlocked: id === 'shelly' || id === 'colt' || id === 'el_primo',
      selectedSkin: 'default',
      selectedGadget: BRAWLER_LOADOUTS[id]?.gadgets?.[0]?.id || '',
      selectedStarPower: BRAWLER_LOADOUTS[id]?.starPowers?.[0]?.id || '',
      selectedGears: [],
      unlockedGadgets: [],
      unlockedStarPowers: [],
      unlockedGears: [],
      hyperchargeUnlocked: false
    };
    return { ...defaultState, ...(brawlerStates[id] || {}) };
  }, [brawlerStates]);

  const [selectedBrawlerId, setSelectedBrawlerId] = useState<string>(() => {
    const saved = localStorage.getItem('brawl_selected_brawler');
    return saved && BRAWLER_TEMPLATES[saved] ? saved : 'shelly';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [lastStarrDropClaimDate, setLastStarrDropClaimDate] = useState<string>(() => {
    return localStorage.getItem('brawl_last_starr_drop_date') || '';
  });

  const [unlockedEmotes, setUnlockedEmotes] = useState<string[]>(() => {
    const saved = localStorage.getItem('brawl_unlocked_emotes');
    return saved ? JSON.parse(saved) : ['👍', '😡', '😄', '❤️'];
  });

  useEffect(() => {
    localStorage.setItem('brawl_unlocked_emotes', JSON.stringify(unlockedEmotes));
  }, [unlockedEmotes]);

  // --- UI SCREENS STATE ---
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'gameover'>('lobby');
  const [showBrawlersModal, setShowBrawlersModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [showLoadoutModal, setShowLoadoutModal] = useState(false);
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(() => {
    const saved = localStorage.getItem('brawl_unlocked_skins');
    return saved ? JSON.parse(saved) : ['default'];
  });

  // --- MAPS, TOASTS & QUESTS STATE ---
  const [selectedMap, setSelectedMap] = useState<string>('Random Map');
  const [activeMap, setActiveMap] = useState<string>('Classic Showdown');
  const [showQuestsModal, setShowQuestsModal] = useState<boolean>(false);

  // --- MULTIPLAYER STATES & ACTIONS ---
  const [multiplayerSocket, setMultiplayerSocket] = useState<WebSocket | null>(null);
  const activeSocketRef = useRef<WebSocket | null>(null);
  const [multiplayerRoomId, setMultiplayerRoomId] = useState<string | null>(null);
  const [multiplayerRole, setMultiplayerRole] = useState<string | null>(null);
  const [multiplayerOpponent, setMultiplayerOpponent] = useState<any | null>(null);
  const [multiplayerOpponents, setMultiplayerOpponents] = useState<any[]>([]);
  const [multiplayerSeed, setMultiplayerSeed] = useState<number | null>(null);
  const [isQueuing, setIsQueuing] = useState<boolean>(false);
  const [isMatchFound, setIsMatchFound] = useState<boolean>(false);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [queueCountdown, setQueueCountdown] = useState<number>(15);

  const startMultiplayerQueue = () => {
    if (!currentUser) return;
    
    setIsQueuing(true);
    setIsMatchFound(false);
    setQueueCount(1);
    setQueueCountdown(15);
    
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    console.log(`[WS CLIENT] Connecting to: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    activeSocketRef.current = ws;
    
    ws.onopen = () => {
      if (activeSocketRef.current !== ws) return;
      
      const activeState = getBrawlerState(selectedBrawlerId);
      const activeGadget = (activeState.level >= 7 && activeState.selectedGadget && activeState.unlockedGadgets?.includes(activeState.selectedGadget)) ? activeState.selectedGadget : '';
      const activeStarPower = (activeState.level >= 9 && activeState.selectedStarPower && activeState.unlockedStarPowers?.includes(activeState.selectedStarPower)) ? activeState.selectedStarPower : '';
      const activeGears = (activeState.level >= 10 && activeState.selectedGears) ? activeState.selectedGears.filter(gId => activeState.unlockedGears?.includes(gId)) : [];
      const activeHypercharge = !!(activeState.level >= 11 && activeState.hyperchargeUnlocked);

      ws.send(JSON.stringify({
        type: 'join_queue',
        username: currentUser.username,
        brawlerId: selectedBrawlerId,
        level: activeState.level,
        skinId: activeState.selectedSkin || 'default',
        gadget: activeGadget,
        starPower: activeStarPower,
        gears: activeGears,
        hypercharge: activeHypercharge
      }));
    };
    
    ws.onmessage = (event) => {
      if (activeSocketRef.current !== ws) return;
      
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'queue_update') {
          setQueueCount(data.count);
          if (data.countdown !== undefined) {
            setQueueCountdown(data.countdown);
          }
        } else if (data.type === 'queue_left') {
          if (activeSocketRef.current === ws) {
            activeSocketRef.current = null;
          }
          setIsQueuing(false);
          setIsMatchFound(false);
          ws.close();
        } else if (data.type === 'match_found') {
          setMultiplayerRoomId(data.roomId);
          setMultiplayerRole(data.role);
          setMultiplayerOpponent(data.opponents && data.opponents.length > 0 ? data.opponents[0] : (data.opponent || null));
          setMultiplayerOpponents(data.opponents || (data.opponent ? [data.opponent] : []));
          setMultiplayerSeed(data.seed);
          setIsMatchFound(true);
          
          const names = data.opponents ? data.opponents.map((o: any) => o.username).join(', ') : (data.opponent ? data.opponent.username : 'Challengers');
          addToast("⚔️ Lobby Connected!", `Players in lobby: ${names}! Prepare to fight!`);
          ws.send(JSON.stringify({ type: 'game_ready' }));
        } else if (data.type === 'start_game') {
          setActiveMap(data.mapName || 'Classic Showdown');
          setGameState('playing');
          setPlacement(10);
          setEarnedCoins(0);
          setEarnedPP(0);
          setEarnedTrophies(0);
          setKillCount(0);
          setIsQueuing(false);
          setIsMatchFound(false);
          playAudio('super');
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    };
    
    ws.onclose = () => {
      if (activeSocketRef.current === ws) {
        activeSocketRef.current = null;
      }
      setIsQueuing(false);
      setIsMatchFound(false);
      setMultiplayerSocket(null);
    };
    
    ws.onerror = (err) => {
      console.error('[WS CLIENT] Connection error:', err);
      if (activeSocketRef.current === ws) {
        activeSocketRef.current = null;
        setIsQueuing(false);
        setIsMatchFound(false);
        setMultiplayerSocket(null);
        addToast("🤖 Playing Offline", "Matchmaking server connection issue. Loading training bots!");
        startMatch();
      }
    };
    
    setMultiplayerSocket(ws);
  };

  const cancelMultiplayerQueue = () => {
    activeSocketRef.current = null;
    if (multiplayerSocket && multiplayerSocket.readyState === WebSocket.OPEN) {
      multiplayerSocket.send(JSON.stringify({ type: 'leave_queue' }));
    }
    setIsQueuing(false);
    setIsMatchFound(false);
    if (multiplayerSocket) {
      multiplayerSocket.close();
      setMultiplayerSocket(null);
    }
  };

  useEffect(() => {
    if (!isQueuing || isMatchFound) return;

    setQueueCountdown(15);
    const intervalId = setInterval(() => {
      setQueueCountdown(prev => {
        if (prev <= 1) {
          // If the WebSocket is connected and open, the server is running and will trigger the match.
          // We should NOT abort the queue and force offline bots locally.
          if (multiplayerSocket && multiplayerSocket.readyState === WebSocket.OPEN) {
            clearInterval(intervalId);
            return 0;
          }

          clearInterval(intervalId);
          
          // Cancel queue
          if (multiplayerSocket && multiplayerSocket.readyState === WebSocket.OPEN) {
            multiplayerSocket.send(JSON.stringify({ type: 'leave_queue' }));
          }
          setIsQueuing(false);
          setIsMatchFound(false);
          if (multiplayerSocket) {
            multiplayerSocket.close();
            setMultiplayerSocket(null);
          }
          
          addToast("🤖 Training Bots Loaded", "No online challengers found. Loaded training bots!");
          startMatch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isQueuing, isMatchFound, multiplayerSocket]);

  useEffect(() => {
    return () => {
      if (multiplayerSocket) {
        multiplayerSocket.close();
      }
    };
  }, [multiplayerSocket]);
  
  // --- STARR DROP LOTTERY SYSTEM STATE ---
  const [showStarrDropModal, setShowStarrDropModal] = useState<boolean>(false);
  const [starrDropRarity, setStarrDropRarity] = useState<'Rare' | 'Super Rare' | 'Epic' | 'Mythic' | 'Legendary'>('Rare');
  const [starrDropTaps, setStarrDropTaps] = useState<number>(0);
  const [starrDropState, setStarrDropState] = useState<'ready' | 'tap' | 'reveal'>('ready');
  const [starrDropReward, setStarrDropReward] = useState<{ type: string; value: string; label: string; icon: string } | null>(null);

  const openStarrDrop = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (lastStarrDropClaimDate === todayStr) {
      addToast("⏳ Already Claimed Today", "Starr Drops are limited to 1 per day! Check back tomorrow.");
      playAudio('shoot');
      return;
    }
    setStarrDropRarity('Rare');
    setStarrDropTaps(0);
    setStarrDropState('ready');
    setStarrDropReward(null);
    setShowStarrDropModal(true);
    playAudio('power_up');
  };

  const handleStarrDropTap = () => {
    if (starrDropState === 'reveal') return;

    playAudio('shoot');

    if (starrDropTaps >= 3) {
      let rewardType = 'coins';
      let value = '100';
      let label = '100 Coins';
      let icon = '🪙';

      const rand = Math.random();
      if (starrDropRarity === 'Rare') {
        // RARE STARR DROP
        if (rand < 0.8) {
          const amt = Math.floor(Math.random() * 100) + 100;
          rewardType = 'coins'; value = String(amt); label = `${amt} Coins`; icon = '🪙';
        } else if (rand < 0.95) {
          const amt = Math.floor(Math.random() * 40) + 20;
          rewardType = 'pp'; value = String(amt); label = `${amt} Power Points`; icon = '🧪';
        } else {
          const lockedEmotes = EXTRA_EMOTES.filter(e => !unlockedEmotes.includes(e));
          if (lockedEmotes.length > 0) {
            const newEmote = lockedEmotes[Math.floor(Math.random() * lockedEmotes.length)];
            rewardType = 'emote'; value = newEmote; label = `NEW PIN: ${newEmote}!`; icon = newEmote;
          } else {
            rewardType = 'coins'; value = '200'; label = '200 Coins (Pin Duplicate!)'; icon = '🪙';
          }
        }
      } else if (starrDropRarity === 'Super Rare') {
        // SUPER RARE STARR DROP
        if (rand < 0.5) {
          const amt = Math.floor(Math.random() * 150) + 150;
          rewardType = 'coins'; value = String(amt); label = `${amt} Coins`; icon = '🪙';
        } else if (rand < 0.85) {
          const amt = Math.floor(Math.random() * 60) + 50;
          rewardType = 'pp'; value = String(amt); label = `${amt} Power Points`; icon = '🧪';
        } else if (rand < 0.95) {
          const lockedEmotes = EXTRA_EMOTES.filter(e => !unlockedEmotes.includes(e));
          if (lockedEmotes.length > 0) {
            const newEmote = lockedEmotes[Math.floor(Math.random() * lockedEmotes.length)];
            rewardType = 'emote'; value = newEmote; label = `RARE PIN: ${newEmote}!`; icon = newEmote;
          } else {
            rewardType = 'coins'; value = '300'; label = '300 Coins (Pin Duplicate!)'; icon = '🪙';
          }
        } else {
          const unlockableGear = getStarrDropUnlockableGear(brawlerStates);
          if (unlockableGear) {
            rewardType = 'gear'; value = `${unlockableGear.brawlerId}:${unlockableGear.gear.id}`; label = `NEW GEAR: ${unlockableGear.gear.name} (${BRAWLER_TEMPLATES[unlockableGear.brawlerId].name})!`; icon = unlockableGear.gear.icon || '⚙️';
          } else {
            rewardType = 'coins'; value = '500'; label = '500 Coins (Gear Duplicate!)'; icon = '🪙';
          }
        }
      } else if (starrDropRarity === 'Epic') {
        // EPIC STARR DROP
        if (rand < 0.3) {
          const amt = Math.floor(Math.random() * 300) + 250;
          rewardType = 'coins'; value = String(amt); label = `${amt} Coins`; icon = '🪙';
        } else if (rand < 0.55) {
          const amt = Math.floor(Math.random() * 120) + 100;
          rewardType = 'pp'; value = String(amt); label = `${amt} Power Points`; icon = '🧪';
        } else if (rand < 0.7) {
          const lockedEmotes = EXTRA_EMOTES.filter(e => !unlockedEmotes.includes(e));
          if (lockedEmotes.length > 0) {
            const newEmote = lockedEmotes[Math.floor(Math.random() * lockedEmotes.length)];
            rewardType = 'emote'; value = newEmote; label = `EPIC PIN: ${newEmote}!`; icon = newEmote;
          } else {
            rewardType = 'coins'; value = '400'; label = '400 Coins (Pin Duplicate!)'; icon = '🪙';
          }
        } else if (rand < 0.9) {
          const unlockableGadget = getStarrDropUnlockableGadget(brawlerStates);
          if (unlockableGadget) {
            rewardType = 'gadget'; value = `${unlockableGadget.brawlerId}:${unlockableGadget.gadget.id}`; label = `NEW GADGET: ${unlockableGadget.gadget.name} (${BRAWLER_TEMPLATES[unlockableGadget.brawlerId].name})!`; icon = unlockableGadget.gadget.icon || '🟢';
          } else {
            rewardType = 'coins'; value = '1000'; label = '1,000 Coins (Gadget Duplicate!)'; icon = '🪙';
          }
        } else {
          const unlockableGear = getStarrDropUnlockableGear(brawlerStates);
          if (unlockableGear) {
            rewardType = 'gear'; value = `${unlockableGear.brawlerId}:${unlockableGear.gear.id}`; label = `NEW GEAR: ${unlockableGear.gear.name} (${BRAWLER_TEMPLATES[unlockableGear.brawlerId].name})!`; icon = unlockableGear.gear.icon || '⚙️';
          } else {
            rewardType = 'coins'; value = '500'; label = '500 Coins (Gear Duplicate!)'; icon = '🪙';
          }
        }
      } else if (starrDropRarity === 'Mythic') {
        // MYTHIC STARR DROP
        if (rand < 0.25) {
          const amt = Math.floor(Math.random() * 500) + 500;
          rewardType = 'coins'; value = String(amt); label = `${amt} Coins`; icon = '🪙';
        } else if (rand < 0.45) {
          const lockedEmotes = EXTRA_EMOTES.filter(e => !unlockedEmotes.includes(e));
          if (lockedEmotes.length > 0) {
            const newEmote = lockedEmotes[Math.floor(Math.random() * lockedEmotes.length)];
            rewardType = 'emote'; value = newEmote; label = `MYTHIC PIN: ${newEmote}!`; icon = newEmote;
          } else {
            rewardType = 'coins'; value = '800'; label = '800 Coins (Pin Duplicate!)'; icon = '🪙';
          }
        } else if (rand < 0.7) {
          const unlockableSP = getStarrDropUnlockableStarPower(brawlerStates);
          if (unlockableSP) {
            rewardType = 'starpower'; value = `${unlockableSP.brawlerId}:${unlockableSP.starPower.id}`; label = `STAR POWER: ${unlockableSP.starPower.name} (${BRAWLER_TEMPLATES[unlockableSP.brawlerId].name})!`; icon = unlockableSP.starPower.icon || '⭐';
          } else {
            rewardType = 'coins'; value = '2000'; label = '2,000 Coins (Star Power Duplicate!)'; icon = '🪙';
          }
        } else if (rand < 0.9) {
          const lockedBrawlers = Object.keys(BRAWLER_TEMPLATES).filter(id => !brawlerStates[id]?.unlocked);
          if (lockedBrawlers.length > 0) {
            const bId = lockedBrawlers[Math.floor(Math.random() * lockedBrawlers.length)];
            rewardType = 'brawler'; value = bId; label = `NEW BRAWLER: ${BRAWLER_TEMPLATES[bId].name}!`; icon = '🏆';
          } else {
            rewardType = 'coins'; value = '2000'; label = '2,000 Coins (Brawler Duplicate!)'; icon = '🪙';
          }
        } else {
          const unlockableSkin = getStarrDropUnlockableSkin(unlockedSkins, brawlerStates);
          if (unlockableSkin) {
            rewardType = 'skin'; value = `${unlockableSkin.brawlerId}:${unlockableSkin.skinId}`; label = `NEW SKIN: ${unlockableSkin.skinName} (${BRAWLER_TEMPLATES[unlockableSkin.brawlerId].name})!`; icon = '✨';
          } else {
            rewardType = 'coins'; value = '1500'; label = '1,500 Coins (Skin Duplicate!)'; icon = '🪙';
          }
        }
      } else if (starrDropRarity === 'Legendary') {
        // LEGENDARY STARR DROP
        if (rand < 0.3) {
          const lockedBrawlers = Object.keys(BRAWLER_TEMPLATES).filter(id => !brawlerStates[id]?.unlocked);
          if (lockedBrawlers.length > 0) {
            const bId = lockedBrawlers[Math.floor(Math.random() * lockedBrawlers.length)];
            rewardType = 'brawler'; value = bId; label = `LEGENDARY BRAWLER UNLOCK: ${BRAWLER_TEMPLATES[bId].name}!`; icon = '👑';
          } else {
            rewardType = 'coins'; value = '3000'; label = '3,000 Coins (Brawler Duplicate!)'; icon = '🪙';
          }
        } else if (rand < 0.6) {
          const unlockableSkin = getStarrDropUnlockableSkin(unlockedSkins, brawlerStates);
          if (unlockableSkin) {
            rewardType = 'skin'; value = `${unlockableSkin.brawlerId}:${unlockableSkin.skinId}`; label = `LEGENDARY SKIN: ${unlockableSkin.skinName} (${BRAWLER_TEMPLATES[unlockableSkin.skinId] ? BRAWLER_TEMPLATES[unlockableSkin.skinId].name : BRAWLER_TEMPLATES[unlockableSkin.brawlerId].name})!`; icon = '✨';
          } else {
            rewardType = 'coins'; value = '2500'; label = '2,500 Coins (Skin Duplicate!)'; icon = '🪙';
          }
        } else if (rand < 0.85) {
          const unlockableHC = getStarrDropUnlockableHypercharge(brawlerStates);
          if (unlockableHC) {
            rewardType = 'hypercharge'; value = unlockableHC; label = `HYPERCHARGE UNLOCKED: ${BRAWLER_TEMPLATES[unlockableHC].name}!`; icon = '⚡';
          } else {
            rewardType = 'coins'; value = '5000'; label = '5,000 Coins (Hypercharge Duplicate!)'; icon = '🪙';
          }
        } else {
          const unlockableSP = getStarrDropUnlockableStarPower(brawlerStates);
          if (unlockableSP) {
            rewardType = 'starpower'; value = `${unlockableSP.brawlerId}:${unlockableSP.starPower.id}`; label = `STAR POWER: ${unlockableSP.starPower.name} (${BRAWLER_TEMPLATES[unlockableSP.brawlerId].name})!`; icon = unlockableSP.starPower.icon || '⭐';
          } else {
            rewardType = 'coins'; value = '2000'; label = '2,000 Coins (Star Power Duplicate!)'; icon = '🪙';
          }
        }
      }

      if (rewardType === 'coins') {
        setCoins(c => c + Number(value));
      } else if (rewardType === 'pp') {
        setPowerPoints(p => p + Number(value));
      } else if (rewardType === 'brawler') {
        setBrawlerStates(prev => ({
          ...prev,
          [value]: {
            ...prev[value] || { level: 1, trophies: 0, selectedSkin: 'default' },
            unlocked: true,
            unlockedGadgets: prev[value]?.unlockedGadgets || [],
            unlockedStarPowers: prev[value]?.unlockedStarPowers || [],
            unlockedGears: prev[value]?.unlockedGears || [],
            hyperchargeUnlocked: prev[value]?.hyperchargeUnlocked || false
          }
        }));
      } else if (rewardType === 'emote') {
        setUnlockedEmotes(prev => [...prev, value]);
      } else if (rewardType === 'skin') {
        const [bId, sId] = value.split(':');
        const fullSkinKey = `${bId}_${sId}`;
        setUnlockedSkins(prev => {
          if (!prev.includes(fullSkinKey)) {
            return [...prev, fullSkinKey];
          }
          return prev;
        });
      } else if (rewardType === 'gadget') {
        const [bId, gId] = value.split(':');
        setBrawlerStates(prev => {
          const current = prev[bId] || { level: 1, trophies: 0, unlocked: true, selectedSkin: 'default' };
          const unlockedGadgets = current.unlockedGadgets || [];
          return {
            ...prev,
            [bId]: {
              ...current,
              unlockedGadgets: [...unlockedGadgets.filter(id => id !== gId), gId],
              selectedGadget: gId
            }
          };
        });
      } else if (rewardType === 'starpower') {
        const [bId, spId] = value.split(':');
        setBrawlerStates(prev => {
          const current = prev[bId] || { level: 1, trophies: 0, unlocked: true, selectedSkin: 'default' };
          const unlockedStarPowers = current.unlockedStarPowers || [];
          return {
            ...prev,
            [bId]: {
              ...current,
              unlockedStarPowers: [...unlockedStarPowers.filter(id => id !== spId), spId],
              selectedStarPower: spId
            }
          };
        });
      } else if (rewardType === 'gear') {
        const [bId, gearId] = value.split(':');
        setBrawlerStates(prev => {
          const current = prev[bId] || { level: 1, trophies: 0, unlocked: true, selectedSkin: 'default' };
          const unlockedGears = current.unlockedGears || [];
          const selectedGears = current.selectedGears || [];
          return {
            ...prev,
            [bId]: {
              ...current,
              unlockedGears: [...unlockedGears.filter(id => id !== gearId), gearId],
              selectedGears: selectedGears.length < 2 ? [...selectedGears, gearId] : selectedGears
            }
          };
        });
      } else if (rewardType === 'hypercharge') {
        const bId = value;
        setBrawlerStates(prev => {
          const current = prev[bId] || { level: 1, trophies: 0, unlocked: true, selectedSkin: 'default' };
          return {
            ...prev,
            [bId]: {
              ...current,
              hyperchargeUnlocked: true
            }
          };
        });
      }

      // Record daily claim date
      const todayStr = new Date().toISOString().split('T')[0];
      setLastStarrDropClaimDate(todayStr);
      localStorage.setItem('brawl_last_starr_drop_date', todayStr);

      setStarrDropReward({ type: rewardType, value, label, icon });
      setStarrDropState('reveal');
      playAudio('power_up');
      return;
    }

    const upgradeRoll = Math.random();
    let upgraded = false;
    if (starrDropRarity === 'Rare' && upgradeRoll < 0.65) {
      setStarrDropRarity('Super Rare');
      upgraded = true;
    } else if (starrDropRarity === 'Super Rare' && upgradeRoll < 0.50) {
      setStarrDropRarity('Epic');
      upgraded = true;
    } else if (starrDropRarity === 'Epic' && upgradeRoll < 0.35) {
      setStarrDropRarity('Mythic');
      upgraded = true;
    } else if (starrDropRarity === 'Mythic' && upgradeRoll < 0.25) {
      setStarrDropRarity('Legendary');
      upgraded = true;
    }

    setStarrDropTaps(t => t + 1);
    if (upgraded) {
      playAudio('power_up');
    }
  };

  const [toasts, setToasts] = useState<{ id: string; text: string; subtext: string }[]>([]);
  const [quests, setQuests] = useState<Quest[]>(() => {
    const saved = localStorage.getItem('brawl_quests');
    if (saved) return JSON.parse(saved);

    return [
      { id: 'kills', title: 'Showdown Slayer', description: 'Defeat 5 total opponents in battle', target: 5, progress: 0, rewardCoins: 200, rewardPP: 50, completed: false },
      { id: 'damage', title: 'Damage Dealer', description: 'Deal 15,000 total damage to enemies', target: 15000, progress: 0, rewardCoins: 300, rewardPP: 75, completed: false },
      { id: 'cubes', title: 'Power Accumulator', description: 'Collect 15 Power Cubes across matches', target: 15, progress: 0, rewardCoins: 150, rewardPP: 40, completed: false },
      { id: 'top3', title: 'Elite Survival', description: 'Finish in the Top 3 in showdown matches', target: 2, progress: 0, rewardCoins: 250, rewardPP: 60, completed: false },
      { id: 'plays', title: 'Daily Grind', description: 'Play 3 complete showdown matches', target: 3, progress: 0, rewardCoins: 150, rewardPP: 30, completed: false },
    ];
  });

  const addToast = (text: string, subtext: string) => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, text, subtext }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // --- GAME RESULTS STATE ---
  const [placement, setPlacement] = useState<number>(10);
  const [earnedCoins, setEarnedCoins] = useState<number>(0);
  const [earnedPP, setEarnedPP] = useState<number>(0);
  const [earnedTrophies, setEarnedTrophies] = useState<number>(0);
  const [killCount, setKillCount] = useState<number>(0);

  // --- CANVAS & GAME LOOP REFS ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);

  // --- MOBILE TOUCH JOYSTICK OVERLAYS ---
  const [leftStick, setLeftStick] = useState({ x: 0, y: 0, active: false });
  const [rightStick, setRightStick] = useState({ x: 0, y: 0, active: false });
  const [superStick, setSuperStick] = useState({ x: 0, y: 0, active: false });
  const leftTouchStart = useRef({ x: 0, y: 0 });
  const rightTouchStart = useRef({ x: 0, y: 0 });
  const superTouchStart = useRef({ x: 0, y: 0 });
  const leftTouchId = useRef<number | null>(null);
  const rightTouchId = useRef<number | null>(null);
  const superTouchId = useRef<number | null>(null);
  const leftStickCoords = useRef({ x: 0, y: 0 });
  const rightStickCoords = useRef({ x: 0, y: 0 });
  const superStickCoords = useRef({ x: 0, y: 0 });

  // --- SYNC LOCAL STORAGE & REGISTERED USER ACCOUNTS ---
  useEffect(() => {
    localStorage.setItem('brawl_coins', coins.toString());
  }, [coins]);

  useEffect(() => {
    localStorage.setItem('brawl_pp', powerPoints.toString());
  }, [powerPoints]);

  useEffect(() => {
    localStorage.setItem('brawl_total_trophies', totalTrophies.toString());
  }, [totalTrophies]);

  useEffect(() => {
    localStorage.setItem('brawl_brawler_states', JSON.stringify(brawlerStates));
  }, [brawlerStates]);

  useEffect(() => {
    localStorage.setItem('brawl_selected_brawler', selectedBrawlerId);
  }, [selectedBrawlerId]);

  useEffect(() => {
    localStorage.setItem('brawl_unlocked_skins', JSON.stringify(unlockedSkins));
  }, [unlockedSkins]);

  // Sync back to registered database
  useEffect(() => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      coins,
      powerPoints,
      totalTrophies,
      brawlerStates,
      unlockedSkins,
    };
    localStorage.setItem('brawlstars_active_user', JSON.stringify(updatedUser));

    if (!currentUser.isGuest) {
      const usersStr = localStorage.getItem('brawlstars_auth_users');
      let users: UserProfile[] = usersStr ? JSON.parse(usersStr) : [];
      const idx = users.findIndex(u => u.username.toLowerCase() === currentUser.username.toLowerCase());
      if (idx !== -1) {
        users[idx] = updatedUser;
      } else {
        users.push(updatedUser);
      }
      localStorage.setItem('brawlstars_auth_users', JSON.stringify(users));
    }
  }, [coins, powerPoints, totalTrophies, brawlerStates, unlockedSkins, currentUser?.username]);

  // --- BRAWL STARS MODALS & EXTRA STATES ---
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'profile' | 'leaderboard'>('profile');
  const [bioInput, setBioInput] = useState<string>(currentUser?.bio || '');

  const saveBio = () => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      bio: bioInput
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('brawlstars_active_user', JSON.stringify(updatedUser));
    
    if (!currentUser.isGuest) {
      const usersStr = localStorage.getItem('brawlstars_auth_users');
      let users: UserProfile[] = usersStr ? JSON.parse(usersStr) : [];
      const idx = users.findIndex(u => u.username.toLowerCase() === currentUser.username.toLowerCase());
      if (idx !== -1) {
        users[idx] = updatedUser;
      }
      localStorage.setItem('brawlstars_auth_users', JSON.stringify(users));
    }
    addToast("Profile Updated! ✨", "Your brawler bio was saved successfully.");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('brawlstars_active_user');
    // reset stats to guest values
    setCoins(1200);
    setPowerPoints(250);
    setTotalTrophies(0);
    const initial: Record<string, BrawlerState> = {};
    Object.keys(BRAWLER_TEMPLATES).forEach((id, index) => {
      initial[id] = {
        level: 1,
        trophies: 0,
        unlocked: index < 3 || id === 'shelly' || id === 'colt' || id === 'el_primo',
        selectedSkin: 'default'
      };
    });
    setBrawlerStates(initial);
    setUnlockedSkins(['default']);
    setShowProfileModal(false);
  };

  // --- CREDENTIALS FORM STATE ---
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [authUsername, setAuthUsername] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState<string>('');
  const [authGender, setAuthGender] = useState<'boy' | 'girl' | 'neutral'>('boy');
  const [authBirthMonth, setAuthBirthMonth] = useState<string>('January');
  const [authBirthDay, setAuthBirthDay] = useState<string>('1');
  const [authBirthYear, setAuthBirthYear] = useState<string>('2012');
  const [authError, setAuthError] = useState<string>('');

  const submitAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authUsername.trim()) { setAuthError("⚠️ Please enter a Username."); return; }
    if (authUsername.trim().length < 3) { setAuthError("⚠️ Username must be at least 3 characters."); return; }
    if (!authPassword) { setAuthError("⚠️ Please enter a Password."); return; }
    if (authPassword.length < 4) { setAuthError("⚠️ Password must be at least 4 characters."); return; }

    const usersStr = localStorage.getItem('brawlstars_auth_users');
    let users: UserProfile[] = usersStr ? JSON.parse(usersStr) : [];

    if (authMode === 'signup') {
      if (authPassword !== authConfirmPassword) {
        setAuthError("⚠️ Passwords do not match!");
        return;
      }
      const taken = users.some(u => u.username.toLowerCase() === authUsername.trim().toLowerCase());
      if (taken) {
        setAuthError("⚠️ This username is already taken! Try another name.");
        return;
      }

      const isAdmin = authUsername.trim().toLowerCase() === 'spoodcf';
      const bStates: Record<string, BrawlerState> = {};
      Object.keys(BRAWLER_TEMPLATES).forEach((id, index) => {
        bStates[id] = {
          level: isAdmin ? 11 : 1,
          trophies: isAdmin ? 1250 : 0,
          unlocked: isAdmin ? true : (index < 3 || id === 'shelly' || id === 'colt' || id === 'el_primo'),
          selectedSkin: 'default'
        };
      });

      const newUser: UserProfile = {
        username: authUsername.trim(),
        isGuest: false,
        coins: isAdmin ? 70000 : 1200,
        powerPoints: isAdmin ? 25000 : 250,
        totalTrophies: isAdmin ? 70000 : 0,
        role: isAdmin ? 'admin' : undefined,
        brawlerStates: bStates,
        unlockedSkins: ['default'],
        bio: isAdmin ? 'Brawl Stars Sandbox Master Creator & Head Admin! 🛡' : `Hello! I am ${authUsername.trim()}, a passionate Brawl Stars champion! 🎮`,
        gender: authGender,
        stats: {
          matchesPlayed: isAdmin ? 999 : 0,
          matchesWon: isAdmin ? 999 : 0,
          totalKills: isAdmin ? 9999 : 0,
          totalDamage: isAdmin ? 9999999 : 0,
          rank: isAdmin ? 'Brawl Stars Master 👑' : 'Bronze I'
        }
      };

      users.push(newUser);
      localStorage.setItem('brawlstars_auth_users', JSON.stringify(users));
      
      // Log in
      setCurrentUser(newUser);
      setCoins(newUser.coins);
      setPowerPoints(newUser.powerPoints);
      setTotalTrophies(newUser.totalTrophies);
      setBrawlerStates(bStates);
      setUnlockedSkins(['default']);
      setBioInput(newUser.bio || '');
      addToast("Welcome to Brawl Stars Arena! 🎉", `Account "${newUser.username}" created successfully.`);
    } else {
      // Login mode
      const found = users.find(u => u.username.toLowerCase() === authUsername.trim().toLowerCase());
      if (!found) {
        setAuthError("⚠️ Username not found. Create a new account under Signup!");
        return;
      }
      
      // Log in found user
      setCurrentUser(found);
      setCoins(found.coins);
      setPowerPoints(found.powerPoints);
      setTotalTrophies(found.totalTrophies);
      setBrawlerStates(found.brawlerStates);
      setUnlockedSkins(found.unlockedSkins);
      setBioInput(found.bio || '');
      addToast("Welcome Back! 👋", `Logged in as ${found.username}.`);
    }
  };

  const playAsGuest = () => {
    const guestName = `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
    const bStates: Record<string, BrawlerState> = {};
    Object.keys(BRAWLER_TEMPLATES).forEach((id, index) => {
      bStates[id] = {
        level: 1,
        trophies: 0,
        unlocked: index < 3 || id === 'shelly' || id === 'colt' || id === 'el_primo',
        selectedSkin: 'default'
      };
    });

    const guestUser: UserProfile = {
      username: guestName,
      isGuest: true,
      coins: 1200,
      powerPoints: 250,
      totalTrophies: 0,
      brawlerStates: bStates,
      unlockedSkins: ['default'],
      bio: "Playing as Guest. Progress is temporary!",
      gender: 'neutral',
      stats: {
        matchesPlayed: 0,
        matchesWon: 0,
        totalKills: 0,
        totalDamage: 0,
        rank: 'Bronze I'
      }
    };

    setCurrentUser(guestUser);
    setCoins(1200);
    setPowerPoints(250);
    setTotalTrophies(0);
    setBrawlerStates(bStates);
    setUnlockedSkins(['default']);
    setBioInput(guestUser.bio);
    addToast("Playing as Guest 🛡️", "Stats will not be recorded on leaderboards!");
  };

  // --- UPGRADE HANDLER ---
  const upgradeBrawler = (id: string) => {
    const state = getBrawlerState(id);
    if (state.level >= 11 && !isAdmin) {
      addToast("Max Level Reached! 🏆", "This brawler is already at Level 11.");
      return;
    }
    const costPP = state.level * 50;
    const costCoins = state.level * 100;

    if (coins >= costCoins && powerPoints >= costPP) {
      setCoins(prev => prev - costCoins);
      setPowerPoints(prev => prev - costPP);
      setBrawlerStates(prev => {
        const current = prev[id] || { level: 1, trophies: 0, unlocked: id === 'shelly' || id === 'colt' || id === 'el_primo', selectedSkin: 'default' };
        const nextLevel = (current.level || 1) + 1;
        return {
          ...prev,
          [id]: {
            ...current,
            level: isAdmin ? nextLevel : Math.min(nextLevel, 11)
          }
        };
      });
      playAudio('power_up');
    } else {
      addToast("Insufficient Resources! ❌", "You need more Coins or Power Points to upgrade!");
    }
  };

  const unlockBrawler = (id: string) => {
    const brawler = BRAWLER_TEMPLATES[id];
    if (!brawler) return;
    const cost = brawler.rarity === 'Legendary' ? 1000 : brawler.rarity === 'Mythic' ? 600 : brawler.rarity === 'Epic' ? 400 : 200;

    if (coins >= cost && !getBrawlerState(id).unlocked) {
      setCoins(prev => prev - cost);
      setBrawlerStates(prev => {
        const current = prev[id] || { level: 1, trophies: 0, unlocked: false, selectedSkin: 'default' };
        return {
          ...prev,
          [id]: {
            ...current,
            unlocked: true
          }
        };
      });
      playAudio('power_up');
    }
  };

  const selectSkin = (brawlerId: string, skinId: string) => {
    setBrawlerStates(prev => {
      const current = prev[brawlerId] || { level: 1, trophies: 0, unlocked: brawlerId === 'shelly' || brawlerId === 'colt' || brawlerId === 'el_primo', selectedSkin: 'default' };
      return {
        ...prev,
        [brawlerId]: {
          ...current,
          selectedSkin: skinId
        }
      };
    });
  };

  const buySkin = (brawlerId: string, skinId: string, cost: number) => {
    const fullSkinKey = `${brawlerId}_${skinId}`;
    if (coins >= cost && !unlockedSkins.includes(fullSkinKey)) {
      setCoins(prev => prev - cost);
      setUnlockedSkins(prev => [...prev, fullSkinKey]);
      selectSkin(brawlerId, skinId);
      playAudio('power_up');
    }
  };

  const selectGadget = (brawlerId: string, gadgetID: string) => {
    const current = brawlerStates[brawlerId];
    const isUnlocked = current?.unlockedGadgets?.includes(gadgetID);
    if (!isUnlocked) {
      addToast("🔒 Gadget Locked", "You must purchase this Gadget with Coins first!");
      playAudio('shoot');
      return;
    }
    setBrawlerStates(prev => {
      const current = prev[brawlerId] || { level: 1, trophies: 0, unlocked: true, selectedSkin: 'default' };
      const updated = {
        ...current,
        selectedGadget: gadgetID
      };
      return { ...prev, [brawlerId]: updated };
    });
    playAudio('power_up');
  };

  const selectStarPower = (brawlerId: string, starPowerID: string) => {
    const current = brawlerStates[brawlerId];
    const isUnlocked = current?.unlockedStarPowers?.includes(starPowerID);
    if (!isUnlocked) {
      addToast("🔒 Star Power Locked", "You must purchase this Star Power with Coins first!");
      playAudio('shoot');
      return;
    }
    setBrawlerStates(prev => {
      const current = prev[brawlerId] || { level: 1, trophies: 0, unlocked: true, selectedSkin: 'default' };
      const updated = {
        ...current,
        selectedStarPower: starPowerID
      };
      return { ...prev, [brawlerId]: updated };
    });
    playAudio('power_up');
  };

  const toggleGear = (brawlerId: string, gearID: string) => {
    const current = brawlerStates[brawlerId];
    const isUnlocked = current?.unlockedGears?.includes(gearID);
    if (!isUnlocked) {
      addToast("🔒 Gear Locked", "You must purchase this Gear with Coins first!");
      playAudio('shoot');
      return;
    }
    setBrawlerStates(prev => {
      const current = prev[brawlerId] || { level: 1, trophies: 0, unlocked: true, selectedSkin: 'default' };
      const currentGears = current.selectedGears || [];
      let updatedGears = [...currentGears];
      if (updatedGears.includes(gearID)) {
        updatedGears = updatedGears.filter(g => g !== gearID);
      } else {
        if (updatedGears.length >= 2) {
          updatedGears.shift();
        }
        updatedGears.push(gearID);
      }
      const updated = {
        ...current,
        selectedGears: updatedGears
      };
      return { ...prev, [brawlerId]: updated };
    });
    playAudio('power_up');
  };

  const buyGadget = (brawlerId: string, gadgetID: string) => {
    if (coins < 1000) {
      addToast("❌ Insufficient Coins", "You need 1,000 Coins to purchase this Gadget!");
      playAudio('shoot');
      return;
    }
    setCoins(c => c - 1000);
    setBrawlerStates(prev => {
      const current = prev[brawlerId] || { level: 1, trophies: 0, unlocked: true, selectedSkin: 'default' };
      const unlocked = current.unlockedGadgets || [];
      return {
        ...prev,
        [brawlerId]: {
          ...current,
          unlockedGadgets: [...unlocked.filter(id => id !== gadgetID), gadgetID],
          selectedGadget: gadgetID
        }
      };
    });
    addToast("🟢 Gadget Purchased!", "Successfully purchased and equipped gadget.");
    playAudio('power_up');
  };

  const buyStarPower = (brawlerId: string, starPowerID: string) => {
    if (coins < 2000) {
      addToast("❌ Insufficient Coins", "You need 2,000 Coins to purchase this Star Power!");
      playAudio('shoot');
      return;
    }
    setCoins(c => c - 2000);
    setBrawlerStates(prev => {
      const current = prev[brawlerId] || { level: 1, trophies: 0, unlocked: true, selectedSkin: 'default' };
      const unlocked = current.unlockedStarPowers || [];
      return {
        ...prev,
        [brawlerId]: {
          ...current,
          unlockedStarPowers: [...unlocked.filter(id => id !== starPowerID), starPowerID],
          selectedStarPower: starPowerID
        }
      };
    });
    addToast("⭐ Star Power Purchased!", "Successfully purchased and equipped Star Power.");
    playAudio('power_up');
  };

  const buyGear = (brawlerId: string, gearID: string) => {
    if (coins < 1000) {
      addToast("❌ Insufficient Coins", "You need 1,000 Coins to purchase this Gear!");
      playAudio('shoot');
      return;
    }
    setCoins(c => c - 1000);
    setBrawlerStates(prev => {
      const current = prev[brawlerId] || { level: 1, trophies: 0, unlocked: true, selectedSkin: 'default' };
      const unlocked = current.unlockedGears || [];
      const selected = current.selectedGears || [];
      return {
        ...prev,
        [brawlerId]: {
          ...current,
          unlockedGears: [...unlocked.filter(id => id !== gearID), gearID],
          selectedGears: selected.length < 2 ? [...selected, gearID] : selected
        }
      };
    });
    addToast("⚙️ Gear Purchased!", "Successfully purchased and equipped Gear.");
    playAudio('power_up');
  };

  const buyHypercharge = (brawlerId: string) => {
    if (coins < 5000) {
      addToast("❌ Insufficient Coins", "You need 5,000 Coins to purchase Hypercharge!");
      playAudio('shoot');
      return;
    }
    setCoins(c => c - 5000);
    setBrawlerStates(prev => {
      const current = prev[brawlerId] || { level: 1, trophies: 0, unlocked: true, selectedSkin: 'default' };
      return {
        ...prev,
        [brawlerId]: {
          ...current,
          hyperchargeUnlocked: true
        }
      };
    });
    addToast("⚡ Hypercharge Purchased!", "Hypercharge is now active in battles!");
    playAudio('power_up');
  };

  // --- SOUND EFFECTS PLAYER ---
  const playAudio = (type: string) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'shoot') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start(); osc.stop(audioCtx.currentTime + 0.15);
      } else if (type === 'hit') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, audioCtx.currentTime);
        osc.frequency.setValueAtTime(80, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start(); osc.stop(audioCtx.currentTime + 0.12);
      } else if (type === 'defeat') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start(); osc.stop(audioCtx.currentTime + 0.42);
      } else if (type === 'power_up') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start(); osc.stop(audioCtx.currentTime + 0.26);
      } else if (type === 'super_ready') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(450, audioCtx.currentTime);
        osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start(); osc.stop(audioCtx.currentTime + 0.22);
      } else if (type === 'break_box') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start(); osc.stop(audioCtx.currentTime + 0.26);
      } else if (type === 'super') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, audioCtx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start(); osc.stop(audioCtx.currentTime + 0.36);
      }
    } catch (e) {
      console.warn("Audio Context blocked or failed to initialize", e);
    }
  };

  // --- START GAME MATCH HANDLER ---
  const startMatch = () => {
    let chosen = selectedMap;
    if (selectedMap === 'Random Map') {
      const pool = ['Classic Showdown', 'Feast or Famine', 'Cavern Churn', 'Double Trouble'];
      chosen = pool[Math.floor(Math.random() * pool.length)];
    }
    setActiveMap(chosen);
    setGameState('playing');
    setPlacement(10);
    setEarnedCoins(0);
    setEarnedPP(0);
    setEarnedTrophies(0);
    setKillCount(0);
    playAudio('super');
  };

  // --- SYNC MATCH END BACK TO LOBBY ---
  const handleMatchEnd = (finalPlacement: number, finalKills: number, finalDamageDealt = 0, finalCubesCollected = 0) => {
    if (multiplayerSocket) {
      multiplayerSocket.close();
      setMultiplayerSocket(null);
      setMultiplayerRoomId(null);
      setMultiplayerRole(null);
      setMultiplayerOpponent(null);
      setMultiplayerSeed(null);
    }

    let rawCoins = 15;
    let rawPP = 5;
    let rawTrophies = -4;

    if (finalPlacement === 1) { rawCoins = 80; rawPP = 30; rawTrophies = 10; }
    else if (finalPlacement === 2) { rawCoins = 60; rawPP = 20; rawTrophies = 8; }
    else if (finalPlacement === 3) { rawCoins = 45; rawPP = 15; rawTrophies = 6; }
    else if (finalPlacement === 4) { rawCoins = 35; rawPP = 10; rawTrophies = 4; }
    else if (finalPlacement === 5) { rawCoins = 25; rawPP = 8; rawTrophies = 2; }
    else if (finalPlacement === 6) { rawCoins = 20; rawPP = 5; rawTrophies = 0; }
    else if (finalPlacement === 7) { rawCoins = 15; rawPP = 3; rawTrophies = -1; }
    else if (finalPlacement === 8) { rawCoins = 12; rawPP = 2; rawTrophies = -2; }
    else if (finalPlacement === 9) { rawCoins = 10; rawPP = 1; rawTrophies = -3; }

    // Add final skills / points
    setCoins(prev => prev + rawCoins);
    setPowerPoints(prev => prev + rawPP);
    setTotalTrophies(prev => Math.max(0, prev + rawTrophies));
    setBrawlerStates(prev => {
      const activeState = prev[selectedBrawlerId];
      if (!activeState) return prev;
      const earnedMastery = (
        finalPlacement === 1 ? 45 :
        finalPlacement === 2 ? 35 :
        finalPlacement === 3 ? 25 :
        finalPlacement === 4 ? 15 :
        finalPlacement === 5 ? 10 : 2
      );
      return {
        ...prev,
        [selectedBrawlerId]: {
          ...activeState,
          trophies: Math.max(0, activeState.trophies + rawTrophies),
          masteryPoints: (activeState.masteryPoints || 0) + earnedMastery
        }
      };
    });

    // --- UPDATE QUESTS PROGRESS ---
    let extraCoins = 0;
    let extraPP = 0;
    const completedQuests: Quest[] = [];

    const updatedQuests = quests.map(q => {
      if (q.completed) return q;

      let addedProgress = 0;
      if (q.id === 'kills') addedProgress = finalKills;
      else if (q.id === 'damage') addedProgress = Math.floor(finalDamageDealt);
      else if (q.id === 'cubes') addedProgress = finalCubesCollected;
      else if (q.id === 'top3') addedProgress = finalPlacement <= 3 ? 1 : 0;
      else if (q.id === 'plays') addedProgress = 1;

      const newProgress = Math.min(q.target, q.progress + addedProgress);
      const isNowCompleted = newProgress >= q.target;

      if (isNowCompleted && !q.completed) {
        extraCoins += q.rewardCoins;
        extraPP += q.rewardPP;
        completedQuests.push(q);
      }

      return {
        ...q,
        progress: newProgress,
        completed: isNowCompleted
      };
    });

    if (extraCoins > 0) setCoins(prev => prev + extraCoins);
    if (extraPP > 0) setPowerPoints(prev => prev + extraPP);

    completedQuests.forEach((q, idx) => {
      setTimeout(() => {
        addToast(`Quest: "${q.title}" Completed!`, `Reward: +${q.rewardCoins} Coins & +${q.rewardPP} Power Points!`);
      }, 800 + idx * 500);
    });

    setQuests(updatedQuests);
    localStorage.setItem('brawl_quests', JSON.stringify(updatedQuests));

    // --- UPDATE LIFETIME PROFILE STATS ---
    if (currentUser) {
      setCurrentUser(prev => {
        if (!prev) return null;
        const stats = prev.stats || { matchesPlayed: 0, matchesWon: 0, totalKills: 0, totalDamage: 0, rank: 'Bronze I' };
        const updatedStats = {
          matchesPlayed: stats.matchesPlayed + 1,
          matchesWon: stats.matchesWon + (finalPlacement === 1 ? 1 : 0),
          totalKills: stats.totalKills + finalKills,
          totalDamage: stats.totalDamage + Math.floor(finalDamageDealt),
          rank: getRankFromTrophies(Math.max(0, totalTrophies + rawTrophies)),
        };
        return {
          ...prev,
          stats: updatedStats
        };
      });
    }

    setPlacement(finalPlacement);
    setEarnedCoins(rawCoins);
    setEarnedPP(rawPP);
    setEarnedTrophies(rawTrophies);
    setKillCount(finalKills);
    setGameState('gameover');

    if (finalPlacement === 1) playAudio('power_up');
    else playAudio('defeat');
  };

  // --- ENGINE SETUP ON PLAY STATE ---
  useEffect(() => {
    if (gameState !== 'playing' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const activeTemplate = BRAWLER_TEMPLATES[selectedBrawlerId];
    const bState = getBrawlerState(selectedBrawlerId);
    const activeLevel = bState.level;
    const activeSkin = bState.selectedSkin || 'default';

    const activeGadget = (bState.level >= 7 && bState.selectedGadget && bState.unlockedGadgets?.includes(bState.selectedGadget))
      ? bState.selectedGadget 
      : '';

    const activeStarPower = (bState.level >= 9 && bState.selectedStarPower && bState.unlockedStarPowers?.includes(bState.selectedStarPower))
      ? bState.selectedStarPower 
      : '';

    const activeGears = (bState.level >= 10 && bState.selectedGears)
      ? bState.selectedGears.filter(gId => bState.unlockedGears?.includes(gId))
      : [];

    const activeHyperchargeUnlocked = !!(bState.level >= 11 && bState.hyperchargeUnlocked);

    const engine = new GameEngine(
      canvas, 
      selectedBrawlerId, 
      activeLevel, 
      activeSkin, 
      activeMap,
      handleMatchEnd, 
      playAudio,
      activeGadget,
      activeStarPower,
      activeGears,
      activeHyperchargeUnlocked,
      multiplayerSocket,
      multiplayerRoomId,
      multiplayerRole,
      multiplayerOpponents,
      multiplayerSeed,
      selectedGameMode
    );
    gameEngineRef.current = engine;
    engine.start();

    // Clean up
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.stop();
        gameEngineRef.current = null;
      }
    };
  }, [gameState, activeMap, selectedBrawlerId, multiplayerSocket, multiplayerRoomId, multiplayerRole, multiplayerOpponents, multiplayerSeed, selectedGameMode]);

  // --- DETECT ACTIVE UI DATA ---
  const activeBrawler = BRAWLER_TEMPLATES[selectedBrawlerId];
  const activeBrawlerState = getBrawlerState(selectedBrawlerId);

  if (!currentUser) {
    return (
      <div className="w-full h-screen bg-[#111317] text-white flex flex-col justify-center items-center overflow-y-auto font-sans select-none relative px-4" id="brawl_auth_container">
        
        {/* Background ambient lighting */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-550/10 via-neutral-900 to-[#0c0d0f] pointer-events-none z-0"></div>

        <div className="w-full max-w-[460px] bg-[#1e2330] border-t-8 border-amber-500 rounded-lg shadow-2xl p-6 sm:p-8 z-10 flex flex-col gap-6 relative" id="auth_card">
          
          {/* Brawl Stars Title Banner */}
          <div className="text-center flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-yellow-400 rotate-6 flex items-center justify-center rounded-xl shadow-lg border border-yellow-300/20 animate-bounce">
              <Star className="w-7 h-7 text-slate-950 fill-slate-950 stroke-[2]" />
            </div>
            <h1 className="text-3xl font-black tracking-wider text-amber-400 mt-2 font-mono uppercase">BRAWL STARS</h1>
            <p className="text-slate-300 text-xs font-bold uppercase tracking-widest">Arena Sandbox Combat Simulator</p>
          </div>

          {/* Form Switch tabs */}
          <div className="grid grid-cols-2 bg-[#121620] rounded-md p-1 border border-[#2b3347] shrink-0">
            <button
              onClick={() => { setAuthMode('signup'); setAuthError(''); }}
              className={`py-2 px-4 rounded text-sm font-black transition-all ${
                authMode === 'signup' 
                  ? 'bg-amber-500 text-slate-950 shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SIGN UP
            </button>
            <button
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              className={`py-2 px-4 rounded text-sm font-black transition-all ${
                authMode === 'login' 
                  ? 'bg-amber-500 text-slate-950 shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              LOG IN
            </button>
          </div>

          {/* Validation Alert */}
          {authError && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-lg text-rose-400 text-xs font-bold flex items-center gap-2 animate-shake">
              <span>{authError}</span>
            </div>
          )}

          {/* Main Form Fields */}
          <form onSubmit={submitAuth} className="flex flex-col gap-4">
            
            {/* Birthdate Selector for authentic feel */}
            {authMode === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Select Birthday</label>
                <div className="grid grid-cols-3 gap-2">
                  <select 
                    value={authBirthMonth} 
                    onChange={(e) => setAuthBirthMonth(e.target.value)}
                    className="bg-[#121620] border border-[#2b3347] rounded p-2 text-xs font-bold text-slate-200 focus:border-amber-500 outline-none"
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select 
                    value={authBirthDay} 
                    onChange={(e) => setAuthBirthDay(e.target.value)}
                    className="bg-[#121620] border border-[#2b3347] rounded p-2 text-xs font-bold text-slate-200 focus:border-amber-500 outline-none"
                  >
                    {Array.from({ length: 31 }, (_, i) => String(i + 1)).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select 
                    value={authBirthYear} 
                    onChange={(e) => setAuthBirthYear(e.target.value)}
                    className="bg-[#121620] border border-[#2b3347] rounded p-2 text-xs font-bold text-slate-200 focus:border-amber-500 outline-none"
                  >
                    {Array.from({ length: 30 }, (_, i) => String(2026 - i)).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Username</label>
              <input
                type="text"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                placeholder={authMode === 'signup' ? "Choose your Brawler name!" : "Enter Brawler username"}
                className="bg-[#121620] border border-[#2b3347] text-sm text-slate-100 rounded px-3 py-2.5 outline-none focus:border-amber-500 transition-colors font-semibold"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder={authMode === 'signup' ? "At least 4 characters" : "Enter Password"}
                className="bg-[#121620] border border-[#2b3347] text-sm text-slate-100 rounded px-3 py-2.5 outline-none focus:border-amber-500 transition-colors font-semibold"
              />
            </div>

            {authMode === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Confirm Password</label>
                <input
                  type="password"
                  value={authConfirmPassword}
                  onChange={(e) => setAuthConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="bg-[#121620] border border-[#2b3347] text-sm text-slate-100 rounded px-3 py-2.5 outline-none focus:border-amber-500 transition-colors font-semibold"
                />
              </div>
            )}

            {/* Gender select buttons for signup */}
            {authMode === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Avatar Prefix (Optional)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAuthGender('boy')}
                    className={`py-2 px-3 border rounded font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
                      authGender === 'boy' 
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-inner' 
                        : 'border-[#2b3347] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🙋‍♂️ BOY
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthGender('girl')}
                    className={`py-2 px-3 border rounded font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
                      authGender === 'girl' 
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-inner' 
                        : 'border-[#2b3347] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🙋‍♀️ GIRL
                  </button>
                </div>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black py-3 rounded text-sm tracking-widest shadow-lg transition-all mt-2 uppercase border-b-4 border-amber-700 hover:border-amber-500 active:border-b-0 active:translate-y-[4px]"
            >
              {authMode === 'signup' ? 'SIGN UP & PLAY' : 'LOG IN & PLAY'}
            </button>
          </form>

          <div className="flex items-center my-1">
            <hr className="flex-1 border-[#2b3347]" />
            <span className="text-[10px] text-slate-500 px-3 font-extrabold uppercase">or play immediately</span>
            <hr className="flex-1 border-[#2b3347]" />
          </div>

          {/* Play as guest selector */}
          <button
            type="button"
            onClick={playAsGuest}
            className="w-full bg-[#121620] hover:bg-slate-900 border border-yellow-500/40 text-yellow-500 font-bold py-2.5 rounded text-xs tracking-wider transition-all"
          >
            🛡️ PLAY AS GUEST (TEMPORARY STATS)
          </button>

        </div>
        
        {/* Footer info branding */}
        <div className="mt-4 text-[10px] text-slate-600 font-bold uppercase tracking-wider text-center max-w-sm">
          Brawl Stars Sandbox is a client-simulated sandbox combat experience. All rights belong to Supercell.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-[#090d16] text-white flex flex-col overflow-hidden font-sans select-none relative" id="game_container">
      
      {/* BACKGROUND DECORATIVE FX */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-black pointer-events-none z-0"></div>

      {/* sound controller */}
      <button 
        id="sound_toggle"
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-4 left-4 z-50 p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 transition-all border border-slate-700 backdrop-blur"
      >
        {soundEnabled ? <Volume2 className="w-5 h-5 text-amber-400 animate-pulse" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
      </button>

      {/* ========================================================= */}
      {/* LOBBY SCREEN */}
      {/* ========================================================= */}
      {gameState === 'lobby' && (
        <div className="w-full h-full flex flex-col justify-between items-center z-10 px-6 py-6 overflow-y-auto min-h-0 select-none" id="lobby_screen">
          
          {/* HEADER BAR */}
          <div className="w-full max-w-7xl flex flex-col md:flex-row justify-between items-stretch gap-4 z-10 shrink-0">
            {/* Player Info card */}
            <div 
              onClick={() => {
                setShowProfileModal(true);
                setBioInput(currentUser?.bio || '');
                playAudio('power_up');
              }}
              className="bg-slate-900/90 hover:bg-slate-800/95 border-2 border-amber-500/30 rounded-2xl px-5 py-3 flex items-center gap-4 backdrop-blur shadow-[0_0_15px_rgba(245,158,11,0.1)] cursor-pointer hover:scale-[1.03] active:scale-95 transition-all"
              title="Click to View Roblox Profile & Leaderboard"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-slate-900 shadow-md relative">
                <User className="w-6 h-6 stroke-[2.5]" />
                {currentUser?.isGuest && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-[8px] font-black px-1 rounded-full text-white uppercase tracking-widest border border-slate-950">GUEST</span>
                )}
              </div>
              <div>
                <h2 className="text-amber-400 font-black tracking-wider text-sm flex items-center gap-1.5 uppercase">
                  {currentUser?.username || "ROBLOXIAN"}
                  {currentUser?.role === 'admin' ? (
                    <span className="text-[10px] bg-red-600 text-white font-black px-2.5 py-0.5 rounded-full animate-pulse border border-yellow-400 uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.5)]">🛡️ ADMIN</span>
                  ) : (
                    !currentUser?.isGuest && <span className="text-[10px] bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 px-1.5 rounded-full lowercase font-bold tracking-normal">member</span>
                  )}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Trophy className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span className="font-bold text-lg text-slate-100">{totalTrophies} <span className="text-xs text-slate-400 font-medium">Trophies</span></span>
                  <span className="text-xs text-slate-500 font-bold ml-1 italic">(Click to view Profile)</span>
                </div>
              </div>
            </div>

            {/* Currencies panel */}
            <div className="flex items-center gap-3">
              {/* Coins block */}
              <div className="bg-slate-900/90 border-2 border-yellow-500/30 rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-md backdrop-blur">
                <div className="w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center text-slate-900 font-black text-sm shadow animate-bounce">
                  C
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Coins</div>
                  <div className="text-yellow-400 text-xl font-black">{coins}</div>
                </div>
              </div>

              {/* Power Points block */}
              <div className="bg-slate-900/90 border-2 border-purple-500/30 rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-md backdrop-blur">
                <div className="w-7 h-7 bg-purple-500 rounded-lg flex items-center justify-center text-white font-black text-xs shadow">
                  PP
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Power Points</div>
                  <div className="text-purple-400 text-xl font-black">{powerPoints}</div>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CENTER PANEL: VISUAL SHOWCASE */}
          <div className="w-full max-w-4xl flex-1 flex flex-col md:flex-row items-center justify-center gap-10 my-4">
            
            {/* LEFT SIDE: STATS & ACTIVE UPGRADE BUTTON */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800/80 backdrop-blur max-w-md w-full">
              <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                activeBrawler.rarity === 'Legendary' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                activeBrawler.rarity === 'Mythic' ? 'bg-rose-600/20 text-rose-400 border border-rose-600/30' :
                activeBrawler.rarity === 'Epic' ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30' :
                'bg-blue-600/20 text-blue-400 border border-blue-600/30'
              }`}>
                {activeBrawler.rarity}
              </span>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white capitalize">{activeBrawler.name}</h1>
              
              <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                <span className="text-sm font-bold bg-amber-500 text-slate-900 px-2.5 py-0.5 rounded-lg">Power Lvl {activeBrawlerState.level}</span>
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 bg-slate-800 px-2.5 py-0.5 rounded-lg">
                  <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  {activeBrawlerState.trophies} Cups
                </span>
                {(() => {
                  const m = getMasteryInfo(activeBrawlerState.masteryPoints || 0);
                  return (
                    <span className={`text-xs font-extrabold flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border ${m.badgeColor}`} title={`Mastery Level ${m.level}: ${m.rankName}`}>
                      <span className="text-sm">{m.badge}</span> {m.rankName} ({m.percent}%)
                    </span>
                  );
                })()}
              </div>

              {/* Attributes metrics */}
              <div className="w-full space-y-2 mt-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                  <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-400" /> HEALTH</span>
                  <span className="text-emerald-400 font-black">{Math.floor(activeBrawler.hp * (1 + (activeBrawlerState.level - 1) * 0.05))}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-black text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                  <span className="flex items-center gap-1.5"><Swords className="w-4 h-4 text-rose-400" /> BASE DAMAGE</span>
                  <span className="text-rose-400 font-black">{Math.floor(activeBrawler.damage * (1 + (activeBrawlerState.level - 1) * 0.05) * 0.4)}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-black text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                  <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-400" /> RANGE</span>
                  <span className="text-amber-400 font-black">{activeBrawler.attackRange}</span>
                </div>
              </div>

              {/* Upgrade actions */}
              <div className="w-full mt-2">
                <button
                  onClick={() => upgradeBrawler(selectedBrawlerId)}
                  disabled={(activeBrawlerState.level >= 11 && !isAdmin) || coins < activeBrawlerState.level * 100 || powerPoints < activeBrawlerState.level * 50}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed font-black text-base py-3 px-4 rounded-xl shadow-lg border-b-4 border-indigo-800 hover:border-indigo-600 active:border-b-0 active:translate-y-[4px] transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  {activeBrawlerState.level >= 11 && !isAdmin ? (
                    <span>MAX LEVEL REACHED (LVL 11) 🏆</span>
                  ) : (
                    <span>UPGRADE {activeBrawlerState.level * 50} PP & {activeBrawlerState.level * 100} Coins {activeBrawlerState.level >= 11 ? '(ADMIN)' : ''}</span>
                  )}
                </button>
              </div>
            </div>

            {/* RIGHT SIDE: INTERACTIVE 3D AVATAR SHIELD */}
            <div className="flex flex-col items-center relative py-6">
              <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
              
              {/* Clicking badge */}
              <div className="bg-slate-900/90 border border-indigo-500/40 rounded-full py-1 px-3 text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2 shadow animate-bounce flex items-center gap-1.5 cursor-pointer z-10" onClick={() => setShowLoadoutModal(true)}>
                <span>💡</span> TAP BRAWLER TO SELECT LOADOUT
              </div>

              {/* Podium */}
              <div 
                onClick={() => setShowLoadoutModal(true)}
                className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 flex items-center justify-center relative bg-gradient-to-b from-transparent to-indigo-950/50 rounded-full border border-indigo-500/20 shadow-inner cursor-pointer hover:scale-[1.03] transition-all duration-300 group"
              >
                <div className="w-36 h-36 sm:w-52 sm:h-52 md:w-64 md:h-64 animate-[spin_10s_linear_infinite] absolute border border-dashed border-indigo-400/20 rounded-full group-hover:border-indigo-400/50 transition-colors"></div>
                <div 
                  className="w-28 h-28 sm:w-40 sm:h-40 md:w-52 md:h-52 animate-[bounce_3s_ease-in-out_infinite] z-10"
                  dangerouslySetInnerHTML={{ __html: getBrawlerSVG(selectedBrawlerId, activeBrawlerState.selectedSkin || 'default') }}
                />
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-full py-1.5 px-4 text-xs font-black tracking-widest text-slate-300 mt-4 shadow flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                ACTIVE LOOK: {(activeBrawlerState.selectedSkin || 'default').toUpperCase().replace('_', ' ')}
              </div>

              {/* Loadout Slots Row */}
              <div className="flex items-center gap-3 mt-4">
                {/* Gadget Slot */}
                <button
                  onClick={() => setShowLoadoutModal(true)}
                  className="w-14 h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-emerald-500/50 flex flex-col items-center justify-center relative shadow-lg group transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                  title="Select Gadget"
                >
                  <span className="text-xl">
                    {BRAWLER_LOADOUTS[selectedBrawlerId]?.gadgets?.find(g => g.id === activeBrawlerState.selectedGadget)?.icon || BRAWLER_LOADOUTS[selectedBrawlerId]?.gadgets?.[0]?.icon || '🟢'}
                  </span>
                  <span className="text-[8px] font-black uppercase text-emerald-400 mt-0.5 tracking-tighter">
                    {BRAWLER_LOADOUTS[selectedBrawlerId]?.gadgets?.find(g => g.id === activeBrawlerState.selectedGadget)?.name.split(' ')[0] || BRAWLER_LOADOUTS[selectedBrawlerId]?.gadgets?.[0]?.name.split(' ')[0] || 'EMPTY'}
                  </span>
                  <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-slate-950 text-[8px] font-black px-1 py-0.5 rounded-md scale-0 group-hover:scale-100 transition-transform">
                    EDIT
                  </div>
                </button>

                {/* Star Power Slot */}
                <button
                  onClick={() => setShowLoadoutModal(true)}
                  className="w-14 h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-amber-500/50 flex flex-col items-center justify-center relative shadow-lg group transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                  title="Select Star Power"
                >
                  <span className="text-xl">
                    {BRAWLER_LOADOUTS[selectedBrawlerId]?.starPowers?.find(sp => sp.id === activeBrawlerState.selectedStarPower)?.icon || BRAWLER_LOADOUTS[selectedBrawlerId]?.starPowers?.[0]?.icon || '⭐'}
                  </span>
                  <span className="text-[8px] font-black uppercase text-amber-400 mt-0.5 tracking-tighter">
                    {BRAWLER_LOADOUTS[selectedBrawlerId]?.starPowers?.find(sp => sp.id === activeBrawlerState.selectedStarPower)?.name.split(' ')[0] || BRAWLER_LOADOUTS[selectedBrawlerId]?.starPowers?.[0]?.name.split(' ')[0] || 'EMPTY'}
                  </span>
                  <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 text-[8px] font-black px-1 py-0.5 rounded-md scale-0 group-hover:scale-100 transition-transform">
                    EDIT
                  </div>
                </button>

                {/* Gears Slot */}
                <button
                  onClick={() => setShowLoadoutModal(true)}
                  className="w-14 h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-blue-500/50 flex flex-col items-center justify-center relative shadow-lg group transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                  title="Select Gears"
                >
                  <div className="flex gap-0.5">
                    {(activeBrawlerState.selectedGears || []).length > 0 ? (
                      (activeBrawlerState.selectedGears || []).map((gId, gi) => (
                        <span key={gi} className="text-sm">
                          {UNIVERSAL_GEARS.find(g => g.id === gId)?.icon || '🛡️'}
                        </span>
                      ))
                    ) : (
                      <span className="text-lg">🛡️</span>
                    )}
                  </div>
                  <span className="text-[8px] font-black uppercase text-blue-400 mt-0.5 tracking-tighter">
                    {(activeBrawlerState.selectedGears || []).length > 0 ? `${(activeBrawlerState.selectedGears || []).length} GEARS` : 'GEARS'}
                  </span>
                  <div className="absolute -top-1.5 -right-1.5 bg-blue-500 text-slate-950 text-[8px] font-black px-1 py-0.5 rounded-md scale-0 group-hover:scale-100 transition-transform">
                    EDIT
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* LOWER ACTION SLATE AND NAVIGATION METAS */}
          <div className="w-full max-w-7xl flex flex-col lg:flex-row justify-between items-center gap-6 mt-4 z-20 shrink-0">
            {/* Sub navigation actions */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                id="brawler_list_btn"
                onClick={() => setShowBrawlersModal(true)}
                className="bg-slate-900 hover:bg-slate-800 border-2 border-indigo-500/30 text-white font-black text-sm tracking-wider px-6 py-4 rounded-2xl flex items-center gap-2.5 shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <Award className="w-5 h-5 text-indigo-400" /> BRAWLERS ({Object.values(brawlerStates).filter((b: BrawlerState) => b.unlocked).length}/16)
              </button>
              
              <button
                id="shop_btn"
                onClick={() => setShowShopModal(true)}
                className="bg-slate-900 hover:bg-slate-800 border-2 border-emerald-500/30 text-white font-black text-sm tracking-wider px-6 py-4 rounded-2xl flex items-center gap-2.5 shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <ShoppingBag className="w-5 h-5 text-emerald-400 animate-pulse" /> SKIN SHOP
              </button>

              <button
                id="quests_btn"
                onClick={() => {
                  setShowQuestsModal(true);
                  playAudio('power_up');
                }}
                className="bg-slate-900 hover:bg-slate-800 border-2 border-purple-500/30 text-white font-black text-sm tracking-wider px-6 py-4 rounded-2xl flex items-center gap-2.5 shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <Compass className="w-5 h-5 text-purple-400" /> QUESTS ({quests.filter(q => q.completed).length}/{quests.length})
              </button>

              {lastStarrDropClaimDate === new Date().toISOString().split('T')[0] ? (
                <button
                  id="starr_drop_btn_disabled"
                  onClick={() => {
                    addToast("⏳ Already Claimed Today", "Starr Drops are limited to 1 per day! Check back tomorrow.");
                    playAudio('shoot');
                  }}
                  className="bg-slate-800 text-slate-500 border-2 border-slate-700 font-black text-sm tracking-wider px-6 py-4 rounded-2xl flex items-center gap-2.5 shadow-lg transition-all opacity-70 cursor-not-allowed"
                >
                  <span className="text-base">🔒</span> STARR DROP CLAIMED
                </button>
              ) : (
                <button
                  id="starr_drop_btn"
                  onClick={openStarrDrop}
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm tracking-wider px-6 py-4 rounded-2xl flex items-center gap-2.5 shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-bounce-slow"
                >
                  <span className="animate-spin text-base">⭐</span> STARR DROP
                </button>
              )}
            </div>

            {/* Map Selector + Play Button Group */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto shrink-0">
              {/* Game Mode Selector */}
              <div className="flex flex-col gap-1.5 w-full sm:w-64 bg-slate-900/90 border-2 border-amber-500/30 rounded-2xl p-3.5 shadow-lg backdrop-blur">
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 flex items-center gap-1.5">
                  🎮 GAME MODE
                </span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => { setSelectedGameMode('showdown'); playAudio('shoot'); }}
                    className={`py-2 px-3 rounded-xl font-black text-xs tracking-wider transition-all cursor-pointer border ${
                      selectedGameMode === 'showdown'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    💀 SHOWDOWN
                  </button>
                  <button
                    onClick={() => { setSelectedGameMode('tdm'); playAudio('shoot'); }}
                    className={`py-2 px-3 rounded-xl font-black text-xs tracking-wider transition-all cursor-pointer border ${
                      selectedGameMode === 'tdm'
                        ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_12px_rgba(37,99,235,0.3)]'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    ⚔️ TEAM DEATHMATCH
                  </button>
                </div>
                <p className="text-[9px] font-medium text-slate-400 leading-normal mt-1">
                  {selectedGameMode === 'showdown' 
                    ? "10-player battle royale to the death. Last brawler standing wins!" 
                    : "Red vs Blue fight to the death! Respawn allowed. First team to 20 kills wins!"}
                </p>
              </div>

              {/* Map Selector */}
              <div className="flex flex-col gap-1.5 w-full sm:w-64 bg-slate-900/90 border-2 border-indigo-500/30 rounded-2xl p-3.5 shadow-lg backdrop-blur">
                <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 flex items-center gap-1.5">
                  🗺️ ARENA SELECTION
                </span>
                <select
                  id="map_selector"
                  value={selectedMap}
                  onChange={(e) => {
                    setSelectedMap(e.target.value);
                    playAudio('shoot');
                  }}
                  className="bg-slate-950 text-white font-black text-xs sm:text-sm border border-slate-850 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer w-full py-2 px-2.5 rounded-xl mb-2"
                >
                  <option value="Random Map" className="bg-slate-900 text-white font-black">🎲 Random Map</option>
                  <option value="Classic Showdown" className="bg-slate-900 text-white font-black">🏜️ Classic Showdown</option>
                  <option value="Feast or Famine" className="bg-slate-900 text-white font-black">🌴 Feast or Famine</option>
                  <option value="Cavern Churn" className="bg-slate-900 text-white font-black">⛰️ Cavern Churn</option>
                  <option value="Double Trouble" className="bg-slate-900 text-white font-black">⚔️ Double Trouble</option>
                </select>

                {/* Map Preview Badge */}
                {(() => {
                  const info = getMapDescription(selectedMap);
                  return (
                    <div className={`p-2.5 rounded-xl border bg-gradient-to-br ${info.bg} flex flex-col gap-1 transition-all duration-300`}>
                      <div className="flex items-center gap-1.5 justify-between">
                        <span className="text-[9px] font-black tracking-widest uppercase">{info.label}</span>
                        <span className="text-sm">{info.icon}</span>
                      </div>
                      <p className="text-[10px] font-medium text-slate-200 leading-normal">
                        {info.desc}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Giant BRAWL Play Button with Auto Matchmaking / Bot Fallback */}
              <div className="flex items-center w-full justify-center">
                <button
                  id="brawl_btn"
                  onClick={startMultiplayerQueue}
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:via-orange-400 hover:to-red-500 font-black italic text-3xl tracking-widest px-14 py-5 rounded-3xl shadow-[0_10px_25px_rgba(239,68,68,0.4)] border-b-8 border-red-800 hover:border-red-600 active:border-b-0 active:translate-y-[8px] transition-all flex items-center justify-center gap-4 animate-pulse cursor-pointer"
                >
                  <Play className="w-8 h-8 fill-white text-white shrink-0 animate-bounce" />
                  BRAWL!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* GAMEPLAY CANVAS INTERFACE */}
      {/* ========================================================= */}
      {gameState === 'playing' && (
        <div className="w-full h-full relative" id="gameplay_screen">
          <canvas ref={canvasRef} className="w-full h-full block bg-[#1e293b]" />
          
          {/* Map Title Overlay */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 border-2 border-indigo-500/60 px-6 py-2.5 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest text-indigo-400 flex items-center gap-2 shadow-2xl backdrop-blur animate-pulse">
            <span className="text-amber-400 font-extrabold text-sm">🗺️</span>
            ARENA: <span className="text-white font-black">{activeMap}</span>
          </div>

          {/* BATTLE EMOTES / PINS OVERLAY */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-950/80 border border-slate-800/80 px-4 py-2 rounded-2xl pointer-events-auto z-40 backdrop-blur shadow-lg">
            <span className="text-[10px] font-black uppercase text-slate-400 mr-2 tracking-widest hidden sm:inline">PINS:</span>
            <button 
              onClick={() => gameEngineRef.current?.triggerPlayerEmote('👍')}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 active:bg-slate-700 active:scale-95 transition flex items-center justify-center text-lg select-none cursor-pointer"
              title="Thumbs Up (Press 1)"
            >
              👍
            </button>
            <button 
              onClick={() => gameEngineRef.current?.triggerPlayerEmote('😡')}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 active:bg-slate-700 active:scale-95 transition flex items-center justify-center text-lg select-none cursor-pointer"
              title="Angry (Press 2)"
            >
              😡
            </button>
            <button 
              onClick={() => gameEngineRef.current?.triggerPlayerEmote('😄')}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 active:bg-slate-700 active:scale-95 transition flex items-center justify-center text-lg select-none cursor-pointer"
              title="GG / Happy (Press 3)"
            >
              😄
            </button>
            <button 
              onClick={() => gameEngineRef.current?.triggerPlayerEmote('❤️')}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 active:bg-slate-700 active:scale-95 transition flex items-center justify-center text-lg select-none cursor-pointer"
              title="Heart (Press 4)"
            >
              ❤️
            </button>
          </div>
          
          {/* INTERACTIVE MOBILE TOUCH CONTROLS (JOYSTICKS & BUTTONS) */}
          <div className="absolute inset-x-0 bottom-6 px-6 sm:px-12 flex justify-between items-end pointer-events-none z-30 select-none">
            
            {/* LEFT SIDE: MOVEMENT VIRTUAL JOYSTICK */}
            <div className="flex flex-col items-center gap-2">
              <div 
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-slate-950/50 border-2 border-indigo-500/30 backdrop-blur-sm flex items-center justify-center touch-none select-none relative pointer-events-auto shadow-[0_0_20px_rgba(59,130,246,0.15)] cursor-grab"
                onTouchStart={(e) => {
                  e.preventDefault();
                  const touch = e.changedTouches[0];
                  leftTouchId.current = touch.identifier;
                  leftTouchStart.current = { x: touch.clientX, y: touch.clientY };
                  leftStickCoords.current = { x: 0, y: 0 };
                  setLeftStick({ x: 0, y: 0, active: true });
                  if (gameEngineRef.current) {
                    gameEngineRef.current.touchMoveVector.active = true;
                  }
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  if (leftTouchId.current === null) return;
                  let touch: Touch | null = null;
                  for (let i = 0; i < e.touches.length; i++) {
                    if (e.touches[i].identifier === leftTouchId.current) {
                      touch = e.touches[i];
                      break;
                    }
                  }
                  if (!touch) return;

                  const dx = touch.clientX - leftTouchStart.current.x;
                  const dy = touch.clientY - leftTouchStart.current.y;
                  const dist = Math.hypot(dx, dy);
                  const maxDist = 45; // Max visual slider travel
                  
                  let moveX = dx;
                  let moveY = dy;
                  if (dist > maxDist) {
                    moveX = (dx / dist) * maxDist;
                    moveY = (dy / dist) * maxDist;
                  }
                  
                  leftStickCoords.current = { x: moveX, y: moveY };
                  setLeftStick({ x: moveX, y: moveY, active: true });
                  if (gameEngineRef.current) {
                    // Normalize vector values between -1 and 1
                    gameEngineRef.current.touchMoveVector.x = moveX / maxDist;
                    gameEngineRef.current.touchMoveVector.y = moveY / maxDist;
                  }
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  let oursEnded = false;
                  for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === leftTouchId.current) {
                      oursEnded = true;
                      break;
                    }
                  }
                  if (!oursEnded) return;

                  leftTouchId.current = null;
                  leftStickCoords.current = { x: 0, y: 0 };
                  setLeftStick({ x: 0, y: 0, active: false });
                  if (gameEngineRef.current) {
                    gameEngineRef.current.touchMoveVector.x = 0;
                    gameEngineRef.current.touchMoveVector.y = 0;
                    gameEngineRef.current.touchMoveVector.active = false;
                  }
                }}
              >
                {/* Visual ring grid lines */}
                <div className="absolute inset-2 border border-dashed border-indigo-500/10 rounded-full" />
                <div className="absolute w-8 h-[2px] bg-indigo-500/10" />
                <div className="absolute h-8 w-[2px] bg-indigo-500/10" />
                
                {/* Joystick Nub handle knob */}
                <div 
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-indigo-600 border border-indigo-300/45 shadow-2xl flex items-center justify-center transition-transform duration-75 active:scale-95 cursor-grab pointer-events-none"
                  style={{
                    transform: `translate(${leftStick.x}px, ${leftStick.y}px)`
                  }}
                >
                  <div className="w-4 h-4 rounded-full bg-white/20" />
                </div>
              </div>
              
              {/* Left stick instructions (desktop hint) */}
              <div className="hidden md:flex bg-slate-950/80 backdrop-blur-sm border border-slate-800/80 py-1 px-3 rounded-full text-center flex-col gap-0.5">
                <span className="text-[9px] uppercase font-black tracking-widest text-slate-400">WASD / Keys</span>
              </div>
            </div>

            {/* RIGHT SIDE: AIMING JOYSTICK & ACTIVE ABILITY SLOTS */}
            <div className="flex flex-col items-end gap-3 sm:gap-4">
              
              {/* Tactical Buttons Row: Gadget + Hypercharge */}
              <div className="flex items-center gap-2 pointer-events-auto">
                {/* Gadget button */}
                <button
                  onTouchStart={(e) => {
                    e.preventDefault();
                    const activeBState = getBrawlerState(selectedBrawlerId);
                    const hasGadgetEquipped = !!(activeBState.level >= 7 && activeBState.selectedGadget && activeBState.unlockedGadgets?.includes(activeBState.selectedGadget));
                    if (hasGadgetEquipped && gameEngineRef.current) {
                      gameEngineRef.current.triggerPlayerGadget();
                    }
                  }}
                  onClick={() => {
                    const activeBState = getBrawlerState(selectedBrawlerId);
                    const hasGadgetEquipped = !!(activeBState.level >= 7 && activeBState.selectedGadget && activeBState.unlockedGadgets?.includes(activeBState.selectedGadget));
                    if (hasGadgetEquipped && gameEngineRef.current) {
                      gameEngineRef.current.triggerPlayerGadget();
                    }
                  }}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 text-white font-black text-[9px] sm:text-xs flex flex-col items-center justify-center shadow-lg active:scale-90 transition-all pointer-events-auto ${
                    (getBrawlerState(selectedBrawlerId).level >= 7 && getBrawlerState(selectedBrawlerId).selectedGadget && getBrawlerState(selectedBrawlerId).unlockedGadgets?.includes(getBrawlerState(selectedBrawlerId).selectedGadget))
                      ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 active:from-emerald-500 active:to-emerald-700 border-emerald-800 cursor-pointer' 
                      : 'bg-slate-800/80 border-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  <span>{(getBrawlerState(selectedBrawlerId).level >= 7 && getBrawlerState(selectedBrawlerId).selectedGadget && getBrawlerState(selectedBrawlerId).unlockedGadgets?.includes(getBrawlerState(selectedBrawlerId).selectedGadget)) ? '🟢' : '🔒'}</span>
                  <span className="font-extrabold tracking-tighter">{(getBrawlerState(selectedBrawlerId).level >= 7 && getBrawlerState(selectedBrawlerId).selectedGadget && getBrawlerState(selectedBrawlerId).unlockedGadgets?.includes(getBrawlerState(selectedBrawlerId).selectedGadget)) ? 'GADGET' : 'LOCKED'}</span>
                </button>

                {/* Hypercharge button */}
                <button
                  onTouchStart={(e) => {
                    e.preventDefault();
                    const activeBState = getBrawlerState(selectedBrawlerId);
                    const hasHyperchargeEquipped = !!(activeBState.level >= 11 && activeBState.hyperchargeUnlocked);
                    if (hasHyperchargeEquipped && gameEngineRef.current) {
                      gameEngineRef.current.triggerPlayerHypercharge();
                    }
                  }}
                  onClick={() => {
                    const activeBState = getBrawlerState(selectedBrawlerId);
                    const hasHyperchargeEquipped = !!(activeBState.level >= 11 && activeBState.hyperchargeUnlocked);
                    if (hasHyperchargeEquipped && gameEngineRef.current) {
                      gameEngineRef.current.triggerPlayerHypercharge();
                    }
                  }}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 text-white font-black text-[9px] sm:text-xs flex flex-col items-center justify-center shadow-lg active:scale-90 transition-all pointer-events-auto ${
                    (getBrawlerState(selectedBrawlerId).level >= 11 && getBrawlerState(selectedBrawlerId).hyperchargeUnlocked)
                      ? 'bg-gradient-to-b from-purple-500 via-fuchsia-600 to-purple-600 active:from-purple-600 active:to-fuchsia-800 border-purple-800 cursor-pointer animate-pulse' 
                      : 'bg-slate-800/80 border-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  <span>{(getBrawlerState(selectedBrawlerId).level >= 11 && getBrawlerState(selectedBrawlerId).hyperchargeUnlocked) ? '⚡' : '🔒'}</span>
                  <span className="font-extrabold tracking-tighter">{(getBrawlerState(selectedBrawlerId).level >= 11 && getBrawlerState(selectedBrawlerId).hyperchargeUnlocked) ? 'HYPER' : 'LOCKED'}</span>
                </button>
              </div>

              {/* Aiming/Attacking block */}
              <div className="flex items-center gap-3 sm:gap-4">
                
                {/* Super Touch Joystick */}
                <div 
                  className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-slate-950/50 border-2 border-amber-500/30 backdrop-blur-sm flex items-center justify-center touch-none select-none relative pointer-events-auto shadow-[0_0_20px_rgba(245,158,11,0.15)] cursor-grab"
                  onTouchStart={(e) => {
                    e.preventDefault();
                    const touch = e.changedTouches[0];
                    superTouchId.current = touch.identifier;
                    superTouchStart.current = { x: touch.clientX, y: touch.clientY };
                    superStickCoords.current = { x: 0, y: 0 };
                    setSuperStick({ x: 0, y: 0, active: true });
                    if (gameEngineRef.current) {
                      gameEngineRef.current.isAimingSuper = true;
                      gameEngineRef.current.isAimingBase = false;
                      gameEngineRef.current.touchAimVector.active = true;
                    }
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    if (superTouchId.current === null) return;
                    let touch: Touch | null = null;
                    for (let i = 0; i < e.touches.length; i++) {
                      if (e.touches[i].identifier === superTouchId.current) {
                        touch = e.touches[i];
                        break;
                      }
                    }
                    if (!touch) return;

                    const dx = touch.clientX - superTouchStart.current.x;
                    const dy = touch.clientY - superTouchStart.current.y;
                    const dist = Math.hypot(dx, dy);
                    const maxDist = 45; // Max visual slider travel
                    
                    let moveX = dx;
                    let moveY = dy;
                    if (dist > maxDist) {
                      moveX = (dx / dist) * maxDist;
                      moveY = (dy / dist) * maxDist;
                    }
                    
                    superStickCoords.current = { x: moveX, y: moveY };
                    setSuperStick({ x: moveX, y: moveY, active: true });
                    if (gameEngineRef.current) {
                      // Normalize aiming vector values between -1 and 1
                      gameEngineRef.current.touchAimVector.x = moveX / maxDist;
                      gameEngineRef.current.touchAimVector.y = moveY / maxDist;
                    }
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    let oursEnded = false;
                    for (let i = 0; i < e.changedTouches.length; i++) {
                      if (e.changedTouches[i].identifier === superTouchId.current) {
                        oursEnded = true;
                        break;
                      }
                    }
                    if (!oursEnded) return;

                    const dx = superStickCoords.current.x;
                    const dy = superStickCoords.current.y;
                    const dist = Math.hypot(dx, dy);
                    
                    superTouchId.current = null;
                    superStickCoords.current = { x: 0, y: 0 };
                    setSuperStick({ x: 0, y: 0, active: false });
                    
                    if (gameEngineRef.current) {
                      // If user barely dragged the stick (distance < 12px), trigger quick Auto-Aim Super!
                      if (dist < 12) {
                        gameEngineRef.current.triggerTouchShoot(true, true); // Auto-aim super
                      } else {
                        gameEngineRef.current.triggerTouchShoot(true, false); // Dragged aimed super
                      }
                      
                      gameEngineRef.current.touchAimVector.x = 0;
                      gameEngineRef.current.touchAimVector.y = 0;
                      gameEngineRef.current.touchAimVector.active = false;
                      gameEngineRef.current.isAimingSuper = false;
                    }
                  }}
                >
                  {/* Visual ring grid lines */}
                  <div className="absolute inset-2 border border-dashed border-amber-500/10 rounded-full" />
                  <div className="absolute w-8 h-[2px] bg-amber-500/10" />
                  <div className="absolute h-8 w-[2px] bg-amber-500/10" />
                  
                  {/* Joystick Nub handle knob */}
                  <div 
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 border border-amber-300/45 shadow-2xl flex flex-col items-center justify-center transition-transform duration-75 active:scale-95 cursor-grab pointer-events-none"
                    style={{
                      transform: `translate(${superStick.x}px, ${superStick.y}px)`
                    }}
                  >
                    <span className="text-sm">⭐</span>
                    <span className="text-[7px] font-black tracking-tighter text-slate-950 uppercase leading-none">SUPER</span>
                  </div>
                </div>

                {/* Attack / Aim joystick stick */}
                <div 
                  className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-slate-950/50 border-2 border-red-500/30 backdrop-blur-sm flex items-center justify-center touch-none select-none relative pointer-events-auto shadow-[0_0_20px_rgba(239,68,68,0.15)] cursor-grab"
                  onTouchStart={(e) => {
                    e.preventDefault();
                    const touch = e.changedTouches[0];
                    rightTouchId.current = touch.identifier;
                    rightTouchStart.current = { x: touch.clientX, y: touch.clientY };
                    rightStickCoords.current = { x: 0, y: 0 };
                    setRightStick({ x: 0, y: 0, active: true });
                    if (gameEngineRef.current) {
                      gameEngineRef.current.isAimingBase = true;
                      gameEngineRef.current.isAimingSuper = false;
                      gameEngineRef.current.touchAimVector.active = true;
                    }
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    if (rightTouchId.current === null) return;
                    let touch: Touch | null = null;
                    for (let i = 0; i < e.touches.length; i++) {
                      if (e.touches[i].identifier === rightTouchId.current) {
                        touch = e.touches[i];
                        break;
                      }
                    }
                    if (!touch) return;

                    const dx = touch.clientX - rightTouchStart.current.x;
                    const dy = touch.clientY - rightTouchStart.current.y;
                    const dist = Math.hypot(dx, dy);
                    const maxDist = 45; // Max visual slider travel
                    
                    let moveX = dx;
                    let moveY = dy;
                    if (dist > maxDist) {
                      moveX = (dx / dist) * maxDist;
                      moveY = (dy / dist) * maxDist;
                    }
                    
                    rightStickCoords.current = { x: moveX, y: moveY };
                    setRightStick({ x: moveX, y: moveY, active: true });
                    if (gameEngineRef.current) {
                      // Normalize aiming vector values between -1 and 1
                      gameEngineRef.current.touchAimVector.x = moveX / maxDist;
                      gameEngineRef.current.touchAimVector.y = moveY / maxDist;
                    }
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    let oursEnded = false;
                    for (let i = 0; i < e.changedTouches.length; i++) {
                      if (e.changedTouches[i].identifier === rightTouchId.current) {
                        oursEnded = true;
                        break;
                      }
                    }
                    if (!oursEnded) return;

                    const dx = rightStickCoords.current.x;
                    const dy = rightStickCoords.current.y;
                    const dist = Math.hypot(dx, dy);
                    
                    rightTouchId.current = null;
                    rightStickCoords.current = { x: 0, y: 0 };
                    setRightStick({ x: 0, y: 0, active: false });
                    
                    if (gameEngineRef.current) {
                      // If user barely dragged the stick (distance < 12px), trigger quick Auto-Aim at closest enemy!
                      if (dist < 12) {
                        gameEngineRef.current.triggerTouchShoot(false, true); // Auto-aim attack
                      } else {
                        gameEngineRef.current.triggerTouchShoot(false, false); // Dragged aimed attack
                      }
                      
                      gameEngineRef.current.touchAimVector.x = 0;
                      gameEngineRef.current.touchAimVector.y = 0;
                      gameEngineRef.current.touchAimVector.active = false;
                      gameEngineRef.current.isAimingBase = false;
                    }
                  }}
                >
                  {/* Visual ring grid lines */}
                  <div className="absolute inset-2 border border-dashed border-red-500/10 rounded-full" />
                  <div className="absolute w-8 h-[2px] bg-red-500/10" />
                  <div className="absolute h-8 w-[2px] bg-red-500/10" />
                  
                  {/* Joystick Nub handle knob */}
                  <div 
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-red-600 border border-orange-300/45 shadow-2xl flex items-center justify-center transition-transform duration-75 active:scale-95 cursor-grab pointer-events-none"
                    style={{
                      transform: `translate(${rightStick.x}px, ${rightStick.y}px)`
                    }}
                  >
                    <div className="w-4 h-4 rounded-full bg-white/20" />
                  </div>
                </div>
              </div>

              {/* Right stick instructions (desktop hint) */}
              <div className="hidden md:flex bg-slate-950/80 backdrop-blur-sm border border-slate-800/80 py-1 px-3 rounded-full text-center flex-col gap-0.5">
                <span className="text-[9px] uppercase font-black tracking-widest text-slate-400">Mouse Drag to Aim, Click to Fire</span>
              </div>
            </div>
          </div>

          {/* DYNAMIC SHADOW OVERLAY VIGNETTE */}
          <div className="absolute inset-0 pointer-events-none border-[12px] border-emerald-500/0 transition-all duration-300 shadow-[inset_0_0_80px_rgba(0,0,0,0.6)]" />
        </div>
      )}

      {/* ========================================================= */}
      {/* END GAME OVER SUMMARY CARD */}
      {/* ========================================================= */}
      {gameState === 'gameover' && (
        <div className="w-full h-full flex items-center justify-center z-40 p-6 relative" id="gameover_screen">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md"></div>
          
          <div className="w-full max-w-lg bg-slate-900 border-2 border-indigo-500/30 rounded-3xl p-8 z-10 text-center shadow-2xl relative overflow-hidden flex flex-col gap-6">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl"></div>

            <div className="flex flex-col items-center gap-2">
              <Award className={`w-16 h-16 ${placement <= 3 ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
              <h1 className="text-4xl font-black italic tracking-wider">
                {placement === 1 ? '🥇 VICTORY SHOWDOWN!' : `RANKED #${placement}`}
              </h1>
              <p className="text-slate-400 text-sm font-bold mt-1">A valiant Battle Royale brawl has ended!</p>
            </div>

            {/* Stats Gained Deck */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center">
                <Trophy className="w-6 h-6 text-amber-400 fill-amber-400/10 mb-1" />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Trophies</span>
                <span className={`text-2xl font-black ${earnedTrophies >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {earnedTrophies >= 0 ? `+${earnedTrophies}` : earnedTrophies}
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center">
                <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400/10 mb-1" />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Opponents Slain</span>
                <span className="text-2xl font-black text-yellow-400">{killCount}</span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center">
                <div className="w-6 h-6 bg-yellow-500 rounded-full text-slate-900 flex items-center justify-center font-black text-xs mb-1 shadow-sm">C</div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Coins Earned</span>
                <span className="text-2xl font-black text-yellow-400">+{earnedCoins}</span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center">
                <div className="w-6 h-6 bg-purple-500 rounded text-white flex items-center justify-center font-black text-xs mb-1 shadow-sm">PP</div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Power Points</span>
                <span className="text-2xl font-black text-purple-400">+{earnedPP}</span>
              </div>
            </div>

            {/* Mastery Level Progression Card */}
            {(() => {
              const pts = brawlerStates[selectedBrawlerId]?.masteryPoints || 0;
              const m = getMasteryInfo(pts);
              const earned = (
                placement === 1 ? 45 :
                placement === 2 ? 35 :
                placement === 3 ? 25 :
                placement === 4 ? 15 :
                placement === 5 ? 10 : 2
              );
              return (
                <div className="bg-slate-950/70 border-2 border-indigo-500/20 rounded-2xl p-4 flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{m.badge}</span>
                    <span className="text-xs text-slate-400 font-extrabold uppercase tracking-widest">BRAWLER MASTERY</span>
                  </div>
                  <div className="text-sm font-black text-white capitalize mb-1">
                    {selectedBrawlerId.replace('_', ' ')} Rank: <span className="text-indigo-400">{m.rankName}</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800 mt-1">
                    <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${m.percent}%` }}></div>
                  </div>
                  <span className="text-[10px] font-black text-indigo-300 mt-2 tracking-wider">
                    +{earned} POINTS EARNED ({pts} TOTAL)
                  </span>
                </div>
              );
            })()}

            {/* Exit Action button */}
            <button
              onClick={() => setGameState('lobby')}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 font-black text-lg py-4 px-6 rounded-2xl shadow-lg border-b-4 border-indigo-800 hover:border-indigo-600 active:border-b-0 active:translate-y-[4px] transition-all flex items-center justify-center gap-2 mt-2"
            >
              EXIT TO LOBBY
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* LOADOUT CUSTOMIZATION MODAL */}
      {/* ========================================================= */}
      {showLoadoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md" id="loadout_modal">
          <div className="w-full max-w-4xl bg-slate-900 border-2 border-indigo-500/50 rounded-3xl shadow-2xl p-5 sm:p-6 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4 shrink-0 text-white">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl sm:text-3xl">⚙️</span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                    Brawler Customization
                  </h2>
                  <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">
                    Selected: <span className="text-indigo-400">{selectedBrawlerId.replace('_', ' ')}</span>
                  </p>
                </div>
              </div>
              <button 
                id="close_loadout_btn"
                onClick={() => setShowLoadoutModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-white"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-6 pb-2 text-white">
              
              {/* SECTION 1: GADGETS */}
              <div>
                <h3 className="text-xs sm:text-sm font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  🟢 Brawler Gadgets (Power Level 7 Required)
                </h3>
                {activeBrawlerState.level < 7 ? (
                  <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <span className="text-3xl mb-2">🔒</span>
                    <h4 className="font-black text-sm text-slate-300">GADGETS LOCKED</h4>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
                      Upgrade this brawler to Power Level 7 to unlock gadgets!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(BRAWLER_LOADOUTS[selectedBrawlerId]?.gadgets || []).map((gadget) => {
                      const isUnlocked = activeBrawlerState.unlockedGadgets?.includes(gadget.id);
                      const isSelected = activeBrawlerState.selectedGadget === gadget.id;
                      return (
                        <div
                          key={gadget.id}
                          className={`flex items-start text-left gap-3.5 p-3.5 rounded-2xl bg-slate-950/40 border-2 transition-all duration-300 ${
                            isSelected 
                              ? 'border-emerald-500 bg-emerald-950/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                              : isUnlocked 
                                ? 'border-slate-800/80 hover:border-slate-700' 
                                : 'border-slate-800/40 opacity-75'
                          }`}
                        >
                          <div className="w-11 h-11 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-2xl shrink-0">
                            {gadget.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 justify-between">
                              <h4 className="font-black text-xs sm:text-sm text-slate-100">{gadget.name}</h4>
                              {isUnlocked ? (
                                isSelected ? (
                                  <span className="bg-emerald-500 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                                    EQUIPPED
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => selectGadget(selectedBrawlerId, gadget.id)}
                                    className="bg-slate-800 hover:bg-slate-700 text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider"
                                  >
                                    EQUIP
                                  </button>
                                )
                              ) : (
                                <button
                                  onClick={() => buyGadget(selectedBrawlerId, gadget.id)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-lg shadow-emerald-500/10 active:scale-95 transition-all"
                                >
                                  🪙 1,000
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 leading-relaxed">
                              {gadget.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION 2: STAR POWERS */}
              <div>
                <h3 className="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  ⭐ Star Powers (Power Level 9 Required)
                </h3>
                {activeBrawlerState.level < 9 ? (
                  <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <span className="text-3xl mb-2">🔒</span>
                    <h4 className="font-black text-sm text-slate-300">STAR POWERS LOCKED</h4>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
                      Upgrade this brawler to Power Level 9 to unlock Star Powers!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(BRAWLER_LOADOUTS[selectedBrawlerId]?.starPowers || []).map((sp) => {
                      const isUnlocked = activeBrawlerState.unlockedStarPowers?.includes(sp.id);
                      const isSelected = activeBrawlerState.selectedStarPower === sp.id;
                      return (
                        <div
                          key={sp.id}
                          className={`flex items-start text-left gap-3.5 p-3.5 rounded-2xl bg-slate-950/40 border-2 transition-all duration-300 ${
                            isSelected 
                              ? 'border-amber-500 bg-amber-950/10 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                              : isUnlocked 
                                ? 'border-slate-800/80 hover:border-slate-700' 
                                : 'border-slate-800/40 opacity-75'
                          }`}
                        >
                          <div className="w-11 h-11 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0">
                            {sp.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 justify-between">
                              <h4 className="font-black text-xs sm:text-sm text-slate-100">{sp.name}</h4>
                              {isUnlocked ? (
                                isSelected ? (
                                  <span className="bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                                    EQUIPPED
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => selectStarPower(selectedBrawlerId, sp.id)}
                                    className="bg-slate-800 hover:bg-slate-700 text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider"
                                  >
                                    EQUIP
                                  </button>
                                )
                              ) : (
                                <button
                                  onClick={() => buyStarPower(selectedBrawlerId, sp.id)}
                                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-lg shadow-amber-500/10 active:scale-95 transition-all"
                                >
                                  🪙 2,000
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 leading-relaxed">
                              {sp.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION 3: GEARS */}
              <div>
                <h3 className="text-xs sm:text-sm font-black text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                  🛡️ Brawler Gears (Power Level 10 Required - Equip up to 2)
                </h3>
                {activeBrawlerState.level < 10 ? (
                  <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <span className="text-3xl mb-2">🔒</span>
                    <h4 className="font-black text-sm text-slate-300">GEARS LOCKED</h4>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
                      Upgrade this brawler to Power Level 10 to unlock passive gears!
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-3">
                      Equip passive stat modifiers to boost your brawler's core attributes!
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {UNIVERSAL_GEARS.map((gear) => {
                        const selectedGearsArray = activeBrawlerState.selectedGears || [];
                        const isUnlocked = activeBrawlerState.unlockedGears?.includes(gear.id);
                        const isSelected = selectedGearsArray.includes(gear.id);
                        return (
                          <div
                            key={gear.id}
                            className={`flex items-start text-left gap-3 p-3 rounded-2xl bg-slate-950/40 border-2 transition-all duration-300 ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-950/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                                : isUnlocked 
                                  ? 'border-slate-800/80 hover:border-slate-700' 
                                  : 'border-slate-800/40 opacity-75'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-center text-xl shrink-0">
                              {gear.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 justify-between">
                                <h4 className="font-black text-xs text-slate-100 tracking-tight">{gear.name}</h4>
                                {isUnlocked ? (
                                  isSelected ? (
                                    <button
                                      onClick={() => toggleGear(selectedBrawlerId, gear.id)}
                                      className="bg-blue-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase scale-90"
                                    >
                                      UNEQUIP
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => toggleGear(selectedBrawlerId, gear.id)}
                                      className="bg-slate-800 hover:bg-slate-700 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase scale-90"
                                    >
                                      EQUIP
                                    </button>
                                  )
                                ) : (
                                  <button
                                    onClick={() => buyGear(selectedBrawlerId, gear.id)}
                                    className="bg-blue-600 hover:bg-blue-500 text-slate-950 text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg shadow-blue-500/10 active:scale-95 transition-all"
                                  >
                                    🪙 1,000
                                  </button>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                                {gear.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* SECTION 4: HYPERCHARGE */}
              <div>
                <h3 className="text-xs sm:text-sm font-black text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
                  ⚡ Brawler Hypercharge (Power Level 11 Required)
                </h3>
                {activeBrawlerState.level < 11 ? (
                  <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <span className="text-3xl mb-2">🔒</span>
                    <h4 className="font-black text-sm text-slate-300">HYPERCHARGE LOCKED</h4>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
                      Upgrade this brawler to Power Level 11 to unlock Hypercharge!
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-950/50 border-2 border-purple-500/40 p-5 rounded-3xl flex flex-col md:flex-row items-center gap-5 justify-between shadow-lg shadow-purple-500/5 animate-pulse-slow">
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-14 h-14 rounded-2xl bg-purple-950/40 border-2 border-purple-500 flex items-center justify-center text-3xl shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                        ⚡
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-purple-200">HYPERCHARGE STATUS</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-md">
                          Enables a devastating supercharge mode in battle that boosts speed, shield, damage, and enhances your Super!
                        </p>
                      </div>
                    </div>
                    <div>
                      {activeBrawlerState.hyperchargeUnlocked ? (
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs uppercase px-4 py-2 rounded-2xl shadow-md border-b-2 border-purple-800">
                          ⚡ UNLOCKED & ACTIVE
                        </div>
                      ) : (
                        <button
                          onClick={() => buyHypercharge(selectedBrawlerId)}
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black text-xs uppercase px-6 py-3 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center gap-2 border-b-4 border-purple-800 hover:border-purple-600 active:border-b-0"
                        >
                          🪙 Buy Hypercharge (5,000)
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Footer buttons */}
            <div className="border-t border-slate-800 pt-4 mt-2 flex justify-end shrink-0">
              <button
                onClick={() => setShowLoadoutModal(false)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase px-8 py-3.5 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 border-b-4 border-indigo-800 hover:border-indigo-600 active:border-b-0 cursor-pointer"
              >
                Save Loadout
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* BRAWLERS MODAL DRAWER */}
      {/* ========================================================= */}
      {showBrawlersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md" id="brawler_modal">
          <div className="w-full max-w-4xl bg-slate-900 border-2 border-indigo-500/40 rounded-3xl shadow-2xl p-6 flex flex-col h-[85vh]">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-7 h-7 text-indigo-400" />
                <h2 className="text-2xl font-black uppercase tracking-wider">CHOOSE YOUR BRAWLER</h2>
              </div>
              <button 
                id="close_brawlers_btn"
                onClick={() => setShowBrawlersModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable grid card */}
            <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-4">
              {Object.keys(BRAWLER_TEMPLATES).map(id => {
                const brawler = BRAWLER_TEMPLATES[id];
                const state = brawlerStates[id] || { level: 1, trophies: 0, unlocked: false, selectedSkin: 'default' };
                const isSelected = selectedBrawlerId === id;

                const unlockCost = brawler.rarity === 'Legendary' ? 1000 : brawler.rarity === 'Mythic' ? 600 : brawler.rarity === 'Epic' ? 400 : 200;

                return (
                  <div 
                    key={id}
                    className={`rounded-2xl border-2 p-3.5 flex flex-col justify-between relative transition-all ${
                      isSelected ? 'bg-indigo-950/40 border-indigo-500 shadow-md scale-95' :
                      state.unlocked ? 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50' : 
                      'bg-slate-950/20 border-slate-900/60 opacity-80'
                    }`}
                  >
                    {/* Character Visual container */}
                    <div className="w-full aspect-square bg-slate-950/40 rounded-xl p-2.5 relative flex items-center justify-center">
                      <div 
                        className="w-full h-full"
                        dangerouslySetInnerHTML={{ __html: getBrawlerSVG(id, state.selectedSkin || 'default') }}
                      />
                      
                      {state.unlocked && (
                        <span className="absolute bottom-2 right-2 text-[10px] font-black bg-amber-500 text-slate-900 px-1.5 py-0.5 rounded">
                          Lvl {state.level}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-col gap-1.5 text-center sm:text-left">
                      <h3 className="font-black text-sm capitalize text-slate-200">{brawler.name}</h3>
                      
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                        <span className={`w-2 h-2 rounded-full ${
                          brawler.rarity === 'Legendary' ? 'bg-amber-500' :
                          brawler.rarity === 'Mythic' ? 'bg-rose-500' :
                          brawler.rarity === 'Epic' ? 'bg-purple-500' : 'bg-blue-500'
                        }`}></span>
                        {brawler.rarity}
                      </div>

                      {state.unlocked ? (
                        <button
                          onClick={() => {
                            setSelectedBrawlerId(id);
                            setShowBrawlersModal(false);
                            playAudio('shoot');
                          }}
                          className={`w-full font-black text-xs py-2 rounded-xl border-b-4 transition-all ${
                            isSelected 
                              ? 'bg-slate-800 border-slate-950 text-indigo-400 cursor-default' 
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-800 active:border-b-0 active:translate-y-[4px]'
                          }`}
                        >
                          {isSelected ? 'SELECTED' : 'SELECT'}
                        </button>
                      ) : (
                        <button
                          onClick={() => unlockBrawler(id)}
                          disabled={coins < unlockCost}
                          className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 disabled:from-slate-800 disabled:to-slate-800 font-black text-xs py-2 rounded-xl border-b-4 border-emerald-800 active:border-b-0 active:translate-y-[4px] transition-all flex items-center justify-center gap-1"
                        >
                          LOCK: {unlockCost} Coins
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SHOP MODAL DRAWER */}
      {/* ========================================================= */}
      {showShopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md" id="shop_modal">
          <div className="w-full max-w-4xl bg-slate-900 border-2 border-emerald-500/40 rounded-3xl shadow-2xl p-6 flex flex-col h-[85vh]">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-7 h-7 text-emerald-400" />
                <h2 className="text-2xl font-black uppercase tracking-wider">SKINS SHOP EXCLUSIVE</h2>
              </div>
              <button 
                id="close_shop_btn"
                onClick={() => setShowShopModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable list content */}
            <div className="flex-1 overflow-y-auto pr-2 pb-4">
              {Object.keys(SKIN_DATA).map(brawlerId => {
                const brawlerTemplate = BRAWLER_TEMPLATES[brawlerId];
                if (!brawlerTemplate) return null;

                const skins = SKIN_DATA[brawlerId];
                return (
                  <div key={brawlerId} className="mb-6 bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4">
                    <h3 className="font-black text-base uppercase tracking-wider text-indigo-400 capitalize mb-3 border-b border-slate-900 pb-1.5 flex items-center gap-2">
                      <Star className="w-4 h-4 fill-indigo-400" />
                      {brawlerTemplate.name} Skins
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.keys(skins).map(skinId => {
                        const skin = skins[skinId];
                        const fullSkinKey = `${brawlerId}_${skinId}`;
                        const isUnlocked = skinId === 'default' || unlockedSkins.includes(fullSkinKey);
                        const isSelected = (brawlerStates[brawlerId]?.selectedSkin || 'default') === skinId;

                        return (
                          <div 
                            key={skinId} 
                            className={`p-3 bg-slate-900/60 border rounded-xl flex items-center gap-3.5 ${
                              isSelected ? 'border-emerald-500 bg-emerald-950/20' : 'border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="w-14 h-14 bg-slate-950/50 rounded-lg p-1.5 flex items-center justify-center shrink-0">
                              <div 
                                className="w-full h-full"
                                dangerouslySetInnerHTML={{ __html: getBrawlerSVG(brawlerId, skinId) }}
                              />
                            </div>
                            
                            <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                              <h4 className="font-bold text-sm text-slate-200 capitalize truncate">{skinId.replace('_', ' ')}</h4>
                              
                              {isUnlocked ? (
                                <button
                                  onClick={() => {
                                    selectSkin(brawlerId, skinId);
                                    playAudio('shoot');
                                  }}
                                  className={`font-black text-xs py-1.5 px-3 rounded-lg border-b-2 transition-all w-full ${
                                    isSelected 
                                      ? 'bg-slate-800 border-slate-950 text-emerald-400 cursor-default' 
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-800 active:border-b-0 active:translate-y-[2px]'
                                  }`}
                                >
                                  {isSelected ? 'EQUIPPED' : 'EQUIP'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => buySkin(brawlerId, skinId, skin.cost || 150)}
                                  disabled={coins < (skin.cost || 150)}
                                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 disabled:opacity-50 disabled:from-slate-800 disabled:to-slate-800 font-black text-xs py-1.5 px-3 rounded-lg border-b-2 border-amber-800 active:border-b-0 active:translate-y-[2px] transition-all flex items-center justify-center gap-1"
                                >
                                  BUY: {skin.cost || 150} Coins
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STARR DROP INTERACTIVE OPENER MODAL */}
      {/* ========================================================= */}
      {showStarrDropModal && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950/95 backdrop-blur-lg select-none" id="starr_drop_modal">
          <div className="w-full max-w-lg flex flex-col items-center">
            
            {/* Header with Close */}
            <div className="w-full flex justify-between items-center mb-6">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">BRAWL STARS LOTTERY</span>
              <button 
                onClick={() => setShowStarrDropModal(false)}
                className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-2xl font-black uppercase tracking-widest text-center text-slate-100 mb-2">
              {starrDropState === 'reveal' ? 'REWARD UNLOCKED!' : 'STARR DROP'}
            </h2>

            {/* Starr Drop Active Rarity Badge */}
            <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest border-2 shadow-lg mb-8 ${
              starrDropRarity === 'Rare' ? 'border-sky-500/50 bg-sky-950/40 text-sky-400' :
              starrDropRarity === 'Super Rare' ? 'border-teal-500/50 bg-teal-950/40 text-teal-400' :
              starrDropRarity === 'Epic' ? 'border-purple-500/50 bg-purple-950/40 text-purple-400' :
              starrDropRarity === 'Mythic' ? 'border-pink-500/50 bg-pink-950/40 text-pink-400' :
              'border-amber-500/80 bg-amber-950/40 text-amber-400 animate-pulse'
            }`}>
              {starrDropRarity} STARR DROP
            </span>

            {/* Giant Central Clickable Star */}
            {starrDropState !== 'reveal' ? (
              <div 
                onClick={handleStarrDropTap}
                className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full flex items-center justify-center cursor-pointer border-4 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_60px_rgba(255,255,255,0.1)] relative ${
                  starrDropRarity === 'Rare' ? 'border-sky-400 bg-sky-950/40 hover:bg-sky-900/50 shadow-sky-500/30' :
                  starrDropRarity === 'Super Rare' ? 'border-teal-400 bg-teal-950/40 hover:bg-teal-900/50 shadow-teal-500/40' :
                  starrDropRarity === 'Epic' ? 'border-purple-400 bg-purple-950/40 hover:bg-purple-900/50 shadow-purple-500/40' :
                  starrDropRarity === 'Mythic' ? 'border-pink-400 bg-pink-950/40 hover:bg-pink-900/50 shadow-pink-500/50' :
                  'border-amber-400 bg-amber-950/40 hover:bg-amber-900/50 shadow-amber-500/60 animate-bounce'
                }`}
              >
                {/* Visual Rings */}
                <div className="absolute inset-4 border border-dashed border-white/10 rounded-full animate-[spin_10s_linear_infinite]" />
                
                {/* Big Star Emoji / SVG */}
                <span className={`text-7xl sm:text-8xl select-none filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] ${
                  starrDropTaps > 0 ? 'scale-110' : 'scale-100'
                } transition-transform`}>
                  {starrDropRarity === 'Rare' ? '⭐' :
                   starrDropRarity === 'Super Rare' ? '🌟' :
                   starrDropRarity === 'Epic' ? '🔮' :
                   starrDropRarity === 'Mythic' ? '🔥' : '👑'}
                </span>

                {/* Tap Alert Count Indicator */}
                <span className="absolute bottom-4 text-[10px] font-black text-white/60 tracking-widest bg-slate-950/80 px-2 py-0.5 rounded-full uppercase">
                  {starrDropTaps < 4 ? `TAP! (${starrDropTaps}/4)` : 'BURST!'}
                </span>
              </div>
            ) : (
              // Revealed Reward Display card
              (starrDropReward?.type === 'brawler' || starrDropReward?.type === 'skin') ? (
                (() => {
                  const bId = starrDropReward.type === 'brawler' ? starrDropReward.value : starrDropReward.value.split(':')[0];
                  const sId = starrDropReward.type === 'brawler' ? 'default' : starrDropReward.value.split(':')[1];
                  const bData = BRAWLER_TEMPLATES[bId];
                  const rarityColor = bData?.rarity === 'Legendary' ? 'text-amber-400 border-amber-500 shadow-amber-500/50' :
                                      bData?.rarity === 'Mythic' ? 'text-red-500 border-red-500 shadow-red-500/50' :
                                      bData?.rarity === 'Epic' ? 'text-purple-500 border-purple-500 shadow-purple-500/50' :
                                      bData?.rarity === 'Rare' ? 'text-green-400 border-green-500 shadow-green-500/50' : 'text-slate-300 border-slate-500';
                  
                  const rarityBg = bData?.rarity === 'Legendary' ? 'from-amber-950/80 via-amber-900/60 to-slate-950 border-amber-500/50' :
                                   bData?.rarity === 'Mythic' ? 'from-rose-950/80 via-rose-900/60 to-slate-950 border-rose-500/50' :
                                   bData?.rarity === 'Epic' ? 'from-purple-950/80 via-purple-900/60 to-slate-950 border-purple-500/50' :
                                   bData?.rarity === 'Rare' ? 'from-emerald-950/80 via-emerald-900/60 to-slate-950 border-emerald-500/50' : 'from-slate-900/90 via-slate-800/75 to-slate-950 border-slate-800';

                  return (
                    <div className={`relative w-full max-w-xl bg-gradient-to-b ${rarityBg} border-2 rounded-[2.5rem] p-8 flex flex-col items-center overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]`}>
                      {/* ROTATING GOLDEN RAY BACKGROUND */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-[conic-gradient(from_0deg,_rgba(245,158,11,0.18),_transparent_15deg,_rgba(245,158,11,0.18)_30deg)] animate-[spin_20s_linear_infinite] pointer-events-none z-0"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-[conic-gradient(from_45deg,_rgba(168,85,247,0.12),_transparent_20deg,_rgba(168,85,247,0.12)_40deg)] animate-[spin_12s_linear_infinite_reverse] pointer-events-none z-0"></div>
                      
                      {/* SPARKLING LIGHT EFFECTS */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(0,0,0,0.4))] pointer-events-none z-0"></div>
                      <div className="absolute top-12 left-12 animate-pulse text-yellow-400/80 z-10"><Sparkles className="w-8 h-8" /></div>
                      <div className="absolute bottom-24 right-16 animate-ping text-purple-400/50 z-10"><Sparkles className="w-5 h-5" /></div>
                      <div className="absolute top-20 right-20 animate-pulse text-sky-400/70 z-10"><Sparkles className="w-6 h-6" /></div>

                      {/* MAIN BRAWLER CARD */}
                      <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center relative z-10 select-none transform hover:scale-105 transition-all duration-300 drop-shadow-[0_20px_35px_rgba(0,0,0,0.6)]">
                        <div 
                          className="w-full h-full"
                          dangerouslySetInnerHTML={{ __html: getBrawlerSVG(bId, sId) }} 
                        />
                      </div>

                      {/* REWARD METADATA */}
                      <div className="text-center z-10 mt-6 relative">
                        <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${rarityColor} bg-black/60 shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
                          {bData?.rarity} {starrDropReward.type === 'brawler' ? 'BRAWLER' : 'EXCLUSIVE SKIN'}
                        </span>

                        <h3 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-yellow-400 uppercase text-center mt-3 stroke-black drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                          {starrDropReward.type === 'brawler' ? bData?.name : starrDropReward.label.replace('NEW SKIN: ', '').split(' (')[0]}
                        </h3>

                        <p className="text-sm font-bold text-slate-300 mt-2 max-w-sm mx-auto uppercase tracking-wide">
                          {bData?.description || "A powerful new ally in the brawl sandbox!"}
                        </p>

                        <div className="flex gap-4 justify-center items-center mt-4 text-xs font-bold text-slate-400">
                          <div className="bg-slate-950/60 px-3.5 py-1.5 rounded-xl border border-slate-800">
                            ❤️ HP: <span className="text-emerald-400 font-extrabold">{bData?.hp}</span>
                          </div>
                          <div className="bg-slate-950/60 px-3.5 py-1.5 rounded-xl border border-slate-800">
                            ⚔️ DMG: <span className="text-rose-400 font-extrabold">{bData?.damage}</span>
                          </div>
                        </div>
                      </div>

                      {/* CONFIRM BUTTON */}
                      <button 
                        onClick={() => setShowStarrDropModal(false)}
                        className="w-full max-w-xs bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-slate-950 font-black py-4 px-8 rounded-2xl border-b-4 border-amber-800 shadow-[0_4px_20px_rgba(245,158,11,0.3)] mt-8 z-10 relative active:translate-y-[2px] active:border-b-2 hover:scale-[1.02] transition-all uppercase tracking-wider text-sm"
                      >
                        🔥 COLLECT REWARD!
                      </button>
                    </div>
                  );
                })()
              ) : (
                <div className="bg-slate-900/80 border-2 border-indigo-500/50 rounded-3xl p-8 flex flex-col items-center max-w-sm w-full shadow-2xl animate-bounce-slow">
                  <span className="text-7xl mb-4 filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]">{starrDropReward?.icon}</span>
                  <h3 className="text-xl font-black uppercase text-slate-100 text-center mb-1">{starrDropReward?.label}</h3>
                  <p className="text-xs text-indigo-400 font-extrabold tracking-widest uppercase mb-6">
                    DAILY BONUS
                  </p>

                  <button 
                    onClick={() => setShowStarrDropModal(false)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-xl border-b-4 border-indigo-800 hover:border-indigo-600 active:border-b-0 active:translate-y-[4px] transition-all cursor-pointer"
                  >
                    AWESOME!
                  </button>
                </div>
              )
            )}

            <p className="mt-8 text-xs text-slate-400 font-bold uppercase tracking-wider text-center max-w-xs leading-relaxed">
              {starrDropState === 'reveal' ? 'Your reward has been claimed and added to your balance.' : 'Tapping has a chance of upgrading the rarity of your Starr Drop! Burst it on the 4th tap!'}
            </p>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* QUESTS MODAL DRAWER */}
      {/* ========================================================= */}
      {showQuestsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md" id="quests_modal">
          <div className="w-full max-w-2xl bg-slate-900 border-2 border-purple-500/40 rounded-3xl shadow-2xl p-6 flex flex-col max-h-[85vh]">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <Compass className="w-7 h-7 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
                <h2 className="text-2xl font-black uppercase tracking-wider">DAILY QUEST LOG</h2>
              </div>
              <button 
                id="close_quests_btn"
                onClick={() => setShowQuestsModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable list content */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-4">
              {quests.map(q => {
                const percent = Math.floor((q.progress / q.target) * 100);
                return (
                  <div 
                    key={q.id} 
                    className={`p-4 border-2 rounded-2xl transition-all relative overflow-hidden ${
                      q.completed 
                        ? 'bg-purple-950/20 border-purple-500/50' 
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Completion glow accent */}
                    {q.completed && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-500/10 to-transparent w-1/2 h-full pointer-events-none"></div>
                    )}

                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div>
                        <h3 className="font-black text-base text-slate-100 flex items-center gap-2">
                          {q.title}
                          {q.completed && <CheckCircle2 className="w-5 h-5 text-purple-400 fill-purple-900" />}
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">{q.description}</p>
                      </div>

                      {/* Reward Badge */}
                      <div className="shrink-0 flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl text-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-black text-slate-400">REWARD</span>
                          <span className="text-xs font-black text-amber-400">+{q.rewardCoins} COINS</span>
                          <span className="text-[10px] font-black text-purple-400">+{q.rewardPP} PP</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] font-black text-slate-400 mb-1">
                        <span>PROGRESS</span>
                        <span className={q.completed ? 'text-purple-400' : 'text-slate-300'}>
                          {q.progress.toLocaleString()} / {q.target.toLocaleString()} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-3 rounded-full border border-slate-900 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* BRAWL STARS PROFILE & LEADERBOARD MODAL */}
      {/* ========================================================= */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-fadeIn" id="profile_modal_container">
          <div className="bg-[#1e2330] border-2 border-amber-500/40 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden" id="profile_modal">
            
            {/* Modal Header */}
            <div className="bg-[#121620] px-6 py-4 flex justify-between items-center border-b border-[#2b3347] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center font-black text-slate-950 font-mono">★</div>
                <h3 className="font-mono font-black text-white tracking-tight text-base uppercase">BRAWLER STATION</h3>
              </div>
              <button 
                onClick={() => { setShowProfileModal(false); playAudio('defeat'); }}
                className="text-slate-400 hover:text-white font-bold p-1 rounded hover:bg-slate-850 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex bg-[#141925] border-b border-[#2b3347] shrink-0">
              <button
                onClick={() => { setActiveProfileTab('profile'); playAudio('super'); }}
                className={`flex-1 py-3 px-4 font-mono font-black text-xs tracking-wider border-b-2 transition-all ${
                  activeProfileTab === 'profile'
                    ? 'border-amber-500 text-white bg-slate-800/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                👤 MY BRAWLER PROFILE
              </button>
              <button
                onClick={() => { setActiveProfileTab('leaderboard'); playAudio('super'); }}
                className={`flex-1 py-3 px-4 font-mono font-black text-xs tracking-wider border-b-2 transition-all ${
                  activeProfileTab === 'leaderboard'
                    ? 'border-amber-500 text-white bg-slate-800/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                🏆 BRAWL LEADERBOARD
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6" id="profile_modal_body">
              
              {activeProfileTab === 'profile' ? (
                /* MY PROFILE CONTENT */
                <div className="flex flex-col gap-6">
                  
                  {/* Avatar & Key Card Banner */}
                  <div className="bg-[#121620] border border-[#2b3347] rounded-lg p-5 flex flex-col sm:flex-row items-center gap-5">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 border-2 border-amber-400/30 flex items-center justify-center text-5xl relative shadow-md shrink-0">
                      {currentUser?.gender === 'boy' ? '🙋‍♂️' : currentUser?.gender === 'girl' ? '🙋‍♀️' : '🛡️'}
                      {currentUser?.isGuest && (
                        <span className="absolute bottom-0 bg-rose-500 text-[9px] font-black px-2 py-0.5 rounded-full text-white tracking-widest border border-slate-900 shadow">GUEST</span>
                      )}
                    </div>
                    
                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="text-2xl font-black text-white flex flex-wrap items-center justify-center sm:justify-start gap-2.5 font-mono">
                        {currentUser?.username}
                        {!currentUser?.isGuest && (
                          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest font-sans font-bold animate-pulse">BRAWLER</span>
                        )}
                      </h4>
                      <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">
                        Rank: <span className="text-amber-400">{getRankFromTrophies(totalTrophies)}</span>
                      </p>
                      
                      {/* Trophies Progress */}
                      <div className="mt-3 max-w-sm">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 mb-1">
                          <span>TROPHIES PROGRESS</span>
                          <span>{totalTrophies} / 2,000</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-900">
                          <div 
                            className="bg-amber-500 h-full rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(100, (totalTrophies / 2000) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lifetime Statistics Panel */}
                  <div className="flex flex-col gap-2.5">
                    <h5 className="font-mono font-black text-slate-300 text-xs tracking-wider uppercase">LIFETIME BRAWL STATS</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-[#141925] border border-[#2b3347] p-3 rounded-lg text-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">Matches</span>
                        <span className="text-lg font-black text-white">{currentUser?.stats?.matchesPlayed || 0}</span>
                      </div>
                      <div className="bg-[#141925] border border-[#2b3347] p-3 rounded-lg text-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">Wins</span>
                        <span className="text-lg font-black text-emerald-400">{currentUser?.stats?.matchesWon || 0}</span>
                      </div>
                      <div className="bg-[#141925] border border-[#2b3347] p-3 rounded-lg text-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">Win Rate</span>
                        <span className="text-lg font-black text-amber-400">
                          {currentUser?.stats?.matchesPlayed ? ((currentUser.stats.matchesWon / currentUser.stats.matchesPlayed) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                      <div className="bg-[#141925] border border-[#2b3347] p-3 rounded-lg text-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">Kills</span>
                        <span className="text-lg font-black text-amber-400">{currentUser?.stats?.totalKills || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Brawler Bio Customization */}
                  <div className="flex flex-col gap-2.5 bg-[#141925] border border-[#2b3347] p-4 rounded-lg">
                    <h5 className="font-mono font-black text-slate-300 text-xs tracking-wider uppercase">Edit Brawler Bio</h5>
                    <p className="text-[11px] text-slate-400 font-medium">Tell other players about yourself! Your bio is displayed publicly on the leaderboard.</p>
                    <textarea
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      maxLength={160}
                      placeholder="Write your bio here... (Max 160 characters)"
                      className="bg-[#121620] border border-[#2b3347] text-sm text-slate-100 rounded p-3 h-20 resize-none outline-none focus:border-amber-500 font-medium mt-1"
                    />
                    <div className="flex justify-end gap-3 mt-1.5 shrink-0">
                      <button
                        onClick={saveBio}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded transition-all uppercase tracking-wider cursor-pointer animate-pulse"
                      >
                        💾 Save Bio
                      </button>
                    </div>
                  </div>

                  {/* Danger Log Out block */}
                  <div className="border-t border-[#2b3347] pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <p className="text-xs font-bold text-slate-400">Account Actions</p>
                      <p className="text-[10px] text-slate-500">Log out to switch back to guest mode or login to a different account.</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-4 py-2 rounded transition-all uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    >
                      🚪 Log Out Account
                    </button>
                  </div>

                </div>
              ) : (
                /* LEADERBOARD TAB CONTENT */
                <div className="flex flex-col gap-4">
                  <div className="bg-[#121620] p-3 rounded-lg border border-[#2b3347]">
                    <p className="text-xs text-yellow-500 font-bold flex items-center gap-1.5">
                      <span>👑 REAL-TIME BRAWL LEADERBOARD</span>
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">
                      Only registered accounts qualify for leaderboard ranks. Guest profiles are excluded. Match trophies are dynamically updated here!
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {/* Retrieve, filter, sort registered users */}
                    {(() => {
                      const usersStr = localStorage.getItem('brawlstars_auth_users');
                      let list: UserProfile[] = usersStr ? JSON.parse(usersStr) : [];
                      
                      // Ensure current logged-in user is updated/present in the list if they are registered
                      if (currentUser && !currentUser.isGuest) {
                        const idx = list.findIndex(u => u.username.toLowerCase() === currentUser.username.toLowerCase());
                        const activeDetails = {
                          ...currentUser,
                          coins,
                          powerPoints,
                          totalTrophies,
                          brawlerStates,
                          unlockedSkins
                        };
                        if (idx !== -1) {
                          list[idx] = activeDetails;
                        } else {
                          list.push(activeDetails);
                        }
                      }

                      // Filter out guests, sort descending by trophies
                      const sorted = list
                        .filter(u => !u.isGuest)
                        .sort((a, b) => b.totalTrophies - a.totalTrophies);

                      if (sorted.length === 0) {
                        return <div className="text-center py-6 text-slate-500 font-bold">No registered players yet. Be the first!</div>;
                      }

                      return sorted.map((player, idx) => {
                        const isMe = currentUser && !currentUser.isGuest && player.username.toLowerCase() === currentUser.username.toLowerCase();
                        const rankMedal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                        
                        return (
                          <div 
                            key={player.username}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border transition-all ${
                              isMe 
                                ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.15)]' 
                                : 'bg-[#141925] border-[#2b3347] hover:border-slate-500'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Position Badge */}
                              <span className={`w-8 font-mono font-black text-sm text-center ${
                                idx === 0 ? 'text-amber-400 text-lg' : idx === 1 ? 'text-slate-300 text-lg' : idx === 2 ? 'text-amber-700 text-lg' : 'text-slate-400'
                              }`}>
                                {rankMedal}
                              </span>

                              {/* Avatar */}
                              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shrink-0">
                                {player.gender === 'boy' ? '🙋‍♂️' : player.gender === 'girl' ? '🙋‍♀️' : '🙋'}
                              </div>

                              {/* User details */}
                              <div>
                                <h6 className="font-bold text-white text-sm flex items-center gap-1.5">
                                  {player.username}
                                  {isMe && <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 rounded uppercase font-sans tracking-wider">YOU</span>}
                                </h6>
                                <p className="text-[11px] text-slate-400 italic max-w-xs sm:max-w-sm truncate mt-0.5">
                                  {player.bio || "No bio set."}
                                </p>
                              </div>
                            </div>

                            {/* Trophies Counter */}
                            <div className="flex items-center gap-4 mt-2 sm:mt-0 pl-11 sm:pl-0">
                              <div className="text-right">
                                <div className="flex items-center gap-1 justify-end">
                                  <Trophy className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                  <span className="font-mono font-black text-sm text-slate-100">{player.totalTrophies}</span>
                                </div>
                                <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block">{getRankFromTrophies(player.totalTrophies)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="bg-[#191b1d] px-6 py-3 border-t border-[#3e4247] text-right shrink-0">
              <button
                onClick={() => { setShowProfileModal(false); playAudio('defeat'); }}
                className="bg-slate-700 hover:bg-slate-600 text-white font-mono font-black text-xs px-5 py-2.5 rounded transition-colors uppercase tracking-wider cursor-pointer"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TOAST NOTIFICATION SYSTEM LAYER */}
      {/* ========================================================= */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3.5 pointer-events-none max-w-sm w-full">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className="bg-slate-900/95 border-2 border-purple-500/80 rounded-2xl p-4 shadow-2xl flex items-center gap-4.5 backdrop-blur pointer-events-auto transition-all animate-bounce"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-black shrink-0 shadow-lg border border-amber-300/30">
              ⭐
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-black text-white truncate">{t.text}</h4>
              <p className="text-xs font-bold text-indigo-300 mt-0.5">{t.subtext}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================= */}
      {/* MATCHMAKING QUEUE OVERLAY */}
      {/* ========================================================= */}
      {isQueuing && (
        <div className="fixed inset-0 z-[90] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className={`w-full max-w-md bg-gradient-to-b from-[#1a1c24] to-[#121319] border-t-8 ${isMatchFound ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.25)]' : 'border-cyan-500 shadow-[0_0_50px_rgba(6,182,212,0.25)]'} rounded-3xl p-8 flex flex-col items-center text-center gap-6 relative transition-all duration-300`}>
            {/* Spinning radar or success icon design */}
            <div className={`w-24 h-24 rounded-full border-4 ${isMatchFound ? 'border-emerald-500 border-solid animate-bounce' : 'border-dashed border-cyan-500 animate-spin'} flex items-center justify-center relative shrink-0`}>
              <div className={`w-16 h-16 rounded-full border-4 ${isMatchFound ? 'border-emerald-400' : 'border-cyan-400'} flex items-center justify-center animate-ping absolute`}></div>
              <Swords className={`w-8 h-8 ${isMatchFound ? 'text-emerald-400' : 'text-cyan-400'} rotate-12`} />
            </div>

            <div className="flex flex-col gap-1.5 shrink-0">
              <h2 className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r ${isMatchFound ? 'from-emerald-400 via-teal-400 to-cyan-400' : 'from-cyan-400 via-purple-400 to-indigo-400'} tracking-wider uppercase`}>
                {isMatchFound ? "Match Found!" : "Searching for Opponent"}
              </h2>
              <p className="text-sm font-semibold text-slate-400">
                {isMatchFound ? "Securing connection to battle arena..." : "Tactical 2D Battle Royale Matchmaking"}
              </p>
            </div>

            {isMatchFound && multiplayerOpponents.length > 0 ? (
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 flex flex-col gap-3 w-full justify-center shrink-0">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest text-center">Multiplayer Lobby ({multiplayerOpponents.length + 1}/10 Players)</span>
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {/* You */}
                  <div className="flex items-center justify-between bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 rounded-xl">
                    <span className="font-extrabold text-sm text-emerald-400">{currentUser?.username || "Player"} (You)</span>
                    <span className="text-[10px] font-black text-emerald-300 uppercase px-1.5 py-0.5 bg-emerald-500/20 rounded">
                      Lvl {activeBrawlerState?.level || 11}
                    </span>
                  </div>
                  {/* Opponents */}
                  {multiplayerOpponents.map((op, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-950/50 border border-slate-800 px-3 py-2 rounded-xl animate-fade-in">
                      <span className="font-bold text-sm text-white">{op.username}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-amber-400 uppercase px-1.5 py-0.5 bg-amber-500/10 rounded">
                          Lvl {op.level}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{op.brawlerId}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : isMatchFound && multiplayerOpponent ? (
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-5 flex flex-col items-center gap-3 w-full justify-center shrink-0 animate-pulse">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Opponent Connected</span>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-xl text-white">{multiplayerOpponent.username || "Challenger"}</span>
                  <span className="text-xs font-black text-slate-900 uppercase px-2 py-0.5 bg-emerald-400 rounded-md">
                    Lvl {multiplayerOpponent.level || 1}
                  </span>
                </div>
                <div className="text-xs font-bold text-emerald-300 capitalize flex items-center gap-1.5">
                  🛡️ Brawler: <span className="text-white font-extrabold uppercase">{multiplayerOpponent.brawlerId}</span>
                </div>
              </div>
            ) : (
              <div className="bg-[#1b2230] border border-[#2c374e] rounded-2xl px-6 py-4 flex flex-col items-center gap-2.5 w-full justify-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                  <span className="font-mono text-sm font-extrabold text-slate-200 uppercase tracking-widest">
                    Players in Queue: <span className="text-cyan-400 text-lg">{queueCount}</span> / 10
                  </span>
                </div>
                <div className="w-full h-px bg-[#2c374e]"></div>
                <div className="text-amber-400 font-bold text-xs uppercase tracking-widest animate-pulse flex items-center gap-2">
                  ⏳ Loading Arena in <span className="text-base text-amber-300 font-extrabold">{queueCountdown}s</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5 w-full shrink-0">
              <span className={`text-xs font-black uppercase tracking-widest animate-pulse ${isMatchFound ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isMatchFound ? "Synchronizing world seeds..." : "Establishing battle server..."}
              </span>
              <p className="text-[10px] text-slate-500 font-medium">
                {isMatchFound ? "Prepare yourself! The match will begin momentarily." : "If no human challengers connect within 15 seconds, training bots will automatically be loaded!"}
              </p>
            </div>

            {!isMatchFound && (
              <button
                onClick={cancelMultiplayerQueue}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black text-base py-3.5 px-6 rounded-2xl border-b-4 border-rose-800 hover:border-rose-600 active:border-b-0 active:translate-y-[4px] transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
                CANCEL MATCHMAKING
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// =====================================================================
// GAME ENGINE CONTROLLER CLASS (RUNNING HIGH-PERFORMANCE ANIMATION LOOP)
// =====================================================================
class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private brawlerId: string;
  private brawlerLevel: number;
  private skinId: string;
  private mapName: string;
  private onMatchEnd: (placement: number, kills: number, damageDealt: number, cubesCollected: number) => void;
  private playSound: (type: string) => void;
  private gameMode: 'showdown' | 'tdm' = 'showdown';

  // Victory celebration state
  private isCelebratingVictory: boolean = false;
  private victoryCelebrationStartTime: number = 0;
  private victoryConfetti: Array<{ x: number, y: number, vx: number, vy: number, color: string, r: number, rotation: number, rotationSpeed: number }> = [];
  private victoryFireworks: Array<{ x: number, y: number, vx: number, vy: number, color: string, age: number, maxAge: number, r: number }> = [];

  private isRunning: boolean = false;
  private lastTime: number = 0;
  private world!: GameWorld;
  private killCount: number = 0;

  // Inputs Key Deck
  private keys: Record<string, boolean> = {};
  private mouseAim = { x: 0, y: 0, active: false };
  private isAimingBase: boolean = false;
  private isAimingSuper: boolean = false;

  // Mobile Touch Inputs Support vectors
  public touchMoveVector = { x: 0, y: 0, active: false };
  public touchAimVector = { x: 0, y: 0, active: false };

  // Gas warnings and shrinkage speeds
  private gasShrinkTimer: number = 0;

  private selectedGadget: string;
  private selectedStarPower: string;
  private selectedGears: string[];
  private hyperchargeUnlocked: boolean;

  // Multiplayer Engine Hooks
  private socket: WebSocket | null;
  private roomId: string | null;
  private myRole: string | null;
  private opponentsInfo: any[];
  private seed: number | null;
  private opponentsMap = new Map<string, Character>();
  private lastSyncTime: number = 0;
  private lastBotSyncTime: number = 0;

  constructor(
    canvas: HTMLCanvasElement, 
    brawlerId: string, 
    level: number, 
    skinId: string, 
    mapName: string,
    onMatchEnd: (placement: number, kills: number, damageDealt: number, cubesCollected: number) => void,
    playSound: (type: string) => void,
    selectedGadget: string = '',
    selectedStarPower: string = '',
    selectedGears: string[] = [],
    hyperchargeUnlocked: boolean = false,
    socket: WebSocket | null = null,
    roomId: string | null = null,
    myRole: string | null = null,
    opponentsInfo: any[] = [],
    seed: number | null = null,
    gameMode: 'showdown' | 'tdm' = 'showdown'
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error("Could not acquire 2D Canvas rendering context");
    this.ctx = context;
    
    this.brawlerId = brawlerId;
    this.brawlerLevel = level;
    this.skinId = skinId;
    this.mapName = mapName;
    this.onMatchEnd = onMatchEnd;
    this.playSound = playSound;
    this.selectedGadget = selectedGadget;
    this.selectedStarPower = selectedStarPower;
    this.selectedGears = selectedGears;
    this.hyperchargeUnlocked = hyperchargeUnlocked;

    this.socket = socket;
    this.roomId = roomId;
    this.myRole = myRole;
    this.opponentsInfo = opponentsInfo;
    this.seed = seed;
    this.gameMode = gameMode;

    this.resizeCanvas();
    this.initWorld();
    this.registerControls();
  }

  private resizeCanvas() {
    this.canvas.width = this.canvas.parentElement?.clientWidth || window.innerWidth;
    this.canvas.height = this.canvas.parentElement?.clientHeight || window.innerHeight;
  }

  private registerControls() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);

    if (this.socket) {
      this.socket.onmessage = this.handleSocketMessage;
    }
  }

  private unregisterControls() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);

    if (this.socket) {
      this.socket.onmessage = null;
    }
  }

  private handleResize = () => { this.resizeCanvas(); };

  private handleSocketMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'sync_state') {
        const op = this.opponentsMap.get(data.role);
        if (op) {
          op.x = data.x;
          op.y = data.y;
          op.hp = data.hp;
          op.maxHp = data.maxHp;
          op.powerCubes = data.cubes;
          op.facingAngle = data.angle;
          op.isMoving = data.isMoving;
          if (data.hypercharged && op.hyperActiveTimer <= 0) {
            op.hyperActiveTimer = 5000;
          } else if (!data.hypercharged) {
            op.hyperActiveTimer = 0;
          }
          if (data.activeEmote) {
            op.activeEmote = data.activeEmote;
            op.activeEmoteTimer = data.activeEmoteTimer;
          }
        }
      } else if (data.type === 'trigger_action') {
        const op = this.opponentsMap.get(data.role);
        if (op) {
          if (data.action === 'shoot') {
            this.fireProjectile(op, data.angle, data.isSuper);
          } else if (data.action === 'gadget') {
            op.useGadget(this.world);
          } else if (data.action === 'hypercharge') {
            op.activateHypercharge(this.world);
          } else if (data.action === 'emote') {
            op.activeEmote = data.emote;
            op.activeEmoteTimer = 2500;
            this.playSound('power_up');
          }
        }
      } else if (data.type === 'sync_bots') {
        data.bots.forEach((bData: any) => {
          const bot = this.world.bots.find(b => b.name === bData.name);
          if (bot && !bot.isOpponent) {
            bot.hp = bData.hp;
            bot.maxHp = bData.maxHp;
            bot.powerCubes = bData.powerCubes;
            bot.facingAngle = bData.facingAngle;
            bot.isMoving = bData.isMoving;
            bot.aiState = bData.aiState;

            if (Math.hypot(bot.x - bData.x, bot.y - bData.y) > 80) {
              bot.x = bData.x;
              bot.y = bData.y;
            } else {
              bot.x = bot.x * 0.75 + bData.x * 0.25;
              bot.y = bot.y * 0.75 + bData.y * 0.25;
            }
          }
        });
      } else if (data.type === 'opponent_left') {
        const op = this.opponentsMap.get(data.role);
        if (op) {
          op.hp = 0; // eliminate from match
          this.world.floatingTexts.push(new FloatingText(op.x, op.y - 40, `${op.name} DISCONNECTED!`, "#ef4444", 16));
        } else {
          this.world.floatingTexts.push(new FloatingText(this.world.player?.x || 150, (this.world.player?.y || 150) - 40, "OPPONENT DISCONNECTED!", "#ef4444", 16));
        }
      }
    } catch (err) {
      console.error("Error handling multiplayer message:", err);
    }
  };

  private handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = true;
    this.keys[e.code] = true;

    // Fast active hotkeys
    if (e.key.toLowerCase() === 'e' || e.key === 'Shift') {
      this.isAimingSuper = true;
    }
    if (e.key.toLowerCase() === 'g') {
      this.triggerPlayerGadget();
    }
    if (e.key.toLowerCase() === 'h' || e.key.toLowerCase() === 'f' || e.key === ' ') {
      this.triggerPlayerHypercharge();
    }
    if (e.key === '1') {
      this.triggerPlayerEmote('👍');
    }
    if (e.key === '2') {
      this.triggerPlayerEmote('😡');
    }
    if (e.key === '3') {
      this.triggerPlayerEmote('😄');
    }
    if (e.key === '4') {
      this.triggerPlayerEmote('❤️');
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
    this.keys[e.code] = false;

    if (e.key.toLowerCase() === 'e' || e.key === 'Shift') {
      if (this.isAimingSuper) {
        this.triggerPlayerSuper();
        this.isAimingSuper = false;
      }
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseAim.x = e.clientX - rect.left;
    this.mouseAim.y = e.clientY - rect.top;
    this.mouseAim.active = true;
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isAimingBase = true;
      this.isAimingSuper = false;
    } else if (e.button === 2) {
      e.preventDefault();
      this.isAimingSuper = true;
      this.isAimingBase = false;
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      if (this.isAimingBase) {
        this.triggerPlayerAttack();
        this.isAimingBase = false;
      }
    } else if (e.button === 2) {
      e.preventDefault();
      if (this.isAimingSuper) {
        this.triggerPlayerSuper();
        this.isAimingSuper = false;
      }
    }
  };

  public triggerPlayerAttack() {
    const player = this.world.player;
    if (!player || player.hp <= 0 || player.ammo < 1 || player.stunTimer > 0) return;

    let targetAngle = player.facingAngle;
    if (this.touchAimVector.active) {
      targetAngle = Math.atan2(this.touchAimVector.y, this.touchAimVector.x);
    } else if (this.mouseAim.active) {
      const px = this.canvas.width / 2;
      const py = this.canvas.height / 2;
      targetAngle = Math.atan2(this.mouseAim.y - py, this.mouseAim.x - px);
    }

    player.facingAngle = targetAngle;
    player.isMoving = false; // brief pause on shooting or handled by velocity

    // Perform brawler custom shoot action
    this.fireProjectile(player, targetAngle, false);
  }

  public triggerPlayerSuper() {
    const player = this.world.player;
    if (!player || player.hp <= 0 || player.superCharge < 100 || player.stunTimer > 0) return;

    let targetAngle = player.facingAngle;
    if (this.touchAimVector.active) {
      targetAngle = Math.atan2(this.touchAimVector.y, this.touchAimVector.x);
    } else if (this.mouseAim.active) {
      const px = this.canvas.width / 2;
      const py = this.canvas.height / 2;
      targetAngle = Math.atan2(this.mouseAim.y - py, this.mouseAim.x - px);
    }

    player.facingAngle = targetAngle;
    this.fireProjectile(player, targetAngle, true);
    player.superCharge = 0;
    player.superReady = false;
  }

  public triggerPlayerGadget() {
    const player = this.world.player;
    if (!player || player.hp <= 0 || player.stunTimer > 0) return;
    player.useGadget(this.world);

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'trigger_action',
        action: 'gadget'
      }));
    }
  }

  public triggerPlayerHypercharge() {
    const player = this.world.player;
    if (!player || player.hp <= 0 || player.stunTimer > 0) return;
    player.activateHypercharge(this.world);

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'trigger_action',
        action: 'hypercharge'
      }));
    }
  }

  public triggerPlayerEmote(emote: string) {
    const player = this.world.player;
    if (!player || player.hp <= 0) return;
    player.activeEmote = emote;
    player.activeEmoteTimer = 2500;
    this.playSound('power_up');

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'trigger_action',
        action: 'emote',
        emote: emote
      }));
    }
  }

  public triggerTouchShoot(isSuper: boolean = false, autoAim: boolean = false) {
    const player = this.world.player;
    if (!player || player.hp <= 0 || player.stunTimer > 0) return;

    let targetAngle = player.facingAngle;

    if (autoAim) {
      // Find nearest living bot to target
      let nearest: any = null;
      let minDist = Infinity;
      this.world.bots.forEach(b => {
        if (b.hp > 0) {
          let d = Math.hypot(b.x - player.x, b.y - player.y);
          if (d < minDist) {
            minDist = d;
            nearest = b;
          }
        }
      });
      if (nearest) {
        targetAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
      }
    } else if (this.touchAimVector.active) {
      targetAngle = Math.atan2(this.touchAimVector.y, this.touchAimVector.x);
    }

    player.facingAngle = targetAngle;

    if (isSuper) {
      if (player.superCharge < 100) return;
      this.fireProjectile(player, targetAngle, true);
      player.superCharge = 0;
      player.superReady = false;
    } else {
      if (player.ammo < 1) return;
      this.fireProjectile(player, targetAngle, false);
    }
  }

  private fireProjectile(owner: Character, angle: number, isSuper: boolean) {
    const template = BRAWLER_TEMPLATES[owner.id];
    if (!template) return;

    if (owner === this.world.player && this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'trigger_action',
        action: 'shoot',
        angle: angle,
        isSuper: isSuper
      }));
    }

    const missingBrawlers = ['mortis', 'piper', 'dynamike', 'frank', 'poco', 'tara', 'tick', 'amber'];
    if (missingBrawlers.includes(owner.id)) {
      owner.fire(angle, null, this.world, isSuper);
      return;
    }

    this.playSound('shoot');
    owner.lastCombatTime = Date.now();

    if (!isSuper) {
      owner.ammo--;
      owner.reloadTimer = 0;
    }

    // CUSTOM MULTI-BULLET / UNIQUE ATTACKS HANDLING
    if (owner.id === 'gale') {
      // Fires wide line of 5 snowball projectiles
      const spread = 0.15;
      const bulletCount = isSuper ? 8 : 5;
      const dmg = isSuper ? Math.floor(owner.getDamage() * 0.9) : Math.floor(owner.getDamage() * 0.45);
      
      for (let i = 0; i < bulletCount; i++) {
        let a = angle + (i - (bulletCount - 1) / 2) * spread;
        let proj = new Projectile(owner.x, owner.y, a, owner.bulletSpeed * 0.9, dmg, owner.attackRange, owner, 5, isSuper, false);
        proj.isSnowball = !isSuper;
        this.world.projectiles.push(proj);
      }
    } 
    else if (owner.id === 'mico') {
      // Jumping forward action!
      const jumpDist = isSuper ? 360 : 160;
      owner.isJumping = true;
      owner.jumpElapsed = 0;
      owner.jumpDuration = isSuper ? 2500 : 500;
      owner.jumpStartX = owner.x;
      owner.jumpStartY = owner.y;
      owner.jumpTargetX = Math.max(50, Math.min(this.world.WORLD_SIZE - 50, owner.x + Math.cos(angle) * jumpDist));
      owner.jumpTargetY = Math.max(50, Math.min(this.world.WORLD_SIZE - 50, owner.y + Math.sin(angle) * jumpDist));
      if (isSuper) {
        owner.superCharge = 0; // charge fully consumed
        this.world.floatingTexts.push(new FloatingText(owner.x, owner.y - 40, "🐒 GRAND SKYDIVE!", '#facc15', 20));
      }
    } 
    else if (owner.id === 'charlie') {
      // Charlie fires a hair yo-yo that retracts upon hitting obstacles/max-range
      if (isSuper) {
        // Cocoon projectile web
        let proj = new Projectile(owner.x, owner.y, angle, owner.bulletSpeed * 1.3, 0, owner.attackRange * 1.2, owner, 7, true, true);
        proj.isCocoonWeb = true;
        this.world.projectiles.push(proj);
      } else {
        if (owner.charlieYoYoActive) return; // Only 1 active yo-yo at a time!
        owner.charlieYoYoActive = true;
        let proj = new Projectile(owner.x, owner.y, angle, owner.bulletSpeed, Math.floor(owner.getDamage() * 0.8), owner.attackRange, owner, 6, false, true);
        proj.isCharlieHair = true;
        this.world.projectiles.push(proj);
      }
    }
    else if (owner.id === 'shelly') {
      // Wide shotgun spray
      const bulletCount = isSuper ? 9 : 5;
      const spread = isSuper ? 0.45 : 0.35;
      const dmg = isSuper ? Math.floor(owner.getDamage() * 0.40) : Math.floor(owner.getDamage() * 0.30);
      for (let i = 0; i < bulletCount; i++) {
        let a = angle + (i - (bulletCount - 1) / 2) * (spread / (bulletCount - 1));
        this.world.projectiles.push(new Projectile(owner.x, owner.y, a, owner.bulletSpeed * (0.95 + (owner.random ? owner.random.next() : Math.random())*0.1), dmg, owner.attackRange * (0.8 + (owner.random ? owner.random.next() : Math.random())*0.3), owner, 5, isSuper, isSuper));
      }
    }
    else if (owner.id === 'colt') {
      // Fast straight barrage of 6 (or 12 for super) bullets
      const count = isSuper ? 12 : 6;
      const delay = 100;
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          if (!this.isRunning || owner.hp <= 0) return;
          // Recalculating facing angle slightly
          this.world.projectiles.push(new Projectile(owner.x, owner.y, owner.facingAngle, owner.bulletSpeed * 1.2, isSuper ? Math.floor(owner.getDamage() * 0.35) : Math.floor(owner.getDamage() * 0.30), owner.attackRange * 1.1, owner, 4, isSuper, isSuper));
          if (i % 2 === 0) this.playSound('shoot');
        }, i * delay);
      }
    }
    else if (owner.id === 'el_primo') {
      if (isSuper) {
        // High soaring leap
        owner.isJumping = true; owner.jumpElapsed = 0; owner.jumpStartX = owner.x; owner.jumpStartY = owner.y;
        owner.jumpDuration = 900;
        owner.jumpTargetX = Math.max(50, Math.min(this.world.WORLD_SIZE - 50, owner.x + Math.cos(angle) * 320));
        owner.jumpTargetY = Math.max(50, Math.min(this.world.WORLD_SIZE - 50, owner.y + Math.sin(angle) * 320));
      } else {
        // Four fast punches
        const punches = 4;
        for (let i = 0; i < punches; i++) {
          setTimeout(() => {
            if (!this.isRunning || owner.hp <= 0) return;
            const spreadAngle = angle + ((owner.random ? owner.random.next() : Math.random()) - 0.5) * 0.15;
            this.world.projectiles.push(new Projectile(owner.x + Math.cos(spreadAngle) * 15, owner.y + Math.sin(spreadAngle) * 15, spreadAngle, 14, Math.floor(owner.getDamage() * 0.35), owner.attackRange * 0.8, owner, 18, false, false));
            if (i % 2 === 0) this.playSound('shoot');
          }, i * 75);
        }
      }
    }
    else if (owner.id === 'spike') {
      if (isSuper) {
        // Slowing spike storm
        let proj = new Projectile(owner.x, owner.y, angle, owner.bulletSpeed * 0.8, Math.floor(owner.getDamage() * 0.25), owner.attackRange * 0.9, owner, 8, true, false);
        proj.isSuper = true; proj.piercing = true;
        this.world.projectiles.push(proj);
      } else {
        // Spike ball splitting
        let proj = new Projectile(owner.x, owner.y, angle, owner.bulletSpeed, Math.floor(owner.getDamage() * 0.85), owner.attackRange, owner, 7, false, false);
        proj.isSpikeBall = true;
        this.world.projectiles.push(proj);
      }
    }
    else if (owner.id === 'crow') {
      if (isSuper) {
        // Jump and spread daggers in a circle
        owner.isJumping = true; owner.jumpElapsed = 0; owner.jumpStartX = owner.x; owner.jumpStartY = owner.y;
        owner.jumpDuration = 700;
        owner.jumpTargetX = Math.max(50, Math.min(this.world.WORLD_SIZE - 50, owner.x + Math.cos(angle) * 240));
        owner.jumpTargetY = Math.max(50, Math.min(this.world.WORLD_SIZE - 50, owner.y + Math.sin(angle) * 240));
        
        for (let a = 0; a < Math.PI * 2; a += (Math.PI * 2) / 14) {
          this.world.projectiles.push(new Projectile(owner.x, owner.y, a, owner.bulletSpeed * 1.1, owner.getDamage(), owner.attackRange * 0.9, owner, 6, true, false));
        }
      } else {
        // 3-way poison fan
        const count = 3;
        for (let i = 0; i < count; i++) {
          let a = angle + (i - 1) * 0.18;
          this.world.projectiles.push(new Projectile(owner.x, owner.y, a, owner.bulletSpeed, Math.floor(owner.getDamage() * 0.40), owner.attackRange, owner, 5, false, false));
        }
      }
    }
    else if (owner.id === 'leon') {
      if (isSuper) {
        owner.invisibleTimer = 6000;
        this.world.floatingTexts.push(new FloatingText(owner.x, owner.y - 40, "🥷 INVISIBILITY!", '#22c55e', 20));
      } else {
        // 4 quick spinning shurikens with dropoff damage
        const shurikens = 4;
        for (let i = 0; i < shurikens; i++) {
          setTimeout(() => {
            if (!this.isRunning || owner.hp <= 0) return;
            const spreadAngle = owner.facingAngle + (i - 1.5) * 0.08;
            this.world.projectiles.push(new Projectile(owner.x, owner.y, spreadAngle, owner.bulletSpeed * 1.1, Math.floor(owner.getDamage() * 0.38), owner.attackRange, owner, 6, false, false));
          }, i * 90);
        }
      }
    }
    else if (owner.id === 'kenji') {
      if (isSuper) {
        // Massive dynamic slash attack
        this.world.particles.push(new CircleSlashParticle(owner.x, owner.y, 160, 'rgba(56, 189, 248, 0.8)'));
        this.playSound('super');
        const candidates = [this.world.player, ...this.world.bots].filter(b => b && b !== owner && b.hp > 0 && !b.isClone);
        candidates.forEach(t => {
          if (Math.hypot(t.x - owner.x, t.y - owner.y) < 180) {
            t.takeDamage(owner.getDamage() * 1.8, owner.name + " (Super)", this.world);
          }
        });
      } else {
        // Dash slash
        owner.x += Math.cos(angle) * 75;
        owner.y += Math.sin(angle) * 75;
        owner.x = Math.max(50, Math.min(this.world.WORLD_SIZE - 50, owner.x));
        owner.y = Math.max(50, Math.min(this.world.WORLD_SIZE - 50, owner.y));
        owner.shieldTimer = 1500; // brief shield
        this.world.particles.push(new CircleSlashParticle(owner.x, owner.y, 75, 'rgba(255,255,255,0.6)'));
        const candidates = [this.world.player, ...this.world.bots].filter(b => b && b !== owner && b.hp > 0);
        candidates.forEach(t => {
          if (Math.hypot(t.x - owner.x, t.y - owner.y) < 80) {
            t.takeDamage(owner.getDamage(), owner.name, this.world);
          }
        });
      }
    }
    else if (owner.id === 'edgar') {
      if (isSuper) {
        owner.isJumping = true; owner.jumpElapsed = 0; owner.jumpStartX = owner.x; owner.jumpStartY = owner.y;
        owner.jumpDuration = 650;
        owner.jumpTargetX = Math.max(50, Math.min(this.world.WORLD_SIZE - 50, owner.x + Math.cos(angle) * 180));
        owner.jumpTargetY = Math.max(50, Math.min(this.world.WORLD_SIZE - 50, owner.y + Math.sin(angle) * 180));
      } else {
        // Dual scarf quick punches
        const strikes = 2;
        for (let i = 0; i < strikes; i++) {
          setTimeout(() => {
            if (!this.isRunning || owner.hp <= 0) return;
            const spread = angle + (i === 0 ? -0.15 : 0.15);
            this.world.projectiles.push(new Projectile(owner.x, owner.y, spread, 14, Math.floor(owner.getDamage() * 0.55), owner.attackRange * 0.75, owner, 18, false, false));
          }, i * 80);
        }
      }
    }
    else if (owner.id === 'bibi') {
      if (isSuper) {
        // Bouncing bubble gum ball
        let proj = new Projectile(owner.x, owner.y, angle, owner.bulletSpeed * 0.9, Math.floor(owner.getDamage() * 0.9), owner.attackRange * 2.5, owner, 16, true, false);
        proj.bounce = true; proj.piercing = true;
        this.world.projectiles.push(proj);
      } else {
        // Massive batting swing
        this.world.particles.push(new CircleSlashParticle(owner.x, owner.y, 90, 'rgba(236,72,153,0.5)'));
        const candidates = [this.world.player, ...this.world.bots].filter(b => b && b !== owner && b.hp > 0);
        candidates.forEach(t => {
          if (Math.hypot(t.x - owner.x, t.y - owner.y) < 100) {
            t.takeDamage(owner.getDamage() * 1.1, owner.name, this.world);
            // Pushback
            let pushAngle = Math.atan2(t.y - owner.y, t.x - owner.x);
            t.x += Math.cos(pushAngle) * 90;
            t.y += Math.sin(pushAngle) * 90;
            t.x = Math.max(t.radius, Math.min(this.world.WORLD_SIZE - t.radius, t.x));
            t.y = Math.max(t.radius, Math.min(this.world.WORLD_SIZE - t.radius, t.y));
            this.world.floatingTexts.push(new FloatingText(t.x, t.y - 30, "⚾ HOME RUN!", '#f43f5e', 14));
          }
        });
      }
    }
    else if (owner.id === 'surge') {
      if (isSuper) {
        // Jump and upgrade tiers!
        owner.upgradeTier = Math.min(3, owner.upgradeTier + 1);
        owner.attackRange = BRAWLER_TEMPLATES['surge'].attackRange * (1 + owner.upgradeTier * 0.1);
        owner.speed = BRAWLER_TEMPLATES['surge'].speed * (1 + owner.upgradeTier * 0.08) * 0.58;
        
        // Spawn smash wave
        this.world.particles.push(new CircleSlashParticle(owner.x, owner.y, 110, 'rgba(244,63,94,0.7)'));
        const candidates = [this.world.player, ...this.world.bots].filter(b => b && b !== owner && b.hp > 0);
        candidates.forEach(t => {
          if (Math.hypot(t.x - owner.x, t.y - owner.y) < 120) {
            t.takeDamage(1000, owner.name + " (Upgrade Smash)", this.world);
            let pushAngle = Math.atan2(t.y - owner.y, t.x - owner.x);
            t.x += Math.cos(pushAngle) * 60; t.y += Math.sin(pushAngle) * 60;
          }
        });
        this.world.floatingTexts.push(new FloatingText(owner.x, owner.y - 45, `⚡ SURGE UPGRADED: TIER ${owner.upgradeTier}!`, '#fbbf24', 18));
      } else {
        // Juiceshot splitting
        let proj = new Projectile(owner.x, owner.y, angle, owner.bulletSpeed, Math.floor(owner.getDamage() * 0.9), owner.attackRange, owner, 7, false, false);
        proj.isJuiceShot = true;
        this.world.projectiles.push(proj);
      }
    }
    else if (owner.id === 'fang') {
      if (isSuper) {
        // Heavy flying chain kick!
        owner.isFangDashing = true;
        owner.fangChainCount = 0;
        owner.fangDashTarget = { x: owner.x + Math.cos(angle) * 350, y: owner.y + Math.sin(angle) * 350 };
        this.world.floatingTexts.push(new FloatingText(owner.x, owner.y - 40, "👟 SNEAKY KICK DASH!", '#3b82f6', 18));
      } else {
        // Kick shoe with splitting sneaker kick projectile if it reaches max range
        let proj = new Projectile(owner.x, owner.y, angle, owner.bulletSpeed, Math.floor(owner.getDamage() * 0.8), owner.attackRange * 0.6, owner, 6, false, false);
        proj.isSneakerKick = true;
        this.world.projectiles.push(proj);
      }
    }
    else if (owner.id === 'kit') {
      if (isSuper) {
        // Kit leaps onto a target: healing friends, stunning enemies
        owner.isJumping = true; owner.jumpElapsed = 0; owner.jumpStartX = owner.x; owner.jumpStartY = owner.y;
        owner.jumpDuration = 700;
        owner.jumpTargetX = Math.max(50, Math.min(this.world.WORLD_SIZE - 50, owner.x + Math.cos(angle) * 200));
        owner.jumpTargetY = Math.max(50, Math.min(this.world.WORLD_SIZE - 50, owner.y + Math.sin(angle) * 200));
        owner.kitSeekingAttachment = true;
      } else {
        // Scratch / Throw Yarn Balls
        if (owner.attachedTarget) {
          // Throw yarn ball from teammate
          let proj = new Projectile(owner.x, owner.y, angle, owner.bulletSpeed * 0.8, Math.floor(owner.getDamage() * 1.3), owner.attackRange * 1.5, owner, 12, false, false);
          proj.isYarnBall = true;
          this.world.projectiles.push(proj);
        } else {
          // Fast scratch sweep
          this.world.particles.push(new CircleSlashParticle(owner.x + Math.cos(angle)*15, owner.y + Math.sin(angle)*15, 55, 'rgba(251,191,36,0.5)'));
          const candidates = [this.world.player, ...this.world.bots].filter(b => b && b !== owner && b.hp > 0);
          candidates.forEach(t => {
            if (Math.hypot(t.x - owner.x, t.y - owner.y) < 65) {
              t.takeDamage(owner.getDamage(), owner.name, this.world);
            }
          });
        }
      }
    }
    else if (owner.id === 'bull') {
      if (isSuper) {
        let chargeDist = 450;
        let tx = owner.x + Math.cos(angle) * chargeDist;
        let ty = owner.y + Math.sin(angle) * chargeDist;
        tx = Math.max(50, Math.min(this.world.WORLD_SIZE - 50, tx));
        ty = Math.max(50, Math.min(this.world.WORLD_SIZE - 50, ty));
        
        let steps = 15;
        for (let i = 0; i <= steps; i++) {
          let t = i / steps;
          let px = owner.x + (tx - owner.x) * t;
          let py = owner.y + (ty - owner.y) * t;
          this.world.particles.push(new Particle(px, py, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, '#fbbf24', 3.5, 20));
          
          for (let j = this.world.obstacles.length - 1; j >= 0; j--) {
            let obs = this.world.obstacles[j];
            if (Math.hypot(px - obs.x, py - obs.y) < owner.radius + obs.radius) {
              this.world.obstacles.splice(j, 1);
              this.playSound('break_box');
            }
          }
          
          const hitEnemies = [this.world.player, ...this.world.bots].filter(b => b && b !== owner && b.hp > 0 && Math.hypot(px - b.x, py - b.y) < owner.radius + b.radius);
          hitEnemies.forEach(e => {
            e.takeDamage(owner.getDamage() * 1.5, owner.name, this.world);
            let pushAngle = Math.atan2(e.y - owner.y, e.x - owner.x);
            e.x += Math.cos(pushAngle) * 80;
            e.y += Math.sin(pushAngle) * 80;
          });
        }
        owner.x = tx;
        owner.y = ty;
        this.playSound('super');
      } else {
        [-0.25, -0.12, 0, 0.12, 0.25].forEach(o => {
          this.world.projectiles.push(new Projectile(owner.x, owner.y, angle + o, owner.bulletSpeed, Math.floor(owner.getDamage() / 3), owner.attackRange, owner, 6, false, false));
        });
      }
    }
    else if (owner.id === 'brock') {
      if (isSuper) {
        this.playSound('super');
        for (let i = 0; i < 9; i++) {
          setTimeout(() => {
            if (!this.isRunning || owner.hp <= 0) return;
            let rAngle = angle + ((owner.random ? owner.random.next() : Math.random()) - 0.5) * 0.4;
            let rDist = (owner.attackRange * 0.8) + ((owner.random ? owner.random.next() : Math.random()) - 0.5) * 150;
            let tx = owner.x + Math.cos(rAngle) * rDist;
            let ty = owner.y + Math.sin(rAngle) * rDist;
            
            let rocket = new Projectile(owner.x, owner.y, rAngle, owner.bulletSpeed * 0.7, owner.getDamage() * 1.2, rDist, owner, 14, false, false, true);
            rocket.isBrockRocket = true;
            rocket.lobTargetX = tx;
            rocket.lobTargetY = ty;
            rocket.lobElapsed = 0;
            rocket.lobDuration = 600;
            this.world.projectiles.push(rocket);
          }, i * 140);
        }
      } else {
        let rocket = new Projectile(owner.x, owner.y, angle, owner.bulletSpeed * 1.25, owner.getDamage(), owner.attackRange * 1.1, owner, 10, false, false);
        rocket.isBrockRocket = true;
        this.world.projectiles.push(rocket);
      }
    }
    else if (owner.id === 'barley') {
      if (isSuper) {
        this.playSound('super');
        for (let i = 0; i < 5; i++) {
          let bAngle = angle + (i - 2) * 0.22;
          let bDist = owner.attackRange;
          let tx = owner.x + Math.cos(bAngle) * bDist;
          let ty = owner.y + Math.sin(bAngle) * bDist;
          
          let bottle = new Projectile(owner.x, owner.y, bAngle, 0, Math.floor(owner.getDamage() * 0.8), bDist, owner, 12, false, false, true);
          bottle.isBarleyBottle = true;
          bottle.lobTargetX = tx;
          bottle.lobTargetY = ty;
          bottle.lobElapsed = 0;
          bottle.lobDuration = 600 + (owner.random ? owner.random.next() : Math.random()) * 200;
          this.world.projectiles.push(bottle);
        }
      } else {
        let bDist = owner.attackRange;
        let tx = owner.x + Math.cos(angle) * bDist;
        let ty = owner.y + Math.sin(angle) * bDist;
        
        let bottle = new Projectile(owner.x, owner.y, angle, 0, owner.getDamage(), bDist, owner, 10, false, false);
        bottle.isBarleyBottle = true;
        bottle.lobTargetX = tx;
        bottle.lobTargetY = ty;
        bottle.lobElapsed = 0;
        bottle.lobDuration = 550;
        this.world.projectiles.push(bottle);
      }
    }
    else if (owner.id === 'nita') {
      if (isSuper) {
        this.playSound('super');
        let bearX = owner.x + Math.cos(angle) * 70;
        let bearY = owner.y + Math.sin(angle) * 70;
        const bearTemplate: any = {
          id: 'bruce',
          name: 'Bruce Bear 🐻',
          hp: owner.maxHp * 1.2,
          damage: owner.getDamage() * 0.5,
          speed: 3.8,
          attackRange: 80,
          reloadTime: 1000,
          bulletSpeed: 3,
          type: 'melee',
          description: 'Nita\'s summonable bear helper.',
          rarity: 'common'
        };
        let bruce = new Character(bearX, bearY, bearTemplate, true, 'Bruce Bear 🐻', 'default', owner.random ? Math.floor(owner.random.range(1, 1000000)) : 12345);
        bruce.isBot = true;
        if (owner.selectedStarPower === 'hyper_bear') {
          bruce.attackCooldown = 300;
        }
        bruce.aiState = 'wander';
        this.world.bots.push(bruce);
        this.world.floatingTexts.push(new FloatingText(owner.x, owner.y - 30, "🐻 BRUCE SUMMONED!", '#ca8a04', 18));
      } else {
        let wave = new Projectile(owner.x, owner.y, angle, owner.bulletSpeed * 1.1, owner.getDamage(), owner.attackRange, owner, 18, false, true);
        this.world.projectiles.push(wave);
      }
    }
    else if (owner.id === 'bo') {
      if (isSuper) {
        this.playSound('super');
        [-0.3, 0, 0.3].forEach(offset => {
          let mineAngle = angle + offset;
          let mDist = 180;
          let tx = owner.x + Math.cos(mineAngle) * mDist;
          let ty = owner.y + Math.sin(mineAngle) * mDist;
          
          let mine = new Projectile(owner.x, owner.y, mineAngle, 0, Math.floor(owner.getDamage() * 1.4), mDist, owner, 12, false, false, true);
          mine.isBoMine = true;
          mine.lobTargetX = tx;
          mine.lobTargetY = ty;
          mine.lobElapsed = 0;
          mine.lobDuration = 600;
          this.world.projectiles.push(mine);
        });
      } else {
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            if (!this.isRunning || owner.hp <= 0) return;
            let arrowAngle = angle + (i - 1) * 0.08;
            let arrow = new Projectile(owner.x, owner.y, arrowAngle, owner.bulletSpeed * 1.1, Math.floor(owner.getDamage() / 3), owner.attackRange, owner, 8, false, false);
            this.world.projectiles.push(arrow);
          }, i * 150);
        }
      }
    }
    else if (owner.id === 'jessie') {
      if (isSuper) {
        this.playSound('super');
        let turretX = owner.x + Math.cos(angle) * 70;
        let turretY = owner.y + Math.sin(angle) * 70;
        const scrappyTemplate: any = {
          id: 'scrappy',
          name: 'Scrappy Turret 🤖',
          hp: owner.maxHp * 0.8,
          damage: owner.getDamage() * 0.25,
          speed: 0,
          attackRange: 320,
          reloadTime: 1000,
          bulletSpeed: 11,
          type: 'turret',
          description: 'Jessie\'s summonable turret helper.',
          rarity: 'common'
        };
        let scrappy = new Character(turretX, turretY, scrappyTemplate, true, 'Scrappy Turret 🤖', 'default', owner.random ? Math.floor(owner.random.range(1, 1000000)) : 12345);
        scrappy.isBot = true;
        scrappy.aiState = 'wander';
        this.world.bots.push(scrappy);
        this.world.floatingTexts.push(new FloatingText(owner.x, owner.y - 30, "🤖 SCRAPPY DEPLOYED!", '#38bdf8', 18));
      } else {
        let orb = new Projectile(owner.x, owner.y, angle, owner.bulletSpeed, owner.getDamage(), owner.attackRange, owner, 10, false, false);
        orb.isJessieOrb = true;
        this.world.projectiles.push(orb);
      }
    }
    else if (owner.id === 'emz') {
      if (isSuper) {
        this.playSound('super');
        (owner as any).emzSuperZoneTimer = 5000;
        this.world.floatingTexts.push(new FloatingText(owner.x, owner.y - 30, "💅 OUT OF MY WAY!", '#c084fc', 20));
      } else {
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            if (!this.isRunning || owner.hp <= 0) return;
            let cloudAngle = angle + ((owner.random ? owner.random.next() : Math.random()) - 0.5) * 0.15;
            let cloud = new Projectile(owner.x, owner.y, cloudAngle, owner.bulletSpeed * 0.6, Math.floor(owner.getDamage() / 3), owner.attackRange * 0.8, owner, 22, false, true);
            this.world.projectiles.push(cloud);
          }, i * 120);
        }
      }
    }
    else if (owner.id === 'rico') {
      if (isSuper) {
        this.playSound('super');
        for (let i = 0; i < 12; i++) {
          setTimeout(() => {
            if (!this.isRunning || owner.hp <= 0) return;
            let rAngle = angle + ((owner.random ? owner.random.next() : Math.random()) - 0.5) * 0.05;
            let ball = new Projectile(owner.x, owner.y, rAngle, owner.bulletSpeed * 1.4, Math.floor(owner.getDamage() * 0.8), owner.attackRange * 1.6, owner, 7, false, false, true, true);
            ball.isRicoBall = true;
            this.world.projectiles.push(ball);
          }, i * 40);
        }
      } else {
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            if (!this.isRunning || owner.hp <= 0) return;
            let ball = new Projectile(owner.x, owner.y, angle, owner.bulletSpeed * 1.15, Math.floor(owner.getDamage() / 5), owner.attackRange * 1.15, owner, 6, false, false, false, true);
            ball.isRicoBall = true;
            this.world.projectiles.push(ball);
          }, i * 95);
        }
      }
    }
    else if (owner.id === 'darryl') {
      if (isSuper) {
        this.playSound('super');
        let rollDist = 450;
        let rollAngle = angle;
        let tx = owner.x + Math.cos(rollAngle) * rollDist;
        let ty = owner.y + Math.sin(rollAngle) * rollDist;
        tx = Math.max(50, Math.min(this.world.WORLD_SIZE - 50, tx));
        ty = Math.max(50, Math.min(this.world.WORLD_SIZE - 50, ty));
        
        let steps = 18;
        for (let i = 0; i <= steps; i++) {
          let t = i / steps;
          let px = owner.x + (tx - owner.x) * t;
          let py = owner.y + (ty - owner.y) * t;
          this.world.particles.push(new Particle(px, py, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, '#78350f', 3, 15));
        }
        owner.x = tx;
        owner.y = ty;
        
        if (owner.selectedStarPower === 'rolling_reload') {
          owner.reloadTimer = 0;
        }
      } else {
        for (let i = 0; i < 2; i++) {
          setTimeout(() => {
            if (!this.isRunning || owner.hp <= 0) return;
            [-0.2, -0.07, 0.07, 0.2].forEach(o => {
              this.world.projectiles.push(new Projectile(owner.x, owner.y, angle + o, owner.bulletSpeed, Math.floor(owner.getDamage() / 8), owner.attackRange * 0.9, owner, 6, false, false));
            });
          }, i * 150);
        }
      }
    }
    else if (owner.id === 'gene') {
      if (isSuper) {
        this.playSound('super');
        let hand = new Projectile(owner.x, owner.y, angle, owner.bulletSpeed * 1.4, 100, owner.attackRange * 1.3, owner, 16, false, false, true);
        hand.isGeneHand = true;
        this.world.projectiles.push(hand);
      } else {
        let ball = new Projectile(owner.x, owner.y, angle, owner.bulletSpeed * 1.1, owner.getDamage(), owner.attackRange, owner, 11, false, false);
        (ball as any).isGeneSmokeBall = true;
        this.world.projectiles.push(ball);
      }
    }
  }

  // --- INITIALIZE SHOWDOWN ARENA MAP ---
  private initWorld() {
    const originalRandom = Math.random;
    const createRandom = (s: number) => {
      return () => {
        let t = s += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };
    if (this.seed !== null) {
      Math.random = createRandom(this.seed);
    }

    const SPAWN_POINTS = [
      { x: 150, y: 150 },
      { x: 2850, y: 2850 },
      { x: 2850, y: 150 },
      { x: 150, y: 2850 },
      { x: 1500, y: 150 },
      { x: 1500, y: 2850 },
      { x: 150, y: 1500 },
      { x: 2850, y: 1500 },
      { x: 800, y: 800 },
      { x: 2200, y: 2200 }
    ];

    const isTDM = this.gameMode === 'tdm';
    this.world = {
      player: null,
      bots: [],
      powerBoxes: [],
      powerCubes: [],
      projectiles: [],
      bushes: [],
      obstacles: [],
      floatingTexts: [],
      particles: [],
      bossRobot: null,
      healingZones: [],
      activeMeteors: [],
      energyDrinks: [],
      jumpPads: [],
      mysteryBoxes: [],
      toxicGasRadius: isTDM ? 999999 : 3000,
      targetGasRadius: isTDM ? 999999 : 3000,
      WORLD_SIZE: 3000,
      triggerScreenShake: (amount) => { this.screenShakeAmt = amount; },
      playSound: (type) => { this.playSound(type); },
      playerStats: { damageDealt: 0, cubesCollected: 0, shotsFired: 0, shotsHit: 0 },
      addKillFeed: (attacker, victim, isGas) => { this.addKillFeedItem(attacker, victim, isGas); },
      lowerGraphics: !!this.socket,
      random: this.seed !== null ? new SeededRandom(this.seed) : undefined,
      gameMode: this.gameMode,
      blueScore: 0,
      redScore: 0,
      tdmTimer: 90000
    };

    // 1. Spawning player
    let roleIndex = 0;
    if (this.myRole) {
      const numStr = this.myRole.replace('player', '').replace('p', '');
      roleIndex = (parseInt(numStr) - 1) || 0;
    }
    const mySpawn = SPAWN_POINTS[roleIndex] || SPAWN_POINTS[0];
    let px = mySpawn.x;
    let py = mySpawn.y;

    const pTemplate = BRAWLER_TEMPLATES[this.brawlerId];
    this.world.player = new Character(px, py, pTemplate, false, "Player", this.skinId, this.seed !== null ? this.seed : 12345);
    this.world.player.team = this.gameMode === 'tdm' ? 'blue' : null;
    this.world.player.starPowerUnlocked = this.selectedStarPower !== '';
    this.world.player.hyperUnlocked = this.hyperchargeUnlocked;
    this.world.player.selectedGadget = this.selectedGadget;
    this.world.player.selectedStarPower = this.selectedStarPower;
    this.world.player.selectedGears = this.selectedGears;

    // Apply level stats to player
    const multiplier = 1 + (this.brawlerLevel - 1) * 0.05;
    this.world.player.maxHp = Math.floor(pTemplate.hp * multiplier);
    this.world.player.hp = this.world.player.maxHp;
    this.world.player.damage = Math.floor(pTemplate.damage * multiplier * 0.45);
    
    // Apply loadout features (Speed, Shield, etc.)
    this.world.player.applyLoadout();

    // Clear and spawn all human opponents
    this.opponentsMap.clear();
    const occupiedSpawnIndexes = new Set<number>();
    occupiedSpawnIndexes.add(roleIndex);

    if (this.opponentsInfo && this.opponentsInfo.length > 0) {
      this.opponentsInfo.forEach(opInfo => {
        const opTemplate = BRAWLER_TEMPLATES[opInfo.brawlerId];
        if (opTemplate) {
          const opRoleNum = opInfo.role.replace('player', '').replace('p', '');
          const opRoleIndex = (parseInt(opRoleNum) - 1) || 0;
          occupiedSpawnIndexes.add(opRoleIndex);
          const opSpawn = SPAWN_POINTS[opRoleIndex] || SPAWN_POINTS[1];

          const opponentCharacter = new Character(
            opSpawn.x,
            opSpawn.y,
            opTemplate,
            false, // Is not a bot!
            opInfo.username || "Opponent",
            opInfo.skinId || "default",
            this.seed !== null ? this.seed : 12345
          );
          opponentCharacter.isOpponent = true;
          opponentCharacter.opponentRole = opInfo.role;
          opponentCharacter.starPowerUnlocked = opInfo.starPower !== '';
          opponentCharacter.hyperUnlocked = opInfo.hypercharge;
          opponentCharacter.selectedGadget = opInfo.gadget;
          opponentCharacter.selectedStarPower = opInfo.starPower;
          opponentCharacter.selectedGears = opInfo.gears;

          const opMultiplier = 1 + (opInfo.level - 1) * 0.05;
          opponentCharacter.maxHp = Math.floor(opTemplate.hp * opMultiplier);
          opponentCharacter.hp = opponentCharacter.maxHp;
          opponentCharacter.damage = Math.floor(opTemplate.damage * opMultiplier * 0.45);
          opponentCharacter.applyLoadout();

          this.opponentsMap.set(opInfo.role, opponentCharacter);
          this.world.bots.push(opponentCharacter);
        }
      });
    }

    // 2. Populate the remaining slots to reach exactly 10 players in match
    const ids = Object.keys(BRAWLER_TEMPLATES);
    const botNames = ["Bull", "Crow", "Leon", "Spike", "Colt", "Kenji", "Surge", "Fang", "Kit", "Bibi", "Edgar", "Shelly", "Gale", "Mico", "Charlie"];
    
    let botIndex = 0;
    for (let i = 0; i < 10; i++) {
      if (occupiedSpawnIndexes.has(i)) continue;

      const spawnPt = SPAWN_POINTS[i];
      let rId = ids[Math.floor(Math.random() * ids.length)];
      let template = BRAWLER_TEMPLATES[rId];
      
      const botCharacter = new Character(spawnPt.x, spawnPt.y, template, true, botNames[botIndex % botNames.length], 'default', this.seed !== null ? this.seed : 12345);
      botCharacter.team = this.gameMode === 'tdm' ? ([0, 3, 4, 6, 8].includes(i) ? 'blue' : 'red') : null;
      botCharacter.starPowerUnlocked = true;
      botCharacter.hyperUnlocked = true;
      
      const loadout = BRAWLER_LOADOUTS[rId];
      if (loadout) {
        if (loadout.gadgets.length > 0) {
          botCharacter.selectedGadget = loadout.gadgets[Math.floor(Math.random() * loadout.gadgets.length)].id;
        }
        if (loadout.starPowers.length > 0) {
          botCharacter.selectedStarPower = loadout.starPowers[Math.floor(Math.random() * loadout.starPowers.length)].id;
        }
      }
      
      // Give random gear
      const numGears = Math.floor(Math.random() * 2) + 1;
      const shuffledGears = [...UNIVERSAL_GEARS].sort(() => 0.5 - Math.random());
      botCharacter.selectedGears = shuffledGears.slice(0, numGears).map(g => g.id);
      
      botCharacter.applyLoadout();
      
      this.world.bots.push(botCharacter);
      botIndex++;
    }

    // 3. Spawning layout elements based on activeMap / mapName
    if (this.mapName === 'Feast or Famine') {
      // Feast or Famine has a massive central block of bushes containing a high concentration of boxes
      const WORLD_SIZE = this.world.WORLD_SIZE;
      const mid = WORLD_SIZE / 2;
      const centerBushRadius = 450; // Bigger center bush radius!
      for (let angle = 0; angle < Math.PI * 2; angle += 0.08) {
        for (let r = 30; r < centerBushRadius; r += 38) {
          let x = mid + Math.cos(angle) * r + (Math.random() - 0.5) * 15;
          let y = mid + Math.sin(angle) * r + (Math.random() - 0.5) * 15;
          this.world.bushes.push(new Bush(x, y, this.mapName));
        }
      }

      // 28 central power boxes clustered in the bushes
      for (let i = 0; i < 28; i++) {
        let r = 50 + Math.random() * 250;
        let a = Math.random() * Math.PI * 2;
        let x = mid + Math.cos(a) * r;
        let y = mid + Math.sin(a) * r;
        this.world.powerBoxes.push(new PowerBox(x, y));
      }

      // Outer rings of obstacles: few scattered walls
      for (let i = 0; i < 20; i++) {
        let cx = 200 + Math.random() * (WORLD_SIZE - 400);
        let cy = 200 + Math.random() * (WORLD_SIZE - 400);
        if (Math.hypot(cx - mid, cy - mid) > centerBushRadius + 80) {
          const size = Math.floor(Math.random() * 2) + 2;
          for (let j = 0; j < size; j++) {
            let x = cx + (j - size/2) * 45;
            let y = cy;
            if (x > 50 && x < WORLD_SIZE - 50 && y > 50 && y < WORLD_SIZE - 50) {
              this.world.obstacles.push(new Obstacle(x, y, this.mapName));
            }
          }
        }
      }

      // Spawning outer power boxes (fewer, scattered)
      for (let i = 0; i < 24; i++) {
        let x = 100 + Math.random() * (WORLD_SIZE - 200);
        let y = 100 + Math.random() * (WORLD_SIZE - 200);
        if (Math.hypot(x - mid, y - mid) > centerBushRadius + 100) {
          this.world.powerBoxes.push(new PowerBox(x, y));
        }
      }

    } else if (this.mapName === 'Cavern Churn') {
      // Cavern Churn has thick blocks of walls on the sides, with a massive central ring of bushes
      const WORLD_SIZE = this.world.WORLD_SIZE;
      const mid = WORLD_SIZE / 2;
      for (let y = 150; y < WORLD_SIZE - 150; y += 45) {
        for (let x = mid - 300; x <= mid + 300; x += 45) {
          if (Math.random() < 0.85) {
            this.world.bushes.push(new Bush(x + (Math.random()-0.5)*15, y + (Math.random()-0.5)*15, this.mapName));
          }
        }
      }

      // Add wall clusters on left and right wings (creating dense caverns)
      const wings = [WORLD_SIZE * 0.15, WORLD_SIZE * 0.25, WORLD_SIZE * 0.75, WORLD_SIZE * 0.85];
      wings.forEach(cx => {
        for (let cy = 200; cy < WORLD_SIZE - 200; cy += 180) {
          const size = 3;
          for (let j = 0; j < size; j++) {
            let x = cx + (Math.random() - 0.5) * 40;
            let y = cy + j * 45;
            if (x > 50 && x < WORLD_SIZE - 50 && y > 50 && y < WORLD_SIZE - 50) {
              if (Math.hypot(x - mid, y - mid) > 200) {
                this.world.obstacles.push(new Obstacle(x, y, this.mapName));
              }
            }
          }
        }
      });

      // Power boxes: scattered along the vertical center corridor
      for (let i = 0; i < 30; i++) {
        let x = mid - 200 + Math.random() * 400;
        let y = 200 + Math.random() * (WORLD_SIZE - 400);
        this.world.powerBoxes.push(new PowerBox(x, y));
      }

      // Add other scattered boxes in cavern pockets
      for (let i = 0; i < 28; i++) {
        let x = (Math.random() < 0.5 ? 150 + Math.random() * (WORLD_SIZE * 0.2) : (WORLD_SIZE * 0.7) + Math.random() * (WORLD_SIZE * 0.2));
        let y = 150 + Math.random() * (WORLD_SIZE - 300);
        this.world.powerBoxes.push(new PowerBox(x, y));
      }

    } else if (this.mapName === 'Double Trouble') {
      // Double Trouble has symmetrical double-line wall structures
      const WORLD_SIZE = this.world.WORLD_SIZE;
      const mid = WORLD_SIZE / 2;
      const centers = [
        { cx: WORLD_SIZE * 0.23, cy: WORLD_SIZE * 0.23 },
        { cx: WORLD_SIZE * 0.77, cy: WORLD_SIZE * 0.23 },
        { cx: WORLD_SIZE * 0.23, cy: WORLD_SIZE * 0.77 },
        { cx: WORLD_SIZE * 0.77, cy: WORLD_SIZE * 0.77 },
        { cx: mid, cy: WORLD_SIZE * 0.23 },
        { cx: mid, cy: WORLD_SIZE * 0.77 },
      ];

      centers.forEach(({ cx, cy }) => {
        for (let j = 0; j < 6; j++) {
          let x1 = cx - 75 + j * 30;
          let y1 = cy - 75;
          let x2 = cx - 75 + j * 30;
          let y2 = cy + 75;
          this.world.obstacles.push(new Obstacle(x1, y1, this.mapName));
          this.world.obstacles.push(new Obstacle(x2, y2, this.mapName));
        }

        for (let b = 0; b < 10; b++) {
          this.world.bushes.push(new Bush(cx + (Math.random()-0.5)*250, cy + 110 + (Math.random()-0.5)*40, this.mapName));
          this.world.bushes.push(new Bush(cx + (Math.random()-0.5)*250, cy - 110 + (Math.random()-0.5)*40, this.mapName));
        }
      });

      // Scatter power boxes across quadrants symmetrically
      const boxPoints = [
        { x: WORLD_SIZE * 0.13, y: WORLD_SIZE * 0.13 }, { x: WORLD_SIZE * 0.13, y: mid }, { x: WORLD_SIZE * 0.13, y: WORLD_SIZE * 0.87 },
        { x: WORLD_SIZE * 0.87, y: WORLD_SIZE * 0.13 }, { x: WORLD_SIZE * 0.87, y: mid }, { x: WORLD_SIZE * 0.87, y: WORLD_SIZE * 0.87 },
        { x: mid, y: WORLD_SIZE * 0.33 }, { x: mid, y: WORLD_SIZE * 0.67 },
        { x: WORLD_SIZE * 0.33, y: mid }, { x: WORLD_SIZE * 0.67, y: mid }
      ];

      boxPoints.forEach(p => {
        this.world.powerBoxes.push(new PowerBox(p.x, p.y));
        this.world.powerBoxes.push(new PowerBox(p.x + (Math.random() - 0.5) * 60, p.y + (Math.random() - 0.5) * 60));
      });

      for (let i = 0; i < 20; i++) {
        let x = 100 + Math.random() * (WORLD_SIZE - 200);
        let y = 100 + Math.random() * (WORLD_SIZE - 200);
        this.world.powerBoxes.push(new PowerBox(x, y));
      }

    } else {
      // Default / "Classic Showdown"
      const WORLD_SIZE = this.world.WORLD_SIZE;
      const mid = WORLD_SIZE / 2;
      for (let i = 0; i < 36; i++) {
        let cx = 200 + Math.random() * (WORLD_SIZE - 400);
        let cy = 200 + Math.random() * (WORLD_SIZE - 400);
        const size = Math.floor(Math.random() * 3) + 2;
        for (let j = 0; j < size; j++) {
          let x = cx + (j - size/2) * 45;
          let y = cy + (Math.sin(j) * 15);
          if (x > 50 && x < WORLD_SIZE - 50 && y > 50 && y < WORLD_SIZE - 50) {
            this.world.obstacles.push(new Obstacle(x, y, this.mapName));
          }
        }
      }

      for (let i = 0; i < 28; i++) {
        let cx = 150 + Math.random() * (WORLD_SIZE - 300);
        let cy = 150 + Math.random() * (WORLD_SIZE - 300);
        const count = Math.floor(Math.random() * 4) + 4;
        for (let j = 0; j < count; j++) {
          let x = cx + (Math.random() - 0.5) * 80;
          let y = cy + (Math.random() - 0.5) * 80;
          if (x > 50 && x < WORLD_SIZE - 50 && y > 50 && y < WORLD_SIZE - 50) {
            this.world.bushes.push(new Bush(x, y, this.mapName));
          }
        }
      }

      for (let i = 0; i < 60; i++) {
        let x = 100 + Math.random() * (WORLD_SIZE - 200);
        let y = 100 + Math.random() * (WORLD_SIZE - 200);
        let tooClose = this.world.obstacles.some(o => Math.hypot(o.x - x, o.y - y) < 40);
        if (!tooClose) {
          this.world.powerBoxes.push(new PowerBox(x, y));
        }
      }

      for (let i = 0; i < 12; i++) {
        let a = (i / 12) * Math.PI * 2;
        let x = mid + Math.cos(a) * 120;
        let y = mid + Math.sin(a) * 120;
        this.world.powerBoxes.push(new PowerBox(x, y));
      }
    }

    // 7. Spawning jump pads
    const WORLD_SIZE = this.world.WORLD_SIZE;
    this.world.jumpPads.push(new JumpPad(WORLD_SIZE * 0.2, WORLD_SIZE * 0.2, 0)); // Pad facing right
    this.world.jumpPads.push(new JumpPad(WORLD_SIZE * 0.8, WORLD_SIZE * 0.2, Math.PI)); // Pad facing left
    this.world.jumpPads.push(new JumpPad(WORLD_SIZE * 0.2, WORLD_SIZE * 0.8, -Math.PI / 2)); // Pad facing up
    this.world.jumpPads.push(new JumpPad(WORLD_SIZE * 0.8, WORLD_SIZE * 0.8, Math.PI / 2)); // Pad facing down

    // 8. Mystery box
    this.world.mysteryBoxes.push(new MysteryBox(WORLD_SIZE * 0.33, WORLD_SIZE * 0.33));
    this.world.mysteryBoxes.push(new MysteryBox(WORLD_SIZE * 0.67, WORLD_SIZE * 0.67));

    if (this.seed !== null) {
      Math.random = originalRandom;
    }
  }

  // --- RENDERING METAS ---
  private screenShakeAmt: number = 0;
  private wasPlayerGasDamagedRecently: number = 0;
  private killFeed: { attacker: string; victim: string; isGas?: boolean; time: number }[] = [];

  private addKillFeedItem(attacker: string, victim: string, isGas?: boolean) {
    this.killFeed.push({ attacker, victim, isGas, time: Date.now() });
    if (this.killFeed.length > 5) this.killFeed.shift();

    if (attacker === "Player" || attacker === this.world.player?.name) {
      this.killCount++;
    }
  }

  // --- START THE CANVAS MATCH GAME RUN ---
  public start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  public stop() {
    this.isRunning = false;
    this.unregisterControls();
  }

  private loop = (now: number) => {
    if (!this.isRunning) return;
    let dt = now - this.lastTime;
    if (dt > 100) dt = 16.6; // Cap delta time spike
    this.lastTime = now;

    this.update(dt);
    this.draw();

    // Broadcast our position & status to the multiplayer socket
    const player = this.world?.player;
    if (player && this.socket && this.socket.readyState === WebSocket.OPEN && Date.now() - this.lastSyncTime > 40) {
      this.lastSyncTime = Date.now();
      this.socket.send(JSON.stringify({
        type: 'sync_state',
        role: this.myRole,
        x: player.x,
        y: player.y,
        hp: player.hp,
        maxHp: player.maxHp,
        cubes: player.powerCubes,
        angle: player.facingAngle,
        isMoving: player.isMoving,
        hypercharged: player.hyperActiveTimer > 0,
        activeEmote: player.activeEmote,
        activeEmoteTimer: player.activeEmoteTimer
      }));
    }

    // Host bot states synchronization (once every 1000ms)
    if (this.world && (this.myRole === 'p1' || this.myRole === 'player1') && this.socket && this.socket.readyState === WebSocket.OPEN && Date.now() - this.lastBotSyncTime > 1000) {
      this.lastBotSyncTime = Date.now();
      const botsData = this.world.bots.filter(b => !b.isOpponent).map(b => ({
        name: b.name,
        x: b.x,
        y: b.y,
        hp: b.hp,
        maxHp: b.maxHp,
        powerCubes: b.powerCubes,
        facingAngle: b.facingAngle,
        isMoving: b.isMoving,
        aiState: b.aiState
      }));
      this.socket.send(JSON.stringify({
        type: 'sync_bots',
        bots: botsData
      }));
    }

    requestAnimationFrame(this.loop);
  };

  // --- UPDATE ENTITY LOGICS & PHYSICS LOOP ---
  private update(dt: number) {
    const world = this.world;
    const player = world.player;

    if (!player) return;

    // Periodic Meteor summons (Every 12s)
    this.gasShrinkTimer += dt;
    if (this.gasShrinkTimer > 12000) {
      this.gasShrinkTimer = 0;
      // Spawn meteor warning
      const targetChar = [player, ...world.bots][Math.floor(Math.random() * (world.bots.length + 1))];
      if (targetChar && targetChar.hp > 0) {
        world.activeMeteors.push(new MeteorTarget(targetChar.x, targetChar.y));
        this.playSound('hit');
      }

      // Spawning periodic Energy Drink
      if (world.energyDrinks.length < 3) {
        let x = 100 + Math.random() * (world.WORLD_SIZE - 200);
        let y = 100 + Math.random() * (world.WORLD_SIZE - 200);
        world.energyDrinks.push(new EnergyDrink(x, y));
      }
    }

    // Shrinking Toxic Gas Radius towards center
    if (world.toxicGasRadius > 0) {
      world.toxicGasRadius -= 0.12 * (dt / 16.6); // Shrink slowly
    }

    // Update meteors
    for (let i = world.activeMeteors.length - 1; i >= 0; i--) {
      if (world.activeMeteors[i].update(dt, world)) {
        world.activeMeteors.splice(i, 1);
      }
    }

    // Update Particles
    if (world.lowerGraphics && world.particles.length > 15) {
      world.particles.splice(0, world.particles.length - 15);
    }
    for (let i = world.particles.length - 1; i >= 0; i--) {
      world.particles[i].update();
      if (world.particles[i].life <= 0) world.particles.splice(i, 1);
    }

    // Update Floating Text indicators
    for (let i = world.floatingTexts.length - 1; i >= 0; i--) {
      world.floatingTexts[i].update();
      if (world.floatingTexts[i].alpha <= 0) world.floatingTexts.splice(i, 1);
    }

    // Update Projectiles
    for (let i = world.projectiles.length - 1; i >= 0; i--) {
      const proj = world.projectiles[i];
      proj.update(world);
      if (proj.isDefunct) {
        world.projectiles.splice(i, 1);
      }
    }

    // Update player controls inputs
    if (player.hp > 0 && player.stunTimer <= 0 && !player.isJumping) {
      let vx = 0, vy = 0;
      if (this.touchMoveVector.active) {
        vx = this.touchMoveVector.x;
        vy = this.touchMoveVector.y;
      } else {
        if (this.keys['w'] || this.keys['arrowup']) vy = -1;
        if (this.keys['s'] || this.keys['arrowdown']) vy = 1;
        if (this.keys['a'] || this.keys['arrowleft']) vx = -1;
        if (this.keys['d'] || this.keys['arrowright']) vx = 1;
      }

      if (vx !== 0 || vy !== 0) {
        let len = Math.hypot(vx, vy);
        let speed = player.speed * (player.speedBoostTimer > 0 ? 1.40 : 1.0);
        if (player.speedBoostTimer < 0) speed *= 0.5; // Slowed!
        if (player.energyDrinkTimer > 0) speed *= 1.30; // Energy speed!

        let moveX = (vx / len) * speed * (dt / 16.6);
        let moveY = (vy / len) * speed * (dt / 16.6);

        // Pre-flight collision checks against walls
        let targetX = player.x + moveX;
        let targetY = player.y + moveY;

        let collX = false;
        let collY = false;

        world.obstacles.forEach(obs => {
          if (Math.hypot(obs.x - targetX, obs.y - player.y) < player.radius + obs.radius) collX = true;
          if (Math.hypot(obs.x - player.x, obs.y - targetY) < player.radius + obs.radius) collY = true;
        });

        if (!collX) player.x = Math.max(player.radius, Math.min(world.WORLD_SIZE - player.radius, targetX));
        if (!collY) player.y = Math.max(player.radius, Math.min(world.WORLD_SIZE - player.radius, targetY));

        player.isMoving = true;
        
        // Face the aiming direction if currently aiming, otherwise face movement direction
        if (this.touchAimVector.active) {
          player.facingAngle = Math.atan2(this.touchAimVector.y, this.touchAimVector.x);
        } else if (this.mouseAim.active) {
          const px = this.canvas.width / 2;
          const py = this.canvas.height / 2;
          player.facingAngle = Math.atan2(this.mouseAim.y - py, this.mouseAim.x - px);
        } else {
          player.facingAngle = Math.atan2(vy, vx);
        }
      } else {
        player.isMoving = false;
        // Keep facing active touch aim direction even if player is static
        if (this.touchAimVector.active) {
          player.facingAngle = Math.atan2(this.touchAimVector.y, this.touchAimVector.x);
        }
      }
    }

    // Execute character passive ticks (ammo reload, regen, toxic gas taking damages)
    const allCharacters = [player, ...world.bots];
    allCharacters.forEach(char => {
      if (this.isCelebratingVictory && char === player) {
        // Player is immune and celebrating!
        player.facingAngle += 0.12 * (dt / 16.6);
        return;
      }
      if (char.hp <= 0) return;
      
      char.update(dt, world);

      // Check toxic gas exposure
      const distToCenter = Math.hypot(char.x - world.WORLD_SIZE / 2, char.y - world.WORLD_SIZE / 2);
      if (distToCenter > world.toxicGasRadius) {
        // take periodic gas damage
        if (!char.lastGasDmgTick || Date.now() - char.lastGasDmgTick > 1000) {
          char.lastGasDmgTick = Date.now();
          char.takeDamage(600, "Toxic Gas", world);
          world.particles.push(new Particle(char.x, char.y, (Math.random()-0.5)*3, (Math.random()-0.5)*3, '#22c55e', 3.5, 20));
          if (char === player) {
            this.screenShakeAmt = Math.max(this.screenShakeAmt, 15);
            this.wasPlayerGasDamagedRecently = 20;
          }
        }
      }

      // Check Power Cube pickups
      world.powerCubes.forEach((cube, index) => {
        if (Math.hypot(cube.x - char.x, cube.y - char.y) < char.radius + cube.radius) {
          char.powerCubes++;
          char.heal(600, world);
          world.powerCubes.splice(index, 1);
          this.playSound('power_up');
          if (char === player) world.playerStats.cubesCollected++;
        }
      });

      // Check Energy Drink pickups
      world.energyDrinks.forEach((drink, index) => {
        if (Math.hypot(drink.x - char.x, drink.y - char.y) < char.radius + drink.radius) {
          char.energyDrinkTimer = 10000; // 10s buff!
          world.energyDrinks.splice(index, 1);
          this.playSound('power_up');
          world.floatingTexts.push(new FloatingText(char.x, char.y - 45, "⚡ ENERGY BOOST!", '#c084fc', 18));
        }
      });
    });

    // Update Bots AI behavior state machine
    world.bots.forEach(bot => {
      if (bot.hp <= 0 || bot.isJumping || bot.isOpponent) return;

      bot.aiTimer -= dt;
      if (bot.aiTimer <= 0) {
        const randVal = world.random ? world.random.next() : Math.random();
        bot.aiTimer = 600 + randVal * 800;
        // Search candidates
        const candidates = [player, ...world.bots].filter(c => {
          if (!c || c === bot || c.hp <= 0 || isTeammate(c, bot)) return false;
          let dist = Math.hypot(c.x - bot.x, c.y - bot.y);
          // If candidate is in bush, bot can only see if within 140px
          if (c.inBush && dist > 140) return false;
          // If candidate is invisible, bot can only see if within 100px
          if (c.invisibleTimer > 0 && dist > 100) return false;
          return true;
        });
        let nearest: Character | null = null;
        let minDist = Infinity;
        candidates.forEach(c => {
          let d = Math.hypot(c.x - bot.x, c.y - bot.y);
          if (d < minDist) { minDist = d; nearest = c; }
        });

        // Search closest Power Box
        let closestBox: PowerBox | null = null;
        let boxMin = Infinity;
        world.powerBoxes.forEach(box => {
          let d = Math.hypot(box.x - bot.x, box.y - bot.y);
          if (d < boxMin) { d = boxMin; closestBox = box; }
        });

        if (nearest && minDist < 350) {
          bot.aiState = 'attack';
          bot.aiTarget = nearest;
        } else if (closestBox && boxMin < 500) {
          bot.aiState = 'gather';
          bot.aiTarget = closestBox;
        } else {
          bot.aiState = 'wander';
          const randAngleVal = world.random ? world.random.next() : Math.random();
          let angle = randAngleVal * Math.PI * 2;
          bot.aiDir = { x: Math.cos(angle), y: Math.sin(angle) };
        }
      }

      // Execute AI state action
      if (bot.aiState === 'wander' && bot.aiDir) {
        bot.isMoving = true;
        bot.facingAngle = Math.atan2(bot.aiDir.y, bot.aiDir.x);
        
        let targetX = bot.x + bot.aiDir.x * bot.speed * 0.7 * (dt / 16.6);
        let targetY = bot.y + bot.aiDir.y * bot.speed * 0.7 * (dt / 16.6);

        // collision wall checks
        let collX = false; let collY = false;
        world.obstacles.forEach(o => {
          if (Math.hypot(o.x - targetX, o.y - bot.y) < bot.radius + o.radius) collX = true;
          if (Math.hypot(o.x - bot.x, o.y - targetY) < bot.radius + o.radius) collY = true;
        });
        if (!collX) bot.x = Math.max(bot.radius, Math.min(world.WORLD_SIZE - bot.radius, targetX));
        if (!collY) bot.y = Math.max(bot.radius, Math.min(world.WORLD_SIZE - bot.radius, targetY));

      } else if (bot.aiState === 'gather' && bot.aiTarget) {
        // Move towards Power Box
        let dx = bot.aiTarget.x - bot.x;
        let dy = bot.aiTarget.y - bot.y;
        let dist = Math.hypot(dx, dy);
        
        if (dist > 80) {
          bot.isMoving = true;
          bot.facingAngle = Math.atan2(dy, dx);
          let tx = bot.x + (dx / dist) * bot.speed * (dt / 16.6);
          let ty = bot.y + (dy / dist) * bot.speed * (dt / 16.6);
          bot.x = Math.max(bot.radius, Math.min(world.WORLD_SIZE - bot.radius, tx));
          bot.y = Math.max(bot.radius, Math.min(world.WORLD_SIZE - bot.radius, ty));
        } else {
          bot.isMoving = false;
          // Attack box
          if (bot.ammo >= 1 && Date.now() - bot.lastAttackTime > bot.attackCooldown) {
            bot.lastAttackTime = Date.now();
            this.fireProjectile(bot, Math.atan2(dy, dx), false);
          }
        }
      } else if (bot.aiState === 'attack' && bot.aiTarget && bot.aiTarget.hp > 0) {
        let dx = bot.aiTarget.x - bot.x;
        let dy = bot.aiTarget.y - bot.y;
        let dist = Math.hypot(dx, dy);

        // Check if target is currently hidden (stealth mechanic)
        const isTargetHidden = 
          (bot.aiTarget.inBush && dist > 140) || 
          (bot.aiTarget.invisibleTimer > 0 && dist > 100);

        if (isTargetHidden) {
          // Lose sight of target!
          bot.aiState = 'wander';
          bot.aiTarget = null;
          const randAngleVal = world.random ? world.random.next() : Math.random();
          let angle = randAngleVal * Math.PI * 2;
          bot.aiDir = { x: Math.cos(angle), y: Math.sin(angle) };
          bot.aiTimer = 500; // Recalculate AI soon
        } else {
          bot.facingAngle = Math.atan2(dy, dx);

          if (dist > bot.attackRange * 0.75) {
            // move closer
            bot.isMoving = true;
            let tx = bot.x + (dx / dist) * bot.speed * (dt / 16.6);
            let ty = bot.y + (dy / dist) * bot.speed * (dt / 16.6);
            bot.x = Math.max(bot.radius, Math.min(world.WORLD_SIZE - bot.radius, tx));
            bot.y = Math.max(bot.radius, Math.min(world.WORLD_SIZE - bot.radius, ty));
          } else {
            // strafe and shoot!
            bot.isMoving = true;
            let strafeX = -dy / dist;
            let strafeY = dx / dist;
            let tx = bot.x + strafeX * bot.speed * 0.8 * bot.strafeDir * (dt / 16.6);
            let ty = bot.y + strafeY * bot.speed * 0.8 * bot.strafeDir * (dt / 16.6);
            bot.x = Math.max(bot.radius, Math.min(world.WORLD_SIZE - bot.radius, tx));
            bot.y = Math.max(bot.radius, Math.min(world.WORLD_SIZE - bot.radius, ty));

            if (bot.ammo >= 1 && Date.now() - bot.lastAttackTime > bot.attackCooldown) {
              bot.lastAttackTime = Date.now();
              this.fireProjectile(bot, Math.atan2(dy, dx), false);
            }
          }
        }
      }
    });

    // Check Match Over / Defeat states
    if (this.gameMode === 'tdm') {
      if (world.tdmTimer !== undefined) {
        world.tdmTimer -= dt;
        if (world.tdmTimer < 0) world.tdmTimer = 0;
      }

      const isTimeOver = (world.tdmTimer !== undefined && world.tdmTimer <= 0);
      const blueWon = (world.blueScore || 0) >= 20 || (isTimeOver && (world.blueScore || 0) > (world.redScore || 0));
      const redWon = (world.redScore || 0) >= 20 || (isTimeOver && (world.redScore || 0) > (world.blueScore || 0));
      const isTie = isTimeOver && (world.blueScore === world.redScore);

      if (blueWon) {
        if (!this.isCelebratingVictory) {
          this.isCelebratingVictory = true;
          this.victoryCelebrationStartTime = Date.now();
          this.playSound('power_up');
          this.spawnVictoryFireworksAroundPlayer();
        }

        this.updateVictoryCelebration(dt);

        const celebrationElapsed = Date.now() - this.victoryCelebrationStartTime;
        if (celebrationElapsed >= 5000) {
          this.isRunning = false;
          this.onMatchEnd(1, this.killCount, world.playerStats.damageDealt, world.playerStats.cubesCollected);
        }
      } else if (redWon || isTie) {
        this.isRunning = false;
        const placement = isTie ? 2 : 3;
        this.onMatchEnd(placement, this.killCount, world.playerStats.damageDealt, world.playerStats.cubesCollected);
      }
    } else {
      if (player.hp <= 0) {
        this.isRunning = false;
        const countAlive = world.bots.filter(b => b.hp > 0).length + 1;
        this.onMatchEnd(countAlive, this.killCount, world.playerStats.damageDealt, world.playerStats.cubesCollected);
      } else if (world.bots.length === 0) {
        if (!this.isCelebratingVictory) {
          this.isCelebratingVictory = true;
          this.victoryCelebrationStartTime = Date.now();
          this.playSound('power_up');
          this.spawnVictoryFireworksAroundPlayer();
        }

        this.updateVictoryCelebration(dt);

        const celebrationElapsed = Date.now() - this.victoryCelebrationStartTime;
        if (celebrationElapsed >= 5000) {
          this.isRunning = false;
          this.onMatchEnd(1, this.killCount, world.playerStats.damageDealt, world.playerStats.cubesCollected);
        }
      }
    }
  }

  private spawnCelebrationFirework() {
    const player = this.world.player;
    if (!player) return;
    
    // Target position in world space around player
    const targetX = player.x + (Math.random() - 0.5) * 800;
    const targetY = player.y - 150 + (Math.random() - 0.5) * 350;
    
    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#ef4444', '#22d3ee', '#f43f5e'];
    const burstColor = colors[Math.floor(Math.random() * colors.length)];
    
    const burstCount = 20 + Math.floor(Math.random() * 15);
    for (let i = 0; i < burstCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 6;
      this.victoryFireworks.push({
        x: targetX,
        y: targetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.0,
        color: burstColor,
        age: 0,
        maxAge: 900 + Math.random() * 700,
        r: 3 + Math.random() * 3
      });
    }
    this.playSound('shoot');
  }

  private spawnVictoryFireworksAroundPlayer() {
    const player = this.world.player;
    if (!player) return;
    const colors = ['#f59e0b', '#eab308', '#fbbf24', '#fef08a', '#ec4899', '#8b5cf6', '#10b981', '#ef4444'];
    
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      this.victoryFireworks.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        age: 0,
        maxAge: 1100 + Math.random() * 900,
        r: 4 + Math.random() * 4
      });
    }
  }

  private updateVictoryCelebration(dt: number) {
    if (!this.isCelebratingVictory) return;
    const player = this.world.player;
    if (!player) return;

    // Confetti generation
    if (this.victoryConfetti.length < 180) {
      const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4', '#eab308'];
      this.victoryConfetti.push({
        x: Math.random() * this.canvas.width,
        y: -30 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 4,
        vy: 2.5 + Math.random() * 4.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        r: 5 + Math.random() * 6,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.15
      });
    }

    // Confetti update
    this.victoryConfetti.forEach(c => {
      c.x += c.vx;
      c.y += c.vy;
      c.rotation += c.rotationSpeed;
      if (c.y > this.canvas.height + 20) {
        c.x = Math.random() * this.canvas.width;
        c.y = -20;
        c.vx = (Math.random() - 0.5) * 4;
        c.vy = 2.5 + Math.random() * 4.5;
      }
    });

    // Random fireworks bursts
    if (Math.random() < 0.05) {
      this.spawnCelebrationFirework();
    }

    // Update fireworks physics particles
    for (let i = this.victoryFireworks.length - 1; i >= 0; i--) {
      const fw = this.victoryFireworks[i];
      fw.x += fw.vx;
      fw.y += fw.vy;
      fw.vy += 0.08 * (dt / 16.6); // gravity
      fw.vx *= Math.pow(0.98, dt / 16.6); // drag
      fw.vy *= Math.pow(0.98, dt / 16.6); // drag
      fw.age += dt;
      if (fw.age >= fw.maxAge) {
        this.victoryFireworks.splice(i, 1);
      }
    }

    // Make player character spin in celebration
    player.facingAngle += 0.12 * (dt / 16.6);
    
    // Cycle emotes beautifully above player
    if (!player.activeEmote || player.activeEmoteTimer <= 0) {
      const emotes = ['🏆', '👑', '🎉', '🌟', '🔥', '👍'];
      player.activeEmote = emotes[Math.floor(Math.random() * emotes.length)];
      player.activeEmoteTimer = 1000;
    }
  }

  // --- RENDERING CANVAS WORLD ENGINE DRAW METHOD ---
  private draw() {
    const ctx = this.ctx;
    const world = this.world;
    const player = world.player;

    if (!player) return;

    // Reset Canvas and apply Screen Shake FX
    ctx.save();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.screenShakeAmt > 0) {
      let dx = (Math.random() - 0.5) * this.screenShakeAmt;
      let dy = (Math.random() - 0.5) * this.screenShakeAmt;
      ctx.translate(dx, dy);
      this.screenShakeAmt -= 0.5;
    }

    // Centered camera offset around local player position coordinates
    if (this.isCelebratingVictory) {
      ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
      const elapsed = Date.now() - this.victoryCelebrationStartTime;
      const zoom = 1 + Math.min(0.25, (elapsed / 4000) * 0.25);
      ctx.scale(zoom, zoom);
      ctx.translate(-player.x, -player.y);
    } else {
      const camX = this.canvas.width / 2 - player.x;
      const camY = this.canvas.height / 2 - player.y;
      ctx.translate(camX, camY);
    }

    // 1. Draw Ground Sand Arena Field Grid
    let groundColor = '#f59e0b'; // Sandy gold
    let gridColor = '#d97706';
    let borderColor = '#78350f';

    if (this.mapName === 'Feast or Famine') {
      groundColor = '#065f46'; // Forest Deep Teal/Green
      gridColor = '#047857';
      borderColor = '#064e3b';
    } else if (this.mapName === 'Cavern Churn') {
      groundColor = '#111827'; // Dark cavern gray/black
      gridColor = '#1f2937';
      borderColor = '#374151';
    } else if (this.mapName === 'Double Trouble') {
      groundColor = '#0f172a'; // Deep futuristic slate blue
      gridColor = '#1e293b';
      borderColor = '#0284c7';
    }

    ctx.fillStyle = groundColor;
    ctx.fillRect(0, 0, world.WORLD_SIZE, world.WORLD_SIZE);

    // Grid lines accent
    ctx.strokeStyle = gridColor; ctx.lineWidth = 1;
    const cellSize = 100;
    ctx.beginPath();
    for (let x = 0; x <= world.WORLD_SIZE; x += cellSize) {
      ctx.moveTo(x, 0); ctx.lineTo(x, world.WORLD_SIZE);
    }
    for (let y = 0; y <= world.WORLD_SIZE; y += cellSize) {
      ctx.moveTo(0, y); ctx.lineTo(world.WORLD_SIZE, y);
    }
    ctx.stroke();

    // Map borders walls
    ctx.strokeStyle = borderColor; ctx.lineWidth = 14;
    ctx.strokeRect(0, 0, world.WORLD_SIZE, world.WORLD_SIZE);

    // 2. Draw Ground details: JumpPads, Energy Drinks, Power Cubes
    world.jumpPads.forEach(pad => pad.draw(ctx));

    world.energyDrinks.forEach(drink => drink.draw(ctx));

    world.powerCubes.forEach(cube => cube.draw(ctx));

    // 3. Draw active warning meters and toxic gas boundary ring with swirling clouds
    ctx.save();
    ctx.fillStyle = 'rgba(34, 197, 94, 0.22)';
    ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(world.WORLD_SIZE / 2, world.WORLD_SIZE / 2, world.toxicGasRadius, 0, Math.PI * 2);
    // Draw outer inverted fill for poisonous borders
    ctx.rect(world.WORLD_SIZE, 0, -world.WORLD_SIZE, world.WORLD_SIZE);
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // Swirling green cloud bubbles along the gas boundary
    ctx.save();
    ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
    const gasRadius = world.toxicGasRadius;
    const center = world.WORLD_SIZE / 2;
    // Draw swirling circles
    const bubbleCount = world.lowerGraphics ? 8 : 32;
    for (let i = 0; i < bubbleCount; i++) {
      const angle = (i / bubbleCount) * Math.PI * 2 + (Date.now() / 6000);
      const cx = center + Math.cos(angle) * gasRadius;
      const cy = center + Math.sin(angle) * gasRadius;
      ctx.beginPath();
      ctx.arc(cx, cy, 65 + Math.sin(Date.now() / 400 + i) * 20, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    world.activeMeteors.forEach(m => {
      // Draw meteor target warning ring
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)'; ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
      ctx.beginPath(); ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // Draw countdown tick arc
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 5.5;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.radius, -Math.PI / 2, -Math.PI / 2 + (m.timer / 2000) * Math.PI * 2); ctx.stroke();
      ctx.restore();
    });

    // 4. Draw Obstacles walls & Mystery boxes
    world.obstacles.forEach(obs => obs.draw(ctx));

    world.powerBoxes.forEach(box => box.draw(ctx));

    world.mysteryBoxes.forEach(box => box.draw(ctx));

    // Draw Aim Indicators on the ground under projectiles & characters
    if (player.hp > 0) {
      this.drawAimIndicators(ctx, player);
    }

    // 5. Draw Projectiles
    world.projectiles.forEach(proj => proj.draw(ctx, world));

    // 6. Draw Bots and Local Player
    world.bots.forEach(bot => bot.draw(ctx, world));

    player.draw(ctx, world);

    // 7. Draw Bushes over characters for hiding effects overlays
    world.bushes.forEach(bush => bush.draw(ctx, world));

    // 8. Draw active Particles and Floating Texts values
    world.particles.forEach(p => p.draw(ctx));

    world.floatingTexts.forEach(ft => ft.draw(ctx));

    // Draw World-Space Victory Fireworks
    if (this.isCelebratingVictory) {
      this.victoryFireworks.forEach(fw => {
        ctx.save();
        ctx.fillStyle = fw.color;
        ctx.shadowColor = fw.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(fw.x, fw.y, fw.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    ctx.restore(); // end camera context

    // =================================================================
    // FIXED SCREEN OVERLAYS: HEADS UP DISPLAY HUD
    // =================================================================
    
    // Remaining counts
    if (this.gameMode === 'tdm') {
      const panelWidth = 360;
      const panelHeight = 54;
      const panelX = (this.canvas.width - panelWidth) / 2;
      const panelY = 16;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2.5;
      ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
      ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(panelX + 4, panelY + 4, 110, panelHeight - 8);
      ctx.fillStyle = '#fff';
      ctx.font = '900 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${world.blueScore || 0}`, panelX + 59, panelY + 36);
      ctx.font = '700 11px sans-serif';
      ctx.fillStyle = '#93c5fd';
      ctx.fillText("BLUE TEAM", panelX + 59, panelY + 48);

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(panelX + panelWidth - 114, panelY + 4, 110, panelHeight - 8);
      ctx.fillStyle = '#fff';
      ctx.font = '900 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${world.redScore || 0}`, panelX + panelWidth - 59, panelY + 36);
      ctx.font = '700 11px sans-serif';
      ctx.fillStyle = '#fca5a5';
      ctx.fillText("RED TEAM", panelX + panelWidth - 59, panelY + 48);

      const remainingSeconds = Math.ceil((world.tdmTimer || 0) / 1000);
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      const timerStr = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

      ctx.fillStyle = '#fff';
      ctx.font = '900 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(timerStr, panelX + panelWidth / 2, panelY + 32);
      ctx.font = '900 10px sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText("FIRST TO 20 KILLS", panelX + panelWidth / 2, panelY + 46);

      if (player.isDead && player.deathTimer !== undefined) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#fff';
        ctx.font = '900 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("YOU WERE DEFEATED", this.canvas.width / 2, this.canvas.height / 2 - 40);

        ctx.fillStyle = '#ef4444';
        ctx.font = '900 48px sans-serif';
        const countdown = Math.ceil(player.deathTimer / 1000);
        ctx.fillText(`RESPAWNING IN ${countdown}...`, this.canvas.width / 2, this.canvas.height / 2 + 20);
      }
    } else {
      const totalAlive = world.bots.length + 1;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(this.canvas.width - 240, 16, 220, 50);
      ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
      ctx.strokeRect(this.canvas.width - 240, 16, 220, 50);

      ctx.fillStyle = '#fff'; ctx.font = '900 15px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(`REMAINING BRAWLERS: ${totalAlive}`, this.canvas.width - 28, 46);

      if (world.toxicGasRadius < 600) {
        ctx.fillStyle = '#ef4444'; ctx.font = '900 24px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText("⚠️ TOXIC GAS SHRINKING! ⚠️", this.canvas.width / 2, 75);
      }
    }

    // Scrolling Kill Feed (High-Fidelity)
    ctx.textAlign = 'left';
    this.killFeed.forEach((feed, index) => {
      const feedY = 80 + index * 32;
      const x = 16;
      const w = 280;
      const h = 26;

      // Draw high-fidelity rounded backplate
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = feed.isGas ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 1.5;
      
      ctx.beginPath();
      ctx.roundRect(x, feedY - 20, w, h, 8);
      ctx.fill();
      ctx.stroke();

      ctx.font = '900 11px sans-serif';
      if (feed.isGas) {
        ctx.fillStyle = '#22c55e';
        ctx.fillText('🤢 TOXIC STORM', x + 12, feedY - 2);
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(' ➔ ', x + 115, feedY - 2);
        ctx.fillStyle = '#f87171';
        ctx.fillText(feed.victim.toUpperCase(), x + 140, feedY - 2);
      } else {
        const isAttackerPlayer = feed.attacker.toLowerCase().includes('player') || feed.attacker === player.name;
        ctx.fillStyle = isAttackerPlayer ? '#facc15' : '#38bdf8';
        ctx.fillText(feed.attacker.toUpperCase(), x + 12, feedY - 2);
        
        ctx.fillStyle = '#ef4444';
        ctx.fillText(' ⚔️ ', x + 115, feedY - 2);
        
        ctx.fillStyle = '#f87171';
        ctx.fillText(feed.victim.toUpperCase(), x + 140, feedY - 2);
      }
    });

    // Draw active local Player super charging overlay icon warning
    if (player.superCharge >= 100) {
      ctx.fillStyle = '#facc15'; ctx.font = '900 16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText("⭐ SUPER CHARGED (E or Right Click) ⭐", this.canvas.width / 2, this.canvas.height - 120);
    }

    // Draw pulsing red border vignette if taking gas damage
    if (this.wasPlayerGasDamagedRecently > 0) {
      this.wasPlayerGasDamagedRecently--;
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
      ctx.lineWidth = 25;
      ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.restore();
    }

    // DRAW SCREEN-SPACE CELEBRATION OVERLAYS (CONFETTI AND BANNER)
    if (this.isCelebratingVictory) {
      // 1. Draw Confetti (Screen Space)
      this.victoryConfetti.forEach(c => {
        ctx.save();
        ctx.fillStyle = c.color;
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.fillRect(-c.r, -c.r / 2, c.r * 2, c.r);
        ctx.restore();
      });

      // 2. Draw Sunburst & Banner
      const centerY = this.canvas.height / 2 - 40;
      const centerX = this.canvas.width / 2;
      const celebrationElapsed = Date.now() - this.victoryCelebrationStartTime;
      
      const alpha = Math.min(1, celebrationElapsed / 400);
      
      // Rotating Golden Rays
      ctx.save();
      ctx.translate(centerX, centerY);
      const rays = 14;
      const rayMaxRadius = Math.max(this.canvas.width, this.canvas.height) * 0.75;
      const rotation = (Date.now() / 1000) * 0.18; // Slow rotating rays
      ctx.rotate(rotation);
      ctx.fillStyle = `rgba(245, 158, 11, ${0.1 * alpha})`; // Amber-500
      for (let i = 0; i < rays; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const angleStart = (i / rays) * Math.PI * 2;
        const angleEnd = ((i + 0.45) / rays) * Math.PI * 2;
        ctx.lineTo(Math.cos(angleStart) * rayMaxRadius, Math.sin(angleStart) * rayMaxRadius);
        ctx.lineTo(Math.cos(angleEnd) * rayMaxRadius, Math.sin(angleEnd) * rayMaxRadius);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Banner scaling up with elastic spring overshoot effect
      ctx.save();
      const scaleProgress = Math.min(1, celebrationElapsed / 800);
      // Clean spring overshoot formula
      const scale = scaleProgress === 1 ? 1 : 1 - Math.pow(2, -8 * scaleProgress) * Math.cos(scaleProgress * Math.PI * 1.5);
      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);

      // Deep stylized plate background
      const bannerW = Math.min(this.canvas.width * 0.9, 620);
      const bannerH = 140;

      // Outer drop shadow highlight for extreme high fidelity
      ctx.shadowColor = 'rgba(234, 179, 8, 0.5)';
      ctx.shadowBlur = 20;

      // Main dark banner base
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'; // Slate-900 with rich opacity
      ctx.strokeStyle = '#f59e0b'; // Amber border
      ctx.lineWidth = 4;
      
      ctx.beginPath();
      ctx.roundRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 20);
      ctx.fill();
      ctx.stroke();

      // Reset shadows
      ctx.shadowBlur = 0;

      // Nested glowing border
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-bannerW / 2 + 6, -bannerH / 2 + 6, bannerW - 12, bannerH - 12, 14);
      ctx.stroke();

      // Stylized horizontal badge accent bars
      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.fillRect(-bannerW / 2 + 30, -1, bannerW - 60, 2);

      // VICTORY Big Display Text with neon/gold glow
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 12;
      ctx.font = 'italic 900 32px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏆 SHOWDOWN VICTORY! 🏆', 0, -20);
      ctx.restore();

      // Subtext
      ctx.fillStyle = '#fbbf24'; // Golden amber
      ctx.font = '900 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🥇 #1 RANK ACHIEVED!', 0, 24);
      
      ctx.restore();
    }
  }

  // --- AIM INDICATORS RENDERING ENGINE ---
  private getPlayerAimTarget(player: Character, maxRange: number): { x: number; y: number; dist: number } {
    const angle = player.facingAngle;
    let targetDist = maxRange;

    if (this.touchAimVector.active) {
      // Scale touch joystick magnitude to range
      const mag = Math.hypot(this.touchAimVector.x, this.touchAimVector.y);
      targetDist = Math.min(maxRange, mag * 250); 
    } else if (this.mouseAim.active) {
      const px = this.canvas.width / 2;
      const py = this.canvas.height / 2;
      const worldMouseX = player.x + (this.mouseAim.x - px);
      const worldMouseY = player.y + (this.mouseAim.y - py);
      targetDist = Math.min(maxRange, Math.hypot(worldMouseX - player.x, worldMouseY - player.y));
    }

    return {
      x: player.x + Math.cos(angle) * targetDist,
      y: player.y + Math.sin(angle) * targetDist,
      dist: targetDist
    };
  }

  private drawConeIndicator(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    range: number,
    angle: number,
    spread: number,
    fillStyle: string,
    strokeStyle: string
  ) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.arc(px, py, range, angle - spread / 2, angle + spread / 2);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 2.5;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawLineIndicator(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    range: number,
    angle: number,
    width: number,
    fillStyle: string,
    strokeStyle: string
  ) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.roundRect(0, -width / 2, range, width, 8);
    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawLandingZoneIndicator(
    ctx: CanvasRenderingContext2D,
    tx: number,
    ty: number,
    radius: number,
    fillStyle: string,
    strokeStyle: string
  ) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(tx, ty, radius, 0, Math.PI * 2);
    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 2.5;
    ctx.fill();
    ctx.stroke();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(tx - radius * 0.4, ty); ctx.lineTo(tx + radius * 0.4, ty);
    ctx.moveTo(tx, ty - radius * 0.4); ctx.lineTo(tx, ty + radius * 0.4);
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  private drawAimIndicators(ctx: CanvasRenderingContext2D, player: Character) {
    const angle = player.facingAngle;

    // --- STYLING PALETTES ---
    // Base Attack style: elegant translucent cyan
    let baseFill = 'rgba(56, 189, 248, 0.16)';
    let baseStroke = 'rgba(14, 165, 233, 0.65)';

    // If active attack-modifying gadget is on, paint it glowing neon emerald!
    if (player.clayPigeonsActive || player.silverBulletActive || player.homemadeRecipeActive || player.satchelChargeActive) {
      baseFill = 'rgba(34, 197, 94, 0.18)';
      baseStroke = 'rgba(16, 185, 129, 0.75)';
    }

    // Super style: hot golden yellow / glowing orange
    const superFill = 'rgba(251, 191, 36, 0.22)';
    const superStroke = 'rgba(245, 158, 11, 0.85)';

    // Hypercharge ready / active style: deep electric magenta / neon fuchsia
    const hyperFill = 'rgba(244, 63, 94, 0.22)';
    const hyperStroke = 'rgba(225, 29, 72, 0.85)';

    // Check if the user is holding any shoot/aim inputs
    const isSuperAimingActive = this.isAimingSuper;
    const isBaseAimingActive = (this.isAimingBase || (this.touchAimVector.active && !this.isAimingSuper)) && !isSuperAimingActive;

    // -------------------------------------------------------------
    // 1. BASE ATTACK RETICLES
    // -------------------------------------------------------------
    if (isBaseAimingActive && player.ammo > 0) {
      const id = player.id;
      let attackRange = player.attackRange;

      // Scale base attack ranges for specific items or gadgets
      if (player.clayPigeonsActive) {
        attackRange *= 1.4;
      } else if (player.homemadeRecipeActive) {
        attackRange *= 1.3;
      }

      // Render custom indicator depending on brawler's attack mechanics
      if (id === 'dynamike' || id === 'tick' || id === 'barley') {
        // Lobbers/Throwers: precise landing zone circle + crosshairs
        const target = this.getPlayerAimTarget(player, attackRange);
        const radius = id === 'dynamike' ? 40 : id === 'tick' ? 50 : 45;
        this.drawLandingZoneIndicator(ctx, target.x, target.y, radius, baseFill, baseStroke);
      } 
      else if (id === 'spike') {
        const target = this.getPlayerAimTarget(player, attackRange);
        this.drawLandingZoneIndicator(ctx, target.x, target.y, 35, baseFill, baseStroke);
      }
      else if (id === 'mico') {
        // Jumping hopper: shows landing hop radius!
        const target = this.getPlayerAimTarget(player, 125);
        this.drawLandingZoneIndicator(ctx, target.x, target.y, 35, baseFill, baseStroke);
      }
      else if (id === 'shelly' || id === 'bull' || id === 'darryl' || id === 'gale' || id === 'poco' || id === 'frank' || id === 'emz' || id === 'tara') {
        // Cones/Slices (widely spread shotgun/waves)
        let spread = 0.35;
        if (id === 'shelly') spread = player.clayPigeonsActive ? 0.12 : 0.35;
        else if (id === 'bull') spread = 0.40;
        else if (id === 'darryl') spread = 0.35;
        else if (id === 'gale') spread = 0.20;
        else if (id === 'poco') spread = 0.65;
        else if (id === 'frank') spread = 0.55;
        else if (id === 'emz') spread = 0.50;
        else if (id === 'tara') spread = 0.35;

        this.drawConeIndicator(ctx, player.x, player.y, attackRange, angle, spread, baseFill, baseStroke);
      } 
      else {
        // Linear/Bursts: round-rect path strip pointing forward
        let width = 14;
        if (id === 'piper') width = 12;
        else if (id === 'mortis') width = 24;
        else if (id === 'nita') width = 20;
        else if (id === 'bo') width = 22;
        
        this.drawLineIndicator(ctx, player.x, player.y, attackRange, angle, width, baseFill, baseStroke);
      }
    }

    // -------------------------------------------------------------
    // 2. SUPER ATTACK RETICLES
    // -------------------------------------------------------------
    const isSuperReady = player.superCharge >= 100 || player.superReady;
    const isHyperchargeActive = player.hyperActiveTimer > 0;
    
    if (isSuperAimingActive && isSuperReady) {
      const id = player.id;
      const fillStyle = isHyperchargeActive ? hyperFill : superFill;
      const strokeStyle = isHyperchargeActive ? hyperStroke : superStroke;

      if (id === 'el_primo' || id === 'crow' || id === 'mico' || id === 'piper' || id === 'edgar' || id === 'kit') {
        // Jumping / Leaping supers (Landing zone indicator)
        let range = 360;
        if (id === 'mico') range = 480;
        else if (id === 'edgar') range = 240;
        else if (id === 'kit') range = 350;

        let radius = 40;
        if (id === 'el_primo') radius = 70;
        else if (id === 'mico') radius = 80;
        else if (id === 'crow') radius = 35;
        else if (id === 'piper') radius = 45;

        const target = this.getPlayerAimTarget(player, range);
        this.drawLandingZoneIndicator(ctx, target.x, target.y, radius, fillStyle, strokeStyle);
      }
      else if (id === 'dynamike' || id === 'barley' || id === 'tick' || id === 'spike' || id === 'tara' || id === 'amber') {
        // Thrower/Lobber supers
        let range = player.attackRange;
        if (id === 'dynamike') range = player.attackRange * 1.25;
        else if (id === 'barley') range = player.attackRange * 1.2;
        else if (id === 'tick') range = 400;
        else if (id === 'tara') range = player.attackRange * 1.2;
        else if (id === 'amber') range = player.attackRange * 1.1;

        let radius = 60;
        if (id === 'dynamike') radius = 80;
        else if (id === 'barley') radius = 90;
        else if (id === 'tick') radius = 45;
        else if (id === 'spike') radius = 70;
        else if (id === 'tara') radius = 60;
        else if (id === 'amber') radius = 65;

        const target = this.getPlayerAimTarget(player, range);
        this.drawLandingZoneIndicator(ctx, target.x, target.y, radius, fillStyle, strokeStyle);
      }
      else if (id === 'shelly' || id === 'gale' || id === 'poco' || id === 'frank') {
        // Cone spread supers
        let range = player.attackRange;
        let spread = 0.55;

        if (id === 'shelly') { range = player.attackRange * 1.1; spread = 0.55; }
        else if (id === 'gale') { range = player.attackRange * 1.5; spread = 0.60; }
        else if (id === 'poco') { range = player.attackRange * 1.3; spread = 0.70; }
        else if (id === 'frank') { range = player.attackRange * 1.5; spread = 0.65; }

        this.drawConeIndicator(ctx, player.x, player.y, range, angle, spread, fillStyle, strokeStyle);
      }
      else if (id === 'emz') {
        // Emz spray ring centered on her self
        ctx.save();
        ctx.beginPath();
        ctx.arc(player.x, player.y, 240, 0, Math.PI * 2);
        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 2.5;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      else {
        // Direct movement charge or line barrages
        let range = 450;
        let width = 25;

        if (id === 'bull') { range = 500; width = 35; }
        else if (id === 'darryl') { range = 450; width = 30; }
        else if (id === 'fang') { range = 450; width = 25; }
        else if (id === 'colt') { range = player.attackRange * 1.25; width = 18; }
        else if (id === 'rico') { range = player.attackRange * 1.6; width = 16; }
        else if (id === 'gene') { range = player.attackRange * 1.3; width = 20; }
        else if (id === 'charlie') { range = 320; width = 18; }
        else if (id === 'mortis') { range = 380; width = 45; }
        else if (id === 'bo') { range = 250; width = 22; }
        else if (id === 'jessie') { range = 200; width = 16; }
        else if (id === 'nita') { range = 180; width = 20; }

        this.drawLineIndicator(ctx, player.x, player.y, range, angle, width, fillStyle, strokeStyle);
      }
    }

    // -------------------------------------------------------------
    // 3. GADGET RADIUS INDICATOR
    // -------------------------------------------------------------
    // Draw a helpful subtle neon-green dashed outline showing radius of effect 
    // around the brawler if they have gadget charges remaining and are holding any action
    if (player.gadgetUses > 0 && (isBaseAimingActive || isSuperAimingActive)) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(player.x, player.y, 160, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 8]);
      ctx.stroke();
      ctx.restore();
    }
  }
}
