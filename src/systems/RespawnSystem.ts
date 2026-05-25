// src/systems/RespawnSystem.ts
import { Vector3 } from 'three'
import { RESPAWN_CONFIG } from '@/config/constants'
import type { HealthComponent, LifecycleComponent, MovementComponent, StateComponent } from '@/entities/components'
import { Hero, HeroState } from '@/entities/Hero'
import type { Entity } from '@/entities/Entity'
import type { System } from '@/types'

interface RespawnEntry {
  hero: Hero
  timer: number
  spawnPoint: Vector3
}

export class RespawnSystem implements System {
  private readonly queue: RespawnEntry[] = []

  /** Register hero agar otomatis respawn saat mati */
  public registerHero(hero: Hero, spawnPoint: Vector3): void {
    if (this.queue.some((e) => e.hero.id === hero.id)) return
    this.queue.push({
      hero,
      timer: RESPAWN_CONFIG.heroRespawnSeconds,
      spawnPoint: spawnPoint.clone()
    })
  }

  public update(delta: number, _entities: readonly Entity[]): void {
    for (const entry of this.queue) {
      const health = entry.hero.getComponent<HealthComponent>('health')
      if (!health?.isDead) continue

      entry.timer -= delta
      if (entry.timer > 0) continue

      // Reset health
      health.isDead = false
      health.hp = health.maxHp
      entry.hero.stats.hp = health.maxHp
      entry.hero.stats.mana = entry.hero.stats.maxMana
      entry.hero.state = HeroState.IDLE

      const state = entry.hero.getComponent<StateComponent>('state')
      if (state) state.state = HeroState.IDLE

      const movement = entry.hero.getComponent<MovementComponent>('movement')
      if (movement) {
        movement.targetPosition = null
        movement.isMoving = false
      }

      const lifecycle = entry.hero.getComponent<LifecycleComponent>('lifecycle')
      if (lifecycle) {
        lifecycle.shouldDispose = false
        lifecycle.disposed = false
      }

      // Teleport ke spawn
      entry.hero.position.copy(entry.spawnPoint)
      if (entry.hero.mesh) {
        entry.hero.mesh.position.copy(entry.spawnPoint)
        entry.hero.mesh.visible = true
      }

      // Reset timer untuk kematian berikutnya
      entry.timer = RESPAWN_CONFIG.heroRespawnSeconds
    }
  }
}
