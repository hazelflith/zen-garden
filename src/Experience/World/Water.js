import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Water {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene

    this.setGeometry()
    this.setMaterial()
    this.setMesh()
  }

  setGeometry() {
    // Circular river
    this.geometry = new THREE.RingGeometry(3.5, 4.5, 64)
  }

  setMaterial() {
    this.material = new THREE.MeshStandardMaterial({
      color: '#55aaff',
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      metalness: 0.1,
      side: THREE.DoubleSide
    })
  }

  setMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.mesh.rotation.x = - Math.PI * 0.5
    this.mesh.position.y = 0.02 // Slightly above terrain

    this.scene.add(this.mesh)
  }
}
