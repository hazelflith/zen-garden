import * as THREE from 'three'
import Experience from '../Experience.js'

export default class FallingPetals {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.time = this.experience.time

    this.petalCount = 200
    this.petals = []
    this.spawnTimer = 0

    this.setGeometry()
    this.setMaterial()
    this.setMesh()
    this.initializePetals()
  }

  setGeometry() {
    // Small quad for petal
    this.geometry = new THREE.PlaneGeometry(0.15, 0.2)
  }

  setMaterial() {
    this.material = new THREE.MeshStandardMaterial({
      color: '#ffb7c5',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      roughness: 0.8
    })
  }

  setMesh() {
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.petalCount)
    this.scene.add(this.mesh)
  }

  initializePetals() {
    for (let i = 0; i < this.petalCount; i++) {
      this.petals.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 30,
          -10, // Start below ground (inactive)
          (Math.random() - 0.5) * 30
        ),
        velocity: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        ),
        rotationSpeed: new THREE.Euler(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ),
        swayPhase: Math.random() * Math.PI * 2,
        lifetime: 0,
        active: false
      })
    }

    this.updateMatrices()
  }

  spawnPetal(index) {
    const petal = this.petals[index]

    // Spawn near trees (roughly in grass zones)
    const angle = Math.random() * Math.PI * 2
    const zone = Math.random() > 0.5 ? 'middle' : 'outer'
    const radius = zone === 'middle' ? 6.5 + Math.random() * 1.0 : 10.0 + Math.random() * 4.0

    petal.position.set(
      Math.sin(angle) * radius,
      5 + Math.random() * 2, // Spawn from tree canopy height
      Math.cos(angle) * radius
    )

    petal.velocity.set(
      (Math.random() - 0.5) * 0.1,
      -0.1 - Math.random() * 0.05,
      (Math.random() - 0.5) * 0.1
    )

    petal.swayPhase = Math.random() * Math.PI * 2
    petal.lifetime = 0
    petal.active = true
  }

  updateMatrices() {
    const matrix = new THREE.Matrix4()
    const quaternion = new THREE.Quaternion()

    for (let i = 0; i < this.petalCount; i++) {
      const petal = this.petals[i]

      quaternion.setFromEuler(petal.rotation)
      matrix.compose(petal.position, quaternion, new THREE.Vector3(1, 1, 1))

      this.mesh.setMatrixAt(i, matrix)
    }

    this.mesh.instanceMatrix.needsUpdate = true
  }

  update() {
    const deltaTime = this.time.delta * 0.001 // Convert to seconds

    // Get wind from environment
    const environment = this.scene.userData.environment
    const wind = environment ? environment.wind : { direction: 0, strength: 0, gustStrength: 0, gustSpeed: 1, currentGust: 0 }

    // Update wind gust
    if (environment) {
      environment.wind.currentGust = Math.sin(this.time.elapsed * 0.001 * wind.gustSpeed) * wind.gustStrength
    }

    // Calculate wind velocity
    const windAngle = (wind.direction * Math.PI) / 180
    const totalWindStrength = wind.strength + wind.currentGust
    const windVelocity = {
      x: Math.sin(windAngle) * totalWindStrength,
      z: Math.cos(windAngle) * totalWindStrength
    }

    // Spawn new petals periodically
    this.spawnTimer += deltaTime
    if (this.spawnTimer > 0.1) { // Spawn every 0.1 seconds
      const inactivePetal = this.petals.findIndex(p => !p.active)
      if (inactivePetal !== -1) {
        this.spawnPetal(inactivePetal)
      }
      this.spawnTimer = 0
    }

    // Update active petals
    for (let i = 0; i < this.petalCount; i++) {
      const petal = this.petals[i]

      if (!petal.active) continue

      petal.lifetime += deltaTime

      // Gravity
      petal.velocity.y -= 0.3 * deltaTime

      // Gentle swaying motion
      petal.swayPhase += deltaTime * 2
      const swayX = Math.sin(petal.swayPhase) * 0.2
      const swayZ = Math.cos(petal.swayPhase * 0.7) * 0.15

      // Apply wind (much stronger effect)
      petal.velocity.x = swayX + windVelocity.x * 0.5
      petal.velocity.z = swayZ + windVelocity.z * 0.5

      // Update position
      petal.position.x += petal.velocity.x * deltaTime
      petal.position.y += petal.velocity.y * deltaTime
      petal.position.z += petal.velocity.z * deltaTime

      // Update rotation
      petal.rotation.x += petal.rotationSpeed.x * deltaTime
      petal.rotation.y += petal.rotationSpeed.y * deltaTime
      petal.rotation.z += petal.rotationSpeed.z * deltaTime

      // Reset if hit ground or too old
      if (petal.position.y < 0 || petal.lifetime > 20) {
        petal.active = false
        petal.position.y = -10 // Move below ground
      }
    }

    this.updateMatrices()
  }
}
