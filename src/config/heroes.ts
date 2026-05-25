// src/config/heroes.ts
import { HERO_BALANCE } from "@/config/constants";
import { HeroRole, type HeroConfig } from "@/types";

export const HERO_CONFIGS: HeroConfig[] = [
  {
    id: "ironclad",
    name: "Ironclad",
    role: HeroRole.TANK,
    difficulty: HERO_BALANCE.ironclad.difficulty,
    stats: {
      hp: HERO_BALANCE.ironclad.hp,
      mana: HERO_BALANCE.ironclad.mana,
      attack: HERO_BALANCE.ironclad.attack,
      defense: HERO_BALANCE.ironclad.defense,
      moveSpeed: HERO_BALANCE.ironclad.moveSpeed
    },
    skills: [
      {
        id: "ironclad-shield",
        name: "Grave Shield",
        key: "Q",
        cooldown: 8,
        manaCost: 45,
        range: 0,
        damage: 0,
        description: "Raises a spectral bulwark."
      },
      {
        id: "ironclad-taunt",
        name: "Bone Taunt",
        key: "W",
        cooldown: 12,
        manaCost: 60,
        range: 4,
        damage: 20,
        description: "Draws enemy attention."
      },
      {
        id: "ironclad-slam",
        name: "Crypt Slam",
        key: "E",
        cooldown: 10,
        manaCost: 55,
        range: 2,
        damage: 70,
        description: "Crushes a nearby foe."
      },
      {
        id: "ironclad-ultimate",
        name: "Iron Dominion",
        key: "R",
        cooldown: 60,
        manaCost: 120,
        range: 5,
        damage: 120,
        description: "Claims ground for the front line."
      }
    ],
    colorHex: "#7f8fa6"
  },
  {
    id: "shadowblade",
    name: "Shadowblade",
    role: HeroRole.ASSASSIN,
    difficulty: HERO_BALANCE.shadowblade.difficulty,
    stats: {
      hp: HERO_BALANCE.shadowblade.hp,
      mana: HERO_BALANCE.shadowblade.mana,
      attack: HERO_BALANCE.shadowblade.attack,
      defense: HERO_BALANCE.shadowblade.defense,
      moveSpeed: HERO_BALANCE.shadowblade.moveSpeed
    },
    skills: [
      {
        id: "shadowblade-dash",
        name: "Umbral Dash",
        key: "Q",
        cooldown: 6,
        manaCost: 40,
        range: 6,
        damage: 45,
        description: "Dashes through the dark."
      },
      {
        id: "shadowblade-mark",
        name: "Night Mark",
        key: "W",
        cooldown: 9,
        manaCost: 55,
        range: 5,
        damage: 30,
        description: "Marks a target for execution."
      },
      {
        id: "shadowblade-cut",
        name: "Razor Veil",
        key: "E",
        cooldown: 11,
        manaCost: 60,
        range: 3,
        damage: 85,
        description: "Strikes from a hidden angle."
      },
      {
        id: "shadowblade-ultimate",
        name: "Midnight Verdict",
        key: "R",
        cooldown: 55,
        manaCost: 110,
        range: 7,
        damage: 160,
        description: "Commits to a lethal dive."
      }
    ],
    colorHex: "#7d4ed8"
  },
  {
    id: "stormcaller",
    name: "Stormcaller",
    role: HeroRole.MAGE,
    difficulty: HERO_BALANCE.stormcaller.difficulty,
    stats: {
      hp: HERO_BALANCE.stormcaller.hp,
      mana: HERO_BALANCE.stormcaller.mana,
      attack: HERO_BALANCE.stormcaller.attack,
      defense: HERO_BALANCE.stormcaller.defense,
      moveSpeed: HERO_BALANCE.stormcaller.moveSpeed
    },
    skills: [
      {
        id: "stormcaller-bolt",
        name: "Dread Bolt",
        key: "Q",
        cooldown: 5,
        manaCost: 45,
        range: 7,
        damage: 65,
        description: "Launches a crackling projectile."
      },
      {
        id: "stormcaller-field",
        name: "Static Field",
        key: "W",
        cooldown: 13,
        manaCost: 70,
        range: 6,
        damage: 55,
        description: "Places an area storm marker."
      },
      {
        id: "stormcaller-step",
        name: "Storm Step",
        key: "E",
        cooldown: 10,
        manaCost: 65,
        range: 4,
        damage: 20,
        description: "Repositions on a burst of lightning."
      },
      {
        id: "stormcaller-ultimate",
        name: "Black Tempest",
        key: "R",
        cooldown: 70,
        manaCost: 140,
        range: 8,
        damage: 180,
        description: "Calls down a placeholder area storm."
      }
    ],
    colorHex: "#45b7d8"
  }
];
