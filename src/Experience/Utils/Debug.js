import GUI from 'lil-gui'

export default class Debug {
  constructor() {
    this.active = window.location.hash === '#debug' || true
    this.ui = null
    this.fpsDisplay = null

    if (this.active) {
      this.ui = new GUI()
      this.setupPerformanceUI()
    }
  }

  setupPerformanceUI() {
    // Will be populated by Experience when performance monitor is ready
    this.performanceFolder = this.ui.addFolder('Performance')
    this.performanceFolder.close() // Start closed
  }

  addPerformanceControls(performanceMonitor) {
    if (!this.performanceFolder) return

    const params = {
      preset: performanceMonitor.getCurrentPreset(),
      fps: 60,
      autoAdjust: performanceMonitor.autoAdjust
    }

    // Preset selector
    this.performanceFolder.add(params, 'preset', ['low', 'medium', 'max'])
      .name('Quality Preset')
      .onChange((value) => {
        performanceMonitor.setPreset(value)
      })

    // Auto adjust toggle
    this.performanceFolder.add(params, 'autoAdjust')
      .name('Auto Adjust Quality')
      .onChange((value) => {
        performanceMonitor.setAutoAdjust(value)
      })

    // FPS display (read-only)
    this.fpsController = this.performanceFolder.add(params, 'fps', 0, 120)
      .name('FPS')
      .listen()
      .disable()

    // Update FPS display
    performanceMonitor.on('fpsUpdate', (fps) => {
      params.fps = fps
    })

    this.performanceFolder.open()
  }

  addWeatherControls(world) {
    if (!this.ui) return

    const weatherFolder = this.ui.addFolder('Weather')

    const params = {
      rain: false
    }

    weatherFolder.add(params, 'rain')
      .name('Rain')
      .onChange((value) => {
        if (world.rain) {
          if (value) {
            world.rain.enable()
          } else {
            world.rain.disable()
          }
        }
      })

    // Rain intensity slider - always visible
    if (world.rain) {
      weatherFolder.add(world.rain, 'intensity')
        .min(0.1)
        .max(1.0)
        .step(0.1)
        .name('Rain Intensity')
        .onChange((value) => {
          if (world.rain.enabled) {
            // Stop automatic sequence if user interacts
            if (world.rain.isSequenceActive) {
              world.rain.stopSequence()
            }
            world.environment.setStormy(value)
            if (world.rainSplashes) {
              world.rainSplashes.setIntensity(value)
            }
          }
        })
    }

    // Keep weather folder open
    weatherFolder.open()
  }
}
