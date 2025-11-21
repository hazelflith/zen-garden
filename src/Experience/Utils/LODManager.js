import * as THREE from 'three'
import Experience from '../Experience.js'

export default class LODManager {
    constructor() {
        this.experience = new Experience()
        this.camera = this.experience.camera.instance
        this.lodObjects = []

        // LOD distance thresholds
        this.distances = {
            high: 0,      // 0-15 units: full detail
            medium: 15,   // 15-30 units: medium detail
            low: 30       // 30+ units: low detail
        }
    }

    /**
     * Register an LOD object for distance-based updates
     * @param {THREE.LOD} lodObject - The LOD object to track
     */
    register(lodObject) {
        if (lodObject instanceof THREE.LOD) {
            this.lodObjects.push(lodObject)
        }
    }

    /**
     * Unregister an LOD object
     * @param {THREE.LOD} lodObject - The LOD object to remove
     */
    unregister(lodObject) {
        const index = this.lodObjects.indexOf(lodObject)
        if (index > -1) {
            this.lodObjects.splice(index, 1)
        }
    }

    /**
     * Update all LOD objects based on camera distance
     * This is automatically called by Three.js when LOD objects are in the scene,
     * but we keep track of them for debugging and management
     */
    update() {
        // Three.js automatically handles LOD updates in the rendering loop
        // This method can be used for custom LOD logic or debugging
        if (this.experience.debug && this.experience.debug.active) {
            // Could add debug visualization here
        }
    }

    /**
     * Get total number of registered LOD objects
     */
    getCount() {
        return this.lodObjects.length
    }

    /**
     * Clear all registered LOD objects
     */
    clear() {
        this.lodObjects = []
    }
}
