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
}
