// src/ui/DamagePopup.ts
import { OrthographicCamera, Vector3 } from 'three'
import { DAMAGE_NUMBER_CONFIG } from '@/config/constants'

interface PopupEntry {
  el: HTMLElement
  worldPos: Vector3
  age: number
  lifetime: number
  startY: number
}

export class DamagePopup {
  private readonly container: HTMLElement
  private readonly camera: OrthographicCamera
  private readonly active: PopupEntry[] = []

  public constructor(container: HTMLElement, camera: OrthographicCamera) {
    this.container = container
    this.camera = camera
  }

  /**
   * Spawn a damage number at a world position.
   * isCrit makes it larger and white.
   */
  public spawn(worldPos: Vector3, amount: number, isCrit: boolean = false): void {
    const el = document.createElement('div')
    el.style.cssText = [
      'position:absolute',
      'pointer-events:none',
      'user-select:none',
      `font-size:${isCrit ? DAMAGE_NUMBER_CONFIG.critFontSize : DAMAGE_NUMBER_CONFIG.fontSize}`,
      `color:${isCrit ? '#ffffff' : '#f5c842'}`,
      'font-family:Cinzel,serif',
      'font-weight:700',
      'text-shadow:0 1px 4px #000',
      'transition:none',
      'white-space:nowrap',
    ].join(';')
    el.textContent = isCrit ? `${amount}!` : String(amount)
    this.container.appendChild(el)

    this.active.push({
      el,
      worldPos: worldPos.clone(),
      age: 0,
      lifetime: DAMAGE_NUMBER_CONFIG.lifetime,
      startY: worldPos.y,
    })
  }

  /** Call every HUD tick (pass delta in seconds) */
  public update(delta: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const entry = this.active[i]
      if (!entry) continue
      entry.age += delta

      const t = entry.age / entry.lifetime
      if (t >= 1) {
        entry.el.remove()
        this.active.splice(i, 1)
        continue
      }

      // Rise and fade
      const riseOffset = entry.age * DAMAGE_NUMBER_CONFIG.riseSpeed
      const screenY = entry.worldPos.clone()
      screenY.y = entry.startY + riseOffset
      const screen = this.worldToScreen(screenY)
      if (!screen) { entry.el.style.display = 'none'; continue }

      entry.el.style.display = 'block'
      entry.el.style.left = `${screen.x}px`
      entry.el.style.top = `${screen.y}px`
      entry.el.style.opacity = String(1 - t * t)
    }
  }

  public dispose(): void {
    for (const entry of this.active) entry.el.remove()
    this.active.length = 0
  }

  private worldToScreen(pos: Vector3): { x: number; y: number } | null {
    const v = pos.clone().project(this.camera)
    if (v.z > 1) return null
    return {
      x: ((v.x + 1) / 2) * window.innerWidth,
      y: ((-v.y + 1) / 2) * window.innerHeight,
    }
  }
}
