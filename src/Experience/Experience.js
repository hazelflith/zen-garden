import * as THREE from 'three'

import Sizes from './Utils/Sizes.js'
import Time from './Utils/Time.js'
import Camera from './Camera.js'
import Renderer from './Renderer.js'
import World from './World/World.js'
import Resources from './Utils/Resources.js'
import Debug from './Utils/Debug.js'
import PerformanceMonitor from './Utils/PerformanceMonitor.js'

import sources from './sources.js'

let instance = null

export default class Experience {
  constructor(canvas) {
    if (instance) {
      return instance
    }
    instance = this

    // Global access
    window.experience = this

    // Options
    this.canvas = canvas

    // Setup
    this.debug = new Debug()
    this.sizes = new Sizes()
    this.time = new Time()
    this.scene = new THREE.Scene()
    this.resources = new Resources(sources)
    this.camera = new Camera()
    this.renderer = new Renderer()
    this.performanceMonitor = new PerformanceMonitor()
    this.world = new World()

    // Performance monitor listeners
    this.performanceMonitor.on('qualityChange', (setting, value) => {
      if (setting === 'pixelRatio') {
        this.renderer.instance.setPixelRatio(Math.min(value, 2))
        this.renderer.effectComposer.setPixelRatio(Math.min(value, 2))
      } else if (setting === 'bloomEnabled') {
        this.renderer.unrealBloomPass.enabled = value
      }
    })

    // Performance preset listener
    this.performanceMonitor.on('presetChange', (preset, quality) => {
      console.log(`Switching to ${preset} preset:`, quality)

      // Apply pixel ratio
      this.renderer.instance.setPixelRatio(Math.min(quality.pixelRatio, 2))
      this.renderer.effectComposer.setPixelRatio(Math.min(quality.pixelRatio, 2))

      // Apply bloom
      this.renderer.unrealBloomPass.enabled = quality.bloomEnabled

      // Apply shadows
      if (this.renderer.instance.shadowMap) {
        this.renderer.instance.shadowMap.enabled = quality.shadowsEnabled
        console.log(`Shadows ${quality.shadowsEnabled ? 'enabled' : 'disabled'}`)
      }

      // Apply particle count (will be handled by FallingPetals if it exists)
      if (this.world && this.world.fallingPetals) {
        this.world.fallingPetals.setParticleCount(quality.particleCount)
      }
    })

    // Update shadows once after scene is set up
    this.resources.on('ready', () => {
      setTimeout(() => {
        this.renderer.updateShadows()
      }, 100)
    })

    // Add performance controls to debug UI
    if (this.debug.active) {
      this.debug.addPerformanceControls(this.performanceMonitor)
      this.debug.addWeatherControls(this.world)
    }

    // Resize event
    this.sizes.on('resize', () => {
      this.resize()
    })

    // Time tick event
    this.time.on('tick', () => {
      this.update()
    })
  }

  resize() {
    this.camera.resize()
    this.renderer.resize()
  }

  update() {
    this.performanceMonitor.update()
    this.camera.update()
    this.world.update()
    this.renderer.update()
  }
}
