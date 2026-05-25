// src/ui/LobbyScreen.ts
import { HERO_CONFIGS } from "@/config/heroes";

const GOLD_ACCENT = "#c9a84c";
const BACKGROUND_COLOR = "#0a0a1a";

type PlayCallback = (heroId: string) => void;

type LobbyHeroCard = {
  id: string;
  name: string;
  role: string;
  difficulty: number;
  colorHex: string;
};

export class LobbyScreen {
  private root: HTMLElement | null;
  private selectedHeroId: string;
  private readonly playCallbacks: Set<PlayCallback>;

  public constructor() {
    this.root = null;
    this.selectedHeroId = HERO_CONFIGS[0]?.id ?? "ironclad";
    this.playCallbacks = new Set<PlayCallback>();
  }

  /**
   * Mounts the animated hero selection lobby into the provided DOM root.
   */
  public mount(root: HTMLElement): void {
    this.root = root;
    this.injectStyles();
    root.innerHTML = "";
    root.style.pointerEvents = "auto";

    const shell = document.createElement("section");
    shell.className = "bb-lobby";
    const panel = document.createElement("div");
    panel.className = "bb-lobby-panel";

    const title = document.createElement("h1");
    title.textContent = "BrowserBrawl";
    const subtitle = document.createElement("p");
    subtitle.textContent = "Choose your champion";

    const cards = document.createElement("div");
    cards.className = "bb-hero-grid";
    for (const hero of this.getHeroCards()) {
      cards.append(this.createHeroCard(hero));
    }

    const playButton = document.createElement("button");
    playButton.type = "button";
    playButton.className = "bb-play";
    playButton.textContent = "Play as Guest";
    playButton.addEventListener("click", () => this.emitPlay());

    panel.append(title, subtitle, cards, playButton);
    shell.append(panel);
    root.append(shell);
  }

  /**
   * Shows the lobby overlay.
   */
  public show(): void {
    if (this.root) {
      this.root.hidden = false;
      this.root.style.pointerEvents = "auto";
    }
  }

  /**
   * Hides the lobby overlay.
   */
  public hide(): void {
    if (this.root) {
      this.root.hidden = true;
      this.root.style.pointerEvents = "none";
    }
  }

  /**
   * Subscribes to the guest play action.
   */
  public onPlay(callback: PlayCallback): () => void {
    this.playCallbacks.add(callback);
    return () => {
      this.playCallbacks.delete(callback);
    };
  }

  private createHeroCard(hero: LobbyHeroCard): HTMLElement {
    const card = document.createElement("button");
    card.type = "button";
    card.className = hero.id === this.selectedHeroId ? "bb-hero-card is-selected" : "bb-hero-card";
    card.dataset.heroId = hero.id;
    card.style.setProperty("--hero-color", hero.colorHex);
    card.addEventListener("click", () => {
      this.selectedHeroId = hero.id;
      this.refreshSelection();
    });

    const swatch = document.createElement("span");
    swatch.className = "bb-hero-swatch";
    const name = document.createElement("strong");
    name.textContent = hero.name;
    const role = document.createElement("span");
    role.textContent = hero.role;
    const difficulty = document.createElement("span");
    difficulty.textContent = `Difficulty ${hero.difficulty}`;
    card.append(swatch, name, role, difficulty);
    return card;
  }

  private getHeroCards(): LobbyHeroCard[] {
    const configured = HERO_CONFIGS.map((hero) => ({
      id: hero.id,
      name: hero.name,
      role: hero.role,
      difficulty: hero.difficulty,
      colorHex: hero.colorHex
    }));

    return [
      ...configured,
      {
        id: "gravewarden",
        name: "Gravewarden",
        role: "SUPPORT",
        difficulty: 2,
        colorHex: "#6fbf9a"
      },
      {
        id: "emberhex",
        name: "Emberhex",
        role: "MARKSMAN",
        difficulty: 3,
        colorHex: "#e28b3c"
      }
    ];
  }

  private refreshSelection(): void {
    if (!this.root) {
      return;
    }

    const cards = this.root.querySelectorAll<HTMLButtonElement>(".bb-hero-card");
    for (const card of cards) {
      card.classList.toggle("is-selected", card.dataset.heroId === this.selectedHeroId);
    }
  }

  private emitPlay(): void {
    for (const callback of this.playCallbacks) {
      callback(this.selectedHeroId);
    }
  }

  private injectStyles(): void {
    if (document.getElementById("bb-lobby-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "bb-lobby-styles";
    style.textContent = `
      .bb-lobby {
        position: fixed;
        inset: 0;
        display: grid;
        place-items: center;
        padding: 24px;
        background:
          radial-gradient(circle at 50% 12%, rgba(201, 168, 76, 0.12), transparent 30%),
          linear-gradient(180deg, rgba(10, 10, 26, 0.96), rgba(5, 6, 14, 0.99));
        color: #f4ead7;
        animation: bb-lobby-in 420ms ease-out both;
      }

      .bb-lobby-panel {
        width: min(980px, 100%);
      }

      .bb-lobby h1 {
        margin: 0;
        font-family: Cinzel, serif;
        font-size: clamp(42px, 8vw, 96px);
        font-weight: 700;
        letter-spacing: 0;
        color: ${GOLD_ACCENT};
        text-align: center;
        text-shadow: 0 8px 40px rgba(0, 0, 0, 0.75);
      }

      .bb-lobby p {
        margin: 8px 0 28px;
        text-align: center;
        color: rgba(244, 234, 215, 0.78);
        font-family: Cinzel, serif;
      }

      .bb-hero-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(120px, 1fr));
        gap: 12px;
      }

      .bb-hero-card {
        min-height: 168px;
        display: grid;
        align-content: end;
        gap: 8px;
        padding: 14px;
        border: 1px solid rgba(201, 168, 76, 0.28);
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(10, 10, 26, 0.04)),
          linear-gradient(180deg, #161a27, ${BACKGROUND_COLOR} 72%);
        color: #f4ead7;
        text-align: left;
        cursor: pointer;
        transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
      }

      .bb-hero-card:hover,
      .bb-hero-card.is-selected {
        transform: translateY(-3px);
        border-color: ${GOLD_ACCENT};
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
      }

      .bb-hero-card.is-selected {
        background:
          linear-gradient(180deg, rgba(201, 168, 76, 0.12), rgba(10, 10, 26, 0.08)),
          linear-gradient(180deg, #171b29, ${BACKGROUND_COLOR} 72%);
      }

      .bb-hero-swatch {
        width: 42px;
        height: 42px;
        border: 1px solid rgba(255, 255, 255, 0.35);
        background: var(--hero-color);
      }

      .bb-hero-card strong {
        font-family: Cinzel, serif;
        font-size: 18px;
      }

      .bb-hero-card span {
        color: rgba(244, 234, 215, 0.74);
        font-size: 13px;
      }

      .bb-play {
        display: block;
        margin: 28px auto 0;
        min-width: 220px;
        height: 48px;
        border: 1px solid ${GOLD_ACCENT};
        background: #1c1a21;
        color: ${GOLD_ACCENT};
        font-family: Cinzel, serif;
        font-weight: 700;
        cursor: pointer;
      }

      .bb-play:hover {
        background: #24202a;
      }

      @keyframes bb-lobby-in {
        from {
          opacity: 0;
          transform: translateY(18px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 760px) {
        .bb-hero-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .bb-hero-card {
          min-height: 132px;
        }
      }
    `;
    document.head.append(style);
  }
}
