import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Rain {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.time = this.experience.time
    this.resources = this.experience.resources
    this.camera = this.experience.camera.instance

    this.count = 3000 // Increased count for better density
    this.enabled = false
    this.intensity = 0.7 // 0.0 to 1.0, controls all rain effects

    this.setGeometry()
    this.setMaterial()
    this.setMesh()
    this.setAudio()
  }

  setGeometry() {
    const positions = new Float32Array(this.count * 2 * 3) // 2 vertices per drop

    for (let i = 0; i < this.count; i++) {
      // Initial random position around origin
      const x = (Math.random() - 0.5) * 40
      const y = Math.random() * 20
      const z = (Math.random() - 0.5) * 40

      // Top vertex
      positions[i * 6 + 0] = x
      positions[i * 6 + 1] = y
      positions[i * 6 + 2] = z

      // Bottom vertex (slightly lower)
      positions[i * 6 + 3] = x
      positions[i * 6 + 4] = y - 0.8 // Length of streak
      positions[i * 6 + 5] = z
    }

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  }

  setMaterial() {
    this.material = new THREE.LineBasicMaterial({
      color: 0xaaccff,
      transparent: true,
      opacity: 0.5,
      depthWrite: false
    })
  }

  setMesh() {
    this.mesh = new THREE.LineSegments(this.geometry, this.material)
    this.mesh.visible = false
    this.scene.add(this.mesh)
  }

  setAudio() {
    // Use global audio listener from camera
    this.sound = new THREE.Audio(this.experience.camera.audioListener)

    const setBuffer = () => {
      if (this.resources.items.rainSound) {
        console.log('Rain audio buffer set')
        this.sound.setBuffer(this.resources.items.rainSound)
        this.sound.setLoop(true)
        this.sound.setVolume(0.5)

        // If already enabled, play now
        if (this.enabled && !this.sound.isPlaying) {
          console.log('Rain enabled, playing sound now that buffer is ready')
          this.sound.play()
        }
      } else {
        console.warn('Rain audio buffer missing')
      }
    }

    // Wait for resources to be ready
    if (this.resources.items.rainSound) {
      setBuffer()
    } else {
      this.resources.on('ready', () => {
        setBuffer()
      })
    }
  }

  enable() {
    console.log('Rain enabled')
    this.enabled = true
    this.mesh.visible = true

    if (this.sound && this.sound.buffer) {
      if (!this.sound.isPlaying) {
        console.log('Playing rain sound')
        this.sound.play()
      }
    } else {
      console.log('Rain sound not ready yet')
    }

    // Trigger stormy weather with intensity
    if (this.experience.world.environment) {
      this.experience.world.environment.setStormy(this.intensity)
    }

    // Enable rain splashes with intensity
    if (this.experience.world.rainSplashes) {
      this.experience.world.rainSplashes.enable()
      this.experience.world.rainSplashes.setIntensity(this.intensity)
    }
  }

  disable() {
    console.log('Rain disabled')
    this.enabled = false
    this.mesh.visible = false
    if (this.sound && this.sound.isPlaying) {
      this.sound.stop()
    }
    // Trigger sunny weather
    if (this.experience.world.environment) {
      this.experience.world.environment.setSunny()
    }

    // Disable rain splashes
    if (this.experience.world.rainSplashes) {
      this.experience.world.rainSplashes.disable()
    }
  }

  update() {
    // Update visible count based on intensity
    this.geometry.setDrawRange(0, Math.floor(this.count * this.intensity) * 2)

    // Update volume based on intensity
    if (this.sound && this.sound.isPlaying) {
      this.sound.setVolume(this.intensity * 0.5)
    }

    if (!this.enabled) return

    const positions = this.geometry.attributes.position.array
    const speed = 0.8

    // Get wind from environment
    let windX = 0
    let windZ = 0

    if (this.experience.world.environment && this.experience.world.environment.wind) {
      const wind = this.experience.world.environment.wind
      const angle = wind.direction * Math.PI / 180
      windX = Math.sin(angle) * wind.strength * 0.5
      windZ = Math.cos(angle) * wind.strength * 0.5
    }

    // Dynamic range based on camera position
    const range = 20
    const cameraX = this.camera.position.x
    const cameraZ = this.camera.position.z

    for (let i = 0; i < this.count; i++) {
      // Move both vertices down and apply wind
      positions[i * 6 + 0] += windX // Top x
      positions[i * 6 + 1] -= speed // Top y
      positions[i * 6 + 2] += windZ // Top z

      positions[i * 6 + 3] += windX // Bottom x
      positions[i * 6 + 4] -= speed // Bottom y
      positions[i * 6 + 5] += windZ // Bottom z

      // 1. Check Y (falling)
      if (positions[i * 6 + 1] < 0) {
        const xOffset = (Math.random() - 0.5) * range * 2
        const zOffset = (Math.random() - 0.5) * range * 2

        const x = cameraX + xOffset
        const z = cameraZ + zOffset
        const y = 20

        // Reset top vertex
        positions[i * 6 + 0] = x
        positions[i * 6 + 1] = y
        positions[i * 6 + 2] = z

        // Reset bottom vertex with wind slant offset
        positions[i * 6 + 3] = x - windX
        positions[i * 6 + 4] = y - 0.8
        positions[i * 6 + 5] = z - windZ
      }

      // 2. Check X (wrapping around camera)
      // If too far right of camera
      if (positions[i * 6 + 0] > cameraX + range) {
        const offset = positions[i * 6 + 0] - (cameraX + range)
        positions[i * 6 + 0] = cameraX - range + offset
        positions[i * 6 + 3] = cameraX - range + offset - windX
      }
      // If too far left of camera
      else if (positions[i * 6 + 0] < cameraX - range) {
        const offset = (cameraX - range) - positions[i * 6 + 0]
        positions[i * 6 + 0] = cameraX + range - offset
        positions[i * 6 + 3] = cameraX + range - offset - windX
      }

      // 3. Check Z (wrapping around camera)
      // If too far forward
      if (positions[i * 6 + 2] > cameraZ + range) {
        const offset = positions[i * 6 + 2] - (cameraZ + range)
        positions[i * 6 + 2] = cameraZ - range + offset
        positions[i * 6 + 5] = cameraZ - range + offset - windZ
      }
      // If too far back
      else if (positions[i * 6 + 2] < cameraZ - range) {
        const offset = (cameraZ - range) - positions[i * 6 + 2]
        positions[i * 6 + 2] = cameraZ + range - offset
        positions[i * 6 + 5] = cameraZ + range - offset - windZ
      }
    }

    this.geometry.attributes.position.needsUpdate = true
  }
}
