// src/entities/Tower.ts
import {
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  RingGeometry,
  Vector3
} from "three";
import { COLORS, COMBAT_CONFIG, ENTITY_CONFIG, TOWER_STATS } from "@/config/constants";
import { Entity } from "@/entities/Entity";
import { disposeObject3D } from "@/entities/dispose";
import type {
  HealthComponent,
  LifecycleComponent,
  StateComponent
} from "@/entities/components";
import type { Component } from "@/types";
import { Team } from "@/types";

export enum TowerState {
  ACTIVE = "ACTIVE",
  DESTROYED = "DESTROYED"
}

export interface TowerCombatComponent extends Component {
  type: "combat";
  attackDamage: number;
  attackRange: number;
  attackSpeed: number;
  cooldownRemaining: number;
  targetId: string | null;
}

export class Tower extends Entity {
  public readonly team: Team;
  public readonly stats: {
    hp: number;
    maxHp: number;
    attackRange: number;
    attackDamage: number;
    attackSpeed: number;
  };
  public state: TowerState;
  public readonly attackRangeIndicator: Mesh<RingGeometry, MeshBasicMaterial>;
  private readonly group: Group;
  private readonly towerGeometry: CylinderGeometry;
  private readonly towerMaterial: MeshStandardMaterial;
  private readonly rangeGeometry: RingGeometry;
  private readonly rangeMaterial: MeshBasicMaterial;

  public constructor(team: Team, position: Vector3 = new Vector3()) {
    super(position);
    this.team = team;
    this.state = TowerState.ACTIVE;
    this.stats = {
      hp: TOWER_STATS.hp,
      maxHp: TOWER_STATS.hp,
      attackRange: COMBAT_CONFIG.towerAttackRange,
      attackDamage: COMBAT_CONFIG.towerAttackDamage,
      attackSpeed: COMBAT_CONFIG.towerAttackSpeed
    };

    this.group = new Group();
    this.towerGeometry = new CylinderGeometry(
      ENTITY_CONFIG.towerRadius,
      ENTITY_CONFIG.towerRadius * ENTITY_CONFIG.towerBaseRadiusMultiplier,
      ENTITY_CONFIG.towerHeight,
      ENTITY_CONFIG.towerSegments
    );
    this.towerMaterial = new MeshStandardMaterial({
      color: team === Team.BLUE ? COLORS.blueTeam : COLORS.redTeam,
      emissive: team === Team.BLUE ? COLORS.blueEmissive : COLORS.redEmissive,
      emissiveIntensity: TOWER_STATS.emissiveIntensity,
      roughness: 0.65,
      metalness: 0.2
    });

    const towerMesh = new Mesh(this.towerGeometry, this.towerMaterial);
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    towerMesh.position.y = ENTITY_CONFIG.towerSpawnY;
    this.group.add(towerMesh);

    this.rangeGeometry = new RingGeometry(
      ENTITY_CONFIG.towerRingInnerRadius,
      ENTITY_CONFIG.towerRingOuterRadius,
      ENTITY_CONFIG.towerRingSegments
    );
    this.rangeMaterial = new MeshBasicMaterial({
      color: team === Team.BLUE ? COLORS.blueTeam : COLORS.redTeam,
      transparent: true,
      opacity: 0.18
    });
    this.attackRangeIndicator = new Mesh(this.rangeGeometry, this.rangeMaterial);
    this.attackRangeIndicator.rotation.x = -Math.PI / 2;
    this.attackRangeIndicator.visible = false;
    this.group.add(this.attackRangeIndicator);

    this.mesh = this.group;
    this.mesh.position.copy(this.position);

    this.addComponent({ type: "identity", kind: "tower" });
    this.addComponent({ type: "team", team });
    this.addComponent<HealthComponent>({
      type: "health",
      hp: this.stats.hp,
      maxHp: this.stats.maxHp,
      defense: TOWER_STATS.defense,
      isDead: false
    });
    this.addComponent<TowerCombatComponent>({
      type: "combat",
      attackDamage: this.stats.attackDamage,
      attackRange: this.stats.attackRange,
      attackSpeed: this.stats.attackSpeed,
      cooldownRemaining: 0,
      targetId: null
    });
    this.addComponent<StateComponent>({
      type: "state",
      state: this.state
    });
    this.addComponent<LifecycleComponent>({
      type: "lifecycle",
      shouldDispose: false,
      disposed: false
    });
  }

  /**
   * Toggles the debug attack range indicator.
   */
  public setDebugRangeVisible(visible: boolean): void {
    this.attackRangeIndicator.visible = visible;
  }

  /**
   * Synchronizes tower visual state with ECS components.
   */
  public update(_delta: number): void {
    const health = this.getComponent<HealthComponent>("health");
    const state = this.getComponent<StateComponent>("state");
    if (health) {
      this.stats.hp = health.hp;
      if (health.isDead) {
        this.state = TowerState.DESTROYED;
      }
    }
    if (state && this.isTowerState(state.state)) {
      this.state = state.state;
    }
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.visible = this.state !== TowerState.DESTROYED;
    }
  }

  /**
   * Disposes all geometry and material resources owned by this tower.
   */
  public dispose(): void {
    if (this.mesh) {
      disposeObject3D(this.mesh);
      this.mesh.removeFromParent();
      this.mesh = null;
      return;
    }

    this.towerGeometry.dispose();
    this.towerMaterial.dispose();
    this.rangeGeometry.dispose();
    this.rangeMaterial.dispose();
  }

  private isTowerState(state: string): state is TowerState {
    return state === TowerState.ACTIVE || state === TowerState.DESTROYED;
  }
}
