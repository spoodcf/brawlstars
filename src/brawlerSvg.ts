import { SKIN_DATA } from './brawlerTemplates';

export function getBrawlerSVG(id: string, skinId: string): string {
  const skins = SKIN_DATA[id] || {};
  const skin = skins[skinId] || skins['default'] || { color: '#ffffff', skinColor: '#ffedd5', secondary: '#000000' };

  switch (id) {
    case 'shelly':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <circle cx="30" cy="28" r="14" fill="${skin.skinColor}"/>
        <path d="M 12 25 Q 30 5 48 25" fill="${skin.secondary}" stroke="#000" stroke-width="1.5"/>
        <circle cx="24" cy="27" r="3" fill="#000" /> <circle cx="36" cy="27" r="3" fill="#000" />
        <rect x="20" y="38" width="20" height="4" fill="#ef4444" rx="2" />
        <rect x="42" y="15" width="8" height="30" fill="#475569" stroke="#000" stroke-width="1.5" transform="rotate(20 42 10)"/></svg>`;
    case 'colt':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <circle cx="30" cy="28" r="14" fill="${skin.skinColor}"/>
        <path d="M 14 26 Q 30 8 46 26 Z" fill="${skin.secondary}" stroke="#000" stroke-width="1.5"/>
        <circle cx="23" cy="27" r="3" fill="#000" /> <circle cx="37" cy="27" r="3" fill="#000" />
        <path d="M 22 36 Q 30 42 38 36" fill="none" stroke="#000" stroke-width="2" />
        <rect x="5" y="32" width="10" height="14" fill="#94a3b8" stroke="#000" stroke-width="1" />
        <rect x="45" y="32" width="10" height="14" fill="#94a3b8" stroke="#000" stroke-width="1" /></svg>`;
    case 'el_primo':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <circle cx="30" cy="28" r="14" fill="${skin.skinColor}"/>
        <path d="M 16 30 Q 30 44 44 30 Q 42 18 30 22 Q 18 18 16 30 Z" fill="${skin.color}" stroke="#000" stroke-width="1.5"/>
        <ellipse cx="23" cy="26" rx="4" ry="5" fill="#fff" stroke="${skin.secondary}" stroke-width="1.5" />
        <ellipse cx="37" cy="26" rx="4" ry="5" fill="#fff" stroke="${skin.secondary}" stroke-width="1.5" />
        <circle cx="23" cy="26" r="1.5" fill="#000"/> <circle cx="37" cy="26" r="1.5" fill="#000"/>
        <path d="M 22 36 Q 30 44 38 36 Z" fill="#fff" stroke="#000" stroke-width="1.5"/></svg>`;
    case 'spike':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <circle cx="23" cy="27" r="4" fill="${skin.skinColor}" /> <circle cx="37" cy="27" r="4" fill="${skin.skinColor}" />
        <ellipse cx="30" cy="38" rx="5" ry="6" fill="${skin.skinColor}" />
        <path d="M 22 10 Q 30 -4 38 10 Z" fill="#ef4444" stroke="#000" stroke-width="1.5"/>
        <circle cx="15" cy="35" r="5" fill="${skin.secondary}" />
        <circle cx="45" cy="35" r="5" fill="${skin.secondary}" /></svg>`;
    case 'kenji':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <circle cx="30" cy="28" r="14" fill="${skin.skinColor}"/>
        <rect x="18" y="14" width="24" height="6" fill="${skin.secondary}" stroke="#000" stroke-width="1.5"/>
        <circle cx="30" cy="17" r="2.5" fill="#ef4444" />
        <circle cx="24" cy="27" r="3" fill="#000" /> <circle cx="36" cy="27" r="3" fill="#000" />
        <rect x="43" y="15" width="5" height="32" fill="#e2e8f0" stroke="#000" stroke-width="1" transform="rotate(15 43 15)"/></svg>`;
    case 'edgar':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <circle cx="30" cy="28" r="13" fill="${skin.skinColor}"/>
        <path d="M 12 30 Q 30 10 48 30 C 44 14, 16 14, 12 30 Z" fill="#111827" stroke="#000" stroke-width="1.5"/>
        <path d="M 8 38 C 5 55, 25 55, 25 38 Z" fill="${skin.secondary}" stroke="#000" stroke-width="1"/>
        <path d="M 52 38 C 55 55, 35 55, 35 38 Z" fill="${skin.secondary}" stroke="#000" stroke-width="1"/>
        <circle cx="24" cy="27" r="3" fill="#000" /> <circle cx="36" cy="27" r="3" fill="#000" /></svg>`;
    case 'bibi':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <circle cx="30" cy="28" r="14" fill="${skin.skinColor}"/>
        <path d="M 14 18 Q 30 8 46 18" fill="none" stroke="#000" stroke-width="4"/>
        <circle cx="38" cy="34" r="6" fill="${skin.secondary}" stroke="#be185d" stroke-width="1.5"/>
        <circle cx="24" cy="27" r="3" fill="#000" /> <circle cx="36" cy="27" r="3" fill="#000" />
        <rect x="12" y="38" width="36" height="6" fill="#cbd5e1" stroke="#000" stroke-width="1.5" transform="rotate(-15 30 38)"/></svg>`;
    case 'leon':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <circle cx="30" cy="30" r="12" fill="${skin.secondary}"/>
        <circle cx="24" cy="22" r="4.5" fill="#fff" stroke="#000" stroke-width="1.5"/>
        <circle cx="36" cy="22" r="4.5" fill="#fff" stroke="#000" stroke-width="1.5"/>
        <circle cx="24" cy="22" r="1.5" fill="#000"/> <circle cx="36" cy="22" r="1.5" fill="#000"/>
        <path d="M 30 32 L 30 42" stroke="#f43f5e" stroke-width="3" stroke-linecap="round"/></svg>`;
    case 'crow':
      if (skinId === 'night_mecha' || skinId === 'gold_mecha') {
        return `<svg class="w-full h-full" viewBox="0 0 60 60">
          <rect x="14" y="14" width="32" height="32" rx="6" fill="${skin.color}" stroke="#000" stroke-width="2"/>
          <polygon points="26,24 48,28 26,36" fill="${skin.secondary}" stroke="#000" stroke-width="1.5"/>
          <rect x="20" y="20" width="16" height="4" fill="#ef4444" rx="2" stroke="#000" stroke-width="1"/>
          <path d="M 14 14 L 6 6 L 16 10 M 46 14 L 54 6 L 44 10" fill="none" stroke="${skin.secondary}" stroke-width="2.5"/>
        </svg>`;
      } else {
        return `<svg class="w-full h-full" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
          <circle cx="30" cy="28" r="14" fill="${skin.skinColor}"/>
          <path d="M 24 24 Q 38 18 48 30 Q 32 36 24 28 Z" fill="${skinId === 'crowbone' ? '#06b6d4' : '#f59e0b'}" stroke="#000" stroke-width="1.5"/>
          <circle cx="23" cy="26" r="3" fill="#000"/> <circle cx="37" cy="26" r="3" fill="#000"/>
          <path d="M 18 19 L 28 23 M 38 19 L 28 23" stroke="#ef4444" stroke-width="2"/>
        </svg>`;
      }
    case 'surge':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <rect x="20" y="10" width="20" height="15" fill="${skin.secondary}" />
        <circle cx="30" cy="28" r="10" fill="${skin.skinColor}"/>
        <path d="M 22 25 L 30 18 L 38 25" fill="none" stroke="#000" stroke-width="2"/>
        <circle cx="26" cy="27" r="2" fill="#000" /> <circle cx="34" cy="27" r="2" fill="#000" />
      </svg>`;
    case 'fang':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <circle cx="30" cy="28" r="14" fill="${skin.skinColor}"/>
        <path d="M 16 16 Q 30 10 44 16 L 44 22 L 16 22 Z" fill="#1e40af" stroke="#000" stroke-width="1.5"/>
        <circle cx="24" cy="27" r="3" fill="#000" /> <circle cx="36" cy="27" r="3" fill="#000" />
        <path d="M 20 40 L 40 40 L 35 45 L 25 45 Z" fill="${skin.secondary}" stroke="#000" stroke-width="1"/>
      </svg>`;
    case 'kit':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <circle cx="30" cy="30" r="14" fill="${skin.skinColor}"/>
        <path d="M 15 15 L 22 8 L 25 15 Z" fill="${skin.color}" stroke="#000" stroke-width="1.5"/>
        <path d="M 45 15 L 38 8 L 35 15 Z" fill="${skin.color}" stroke="#000" stroke-width="1.5"/>
        <circle cx="24" cy="27" r="2.5" fill="#000" /> <circle cx="36" cy="27" r="2.5" fill="#000" />
        <path d="M 27 32 Q 30 35 33 32" fill="none" stroke="#000" stroke-width="1.5"/>
      </svg>`;
      
    // NEW BRAWLERS!
    case 'gale':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <circle cx="30" cy="28" r="14" fill="${skin.skinColor}"/>
        <!-- Snow Hat / Cap -->
        <path d="M 14 22 Q 30 2 46 22 Z" fill="${skin.secondary}" stroke="#000" stroke-width="1.5"/>
        <circle cx="30" cy="4" r="4" fill="#fff" stroke="#000" stroke-width="1"/>
        <!-- Fluffy white eyebrows / mustache -->
        <path d="M 18 25 Q 23 21 28 25 M 32 25 Q 37 21 42 25" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
        <path d="M 16 35 Q 30 45 44 35" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>
        <circle cx="23" cy="29" r="2.5" fill="#000" /> <circle cx="37" cy="29" r="2.5" fill="#000" />
      </svg>`;
    case 'mico':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <!-- Big ears -->
        <circle cx="10" cy="28" r="8" fill="${skin.color}" stroke="#000" stroke-width="1.5"/>
        <circle cx="10" cy="28" r="5" fill="${skin.skinColor}"/>
        <circle cx="50" cy="28" r="8" fill="${skin.color}" stroke="#000" stroke-width="1.5"/>
        <circle cx="50" cy="28" r="5" fill="${skin.skinColor}"/>
        <!-- Face and cheeky smile -->
        <circle cx="30" cy="29" r="13" fill="${skin.skinColor}"/>
        <circle cx="23" cy="26" r="3" fill="#000" /> <circle cx="37" cy="26" r="3" fill="#000" />
        <!-- Headphone band / crown -->
        <path d="M 12 20 Q 30 8 48 20" fill="none" stroke="${skin.secondary}" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M 22 36 Q 30 42 38 36" fill="none" stroke="#92400e" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`;
    case 'charlie':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <circle cx="30" cy="28" r="13" fill="${skin.skinColor}"/>
        <!-- Chic modern hair bangs -->
        <path d="M 12 24 Q 30 10 48 24 Q 38 15 30 22 Q 22 15 12 24 Z" fill="${skin.secondary}" stroke="#000" stroke-width="1"/>
        <path d="M 12 24 L 8 40 L 14 30 Z" fill="${skin.secondary}" stroke="#000" stroke-width="1"/>
        <path d="M 48 24 L 52 40 L 46 30 Z" fill="${skin.secondary}" stroke="#000" stroke-width="1"/>
        <!-- Makeup eyes -->
        <ellipse cx="23" cy="27" rx="3.5" ry="4.5" fill="#fff" stroke="#ec4899" stroke-width="1.5"/>
        <ellipse cx="37" cy="27" rx="3.5" ry="4.5" fill="#fff" stroke="#ec4899" stroke-width="1.5"/>
        <circle cx="23" cy="27" r="1.5" fill="#000"/> <circle cx="37" cy="27" r="1.5" fill="#000"/>
        <!-- Spider web cheek tattoos -->
        <path d="M 15 34 L 19 36 M 45 34 L 41 36" stroke="#a855f7" stroke-width="1.5"/>
      </svg>`;
    case 'mortis':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <path d="M 12 36 Q 30 14 48 36" fill="${skin.secondary}" stroke="#000" stroke-width="1.5"/>
        <circle cx="30" cy="28" r="12" fill="${skin.skinColor}"/>
        <!-- Top Hat -->
        <path d="M 18 20 L 42 20 L 36 6 L 24 6 Z" fill="${skin.secondary}" stroke="#000" stroke-width="1.5"/>
        <rect x="15" y="17" width="30" height="4" fill="#e11d48" rx="1" stroke="#000" stroke-width="1"/>
        <circle cx="24" cy="27" r="2.5" fill="#000" /> <circle cx="36" cy="27" r="2.5" fill="#000" />
        <path d="M 23 35 Q 30 38 37 35" fill="none" stroke="#000" stroke-width="2" />
      </svg>`;
    case 'piper':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <!-- Hair -->
        <circle cx="18" cy="24" r="8" fill="#fef08a" stroke="#000" stroke-width="1"/>
        <circle cx="42" cy="24" r="8" fill="#fef08a" stroke="#000" stroke-width="1"/>
        <circle cx="30" cy="28" r="13" fill="${skin.skinColor}"/>
        <path d="M 15 22 Q 30 8 45 22 Z" fill="#fef08a" stroke="#000" stroke-width="1.5"/>
        <!-- Parasol on the back -->
        <circle cx="48" cy="20" r="7" fill="${skin.secondary}" stroke="#000" stroke-width="1.5"/>
        <line x1="48" y1="20" x2="48" y2="35" stroke="#4b5563" stroke-width="2"/>
        <circle cx="23" cy="28" r="2.5" fill="#000" /> <circle cx="37" cy="28" r="2.5" fill="#000" />
        <path d="M 24 35 Q 30 40 36 35" fill="none" stroke="#000" stroke-width="1.5" />
      </svg>`;
    case 'dynamike':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <circle cx="30" cy="28" r="13" fill="${skin.skinColor}"/>
        <!-- Big white beard -->
        <path d="M 15 32 Q 30 52 45 32 Z" fill="#ffffff" stroke="#000" stroke-width="1.5"/>
        <!-- Miner's Helmet -->
        <path d="M 14 22 Q 30 4 46 22 Z" fill="#facc15" stroke="#000" stroke-width="1.5"/>
        <rect x="25" y="10" width="10" height="6" fill="#ffffff" stroke="#000" stroke-width="1" rx="1"/>
        <!-- Helmet strap/band -->
        <path d="M 14 21 L 46 21" stroke="#ca8a04" stroke-width="3"/>
        <circle cx="24" cy="26" r="2.5" fill="#000" /> <circle cx="36" cy="26" r="2.5" fill="#000" />
        <path d="M 25 31 Q 30 35 35 31" fill="none" stroke="#000" stroke-width="2" />
      </svg>`;
    case 'frank':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <!-- Bolt on sides -->
        <rect x="4" y="26" width="6" height="8" fill="#94a3b8" stroke="#000" stroke-width="1.5" rx="1"/>
        <rect x="50" y="26" width="6" height="8" fill="#94a3b8" stroke="#000" stroke-width="1.5" rx="1"/>
        <!-- Head -->
        <rect x="10" y="10" width="40" height="40" rx="4" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <rect x="14" y="14" width="32" height="28" rx="2" fill="${skin.skinColor}"/>
        <!-- Big dark unibrow/hair -->
        <path d="M 10 10 L 50 10 L 50 18 L 42 22 L 30 15 L 18 22 L 10 18 Z" fill="#111827" stroke="#000" stroke-width="1"/>
        <!-- Eyes with purple highlight -->
        <circle cx="22" cy="26" r="3.5" fill="#000" /> <circle cx="38" cy="26" r="3.5" fill="#000" />
        <circle cx="22" cy="26" r="1.5" fill="#c084fc" /> <circle cx="38" cy="26" r="1.5" fill="#c084fc" />
        <!-- Stitches -->
        <line x1="30" y1="28" x2="30" y2="38" stroke="#4b5563" stroke-width="2"/>
        <line x1="26" y1="33" x2="34" y2="33" stroke="#4b5563" stroke-width="2"/>
        <!-- Headphones -->
        <path d="M 10 26 Q 30 14 50 26" fill="none" stroke="${skin.secondary}" stroke-width="4.5"/>
      </svg>`;
    case 'poco':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <!-- Skull face -->
        <circle cx="30" cy="28" r="13" fill="#f8fafc" stroke="#000" stroke-width="1.5"/>
        <!-- Mariachi Sombrero -->
        <path d="M 6 20 C 6 4, 54 4, 54 20 Z" fill="${skin.secondary}" stroke="#000" stroke-width="1.5"/>
        <path d="M 6 20 L 54 20" stroke="#facc15" stroke-width="3" stroke-linecap="round"/>
        <!-- Skull face patterns (flower eyes) -->
        <circle cx="23" cy="26" r="5" fill="#ef4444" />
        <circle cx="37" cy="26" r="5" fill="#ef4444" />
        <circle cx="23" cy="26" r="2.5" fill="#000" />
        <circle cx="37" cy="26" r="2.5" fill="#000" />
        <!-- Nose cavity -->
        <polygon points="30,30 28,33 32,33" fill="#000"/>
        <!-- Teeth stitches -->
        <line x1="22" y1="36" x2="38" y2="36" stroke="#000" stroke-width="1.5"/>
        <line x1="26" y1="34" x2="26" y2="38" stroke="#000" stroke-width="1.5"/>
        <line x1="30" y1="34" x2="30" y2="38" stroke="#000" stroke-width="1.5"/>
        <line x1="34" y1="34" x2="34" y2="38" stroke="#000" stroke-width="1.5"/>
      </svg>`;
    case 'tara':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <!-- Wrapped face -->
        <circle cx="30" cy="28" r="13" fill="${skin.color}"/>
        <!-- Mask bands -->
        <path d="M 18 19 L 42 35 M 18 35 L 42 19" stroke="${skin.secondary}" stroke-width="3"/>
        <!-- Third Eye on forehead -->
        <ellipse cx="30" cy="18" rx="6" ry="4" fill="#fff" stroke="#000" stroke-width="1"/>
        <circle cx="30" cy="18" r="2" fill="#e11d48"/>
        <!-- Normal Eye slot (only one visible, stylized) -->
        <polygon points="20,28 28,26 26,31" fill="#facc15" stroke="#000" stroke-width="1"/>
        <circle cx="24" cy="28" r="1.5" fill="#000"/>
      </svg>`;
    case 'tick':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <!-- Spherical Bomb head -->
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <!-- Metallic Faceplate -->
        <circle cx="30" cy="30" r="14" fill="${skin.skinColor}" stroke="#000" stroke-width="1.5"/>
        <!-- Cute glowing eyes -->
        <circle cx="23" cy="28" r="3.5" fill="#ef4444" stroke="#000" stroke-width="1"/>
        <circle cx="37" cy="28" r="3.5" fill="#ef4444" stroke="#000" stroke-width="1"/>
        <!-- Windup Key on head -->
        <path d="M 30 8 L 30 2 M 25 2 L 35 2" stroke="${skin.secondary}" stroke-width="3" stroke-linecap="round"/>
        <!-- Mouth lines (robo grin) -->
        <path d="M 22 36 Q 30 42 38 36" fill="none" stroke="#111827" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`;
    case 'amber':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <circle cx="30" cy="28" r="13" fill="${skin.skinColor}"/>
        <!-- Dynamic fire hair -->
        <path d="M 12 24 C 10 10, 24 -2, 30 8 C 36 -2, 50 10, 48 24 C 52 35, 42 42, 30 42 C 18 42, 8 35, 12 24 Z" fill="${skin.secondary}" opacity="0.8" stroke="#000" stroke-width="1"/>
        <path d="M 16 26 C 14 15, 25 4, 30 12 C 35 4, 46 15, 44 26 Z" fill="#facc15" opacity="0.9"/>
        <circle cx="23" cy="28" r="2.5" fill="#000" /> <circle cx="37" cy="28" r="2.5" fill="#000" />
        <path d="M 24 35 Q 30 39 36 35" fill="none" stroke="#000" stroke-width="2" />
      </svg>`;
    case 'bull':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <circle cx="30" cy="28" r="13" fill="${skin.skinColor}"/>
        <!-- Big black hair tuft / sideburns -->
        <path d="M 10 24 Q 30 2 50 24" fill="#0f172a" stroke="#000" stroke-width="1.5"/>
        <path d="M 20 12 L 30 4 L 40 12 Z" fill="#0f172a"/>
        <circle cx="23" cy="28" r="3" fill="#000" /> <circle cx="37" cy="28" r="3" fill="#000" />
        <!-- Bull Golden nose ring -->
        <circle cx="30" cy="36" r="4.5" fill="none" stroke="#f59e0b" stroke-width="2.5" />
      </svg>`;
    case 'brock':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <circle cx="30" cy="28" r="13" fill="${skin.skinColor}"/>
        <!-- Cool blue cap -->
        <path d="M 14 20 Q 30 6 46 20 Z" fill="${skin.secondary}" stroke="#000" stroke-width="1.5"/>
        <path d="M 16 20 L 44 20 L 40 24 L 20 24 Z" fill="#1e3a8a"/>
        <!-- Star / Cool shades -->
        <rect x="18" y="25" width="10" height="7" rx="1.5" fill="#0f172a" stroke="#000" stroke-width="1"/>
        <rect x="32" y="25" width="10" height="7" rx="1.5" fill="#0f172a" stroke="#000" stroke-width="1"/>
        <line x1="28" y1="28" x2="32" y2="28" stroke="#000" stroke-width="1.5"/>
        <path d="M 24 37 Q 30 41 36 37" fill="none" stroke="#000" stroke-width="2" />
      </svg>`;
    case 'barley':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <!-- Robotic headplate -->
        <circle cx="30" cy="28" r="13" fill="#cbd5e1" stroke="#000" stroke-width="1.5"/>
        <!-- One glowing golden eye -->
        <circle cx="30" cy="24" r="5.5" fill="#fbbf24" stroke="#ca8a04" stroke-width="1.5" />
        <circle cx="30" cy="24" r="2" fill="#fff" />
        <!-- Big gentleman mustache -->
        <path d="M 18 34 Q 30 26 42 34 C 36 38, 24 38, 18 34 Z" fill="#78350f" stroke="#000" stroke-width="1.5"/>
        <!-- Bowtie -->
        <polygon points="24,42 36,42 30,46" fill="#ef4444" stroke="#000" stroke-width="1"/>
      </svg>`;
    case 'nita':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <circle cx="30" cy="30" r="13" fill="${skin.skinColor}"/>
        <!-- Red Bear cowl hat with ears -->
        <path d="M 12 26 C 10 10, 50 10, 48 26 Z" fill="${skin.secondary}" stroke="#000" stroke-width="1.5"/>
        <circle cx="16" cy="12" r="5" fill="${skin.secondary}" stroke="#000" stroke-width="1.5"/>
        <circle cx="44" cy="12" r="5" fill="${skin.secondary}" stroke="#000" stroke-width="1.5"/>
        <!-- Eyes & Nose -->
        <circle cx="23" cy="28" r="3" fill="#000" /> <circle cx="37" cy="28" r="3" fill="#000" />
        <polygon points="28,33 32,33 30,36" fill="#000"/>
        <!-- Tribal paint markings -->
        <path d="M 15 28 L 20 29 M 45 28 L 40 29" stroke="#ef4444" stroke-width="2" />
      </svg>`;
    case 'bo':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <circle cx="30" cy="31" r="13" fill="${skin.skinColor}"/>
        <!-- Eagle cowl with beak -->
        <path d="M 12 24 C 12 6, 48 6, 48 24 Z" fill="${skin.color}" stroke="#000" stroke-width="1.5"/>
        <polygon points="27,15 33,15 30,24" fill="#fbbf24" stroke="#000" stroke-width="1.5"/>
        <!-- Feather on cap -->
        <path d="M 40 8 L 46 -2 L 44 6 Z" fill="#ffffff" stroke="#000" stroke-width="1"/>
        <!-- Aviator sunglasses -->
        <polygon points="18,26 29,26 27,31 19,31" fill="#1e293b" />
        <polygon points="31,26 42,26 41,31 33,31" fill="#1e293b" />
        <line x1="28" y1="26" x2="32" y2="26" stroke="#111827" stroke-width="2" />
      </svg>`;
    case 'jessie':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <circle cx="30" cy="28" r="13" fill="${skin.skinColor}"/>
        <!-- Red/Orange hair + yellow helmet/cap -->
        <path d="M 14 22 C 14 8, 46 8, 46 22 Z" fill="#fbbf24" stroke="#000" stroke-width="1.5"/>
        <path d="M 10 24 C 10 38, 20 40, 20 28 M 50 24 C 50 38, 40 40, 40 28" fill="#f43f5e" stroke="#000" stroke-width="1"/>
        <circle cx="23" cy="28" r="3" fill="#000" /> <circle cx="37" cy="28" r="3" fill="#000" />
        <!-- Blue Goggles on helmet -->
        <circle cx="24" cy="16" r="5" fill="#38bdf8" stroke="#000" stroke-width="1.5" />
        <circle cx="36" cy="16" r="5" fill="#38bdf8" stroke="#000" stroke-width="1.5" />
        <line x1="29" y1="16" x2="31" y2="16" stroke="#000" stroke-width="2"/>
      </svg>`;
    case 'emz':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="${skin.color}" stroke="#000" stroke-width="2"/>
        <!-- Wrapped mummy face -->
        <circle cx="30" cy="28" r="13" fill="#db2777" />
        <!-- Mummy bandage horizontal strips -->
        <line x1="17" y1="22" x2="43" y2="22" stroke="#f1f5f9" stroke-width="2.5" opacity="0.8"/>
        <line x1="17" y1="30" x2="43" y2="30" stroke="#f1f5f9" stroke-width="2.5" opacity="0.8"/>
        <line x1="19" y1="36" x2="41" y2="36" stroke="#f1f5f9" stroke-width="2.5" opacity="0.8"/>
        <!-- Big purple punk locks -->
        <path d="M 12 18 Q -4 14, 10 6 Q 30 -6, 50 6 Q 64 14, 48 18" fill="none" stroke="${skin.color}" stroke-width="5" stroke-linecap="round"/>
        <!-- Makeup eyes -->
        <circle cx="23" cy="27" r="3" fill="#fff" stroke="#000" stroke-width="1" /> <circle cx="23" cy="27" r="1.5" fill="#06b6d4" />
        <circle cx="37" cy="27" r="3" fill="#fff" stroke="#000" stroke-width="1" /> <circle cx="37" cy="27" r="1.5" fill="#06b6d4" />
      </svg>`;
    case 'rico':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <!-- Transparent glass head -->
        <circle cx="30" cy="30" r="22" fill="rgba(147,197,253,0.35)" stroke="${skin.color}" stroke-width="2.5"/>
        <!-- Internal eye turret -->
        <rect x="24" y="16" width="12" height="12" rx="2" fill="#1e293b" stroke="#000" stroke-width="1"/>
        <circle cx="30" cy="22" r="3.5" fill="#ef4444" />
        <circle cx="30" cy="22" r="1" fill="#fff" />
        <!-- Bouncy balls loaded inside head -->
        <circle cx="20" cy="38" r="3.5" fill="#ef4444" />
        <circle cx="30" cy="42" r="3.5" fill="#3b82f6" />
        <circle cx="40" cy="38" r="3.5" fill="#10b981" />
      </svg>`;
    case 'darryl':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <!-- Barrel Hat -->
        <rect x="14" y="6" width="32" height="34" rx="4" fill="#78350f" stroke="#000" stroke-width="2"/>
        <!-- Steel hoops on barrel -->
        <line x1="14" y1="14" x2="46" y2="14" stroke="#94a3b8" stroke-width="3"/>
        <line x1="14" y1="30" x2="46" y2="30" stroke="#94a3b8" stroke-width="3"/>
        <!-- Center opening with glowing golden robotic eye -->
        <rect x="22" y="18" width="16" height="8" fill="#111827" stroke="#000" stroke-width="1"/>
        <circle cx="30" cy="22" r="3" fill="#fbbf24" />
        <!-- Pirate hat crown on top -->
        <path d="M 20 6 Q 30 -4 40 6 Z" fill="#0f172a" stroke="#000" stroke-width="1.5"/>
      </svg>`;
    case 'gene':
      return `<svg class="w-full h-full" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="#f43f5e" stroke="#000" stroke-width="2"/>
        <circle cx="30" cy="29" r="13" fill="#ffccd5"/>
        <!-- Purple Genie turban -->
        <path d="M 12 22 Q 30 2 48 22 Z" fill="#c084fc" stroke="#000" stroke-width="1.5"/>
        <ellipse cx="30" cy="14" rx="3.5" ry="5.5" fill="#fbbf24" stroke="#000" stroke-width="1"/>
        <circle cx="30" cy="14" r="1.5" fill="#3b82f6" />
        <!-- Glowing black eyes & mouth -->
        <ellipse cx="23" cy="27" rx="3" ry="2" fill="#000" />
        <ellipse cx="37" cy="27" rx="3" ry="2" fill="#000" />
        <path d="M 22 35 Q 30 42 38 35 Z" fill="#4c1d95" stroke="#000" stroke-width="1.5"/>
      </svg>`;
    default:
      return `<svg class="w-full h-full" viewBox="0 0 60 60"><circle cx="30" cy="30" r="22" fill="#94a3b8"/></svg>`;
  }
}
