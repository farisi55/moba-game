// src/core/CameraController.ts
import { OrthographicCamera, Vector3 } from "three";
import { CAMERA_CONFIG } from "@/config/constants";
import type { Entity } from "@/entities/Entity";

const FOLLOW_LERP_SPEED = 5;

export class CameraController {
  private readonly camera: OrthographicCamera;
  private readonly offset: Vector3;
  private readonly desiredPosition: Vector3;
  private readonly lookTarget: Vector3;
  private target: Entity | null;

  public constructor(camera: OrthographicCamera) {
    this.camera = camera;
    this.offset = CAMERA_CONFIG.position.clone();
    this.desiredPosition = new Vector3();
    this.lookTarget = new Vector3();
    this.target = null;
  }

  /**
   * Sets the entity that the camera should smoothly follow.
   */
  public setTarget(target: Entity | null): void {
    this.target = target;
    if (target) {
      this.desiredPosition.copy(target.position).add(this.offset);
      this.camera.position.copy(this.desiredPosition);
      this.camera.lookAt(target.position);
    }
  }

  /**
   * Updates camera position and look target for the current render frame.
   */
  public update(delta: number): void {
    if (!this.target) {
      return;
    }

    this.lookTarget.copy(this.target.position);
    this.desiredPosition.copy(this.lookTarget).add(this.offset);
    this.camera.position.lerp(this.desiredPosition, Math.min(1, FOLLOW_LERP_SPEED * delta));
    this.camera.lookAt(this.lookTarget);
  }
}
