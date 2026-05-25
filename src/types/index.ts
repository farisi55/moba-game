// src/types/index.ts
import type { Entity } from "@/entities/Entity";

export type Vec3 = {
  x: number;
  y: number;
  z: number;
};

export enum Team {
  BLUE = "BLUE",
  RED = "RED"
}

export enum HeroRole {
  TANK = "TANK",
  ASSASSIN = "ASSASSIN",
  MAGE = "MAGE",
  MARKSMAN = "MARKSMAN",
  SUPPORT = "SUPPORT"
}

export enum LaneType {
  TOP = "TOP",
  MID = "MID",
  BOT = "BOT"
}

export type MatchState = "LOBBY" | "LOADING" | "IN_GAME" | "ENDED";

export interface Component {
  type: string;
}

export interface System {
  update(delta: number, entities: readonly Entity[]): void;
}

export interface GameConfig {
  mapSize: number;
  maxPlayersPerTeam: number;
  fixedDelta: number;
  websocketUrl: string;
  environment: string;
}

export interface SkillConfig {
  id: string;
  name: string;
  key: "Q" | "W" | "E" | "R";
  cooldown: number;
  manaCost: number;
  range: number;
  damage: number;
  description: string;
}

export interface HeroConfig {
  id: string;
  name: string;
  role: HeroRole;
  difficulty: number;
  stats: {
    hp: number;
    mana: number;
    attack: number;
    defense: number;
    moveSpeed: number;
  };
  skills: SkillConfig[];
  colorHex: string;
}

export interface PlayerState {
  id: string;
  heroId: string;
  team: Team;
  name: string;
  position: Vec3;
  kills: number;
  deaths: number;
  connected: boolean;
}
