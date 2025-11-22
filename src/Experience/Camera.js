import * as THREE from 'three'
import Experience from './Experience.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'

export default class Camera {
  constructor() {
    // Experience is a singleton, just get the existing instance
    this.experience = window.experience
    this.sizes = this.experience.sizes
    this.scene = this.experience.scene
    this.canvas = this.experience.canvas

    this.setInstance()
    this.setInstance()
    this.setControls()
    this.setWalkControls()
  }

  setInstance() {
    // Optimized far plane for better frustum culling (reduced from 300 to 100)
    this.instance = new THREE.PerspectiveCamera(45, this.sizes.width / this.sizes.height, 0.1, 600)
    this.instance.position.set(20, 5, 20) // ~10 degrees elevation, 2x distance
    this.scene.add(this.instance)

    this.audioListener = new THREE.AudioListener()
    this.instance.add(this.audioListener)
  }

  setControls() {
    this.controls = new OrbitControls(this.instance, this.canvas)
    this.controls.enableDamping = true
    this.controls.maxDistance = 40
    this.controls.minDistance = 5
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1
    this.controls.screenSpacePanning = false

    // Auto-rotation settings
    // Auto-rotation settings
    this.isAutoRotateEnabled = true
    this.controls.autoRotate = true
    this.targetAutoRotateSpeed = 0.25
    this.currentAutoRotateSpeed = 0
    this.controls.autoRotateSpeed = 0
    this.resumeRotateTimeout = null

    // Interaction listeners
    this.controls.addEventListener('start', () => {
      this.controls.autoRotate = false
      this.currentAutoRotateSpeed = 0 // Reset speed
      if (this.resumeRotateTimeout) clearTimeout(this.resumeRotateTimeout)
    })

    this.controls.addEventListener('end', () => {
      if (this.isAutoRotateEnabled) {
        this.resumeRotateTimeout = setTimeout(() => {
          this.controls.autoRotate = true
          this.currentAutoRotateSpeed = 0 // Start from 0
        }, 20000) // 20s wait
      }
    })

    // Debug
    if (this.experience.debug.active) {
      const debugFolder = this.experience.debug.ui.addFolder('Camera')

      const params = {
        autoRotate: true
      }

      debugFolder.add(params, 'autoRotate')
        .name('Auto Rotate')
        .onChange((value) => {
          this.isAutoRotateEnabled = value
          this.controls.autoRotate = value

          if (!value && this.resumeRotateTimeout) {
            clearTimeout(this.resumeRotateTimeout)
          } else if (value) {
            // Resume immediately if re-enabled
            this.controls.autoRotate = true
          }
        })
    }
  }

  setWalkControls() {
    this.walkControls = new PointerLockControls(this.instance, document.body)
    this.isWalkMode = false
    this.moveForward = false
    this.moveBackward = false
    this.moveLeft = false
    this.moveRight = false
    this.velocity = new THREE.Vector3()
    this.direction = new THREE.Vector3()
    this.playerHeight = 1.7

    // UI Elements
    this.walkBtn = document.getElementById('walk-btn')
    this.wasdHint = document.getElementById('wasd-hint')

    if (this.walkBtn) {
      this.walkBtn.addEventListener('click', () => {
        if (!this.isWalkMode) {
          this.walkControls.lock()
        } else {
          this.walkControls.unlock()
        }
      })
    }

    this.walkControls.addEventListener('lock', () => {
      this.isWalkMode = true
      this.controls.enabled = false
      if (this.walkBtn) this.walkBtn.textContent = 'Exit Walk'
      if (this.wasdHint) this.wasdHint.style.opacity = '1'

      // Reset auto-rotate
      this.controls.autoRotate = false
      if (this.resumeRotateTimeout) clearTimeout(this.resumeRotateTimeout)
    })

    this.walkControls.addEventListener('unlock', () => {
      this.isWalkMode = false
      this.controls.enabled = true
      if (this.walkBtn) this.walkBtn.textContent = 'Walk'
      if (this.wasdHint) this.wasdHint.style.opacity = '0'

      // Reset movement
      this.moveForward = false
      this.moveBackward = false
      this.moveLeft = false
      this.moveRight = false

      // Resume auto-rotate logic if enabled
      if (this.isAutoRotateEnabled) {
        this.resumeRotateTimeout = setTimeout(() => {
          this.controls.autoRotate = true
          this.currentAutoRotateSpeed = 0
        }, 5000)
      }
    })

    document.addEventListener('keydown', (event) => this.onKeyDown(event))
    document.addEventListener('keyup', (event) => this.onKeyUp(event))
  }

  onKeyDown(event) {
    if (!this.isWalkMode) return
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.moveForward = true
        break
      case 'ArrowLeft':
      case 'KeyA':
        this.moveLeft = true
        break
      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = true
        break
      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = true
        break
    }
  }

  onKeyUp(event) {
    if (!this.isWalkMode) return
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.moveForward = false
        break
      case 'ArrowLeft':
      case 'KeyA':
        this.moveLeft = false
        break
      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = false
        break
      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = false
        break
    }
  }

  resize() {
    this.instance.aspect = this.sizes.width / this.sizes.height
    this.instance.updateProjectionMatrix()
  }

  update() {
    if (this.isWalkMode) {
      const delta = this.experience.time.delta * 0.001

      // Increased friction for less "slidey" feel (was 10.0)
      this.velocity.x -= this.velocity.x * 15.0 * delta
      this.velocity.z -= this.velocity.z * 15.0 * delta

      this.direction.z = Number(this.moveForward) - Number(this.moveBackward)
      this.direction.x = Number(this.moveRight) - Number(this.moveLeft)
      this.direction.normalize()

      // Reduced acceleration for slower walking speed (was 150.0)
      const speed = 35
      if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * speed * delta
      if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * speed * delta

      this.walkControls.moveRight(-this.velocity.x * delta)
      this.walkControls.moveForward(-this.velocity.z * delta)

      // Head bobbing
      const isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight
      if (isMoving) {
        const bobFrequency = 10
        const bobAmplitude = 0.05
        this.headBobTimer = (this.headBobTimer || 0) + delta * bobFrequency
        this.headBobOffset = Math.sin(this.headBobTimer) * bobAmplitude
      } else {
        this.headBobTimer = 0
        this.headBobOffset = 0
      }

      // Terrain following with head bob
      const position = this.instance.position
      if (this.experience.world && this.experience.world.terrain) {
        const terrainHeight = this.experience.world.terrain.getHeightAt(position.x, position.z)
        position.y = terrainHeight + this.playerHeight + (this.headBobOffset || 0)
      }
    } else {
      this.controls.update()

      // Smoothly accelerate auto-rotation
      if (this.controls.autoRotate && this.isAutoRotateEnabled) {
        // Lerp towards target speed
        const delta = this.experience.time.delta * 0.001
        const acceleration = 0.1 // Speed increase per second

        if (this.currentAutoRotateSpeed < this.targetAutoRotateSpeed) {
          this.currentAutoRotateSpeed += acceleration * delta
          if (this.currentAutoRotateSpeed > this.targetAutoRotateSpeed) {
            this.currentAutoRotateSpeed = this.targetAutoRotateSpeed
          }
          this.controls.autoRotateSpeed = this.currentAutoRotateSpeed
        }
      }
    }
  }
}
