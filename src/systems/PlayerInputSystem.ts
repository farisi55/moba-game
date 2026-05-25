// src/systems/PlayerInputSystem.ts
import { Vector3 } from "three";
import { INPUT_CONFIG } from "@/config/constants";
import { InputManager } from "@/core/InputManager";
import type { MovementComponent } from "@/entities/components";
import type { Entity } from "@/entities/Entity";
import type { System } from "@/types";

type EntityProvider = () => Entity | null;

export class PlayerInputSystem implements System {
  private readonly input: InputManager;
  private readonly getControlledEntity: EntityProvider;
  private readonly direction: Vector3;

  public constructor(input: InputManager, getControlledEntity: EntityProvider) {
    this.input = input;
    this.getControlledEntity = getControlledEntity;
    this.direction = new Vector3();
  }

  /**
   * Converts held WASD keys into movement component target updates.
   */
  public update(_delta: number, _entities: readonly Entity[]): void {
    const entity = this.getControlledEntity();
    if (!entity) {
      return;
    }

    const movement = entity.getComponent<MovementComponent>("movement");
    if (!movement) {
      return;
    }

    this.direction.set(0, 0, 0);
    if (this.input.isKeyDown("w")) {
      this.direction.z -= 1;
    }
    if (this.input.isKeyDown("s")) {
      this.direction.z += 1;
    }
    if (this.input.isKeyDown("a")) {
      this.direction.x -= 1;
    }
    if (this.input.isKeyDown("d")) {
      this.direction.x += 1;
    }

    if (this.direction.lengthSq() === 0) {
      return;
    }

    this.direction.normalize().multiplyScalar(INPUT_CONFIG.keyboardMoveLeadDistance);
    movement.targetPosition = entity.position.clone().add(this.direction);
  }
}
