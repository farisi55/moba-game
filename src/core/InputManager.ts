// src/core/InputManager.ts
import {
  OrthographicCamera,
  Plane,
  Raycaster,
  Vector2,
  Vector3
} from "three";

const NORMALIZED_DEVICE_MIN = -1;
const NORMALIZED_DEVICE_RANGE = 2;
const GROUND_PLANE_HEIGHT = 0;
const TOUCH_ACTION_KEY = "touch";
const PRIMARY_POINTER_KEY = "pointer";

export type InputActionType = "keydown" | "keyup" | "pointer" | "touch";

export interface InputAction {
  type: InputActionType;
  key: string | null;
  position: Vector2;
  worldPosition: Vector3;
}

type InputActionCallback = (action: InputAction) => void;

export class InputManager {
  private static instance: InputManager | null = null;
  private readonly keysPressed: Set<string>;
  private readonly mousePosition: Vector2;
  private readonly mouseWorldPosition: Vector3;
  private readonly raycaster: Raycaster;
  private readonly groundPlane: Plane;
  private readonly callbacks: Set<InputActionCallback>;
  private canvas: HTMLCanvasElement | null;
  private camera: OrthographicCamera | null;
  private isConfigured: boolean;

  private constructor() {
    this.keysPressed = new Set<string>();
    this.mousePosition = new Vector2();
    this.mouseWorldPosition = new Vector3();
    this.raycaster = new Raycaster();
    this.groundPlane = new Plane(new Vector3(0, 1, 0), -GROUND_PLANE_HEIGHT);
    this.callbacks = new Set<InputActionCallback>();
    this.canvas = null;
    this.camera = null;
    this.isConfigured = false;
  }

  /**
   * Returns the singleton input manager instance.
   */
  public static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }

    return InputManager.instance;
  }

  /**
   * Connects browser keyboard, pointer, and touch events to the game canvas.
   */
  public configure(canvas: HTMLCanvasElement, camera: OrthographicCamera): void {
    this.canvas = canvas;
    this.camera = camera;
    if (this.isConfigured) {
      return;
    }

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    canvas.addEventListener("pointermove", this.handlePointerMove);
    canvas.addEventListener("pointerdown", this.handlePointerDown);
    canvas.addEventListener("touchstart", this.handleTouch, { passive: false });
    canvas.addEventListener("touchmove", this.handleTouch, { passive: false });
    canvas.addEventListener("touchend", this.handleTouchEnd);
    this.isConfigured = true;
  }

  /**
   * Checks whether a keyboard-style action is currently pressed.
   */
  public isKeyDown(key: string): boolean {
    return this.keysPressed.has(this.normalizeKey(key));
  }

  /**
   * Returns the latest mouse or touch intersection with the world plane.
   */
  public getMouseWorld(): Vector3 {
    return this.mouseWorldPosition.clone();
  }

  /**
   * Subscribes to normalized keyboard, pointer, and touch actions.
   */
  public onAction(callback: InputActionCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Removes all browser event listeners owned by the input manager.
   */
  public dispose(): void {
    if (!this.isConfigured || !this.canvas) {
      return;
    }

    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("touchstart", this.handleTouch);
    this.canvas.removeEventListener("touchmove", this.handleTouch);
    this.canvas.removeEventListener("touchend", this.handleTouchEnd);
    this.isConfigured = false;
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const key = this.normalizeKey(event.key);
    this.keysPressed.add(key);
    this.emit("keydown", key);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    const key = this.normalizeKey(event.key);
    this.keysPressed.delete(key);
    this.emit("keyup", key);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    this.updatePointerPosition(event.clientX, event.clientY);
    this.emit("pointer", null);
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.updatePointerPosition(event.clientX, event.clientY);
    this.emit("pointer", PRIMARY_POINTER_KEY);
  };

  private readonly handleTouch = (event: TouchEvent): void => {
    event.preventDefault();
    const touch = event.touches.item(0);
    if (!touch) {
      return;
    }

    this.keysPressed.add(TOUCH_ACTION_KEY);
    this.updatePointerPosition(touch.clientX, touch.clientY);
    this.emit("touch", TOUCH_ACTION_KEY);
  };

  private readonly handleTouchEnd = (): void => {
    this.keysPressed.delete(TOUCH_ACTION_KEY);
    this.emit("keyup", TOUCH_ACTION_KEY);
  };

  private updatePointerPosition(clientX: number, clientY: number): void {
    if (!this.canvas || !this.camera) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    this.mousePosition.x =
      ((clientX - rect.left) / rect.width) * NORMALIZED_DEVICE_RANGE + NORMALIZED_DEVICE_MIN;
    this.mousePosition.y =
      -(((clientY - rect.top) / rect.height) * NORMALIZED_DEVICE_RANGE + NORMALIZED_DEVICE_MIN);
    this.raycaster.setFromCamera(this.mousePosition, this.camera);
    this.raycaster.ray.intersectPlane(this.groundPlane, this.mouseWorldPosition);
  }

  private emit(type: InputActionType, key: string | null): void {
    const action: InputAction = {
      type,
      key,
      position: this.mousePosition.clone(),
      worldPosition: this.mouseWorldPosition.clone()
    };

    for (const callback of this.callbacks) {
      callback(action);
    }
  }

  private normalizeKey(key: string): string {
    return key.toLowerCase();
  }
}
