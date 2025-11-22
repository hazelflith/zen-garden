import * as THREE from 'three'
import Experience from '../Experience.js'

export default class RainSplashes {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.time = this.experience.time

    this.count = 1000
    this.enabled = false
    this.spawning = false
    this.intensity = 1.0

    this.splashes = []
    for (let i = 0; i < this.count; i++) {
      this.splashes.push({
        active: false,
        x: 0,
        y: 0,
        z: 0,
        life: 0,
        maxLife: 1.0
      })
    }

    this.setGeometry()
    this.setMaterial()
    this.setMesh()
  }

  setGeometry() {
    this.geometry = new THREE.BufferGeometry()

    const positions = new Float32Array(this.count * 3)
    const scales = new Float32Array(this.count)
    const opacities = new Float32Array(this.count)

    for (let i = 0; i < this.count; i++) {
      positions[i * 3 + 0] = 0
      positions[i * 3 + 1] = -100
      positions[i * 3 + 2] = 0
      scales[i] = 0
      opacities[i] = 0
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    this.geometry.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1))
  }

  setMaterial() {
    // Create a canvas texture for beautiful ring ripples
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')

    // Draw concentric rings (ripple effect)
    ctx.clearRect(0, 0, 128, 128)
    const centerX = 64
    const centerY = 64

    // Draw multiple rings with varying opacity for depth
    for (let i = 0; i < 3; i++) {
      const radius = 20 + (i * 15)
      const alpha = 1.0 - (i * 0.3)

      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
      ctx.lineWidth = 2 + (2 - i)
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.stroke()
    }

    const texture = new THREE.CanvasTexture(canvas)

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTexture: { value: texture },
        uColor: { value: new THREE.Color(0x667880) } // 50% darker
      },
      vertexShader: `
        attribute float aScale;
        attribute float aOpacity;
        
        varying float vOpacity;
        
        void main() {
          vec4 modelPosition = modelMatrix * vec4(position, 1.0);
          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectionPosition = projectionMatrix * viewPosition;
          
          gl_Position = projectionPosition;
          
          // Scale attenuation
          gl_PointSize = 100.0 * aScale;
          gl_PointSize *= (1.0 / -viewPosition.z);
          
          vOpacity = aOpacity;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform vec3 uColor;
        
        varying float vOpacity;
        
        void main() {
          vec4 textureColor = texture2D(uTexture, gl_PointCoord);
          gl_FragColor = vec4(uColor, textureColor.a * vOpacity);
        }
      `
    })

    console.log('RainSplashes material created with ShaderMaterial')
  }

  setMesh() {
    this.mesh = new THREE.Points(this.geometry, this.material)
    this.mesh.frustumCulled = false
    this.scene.add(this.mesh)
    console.log('RainSplashes mesh added to scene')
  }

  enable() {
    this.enabled = true
    this.spawning = true
    console.log('RainSplashes enabled')
  }

  disable() {
    this.spawning = false
    console.log('RainSplashes stopping spawns, waiting for particles to finish')
  }

  setIntensity(value) {
    this.intensity = Math.max(0.0, Math.min(1.0, value))
  }

  spawnSplash() {
    if (!this.enabled) return

    for (let i = 0; i < this.count; i++) {
      if (!this.splashes[i].active) {
        const splash = this.splashes[i]
        splash.active = true
        splash.life = 0

        if (this.experience.camera && this.experience.camera.controls) {
          const controls = this.experience.camera.controls
          const target = controls.target
          const cameraPos = this.experience.camera.instance.position

          // Calculate distance to target to determine spread
          const distance = cameraPos.distanceTo(target)
          const range = Math.max(15, distance * 0.8) // Dynamic range based on zoom

          // Spawn around the target (where user is looking)
          splash.x = target.x + (Math.random() - 0.5) * range * 2
          splash.z = target.z + (Math.random() - 0.5) * range * 2
          splash.y = 0.05
        } else {
          // Fallback
          splash.x = (Math.random() - 0.5) * 30
          splash.z = (Math.random() - 0.5) * 30
          splash.y = 0.05
        }

        break
      }
    }
  }

  update() {
    if (!this.enabled) return

    const delta = this.time.delta * 0.001
    const positions = this.geometry.attributes.position.array
    const scales = this.geometry.attributes.aScale.array
    const opacities = this.geometry.attributes.aOpacity.array

    // Spawn multiple splashes based on intensity, but only if spawning is enabled
    if (this.spawning) {
      const spawnCount = Math.floor(this.intensity * 10)
      for (let k = 0; k < spawnCount; k++) {
        if (Math.random() > 0.1) { // Add some randomness
          this.spawnSplash()
        }
      }
    }

    let activeCount = 0

    for (let i = 0; i < this.count; i++) {
      const splash = this.splashes[i]

      if (splash.active) {
        activeCount++
        splash.life += delta

        if (splash.life >= splash.maxLife) {
          splash.active = false
          positions[i * 3 + 1] = -100
          scales[i] = 0
          opacities[i] = 0
        } else {
          positions[i * 3 + 0] = splash.x
          positions[i * 3 + 1] = splash.y
          positions[i * 3 + 2] = splash.z

          // Ripple expands outward with ultra smooth fade
          const progress = splash.life / splash.maxLife
          scales[i] = 1.0 + (progress * 3.0)

          // Ultra smooth fade in and out with quadratic easing
          let opacity = 1.0
          if (progress < 0.3) {
            const fadeProgress = progress / 0.3
            opacity = fadeProgress * fadeProgress
          } else if (progress > 0.6) {
            const fadeProgress = (1.0 - progress) / 0.4
            opacity = fadeProgress * fadeProgress
          }
          opacities[i] = opacity * 0.6
        }
      }
    }

    this.geometry.attributes.position.needsUpdate = true
    this.geometry.attributes.aScale.needsUpdate = true
    this.geometry.attributes.aOpacity.needsUpdate = true

    // If not spawning and no active particles, fully disable
    if (!this.spawning && activeCount === 0) {
      this.enabled = false
      console.log('RainSplashes fully disabled')
    }
  }
}
