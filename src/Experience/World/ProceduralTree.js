import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export default class ProceduralTree {
  constructor(scene, position, scale, rotation, windShader) {
    this.scene = scene
    this.position = position
    this.scale = scale
    this.rotation = rotation
    this.windShader = windShader

    this.geometries = []
    this.blossomMatrices = []
    this.materials = []

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

      if (this.windShader) {
        this.windShader.apply(material)
        this.materials.push(material)
      }

      const mesh = new THREE.Mesh(mergedGeometry, material)

      mesh.position.copy(this.position)
      mesh.scale.set(this.scale, this.scale, this.scale)
      mesh.rotation.y = this.rotation
      mesh.castShadow = true
      mesh.receiveShadow = true

      this.scene.add(mesh)
    }

    // Blossoms
    if (this.blossomMatrices.length > 0) {
      const blossomGeometry = new THREE.PlaneGeometry(0.5, 0.5)
      const blossomMaterial = new THREE.MeshStandardMaterial({
        color: '#ffb7c5',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
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
      mesh.castShadow = true

      this.scene.add(mesh)
    }
  }

  update(time, wind) {
    this.materials.forEach(material => {
      if (material.userData.updateWind) {
        material.userData.updateWind(
          time,
          new THREE.Vector2(Math.sin(wind.direction * Math.PI / 180), Math.cos(wind.direction * Math.PI / 180)),
          wind.strength
        )
      }
    })
  }

  branch(start, direction, length, radius, depth) {
    // Create branch geometry
    const geometry = new THREE.CylinderGeometry(radius * 0.7, radius, length, 8)
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
      const branchCount = 3 + Math.floor(Math.random() * 3) // Increased branching

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
        this.addBlossoms(end, 15, 2.0)
      }
    }
    else {
      // Add dense blossoms at tips
      this.addBlossoms(end, 60, 3.0)
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

      const scale = new THREE.Vector3(1, 1, 1).multiplyScalar(0.8 + Math.random() * 0.8)

      matrix.compose(blossomPos, new THREE.Quaternion().setFromEuler(rotation), scale)
      this.blossomMatrices.push(matrix)
    }
  }
}
