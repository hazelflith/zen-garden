import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export default class ProceduralTree {
  constructor(scene, position, scale, rotation, windShader, detailMultiplier = 1.0) {
    this.scene = scene
    this.position = position
    this.scale = scale
    this.rotation = rotation
    this.windShader = windShader
    this.detailMultiplier = detailMultiplier // Controls geometry complexity

    this.geometries = []
    this.blossomMatrices = []
    this.materials = []
    this.group = new THREE.Group() // Exposed for LOD system

    this.generate()
  }

  generate() {
    // Trunk
    this.branch(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 1, 0),
      10, // Length
      0.8, // Radius
      0 // Depth
    )

    // Merge wood geometries
    if (this.geometries.length > 0) {
      const mergedGeometry = mergeGeometries(this.geometries)
      const material = new THREE.MeshStandardMaterial({
        color: '#3e2723',
        roughness: 0.9,
        metalness: 0.1
      })

      // Wind shader removed for trunk to prevent base sway

      const mesh = new THREE.Mesh(mergedGeometry, material)

      mesh.position.copy(this.position)
      mesh.scale.set(this.scale, this.scale, this.scale)
      mesh.rotation.y = this.rotation
      mesh.castShadow = true
      mesh.receiveShadow = true

      this.group.add(mesh)
    }

    // Blossoms
    if (this.blossomMatrices.length > 0) {
      // Use circular geometry for more natural-looking blossoms
      const blossomGeometry = new THREE.CircleGeometry(0.3, 6)
      const blossomMaterial = new THREE.MeshStandardMaterial({
        color: '#ffb7c5',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
        roughness: 0.7,
        metalness: 0.1
      })

      blossomMaterial.defines = { USE_WIND_INFLUENCE: '' }

      // Calculate distances from center to determine "outer" leaves
      const distances = []
      const position = new THREE.Vector3()

      for (let i = 0; i < this.blossomMatrices.length; i++) {
        position.setFromMatrixPosition(this.blossomMatrices[i])
        // Calculate horizontal distance from trunk (ignoring height somewhat, or full distance)
        // Using full distance from tree origin (0,0,0 local)
        distances.push({ index: i, distance: position.length() })
      }

      // Sort by distance descending
      distances.sort((a, b) => b.distance - a.distance)

      // Select top 25%
      const count = this.blossomMatrices.length
      const windCount = Math.floor(count * 0.25)
      const windInfluences = new Float32Array(count)

      for (let i = 0; i < count; i++) {
        // Default to 0
        windInfluences[i] = 0.0
      }

      // Set 1.0 for the outer 25%
      for (let i = 0; i < windCount; i++) {
        const originalIndex = distances[i].index
        windInfluences[originalIndex] = 1.0
      }

      // Add attribute to geometry
      blossomGeometry.setAttribute('aWindInfluence', new THREE.InstancedBufferAttribute(windInfluences, 1))

      if (this.windShader) {
        this.windShader.apply(blossomMaterial)
        this.materials.push(blossomMaterial)
      }

      const mesh = new THREE.InstancedMesh(blossomGeometry, blossomMaterial, this.blossomMatrices.length)

      for (let i = 0; i < this.blossomMatrices.length; i++) {
        mesh.setMatrixAt(i, this.blossomMatrices[i])
      }

      mesh.position.copy(this.position)
      mesh.scale.set(this.scale, this.scale, this.scale)
      mesh.rotation.y = this.rotation
      mesh.castShadow = true // Re-enabled for visual quality
      mesh.receiveShadow = true

      this.group.add(mesh)
    }

    // Add group to scene
    this.scene.add(this.group)
  }

  update(time, wind) {
    this.materials.forEach(material => {
      if (material.userData.updateWind) {
        material.userData.updateWind(
          time,
          new THREE.Vector2(Math.sin(wind.direction * Math.PI / 180), Math.cos(wind.direction * Math.PI / 180)),
          wind.strength * 0.25 // Reduce wind effect to 25% for tree leaves/blossoms only
        )
      }
    })
  }

  branch(start, direction, length, radius, depth) {
    // Create branch geometry with LOD-aware segment count
    const segments = Math.max(4, Math.floor(8 * this.detailMultiplier))
    const geometry = new THREE.CylinderGeometry(radius * 0.7, radius, length, segments)
    geometry.translate(0, length / 2, 0)

    // Orient geometry
    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())
    geometry.applyQuaternion(quaternion)
    geometry.translate(start.x, start.y, start.z)

    this.geometries.push(geometry)

    // End point
    const end = start.clone().add(direction.clone().multiplyScalar(length))

    // Recursion
    if (depth < 4) {
      const baseBranchCount = 3 + Math.floor(Math.random() * 3)
      const branchCount = Math.max(2, Math.floor(baseBranchCount * this.detailMultiplier))

      for (let i = 0; i < branchCount; i++) {
        // Random direction deviation (30% wider)
        const deviation = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ).normalize().multiplyScalar(0.78)

        const newDirection = direction.clone().add(deviation).normalize()
        const newLength = length * 0.7
        const newRadius = radius * 0.7

        this.branch(end, newDirection, newLength, newRadius, depth + 1)
      }

      // Add some blossoms to inner branches (depth 2 and 3) for volume
      if (depth > 1) {
        // Increased density for fuller look
        const blossomCount = Math.floor(40 * this.detailMultiplier)
        this.addBlossoms(end, blossomCount, 2.5)
      }
    }
    else {
      // Add dense blossoms at tips
      // Significantly increased count for "max quality" request
      const blossomCount = Math.floor(150 * this.detailMultiplier)
      this.addBlossoms(end, blossomCount, 4.0)
    }
  }

  addBlossoms(position, count, spread) {
    for (let i = 0; i < count; i++) {
      const matrix = new THREE.Matrix4()

      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread
      )

      const blossomPos = position.clone().add(offset)

      const rotation = new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )

      // More size variation for natural look
      const scale = new THREE.Vector3(1, 1, 1).multiplyScalar(0.6 + Math.random() * 1.0)

      matrix.compose(blossomPos, new THREE.Quaternion().setFromEuler(rotation), scale)
      this.blossomMatrices.push(matrix)
    }
  }
}
