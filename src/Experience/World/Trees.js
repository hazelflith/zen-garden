import * as THREE from 'three'
import Experience from '../Experience.js'
import ProceduralTree from './ProceduralTree.js'
import WindShader from '../Shaders/WindShader.js'

export default class Trees {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.time = this.experience.time

    this.windShader = new WindShader(this.experience.world.environment)
    this.items = []

    this.setTrees()
  }

  setTrees() {
    this.group = new THREE.Group()
    this.group.frustumCulled = true // Enable frustum culling
    this.scene.add(this.group)

    const count = 3
    const terrain = this.experience.world.terrain

    for (let i = 0; i < count; i++) {
      let x, z
      let validPosition = false
      let attempts = 0

      while (!validPosition && attempts < 200) {
        attempts++
        const angle = Math.random() * Math.PI * 2

        const zone = Math.random() > 0.5 ? 'middle' : 'outer'
        const radius = zone === 'middle'
          ? 6.5 + Math.random() * 1.0 // 6.5 to 7.5
          : 10.0 + Math.random() * 4.0 // > 10

        x = Math.sin(angle) * radius
        z = Math.cos(angle) * radius

        // Check for radial paths (approx width 1.5)
        // Relaxed buffer to 1.25 (Root only check)
        if (Math.abs(x) > 1.25 && Math.abs(z) > 1.25) {
          validPosition = true
        }
      }

      // Fallback if still no valid position
      if (!validPosition) {
        const angle = Math.random() * Math.PI * 2
        const radius = 11.0 + Math.random() * 2.0
        x = Math.sin(angle) * radius
        z = Math.cos(angle) * radius
        // Force away from axis
        if (Math.abs(x) < 1.25) x += (x > 0 ? 1.25 : -1.25)
        if (Math.abs(z) < 1.25) z += (z > 0 ? 1.25 : -1.25)
      }

      // Get height from terrain
      let y = 0
      if (terrain) {
        y = terrain.getHeightAt(x, z)
      }

      // Create LOD object for this tree
      const lod = new THREE.LOD()
      lod.position.set(x, y, z)

      // High detail tree (0-15 units)
      const treeHigh = new ProceduralTree(
        lod,
        new THREE.Vector3(0, 0, 0),
        0.27 + Math.random() * 0.18,
        Math.random() * Math.PI * 2,
        this.windShader
      )

      // Medium detail tree (15-30 units) - 60% segments
      const treeMedium = new ProceduralTree(
        lod,
        new THREE.Vector3(0, 0, 0),
        0.27 + Math.random() * 0.18,
        Math.random() * Math.PI * 2,
        this.windShader,
        0.6 // Reduce detail to 60%
      )

      // Low detail tree (30+ units) - 30% segments
      const treeLow = new ProceduralTree(
        lod,
        new THREE.Vector3(0, 0, 0),
        0.27 + Math.random() * 0.18,
        Math.random() * Math.PI * 2,
        this.windShader,
        0.3 // Reduce detail to 30%
      )

      // Set LOD distances
      lod.addLevel(treeHigh.group || new THREE.Group(), 0)    // 0-15 units
      lod.addLevel(treeMedium.group || new THREE.Group(), 15) // 15-30 units
      lod.addLevel(treeLow.group || new THREE.Group(), 30)    // 30+ units

      this.group.add(lod)
      this.items.push({ lod, trees: [treeHigh, treeMedium, treeLow] })
    }
  }

  update() {
    const wind = this.experience.world.environment.wind
    const time = this.time.elapsed * 0.001

    this.items.forEach(item => {
      // Update all tree detail levels (only the visible one will be rendered)
      item.trees.forEach(tree => {
        tree.update(time, wind)
      })
    })
  }
}
