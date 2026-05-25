// src/ui/GameOverScreen.ts
export interface GameOverStats {
  kills: number
  deaths: number
  duration: number
}

export class GameOverScreen {
  private readonly el: HTMLElement
  private replayCallback: (() => void) | null = null

  public constructor() {
    this.el = document.createElement('div')
    this.el.id = 'game-over'
    this.el.style.cssText =
      'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.85);' +
      'z-index:100;flex-direction:column;align-items:center;justify-content:center;' +
      "font-family:'Cinzel',serif;color:#c9a84c;"
    this.el.innerHTML = `
      <h1 id="go-title" style="font-size:3rem;margin-bottom:1rem;letter-spacing:.2em;text-shadow:0 0 30px #c9a84c88"></h1>
      <p id="go-sub" style="font-size:1rem;color:#aaa;margin-bottom:2rem"></p>
      <button id="go-btn" style="
        padding:12px 40px;border:2px solid #c9a84c;background:transparent;
        color:#c9a84c;font-family:'Cinzel',serif;font-size:1rem;
        cursor:pointer;letter-spacing:.1em;">PLAY AGAIN</button>
    `
    document.body.appendChild(this.el)
    const btn = this.el.querySelector<HTMLButtonElement>('#go-btn')
    btn?.addEventListener('click', () => this.replayCallback?.())
    btn?.addEventListener('mouseenter', () => { if (btn) btn.style.background = '#c9a84c22' })
    btn?.addEventListener('mouseleave', () => { if (btn) btn.style.background = 'transparent' })
  }

  public show(isVictory: boolean, stats: GameOverStats): void {
    const title = this.el.querySelector<HTMLElement>('#go-title')
    const sub = this.el.querySelector<HTMLElement>('#go-sub')
    if (title) {
      title.textContent = isVictory ? 'VICTORY' : 'DEFEAT'
      title.style.color = isVictory ? '#c9a84c' : '#d64b4b'
    }
    if (sub) {
      const mins = Math.floor(stats.duration / 60)
      const secs = String(stats.duration % 60).padStart(2, '0')
      sub.textContent = `K/D: ${stats.kills}/${stats.deaths} · ${mins}:${secs}`
    }
    this.el.style.display = 'flex'
  }

  public onReplay(callback: () => void): void {
    this.replayCallback = callback
  }

  public hide(): void {
    this.el.style.display = 'none'
  }
}
