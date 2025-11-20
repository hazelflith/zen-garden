import * as THREE from 'three'
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

    // Create individual meshes for each rock (allows different geometries)
    this.rocks = []

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

      // Create mesh
      const rock = new THREE.Mesh(rockData.geometry, rockData.material)
      rock.castShadow = true
      rock.receiveShadow = true

      // Random scale (adjusted to be much smaller)
      const scaleUniform = (0.3 + Math.random() * 0.4) * 0.02
      rock.scale.set(scaleUniform, scaleUniform, scaleUniform)

      // Random rotation
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )

      // Position at surface level
      // Since geometry is centered, the pivot is at the center of the rock.
      // We want the bottom of the rock to be slightly below the terrain.
      // We can approximate the radius/height from the bounding sphere or box.
      rock.geometry.computeBoundingSphere()
      const radius = rock.geometry.boundingSphere.radius * scaleUniform

      // Place center at y + radius * 0.5 (so it's mostly above ground but sunk a bit)
      // Actually, if we want it "on surface", center should be at y + radius?
      // Let's sink it a bit: y + radius * 0.2
      rock.position.set(x, y + radius * 0.2, z)

      this.scene.add(rock)
      this.rocks.push(rock)
    }
  }
}
