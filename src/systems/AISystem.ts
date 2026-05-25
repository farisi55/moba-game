// src/systems/AISystem.ts
import { AI_CONFIG } from "@/config/constants";
import type {
  AIComponent,
  HealthComponent,
  IdentityComponent,
  MovementComponent,
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

export enum BotAIState {
  LANE_WALK = "LANE_WALK",
  ATTACK_MINION = "ATTACK_MINION",
  ATTACK_HERO = "ATTACK_HERO",
  RETREAT = "RETREAT",
  PUSH_TOWER = "PUSH_TOWER"
}

export class AISystem implements System {
  private elapsedSinceDecision: number;

  public constructor() {
    this.elapsedSinceDecision = 0;
  }

  /**
   * Runs bot decisions at a fixed low frequency to reduce per-frame work.
   */
  public update(delta: number, entities: readonly Entity[]): void {
    this.elapsedSinceDecision += delta;
    if (this.elapsedSinceDecision < AI_CONFIG.updateInterval) {
      return;
    }

    this.elapsedSinceDecision = 0;
    for (const entity of entities) {
      const ai = entity.getComponent<AIComponent>("ai");
      const health = entity.getComponent<HealthComponent>("health");
      const movement = entity.getComponent<MovementComponent>("movement");
      const combat = entity.getComponent<CombatComponentData>("combat");
      if (!ai || !health || !movement || !combat || health.isDead) {
        continue;
      }

      const healthRatio = health.hp / health.maxHp;
      if (healthRatio < AI_CONFIG.lowHealthRatio) {
        this.retreat(ai, movement, combat);
        continue;
      }

      const enemyHero = this.findNearestEnemy(entity, entities, "hero", AI_CONFIG.heroDetectionRange);
      if (enemyHero) {
        this.attackTarget(entity, enemyHero.id, enemyHero.position, ai, movement, combat, BotAIState.ATTACK_HERO);
        continue;
      }

      const enemyMinion = this.findNearestEnemy(entity, entities, "minion", AI_CONFIG.minionDetectionRange);
      if (enemyMinion) {
        this.attackTarget(entity, enemyMinion.id, enemyMinion.position, ai, movement, combat, BotAIState.ATTACK_MINION);
        continue;
      }

      const enemyTower = this.findNearestEnemy(entity, entities, "tower", AI_CONFIG.towerDetectionRange);
      if (enemyTower) {
        this.attackTarget(entity, enemyTower.id, enemyTower.position, ai, movement, combat, BotAIState.PUSH_TOWER);
        continue;
      }

      this.followLane(entity, ai, movement, combat);
    }
  }

  private retreat(ai: AIComponent, movement: MovementComponent, combat: CombatComponentData): void {
    ai.state = BotAIState.RETREAT;
    combat.targetId = null;
    movement.targetPosition = ai.retreatPosition.clone();
  }

  private attackTarget(
    entity: Entity,
    targetId: string,
    targetPosition: Entity["position"],
    ai: AIComponent,
    movement: MovementComponent,
    combat: CombatComponentData,
    state: BotAIState
  ): void {
    ai.state = state;
    combat.targetId = targetId;
    const distance = entity.position.distanceTo(targetPosition);
    movement.targetPosition = distance <= combat.attackRange ? null : targetPosition.clone();

    const stateComponent = entity.getComponent<StateComponent>("state");
    if (stateComponent && stateComponent.state !== "DEAD" && stateComponent.state !== "DESTROYED") {
      stateComponent.state = distance <= combat.attackRange ? "ATTACKING" : "MOVING";
    }
  }

  private followLane(entity: Entity, ai: AIComponent, movement: MovementComponent, combat: CombatComponentData): void {
    ai.state = BotAIState.LANE_WALK;
    combat.targetId = null;
    const waypoint = ai.waypoints[ai.currentWaypointIndex];
    if (!waypoint) {
      movement.targetPosition = null;
      return;
    }

    if (entity.position.distanceTo(waypoint) < AI_CONFIG.waypointReachDistance) {
      ai.currentWaypointIndex = Math.min(ai.currentWaypointIndex + 1, ai.waypoints.length);
    }

    const nextWaypoint = ai.waypoints[ai.currentWaypointIndex];
    movement.targetPosition = nextWaypoint ? nextWaypoint.clone() : null;
  }

  private findNearestEnemy(
    source: Entity,
    entities: readonly Entity[],
    kind: IdentityComponent["kind"],
    range: number
  ): Entity | null {
    const sourceTeam = source.getComponent<TeamComponent>("team");
    if (!sourceTeam) {
      return null;
    }

    let nearest: Entity | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const candidate of entities) {
      const identity = candidate.getComponent<IdentityComponent>("identity");
      const team = candidate.getComponent<TeamComponent>("team");
      const health = candidate.getComponent<HealthComponent>("health");
      if (!identity || !team || !health || health.isDead || identity.kind !== kind || team.team === sourceTeam.team) {
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
}
