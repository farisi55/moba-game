// src/network/NetworkStub.ts
import { NETWORK_CONFIG, UI_CONFIG } from "@/config/constants";
import { Team, type PlayerState, type Vec3 } from "@/types";

export interface NetworkInput {
  sequence: number;
  moveTarget: Vec3 | null;
  pressedKeys: string[];
}

type PlayerJoinedCallback = (player: PlayerState) => void;
type PlayerMovedCallback = (playerId: string, position: Vec3) => void;

export class NetworkStub {
  private readonly joinedCallbacks: Set<PlayerJoinedCallback>;
  private readonly movedCallbacks: Set<PlayerMovedCallback>;
  private joinTimer: number | null;
  private movementTimer: number | null;
  private fakeOpponent: PlayerState | null;

  public constructor() {
    this.joinedCallbacks = new Set<PlayerJoinedCallback>();
    this.movedCallbacks = new Set<PlayerMovedCallback>();
    this.joinTimer = null;
    this.movementTimer = null;
    this.fakeOpponent = null;
  }

  /**
   * Simulates connecting to the future authoritative WebSocket backend.
   */
  public async connect(localPlayer: PlayerState): Promise<void> {
    console.log("[NetworkStub] connect (stub — multiplayer deferred)", localPlayer);
    // Fake join disabled: bots are managed by spawnBots() in main.ts
    // this.joinTimer = window.setTimeout(() => this.emitFakeJoin(), UI_CONFIG.guestJoinDelayMs);
  }

  /**
   * Stops fake network timers.
   */
  public disconnect(): void {
    console.log("[NetworkStub] disconnect");
    if (this.joinTimer !== null) {
      window.clearTimeout(this.joinTimer);
      this.joinTimer = null;
    }
    if (this.movementTimer !== null) {
      window.clearInterval(this.movementTimer);
      this.movementTimer = null;
    }
  }

  /**
   * Logs player input that will later be sent over WebSocket.
   */
  public sendPlayerInput(input: NetworkInput): void {
    console.log("[NetworkStub] sendPlayerInput", input);
  }

  /**
   * Logs skill use payloads matching the future real network manager.
   */
  public sendSkillUse(skillId: string, target: Vec3): void {
    console.log("[NetworkStub] sendSkillUse", { skillId, target });
  }

  /**
   * Subscribes to simulated player join events.
   */
  public onPlayerJoined(callback: PlayerJoinedCallback): () => void {
    this.joinedCallbacks.add(callback);
    return () => {
      this.joinedCallbacks.delete(callback);
    };
  }

  /**
   * Subscribes to simulated remote movement updates.
   */
  public onPlayerMoved(callback: PlayerMovedCallback): () => void {
    this.movedCallbacks.add(callback);
    return () => {
      this.movedCallbacks.delete(callback);
    };
  }

  private emitFakeJoin(): void {
    this.fakeOpponent = {
      id: "stub-opponent",
      heroId: "shadowblade",
      team: Team.RED,
      name: "Guest Rival",
      position: {
        x: UI_CONFIG.randomWalkRadius,
        y: 0,
        z: UI_CONFIG.randomWalkRadius
      },
      kills: 0,
      deaths: 0,
      connected: true
    };

    for (const callback of this.joinedCallbacks) {
      callback(this.fakeOpponent);
    }

    this.movementTimer = window.setInterval(
      () => this.emitFakeMovement(),
      UI_CONFIG.networkMoveIntervalMs
    );
  }

  private emitFakeMovement(): void {
    if (!this.fakeOpponent) {
      return;
    }

    const nextPosition = {
      x: this.fakeOpponent.position.x + (Math.random() - NETWORK_CONFIG.randomCenterOffset) * UI_CONFIG.randomWalkRadius,
      y: 0,
      z: this.fakeOpponent.position.z + (Math.random() - NETWORK_CONFIG.randomCenterOffset) * UI_CONFIG.randomWalkRadius
    };
    this.fakeOpponent = {
      ...this.fakeOpponent,
      position: nextPosition
    };

    for (const callback of this.movedCallbacks) {
      callback(this.fakeOpponent.id, nextPosition);
    }
  }
}
