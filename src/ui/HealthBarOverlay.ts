// src/ui/HealthBarOverlay.ts
import { OrthographicCamera, Vector3 } from 'three'
import type { Entity } from '@/entities/Entity'
import type { HealthComponent, IdentityComponent, TeamComponent } from '@/entities/components'
import { Team } from '@/types'

const BAR_WIDTH = 48
const BAR_HEIGHT = 6
const BAR_OFFSET_Y = -28

interface BarEntry { el: HTMLElement; entityId: string }

export class HealthBarOverlay {
  private readonly container: HTMLElement
  private readonly camera: OrthographicCamera
  private readonly bars = new Map<string, BarEntry>()

  public constructor(container: HTMLElement, camera: OrthographicCamera) {
    this.container = container
    this.camera = camera
    this.container.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;'
  }

  /** Call every HUD tick to sync bar positions and fill values */
  public update(entities: readonly Entity[]): void {
    const seen = new Set<string>()

    for (const entity of entities) {
      const health = entity.getComponent<HealthComponent>('health')
      const identity = entity.getComponent<IdentityComponent>('identity')
      const teamComp = entity.getComponent<TeamComponent>('team')
      if (!health || !identity || !teamComp) continue
      if (health.isDead) { this.removeBar(entity.id); continue }

      seen.add(entity.id)
      let entry = this.bars.get(entity.id)
      if (!entry) {
        const color = teamComp.team === Team.BLUE ? '#3d7eff' : '#d64b4b'
        entry = this.createBar(entity.id, color)
        this.bars.set(entity.id, entry)
      }

      const screen = this.worldToScreen(entity.position)
      if (!screen) { entry.el.style.display = 'none'; continue }

      const ratio = Math.max(0, health.hp / health.maxHp)
      entry.el.style.display = 'block'
      entry.el.style.left = `${screen.x - BAR_WIDTH / 2}px`
      entry.el.style.top = `${screen.y + BAR_OFFSET_Y}px`
      const fill = entry.el.querySelector<HTMLElement>('.hb-fill')
      if (fill) fill.style.width = `${ratio * 100}%`
    }

    for (const [id] of this.bars) {
      if (!seen.has(id)) this.removeBar(id)
    }
  }

  public dispose(): void {
    for (const [id] of this.bars) this.removeBar(id)
  }

  private createBar(entityId: string, color: string): BarEntry {
    const el = document.createElement('div')
    el.dataset.entity = entityId
    el.style.cssText = `position:absolute;width:${BAR_WIDTH}px;height:${BAR_HEIGHT}px;` +
      `background:#1a1a2e;border:1px solid #333;border-radius:2px;overflow:hidden;`
    const fill = document.createElement('div')
    fill.className = 'hb-fill'
    fill.style.cssText = `height:100%;width:100%;background:${color};transition:width 0.1s linear;`
    el.appendChild(fill)
    this.container.appendChild(el)
    return { el, entityId }
  }

  private removeBar(entityId: string): void {
    const entry = this.bars.get(entityId)
    if (entry) { entry.el.remove(); this.bars.delete(entityId) }
  }

  private worldToScreen(worldPos: Vector3): { x: number; y: number } | null {
    const vec = worldPos.clone().project(this.camera)
    if (vec.z > 1) return null
    return {
      x: ((vec.x + 1) / 2) * window.innerWidth,
      y: ((-vec.y + 1) / 2) * window.innerHeight
    }
  }
}
