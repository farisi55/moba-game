// src/ui/HUD.ts
import { UI_CONFIG } from "@/config/constants";
import type { Hero } from "@/entities/Hero";

const GOLD_ACCENT = "#c9a84c";
const BACKGROUND_COLOR = "#0a0a1a";
const MAX_RATIO = 1;
const MIN_RATIO = 0;
const SECONDS_PER_MINUTE = 60;

type SkillCallback = (index: number) => void;

export class HUD {
  private root: HTMLElement | null;
  private hero: Hero | null;
  private readonly skillCallbacks: Set<SkillCallback>;
  private hpFill: HTMLElement | null;
  private manaFill: HTMLElement | null;
  private hpText: HTMLElement | null;
  private manaText: HTMLElement | null;
  private timerText: HTMLElement | null;
  private scoreText: HTMLElement | null;
  private readonly skillButtons: HTMLButtonElement[];
  private readonly cooldownFills: HTMLElement[];

  public constructor() {
    this.root = null;
    this.hero = null;
    this.skillCallbacks = new Set<SkillCallback>();
    this.hpFill = null;
    this.manaFill = null;
    this.hpText = null;
    this.manaText = null;
    this.timerText = null;
    this.scoreText = null;
    this.skillButtons = [];
    this.cooldownFills = [];
  }

  /**
   * Mounts the DOM HUD overlay into the provided root element.
   */
  public mount(root: HTMLElement): void {
    this.root = root;
    this.injectStyles();
    root.innerHTML = "";
    root.style.pointerEvents = "none";

    const hud = document.createElement("section");
    hud.className = "bb-hud";

    const topBar = document.createElement("div");
    topBar.className = "bb-hud-top";
    this.timerText = document.createElement("div");
    this.timerText.className = "bb-timer";
    this.timerText.textContent = "00:00";
    this.scoreText = document.createElement("div");
    this.scoreText.className = "bb-score";
    this.scoreText.textContent = "0 / 0";
    topBar.append(this.timerText, this.scoreText);

    const lowerBar = document.createElement("div");
    lowerBar.className = "bb-hud-bottom";

    const vitals = document.createElement("div");
    vitals.className = "bb-vitals";
    const hp = this.createBar("HP", "bb-hp");
    const mana = this.createBar("Mana", "bb-mana");
    this.hpFill = hp.fill;
    this.hpText = hp.text;
    this.manaFill = mana.fill;
    this.manaText = mana.text;
    vitals.append(hp.element, mana.element);

    const skills = document.createElement("div");
    skills.className = "bb-skills";
    const labels = ["Q", "W", "E", "R"];
    for (let index = 0; index < UI_CONFIG.hudSkillCount; index += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "bb-skill";
      button.ariaLabel = `Skill ${labels[index]}`;
      button.textContent = labels[index];

      const cooldown = document.createElement("span");
      cooldown.className = "bb-skill-cooldown";
      button.append(cooldown);
      button.addEventListener("click", () => this.emitSkill(index));
      this.skillButtons.push(button);
      this.cooldownFills.push(cooldown);
      skills.append(button);
    }

    lowerBar.append(vitals, skills);
    hud.append(topBar, lowerBar);
    root.append(hud);
  }

  /**
   * Sets the local hero used for HP, mana, and skill cooldown display.
   */
  public setHero(hero: Hero | null): void {
    this.hero = hero;
  }

  /**
   * Updates HUD text and bars from the current hero and match state.
   */
  public update(matchTimer: number, kills: number, deaths: number): void {
    if (this.timerText) {
      this.timerText.textContent = this.formatTime(matchTimer);
    }
    if (this.scoreText) {
      this.scoreText.textContent = `${kills} / ${deaths}`;
    }
    if (!this.hero) {
      return;
    }

    this.updateBar(this.hpFill, this.hpText, this.hero.stats.hp, this.hero.stats.maxHp);
    this.updateBar(this.manaFill, this.manaText, this.hero.stats.mana, this.hero.stats.maxMana);
    for (let index = 0; index < UI_CONFIG.hudSkillCount; index += 1) {
      const skill = this.hero.skills[index];
      const button = this.skillButtons[index];
      const cooldown = this.cooldownFills[index];
      if (!skill || !button || !cooldown) {
        continue;
      }

      const ratio = skill.cooldown === 0 ? MIN_RATIO : skill.cooldownRemaining / skill.cooldown;
      cooldown.style.height = `${this.clampRatio(ratio) * 100}%`;
      button.disabled = skill.cooldownRemaining > 0 || this.hero.stats.mana < skill.manaCost;
      button.title = skill.name;
    }
  }

  /**
   * Subscribes to skill button activation.
   */
  public onSkill(callback: SkillCallback): () => void {
    this.skillCallbacks.add(callback);
    return () => {
      this.skillCallbacks.delete(callback);
    };
  }

  /** Flash a skill button when the player activates it */
  public flashSkill(index: number): void {
    const button = this.skillButtons[index];
    if (!button) return;
    button.classList.remove("bb-skill-active");
    // Force reflow to restart animation
    void button.offsetWidth;
    button.classList.add("bb-skill-active");
  }

  /**
   * Clears mounted HUD DOM.
   */
  public dispose(): void {
    this.root?.replaceChildren();
    this.skillCallbacks.clear();
  }

  private createBar(label: string, fillClassName: string): { element: HTMLElement; fill: HTMLElement; text: HTMLElement } {
    const element = document.createElement("div");
    element.className = "bb-bar";
    const fill = document.createElement("div");
    fill.className = `bb-bar-fill ${fillClassName}`;
    const text = document.createElement("span");
    text.className = "bb-bar-text";
    text.textContent = `${label} 0 / 0`;
    element.append(fill, text);
    return { element, fill, text };
  }

  private updateBar(fill: HTMLElement | null, text: HTMLElement | null, value: number, max: number): void {
    if (!fill || !text) {
      return;
    }

    const ratio = max === 0 ? MIN_RATIO : value / max;
    fill.style.width = `${this.clampRatio(ratio) * 100}%`;
    text.textContent = `${Math.ceil(value)} / ${Math.ceil(max)}`;
  }

  private emitSkill(index: number): void {
    for (const callback of this.skillCallbacks) {
      callback(index);
    }
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
    const remaining = Math.floor(seconds % SECONDS_PER_MINUTE);
    return `${minutes.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  }

  private clampRatio(value: number): number {
    return Math.max(MIN_RATIO, Math.min(MAX_RATIO, value));
  }

  private injectStyles(): void {
    if (document.getElementById("bb-hud-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "bb-hud-styles";
    style.textContent = `
      :root {
        --bb-bg: ${BACKGROUND_COLOR};
        --bb-panel: rgba(10, 10, 26, 0.84);
        --bb-panel-solid: #11131f;
        --bb-border: rgba(201, 168, 76, 0.42);
        --bb-gold: ${GOLD_ACCENT};
        --bb-text: #f2ecdc;
        --bb-muted: rgba(242, 236, 220, 0.64);
        --bb-red: #b83a4a;
        --bb-blue: #3569d4;
        --bb-mana: #3a7bd5;
      }

      .bb-hud {
        position: fixed;
        inset: 0;
        color: var(--bb-text);
        pointer-events: none;
        font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        z-index: 3;
      }

      .bb-hud-top {
        position: absolute;
        top: max(14px, env(safe-area-inset-top));
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 10px;
        align-items: center;
        font-family: Cinzel, serif;
      }

      .bb-timer,
      .bb-score {
        min-width: 92px;
        padding: 8px 12px;
        border: 1px solid var(--bb-border);
        background: var(--bb-panel);
        color: var(--bb-gold);
        text-align: center;
        letter-spacing: 0;
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.34);
      }

      .bb-hud-bottom {
        position: absolute;
        left: 24px;
        right: 24px;
        bottom: max(20px, env(safe-area-inset-bottom));
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 18px;
      }

      .bb-vitals {
        width: min(360px, 44vw);
        display: grid;
        gap: 8px;
      }

      .bb-bar {
        position: relative;
        height: 22px;
        overflow: hidden;
        border: 1px solid var(--bb-border);
        background: rgba(5, 8, 18, 0.92);
      }

      .bb-bar-fill {
        position: absolute;
        inset: 0 auto 0 0;
        width: 0%;
        transition: width 120ms linear;
      }

      .bb-hp {
        background: linear-gradient(90deg, #7a1d2a, var(--bb-red));
      }

      .bb-mana {
        background: linear-gradient(90deg, #163e80, var(--bb-mana));
      }

      .bb-bar-text {
        position: relative;
        display: grid;
        height: 100%;
        place-items: center;
        font-size: 12px;
        font-weight: 700;
        text-shadow: 0 1px 2px #000;
      }

      .bb-skills {
        display: flex;
        gap: 10px;
        pointer-events: auto;
      }

      .bb-skill {
        position: relative;
        width: 58px;
        height: 58px;
        overflow: hidden;
        border: 1px solid var(--bb-border);
        background: var(--bb-panel-solid);
        color: var(--bb-gold);
        font-family: Cinzel, serif;
        font-size: 20px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.36);
      }

      .bb-skill:hover:not(:disabled) {
        border-color: var(--bb-gold);
      }

      .bb-skill:disabled {
        cursor: default;
        color: rgba(242, 236, 220, 0.38);
      }

      .bb-skill-cooldown {
        position: absolute;
        inset: auto 0 0 0;
        height: 0%;
        background: rgba(0, 0, 0, 0.62);
        transition: height 120ms linear;
      }

      @media (max-width: 700px), (pointer: coarse) {
        .bb-hud-bottom {
          left: 12px;
          right: 12px;
          align-items: center;
        }

        .bb-vitals {
          width: min(310px, 48vw);
        }

        .bb-skills {
          gap: 8px;
        }

        .bb-skill {
          width: 64px;
          height: 64px;
          font-size: 22px;
        }
      }

      @keyframes bb-skill-flash {
        0%   { box-shadow: inset 0 0 0 2px var(--bb-gold), 0 0 12px var(--bb-gold); background: rgba(201,168,76,0.25); }
        100% { box-shadow: none; background: var(--bb-panel-solid); }
      }
      .bb-skill-active {
        animation: bb-skill-flash 0.35s ease-out forwards;
      }
    `;
    document.head.append(style);
  }
}
