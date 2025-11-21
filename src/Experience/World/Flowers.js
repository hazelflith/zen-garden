import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import Experience from '../Experience.js'
import WindShader from '../Shaders/WindShader.js'

export default class Flowers {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.time = this.experience.time

    this.models = [
      { resource: this.resources.items.flowerRed, id: 'red', scale: 0.015 },
      { resource: this.resources.items.flowerYellow, id: 'yellow', scale: 0.01 },
      { resource: this.resources.items.flowerWhite, id: 'white', scale: 0.012 }
    ]

    this.windShader = new WindShader(this.experience.world.environment)
    this.processModels()
  }

  processModels() {
    this.flowerTypes = []

    this.models.forEach((modelData) => {
      if (!modelData.resource) {
        console.warn(`Flower model ${modelData.id} not loaded`)
        return
      }

      // Group geometries by material
      const materialGroups = new Map()

      modelData.resource.scene.traverse((child) => {
        if (child.isMesh) {
          const geometry = child.geometry.clone()
          geometry.applyMatrix4(child.matrixWorld)

          // Remove incompatible attributes to prevent merge errors
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

      const parts = []

      materialGroups.forEach((group) => {
        if (group.geometries.length > 0) {
          const mergedGeometry = mergeGeometries(group.geometries)

          if (mergedGeometry) {
            // Don't center individual parts, or they will lose relative alignment
            // mergedGeometry.center() 
            // Instead, we might want to center the WHOLE flower, but for now let's trust the model origin

            // Ensure double-sided for leaves/petals
            const finalMaterial = group.material.clone()
            finalMaterial.side = THREE.DoubleSide

            // Apply wind shader
            this.windShader.apply(finalMaterial)

            parts.push({
              geometry: mergedGeometry,
              material: finalMaterial
            })
          }
        }
      })

      if (parts.length > 0) {
        this.flowerTypes.push({
          id: modelData.id,
          parts: parts,
          scale: modelData.scale
        })
      }
    })

    if (this.flowerTypes.length > 0) {
      this.setMeshes()
    }
  }

  setMeshes() {
    const countPerType = 30
    const terrain = this.experience.world.terrain

    this.flowerTypes.forEach((flowerType) => {
      // Generate instance matrices once per flower type
      const matrices = []

      // Calculate bounding sphere for the first part to determine height offset
      // This is an approximation, ideally we'd compute the bounding box of the whole flower
      let radius = 0.5
      if (flowerType.parts.length > 0) {
        flowerType.parts[0].geometry.computeBoundingSphere()
        radius = flowerType.parts[0].geometry.boundingSphere.radius * flowerType.scale
      }

      for (let i = 0; i < countPerType; i++) {
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
            ? 6.2 + Math.random() * 1.6
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

        const rotation = new THREE.Euler(
          (Math.random() - 0.5) * 0.2, // Slight random tilt
          Math.random() * Math.PI * 2,
          (Math.random() - 0.5) * 0.2
        )

        // Scale
        const scaleFactor = flowerType.scale
        const scale = new THREE.Vector3(
          (0.8 + Math.random() * 0.4) * scaleFactor,
          (0.8 + Math.random() * 0.4) * scaleFactor,
          (0.8 + Math.random() * 0.4) * scaleFactor
        )

        // Adjust Y - assuming origin is at bottom, but if not, we might need offset
        // Since we removed centering, we rely on model origin. 
        // Usually models have origin at (0,0,0) which is the base.
        // If we need to sink it or raise it, we can adjust here.
        // position.y += radius * 0.5 // Removed for now as we removed centering

        matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale)
        matrices.push(matrix)
      }

      // Create InstancedMesh for each part using the SAME matrices
      flowerType.instancedMeshes = []
      flowerType.parts.forEach((part) => {
        const mesh = new THREE.InstancedMesh(part.geometry, part.material, countPerType)
        mesh.castShadow = false // Disabled for performance
        mesh.receiveShadow = true
        mesh.frustumCulled = true // Enable frustum culling

        for (let i = 0; i < countPerType; i++) {
          mesh.setMatrixAt(i, matrices[i])
        }

        this.scene.add(mesh)
        flowerType.instancedMeshes.push(mesh)
      })
    })
  }

  update() {
    const wind = this.experience.world.environment.wind
    const time = this.time.elapsed * 0.001

    this.flowerTypes.forEach((flowerType) => {
      flowerType.parts.forEach((part) => {
        if (part.material.userData.updateWind) {
          part.material.userData.updateWind(
            time,
            new THREE.Vector2(Math.sin(wind.direction * Math.PI / 180), Math.cos(wind.direction * Math.PI / 180)),
            wind.strength
          )
        }
      })
    })
  }
}
