// src/entities/dispose.ts
import {
  BufferGeometry,
  Material,
  Mesh,
  Object3D
} from "three";

function disposeMaterial(material: Material | Material[]): void {
  if (Array.isArray(material)) {
    for (const entry of material) {
      entry.dispose();
    }
    return;
  }

  material.dispose();
}

/**
 * Disposes geometries and materials for a Three.js object hierarchy.
 */
export function disposeObject3D(object: Object3D): void {
  object.traverse((child) => {
    if (child instanceof Mesh) {
      const geometry: BufferGeometry = child.geometry;
      geometry.dispose();
      disposeMaterial(child.material);
    }
  });
}
