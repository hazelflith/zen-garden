import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Lantern {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene

    this.group = new THREE.Group()
    this.scene.add(this.group)

    this.material = new THREE.MeshStandardMaterial({ color: '#8c8c8c', roughness: 0.7 })

    this.construct()
  }

  construct() {
    // Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(1, 0.2, 1), this.material)
    base.position.y = 0.1
    base.castShadow = true
    this.group.add(base)

    // Pedestal
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8), this.material)
    pedestal.position.y = 0.2 + 0.75
    pedestal.castShadow = true
    this.group.add(pedestal)

    // Platform
    const platform = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.2), this.material)
    platform.position.y = 0.2 + 1.5 + 0.1
    platform.castShadow = true
    this.group.add(platform)

    // Light Box (glowing)
    const lightBoxMaterial = new THREE.MeshStandardMaterial({
      color: '#ffaa00',
      emissive: '#ffaa00',
      emissiveIntensity: 1.5,
      roughness: 0.3,
      metalness: 0
    })
    const lightBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.8), lightBoxMaterial)
    lightBox.position.y = 0.2 + 1.5 + 0.2 + 0.5
    this.group.add(lightBox)

    // Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.8, 4), this.material)
    roof.position.y = 0.2 + 1.5 + 0.2 + 1 + 0.4
    roof.rotation.y = Math.PI * 0.25
    roof.castShadow = true
    this.group.add(roof)

    // Top knob
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), this.material)
    knob.position.y = 0.2 + 1.5 + 0.2 + 1 + 0.8
    knob.castShadow = true
    this.group.add(knob)

    // Light
    this.light = new THREE.PointLight('#ffaa00', 50, 20) // Intensity 50, distance 20
    this.light.position.y = 0.2 + 1.5 + 0.2 + 0.5
    this.light.castShadow = true
    this.light.shadow.mapSize.set(512, 512)
    this.group.add(this.light)

    // Debug
    if (this.experience.debug && this.experience.debug.active) {
      const debugFolder = this.experience.debug.ui.addFolder('Lantern')
      debugFolder.add(this.light, 'intensity').min(0).max(100).step(0.1).name('Light Intensity')
      debugFolder.add(this.light, 'distance').min(0).max(50).step(0.1).name('Light Distance')
      debugFolder.addColor(this.light, 'color').name('Light Color')
    }
  }
}
