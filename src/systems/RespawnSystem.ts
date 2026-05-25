// src/systems/RespawnSystem.ts
import type {
  HealthComponent,
  LifecycleComponent,
  MovementComponent,
  StateComponent
} from "@/entities/components";
import type { Entity } from "@/entities/Entity";
import { Hero, HeroState } from "@/entities/Hero";
import { RESPAWN_CONFIG } from "@/config/constants";
import type { System } from "@/types";
import { Vector3 } from "three";

type RespawnRegistration = {
  spawnPoint: Vector3;
  remainingSeconds: number;
  isCounting: boolean;
};

export class RespawnSystem implements System {
  private readonly registrations: Map<string, RespawnRegistration>;

  public constructor() {
    this.registrations = new Map<string, RespawnRegistration>();
  }

  /**
   * Registers a hero spawn point without retaining the hero object.
   */
  public registerHero(hero: Hero, spawnPoint: Vector3): void {
    if (this.registrations.has(hero.id)) {
      return;
    }

    this.registrations.set(hero.id, {
      spawnPoint: spawnPoint.clone(),
      remainingSeconds: RESPAWN_CONFIG.heroRespawnSeconds,
      isCounting: false
    });
  }

  /**
   * Counts down dead registered heroes and respawns them at their spawn points.
   */
  public update(delta: number, entities: readonly Entity[]): void {
    for (const entity of entities) {
      const registration = this.registrations.get(entity.id);
      if (!registration || !(entity instanceof Hero)) {
        continue;
      }

      const health = entity.getComponent<HealthComponent>("health");
      if (!health?.isDead) {
        registration.isCounting = false;
        registration.remainingSeconds = RESPAWN_CONFIG.heroRespawnSeconds;
        continue;
      }

      if (!registration.isCounting) {
        registration.isCounting = true;
        registration.remainingSeconds = RESPAWN_CONFIG.heroRespawnSeconds;
      }

      registration.remainingSeconds -= delta;
      if (registration.remainingSeconds <= 0) {
        this.respawnHero(entity, registration.spawnPoint);
        registration.isCounting = false;
        registration.remainingSeconds = RESPAWN_CONFIG.heroRespawnSeconds;
      }
    }
  }

  private respawnHero(hero: Hero, spawnPoint: Vector3): void {
    const health = hero.getComponent<HealthComponent>("health");
    const movement = hero.getComponent<MovementComponent>("movement");
    const state = hero.getComponent<StateComponent>("state");
    const lifecycle = hero.getComponent<LifecycleComponent>("lifecycle");

    if (health) {
      health.hp = health.maxHp;
      health.isDead = false;
      hero.stats.hp = health.maxHp;
    }
    hero.stats.mana = hero.stats.maxMana;
    hero.position.copy(spawnPoint);
    hero.rotation.set(0, 0, 0);
    hero.state = HeroState.IDLE;

    if (movement) {
      movement.targetPosition = null;
      movement.isMoving = false;
    }
    if (state) {
      state.state = HeroState.IDLE;
    }
    if (lifecycle) {
      lifecycle.shouldDispose = false;
      lifecycle.disposed = false;
    }
    if (hero.mesh) {
      hero.mesh.visible = true;
    }
  }
}
