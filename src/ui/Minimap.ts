// src/ui/Minimap.ts
import type { Entity } from '@/entities/Entity'
import type { HealthComponent, IdentityComponent, TeamComponent } from '@/entities/components'
import { Team } from '@/types'

const MAP_WORLD_SIZE = 100
const MM_SIZE = 130
const PADDING = 8

export class Minimap {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly container: HTMLElement

  public constructor() {
    this.container = document.createElement('div')
    this.container.style.cssText = [
      'position:fixed',
      'bottom:100px',
      'right:24px',
      `width:${MM_SIZE}px`,
      `height:${MM_SIZE}px`,
      'border:1px solid rgba(201,168,76,0.5)',
      'background:rgba(8,10,24,0.85)',
      'pointer-events:none',
      'z-index:10',
      'border-radius:2px',
    ].join(';')

    this.canvas = document.createElement('canvas')
    this.canvas.width = MM_SIZE
    this.canvas.height = MM_SIZE
    this.canvas.style.cssText = 'width:100%;height:100%;display:block;'
    this.container.appendChild(this.canvas)
    document.body.appendChild(this.container)

    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('Minimap requires a 2D canvas context')
    this.ctx = ctx
  }

  /** Convert world coordinate to minimap pixel */
  private worldToMM(worldX: number, worldZ: number): { x: number; y: number } {
    const half = MAP_WORLD_SIZE / 2
    const x = PADDING + ((worldX + half) / MAP_WORLD_SIZE) * (MM_SIZE - PADDING * 2)
    const y = PADDING + ((worldZ + half) / MAP_WORLD_SIZE) * (MM_SIZE - PADDING * 2)
    return { x, y }
  }

  /** Call every HUD tick with current entity list */
  public update(entities: readonly Entity[], localHeroId: string | null): void {
    const { ctx } = this
    ctx.clearRect(0, 0, MM_SIZE, MM_SIZE)

    // Background
    ctx.fillStyle = 'rgba(10,12,30,0.9)'
    ctx.fillRect(0, 0, MM_SIZE, MM_SIZE)

    // River diagonal
    ctx.strokeStyle = '#1a2848'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(0, MM_SIZE)
    ctx.lineTo(MM_SIZE, 0)
    ctx.stroke()

    // Lane lines (approximate diagonal for MID)
    ctx.strokeStyle = '#2a3050'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(PADDING, PADDING)
    ctx.lineTo(MM_SIZE - PADDING, MM_SIZE - PADDING)
    ctx.stroke()
    ctx.setLineDash([])

    // Entities
    for (const entity of entities) {
      const health = entity.getComponent<HealthComponent>('health')
      const identity = entity.getComponent<IdentityComponent>('identity')
      const teamComp = entity.getComponent<TeamComponent>('team')
      if (!health || !identity || !teamComp || health.isDead) continue

      const { x, y } = this.worldToMM(entity.position.x, entity.position.z)
      const isLocal = entity.id === localHeroId
      const isBlue = teamComp.team === Team.BLUE

      let radius = 2.5
      let color = isBlue ? '#3d7eff' : '#d64b4b'

      if (identity.kind === 'tower') {
        radius = 4
        color = isBlue ? '#6699ff' : '#ff6666'
      } else if (identity.kind === 'hero') {
        radius = isLocal ? 5.5 : 4
        color = isLocal ? '#ffffff' : color
      }

      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()

      if (isLocal) {
        ctx.strokeStyle = '#c9a84c'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    }

    // Border overlay
    ctx.strokeStyle = 'rgba(201,168,76,0.35)'
    ctx.lineWidth = 1
    ctx.strokeRect(0.5, 0.5, MM_SIZE - 1, MM_SIZE - 1)
  }

  public dispose(): void {
    this.container.remove()
  }
}
