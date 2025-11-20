import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Fences {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene

    this.setGeometry()
    this.setMaterial()
    this.setMesh()
  }

  setGeometry() {
    this.geometry = new THREE.BoxGeometry(0.15, 0.6, 0.15)
    this.geometry.translate(0, 0.3, 0) // Pivot at bottom
  }

  setMaterial() {
    this.material = new THREE.MeshStandardMaterial({
      color: '#8d6e63',
      roughness: 0.8,
      metalness: 0.1
    })
  }

  setMesh() {
    const radii = [4.5, 6.0, 8.0, 9.5]
    const instancesPerRing = 80
    const totalInstances = radii.length * instancesPerRing

    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, totalInstances)
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true

    const terrain = this.experience.world.terrain
    let instanceIndex = 0
    const dummy = new THREE.Object3D()

    radii.forEach(radius => {
      const circumference = 2 * Math.PI * radius
      const count = Math.floor(circumference * 2.5) // Density control

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2
        const x = Math.sin(angle) * radius
        const z = Math.cos(angle) * radius

        // Check for radial path gaps
        // Path width is approx 1.2 in Terrain.js
        // We add a bit of buffer (1.4) to clear the path comfortably
        if (Math.abs(x) < 1.4 || Math.abs(z) < 1.4) {
          continue
        }

        // Get height
        let y = 0
        if (terrain) {
          y = terrain.getHeightAt(x, z)
        }

        dummy.position.set(x, y, z)
        dummy.rotation.y = angle // Face outward/inward

        // Slight random variation
        dummy.rotation.z = (Math.random() - 0.5) * 0.1
        dummy.rotation.x = (Math.random() - 0.5) * 0.1

        dummy.scale.setScalar(0.8 + Math.random() * 0.4)

        dummy.updateMatrix()
        this.mesh.setMatrixAt(instanceIndex++, dummy.matrix)
      }
    })

    this.mesh.count = instanceIndex // Update actual count used
    this.scene.add(this.mesh)
  }
}
