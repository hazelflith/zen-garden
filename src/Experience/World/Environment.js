import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Environment {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.debug = this.experience.debug

    // Time of day (0-24 hours)
    this.timeOfDay = 17 // 5 PM by default

    // Day lighting settings (configurable)
    this.dayLighting = {
      sunIntensity: 1.2,
      ambientIntensity: 0.9,
      envMapIntensity: 0.0,
      fogDensity: 0.014
    }

    // Wind settings
    this.wind = {
      direction: 45,
      strength: 0.2,
      gustStrength: 0.5,
      gustSpeed: 1.0
    }

    // Setup Sun Light
    this.sunLight = new THREE.DirectionalLight('#ffffff', 4)
    this.sunLight.castShadow = true
    this.sunLight.shadow.camera.far = 15
    this.sunLight.shadow.mapSize.set(1024, 1024)
    this.sunLight.shadow.normalBias = 0.05
    this.sunLight.position.set(3.5, 2, -1.25)

    this.sunLight.shadow.camera.left = -20
    this.sunLight.shadow.camera.right = 20
    this.sunLight.shadow.camera.top = 20
    this.sunLight.shadow.camera.bottom = -20
    this.sunLight.shadow.mapSize.set(4096, 4096)
    this.sunLight.shadow.normalBias = 0.05
    this.sunLight.shadow.bias = -0.0005
    this.scene.add(this.sunLight)

    this.ambientLight = new THREE.AmbientLight('#d4c4a8', 0.5)
    this.scene.add(this.ambientLight)

    this.setMoonLight()
    this.setFog()
    this.setEnvironmentMap()

    // Debug
    if (this.debug && this.debug.active) {
      const debugFolder = this.debug.ui.addFolder('Environment')

      debugFolder.add(this, 'timeOfDay').min(0).max(24).step(0.1).name('Time of Day (h)').onChange(() => {
        this.updateSunPosition()
      })

      const dayFolder = debugFolder.addFolder('Day Lighting')
      dayFolder.add(this.dayLighting, 'sunIntensity').min(0).max(10).step(0.1).name('Sun Intensity').onChange(() => this.updateSunPosition())
      dayFolder.add(this.dayLighting, 'ambientIntensity').min(0).max(5).step(0.1).name('Ambient Intensity').onChange(() => this.updateSunPosition())
      dayFolder.add(this.dayLighting, 'envMapIntensity').min(0).max(5).step(0.1).name('Env Intensity').onChange(() => this.updateSunPosition())
      dayFolder.add(this.dayLighting, 'fogDensity').min(0).max(0.2).step(0.001).name('Fog Density').onChange(() => this.updateSunPosition())

      debugFolder.addColor(this.sunLight, 'color').name('sunLightColor')
      debugFolder.addColor(this.ambientLight, 'color').name('ambientLightColor')

      // Wind controls
      const windFolder = debugFolder.addFolder('Wind')
      windFolder.add(this.wind, 'direction').min(0).max(360).step(1).name('Direction (deg)')
      windFolder.add(this.wind, 'strength').min(0).max(5).step(0.1).name('Strength')
      windFolder.add(this.wind, 'gustStrength').min(0).max(2).step(0.1).name('Gust Strength')
      windFolder.add(this.wind, 'gustSpeed').min(0).max(5).step(0.1).name('Gust Speed')
    }

    this.updateSunPosition()
  }

  setMoonLight() {
    this.moonLight = new THREE.DirectionalLight('#b0c4de', 0.8)
    this.moonLight.castShadow = true
    this.moonLight.shadow.camera.far = 50
    this.moonLight.shadow.camera.left = -20
    this.moonLight.shadow.camera.right = 20
    this.moonLight.shadow.camera.top = 20
    this.moonLight.shadow.camera.bottom = -20
    this.moonLight.shadow.mapSize.set(2048, 2048)
    this.moonLight.shadow.normalBias = 0.05
    this.moonLight.shadow.bias = -0.0005
    this.moonLight.visible = false
    this.scene.add(this.moonLight)
  }

  setFog() {
    this.scene.fog = new THREE.FogExp2('#d4c4a8', 0.014)
  }

  updateEnvMapIntensity(intensity) {
    this.scene.traverse((child) => {
      if (child.isMesh && child.material && child.material.isMeshStandardMaterial) {
        child.material.envMapIntensity = intensity
      }
    })
  }

  updateSunPosition() {
    // Calculate sun position
    const angle = (this.timeOfDay - 6) * (Math.PI / 12)
    const radius = 15
    const height = Math.max(1, Math.sin(angle) * 15)
    const horizontalDist = Math.cos(angle) * radius

    this.sunLight.position.set(horizontalDist, height, -5)
    this.moonLight.position.set(-horizontalDist, Math.max(1, -Math.sin(angle) * 15), 5)

    // Define keyframes for lighting parameters
    // Format: [hour, sunIntensity, sunColor, ambientIntensity, ambientColor, moonIntensity, envIntensity, bgIntensity, overlayColor, overlayOpacity, fogDensity, fogColor]
    const fogBase = this.dayLighting.fogDensity
    const keyframes = [
      { hour: 0, sunInt: 0, sunCol: 0xfff5e6, ambInt: 0.01, ambCol: 0x4a5f7f, moonInt: 0.6, envInt: 0.0, bgInt: 0.01, ovCol: 0x000000, ovOp: 0.85, fogDens: fogBase * 0.2, fogCol: 0x0a0a40 },
      { hour: 4, sunInt: 0, sunCol: 0xffa366, ambInt: 0.01, ambCol: 0x4a5f7f, moonInt: 0.6, envInt: 0.0, bgInt: 0.01, ovCol: 0x000000, ovOp: 0.85, fogDens: fogBase * 0.2, fogCol: 0x0a0a40 },
      { hour: 6, sunInt: 0.5, sunCol: 0xffa366, ambInt: 0.4, ambCol: 0xd4a574, moonInt: 0.3, envInt: 0.0, bgInt: 0.4, ovCol: 0xff8844, ovOp: 0.5, fogDens: fogBase * 0.5, fogCol: 0xff8844 },
      { hour: 8, sunInt: this.dayLighting.sunIntensity * 0.8, sunCol: 0xfff0d9, ambInt: this.dayLighting.ambientIntensity * 0.8, ambCol: 0xd4c4a8, moonInt: 0.0, envInt: this.dayLighting.envMapIntensity * 0.8, bgInt: 1.0, ovCol: 0xffffff, ovOp: 0.0, fogDens: fogBase, fogCol: 0xd4c4a8 },
      { hour: 12, sunInt: this.dayLighting.sunIntensity, sunCol: 0xfff5e6, ambInt: this.dayLighting.ambientIntensity, ambCol: 0xd4c4a8, moonInt: 0.0, envInt: this.dayLighting.envMapIntensity, bgInt: 1.0, ovCol: 0xffffff, ovOp: 0.0, fogDens: fogBase, fogCol: 0xd4c4a8 },
      { hour: 16, sunInt: this.dayLighting.sunIntensity * 0.8, sunCol: 0xfff0d9, ambInt: this.dayLighting.ambientIntensity * 0.8, ambCol: 0xd4c4a8, moonInt: 0.0, envInt: this.dayLighting.envMapIntensity * 0.8, bgInt: 1.0, ovCol: 0xffffff, ovOp: 0.0, fogDens: fogBase, fogCol: 0xd4c4a8 },
      { hour: 18, sunInt: 0.5, sunCol: 0xffa366, ambInt: 0.4, ambCol: 0xd4a574, moonInt: 0.3, envInt: 0.0, bgInt: 0.4, ovCol: 0xff8844, ovOp: 0.5, fogDens: fogBase * 0.5, fogCol: 0xff8844 },
      { hour: 20, sunInt: 0, sunCol: 0xffa366, ambInt: 0.01, ambCol: 0x4a5f7f, moonInt: 0.6, envInt: 0.0, bgInt: 0.01, ovCol: 0x000000, ovOp: 0.85, fogDens: fogBase * 0.2, fogCol: 0x0a0a40 },
      { hour: 24, sunInt: 0, sunCol: 0xfff5e6, ambInt: 0.01, ambCol: 0x4a5f7f, moonInt: 0.6, envInt: 0.0, bgInt: 0.01, ovCol: 0x000000, ovOp: 0.85, fogDens: fogBase * 0.2, fogCol: 0x0a0a40 }
    ]

    // Find current keyframes
    let prevKey = keyframes[0]
    let nextKey = keyframes[keyframes.length - 1]

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (this.timeOfDay >= keyframes[i].hour && this.timeOfDay < keyframes[i + 1].hour) {
        prevKey = keyframes[i]
        nextKey = keyframes[i + 1]
        break
      }
    }

    // Calculate interpolation factor (0 to 1)
    const progress = (this.timeOfDay - prevKey.hour) / (nextKey.hour - prevKey.hour)

    // Helper function for color interpolation
    const lerpColor = (c1, c2, alpha) => {
      const color1 = new THREE.Color(c1)
      const color2 = new THREE.Color(c2)
      return color1.lerp(color2, alpha)
    }

    // Helper function for value interpolation
    const lerp = (v1, v2, alpha) => v1 + (v2 - v1) * alpha

    // Apply interpolated values
    this.sunLight.intensity = lerp(prevKey.sunInt, nextKey.sunInt, progress)
    this.sunLight.color.copy(lerpColor(prevKey.sunCol, nextKey.sunCol, progress))

    this.ambientLight.intensity = lerp(prevKey.ambInt, nextKey.ambInt, progress)
    this.ambientLight.color.copy(lerpColor(prevKey.ambCol, nextKey.ambCol, progress))

    this.moonLight.intensity = lerp(prevKey.moonInt, nextKey.moonInt, progress)

    // Update visibility based on intensity threshold
    this.sunLight.visible = this.sunLight.intensity > 0.01
    this.moonLight.visible = this.moonLight.intensity > 0.01

    // Update sky overlay
    if (this.skyOverlay) {
      this.skyOverlay.material.color.copy(lerpColor(prevKey.ovCol, nextKey.ovCol, progress))
      this.skyOverlay.material.opacity = lerp(prevKey.ovOp, nextKey.ovOp, progress)
    }

    // Update background intensity
    if (this.scene.backgroundIntensity !== undefined) {
      this.scene.backgroundIntensity = lerp(prevKey.bgInt, nextKey.bgInt, progress)
    }

    // Update environment map intensity
    this.updateEnvMapIntensity(lerp(prevKey.envInt, nextKey.envInt, progress))

    // Update fog
    if (this.scene.fog) {
      this.scene.fog.density = lerp(prevKey.fogDens, nextKey.fogDens, progress)
      this.scene.fog.color.copy(lerpColor(prevKey.fogCol, nextKey.fogCol, progress))
    }
  }

  setEnvironmentMap() {
    // Use HDR skybox
    const environmentMap = this.experience.resources.items.environmentMap

    if (environmentMap) {
      environmentMap.mapping = THREE.EquirectangularReflectionMapping
      this.scene.background = environmentMap
      this.scene.environment = environmentMap

      // Create a color overlay for time-of-day filtering
      const overlayGeometry = new THREE.SphereGeometry(490, 32, 32)
      const overlayMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.0,
        side: THREE.BackSide,
        depthWrite: false
      })

      this.skyOverlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
      this.scene.add(this.skyOverlay)

      // Set initial intensities
      this.scene.backgroundIntensity = 1.0
      this.updateEnvMapIntensity(1.0)
    }
  }
}
