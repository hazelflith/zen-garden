import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Bridge {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene

    this.group = new THREE.Group()
    this.group.frustumCulled = true
    this.scene.add(this.group)

    // Materials
    this.woodMaterial = new THREE.MeshStandardMaterial({
      color: '#8b4513',
      roughness: 0.9,
      metalness: 0.1
    })

    this.darkWoodMaterial = new THREE.MeshStandardMaterial({
      color: '#5c3317',
      roughness: 0.85,
      metalness: 0.1
    })

    this.stoneMaterial = new THREE.MeshStandardMaterial({
      color: '#6b7280',
      roughness: 0.95,
      metalness: 0.05
    })

    this.construct()
  }

  construct() {
    // Create two bridges
    this.createBridge(0)
    this.createBridge(Math.PI)
  }

  createBridge(angle) {
    const bridgeGroup = new THREE.Group()

    // Stone support pillars
    this.createStonePillars(bridgeGroup)

    // Arched bridge deck
    this.createArchedDeck(bridgeGroup)

    // Railings with posts
    this.createRailings(bridgeGroup)

    // Cross beams under deck
    this.createCrossBeams(bridgeGroup)

    // Position on the ring
    const radius = 4 // Middle of the river (3.5 to 4.5)
    const x = Math.sin(angle) * radius
    const z = Math.cos(angle) * radius

    bridgeGroup.position.set(x, 0.01, z)
    bridgeGroup.rotation.y = angle

    this.group.add(bridgeGroup)
  }

  createStonePillars(parent) {
    // Two stone pillars under the bridge
    const pillarGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.8, 8)

    const pillar1 = new THREE.Mesh(pillarGeo, this.stoneMaterial)
    pillar1.position.set(-0.6, -0.3, 0)
    pillar1.castShadow = true
    pillar1.receiveShadow = true
    parent.add(pillar1)

    const pillar2 = new THREE.Mesh(pillarGeo, this.stoneMaterial)
    pillar2.position.set(0.6, -0.3, 0)
    pillar2.castShadow = true
    pillar2.receiveShadow = true
    parent.add(pillar2)

    // Stone caps on top of pillars
    const capGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.1, 8)

    const cap1 = new THREE.Mesh(capGeo, this.stoneMaterial)
    cap1.position.set(-0.6, 0.15, 0)
    cap1.castShadow = true
    parent.add(cap1)

    const cap2 = new THREE.Mesh(capGeo, this.stoneMaterial)
    cap2.position.set(0.6, 0.15, 0)
    cap2.castShadow = true
    parent.add(cap2)
  }

  createArchedDeck(parent) {
    // Create arched deck using multiple planks
    const plankCount = 12
    const bridgeLength = 2.4
    const archHeight = 0.3

    for (let i = 0; i < plankCount; i++) {
      const t = i / (plankCount - 1)
      const z = (t - 0.5) * bridgeLength

      // Arch curve (parabola)
      const archY = archHeight * (1 - Math.pow(2 * t - 1, 2))

      // Plank
      const plankGeo = new THREE.BoxGeometry(1.2, 0.08, bridgeLength / plankCount + 0.02)
      const plank = new THREE.Mesh(plankGeo, this.woodMaterial)
      plank.position.set(0, 0.2 + archY, z)
      plank.castShadow = true
      plank.receiveShadow = true
      parent.add(plank)
    }

    // Side beams for structure
    const beamGeo = new THREE.BoxGeometry(0.12, 0.15, bridgeLength)

    const beam1 = new THREE.Mesh(beamGeo, this.darkWoodMaterial)
    beam1.position.set(-0.54, 0.15, 0)
    beam1.castShadow = true
    parent.add(beam1)

    const beam2 = new THREE.Mesh(beamGeo, this.darkWoodMaterial)
    beam2.position.set(0.54, 0.15, 0)
    beam2.castShadow = true
    parent.add(beam2)
  }

  createRailings(parent) {
    const postCount = 5
    const bridgeLength = 2.4

    for (let i = 0; i < postCount; i++) {
      const t = i / (postCount - 1)
      const z = (t - 0.5) * bridgeLength
      const archY = 0.3 * (1 - Math.pow(2 * t - 1, 2))

      // Left posts
      this.createRailingPost(parent, -0.6, 0.2 + archY, z)

      // Right posts
      this.createRailingPost(parent, 0.6, 0.2 + archY, z)
    }

    // Horizontal rails
    this.createHorizontalRail(parent, -0.6, bridgeLength)
    this.createHorizontalRail(parent, 0.6, bridgeLength)
  }

  createRailingPost(parent, x, y, z) {
    const postGeo = new THREE.BoxGeometry(0.06, 0.5, 0.06)
    const post = new THREE.Mesh(postGeo, this.darkWoodMaterial)
    post.position.set(x, y + 0.25, z)
    post.castShadow = true
    parent.add(post)

    // Post cap
    const capGeo = new THREE.BoxGeometry(0.08, 0.06, 0.08)
    const cap = new THREE.Mesh(capGeo, this.darkWoodMaterial)
    cap.position.set(x, y + 0.53, z)
    cap.castShadow = true
    parent.add(cap)
  }

  createHorizontalRail(parent, x, length) {
    // Top rail
    const topRailGeo = new THREE.BoxGeometry(0.05, 0.05, length)
    const topRail = new THREE.Mesh(topRailGeo, this.darkWoodMaterial)
    topRail.position.set(x, 0.7, 0)
    topRail.castShadow = true
    parent.add(topRail)

    // Middle rail
    const midRailGeo = new THREE.BoxGeometry(0.04, 0.04, length)
    const midRail = new THREE.Mesh(midRailGeo, this.darkWoodMaterial)
    midRail.position.set(x, 0.45, 0)
    midRail.castShadow = true
    parent.add(midRail)
  }

  createCrossBeams(parent) {
    // Cross support beams under the deck
    const beamCount = 4
    const bridgeLength = 2.4

    for (let i = 0; i < beamCount; i++) {
      const t = (i + 0.5) / beamCount
      const z = (t - 0.5) * bridgeLength

      const beamGeo = new THREE.BoxGeometry(1.1, 0.08, 0.08)
      const beam = new THREE.Mesh(beamGeo, this.darkWoodMaterial)
      beam.position.set(0, 0.08, z)
      beam.castShadow = true
      parent.add(beam)
    }
  }
}
