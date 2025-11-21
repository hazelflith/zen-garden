import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import Experience from '../Experience.js'

export default class DirtMounds {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene

    this.setGeometry()
    this.setMaterial()
    this.setMesh()
  }

  setGeometry() {
    // Create a composite geometry for a realistic pile
    const geometries = []
    const count = 15 // Number of clods per mound

    // Main base mound (flattened sphere)
    const baseGeo = new THREE.DodecahedronGeometry(1.2, 1)
    baseGeo.scale(1.5, 0.5, 1.5)
    geometries.push(baseGeo)

    // Add smaller clods around and on top
    for (let i = 0; i < count; i++) {
      const radius = 0.3 + Math.random() * 0.4
      const geometry = new THREE.DodecahedronGeometry(radius, 0)

      // Position randomly within a radius, but biased towards center/bottom
      const angle = Math.random() * Math.PI * 2
      const dist = Math.random() * 1.2
      const x = Math.sin(angle) * dist
      const z = Math.cos(angle) * dist
      const y = Math.random() * 0.5 // Keep low

      geometry.translate(x, y, z)

      // Random rotation
      geometry.rotateX(Math.random() * Math.PI)
      geometry.rotateY(Math.random() * Math.PI)
      geometry.rotateZ(Math.random() * Math.PI)

      geometries.push(geometry)
    }

    this.geometry = mergeGeometries(geometries)
  }

  setMaterial() {
    this.material = new THREE.MeshStandardMaterial({
      color: '#5d4037', // Dark brown
      roughness: 1,
      metalness: 0,
      flatShading: true
    })
  }

  setMesh() {
    const count = 8
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, count)
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    this.mesh.frustumCulled = true // Enable frustum culling

    const terrain = this.experience.world.terrain

    for (let i = 0; i < count; i++) {
      const matrix = new THREE.Matrix4()

      // Place in Outer Grass zone (> 9.5)
      // Avoid the cross paths (x < 1.2, z < 1.2)

      let x, z
      let validPosition = false
      let attempts = 0

      while (!validPosition && attempts < 100) {
        attempts++
        const angle = Math.random() * Math.PI * 2
        const radius = 12 + Math.random() * 2.5 // Increased min radius to avoid outer path
        x = Math.sin(angle) * radius
        z = Math.cos(angle) * radius

        // Check if too close to axis (path)
        // Buffer of 4.0 to account for mound radius (~2.0) + safety margin
        if (Math.abs(x) > 4.0 && Math.abs(z) > 4.0) {
          validPosition = true
        }
      }

      // Get height from terrain
      let y = 0
      if (terrain) {
        y = terrain.getHeightAt(x, z)
      }

      const position = new THREE.Vector3(x, y + 0.1, z) // Sink slightly

      const rotation = new THREE.Euler(0, Math.random() * Math.PI, 0)

      const scale = new THREE.Vector3(
        0.8 + Math.random() * 0.4,
        0.8 + Math.random() * 0.4,
        0.8 + Math.random() * 0.4
      )

      matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale)
      this.mesh.setMatrixAt(i, matrix)
    }

    this.scene.add(this.mesh)
  }
}
