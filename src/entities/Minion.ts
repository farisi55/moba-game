// src/entities/Minion.ts
import {
  Group,
  Vector3
} from "three";
import { COLORS, COMBAT_CONFIG, MINION_STATS } from "@/config/constants";
import { Entity } from "@/entities/Entity";
import { disposeObject3D } from "@/entities/dispose";
import { buildMinionModel } from "@/entities/minionModels";
import type {
  HealthComponent,
  LifecycleComponent,
  MovementComponent,
  StateComponent
} from "@/entities/components";
import type { Component } from "@/types";
import { Team } from "@/types";

export enum MinionType {
  MELEE = "MELEE",
  RANGED = "RANGED",
  SIEGE = "SIEGE"
}

export enum MinionState {
  WALKING = "WALKING",
  ATTACKING = "ATTACKING",
  DEAD = "DEAD"
}

export interface MinionCombatComponent extends Component {
  type: "combat";
  attackDamage: number;
  attackRange: number;
  attackSpeed: number;
  cooldownRemaining: number;
  targetId: string | null;
}

type MinionStats = {
  hp: number;
  attack: number;
  moveSpeed: number;
  attackRange: number;
};

function getMinionStats(type: MinionType): MinionStats {
  if (type === MinionType.RANGED) {
    return MINION_STATS.ranged;
  }

  if (type === MinionType.SIEGE) {
    return MINION_STATS.siege;
  }

  return MINION_STATS.melee;
}

export class Minion extends Entity {
  public readonly type: MinionType;
  public readonly team: Team;
  public readonly stats: {
    hp: number;
    attack: number;
    moveSpeed: number;
  };
  public targetId: string | null;
  public state: MinionState;
  private readonly modelGroup: Group;

  public constructor(type: MinionType, team: Team, position: Vector3 = new Vector3()) {
    super(position);
    const stats = getMinionStats(type);
    this.type = type;
    this.team = team;
    this.targetId = null;
    this.state = MinionState.WALKING;
    this.stats = {
      hp: stats.hp,
      attack: stats.attack,
      moveSpeed: stats.moveSpeed
    };

    const teamColor = team === Team.BLUE ? COLORS.blueTeam : COLORS.redTeam;
    const emissiveColor = team === Team.BLUE ? COLORS.blueEmissive : COLORS.redEmissive;
    this.modelGroup = buildMinionModel(type, teamColor, emissiveColor);
    this.modelGroup.position.copy(position);
    this.modelGroup.position.y = 0;
    this.mesh = this.modelGroup;

    this.addComponent({ type: "identity", kind: "minion" });
    this.addComponent({ type: "team", team });
    this.addComponent<HealthComponent>({
      type: "health",
      hp: stats.hp,
      maxHp: stats.hp,
      defense: 0,
      isDead: false
    });
    this.addComponent<MovementComponent>({
      type: "movement",
      targetPosition: null,
      moveSpeed: stats.moveSpeed,
      isMoving: false
    });
    this.addComponent<MinionCombatComponent>({
      type: "combat",
      attackDamage: stats.attack,
      attackRange: stats.attackRange,
      attackSpeed: COMBAT_CONFIG.minionAttackSpeed,
      cooldownRemaining: 0,
      targetId: null
    });
    this.addComponent<StateComponent>({
      type: "state",
      state: this.state
    });
    this.addComponent<LifecycleComponent>({
      type: "lifecycle",
      shouldDispose: false,
      disposed: false
    });
  }

  /**
   * Synchronizes minion visual state with ECS components.
   */
  public update(_delta: number): void {
    const health = this.getComponent<HealthComponent>("health");
    const state = this.getComponent<StateComponent>("state");
    const combat = this.getComponent<MinionCombatComponent>("combat");
    if (health) {
      this.stats.hp = health.hp;
      if (health.isDead) {
        this.state = MinionState.DEAD;
      }
    }
    if (state && this.isMinionState(state.state)) {
      this.state = state.state;
    }
    if (combat) {
      this.targetId = combat.targetId;
    }
    if (this.mesh) {
      this.mesh.position.x = this.position.x;
      this.mesh.position.z = this.position.z;
      this.mesh.position.y = 0;
      this.mesh.rotation.copy(this.rotation);
      this.mesh.visible = this.state !== MinionState.DEAD;
    }
  }

  /**
   * Disposes all geometry and material resources owned by this minion.
   */
  public dispose(): void {
    if (this.mesh) {
      disposeObject3D(this.mesh);
      this.mesh.removeFromParent();
      this.mesh = null;
      return;
    }
  }

  private isMinionState(state: string): state is MinionState {
    return state === MinionState.WALKING || state === MinionState.ATTACKING || state === MinionState.DEAD;
  }
}
