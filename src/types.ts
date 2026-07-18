export interface BrawlerTemplate {
  id: string;
  name: string;
  hp: number;
  damage: number;
  speed: number;
  attackRange: number;
  reloadTime: number;
  bulletSpeed: number;
  type: string;
  description: string;
  rarity: string;
}

export interface SkinInfo {
  name: string;
  color: string;
  skinColor: string;
  secondary: string;
  cost: number;
}

export type BrawlerSkins = Record<string, SkinInfo>;
