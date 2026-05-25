// src/entities/heroModels.ts
import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
} from 'three'

function mat(color: string, emissive: string, emissiveIntensity = 0.15): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity,
    roughness: 0.65,
    metalness: 0.2,
  })
}

function addMesh(group: Group, geo: BoxGeometry | CylinderGeometry | SphereGeometry | ConeGeometry | TorusGeometry, material: MeshStandardMaterial, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1): void {
  const mesh = new Mesh(geo, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.position.set(x, y, z)
  mesh.scale.set(sx, sy, sz)
  group.add(mesh)
}

/**
 * TANK — Ironclad: wide armored warrior, stocky build
 * colorHex: "#7f8fa6", emissive team color
 */
export function buildTankModel(primaryColor: string, emissiveColor: string): Group {
  const g = new Group()
  const armor = mat(primaryColor, emissiveColor, 0.2)
  const dark = mat('#3a4050', emissiveColor, 0.05)
  const gold = mat('#c9a84c', '#c9a84c', 0.4)

  // Legs (two pillars)
  addMesh(g, new CylinderGeometry(0.18, 0.22, 0.55, 8), armor, -0.22, 0.28, 0)
  addMesh(g, new CylinderGeometry(0.18, 0.22, 0.55, 8), armor,  0.22, 0.28, 0)

  // Torso — wide armored chest
  addMesh(g, new BoxGeometry(0.92, 0.7, 0.58), armor, 0, 0.82, 0)

  // Belly plate
  addMesh(g, new BoxGeometry(0.7, 0.28, 0.6), dark, 0, 0.55, 0.02)

  // Chest emblem
  addMesh(g, new BoxGeometry(0.22, 0.22, 0.1), gold, 0, 0.88, 0.32)

  // Left pauldron (shoulder plate)
  addMesh(g, new SphereGeometry(0.28, 8, 6), armor, -0.58, 1.05, 0)
  // Right pauldron
  addMesh(g, new SphereGeometry(0.28, 8, 6), armor,  0.58, 1.05, 0)

  // Arms
  addMesh(g, new CylinderGeometry(0.14, 0.16, 0.55, 7), armor, -0.55, 0.72, 0)
  addMesh(g, new CylinderGeometry(0.14, 0.16, 0.55, 7), armor,  0.55, 0.72, 0)

  // Head — helmet
  addMesh(g, new CylinderGeometry(0.28, 0.32, 0.38, 8), armor, 0, 1.45, 0)
  // Helmet top spike
  addMesh(g, new ConeGeometry(0.1, 0.28, 6), gold, 0, 1.74, 0)
  // Visor slit
  addMesh(g, new BoxGeometry(0.35, 0.07, 0.08), dark, 0, 1.44, 0.28)

  // Shield on left arm
  addMesh(g, new BoxGeometry(0.08, 0.52, 0.42), gold, -0.72, 0.72, 0.1)

  return g
}

/**
 * ASSASSIN — Shadowblade: slim acrobat, dagger, hood
 * colorHex: "#7d4ed8", emissive team color
 */
export function buildAssassinModel(primaryColor: string, emissiveColor: string): Group {
  const g = new Group()
  const cloth = mat(primaryColor, emissiveColor, 0.2)
  const dark = mat('#1a1025', emissiveColor, 0.05)
  const blade = mat('#d0d8e8', '#8899cc', 0.5)

  // Legs — slim, long
  addMesh(g, new CylinderGeometry(0.1, 0.13, 0.65, 7), dark, -0.14, 0.33, 0)
  addMesh(g, new CylinderGeometry(0.1, 0.13, 0.65, 7), dark,  0.14, 0.33, 0)

  // Torso — slim
  addMesh(g, new BoxGeometry(0.52, 0.72, 0.36), cloth, 0, 0.9, 0)

  // Cape/back fin — gives silhouette width
  addMesh(g, new BoxGeometry(0.62, 0.85, 0.06), dark, 0, 0.92, -0.22)

  // Arms — crossed
  addMesh(g, new CylinderGeometry(0.08, 0.1, 0.5, 6), cloth, -0.34, 0.82, 0)
  addMesh(g, new CylinderGeometry(0.08, 0.1, 0.5, 6), cloth,  0.34, 0.82, 0)

  // Hood — sphere + cone
  addMesh(g, new SphereGeometry(0.24, 8, 7), dark, 0, 1.46, 0)
  addMesh(g, new ConeGeometry(0.25, 0.3, 8), dark, 0, 1.72, 0)

  // Face mask slit
  addMesh(g, new BoxGeometry(0.22, 0.06, 0.06), blade, 0, 1.44, 0.22)

  // Dagger in right hand
  addMesh(g, new BoxGeometry(0.04, 0.48, 0.06), blade, 0.42, 0.72, 0.06)
  // Dagger guard
  addMesh(g, new BoxGeometry(0.2, 0.04, 0.06), blade, 0.42, 0.55, 0.06)

  // Secondary dagger on back
  addMesh(g, new BoxGeometry(0.04, 0.38, 0.05), blade, -0.1, 1.1, -0.2)

  return g
}

/**
 * MAGE — Stormcaller: robed figure, tall staff, wide hat
 * colorHex: "#45b7d8", emissive team color
 */
export function buildMageModel(primaryColor: string, emissiveColor: string): Group {
  const g = new Group()
  const robe = mat(primaryColor, emissiveColor, 0.2)
  const dark = mat('#1a2835', emissiveColor, 0.05)
  const glow = mat('#88ddff', '#44aaff', 0.9)
  const wood = mat('#5c4020', '#221800', 0.1)

  // Robe bottom — wide tapered cylinder
  addMesh(g, new CylinderGeometry(0.48, 0.6, 0.65, 10), robe, 0, 0.32, 0)

  // Robe top / torso
  addMesh(g, new CylinderGeometry(0.34, 0.48, 0.62, 10), robe, 0, 0.93, 0)

  // Collar
  addMesh(g, new TorusGeometry(0.3, 0.07, 6, 12), dark, 0, 1.28, 0)

  // Head
  addMesh(g, new SphereGeometry(0.24, 8, 7), dark, 0, 1.56, 0)

  // Hat brim — flat wide disc
  addMesh(g, new CylinderGeometry(0.52, 0.52, 0.06, 12), dark, 0, 1.76, 0)
  // Hat cone
  addMesh(g, new ConeGeometry(0.26, 0.52, 10), robe, 0, 2.05, 0)
  // Hat tip glow
  addMesh(g, new SphereGeometry(0.07, 6, 6), glow, 0, 2.33, 0)

  // Left arm raising staff
  addMesh(g, new CylinderGeometry(0.07, 0.08, 0.5, 6), robe, -0.32, 0.92, 0.1)

  // Right arm outward
  addMesh(g, new CylinderGeometry(0.07, 0.09, 0.48, 6), robe, 0.34, 0.9, 0)

  // Staff — tall pole
  addMesh(g, new CylinderGeometry(0.04, 0.05, 1.85, 7), wood, -0.52, 0.98, 0)
  // Staff orb
  addMesh(g, new SphereGeometry(0.13, 8, 8), glow, -0.52, 1.93, 0)
  // Staff ring
  addMesh(g, new TorusGeometry(0.16, 0.03, 6, 12), glow, -0.52, 1.78, 0)

  return g
}
