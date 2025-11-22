import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Environment {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.debug = this.experience.debug

    // Time of Day
    this.timeOfDay = 18 // 6 PM by default
    this.isTimePaused = false

    // Day lighting settings (configurable)
    this.dayLighting = {
      sunIntensity: 1.2,
      ambientIntensity: 0.9,
      envMapIntensity: 0.0,
      fogDensity: 0.014,
      fogColor: '#d4c4a8'
    }

    // Night lighting settings (configurable)
    this.nightLighting = {
      ambientIntensity: 0.01,
      moonIntensity: 0.2,
      fogDensityMultiplier: 1,
      fogColor: '#181618',
      skyboxColor: '#a08d99',
      overlayOpacity: 0.0,
      overlayColor: '#000000'
    }

    // Wind settings (Base values)
    this.windSettings = {
      direction: 45,
      strength: 1,
      gustStrength: 0.5,
      gustSpeed: 1.0
    }

    // Actual wind (Calculated)
    this.wind = {
      direction: 45,
      strength: 1,
      gustStrength: 0.5,
      gustSpeed: 1.0,
      currentGust: 0
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
      }).listen()

      debugFolder.add(this, 'isTimePaused').name('Pause Time')

      const dayFolder = debugFolder.addFolder('Day Lighting')
      dayFolder.add(this.dayLighting, 'sunIntensity').min(0).max(10).step(0.1).name('Sun Intensity').onChange(() => this.updateSunPosition())
      dayFolder.add(this.dayLighting, 'ambientIntensity').min(0).max(5).step(0.1).name('Ambient Intensity').onChange(() => this.updateSunPosition())
      dayFolder.add(this.dayLighting, 'envMapIntensity').min(0).max(5).step(0.1).name('Env Intensity').onChange(() => this.updateSunPosition())
      dayFolder.add(this.dayLighting, 'fogDensity').min(0).max(0.2).step(0.001).name('Fog Density').onChange(() => this.updateSunPosition())
      dayFolder.addColor(this.dayLighting, 'fogColor').name('Fog Color').onChange(() => this.updateSunPosition())

      debugFolder.addColor(this.sunLight, 'color').name('sunLightColor')
      debugFolder.addColor(this.ambientLight, 'color').name('ambientLightColor')

      // Night lighting controls
      const nightFolder = debugFolder.addFolder('Night Lighting')
      nightFolder.add(this.nightLighting, 'ambientIntensity').min(0).max(0.1).step(0.001).name('Ambient Intensity').onChange(() => this.updateSunPosition())
      nightFolder.add(this.nightLighting, 'moonIntensity').min(0).max(2).step(0.1).name('Moon Intensity').onChange(() => this.updateSunPosition())
      nightFolder.add(this.nightLighting, 'fogDensityMultiplier').min(0).max(1).step(0.05).name('Fog Density Mult').onChange(() => this.updateSunPosition())
      nightFolder.addColor(this.nightLighting, 'fogColor').name('Fog Color').onChange(() => this.updateSunPosition())
      nightFolder.addColor(this.nightLighting, 'skyboxColor').name('Skybox Tint').onChange(() => this.updateSunPosition())
      nightFolder.add(this.nightLighting, 'overlayOpacity').min(0).max(1).step(0.01).name('Overlay Opacity').onChange(() => this.updateSunPosition())
      nightFolder.addColor(this.nightLighting, 'overlayColor').name('Overlay Color').onChange(() => this.updateSunPosition())

      // Wind controls
      const windFolder = debugFolder.addFolder('Wind')
      windFolder.add(this.windSettings, 'direction').min(0).max(360).step(1).name('Direction (deg)')
      windFolder.add(this.windSettings, 'strength').min(0).max(5).step(0.1).name('Strength')
      windFolder.add(this.windSettings, 'gustStrength').min(0).max(2).step(0.1).name('Gust Strength')
      windFolder.add(this.windSettings, 'gustSpeed').min(0).max(5).step(0.1).name('Gust Speed')
    }

    this.updateSunPosition()
    this.setAudio()
  }

  setAudio() {
    // Ambience sound
    this.sound = new THREE.Audio(this.experience.camera.audioListener)

    // Background music
    this.bgMusic = new THREE.Audio(this.experience.camera.audioListener)

    const resumeContext = () => {
      const context = this.experience.camera.audioListener.context
      if (context.state === 'suspended') {
        context.resume().then(() => {
          console.log('Audio context resumed')
        })
      }
    }

    // Try to resume immediately
    resumeContext()

    // Add listeners for first interaction
    window.addEventListener('click', resumeContext, { once: true })
    window.addEventListener('keydown', resumeContext, { once: true })
    window.addEventListener('touchstart', resumeContext, { once: true })

    // Setup ambience
    const setBuffer = () => {
      if (this.resources.items.ambientSound) {
        this.sound.setBuffer(this.resources.items.ambientSound)
        this.sound.setLoop(true)
        this.sound.setVolume(1.5)
        this.sound.play()
      }
    }

    // Setup background music
    const setBgMusicBuffer = () => {
      if (this.resources.items.backgroundMusic) {
        this.bgMusic.setBuffer(this.resources.items.backgroundMusic)
        this.bgMusic.setLoop(true)
        this.bgMusic.setVolume(0.75) // 75% volume
        this.bgMusic.play()
        console.log('Background music started at 75% volume')
      }
    }

    if (this.resources.items.ambientSound) {
      setBuffer()
    } else {
      this.resources.on('ready', () => {
        setBuffer()
      })
    }

    if (this.resources.items.backgroundMusic) {
      setBgMusicBuffer()
    } else {
      this.resources.on('ready', () => {
        setBgMusicBuffer()
      })
    }
  }

  setStormy(intensity = 1.0) {
    this.weatherTarget = intensity
  }

  setSunny() {
    this.weatherTarget = 0
  }

  update() {
    // Update Time of Day
    if (!this.isTimePaused) {
      const delta = this.experience.time.delta
      // 1 real second = 2 in-game minutes
      // 2 in-game minutes = 2/60 hours
      this.timeOfDay += (delta / 1000) * (2 / 60)

      if (this.timeOfDay >= 24) {
        this.timeOfDay = 0
      }

      this.updateSunPosition()
    }

    // Smoothly transition weather factor
    if (this.weatherFactor === undefined) this.weatherFactor = 0
    if (this.weatherTarget === undefined) this.weatherTarget = 0

    const speed = 0.02
    if (Math.abs(this.weatherFactor - this.weatherTarget) > 0.001) {
      this.weatherFactor += (this.weatherTarget - this.weatherFactor) * speed
      this.updateSunPosition() // Force update to apply weather
    }

    // Update Wind
    // Copy base settings
    this.wind.direction = this.windSettings.direction
    this.wind.gustSpeed = this.windSettings.gustSpeed
    this.wind.gustStrength = this.windSettings.gustStrength

    // Apply weather influence to strength
    // Increase wind strength by 2x the weather factor
    this.wind.strength = this.windSettings.strength + (this.weatherFactor * 2.0)
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
    // Added nightMix: 0 = Day, 1 = Night
    const fogBase = this.dayLighting.fogDensity
    const nightFogCol = parseInt(this.nightLighting.fogColor.replace('#', '0x'))
    const dayFogCol = parseInt(this.dayLighting.fogColor.replace('#', '0x'))

    const keyframes = [
      { hour: 0, sunInt: 0, sunCol: 0xfff5e6, ambInt: 0.1, ambCol: 0x4a5f7f, moonInt: this.nightLighting.moonIntensity, envInt: 0.2, bgInt: 1.0, ovCol: 0x000000, ovOp: 0.0, fogDens: fogBase * this.nightLighting.fogDensityMultiplier, fogCol: nightFogCol, nightMix: 1.0 },
      { hour: 4, sunInt: 0, sunCol: 0xffa366, ambInt: 0.1, ambCol: 0x4a5f7f, moonInt: this.nightLighting.moonIntensity, envInt: 0.2, bgInt: 1.0, ovCol: 0x000000, ovOp: 0.0, fogDens: fogBase * this.nightLighting.fogDensityMultiplier, fogCol: nightFogCol, nightMix: 1.0 },
      { hour: 6, sunInt: 0.5, sunCol: 0xffa366, ambInt: 0.4, ambCol: 0xd4a574, moonInt: 0.3, envInt: 0.5, bgInt: 0.4, ovCol: 0xff8844, ovOp: 0.5, fogDens: fogBase * 0.5, fogCol: 0xff8844, nightMix: 0.5 },
      { hour: 8, sunInt: this.dayLighting.sunIntensity * 0.8, sunCol: 0xfff0d9, ambInt: this.dayLighting.ambientIntensity * 0.8, ambCol: 0xd4c4a8, moonInt: 0.0, envInt: this.dayLighting.envMapIntensity * 0.8, bgInt: 1.0, ovCol: 0xffffff, ovOp: 0.0, fogDens: fogBase, fogCol: dayFogCol, nightMix: 0.0 },
      { hour: 12, sunInt: this.dayLighting.sunIntensity, sunCol: 0xfff5e6, ambInt: this.dayLighting.ambientIntensity, ambCol: 0xd4c4a8, moonInt: 0.0, envInt: this.dayLighting.envMapIntensity, bgInt: 1.0, ovCol: 0xffffff, ovOp: 0.0, fogDens: fogBase, fogCol: dayFogCol, nightMix: 0.0 },
      { hour: 16, sunInt: this.dayLighting.sunIntensity * 0.8, sunCol: 0xfff0d9, ambInt: this.dayLighting.ambientIntensity * 0.8, ambCol: 0xd4c4a8, moonInt: 0.0, envInt: this.dayLighting.envMapIntensity * 0.8, bgInt: 1.0, ovCol: 0xffffff, ovOp: 0.0, fogDens: fogBase, fogCol: dayFogCol, nightMix: 0.0 },
      { hour: 18, sunInt: 0.5, sunCol: 0xffa366, ambInt: 0.4, ambCol: 0xd4a574, moonInt: 0.3, envInt: 0.5, bgInt: 0.4, ovCol: 0xff8844, ovOp: 0.5, fogDens: fogBase * 0.5, fogCol: 0xff8844, nightMix: 0.5 },
      { hour: 20, sunInt: 0, sunCol: 0xffa366, ambInt: 0.1, ambCol: 0x4a5f7f, moonInt: this.nightLighting.moonIntensity, envInt: 0.2, bgInt: 1.0, ovCol: 0x000000, ovOp: 0.0, fogDens: fogBase * this.nightLighting.fogDensityMultiplier, fogCol: nightFogCol, nightMix: 1.0 },
      { hour: 24, sunInt: 0, sunCol: 0xfff5e6, ambInt: 0.1, ambCol: 0x4a5f7f, moonInt: this.nightLighting.moonIntensity, envInt: 0.2, bgInt: 1.0, ovCol: 0x000000, ovOp: 0.0, fogDens: fogBase * this.nightLighting.fogDensityMultiplier, fogCol: nightFogCol, nightMix: 1.0 }
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
    let sunInt = lerp(prevKey.sunInt, nextKey.sunInt, progress)
    let sunCol = lerpColor(prevKey.sunCol, nextKey.sunCol, progress)
    let ambInt = lerp(prevKey.ambInt, nextKey.ambInt, progress)
    let ambCol = lerpColor(prevKey.ambCol, nextKey.ambCol, progress)
    let fogDens = lerp(prevKey.fogDens, nextKey.fogDens, progress)
    let fogCol = lerpColor(prevKey.fogCol, nextKey.fogCol, progress)
    let envInt = lerp(prevKey.envInt, nextKey.envInt, progress)
    let nightMix = lerp(prevKey.nightMix, nextKey.nightMix, progress)

    // Apply Weather Blending
    if (this.weatherFactor > 0) {
      const rainSunReduction = 0.3
      const rainAmbReduction = 0.5
      const rainFogIncrease = 1.8
      const rainyColor = new THREE.Color('#667799')
      const rainyFogCol = new THREE.Color('#222233')

      sunInt = lerp(sunInt, sunInt * rainSunReduction, this.weatherFactor)
      sunCol.lerp(rainyColor, this.weatherFactor * 0.3)
      ambInt = lerp(ambInt, ambInt * rainAmbReduction, this.weatherFactor)
      ambCol.lerp(rainyColor, this.weatherFactor * 0.2)
      fogDens = lerp(fogDens, fogDens * rainFogIncrease, this.weatherFactor)
      fogCol.lerp(rainyFogCol, this.weatherFactor * 0.4)
      envInt = lerp(envInt, envInt * 0.5, this.weatherFactor)
    }

    this.sunLight.intensity = sunInt
    this.sunLight.color.copy(sunCol)

    this.ambientLight.intensity = ambInt
    this.ambientLight.color.copy(ambCol)

    this.moonLight.intensity = lerp(prevKey.moonInt, nextKey.moonInt, progress)

    this.sunLight.visible = this.sunLight.intensity > 0.01
    this.moonLight.visible = this.moonLight.intensity > 0.01

    this.sunLight.castShadow = this.sunLight.intensity > 0.5
    this.moonLight.castShadow = this.moonLight.intensity > 0.3

    // Update Skybox Opacities
    if (this.daySkybox && this.nightSkybox) {
      this.daySkybox.material.opacity = 1 - nightMix
      this.nightSkybox.material.opacity = nightMix
      this.nightSkybox.material.color.set(this.nightLighting.skyboxColor)

      // Ensure they are visible/invisible as needed to save performance
      this.daySkybox.visible = this.daySkybox.material.opacity > 0.01
      this.nightSkybox.visible = this.nightSkybox.material.opacity > 0.01
    }

    // Swap Environment Map (Reflections)
    // We swap when nightMix crosses 0.5 to avoid rapid switching
    if (this.scene.environment) {
      const environmentMap = this.experience.resources.items.environmentMap
      const nightEnvironmentMap = this.experience.resources.items.nightEnvironmentMap

      if (nightMix > 0.5 && this.scene.environment !== nightEnvironmentMap && nightEnvironmentMap) {
        this.scene.environment = nightEnvironmentMap
      } else if (nightMix <= 0.5 && this.scene.environment !== environmentMap && environmentMap) {
        this.scene.environment = environmentMap
      }
    }

    // Update sky overlay (Still used for weather/fog blending)
    if (this.skyOverlay) {
      // We reduce the overlay opacity influence from keyframes since we have real skyboxes now
      // But we keep it for weather and extreme darkness if needed
      let targetOp = lerp(prevKey.ovOp, nextKey.ovOp, progress)
      let targetCol = lerpColor(prevKey.ovCol, nextKey.ovCol, progress)

      // If we have a night skybox, we don't need the black overlay to hide the day skybox anymore
      // So we can reduce the overlay opacity significantly at night
      if (this.nightSkybox) {
        // Apply user configured night overlay settings
        if (nightMix > 0) {
          const nightOverlayCol = new THREE.Color(this.nightLighting.overlayColor)
          targetOp = lerp(targetOp, this.nightLighting.overlayOpacity, nightMix)
          targetCol.lerp(nightOverlayCol, nightMix)
        } else {
          targetOp *= 0.2 // Reduce overlay influence during day/transition if needed
        }
      }

      this.skyOverlay.material.color.copy(targetCol)
      this.skyOverlay.material.opacity = targetOp

      // Blend with Fog
      // Calculate how much the fog should obscure the sky
      // 0.014 is base density, 0.05 is very thick
      const fogCover = Math.min(1.0, (fogDens - 0.01) * 30)

      if (fogCover > 0) {
        this.skyOverlay.material.color.lerp(fogCol, fogCover)
        this.skyOverlay.material.opacity = Math.max(this.skyOverlay.material.opacity, fogCover)
      }

      // Apply rain weather effect
      if (this.weatherFactor > 0) {
        // Use the same rainy fog color for consistency
        const rainyFogCol = new THREE.Color('#222233')
        this.skyOverlay.material.color.lerp(rainyFogCol, this.weatherFactor * 0.6)
        this.skyOverlay.material.opacity = lerp(this.skyOverlay.material.opacity, 0.9, this.weatherFactor)
      }
    }

    // Update background intensity
    if (this.scene.backgroundIntensity !== undefined) {
      let bgInt = lerp(prevKey.bgInt, nextKey.bgInt, progress)
      if (this.weatherFactor > 0) {
        bgInt = lerp(bgInt, 0.1, this.weatherFactor)
      }
      this.scene.backgroundIntensity = bgInt
    }

    this.updateEnvMapIntensity(envInt)

    if (this.scene.fog) {
      this.scene.fog.density = fogDens
      this.scene.fog.color.copy(fogCol)
    }
  }

  setEnvironmentMap() {
    const environmentMap = this.experience.resources.items.environmentMap
    const nightEnvironmentMap = this.experience.resources.items.nightEnvironmentMap

    if (environmentMap) {
      environmentMap.mapping = THREE.EquirectangularReflectionMapping
      // this.scene.background = environmentMap // Removed: Using skybox spheres instead
      this.scene.environment = environmentMap

      // Create Day Skybox
      const dayGeometry = new THREE.SphereGeometry(490, 64, 64)
      const dayMaterial = new THREE.MeshBasicMaterial({
        map: environmentMap,
        side: THREE.BackSide,
        transparent: true,
        opacity: 1.0,
        toneMapped: false, // Important for HDRI
        fog: false,
        depthWrite: false
      })
      this.daySkybox = new THREE.Mesh(dayGeometry, dayMaterial)
      this.daySkybox.renderOrder = -1
      // Rotate to align with default environment rotation if needed
      this.daySkybox.rotation.y = Math.PI
      this.scene.add(this.daySkybox)
    }

    if (nightEnvironmentMap) {
      console.log('Creating Night Skybox with map:', nightEnvironmentMap)
      nightEnvironmentMap.mapping = THREE.EquirectangularReflectionMapping

      // Optimize for sharpness
      nightEnvironmentMap.generateMipmaps = false
      nightEnvironmentMap.minFilter = THREE.LinearFilter
      nightEnvironmentMap.magFilter = THREE.LinearFilter
      nightEnvironmentMap.anisotropy = this.experience.renderer.instance.capabilities.getMaxAnisotropy()

      // Create Night Skybox
      const nightGeometry = new THREE.SphereGeometry(489, 64, 64) // Slightly smaller to avoid z-fighting
      const nightMaterial = new THREE.MeshBasicMaterial({
        map: nightEnvironmentMap,
        color: 0xffffff, // Full brightness as requested
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.0,
        toneMapped: false,
        fog: false,
        depthWrite: false
      })
      this.nightSkybox = new THREE.Mesh(nightGeometry, nightMaterial)
      this.nightSkybox.renderOrder = -1
      this.nightSkybox.rotation.y = Math.PI
      this.scene.add(this.nightSkybox)
      console.log('Night Skybox added to scene', this.nightSkybox)
    } else {
      console.warn('Night Environment Map is missing!')
    }

    // Sky Overlay (for weather/fog)
    const overlayGeometry = new THREE.SphereGeometry(488, 32, 32) // Inside both skyboxes
    const overlayMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    })

    this.skyOverlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
    this.scene.add(this.skyOverlay)

    this.scene.backgroundIntensity = 1.0
    this.updateEnvMapIntensity(1.0)
  }
}
