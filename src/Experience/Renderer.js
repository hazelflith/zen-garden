import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import PencilShader from './Shaders/PencilShader.js'
import Experience from './Experience.js'

export default class Renderer {
  constructor() {
    this.experience = new Experience()
    this.canvas = this.experience.canvas
    this.sizes = this.experience.sizes
    this.scene = this.experience.scene
    this.camera = this.experience.camera
    this.debug = this.experience.debug

    this.setInstance()
    this.setPostProcessing()
  }

  setInstance() {
    this.instance = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true
    })
    this.instance.physicallyCorrectLights = true
    this.instance.outputColorSpace = THREE.SRGBColorSpace
    this.instance.toneMapping = THREE.CineonToneMapping
    this.instance.toneMappingExposure = 1.0
    this.instance.shadowMap.enabled = true
    this.instance.shadowMap.type = THREE.PCFSoftShadowMap
    this.instance.setClearColor('#ebe5d0')
    this.instance.setSize(this.sizes.width, this.sizes.height)
    this.instance.setPixelRatio(Math.min(this.sizes.pixelRatio, 2))

    // Debug
    if (this.debug.active) {
      const debugFolder = this.debug.ui.addFolder('Renderer')
      debugFolder.add(this.instance, 'toneMappingExposure').min(0).max(10).step(0.001)
      debugFolder.addColor(this.instance, 'clearColor').onChange(() => {
        this.instance.setClearColor(this.instance.clearColor)
      })
    }
  }

  setPostProcessing() {
    this.effectComposer = new EffectComposer(this.instance)
    this.effectComposer.setPixelRatio(Math.min(this.sizes.pixelRatio, 2))
    this.effectComposer.setSize(this.sizes.width, this.sizes.height)

    const renderPass = new RenderPass(this.scene, this.camera.instance)
    this.effectComposer.addPass(renderPass)

    // Bloom
    this.unrealBloomPass = new UnrealBloomPass()
    this.unrealBloomPass.strength = 0.142 // Default strength
    this.unrealBloomPass.radius = 0.613 // Default radius
    this.unrealBloomPass.threshold = 0.85
    this.effectComposer.addPass(this.unrealBloomPass)

    // Pencil Filter
    this.pencilPass = new ShaderPass(PencilShader)
    this.pencilPass.uniforms['uResolution'].value.x = this.sizes.width
    this.pencilPass.uniforms['uResolution'].value.y = this.sizes.height
    this.pencilPass.enabled = false // Disabled by default
    this.effectComposer.addPass(this.pencilPass)

    // Debug
    if (this.debug.active) {
      const debugFolder = this.debug.ui.addFolder('PostProcessing')

      const bloomFolder = debugFolder.addFolder('Bloom')
      bloomFolder.add(this.unrealBloomPass, 'enabled')
      bloomFolder.add(this.unrealBloomPass, 'strength').min(0).max(2).step(0.001)
      bloomFolder.add(this.unrealBloomPass, 'radius').min(0).max(2).step(0.001)
      bloomFolder.add(this.unrealBloomPass, 'threshold').min(0).max(1).step(0.001)

      const pencilFolder = debugFolder.addFolder('Pencil Filter')
      pencilFolder.add(this.pencilPass, 'enabled')
      pencilFolder.add(this.pencilPass.uniforms.uStrength, 'value').min(0).max(5).step(0.01).name('Edge Strength')
      pencilFolder.add(this.pencilPass.uniforms.uBrightness, 'value').min(0.5).max(2).step(0.01).name('Brightness')
      pencilFolder.add(this.pencilPass.uniforms.uNoiseStrength, 'value').min(0).max(0.5).step(0.01).name('Noise Strength')
    }
  }

  resize() {
    this.instance.setSize(this.sizes.width, this.sizes.height)
    this.instance.setPixelRatio(Math.min(this.sizes.pixelRatio, 2))

    this.effectComposer.setSize(this.sizes.width, this.sizes.height)
    this.effectComposer.setPixelRatio(Math.min(this.sizes.pixelRatio, 2))

    if (this.pencilPass) {
      this.pencilPass.uniforms['uResolution'].value.x = this.sizes.width
      this.pencilPass.uniforms['uResolution'].value.y = this.sizes.height
    }
  }

  update() {
    this.effectComposer.render()
  }
}
