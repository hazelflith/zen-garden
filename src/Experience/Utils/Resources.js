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

    // Initialize cache
    this.cacheName = 'zen-garden-resources-v1'
    this.initCache()

    this.setLoaders()
    this.startLoading()
  }

  async initCache() {
    try {
      this.cache = await caches.open(this.cacheName)
      console.log('Resource cache initialized')
    } catch (error) {
      console.warn('Cache API not available, using network only:', error)
      this.cache = null
    }
  }

  setLoaders() {
    this.loaders = {}
    this.loaders.gltfLoader = new GLTFLoader()
    this.loaders.textureLoader = new THREE.TextureLoader()
    this.loaders.cubeTextureLoader = new THREE.CubeTextureLoader()
    this.loaders.exrLoader = new EXRLoader()
    this.loaders.audioLoader = new THREE.AudioLoader()

    // Configure loaders to use cached requests
    const loadManager = new THREE.LoadingManager()
    loadManager.setURLModifier((url) => {
      // Return the URL as-is, caching will happen in loadFromCacheOrNetwork
      return url
    })

    this.loaders.gltfLoader.manager = loadManager
    this.loaders.textureLoader.manager = loadManager
    this.loaders.exrLoader.manager = loadManager
    this.loaders.audioLoader.manager = loadManager
  }

  async loadFromCacheOrNetwork(url) {
    // Try to get from cache first
    if (this.cache) {
      try {
        const cachedResponse = await this.cache.match(url)
        if (cachedResponse) {
          console.log(`Loading from cache: ${url}`)
          return cachedResponse
        }
      } catch (error) {
        console.warn('Cache read error:', error)
      }
    }

    // Not in cache, fetch from network
    console.log(`Loading from network: ${url}`)
    const response = await fetch(url)

    // Cache the response for future use
    if (this.cache && response.ok) {
      try {
        await this.cache.put(url, response.clone())
        console.log(`Cached: ${url}`)
      } catch (error) {
        console.warn('Cache write error:', error)
      }
    }

    return response
  }

  async loadWithCache(source, loader, onSuccess, onError) {
    try {
      // For types that can use blob URLs
      if (source.type === 'hdrTexture' || source.type === 'audio') {
        const response = await this.loadFromCacheOrNetwork(source.path)
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)

        loader.load(
          blobUrl,
          (file) => {
            URL.revokeObjectURL(blobUrl) // Clean up blob URL
            onSuccess(file)
          },
          null,
          (error) => {
            URL.revokeObjectURL(blobUrl)
            if (onError) onError(error)
          }
        )
      } else {
        // For other types, let Three.js handle it (it will use browser cache)
        loader.load(source.path, onSuccess, null, onError)
      }
    } catch (error) {
      console.warn(`Cache load failed for ${source.path}, falling back to direct load:`, error)
      loader.load(source.path, onSuccess, null, onError)
    }
  }

  startLoading() {
    // Load each source
    for (const source of this.sources) {
      if (source.type === 'gltfModel') {
        this.loadWithCache(
          source,
          this.loaders.gltfLoader,
          (file) => this.sourceLoaded(source, file)
        )
      }
      else if (source.type === 'texture') {
        this.loadWithCache(
          source,
          this.loaders.textureLoader,
          (file) => this.sourceLoaded(source, file)
        )
      }
      else if (source.type === 'cubeTexture') {
        this.loaders.cubeTextureLoader.load(
          source.path,
          (file) => this.sourceLoaded(source, file)
        )
      }
      else if (source.type === 'hdrTexture') {
        this.loadWithCache(
          source,
          this.loaders.exrLoader,
          (file) => this.sourceLoaded(source, file),
          () => {
            console.warn(`Failed to load ${source.path}`)
            this.sourceLoaded(source, null)
          }
        )
      }
      else if (source.type === 'audio') {
        this.loadWithCache(
          source,
          this.loaders.audioLoader,
          (buffer) => this.sourceLoaded(source, buffer),
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
