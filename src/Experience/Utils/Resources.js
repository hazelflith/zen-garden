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

    if (this.loaded === this.toLoad) {
      this.trigger('ready')
    }
  }
}
