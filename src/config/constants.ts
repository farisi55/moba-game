// src/config/constants.ts
import { Vector3 } from "three";

export const COLORS = {
  background: "#0a0a1a",
  ambientLight: "#6070a0",
  directionalLight: "#ffffff",
  ground: "#2a3050",
  river: "#1a2848",
  jungleTree: "#13271d",
  blueTeam: "#3d7eff",
  redTeam: "#d64b4b",
  blueEmissive: "#123a91",
  redEmissive: "#741c1c",
  gold: "#c9a84c",
  charcoal: "#11131f",
  navy: "#0e1326"
} as const;

export const RENDERER_CONFIG = {
  pixelRatioMax: 2,
  shadowMapSize: 2048
} as const;

export const CAMERA_CONFIG = {
  frustumSize: 32,
  position: new Vector3(20, 20, 20),
  target: new Vector3(0, 0, 0),
  near: 0.1,
  far: 1000
} as const;

export const LIGHT_CONFIG = {
  ambientIntensity: 2.5,
  directionalIntensity: 3.5,
  directionalPosition: new Vector3(12, 24, 8)
} as const;

export const FOG_CONFIG = {
  density: 0.008
} as const;

export const GAME_LOOP = {
  fixedDelta: 1 / 60,
  maxFrameDelta: 0.25
} as const;

export const MAP_BOUNDS = {
  minX: -48,
  maxX: 48,
  minZ: -48,
  maxZ: 48
} as const;

export const MAP_CONFIG = {
  size: 100,
  halfSize: 50,
  groundY: 0,
  planeRotationX: -Math.PI / 2,
  riverRotationZ: Math.PI / 4,
  riverYOffset: 0.01,
  riverWidth: 12,
  riverLength: 120,
  jungleTreeCountPerSide: 18,
  jungleColumns: 6,
  jungleTreeMinSize: 0.8,
  jungleTreeMaxSize: 1.8,
  jungleTreeSizeStep: 0.35,
  jungleTreeHeightMultiplier: 2.2,
  jungleTreeBaseOffsetX: 14,
  jungleTreeSpacingX: 4.5,
  jungleTreeStartZ: -24,
  jungleTreeSpacingZ: 13,
  baseWidth: 10,
  baseHeight: 1.2,
  baseDepth: 10,
  baseOffset: 20,
  laneVerticalOffset: 14,
  laneBotOffset: -14,
  laneMidOffset: 0,
  laneMidInnerOffset: 8
} as const;

export const ENTITY_CONFIG = {
  targetStopDistance: 0.1,
  heroWidth: 1,
  heroHeight: 1.8,
  heroDepth: 1,
  heroSpawnY: 0.9,
  minionWidth: 0.7,
  minionHeight: 0.8,
  minionDepth: 0.7,
  minionSpawnY: 0.4,
  towerRadius: 1.2,
  towerBaseRadiusMultiplier: 1.25,
  towerHeight: 4,
  towerSegments: 12,
  towerSpawnY: 2,
  towerRingInnerRadius: 5.8,
  towerRingOuterRadius: 6,
  towerRingSegments: 64
} as const;

export const TOWER_STATS = {
  hp: 1200,
  defense: 8,
  emissiveIntensity: 0.35
} as const;

export const COMBAT_CONFIG = {
  minimumDamage: 1,
  meleeRange: 1.6,
  rangedRange: 6,
  heroAttackRange: 2,
  heroAttackSpeed: 1,
  towerAttackRange: 8,
  towerAttackDamage: 35,
  towerAttackSpeed: 0.8,
  minionAttackSpeed: 0.8
} as const;

export const AI_CONFIG = {
  updateInterval: 0.5,
  lowHealthRatio: 0.3,
  heroDetectionRange: 9,
  minionDetectionRange: 7,
  towerDetectionRange: 10,
  waypointReachDistance: 0.75
} as const;

export const LANE_CONFIG = {
  waveIntervalSeconds: 30,
  meleePerWave: 3,
  rangedPerWave: 1,
  spawnSpread: 1.2,
  initialWaveDelaySeconds: 1
} as const;

export const MINION_STATS = {
  melee: {
    hp: 120,
    attack: 12,
    moveSpeed: 2.1,
    attackRange: COMBAT_CONFIG.meleeRange
  },
  ranged: {
    hp: 85,
    attack: 16,
    moveSpeed: 1.9,
    attackRange: COMBAT_CONFIG.rangedRange
  },
  siege: {
    hp: 240,
    attack: 28,
    moveSpeed: 1.2,
    attackRange: COMBAT_CONFIG.rangedRange
  }
} as const;

export const HERO_BALANCE = {
  ironclad: {
    hp: 950,
    mana: 320,
    attack: 52,
    defense: 18,
    moveSpeed: 3.1,
    difficulty: 2
  },
  shadowblade: {
    hp: 620,
    mana: 360,
    attack: 76,
    defense: 8,
    moveSpeed: 4.4,
    difficulty: 4
  },
  stormcaller: {
    hp: 680,
    mana: 520,
    attack: 62,
    defense: 10,
    moveSpeed: 3.4,
    difficulty: 3
  }
} as const;

export const HERO_PROGRESS = {
  startingLevel: 1,
  startingExp: 0,
  hpPerLevel: 110,
  manaPerLevel: 45,
  attackPerLevel: 7,
  defensePerLevel: 2,
  expPerLevel: 100
} as const;

export const UI_CONFIG = {
  hudSkillCount: 4,
  matchTimerTickSeconds: 1,
  guestJoinDelayMs: 2000,
  networkMoveIntervalMs: 1000,
  randomWalkRadius: 12,
  hudRefreshMs: 100
} as const;

export const NETWORK_CONFIG = {
  randomCenterOffset: 0.5
} as const;

export const INPUT_CONFIG = {
  keyboardMoveLeadDistance: 4,
  pointerMoveButton: "pointer",
  primaryTouchKey: "touch"
} as const;

export const TIME_CONFIG = {
  millisecondsPerSecond: 1000
} as const;

export const RESPAWN_CONFIG = {
  heroRespawnSeconds: 8
} as const

export const DAMAGE_NUMBER_CONFIG = {
  riseSpeed: 2.2,
  lifetime: 1.1,
  fontSize: '14px',
  critFontSize: '18px',
} as const
