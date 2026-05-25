// src/map/LaneManager.ts
import { Vector3 } from "three";
import { LANE_CONFIG } from "@/config/constants";
import { eventBus } from "@/core/EventBus";
import type { AIComponent, HealthComponent, MovementComponent } from "@/entities/components";
import type { Entity } from "@/entities/Entity";
import { Minion, MinionType } from "@/entities/Minion";
import { GameMap } from "@/map/GameMap";
import { LaneType, Team, type System } from "@/types";

type SpawnEntity = (entity: Entity) => void;

export class LaneManager implements System {
  private readonly gameMap: GameMap;
  private readonly spawnEntity: SpawnEntity;
  private readonly activeMinionIds: Set<string>;
  private elapsedSinceWave: number;

  public constructor(gameMap: GameMap, spawnEntity: SpawnEntity) {
    this.gameMap = gameMap;
    this.spawnEntity = spawnEntity;
    this.activeMinionIds = new Set<string>();
    this.elapsedSinceWave = LANE_CONFIG.waveIntervalSeconds - LANE_CONFIG.initialWaveDelaySeconds;
  }

  /**
   * Spawns periodic minion waves and prunes disposed minion ids from tracking.
   */
  public update(delta: number, entities: readonly Entity[]): void {
    this.elapsedSinceWave += delta;
    this.pruneActiveMinions(entities);

    if (this.elapsedSinceWave < LANE_CONFIG.waveIntervalSeconds) {
      return;
    }

    this.elapsedSinceWave = 0;
    for (const team of [Team.BLUE, Team.RED]) {
      for (const lane of [LaneType.TOP, LaneType.MID, LaneType.BOT]) {
        this.spawnWave(lane, team);
      }
    }
  }

  /**
   * Returns active minion ids tracked by lane spawning.
   */
  public getActiveMinionIds(): readonly string[] {
    return [...this.activeMinionIds];
  }

  private pruneActiveMinions(entities: readonly Entity[]): void {
    const livingMinionIds = new Set<string>();
    for (const entity of entities) {
      if (!this.activeMinionIds.has(entity.id)) {
        continue;
      }

      const health = entity.getComponent<HealthComponent>("health");
      if (health && !health.isDead) {
        livingMinionIds.add(entity.id);
      }
    }

    this.activeMinionIds.clear();
    for (const minionId of livingMinionIds) {
      this.activeMinionIds.add(minionId);
    }
  }

  private spawnWave(lane: LaneType, team: Team): void {
    const meleeCount = LANE_CONFIG.meleePerWave;
    for (let index = 0; index < meleeCount; index += 1) {
      this.spawnMinion(MinionType.MELEE, lane, team, index);
    }
    for (let index = 0; index < LANE_CONFIG.rangedPerWave; index += 1) {
      this.spawnMinion(MinionType.RANGED, lane, team, meleeCount + index);
    }
  }

  private spawnMinion(type: MinionType, lane: LaneType, team: Team, offsetIndex: number): void {
    const spawn = this.gameMap.getSpawnPoint(team);
    const offsetDirection = team === Team.BLUE ? 1 : -1;
    const position = spawn.clone().add(new Vector3(offsetIndex * LANE_CONFIG.spawnSpread * offsetDirection, 0, 0));
    const minion = new Minion(type, team, position);
    const waypoints = this.gameMap.getLaneWaypoints(lane, team);
    minion.addComponent<AIComponent>({
      type: "ai",
      state: "LANE_WALK",
      lane,
      waypoints,
      currentWaypointIndex: 0,
      retreatPosition: spawn
    });

    const movement = minion.getComponent<MovementComponent>("movement");
    if (movement) {
      movement.targetPosition = waypoints[0]?.clone() ?? null;
    }

    this.activeMinionIds.add(minion.id);
    this.spawnEntity(minion);
    eventBus.emit("MINION_SPAWNED", {
      minionId: minion.id,
      lane,
      team
    });
  }
}
