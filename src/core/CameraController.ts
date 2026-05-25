// src/core/CameraController.ts
import { OrthographicCamera, Vector3 } from 'three'
import type { Hero } from '@/entities/Hero'

const LERP_SPEED = 4
const CAMERA_OFFSET = new Vector3(20, 20, 20)

export class CameraController {
  private readonly camera: OrthographicCamera
  private target: Hero | null = null
  private readonly offset: Vector3

  public constructor(camera: OrthographicCamera) {
    this.camera = camera
    this.offset = CAMERA_OFFSET.clone()
  }

  /** Set hero yang diikuti kamera */
  public setTarget(hero: Hero): void {
    this.target = hero
  }

  /** Panggil setiap tick dari updateHud interval */
  public update(delta: number): void {
    if (!this.target) return
    const heroPos = this.target.position
    const desired = new Vector3(
      heroPos.x + this.offset.x,
      heroPos.y + this.offset.y,
      heroPos.z + this.offset.z
    )
    this.camera.position.lerp(desired, LERP_SPEED * delta)
    this.camera.lookAt(heroPos.clone())
  }
}
