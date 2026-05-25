// src/systems/MovementSystem.ts
import { MathUtils, Vector3 } from "three";
import { ENTITY_CONFIG, MAP_BOUNDS } from "@/config/constants";
import type {
  IdentityComponent,
  MovementComponent,
  StateComponent
} from "@/entities/components";
import type { Entity } from "@/entities/Entity";
import type { System } from "@/types";

export class MovementSystem implements System {
  private readonly direction: Vector3;

  public constructor() {
    this.direction = new Vector3();
  }

  /**
   * Moves entities toward movement component targets and clamps them to map bounds.
   */
  public update(delta: number, entities: readonly Entity[]): void {
    for (const entity of entities) {
      const movement = entity.getComponent<MovementComponent>("movement");
      const state = entity.getComponent<StateComponent>("state");
      if (!movement?.targetPosition || state?.state === "DEAD" || state?.state === "DESTROYED") {
        continue;
      }

      this.direction.copy(movement.targetPosition).sub(entity.position);
      this.direction.y = 0;
      const distance = this.direction.length();
      if (distance < ENTITY_CONFIG.targetStopDistance) {
        movement.targetPosition = null;
        movement.isMoving = false;
        this.setIdleState(entity);
        continue;
      }

      this.direction.normalize();
      const alpha = Math.min(1, (movement.moveSpeed * delta) / distance);
      entity.position.lerp(movement.targetPosition, alpha);
      entity.position.x = MathUtils.clamp(entity.position.x, MAP_BOUNDS.minX, MAP_BOUNDS.maxX);
      entity.position.z = MathUtils.clamp(entity.position.z, MAP_BOUNDS.minZ, MAP_BOUNDS.maxZ);
      entity.rotation.y = Math.atan2(this.direction.x, this.direction.z);
      movement.isMoving = true;

      if (state && state.state !== "CASTING") {
        const identity = entity.getComponent<IdentityComponent>("identity");
        state.state = identity?.kind === "minion" ? "WALKING" : "MOVING";
      }
      if (entity.mesh) {
        entity.mesh.rotation.y = entity.rotation.y;
      }
    }
  }

  private setIdleState(entity: Entity): void {
    const state = entity.getComponent<StateComponent>("state");
    if (!state || state.state === "DEAD" || state.state === "DESTROYED") {
      return;
    }

    const identity = entity.getComponent<IdentityComponent>("identity");
    state.state = identity?.kind === "minion" ? "WALKING" : "IDLE";
  }
}
