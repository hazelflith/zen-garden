import EventEmitter from './EventEmitter.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import * as THREE from 'three'

export default class Resources extends EventEmitter {
  constructor(sources) {
    super()

    this.sources = sources

    this.items = {}
    this.toLoad = this.sources.length
    this.loaded = 0

    this.setLoaders()
    this.startLoading()
  }

  setLoaders() {
    this.loaders = {}
    this.loaders.gltfLoader = new GLTFLoader()
    this.loaders.textureLoader = new THREE.TextureLoader()
    this.loaders.cubeTextureLoader = new THREE.CubeTextureLoader()
    this.loaders.exrLoader = new EXRLoader()
    this.loaders.audioLoader = new THREE.AudioLoader()
  }

  startLoading() {
    // Load each source
    for (const source of this.sources) {
      if (source.type === 'gltfModel') {
        this.loaders.gltfLoader.load(
          source.path,
          (file) => {
            this.sourceLoaded(source, file)
          }
        )
      }
      else if (source.type === 'texture') {
        this.loaders.textureLoader.load(
          source.path,
          (file) => {
            this.sourceLoaded(source, file)
          }
        )
      }
      else if (source.type === 'cubeTexture') {
        this.loaders.cubeTextureLoader.load(
          source.path,
          (file) => {
            this.sourceLoaded(source, file)
          }
        )
      }
      else if (source.type === 'hdrTexture') {
        this.loaders.exrLoader.load(
          source.path,
          (file) => {
            this.sourceLoaded(source, file)
          },
          null,
          () => {
            console.warn(`Failed to load ${source.path}`)
            this.sourceLoaded(source, null)
          }
        )
      }
      else if (source.type === 'audio') {
        this.loaders.audioLoader.load(
          source.path,
          (buffer) => {
            this.sourceLoaded(source, buffer)
          },
          null,
          () => {
            console.warn(`Failed to load ${source.path}`)
            this.sourceLoaded(source, null)
          }
        )
      }
    }
  }

  sourceLoaded(source, file) {
    this.items[source.name] = file

    this.loaded++

    // Update loading progress
    const progress = (this.loaded / this.toLoad) * 100
    this.trigger('progress', [progress])

    // Update loading UI
    const loadingBar = document.getElementById('loading-bar')
    const loadingPercentage = document.getElementById('loading-percentage')
    if (loadingBar) {
      loadingBar.style.width = `${progress}%`
    }
    if (loadingPercentage) {
      loadingPercentage.textContent = `${Math.round(progress)}%`
    }

    if (this.loaded === this.toLoad) {
      // Hide loading screen after a short delay
      setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen')
        if (loadingScreen) {
          loadingScreen.style.opacity = '0'
          setTimeout(() => {
            loadingScreen.style.display = 'none'
          }, 500)
        }
      }, 300)

      this.trigger('ready')
    }
  }
}
