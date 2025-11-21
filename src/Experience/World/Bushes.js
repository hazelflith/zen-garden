import * as THREE from 'three'
import Experience from '../Experience.js'
import WindShader from '../Shaders/WindShader.js'

import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export default class Bushes {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.time = this.experience.time

    this.windShader = new WindShader(this.experience.world.environment)

    // Wait for resources
    if (this.resources.items.bushModel) {
      this.setModel()
    } else {
      this.resources.on('ready', () => {
        this.setModel()
      })
    }
  }

  setModel() {
    this.model = this.resources.items.bushModel

    // Group geometries by material
    const materialGroups = new Map()

    this.model.scene.traverse((child) => {
      if (child.isMesh) {
        const geometry = child.geometry.clone()
        geometry.applyMatrix4(child.matrixWorld)

        // Remove incompatible attributes
        geometry.deleteAttribute('uv1')
        geometry.deleteAttribute('uv2')
        geometry.deleteAttribute('tangent')

        const material = child.material
        const materialUuid = material.uuid

        if (!materialGroups.has(materialUuid)) {
          materialGroups.set(materialUuid, {
            material: material,
            geometries: []
          })
        }

        materialGroups.get(materialUuid).geometries.push(geometry)
      }
    })

    this.parts = []

    materialGroups.forEach((group) => {
      if (group.geometries.length > 0) {
        const mergedGeometry = mergeGeometries(group.geometries)

        if (mergedGeometry) {
          const finalMaterial = group.material.clone()

          // Apply wind shader
          this.windShader.apply(finalMaterial)

          this.parts.push({
            geometry: mergedGeometry,
            material: finalMaterial
          })
        }
      }
    })

    if (this.parts.length > 0) {
      this.setBushes()
    }
  }

  setBushes() {
    const bushCount = 30
    const terrain = this.experience.world.terrain
    const matrices = []

    // Calculate bounding sphere for height offset from the first part
    let radius = 0.5
    if (this.parts.length > 0) {
      this.parts[0].geometry.computeBoundingSphere()
      radius = this.parts[0].geometry.boundingSphere.radius * 3 // scaleFactor is 3
    }

    for (let i = 0; i < bushCount; i++) {
      const matrix = new THREE.Matrix4()

      let x, z
      let validPosition = false
      let attempts = 0

      while (!validPosition && attempts < 100) {
        attempts++
        const angle = Math.random() * Math.PI * 2

        // Place in Middle Grass (6-8) or Outer Grass (>9.5)
        const zone = Math.random() > 0.4 ? 'middle' : 'outer'
        const radius = zone === 'middle'
          ? 6.2 + Math.random() * 1.6 // 6.2 to 7.8
          : 10.0 + Math.random() * 4.0

        x = Math.sin(angle) * radius
        z = Math.cos(angle) * radius

        // Check for radial paths
        if (Math.abs(x) > 1.5 && Math.abs(z) > 1.5) {
          validPosition = true
        }
      }

      // Get height from terrain
      let y = 0
      if (terrain) {
        y = terrain.getHeightAt(x, z)
      }

      const position = new THREE.Vector3(x, y, z)

      const rotation = new THREE.Euler(0, Math.random() * Math.PI, 0)

      // Scale: Reset to reasonable size now that we have the full model
      const scaleFactor = 3
      const scale = new THREE.Vector3(
        (0.8 + Math.random() * 0.4) * scaleFactor,
        (0.8 + Math.random() * 0.4) * scaleFactor,
        (0.8 + Math.random() * 0.4) * scaleFactor
      )

      // Adjust Y based on centered geometry
      position.y += radius * 0.1 // Sink slightly

      matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale)
      matrices.push(matrix)
    }

    // Create InstancedMesh for each part
    this.instancedMeshes = []
    this.parts.forEach((part) => {
      const mesh = new THREE.InstancedMesh(part.geometry, part.material, bushCount)
      mesh.castShadow = false // Disabled for performance
      mesh.receiveShadow = true
      mesh.frustumCulled = true // Enable frustum culling

      for (let i = 0; i < bushCount; i++) {
        mesh.setMatrixAt(i, matrices[i])
      }

      this.scene.add(mesh)
      this.instancedMeshes.push(mesh)
    })
  }

  update() {
    const wind = this.experience.world.environment.wind
    const time = this.time.elapsed * 0.001

    this.parts.forEach((part) => {
      if (part.material.userData.updateWind) {
        part.material.userData.updateWind(
          time,
          new THREE.Vector2(Math.sin(wind.direction * Math.PI / 180), Math.cos(wind.direction * Math.PI / 180)),
          wind.strength
        )
      }
    })
  }
}
