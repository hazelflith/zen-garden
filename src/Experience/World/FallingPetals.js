import * as THREE from 'three'
import Experience from '../Experience.js'

export default class FallingPetals {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.time = this.experience.time

    this.petalCount = 300 // Increased by 50%
    this.maxActiveParticles = 300 // Increased by 50%
    this.petals = []
    this.spawnTimer = 0
    this.spawnSources = []

    this.setGeometry()
    this.setMaterial()
    this.setMesh()
    this.initializePetals()
  }

  setGeometry() {
    // Small quad for petal
    // Circular petal to match tree blossoms
    this.geometry = new THREE.CircleGeometry(0.1, 6)
  }

  setMaterial() {
    this.material = new THREE.MeshStandardMaterial({
      color: '#ffb7c5',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      roughness: 0.8
    })

    // Inject shader to handle per-instance opacity
    this.material.onBeforeCompile = (shader) => {
      shader.vertexShader = `
        attribute float aOpacity;
        varying float vOpacity;
        ${shader.vertexShader}
      `.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vOpacity = aOpacity;
        `
      )

      shader.fragmentShader = `
        varying float vOpacity;
        ${shader.fragmentShader}
      `.replace(
        '#include <dithering_fragment>',
        `
        #include <dithering_fragment>
        gl_FragColor.a *= vOpacity;
        `
      )
    }
  }

  setMesh() {
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.petalCount)
    this.mesh.castShadow = false // Disabled for performance
    this.mesh.receiveShadow = false // Disabled for performance
    this.mesh.frustumCulled = true // Enable frustum culling
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
        groundTime: 0,
        opacity: 1,
        active: false
      })
    }

    // Add opacity attribute
    const opacities = new Float32Array(this.petalCount).fill(1)
    this.geometry.setAttribute('aOpacity', new THREE.InstancedBufferAttribute(opacities, 1))

    this.updateMatrices()
  }

  spawnPetal(index) {
    const petal = this.petals[index]

    // Spawn near trees (roughly in grass zones)
    // Spawn near trees
    let x = 0, z = 0

    if (this.spawnSources.length > 0) {
      const sourceIndex = Math.floor(Math.random() * this.spawnSources.length)
      const sourcePos = this.spawnSources[sourceIndex]
      const angle = Math.random() * Math.PI * 2
      const radius = 2.5 + Math.random() * 1.5 // 2.5 to 4.0 radius from tree center

      x = sourcePos.x + Math.sin(angle) * radius
      z = sourcePos.z + Math.cos(angle) * radius
    } else {
      // Fallback if no sources set
      const angle = Math.random() * Math.PI * 2
      const radius = 5 + Math.random() * 5
      x = Math.sin(angle) * radius
      z = Math.cos(angle) * radius
    }

    petal.position.set(
      x,
      5 + Math.random() * 2, // Spawn from tree canopy height
      z
    )

    petal.velocity.set(
      (Math.random() - 0.5) * 0.1,
      -0.1 - Math.random() * 0.05,
      (Math.random() - 0.5) * 0.1
    )

    petal.swayPhase = Math.random() * Math.PI * 2
    petal.lifetime = 0
    petal.groundTime = 0
    petal.opacity = 1
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

    // Update opacity attribute
    if (this.geometry.attributes.aOpacity) {
      const opacities = this.geometry.attributes.aOpacity.array
      for (let i = 0; i < this.petalCount; i++) {
        opacities[i] = this.petals[i].opacity
      }
      this.geometry.attributes.aOpacity.needsUpdate = true
    }
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

    // Calculate wind velocity once
    const windAngle = (wind.direction * Math.PI) / 180
    const totalWindStrength = wind.strength + wind.currentGust
    const windVelocity = {
      x: Math.sin(windAngle) * totalWindStrength,
      z: Math.cos(windAngle) * totalWindStrength
    }

    // Spawn new petals periodically
    this.spawnTimer += deltaTime
    if (this.spawnTimer > 0.1) { // Spawn every 0.1 seconds
      // Count active petals
      const activeCount = this.petals.filter(p => p.active).length

      // Only spawn if under the limit
      if (activeCount < this.maxActiveParticles) {
        const inactivePetal = this.petals.findIndex(p => !p.active)
        if (inactivePetal !== -1) {
          this.spawnPetal(inactivePetal)
        }
      }
      this.spawnTimer = 0
    }

    let needsUpdate = false

    // Update active petals
    for (let i = 0; i < this.petalCount; i++) {
      const petal = this.petals[i]

      if (!petal.active) continue

      needsUpdate = true
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
      if (petal.position.y <= 0) {
        petal.position.y = 0
        petal.velocity.set(0, 0, 0)
        petal.rotationSpeed.set(0, 0, 0)

        // Ground behavior
        petal.groundTime += deltaTime

        if (petal.groundTime > 2.0) {
          // Fade out over 1s
          petal.opacity = Math.max(0, 1 - (petal.groundTime - 2.0))

          if (petal.opacity <= 0) {
            petal.active = false
            petal.position.y = -10
          }
        }
      } else if (petal.lifetime > 20) {
        petal.active = false
        petal.position.y = -10 // Move below ground
      }
    }

    // Only update matrices if petals changed
    if (needsUpdate) {
      this.updateMatrices()
    }
  }

  setParticleCount(count) {
    // Limit the active particle count
    // Deactivate particles beyond the new count
    for (let i = count; i < this.petalCount; i++) {
      if (this.petals[i].active) {
        this.petals[i].active = false
        this.petals[i].position.y = -10
      }
    }
    this.maxActiveParticles = count
  }

  setSpawnSources(positions) {
    this.spawnSources = positions
  }
}
