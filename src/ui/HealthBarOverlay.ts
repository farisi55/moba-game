// src/ui/HealthBarOverlay.ts
import { OrthographicCamera, Vector3, WebGLRenderer } from "three";
import { COLORS } from "@/config/constants";
import type {
  HealthComponent,
  IdentityComponent,
  TeamComponent
} from "@/entities/components";
import type { Entity } from "@/entities/Entity";
import { Team } from "@/types";

const BAR_WIDTH_BY_KIND = {
  hero: 58,
  minion: 36,
  tower: 72,
  structure: 64
} as const;
const BAR_HEIGHT = 6;
const HERO_WORLD_OFFSET_Y = 2.2;
const MINION_WORLD_OFFSET_Y = 1.3;
const TOWER_WORLD_OFFSET_Y = 4.6;
const DEFAULT_WORLD_OFFSET_Y = 1.8;
const OFFSCREEN_MARGIN = 24;
const PERCENT = 100;

type HealthBarEntry = {
  element: HTMLDivElement;
  fill: HTMLDivElement;
  label: HTMLSpanElement;
};

export class HealthBarOverlay {
  private readonly camera: OrthographicCamera;
  private readonly renderer: WebGLRenderer;
  private readonly worldPosition: Vector3;
  private readonly projectedPosition: Vector3;
  private root: HTMLElement | null;
  private layer: HTMLDivElement | null;
  private readonly entries: Map<string, HealthBarEntry>;

  public constructor(camera: OrthographicCamera, renderer: WebGLRenderer) {
    this.camera = camera;
    this.renderer = renderer;
    this.worldPosition = new Vector3();
    this.projectedPosition = new Vector3();
    this.root = null;
    this.layer = null;
    this.entries = new Map<string, HealthBarEntry>();
  }

  /**
   * Mounts the DOM health bar layer into the UI overlay.
   */
  public mount(root: HTMLElement): void {
    this.root = root;
    this.injectStyles();
    const layer = document.createElement("div");
    layer.className = "bb-health-layer";
    root.append(layer);
    this.layer = layer;
  }

  /**
   * Updates health bar positions and removes entries for missing or dead entities.
   */
  public update(entities: readonly Entity[]): void {
    if (!this.layer) {
      return;
    }

    const visibleIds = new Set<string>();
    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    for (const entity of entities) {
      const identity = entity.getComponent<IdentityComponent>("identity");
      const health = entity.getComponent<HealthComponent>("health");
      const team = entity.getComponent<TeamComponent>("team");
      if (!identity || !health || !team || health.isDead || health.hp <= 0) {
        continue;
      }

      visibleIds.add(entity.id);
      const entry = this.getOrCreateEntry(entity, identity, team);
      this.updateEntry(entity, identity, health, entry, width, height);
    }

    for (const [entityId, entry] of this.entries) {
      if (visibleIds.has(entityId)) {
        continue;
      }

      entry.element.remove();
      this.entries.delete(entityId);
    }
  }

  /**
   * Removes every health bar and unmounts the overlay layer.
   */
  public dispose(): void {
    for (const entry of this.entries.values()) {
      entry.element.remove();
    }
    this.entries.clear();
    this.layer?.remove();
    this.layer = null;
    this.root = null;
  }

  private getOrCreateEntry(entity: Entity, identity: IdentityComponent, team: TeamComponent): HealthBarEntry {
    const existing = this.entries.get(entity.id);
    if (existing) {
      return existing;
    }

    const element = document.createElement("div");
    element.className = `bb-health-bar bb-health-${identity.kind}`;
    element.style.width = `${BAR_WIDTH_BY_KIND[identity.kind]}px`;

    const track = document.createElement("div");
    track.className = "bb-health-track";

    const fill = document.createElement("div");
    fill.className = "bb-health-fill";
    fill.style.background = team.team === Team.BLUE ? COLORS.blueTeam : COLORS.redTeam;

    const label = document.createElement("span");
    label.className = "bb-health-label";
    label.textContent = identity.kind;

    track.append(fill);
    element.append(track, label);
    this.layer?.append(element);

    const entry = { element, fill, label };
    this.entries.set(entity.id, entry);
    return entry;
  }

  private updateEntry(
    entity: Entity,
    identity: IdentityComponent,
    health: HealthComponent,
    entry: HealthBarEntry,
    width: number,
    height: number
  ): void {
    this.worldPosition.copy(entity.position);
    this.worldPosition.y += this.getWorldOffset(identity);
    this.projectedPosition.copy(this.worldPosition).project(this.camera);

    const x = (this.projectedPosition.x * 0.5 + 0.5) * width;
    const y = (-this.projectedPosition.y * 0.5 + 0.5) * height;
    const isVisible =
      this.projectedPosition.z >= -1 &&
      this.projectedPosition.z <= 1 &&
      x >= -OFFSCREEN_MARGIN &&
      x <= width + OFFSCREEN_MARGIN &&
      y >= -OFFSCREEN_MARGIN &&
      y <= height + OFFSCREEN_MARGIN;

    entry.element.hidden = !isVisible;
    if (!isVisible) {
      return;
    }

    const healthRatio = health.maxHp === 0 ? 0 : Math.max(0, Math.min(1, health.hp / health.maxHp));
    entry.fill.style.width = `${healthRatio * PERCENT}%`;
    entry.label.textContent = `${Math.ceil(health.hp)}`;
    entry.element.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) translate(-50%, -100%)`;
  }

  private getWorldOffset(identity: IdentityComponent): number {
    if (identity.kind === "hero") {
      return HERO_WORLD_OFFSET_Y;
    }
    if (identity.kind === "minion") {
      return MINION_WORLD_OFFSET_Y;
    }
    if (identity.kind === "tower") {
      return TOWER_WORLD_OFFSET_Y;
    }
    return DEFAULT_WORLD_OFFSET_Y;
  }

  private injectStyles(): void {
    if (document.getElementById("bb-health-overlay-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "bb-health-overlay-styles";
    style.textContent = `
      .bb-health-layer {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 1;
      }

      .bb-health-bar {
        position: absolute;
        left: 0;
        top: 0;
        display: grid;
        gap: 2px;
        justify-items: center;
        will-change: transform;
      }

      .bb-health-track {
        width: 100%;
        height: ${BAR_HEIGHT}px;
        overflow: hidden;
        border: 1px solid rgba(201, 168, 76, 0.72);
        background: rgba(4, 5, 12, 0.82);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.7);
      }

      .bb-health-fill {
        height: 100%;
        width: 100%;
        transition: width 90ms linear;
      }

      .bb-health-label {
        max-width: 72px;
        overflow: hidden;
        color: #f2ecdc;
        font-size: 10px;
        font-weight: 700;
        line-height: 1;
        text-shadow: 0 1px 3px #000;
        white-space: nowrap;
      }

      .bb-health-minion .bb-health-label {
        display: none;
      }

      @media (max-width: 700px), (pointer: coarse) {
        .bb-health-label {
          font-size: 9px;
        }
      }
    `;
    document.head.append(style);
  }
}
