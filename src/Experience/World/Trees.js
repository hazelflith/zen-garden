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

    const count = Math.floor(Math.random() * 4) + 3 // Random 3-6 trees
    const terrain = this.experience.world.terrain

    let innerTreeCount = 0

    for (let i = 0; i < count; i++) {
      let x, z
      let validPosition = false
      let attempts = 0

      while (!validPosition && attempts < 200) {
        attempts++
        const angle = Math.random() * Math.PI * 2

        let zone = Math.random() > 0.5 ? 'middle' : 'outer'

        // Limit inner ring (middle) to max 2 trees
        if (zone === 'middle' && innerTreeCount >= 2) {
          zone = 'outer'
        }

        const radius = zone === 'middle'
          ? 6.5 + Math.random() * 1.0 // 6.5 to 7.5
          : 10.0 + Math.random() * 4.0 // > 10


        x = Math.sin(angle) * radius
        z = Math.cos(angle) * radius

        // Check for radial paths (approx width 1.5)
        // Relaxed buffer to 1.25 (Root only check)
        if (Math.abs(x) > 1.25 && Math.abs(z) > 1.25) {
          validPosition = true
          if (zone === 'middle') {
            innerTreeCount++
          }
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

      // Check quality preset
      const isMaxQuality = this.experience.performanceMonitor.getCurrentPreset() === 'max'

      if (isMaxQuality) {
        // No LOD for max quality - always use high detail
        const treeHigh = new ProceduralTree(
          this.group, // Add directly to main group
          new THREE.Vector3(x, y, z), // Absolute position
          0.27 + Math.random() * 0.18,
          Math.random() * Math.PI * 2,
          null // Wind disabled for trees
        )

        // We still need to track it for updates
        this.items.push({ lod: null, trees: [treeHigh] })
      } else {
        // Create LOD object for this tree
        const lod = new THREE.LOD()
        lod.position.set(x, y, z)

        // High detail tree (0-15 units)
        const treeHigh = new ProceduralTree(
          lod,
          new THREE.Vector3(0, 0, 0),
          0.27 + Math.random() * 0.18,
          Math.random() * Math.PI * 2,
          null // Wind disabled for trees
        )

        // Medium detail tree (15-30 units) - 60% segments
        const treeMedium = new ProceduralTree(
          lod,
          new THREE.Vector3(0, 0, 0),
          0.27 + Math.random() * 0.18,
          Math.random() * Math.PI * 2,
          null, // Wind disabled for trees
          0.6 // Reduce detail to 60%
        )

        // Low detail tree (30+ units) - 30% segments
        const treeLow = new ProceduralTree(
          lod,
          new THREE.Vector3(0, 0, 0),
          0.27 + Math.random() * 0.18,
          Math.random() * Math.PI * 2,
          null, // Wind disabled for trees
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

  getTreePositions() {
    const positions = []
    this.items.forEach(item => {
      // Use the LOD position or the first tree's position
      if (item.lod) {
        positions.push(item.lod.position.clone())
      } else if (item.trees.length > 0) {
        positions.push(item.trees[0].position.clone())
      }
    })
    return positions
  }
}
