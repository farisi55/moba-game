// src/ui/ClickIndicator.ts
import {
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  Scene
} from 'three'

const RING_INNER = 0.3
const RING_OUTER = 0.5
const RING_SEGMENTS = 32
const FADE_SPEED = 2.5

export class ClickIndicator {
  private readonly mesh: Mesh
  private opacity: number = 0
  private active: boolean = false

  public constructor(scene: Scene) {
    const geo = new RingGeometry(RING_INNER, RING_OUTER, RING_SEGMENTS)
    const mat = new MeshBasicMaterial({
      color: 0xc9a84c,
      transparent: true,
      opacity: 0,
      depthWrite: false
    })
    this.mesh = new Mesh(geo, mat)
    this.mesh.rotation.x = -Math.PI / 2
    this.mesh.position.y = 0.05
    this.mesh.visible = false
    scene.add(this.mesh)
  }

  /** Show ring at world position (call on right-click move) */
  public show(x: number, z: number): void {
    this.mesh.position.set(x, 0.05, z)
    this.opacity = 1
    this.active = true
    this.mesh.visible = true
    ;(this.mesh.material as MeshBasicMaterial).opacity = 1
  }

  /** Call every frame to fade out the ring */
  public update(delta: number): void {
    if (!this.active) return
    this.opacity = Math.max(0, this.opacity - FADE_SPEED * delta)
    ;(this.mesh.material as MeshBasicMaterial).opacity = this.opacity
    if (this.opacity <= 0) {
      this.active = false
      this.mesh.visible = false
    }
  }

  public dispose(): void {
    this.mesh.geometry.dispose()
    ;(this.mesh.material as MeshBasicMaterial).dispose()
    this.mesh.removeFromParent()
  }
}
