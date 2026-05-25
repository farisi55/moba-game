// src/map/GameMap.ts
import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Scene,
  Vector3
} from "three";
import { COLORS, MAP_CONFIG } from "@/config/constants";
import { LaneType, Team } from "@/types";

const GOLD_ACCENT = "#c9a84c";
const CENTER_LANE_MARKER_SIZE = 0.22;
const LANE_MARKER_HEIGHT = 0.04;

export class GameMap {
  private readonly group: Group;
  private readonly lanes: Map<LaneType, Vector3[]>;
  private readonly disposableMeshes: Mesh[];

  public constructor(scene: Scene) {
    this.group = new Group();
    this.group.name = "BrowserBrawlMap";
    this.lanes = this.createLanes();
    this.disposableMeshes = [];
    this.buildMap();
    scene.add(this.group);
  }

  /**
   * Returns lane waypoints ordered from the requested team's base toward the enemy base.
   */
  public getLaneWaypoints(lane: LaneType, team: Team): Vector3[] {
    const waypoints = this.lanes.get(lane) ?? [];
    const ordered = team === Team.BLUE ? waypoints : [...waypoints].reverse();
    return ordered.map((waypoint) => waypoint.clone());
  }

  /**
   * Returns the team's primary spawn point.
   */
  public getSpawnPoint(team: Team): Vector3 {
    const offset = team === Team.BLUE ? -MAP_CONFIG.baseOffset : MAP_CONFIG.baseOffset;
    return new Vector3(offset, MAP_CONFIG.groundY, offset);
  }

  /**
   * Returns the root Three.js object for this map.
   */
  public getObject(): Group {
    return this.group;
  }

  /**
   * Disposes all map geometries and materials.
   */
  public dispose(): void {
    for (const mesh of this.disposableMeshes) {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        for (const material of mesh.material) {
          material.dispose();
        }
      } else {
        mesh.material.dispose();
      }
    }
    this.disposableMeshes.length = 0;
    this.group.removeFromParent();
  }

  private buildMap(): void {
    this.addGround();
    this.addRiver();
    this.addLaneMarkers();
    this.addJungle();
    this.addBases();
  }

  private addGround(): void {
    const geometry = new PlaneGeometry(MAP_CONFIG.size, MAP_CONFIG.size);
    const material = new MeshStandardMaterial({
      color: COLORS.ground,
      roughness: 0.96,
      metalness: 0.04
    });
    const ground = new Mesh(geometry, material);
    ground.name = "DarkStoneGround";
    ground.rotation.x = MAP_CONFIG.planeRotationX;
    ground.receiveShadow = true;
    this.group.add(ground);
    this.disposableMeshes.push(ground);
  }

  private addRiver(): void {
    const geometry = new PlaneGeometry(MAP_CONFIG.riverWidth, MAP_CONFIG.riverLength);
    const material = new MeshStandardMaterial({
      color: COLORS.river,
      roughness: 0.64,
      metalness: 0.12
    });
    const river = new Mesh(geometry, material);
    river.name = "ShadowRiver";
    river.rotation.x = MAP_CONFIG.planeRotationX;
    river.rotation.z = MAP_CONFIG.riverRotationZ;
    river.position.y = MAP_CONFIG.riverYOffset;
    this.group.add(river);
    this.disposableMeshes.push(river);
  }

  private addLaneMarkers(): void {
    const geometry = new BoxGeometry(CENTER_LANE_MARKER_SIZE, LANE_MARKER_HEIGHT, CENTER_LANE_MARKER_SIZE);
    const material = new MeshStandardMaterial({
      color: GOLD_ACCENT,
      emissive: GOLD_ACCENT,
      emissiveIntensity: 0.15,
      roughness: 0.8
    });

    for (const waypoints of this.lanes.values()) {
      for (const waypoint of waypoints) {
        const marker = new Mesh(geometry.clone(), material.clone());
        marker.name = "LaneMarker";
        marker.position.set(waypoint.x, LANE_MARKER_HEIGHT / 2, waypoint.z);
        marker.receiveShadow = true;
        this.group.add(marker);
        this.disposableMeshes.push(marker);
      }
    }

    geometry.dispose();
    material.dispose();
  }

  private addJungle(): void {
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshStandardMaterial({
      color: COLORS.jungleTree,
      roughness: 0.88,
      metalness: 0.02
    });

    for (let index = 0; index < MAP_CONFIG.jungleTreeCountPerSide; index += 1) {
      const leftTree = this.createTree(geometry, material, index, -1);
      const rightTree = this.createTree(geometry, material, index, 1);
      this.group.add(leftTree, rightTree);
      this.disposableMeshes.push(leftTree, rightTree);
    }

    geometry.dispose();
    material.dispose();
  }

  private createTree(
    geometry: BoxGeometry,
    material: MeshStandardMaterial,
    index: number,
    side: -1 | 1
  ): Mesh<BoxGeometry, MeshStandardMaterial> {
    const tree = new Mesh(geometry.clone(), material.clone());
    const row = index % MAP_CONFIG.jungleColumns;
    const column = Math.floor(index / MAP_CONFIG.jungleColumns);
    const size = MAP_CONFIG.jungleTreeMinSize + ((row + column) % 3) * MAP_CONFIG.jungleTreeSizeStep;
    tree.name = "JungleObelisk";
    tree.scale.set(size, size * MAP_CONFIG.jungleTreeHeightMultiplier, size);
    tree.position.set(
      side * (MAP_CONFIG.jungleTreeBaseOffsetX + row * MAP_CONFIG.jungleTreeSpacingX),
      size,
      MAP_CONFIG.jungleTreeStartZ + column * MAP_CONFIG.jungleTreeSpacingZ
    );
    tree.castShadow = true;
    tree.receiveShadow = true;
    return tree;
  }

  private addBases(): void {
    const geometry = new BoxGeometry(MAP_CONFIG.baseWidth, MAP_CONFIG.baseHeight, MAP_CONFIG.baseDepth);
    const blueMaterial = new MeshStandardMaterial({
      color: COLORS.blueTeam,
      emissive: COLORS.blueEmissive,
      emissiveIntensity: 0.24,
      roughness: 0.7
    });
    const redMaterial = new MeshStandardMaterial({
      color: COLORS.redTeam,
      emissive: COLORS.redEmissive,
      emissiveIntensity: 0.24,
      roughness: 0.7
    });

    const blueBase = new Mesh(geometry.clone(), blueMaterial);
    blueBase.name = "BlueBase";
    blueBase.position.copy(this.getSpawnPoint(Team.BLUE));
    blueBase.position.y = MAP_CONFIG.baseHeight / 2;
    blueBase.receiveShadow = true;
    blueBase.castShadow = true;

    const redBase = new Mesh(geometry.clone(), redMaterial);
    redBase.name = "RedBase";
    redBase.position.copy(this.getSpawnPoint(Team.RED));
    redBase.position.y = MAP_CONFIG.baseHeight / 2;
    redBase.receiveShadow = true;
    redBase.castShadow = true;

    this.group.add(blueBase, redBase);
    this.disposableMeshes.push(blueBase, redBase);
    geometry.dispose();
  }

  private createLanes(): Map<LaneType, Vector3[]> {
    return new Map<LaneType, Vector3[]>([
      [
        LaneType.TOP,
        [
          new Vector3(-MAP_CONFIG.baseOffset, MAP_CONFIG.groundY, -MAP_CONFIG.baseOffset),
          new Vector3(-MAP_CONFIG.laneVerticalOffset, MAP_CONFIG.groundY, -MAP_CONFIG.laneVerticalOffset),
          new Vector3(-MAP_CONFIG.laneVerticalOffset, MAP_CONFIG.groundY, MAP_CONFIG.laneVerticalOffset),
          new Vector3(MAP_CONFIG.baseOffset, MAP_CONFIG.groundY, MAP_CONFIG.baseOffset)
        ]
      ],
      [
        LaneType.MID,
        [
          new Vector3(-MAP_CONFIG.baseOffset, MAP_CONFIG.groundY, -MAP_CONFIG.baseOffset),
          new Vector3(-MAP_CONFIG.laneMidInnerOffset, MAP_CONFIG.groundY, -MAP_CONFIG.laneMidInnerOffset),
          new Vector3(MAP_CONFIG.laneMidOffset, MAP_CONFIG.groundY, MAP_CONFIG.laneMidOffset),
          new Vector3(MAP_CONFIG.laneMidInnerOffset, MAP_CONFIG.groundY, MAP_CONFIG.laneMidInnerOffset),
          new Vector3(MAP_CONFIG.baseOffset, MAP_CONFIG.groundY, MAP_CONFIG.baseOffset)
        ]
      ],
      [
        LaneType.BOT,
        [
          new Vector3(-MAP_CONFIG.baseOffset, MAP_CONFIG.groundY, -MAP_CONFIG.baseOffset),
          new Vector3(MAP_CONFIG.laneBotOffset, MAP_CONFIG.groundY, MAP_CONFIG.laneBotOffset),
          new Vector3(MAP_CONFIG.laneVerticalOffset, MAP_CONFIG.groundY, MAP_CONFIG.laneBotOffset),
          new Vector3(MAP_CONFIG.baseOffset, MAP_CONFIG.groundY, MAP_CONFIG.baseOffset)
        ]
      ]
    ]);
  }
}
