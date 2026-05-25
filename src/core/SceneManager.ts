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
  WebGLRenderer
} from "three";
import { CAMERA_CONFIG, COLORS, FOG_CONFIG, LIGHT_CONFIG, RENDERER_CONFIG } from "@/config/constants";

export class SceneManager {
  /**
   * Creates the dark fantasy Three.js scene with fog and lighting.
   */
  public createScene(): Scene {
    const scene = new Scene();
    scene.background = new Color(COLORS.background);
    scene.fog = new FogExp2(COLORS.background, FOG_CONFIG.density);

    const ambientLight = new AmbientLight(COLORS.ambientLight, LIGHT_CONFIG.ambientIntensity);
    scene.add(ambientLight);

    const directionalLight = new DirectionalLight(COLORS.directionalLight, LIGHT_CONFIG.directionalIntensity);
    directionalLight.position.copy(LIGHT_CONFIG.directionalPosition);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = RENDERER_CONFIG.shadowMapSize;
    directionalLight.shadow.mapSize.height = RENDERER_CONFIG.shadowMapSize;
    scene.add(directionalLight);

    return scene;
  }

  /**
   * Creates an isometric orthographic camera for the current viewport.
   */
  public createCamera(width: number, height: number): OrthographicCamera {
    const aspect = width / height;
    const camera = new OrthographicCamera(
      (CAMERA_CONFIG.frustumSize * aspect) / -2,
      (CAMERA_CONFIG.frustumSize * aspect) / 2,
      CAMERA_CONFIG.frustumSize / 2,
      CAMERA_CONFIG.frustumSize / -2,
      CAMERA_CONFIG.near,
      CAMERA_CONFIG.far
    );
    camera.position.copy(CAMERA_CONFIG.position);
    camera.lookAt(CAMERA_CONFIG.target);
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDERER_CONFIG.pixelRatioMax));
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
    camera.left = (CAMERA_CONFIG.frustumSize * aspect) / -2;
    camera.right = (CAMERA_CONFIG.frustumSize * aspect) / 2;
    camera.top = CAMERA_CONFIG.frustumSize / 2;
    camera.bottom = CAMERA_CONFIG.frustumSize / -2;
    camera.updateProjectionMatrix();
  }
}
