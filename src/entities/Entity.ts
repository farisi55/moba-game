// src/entities/Entity.ts
import { Euler, Object3D, Vector3 } from "three";
import type { Component } from "@/types";

function createEntityId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `entity-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export abstract class Entity {
  public readonly id: string;
  public readonly position: Vector3;
  public readonly rotation: Euler;
  public mesh: Object3D | null;
  protected readonly components: Map<string, Component>;

  protected constructor(position: Vector3 = new Vector3()) {
    this.id = createEntityId();
    this.position = position.clone();
    this.rotation = new Euler();
    this.mesh = null;
    this.components = new Map<string, Component>();
  }

  /**
   * Updates entity-owned visual state after ECS systems have processed gameplay.
   */
  public abstract update(delta: number): void;

  /**
   * Releases all Three.js resources owned by this entity.
   */
  public abstract dispose(): void;

  /**
   * Adds or replaces a component by its stable component type.
   */
  public addComponent<T extends Component>(component: T): T {
    this.components.set(component.type, component);
    return component;
  }

  /**
   * Reads a component by type without mutating the entity.
   */
  public getComponent<T extends Component>(type: string): T | undefined {
    return this.components.get(type) as T | undefined;
  }

  /**
   * Checks whether this entity has a component of the provided type.
   */
  public hasComponent(type: string): boolean {
    return this.components.has(type);
  }
}
