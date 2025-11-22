import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Lantern {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.debug = this.experience.debug

    this.group = new THREE.Group()
    this.group.position.set(0, 0, 0)
    this.scene.add(this.group)

    // Materials
    this.stoneMaterial = new THREE.MeshStandardMaterial({
      color: '#5c5c5c',
      roughness: 0.9,
      flatShading: true,
      side: THREE.DoubleSide
    })

    this.emissiveMaterial = new THREE.MeshStandardMaterial({
      color: '#ff6600',
      emissive: '#ff6600',
      emissiveIntensity: 2,
      toneMapped: false
    })

    this.construct()
  }

  construct() {
    // --- Base (Kiso) ---
    // Bottom slab
    const baseSlab = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.15, 1.2),
      this.stoneMaterial
    )
    baseSlab.position.y = 0.075
    baseSlab.castShadow = true
    baseSlab.receiveShadow = true
    this.group.add(baseSlab)

    // Legs/Feet (4 corner stones)
    const legGeo = new THREE.BoxGeometry(0.3, 0.4, 0.3)
    const legDist = 0.35
    const legs = new THREE.Group()

    const positions = [
      { x: legDist, z: legDist },
      { x: -legDist, z: legDist },
      { x: legDist, z: -legDist },
      { x: -legDist, z: -legDist }
    ]

    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeo, this.stoneMaterial)
      leg.position.set(pos.x, 0.15 + 0.2, pos.z)
      leg.castShadow = true
      leg.receiveShadow = true
      legs.add(leg)
    })
    this.group.add(legs)

    // Platform on top of legs
    const basePlatform = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.1, 1.0),
      this.stoneMaterial
    )
    basePlatform.position.y = 0.15 + 0.4 + 0.05
    basePlatform.castShadow = true
    basePlatform.receiveShadow = true
    this.group.add(basePlatform)

    let currentY = 0.15 + 0.4 + 0.1

    // --- Pedestal (Sao) ---
    const pedestalHeight = 1.2
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.3, pedestalHeight, 8),
      this.stoneMaterial
    )
    pedestal.position.y = currentY + pedestalHeight / 2
    pedestal.castShadow = true
    pedestal.receiveShadow = true
    this.group.add(pedestal)

    currentY += pedestalHeight

    // --- Middle Platform (Chudai) ---
    const middlePlatform = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.15, 1.0),
      this.stoneMaterial
    )
    middlePlatform.position.y = currentY + 0.075
    middlePlatform.castShadow = true
    middlePlatform.receiveShadow = true
    this.group.add(middlePlatform)

    currentY += 0.15

    // --- Light Box (Hibukuro) ---
    const boxHeight = 0.8
    const boxWidth = 0.7

    // The glowing core
    const lightCore = new THREE.Mesh(
      new THREE.BoxGeometry(boxWidth * 0.8, boxHeight * 0.8, boxWidth * 0.8),
      this.emissiveMaterial
    )
    lightCore.position.y = currentY + boxHeight / 2
    this.group.add(lightCore)

    // The stone frame (4 pillars)
    const pillarGeo = new THREE.BoxGeometry(0.1, boxHeight, 0.1)
    const pillarDist = boxWidth / 2 - 0.05

    const boxPillars = new THREE.Group()
    const pillarPositions = [
      { x: pillarDist, z: pillarDist },
      { x: -pillarDist, z: pillarDist },
      { x: pillarDist, z: -pillarDist },
      { x: -pillarDist, z: -pillarDist }
    ]

    pillarPositions.forEach(pos => {
      const p = new THREE.Mesh(pillarGeo, this.stoneMaterial)
      p.position.set(pos.x, currentY + boxHeight / 2, pos.z)
      p.castShadow = true
      p.receiveShadow = true
      boxPillars.add(p)
    })
    this.group.add(boxPillars)

    currentY += boxHeight

    // --- Roof (Kasa) ---
    // Using LatheGeometry for a curved roof
    const roofPoints = []
    // Profile: start top center, go down and out
    roofPoints.push(new THREE.Vector2(0, 0.6))     // Top center tip
    roofPoints.push(new THREE.Vector2(0.2, 0.55))
    roofPoints.push(new THREE.Vector2(0.6, 0.4))
    roofPoints.push(new THREE.Vector2(1.1, 0.15))
    roofPoints.push(new THREE.Vector2(1.3, 0.05))  // Edge
    roofPoints.push(new THREE.Vector2(1.3, 0.0))   // Bottom edge thickness
    roofPoints.push(new THREE.Vector2(0.5, 0.0))   // Underside return
    roofPoints.push(new THREE.Vector2(0, 0.0))     // Close the bottom at center

    const roofGeo = new THREE.LatheGeometry(roofPoints, 6) // 6 segments for hexagonal look
    const roof = new THREE.Mesh(roofGeo, this.stoneMaterial)
    roof.position.y = currentY
    roof.castShadow = true
    roof.receiveShadow = true
    this.group.add(roof)

    currentY += 0.6

    // --- Top Ornament (Hoju) ---
    const hojuBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.2, 0.15, 6),
      this.stoneMaterial
    )
    hojuBase.position.y = currentY + 0.075
    hojuBase.castShadow = true
    this.group.add(hojuBase)

    const hojuBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      this.stoneMaterial
    )
    hojuBall.position.y = currentY + 0.15 + 0.15
    hojuBall.scale.y = 1.3 // Onion shape
    hojuBall.castShadow = true
    this.group.add(hojuBall)

    // --- Light Source ---
    this.light = new THREE.PointLight('#ff6600', 21.4, 0) // distance 0 = infinite range with natural falloff
    this.light.decay = 2 // Physically accurate light decay
    this.light.position.y = currentY - 0.4 // Inside the box
    this.light.castShadow = true
    this.light.shadow.mapSize.set(1024, 1024)
    this.light.shadow.bias = -0.0001
    this.group.add(this.light)

    // Force light update to ensure proper initialization
    this.light.updateMatrix()
    this.light.updateMatrixWorld(true)

    // Debug
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Lantern')

      this.debugFolder
        .add(this.light, 'intensity')
        .min(0)
        .max(50)
        .step(0.1)
        .name('Light Intensity')

      this.debugFolder
        .add(this.light, 'distance')
        .min(0)
        .max(50)
        .step(0.1)
        .name('Light Distance')

      this.debugFolder
        .addColor(this.light, 'color')
        .name('Light Color')
        .onChange(() => {
          this.emissiveMaterial.color.set(this.light.color)
          this.emissiveMaterial.emissive.set(this.light.color)
        })

      this.debugFolder
        .add(this.group.position, 'x')
        .min(-20)
        .max(20)
        .step(0.1)
        .name('Position X')

      this.debugFolder
        .add(this.group.position, 'z')
        .min(-20)
        .max(20)
        .step(0.1)
        .name('Position Z')
    }
  }
}
