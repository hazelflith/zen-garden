import EventEmitter from './EventEmitter.js'

export default class PerformanceMonitor extends EventEmitter {
  constructor() {
    super()

    this.enabled = true
    this.fpsHistory = []
    this.maxHistoryLength = 60
    this.lastTime = performance.now()
    this.frameCount = 0
    this.fps = 60
    this.deltaTime = 0

    // Performance thresholds
    this.targetFps = 60
    this.lowFpsThreshold = 45
    this.criticalFpsThreshold = 30

    // Performance presets
    this.presets = {
      low: {
        pixelRatio: 1,
        shadowMapSize: 512,
        shadowsEnabled: false, // Disable shadows completely for max performance
        bloomEnabled: false,
        particleCount: 100,
        antialiasEnabled: false
      },
      medium: {
        pixelRatio: 1.5,
        shadowMapSize: 1024,
        shadowsEnabled: true,
        bloomEnabled: true,
        particleCount: 150,
        antialiasEnabled: true
      },
      max: {
        pixelRatio: 2,
        shadowMapSize: 2048,
        shadowsEnabled: true,
        bloomEnabled: true,
        particleCount: 200,
        antialiasEnabled: true
      }
    }

    // Current preset mode
    this.currentPreset = 'max'

    // Quality settings
    this.quality = { ...this.presets.max }

    // Auto-adjust settings
    this.autoAdjust = false
    this.adjustmentCooldown = 0
    this.adjustmentCooldownTime = 3000 // 3 seconds
  }

  update() {
    if (!this.enabled) return

    const currentTime = performance.now()
    this.deltaTime = currentTime - this.lastTime
    this.frameCount++

    // Calculate FPS every second
    if (this.deltaTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / this.deltaTime)
      this.fpsHistory.push(this.fps)

      if (this.fpsHistory.length > this.maxHistoryLength) {
        this.fpsHistory.shift()
      }

      this.frameCount = 0
      this.lastTime = currentTime

      // Trigger FPS update event
      this.trigger('fpsUpdate', [this.fps])

      // Auto-adjust quality if needed
      if (this.autoAdjust && this.adjustmentCooldown <= 0) {
        this.checkAndAdjustQuality()
      }
    }

    // Decrease cooldown
    if (this.adjustmentCooldown > 0) {
      this.adjustmentCooldown -= this.deltaTime
    }
  }

  checkAndAdjustQuality() {
    const avgFps = this.getAverageFps()

    // If performance is critical, reduce quality
    if (avgFps < this.criticalFpsThreshold) {
      if (this.quality.pixelRatio > 1) {
        this.quality.pixelRatio = 1
        this.trigger('qualityChange', ['pixelRatio', 1])
      } else if (this.quality.bloomEnabled) {
        this.quality.bloomEnabled = false
        this.trigger('qualityChange', ['bloomEnabled', false])
      } else if (this.quality.particleCount > 100) {
        this.quality.particleCount = 100
        this.trigger('qualityChange', ['particleCount', 100])
      }
      this.adjustmentCooldown = this.adjustmentCooldownTime
    }
    // If performance is low, reduce pixel ratio
    else if (avgFps < this.lowFpsThreshold) {
      if (this.quality.pixelRatio > 1.5) {
        this.quality.pixelRatio = 1.5
        this.trigger('qualityChange', ['pixelRatio', 1.5])
      } else if (this.quality.particleCount > 150) {
        this.quality.particleCount = 150
        this.trigger('qualityChange', ['particleCount', 150])
      }
      this.adjustmentCooldown = this.adjustmentCooldownTime
    }
    // If performance is good, restore quality gradually
    else if (avgFps > this.targetFps - 5) {
      const maxPixelRatio = Math.min(window.devicePixelRatio, 2)
      if (this.quality.pixelRatio < maxPixelRatio) {
        this.quality.pixelRatio = Math.min(this.quality.pixelRatio + 0.5, maxPixelRatio)
        this.trigger('qualityChange', ['pixelRatio', this.quality.pixelRatio])
        this.adjustmentCooldown = this.adjustmentCooldownTime
      }
    }
  }

  getAverageFps() {
    if (this.fpsHistory.length === 0) return this.fps

    const sum = this.fpsHistory.reduce((a, b) => a + b, 0)
    return sum / this.fpsHistory.length
  }

  getFps() {
    return this.fps
  }

  getQuality() {
    return this.quality
  }

  setAutoAdjust(enabled) {
    this.autoAdjust = enabled
  }

  setPreset(preset) {
    if (!this.presets[preset]) {
      console.warn(`Invalid preset: ${preset}. Using 'medium' instead.`)
      preset = 'medium'
    }

    this.currentPreset = preset
    this.quality = { ...this.presets[preset] }

    // Disable auto-adjust when manually setting preset
    this.autoAdjust = false

    // Trigger preset change event
    this.trigger('presetChange', [preset, this.quality])
  }

  getCurrentPreset() {
    return this.currentPreset
  }

  reset() {
    this.fpsHistory = []
    this.frameCount = 0
    this.lastTime = performance.now()
  }
}
