// src/entities/components.ts
import type { Vector3 } from "three";
import type { Component, LaneType, Team } from "@/types";
import type { Entity } from "@/entities/Entity";

export type EntityKind = "hero" | "minion" | "tower" | "structure";

export type GameplayState =
  | "IDLE"
  | "MOVING"
  | "ATTACKING"
  | "CASTING"
  | "DEAD"
  | "WALKING"
  | "ACTIVE"
  | "DESTROYED";

export type AIState = "LANE_WALK" | "ATTACK_MINION" | "ATTACK_HERO" | "RETREAT" | "PUSH_TOWER";

export interface IdentityComponent extends Component {
  type: "identity";
  kind: EntityKind;
}

export interface TeamComponent extends Component {
  type: "team";
  team: Team;
}

export interface HealthComponent extends Component {
  type: "health";
  hp: number;
  maxHp: number;
  defense: number;
  isDead: boolean;
}

export interface MovementComponent extends Component {
  type: "movement";
  targetPosition: Vector3 | null;
  moveSpeed: number;
  isMoving: boolean;
}

export interface CombatComponent extends Component {
  type: "combat";
  attackDamage: number;
  attackRange: number;
  attackSpeed: number;
  cooldownRemaining: number;
  target: Entity | null;
}

export interface StateComponent extends Component {
  type: "state";
  state: GameplayState;
}

export interface AIComponent extends Component {
  type: "ai";
  state: AIState;
  lane: LaneType;
  waypoints: Vector3[];
  currentWaypointIndex: number;
  retreatPosition: Vector3;
}

export interface LifecycleComponent extends Component {
  type: "lifecycle";
  shouldDispose: boolean;
  disposed: boolean;
}
