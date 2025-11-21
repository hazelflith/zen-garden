import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import Experience from '../Experience.js'

export default class Rocks {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources

    this.setModels()
  }

  setModels() {
    const rocksGLB = this.resources.items.rockModels

    if (!rocksGLB) {
      console.warn('Rock models not loaded')
      return
    }

    // Extract all rock meshes from the GLB pack
    this.rockVariations = []
    rocksGLB.scene.traverse((child) => {
      if (child.isMesh) {
        // Clone geometry to avoid modifying the original resource if used elsewhere
        const geometry = child.geometry.clone()
        // Center the geometry so the pivot is in the middle
        geometry.center()

        this.rockVariations.push({
          geometry: geometry,
          material: child.material.clone()
        })
      }
    })

    console.log(`Loaded ${this.rockVariations.length} rock variations`)

    this.setMeshes()
  }

  setMeshes() {
    const count = 20
    const terrain = this.experience.world.terrain

    // Group geometries by material for merging
    const materialGroups = new Map()

    for (let i = 0; i < count; i++) {
      let x, z
      let validPosition = false
      let attempts = 0

      while (!validPosition && attempts < 100) {
        attempts++
        const angle = Math.random() * Math.PI * 2

        // Rocks can be in Sand (0-3.5) or Grass (6-8, >9.5)
        const rand = Math.random()
        let radius

        if (rand < 0.3) // 30% in sand
        {
          radius = 1.5 + Math.random() * 1.5 // 1.5 - 3.0
        }
        else if (rand < 0.7) // 40% in middle grass
        {
          radius = 6.2 + Math.random() * 1.6
        }
        else // 30% in outer grass
        {
          radius = 10.0 + Math.random() * 4.0
        }

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

      // Randomly select a rock variation
      const rockIndex = Math.floor(Math.random() * this.rockVariations.length)
      const rockData = this.rockVariations[rockIndex]

      // Clone geometry for transformation
      const geometry = rockData.geometry.clone()

      // Random scale (adjusted to be much smaller)
      const scaleUniform = (0.3 + Math.random() * 0.4) * 0.02

      // Random rotation
      const rotation = new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )

      // Compute bounding sphere for positioning
      geometry.computeBoundingSphere()
      const radius = geometry.boundingSphere.radius * scaleUniform

      // Position at surface level
      const position = new THREE.Vector3(x, y + radius * 0.2, z)

      // Apply transformations to geometry
      const matrix = new THREE.Matrix4()
      matrix.compose(
        position,
        new THREE.Quaternion().setFromEuler(rotation),
        new THREE.Vector3(scaleUniform, scaleUniform, scaleUniform)
      )
      geometry.applyMatrix4(matrix)

      // Group by material
      const materialUuid = rockData.material.uuid
      if (!materialGroups.has(materialUuid)) {
        materialGroups.set(materialUuid, {
          material: rockData.material,
          geometries: []
        })
      }
      materialGroups.get(materialUuid).geometries.push(geometry)
    }

    // Merge geometries for each material group
    materialGroups.forEach((group) => {
      if (group.geometries.length > 0) {
        const mergedGeometry = mergeGeometries(group.geometries)

        if (mergedGeometry) {
          const mesh = new THREE.Mesh(mergedGeometry, group.material)
          mesh.castShadow = true
          mesh.receiveShadow = true
          mesh.frustumCulled = true

          this.scene.add(mesh)
        }
      }
    })
  }
}
