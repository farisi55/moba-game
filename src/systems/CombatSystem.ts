// src/systems/CombatSystem.ts
import { COMBAT_CONFIG } from "@/config/constants";
import { eventBus } from "@/core/EventBus";
import type {
  HealthComponent,
  IdentityComponent,
  LifecycleComponent,
  StateComponent,
  TeamComponent
} from "@/entities/components";
import type { Entity } from "@/entities/Entity";
import type { Component, System } from "@/types";

interface CombatComponentData extends Component {
  type: "combat";
  attackDamage: number;
  attackRange: number;
  attackSpeed: number;
  cooldownRemaining: number;
  targetId: string | null;
}

export class CombatSystem implements System {
  /**
   * Processes attack cooldowns, range checks, damage, and death events.
   */
  public update(delta: number, entities: readonly Entity[]): void {
    const entityById = this.createEntityIndex(entities);
    for (const entity of entities) {
      const combat = entity.getComponent<CombatComponentData>("combat");
      const health = entity.getComponent<HealthComponent>("health");
      if (!combat || !health || health.isDead) {
        continue;
      }

      combat.cooldownRemaining = Math.max(0, combat.cooldownRemaining - delta);
      const target = this.resolveTarget(entity, combat, entities, entityById);
      if (!target) {
        this.setNonAttackingState(entity);
        continue;
      }

      const distance = entity.position.distanceTo(target.position);
      if (distance > combat.attackRange) {
        continue;
      }

      const state = entity.getComponent<StateComponent>("state");
      if (state && state.state !== "DEAD" && state.state !== "DESTROYED") {
        state.state = "ATTACKING";
      }

      if (combat.cooldownRemaining > 0) {
        continue;
      }

      this.applyDamage(entity, target, combat.attackDamage);
      combat.cooldownRemaining = 1 / combat.attackSpeed;
    }
  }

  private createEntityIndex(entities: readonly Entity[]): Map<string, Entity> {
    const entityById = new Map<string, Entity>();
    for (const entity of entities) {
      entityById.set(entity.id, entity);
    }
    return entityById;
  }

  private resolveTarget(
    source: Entity,
    combat: CombatComponentData,
    entities: readonly Entity[],
    entityById: ReadonlyMap<string, Entity>
  ): Entity | null {
    const existingTarget = combat.targetId ? entityById.get(combat.targetId) ?? null : null;
    if (existingTarget && this.isValidTarget(source, existingTarget)) {
      return existingTarget;
    }

    const nextTarget = this.findNearestEnemy(source, entities, combat.attackRange);
    combat.targetId = nextTarget?.id ?? null;
    return nextTarget;
  }

  private applyDamage(attacker: Entity, target: Entity, amount: number): void {
    const targetHealth = target.getComponent<HealthComponent>("health");
    if (!targetHealth || targetHealth.isDead) {
      return;
    }

    const damage = Math.max(COMBAT_CONFIG.minimumDamage, amount - targetHealth.defense);
    targetHealth.hp = Math.max(0, targetHealth.hp - damage);
    if (targetHealth.hp > 0) {
      return;
    }

    targetHealth.isDead = true;
    const targetState = target.getComponent<StateComponent>("state");
    const targetIdentity = target.getComponent<IdentityComponent>("identity");
    const targetTeam = target.getComponent<TeamComponent>("team");
    if (targetState) {
      targetState.state = targetIdentity?.kind === "tower" ? "DESTROYED" : "DEAD";
    }

    const lifecycle = target.getComponent<LifecycleComponent>("lifecycle");
    if (lifecycle) {
      lifecycle.shouldDispose = true;
    }

    if (targetIdentity?.kind === "hero" && targetTeam) {
      eventBus.emit("HERO_DIED", {
        heroId: target.id,
        killerId: attacker.id,
        team: targetTeam.team
      });
    }

    if (targetIdentity?.kind === "tower" && targetTeam) {
      eventBus.emit("TOWER_DESTROYED", {
        towerId: target.id,
        team: targetTeam.team
      });
    }
  }

  private findNearestEnemy(source: Entity, entities: readonly Entity[], range: number): Entity | null {
    let nearest: Entity | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const candidate of entities) {
      if (!this.isValidTarget(source, candidate)) {
        continue;
      }

      const distance = source.position.distanceTo(candidate.position);
      if (distance <= range && distance < nearestDistance) {
        nearest = candidate;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  private isValidTarget(source: Entity, target: Entity): boolean {
    if (source.id === target.id) {
      return false;
    }

    const sourceTeam = source.getComponent<TeamComponent>("team");
    const targetTeam = target.getComponent<TeamComponent>("team");
    const targetHealth = target.getComponent<HealthComponent>("health");
    return Boolean(sourceTeam && targetTeam && sourceTeam.team !== targetTeam.team && targetHealth && !targetHealth.isDead);
  }

  private setNonAttackingState(entity: Entity): void {
    const state = entity.getComponent<StateComponent>("state");
    const identity = entity.getComponent<IdentityComponent>("identity");
    if (!state || state.state === "DEAD" || state.state === "DESTROYED") {
      return;
    }

    if (identity?.kind === "minion") {
      state.state = "WALKING";
      return;
    }

    if (identity?.kind === "tower") {
      state.state = "ACTIVE";
      return;
    }

    state.state = "IDLE";
  }
}
