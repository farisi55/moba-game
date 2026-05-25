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
    this.addLanePaths();
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

  private addLanePaths(): void {
    const LANE_WIDTH = 2.8;
    const LANE_Y = 0.008;

    const laneMaterial = new MeshStandardMaterial({
      color: "#3a4060",
      roughness: 0.85,
      metalness: 0.05
    });
    const edgeMaterial = new MeshStandardMaterial({
      color: "#c9a84c",
      emissive: "#c9a84c",
      emissiveIntensity: 0.3,
      roughness: 0.8
    });

    for (const waypoints of this.lanes.values()) {
      for (let i = 0; i < waypoints.length - 1; i += 1) {
        const a = waypoints[i];
        const b = waypoints[i + 1];
        if (!a || !b) continue;

        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);
        const midX = (a.x + b.x) / 2;
        const midZ = (a.z + b.z) / 2;

        // Main road strip
        const roadGeo = new PlaneGeometry(LANE_WIDTH, length);
        const road = new Mesh(roadGeo, laneMaterial.clone());
        road.name = "LanePath";
        road.rotation.x = -Math.PI / 2;
        road.rotation.z = -angle;
        road.position.set(midX, LANE_Y, midZ);
        road.receiveShadow = true;
        this.group.add(road);
        this.disposableMeshes.push(road);

        // Edge lines (gold)
        for (const side of [-1, 1] as const) {
          const edgeGeo = new PlaneGeometry(0.18, length);
          const edge = new Mesh(edgeGeo, edgeMaterial.clone());
          edge.name = "LaneEdge";
          edge.rotation.x = -Math.PI / 2;
          edge.rotation.z = -angle;
          const perpX = Math.cos(angle) * side * (LANE_WIDTH / 2);
          const perpZ = -Math.sin(angle) * side * (LANE_WIDTH / 2);
          edge.position.set(midX + perpX, LANE_Y + 0.002, midZ + perpZ);
          this.group.add(edge);
          this.disposableMeshes.push(edge);
        }
      }
    }

    laneMaterial.dispose();
    edgeMaterial.dispose();
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
