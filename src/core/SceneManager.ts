// src/core/SceneManager.ts
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Color,
  DirectionalLight,
  FogExp2,
  OrthographicCamera,
  PCFSoftShadowMap,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer
} from "three";

const BACKGROUND_COLOR = "#0a0a1a";
const AMBIENT_LIGHT_COLOR = "#1a1a3e";
const DIRECTIONAL_LIGHT_COLOR = "#4466ff";
const AMBIENT_LIGHT_INTENSITY = 0.5;
const DIRECTIONAL_LIGHT_INTENSITY = 1.0;
const FOG_DENSITY = 0.02;
const FRUSTUM_SIZE = 20;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 1000;
const MAX_DEVICE_PIXEL_RATIO = 2;
const SHADOW_MAP_SIZE = 2048;
const CAMERA_POSITION = new Vector3(20, 20, 20);
const CAMERA_TARGET = new Vector3(0, 0, 0);
const DIRECTIONAL_LIGHT_POSITION = new Vector3(12, 24, 8);

export class SceneManager {
  /**
   * Creates the dark fantasy Three.js scene with fog and lighting.
   */
  public createScene(): Scene {
    const scene = new Scene();
    scene.background = new Color(BACKGROUND_COLOR);
    scene.fog = new FogExp2(BACKGROUND_COLOR, FOG_DENSITY);

    const ambientLight = new AmbientLight(AMBIENT_LIGHT_COLOR, AMBIENT_LIGHT_INTENSITY);
    scene.add(ambientLight);

    const directionalLight = new DirectionalLight(DIRECTIONAL_LIGHT_COLOR, DIRECTIONAL_LIGHT_INTENSITY);
    directionalLight.position.copy(DIRECTIONAL_LIGHT_POSITION);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = SHADOW_MAP_SIZE;
    directionalLight.shadow.mapSize.height = SHADOW_MAP_SIZE;
    scene.add(directionalLight);

    return scene;
  }

  /**
   * Creates an isometric orthographic camera for the current viewport.
   */
  public createCamera(width: number, height: number): OrthographicCamera {
    const aspect = width / height;
    const camera = new OrthographicCamera(
      (FRUSTUM_SIZE * aspect) / -2,
      (FRUSTUM_SIZE * aspect) / 2,
      FRUSTUM_SIZE / 2,
      FRUSTUM_SIZE / -2,
      CAMERA_NEAR,
      CAMERA_FAR
    );
    camera.position.copy(CAMERA_POSITION);
    camera.lookAt(CAMERA_TARGET);
    return camera;
  }

  /**
   * Creates a configured WebGL renderer using the provided canvas.
   */
  public createRenderer(canvas: HTMLCanvasElement, width: number, height: number): WebGLRenderer {
    const renderer = new WebGLRenderer({
      canvas,
      antialias: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DEVICE_PIXEL_RATIO));
    renderer.setSize(width, height, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.outputColorSpace = SRGBColorSpace;
    return renderer;
  }

  /**
   * Updates the orthographic camera when the viewport changes.
   */
  public resizeCamera(camera: OrthographicCamera, width: number, height: number): void {
    const aspect = width / height;
    camera.left = (FRUSTUM_SIZE * aspect) / -2;
    camera.right = (FRUSTUM_SIZE * aspect) / 2;
    camera.top = FRUSTUM_SIZE / 2;
    camera.bottom = FRUSTUM_SIZE / -2;
    camera.updateProjectionMatrix();
  }
}
