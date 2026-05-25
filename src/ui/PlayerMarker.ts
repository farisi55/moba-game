// src/ui/PlayerMarker.ts
import {
  ConeGeometry,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Scene
} from 'three'

const CONE_RADIUS = 0.3
const CONE_HEIGHT = 0.6
const CONE_HEIGHT_OFFSET = 2.8

export class PlayerMarker {
  private readonly mesh: Mesh
  private target: Object3D | null = null
  private time: number = 0

  public constructor(scene: Scene) {
    const geo = new ConeGeometry(CONE_RADIUS, CONE_HEIGHT, 8)
    const mat = new MeshBasicMaterial({ color: 0xffffff })
    this.mesh = new Mesh(geo, mat)
    this.mesh.visible = false
    scene.add(this.mesh)
  }

  /** Attach marker to the local hero mesh */
  public attachTo(hero: Object3D): void {
    this.target = hero
    this.mesh.visible = true
  }

  /** Call every frame to bob the marker */
  public update(delta: number): void {
    if (!this.target) return
    this.time += delta * 2
    const bob = Math.sin(this.time) * 0.15
    this.mesh.position.set(
      this.target.position.x,
      this.target.position.y + CONE_HEIGHT_OFFSET + bob,
      this.target.position.z
    )
  }

  public dispose(): void {
    this.mesh.geometry.dispose()
    ;(this.mesh.material as MeshBasicMaterial).dispose()
    this.mesh.removeFromParent()
  }
}
