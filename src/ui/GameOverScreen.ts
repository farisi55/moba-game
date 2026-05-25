// src/ui/GameOverScreen.ts
const GOLD_ACCENT = "#c9a84c";
const BACKGROUND_COLOR = "#0a0a1a";
const SECONDS_PER_MINUTE = 60;

export type GameOverResult = {
  victory: boolean;
  kills: number;
  deaths: number;
  durationSeconds: number;
};

type PlayAgainCallback = () => void;

export class GameOverScreen {
  private root: HTMLElement | null;
  private overlay: HTMLElement | null;
  private title: HTMLElement | null;
  private summary: HTMLElement | null;
  private playAgainCallback: PlayAgainCallback | null;

  public constructor() {
    this.root = null;
    this.overlay = null;
    this.title = null;
    this.summary = null;
    this.playAgainCallback = null;
  }

  /**
   * Mounts the game-over overlay into the provided DOM root.
   */
  public mount(root: HTMLElement): void {
    this.root = root;
    this.injectStyles();

    const overlay = document.createElement("section");
    overlay.className = "bb-game-over";
    overlay.hidden = true;

    const panel = document.createElement("div");
    panel.className = "bb-game-over-panel";

    this.title = document.createElement("h2");
    this.summary = document.createElement("p");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "bb-game-over-button";
    button.textContent = "PLAY AGAIN";
    button.addEventListener("click", () => {
      this.playAgainCallback?.();
    });

    panel.append(this.title, this.summary, button);
    overlay.append(panel);
    root.append(overlay);
    this.overlay = overlay;
  }

  /**
   * Displays victory or defeat with match statistics.
   */
  public show(result: GameOverResult): void {
    if (!this.overlay || !this.title || !this.summary) {
      return;
    }

    this.overlay.hidden = false;
    this.overlay.style.pointerEvents = "auto";
    this.title.textContent = result.victory ? "Victory" : "Defeat";
    this.title.className = result.victory ? "is-victory" : "is-defeat";
    this.summary.textContent = `Kills ${result.kills} | Deaths ${result.deaths} | Time ${this.formatTime(result.durationSeconds)}`;
  }

  /**
   * Hides the overlay.
   */
  public hide(): void {
    if (!this.overlay) {
      return;
    }

    this.overlay.hidden = true;
    this.overlay.style.pointerEvents = "none";
  }

  /**
   * Registers the play-again button action.
   */
  public onPlayAgain(callback: PlayAgainCallback): void {
    this.playAgainCallback = callback;
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
    const remaining = Math.floor(seconds % SECONDS_PER_MINUTE);
    return `${minutes.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  }

  private injectStyles(): void {
    if (document.getElementById("bb-game-over-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "bb-game-over-styles";
    style.textContent = `
      .bb-game-over {
        position: fixed;
        inset: 0;
        display: grid;
        place-items: center;
        padding: 24px;
        background:
          radial-gradient(circle at 50% 18%, rgba(201, 168, 76, 0.14), transparent 30%),
          rgba(10, 10, 26, 0.9);
        color: #f4ead7;
        pointer-events: auto;
        z-index: 10;
      }

      .bb-game-over[hidden] {
        display: none;
      }

      .bb-game-over-panel {
        width: min(520px, 100%);
        padding: 34px 28px;
        border: 1px solid rgba(201, 168, 76, 0.5);
        background: linear-gradient(180deg, #151827, ${BACKGROUND_COLOR});
        text-align: center;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);
      }

      .bb-game-over h2 {
        margin: 0;
        font-family: Cinzel, serif;
        font-size: clamp(48px, 10vw, 88px);
        letter-spacing: 0;
      }

      .bb-game-over h2.is-victory {
        color: ${GOLD_ACCENT};
      }

      .bb-game-over h2.is-defeat {
        color: #d64b4b;
      }

      .bb-game-over p {
        margin: 14px 0 28px;
        color: rgba(244, 234, 215, 0.78);
        font-weight: 700;
      }

      .bb-game-over-button {
        width: min(240px, 100%);
        height: 48px;
        border: 1px solid ${GOLD_ACCENT};
        background: #1c1a21;
        color: ${GOLD_ACCENT};
        font-family: Cinzel, serif;
        font-weight: 700;
        cursor: pointer;
      }

      .bb-game-over-button:hover {
        background: #24202a;
      }
    `;
    document.head.append(style);
  }
}
