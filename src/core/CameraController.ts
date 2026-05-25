// src/core/CameraController.ts
import { OrthographicCamera, Vector3 } from 'three'
import type { Entity } from '@/entities/Entity'
import type { Hero } from '@/entities/Hero'
import type { System } from '@/types'

const LERP_SPEED = 6
const CAMERA_OFFSET = new Vector3(20, 20, 20)

export class CameraController implements System {
  private readonly camera: OrthographicCamera
  private target: Hero | null = null
  private readonly offset: Vector3
  private readonly _desired: Vector3
  private readonly _lookAt: Vector3

  public constructor(camera: OrthographicCamera) {
    this.camera = camera
    this.offset = CAMERA_OFFSET.clone()
    this._desired = new Vector3()
    this._lookAt = new Vector3()
  }

  /** Set the hero the camera should follow */
  public setTarget(hero: Hero): void {
    this.target = hero
    // Snap immediately on first set — no lerp lag at match start
    const pos = hero.position
    this.camera.position.set(
      pos.x + this.offset.x,
      pos.y + this.offset.y,
      pos.z + this.offset.z
    )
    this.camera.lookAt(pos.x, pos.y, pos.z)
    this.camera.updateProjectionMatrix()
  }

  /** Called every fixed tick by GameEngine — implements System */
  public update(delta: number, _entities: readonly Entity[]): void {
    if (!this.target) return

    const heroPos = this.target.position
    this._desired.set(
      heroPos.x + this.offset.x,
      heroPos.y + this.offset.y,
      heroPos.z + this.offset.z
    )

    this.camera.position.lerp(this._desired, LERP_SPEED * delta)
    this._lookAt.copy(heroPos)
    this.camera.lookAt(this._lookAt)
    this.camera.updateProjectionMatrix()
  }
}
