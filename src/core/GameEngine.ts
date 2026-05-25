// src/core/GameEngine.ts
import {
  Clock,
  OrthographicCamera,
  Scene,
  WebGLRenderer
} from "three";
import { SceneManager } from "@/core/SceneManager";
import type { LifecycleComponent } from "@/entities/components";
import type { Entity } from "@/entities/Entity";
import type { System } from "@/types";

const FIXED_DELTA_SECONDS = 1 / 60;
const MAX_FRAME_DELTA_SECONDS = 0.25;
const MAX_DEVICE_PIXEL_RATIO = 2;

export class GameEngine {
  private renderer: WebGLRenderer | null;
  private scene: Scene | null;
  private camera: OrthographicCamera | null;
  private readonly clock: Clock;
  private readonly systems: System[];
  private readonly entities: Entity[];
  private readonly sceneManager: SceneManager;
  private readonly mountElement: HTMLElement;
  private accumulator: number;
  private animationFrameId: number | null;
  private isRunning: boolean;

  public constructor(mountElement: HTMLElement) {
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.clock = new Clock(false);
    this.systems = [];
    this.entities = [];
    this.sceneManager = new SceneManager();
    this.mountElement = mountElement;
    this.accumulator = 0;
    this.animationFrameId = null;
    this.isRunning = false;
  }

  /**
   * Initializes renderer, scene, and camera resources for the mounted app.
   */
  public init(): void {
    const canvas = document.getElementById("game-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("BrowserBrawl requires a canvas with id=\"game-canvas\".");
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    this.scene = this.sceneManager.createScene();
    this.camera = this.sceneManager.createCamera(width, height);
    this.renderer = this.sceneManager.createRenderer(canvas, width, height);
    this.mountElement.dataset.engine = "browserbrawl";
  }

  /**
   * Starts the fixed-timestep update loop and render pass.
   */
  public start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.clock.start();
    this.animationFrameId = window.requestAnimationFrame(this.tick);
  }

  /**
   * Stops the game loop without disposing active resources.
   */
  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.clock.stop();
  }

  /**
   * Adds a gameplay system that will process all active entities.
   */
  public addSystem(system: System): void {
    this.systems.push(system);
  }

  /**
   * Adds an entity to the engine and attaches its mesh to the scene.
   */
  public addEntity(entity: Entity): void {
    this.entities.push(entity);
    if (entity.mesh) {
      this.getScene().add(entity.mesh);
    }
  }

  /**
   * Marks an entity for disposal by id.
   */
  public removeEntity(entityId: string): void {
    const entity = this.entities.find((entry) => entry.id === entityId);
    if (!entity) {
      return;
    }

    const lifecycle = entity.getComponent<LifecycleComponent>("lifecycle");
    if (lifecycle) {
      lifecycle.shouldDispose = true;
      return;
    }

    entity.dispose();
    const index = this.entities.indexOf(entity);
    if (index >= 0) {
      this.entities.splice(index, 1);
    }
  }

  /**
   * Returns a read-only view of active entities.
   */
  public getEntities(): readonly Entity[] {
    return this.entities;
  }

  /**
   * Returns the active Three.js scene.
   */
  public getScene(): Scene {
    if (!this.scene) {
      throw new Error("GameEngine.init() must be called before getScene().");
    }

    return this.scene;
  }

  /**
   * Returns the configured WebGL renderer.
   */
  public getRenderer(): WebGLRenderer {
    if (!this.renderer) {
      throw new Error("GameEngine.init() must be called before getRenderer().");
    }

    return this.renderer;
  }

  /**
   * Returns the active isometric orthographic camera.
   */
  public getCamera(): OrthographicCamera {
    if (!this.camera) {
      throw new Error("GameEngine.init() must be called before getCamera().");
    }

    return this.camera;
  }

  /**
   * Resizes renderer and camera projection to match the viewport.
   */
  public resize(width: number, height: number): void {
    const renderer = this.getRenderer();
    const camera = this.getCamera();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DEVICE_PIXEL_RATIO));
    renderer.setSize(width, height, false);
    this.sceneManager.resizeCamera(camera, width, height);
  }

  /**
   * Stops the loop and disposes all active WebGL resources.
   */
  public dispose(): void {
    this.stop();
    for (const entity of this.entities) {
      entity.dispose();
    }
    this.entities.length = 0;
    this.renderer?.dispose();
  }

  private readonly tick = (): void => {
    if (!this.isRunning) {
      return;
    }

    const frameDelta = Math.min(this.clock.getDelta(), MAX_FRAME_DELTA_SECONDS);
    this.accumulator += frameDelta;

    while (this.accumulator >= FIXED_DELTA_SECONDS) {
      this.loop(FIXED_DELTA_SECONDS);
      this.accumulator -= FIXED_DELTA_SECONDS;
    }

    this.getRenderer().render(this.getScene(), this.getCamera());
    this.animationFrameId = window.requestAnimationFrame(this.tick);
  };

  private loop(delta: number): void {
    const snapshot = [...this.entities];
    for (const system of this.systems) {
      system.update(delta, snapshot);
    }
    for (const entity of snapshot) {
      entity.update(delta);
    }
    this.disposeFlaggedEntities();
  }

  private disposeFlaggedEntities(): void {
    for (let index = this.entities.length - 1; index >= 0; index -= 1) {
      const entity = this.entities[index];
      const lifecycle = entity.getComponent<LifecycleComponent>("lifecycle");
      if (!lifecycle?.shouldDispose || lifecycle.disposed) {
        continue;
      }

      entity.dispose();
      lifecycle.disposed = true;
      this.entities.splice(index, 1);
    }
  }
}
