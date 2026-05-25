// src/ui/SkillEffect.ts
import {
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  Scene,
  Vector3,
} from 'three'

interface EffectEntry {
  mesh: Mesh
  age: number
  lifetime: number
  maxScale: number
  mat: MeshBasicMaterial
  geo: RingGeometry
}

const EFFECT_LIFETIME = 0.5
const EFFECT_MAX_SCALE = 3.5
const EFFECT_COLOR = 0xc9a84c

export class SkillEffect {
  private readonly scene: Scene
  private readonly pool: EffectEntry[] = []

  public constructor(scene: Scene) {
    this.scene = scene
  }

  /** Call when player uses a skill — shows expanding ring at world target */
  public spawn(worldPos: Vector3): void {
    const geo = new RingGeometry(0.1, 0.4, 32)
    const mat = new MeshBasicMaterial({
      color: EFFECT_COLOR,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    })
    const mesh = new Mesh(geo, mat)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(worldPos.x, 0.06, worldPos.z)
    mesh.scale.setScalar(0.1)
    this.scene.add(mesh)
    this.pool.push({ mesh, age: 0, lifetime: EFFECT_LIFETIME, maxScale: EFFECT_MAX_SCALE, mat, geo })
  }

  /** Call every game tick (implements-compatible, pass delta) */
  public update(delta: number): void {
    for (let i = this.pool.length - 1; i >= 0; i--) {
      const e = this.pool[i]
      if (!e) continue
      e.age += delta
      const t = Math.min(e.age / e.lifetime, 1)
      e.mesh.scale.setScalar(0.1 + t * e.maxScale)
      e.mat.opacity = 1 - t
      if (t >= 1) {
        e.geo.dispose()
        e.mat.dispose()
        e.mesh.removeFromParent()
        this.pool.splice(i, 1)
      }
    }
  }

  public dispose(): void {
    for (const e of this.pool) {
      e.geo.dispose()
      e.mat.dispose()
      e.mesh.removeFromParent()
    }
    this.pool.length = 0
  }
}
