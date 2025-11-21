import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Bridge {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene

    this.group = new THREE.Group()
    this.group.frustumCulled = true // Enable frustum culling
    this.scene.add(this.group)

    this.material = new THREE.MeshStandardMaterial({ color: '#8b4513', roughness: 0.8 })

    this.construct()
  }

  construct() {
    // Create two bridges
    this.createBridge(0)
    this.createBridge(Math.PI)
  }

  createBridge(angle) {
    const bridgeGroup = new THREE.Group()

    // Bridge base
    const bridgeGeometry = new THREE.BoxGeometry(1, 0.2, 2)
    const bridge = new THREE.Mesh(bridgeGeometry, this.material)
    bridge.castShadow = true
    bridgeGroup.add(bridge)

    // Railings
    const railGeo = new THREE.BoxGeometry(0.1, 0.5, 2)
    const rail1 = new THREE.Mesh(railGeo, this.material)
    rail1.position.x = -0.45
    rail1.position.y = 0.35
    bridgeGroup.add(rail1)

    const rail2 = new THREE.Mesh(railGeo, this.material)
    rail2.position.x = 0.45
    rail2.position.y = 0.35
    bridgeGroup.add(rail2)

    // Position on the ring
    const radius = 4 // Middle of the river (3.5 to 4.5)
    const x = Math.sin(angle) * radius
    const z = Math.cos(angle) * radius

    bridgeGroup.position.set(x, 0.2, z)
    bridgeGroup.rotation.y = angle

    this.group.add(bridgeGroup)
  }
}
