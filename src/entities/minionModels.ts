// src/entities/minionModels.ts
import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
} from 'three'
import { MinionType } from '@/entities/Minion'

function mat(color: string, emissive: string, emissiveIntensity = 0.1): MeshStandardMaterial {
  return new MeshStandardMaterial({ color, emissive, emissiveIntensity, roughness: 0.7, metalness: 0.1 })
}

function addMesh(group: Group, geo: BoxGeometry | CylinderGeometry | SphereGeometry | ConeGeometry, material: MeshStandardMaterial, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1): void {
  const mesh = new Mesh(geo, material)
  mesh.castShadow = true
  mesh.position.set(x, y, z)
  mesh.scale.set(sx, sy, sz)
  group.add(mesh)
}

/**
 * MELEE minion — small foot soldier
 */
export function buildMeleeMinion(teamColor: string, emissive: string): Group {
  const g = new Group()
  const body = mat(teamColor, emissive, 0.15)
  const dark = mat('#222', emissive, 0.05)

  // Legs
  addMesh(g, new CylinderGeometry(0.07, 0.09, 0.28, 6), dark, -0.1, 0.14, 0)
  addMesh(g, new CylinderGeometry(0.07, 0.09, 0.28, 6), dark,  0.1, 0.14, 0)
  // Torso
  addMesh(g, new BoxGeometry(0.38, 0.32, 0.28), body, 0, 0.44, 0)
  // Arms
  addMesh(g, new CylinderGeometry(0.05, 0.06, 0.28, 5), body, -0.22, 0.38, 0)
  addMesh(g, new CylinderGeometry(0.05, 0.06, 0.28, 5), body,  0.22, 0.38, 0)
  // Head
  addMesh(g, new SphereGeometry(0.15, 7, 6), body, 0, 0.72, 0)
  // Helmet
  addMesh(g, new CylinderGeometry(0.12, 0.16, 0.12, 7), dark, 0, 0.83, 0)

  return g
}

/**
 * RANGED minion — archer, taller thinner
 */
export function buildRangedMinion(teamColor: string, emissive: string): Group {
  const g = new Group()
  const body = mat(teamColor, emissive, 0.15)
  const dark = mat('#1a1a2e', emissive, 0.05)
  const bow = mat('#8b6914', '#443300', 0.1)

  // Legs
  addMesh(g, new CylinderGeometry(0.06, 0.07, 0.32, 6), dark, -0.09, 0.16, 0)
  addMesh(g, new CylinderGeometry(0.06, 0.07, 0.32, 6), dark,  0.09, 0.16, 0)
  // Torso — slim
  addMesh(g, new BoxGeometry(0.3, 0.38, 0.22), body, 0, 0.52, 0)
  // Cloak
  addMesh(g, new BoxGeometry(0.36, 0.42, 0.06), dark, 0, 0.5, -0.14)
  // Arms
  addMesh(g, new CylinderGeometry(0.04, 0.05, 0.3, 5), body, -0.2, 0.46, 0)
  addMesh(g, new CylinderGeometry(0.04, 0.05, 0.3, 5), body,  0.2, 0.46, 0)
  // Head
  addMesh(g, new SphereGeometry(0.13, 7, 6), body, 0, 0.8, 0)
  // Hood
  addMesh(g, new ConeGeometry(0.15, 0.22, 7), dark, 0, 0.95, 0)
  // Bow (vertical arc approximated as tall thin box)
  addMesh(g, new BoxGeometry(0.04, 0.52, 0.04), bow, 0.32, 0.52, 0.06)
  addMesh(g, new BoxGeometry(0.04, 0.04, 0.04), bow, 0.32, 0.78, 0.06)
  addMesh(g, new BoxGeometry(0.04, 0.04, 0.04), bow, 0.32, 0.26, 0.06)

  return g
}

/**
 * SIEGE minion — wide squat war machine
 */
export function buildSiegeMinion(teamColor: string, emissive: string): Group {
  const g = new Group()
  const hull = mat(teamColor, emissive, 0.2)
  const dark = mat('#2a2a3a', emissive, 0.05)
  const metal = mat('#888', '#444', 0.2)

  // Base — wide flat block
  addMesh(g, new BoxGeometry(0.7, 0.22, 0.52), hull, 0, 0.11, 0)
  // Wheels (cylinders on sides)
  addMesh(g, new CylinderGeometry(0.14, 0.14, 0.1, 8), dark, -0.36, 0.14, 0, 1, 1, 1)
  addMesh(g, new CylinderGeometry(0.14, 0.14, 0.1, 8), dark,  0.36, 0.14, 0, 1, 1, 1)
  // Body
  addMesh(g, new BoxGeometry(0.5, 0.3, 0.42), hull, 0, 0.37, 0)
  // Barrel / cannon
  addMesh(g, new CylinderGeometry(0.08, 0.1, 0.52, 8), metal, 0, 0.44, 0.28, 1, 1, 1)
  // Barrel tip
  addMesh(g, new CylinderGeometry(0.06, 0.08, 0.1, 8), metal, 0, 0.44, 0.54, 1, 1, 1)
  // Top armor plate
  addMesh(g, new BoxGeometry(0.44, 0.1, 0.36), dark, 0, 0.57, 0)

  return g
}

export function buildMinionModel(type: MinionType, teamColor: string, emissive: string): Group {
  if (type === MinionType.RANGED) return buildRangedMinion(teamColor, emissive)
  if (type === MinionType.SIEGE) return buildSiegeMinion(teamColor, emissive)
  return buildMeleeMinion(teamColor, emissive)
}
