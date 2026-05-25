// src/core/EventBus.ts
import type { LaneType, Team, Vec3 } from "@/types";

export type GameEventMap = {
  HERO_DIED: {
    heroId: string;
    killerId: string | null;
    team: Team;
  };
  MINION_SPAWNED: {
    minionId: string;
    lane: LaneType;
    team: Team;
  };
  TOWER_DESTROYED: {
    towerId: string;
    team: Team;
  };
  MATCH_ENDED: {
    winner: Team;
    reason: string;
  };
  SKILL_USED: {
    heroId: string;
    skillId: string;
    target: Vec3;
  };
  DAMAGE_DEALT: {
    targetId: string;
    amount: number;
    position: Vec3;
    isCrit: boolean;
  };
};

type EventCallback<TPayload> = (data: TPayload) => void;

export class EventBus {
  private readonly listeners: Map<keyof GameEventMap, Set<EventCallback<unknown>>>;

  public constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribes to a typed game event and returns an unsubscribe callback.
   */
  public on<K extends keyof GameEventMap>(event: K, callback: EventCallback<GameEventMap[K]>): () => void {
    const callbacks = this.listeners.get(event) ?? new Set<EventCallback<unknown>>();
    callbacks.add(callback as EventCallback<unknown>);
    this.listeners.set(event, callbacks);
    return () => this.off(event, callback);
  }

  /**
   * Emits a typed event payload to all current listeners.
   */
  public emit<K extends keyof GameEventMap>(event: K, data: GameEventMap[K]): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) {
      return;
    }

    for (const callback of callbacks) {
      callback(data);
    }
  }

  /**
   * Removes a previously registered event listener.
   */
  public off<K extends keyof GameEventMap>(event: K, callback: EventCallback<GameEventMap[K]>): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) {
      return;
    }

    callbacks.delete(callback as EventCallback<unknown>);
    if (callbacks.size === 0) {
      this.listeners.delete(event);
    }
  }
}

export const eventBus = new EventBus();
