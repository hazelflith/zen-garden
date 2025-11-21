import Experience from '../Experience.js'
import Environment from './Environment.js'
import Terrain from './Terrain.js'
import Lantern from './Lantern.js'
import Trees from './Trees.js'
import Water from './Water.js'
import Bridge from './Bridge.js'
import Rocks from './Rocks.js'
import Bushes from './Bushes.js'

import Fences from './Fences.js'
import Flowers from './Flowers.js'
import FallingPetals from './FallingPetals.js'

import Rain from './Rain.js'
import RainSplashes from './RainSplashes.js'

export default class World {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources

    // Wait for resources
    this.resources.on('ready', () => {
      // Setup
      this.environment = new Environment()
      this.scene.userData.environment = this.environment

      this.terrain = new Terrain()
      this.water = new Water()
      this.bridge = new Bridge()
      this.lantern = new Lantern()
      this.trees = new Trees()
      this.rocks = new Rocks()
      this.bushes = new Bushes()
      this.flowers = new Flowers()

      this.fences = new Fences()
      this.fallingPetals = new FallingPetals()
      this.fallingPetals.setSpawnSources(this.trees.getTreePositions())
      this.rain = new Rain()
      this.rainSplashes = new RainSplashes()

      // Add weather controls now that rain exists
      if (this.experience.debug.active) {
        this.experience.debug.addWeatherControls(this)
      }

      // Update environment settings after all objects are created
      this.environment.updateSunPosition()
    })
  }

  update() {
    if (this.environment) {
      this.environment.update()
    }
    if (this.fallingPetals) {
      this.fallingPetals.update()
    }
    if (this.flowers) {
      this.flowers.update()
    }
    if (this.bushes) {
      this.bushes.update()
    }
    if (this.trees) {
      this.trees.update()
    }
    if (this.rain) {
      this.rain.update()
    }
    if (this.rainSplashes) {
      this.rainSplashes.update()
    }
  }
}
