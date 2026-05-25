// src/entities/Hero.ts
import {
  Group,
  Vector3
} from "three";
import { COLORS, COMBAT_CONFIG, HERO_PROGRESS, UI_CONFIG } from "@/config/constants";
import { Entity } from "@/entities/Entity";
import { disposeObject3D } from "@/entities/dispose";
import {
  buildAssassinModel,
  buildMageModel,
  buildTankModel
} from "@/entities/heroModels";
import type {
  HealthComponent,
  LifecycleComponent,
  MovementComponent,
  StateComponent
} from "@/entities/components";
import type { Component, HeroConfig, SkillConfig } from "@/types";
import { HeroRole, Team } from "@/types";

export interface HeroStats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  attack: number;
  defense: number;
  moveSpeed: number;
  level: number;
  exp: number;
}

export interface Skill extends SkillConfig {
  cooldownRemaining: number;
}

export enum HeroState {
  IDLE = "IDLE",
  MOVING = "MOVING",
  ATTACKING = "ATTACKING",
  CASTING = "CASTING",
  DEAD = "DEAD"
}

export interface CombatComponentData extends Component {
  type: "combat";
  attackDamage: number;
  attackRange: number;
  attackSpeed: number;
  cooldownRemaining: number;
  targetId: string | null;
}

export { Team };

export class Hero extends Entity {
  public readonly team: Team;
  public readonly heroId: string;
  public readonly skills: Skill[];
  public readonly stats: HeroStats;
  public state: HeroState;
  private readonly modelGroup: Group;

  public constructor(config: HeroConfig, team: Team, position: Vector3 = new Vector3()) {
    super(position);
    this.team = team;
    this.heroId = config.id;
    this.state = HeroState.IDLE;
    this.stats = {
      hp: config.stats.hp,
      maxHp: config.stats.hp,
      mana: config.stats.mana,
      maxMana: config.stats.mana,
      attack: config.stats.attack,
      defense: config.stats.defense,
      moveSpeed: config.stats.moveSpeed,
      level: HERO_PROGRESS.startingLevel,
      exp: HERO_PROGRESS.startingExp
    };
    this.skills = config.skills.slice(0, UI_CONFIG.hudSkillCount).map((skill) => ({
      ...skill,
      cooldownRemaining: 0
    }));

    const emissiveColor = team === Team.BLUE ? COLORS.blueEmissive : COLORS.redEmissive;

    if (config.role === HeroRole.TANK) {
      this.modelGroup = buildTankModel(config.colorHex, emissiveColor);
    } else if (config.role === HeroRole.ASSASSIN) {
      this.modelGroup = buildAssassinModel(config.colorHex, emissiveColor);
    } else {
      this.modelGroup = buildMageModel(config.colorHex, emissiveColor);
    }

    this.modelGroup.position.copy(this.position);
    this.modelGroup.position.y = 0;
    this.mesh = this.modelGroup;

    this.addComponent({ type: "identity", kind: "hero" });
    this.addComponent({ type: "team", team });
    this.addComponent<HealthComponent>({
      type: "health",
      hp: this.stats.hp,
      maxHp: this.stats.maxHp,
      defense: this.stats.defense,
      isDead: false
    });
    this.addComponent<MovementComponent>({
      type: "movement",
      targetPosition: null,
      moveSpeed: this.stats.moveSpeed,
      isMoving: false
    });
    this.addComponent<CombatComponentData>({
      type: "combat",
      attackDamage: this.stats.attack,
      attackRange: COMBAT_CONFIG.heroAttackRange,
      attackSpeed: COMBAT_CONFIG.heroAttackSpeed,
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
   * Applies direct damage to this hero and updates health components.
   */
  public takeDamage(amount: number): void {
    const health = this.getComponent<HealthComponent>("health");
    if (!health || health.isDead) {
      return;
    }

    const mitigatedDamage = Math.max(COMBAT_CONFIG.minimumDamage, amount - health.defense);
    health.hp = Math.max(0, health.hp - mitigatedDamage);
    this.stats.hp = health.hp;
    if (health.hp <= 0) {
      health.isDead = true;
      this.state = HeroState.DEAD;
      const state = this.getComponent<StateComponent>("state");
      if (state) {
        state.state = HeroState.DEAD;
      }
    }
  }

  /**
   * Restores hero health up to the current maximum.
   */
  public heal(amount: number): void {
    const health = this.getComponent<HealthComponent>("health");
    if (!health || health.isDead) {
      return;
    }

    health.hp = Math.min(health.maxHp, health.hp + amount);
    this.stats.hp = health.hp;
  }

  /**
   * Raises hero level and applies baseline stat growth.
   */
  public levelUp(): void {
    this.stats.level += 1;
    this.stats.maxHp += HERO_PROGRESS.hpPerLevel;
    this.stats.maxMana += HERO_PROGRESS.manaPerLevel;
    this.stats.attack += HERO_PROGRESS.attackPerLevel;
    this.stats.defense += HERO_PROGRESS.defensePerLevel;
    this.stats.hp = this.stats.maxHp;
    this.stats.mana = this.stats.maxMana;

    const health = this.getComponent<HealthComponent>("health");
    const movement = this.getComponent<MovementComponent>("movement");
    const combat = this.getComponent<CombatComponentData>("combat");
    if (health) {
      health.maxHp = this.stats.maxHp;
      health.hp = this.stats.hp;
      health.defense = this.stats.defense;
    }
    if (movement) {
      movement.moveSpeed = this.stats.moveSpeed;
    }
    if (combat) {
      combat.attackDamage = this.stats.attack;
    }
  }

  /**
   * Attempts to activate a skill against a world-space target.
   */
  public useSkill(index: number, target: Vector3): boolean {
    const skill = this.skills[index];
    if (!skill || skill.cooldownRemaining > 0 || this.stats.mana < skill.manaCost) {
      return false;
    }

    this.stats.mana -= skill.manaCost;
    skill.cooldownRemaining = skill.cooldown;
    this.state = HeroState.CASTING;
    const state = this.getComponent<StateComponent>("state");
    if (state) {
      state.state = HeroState.CASTING;
    }

    const movement = this.getComponent<MovementComponent>("movement");
    if (movement) {
      movement.targetPosition = target.clone();
    }
    return true;
  }

  /**
   * Synchronizes hero visual state and skill cooldown timers.
   */
  public update(delta: number): void {
    const health = this.getComponent<HealthComponent>("health");
    const state = this.getComponent<StateComponent>("state");
    if (health) {
      this.stats.hp = health.hp;
      if (health.isDead) {
        this.state = HeroState.DEAD;
      }
    }
    if (state && this.isHeroState(state.state)) {
      this.state = state.state;
    }

    for (const skill of this.skills) {
      skill.cooldownRemaining = Math.max(0, skill.cooldownRemaining - delta);
    }

    if (this.mesh) {
      this.mesh.position.x = this.position.x;
      this.mesh.position.z = this.position.z;
      this.mesh.position.y = 0;
      this.mesh.rotation.copy(this.rotation);
      this.mesh.visible = this.state !== HeroState.DEAD;
    }
  }

  /**
   * Disposes all geometry and material resources owned by this hero.
   */
  public dispose(): void {
    if (this.mesh) {
      disposeObject3D(this.mesh);
      this.mesh.removeFromParent();
      this.mesh = null;
      return;
    }
  }

  private isHeroState(state: string): state is HeroState {
    return (
      state === HeroState.IDLE ||
      state === HeroState.MOVING ||
      state === HeroState.ATTACKING ||
      state === HeroState.CASTING ||
      state === HeroState.DEAD
    );
  }
}
