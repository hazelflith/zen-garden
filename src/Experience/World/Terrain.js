import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Terrain {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources

    this.setGeometry()
    this.setTextures()
    this.setMaterial()
    this.setMesh()
  }

  setGeometry() {
    this.geometry = new THREE.PlaneGeometry(200, 200, 256, 256) // Doubled from 100x100
    this.geometry.rotateX(- Math.PI * 0.5)

    this.applyHeight()
  }

  applyHeight() {
    const positionAttribute = this.geometry.getAttribute('position')
    const vertex = new THREE.Vector3()

    for (let i = 0; i < positionAttribute.count; i++) {
      vertex.fromBufferAttribute(positionAttribute, i)

      const height = this.getHeightAt(vertex.x, vertex.z)
      positionAttribute.setY(i, height)
    }

    this.geometry.computeVertexNormals()
  }

  getHeightAt(x, z) {
    const distance = Math.sqrt(x * x + z * z)
    let height = 0

    // Check if on radial paths (cross shape)
    const pathWidth = 1.2
    const isOnRadialPath = Math.abs(x) < pathWidth || Math.abs(z) < pathWidth

    // Sand Garden (0 - 3.5)
    if (distance < 3.5) {
      // Ripples
      height = Math.sin(distance * 10.0) * 0.03

      // Slight mound in center
      height += Math.max(0, (1.0 - distance * 0.5)) * 0.2
    }
    // Water Ring (3.5 - 4.5)
    else if (distance < 4.5) {
      height = -0.2
    }
    // Inner Path (4.5 - 6.0) - FLAT
    else if (distance < 6.0) {
      height = 0.0
    }
    // Middle Grass (6.0 - 8.0)
    else if (distance < 8.0) {
      if (isOnRadialPath) {
        // Radial paths are FLAT
        height = 0.0
      } else {
        // Rolling hills
        height = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.5
        height += Math.sin(x * 1.5 + z * 0.5) * 0.1
        height = Math.max(0, height) // Keep positive
      }
    }
    // Outer Path (8.0 - 9.5) - FLAT
    else if (distance < 9.5) {
      height = 0.0
    }
    // Outer Grass (> 9.5)
    else {
      if (isOnRadialPath) {
        // Radial paths are FLAT
        height = 0.0
      } else {
        // More rolling hills
        height = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.8
        height = Math.max(0, height)
      }
    }

    return height
  }

  setTextures() {
    this.textures = {}
    this.textures.grass = this.resources.items.grassTexture
    this.textures.grass.wrapS = THREE.RepeatWrapping
    this.textures.grass.wrapT = THREE.RepeatWrapping
    this.textures.grass.repeat.set(20, 20) // Tile 20 times

    this.textures.path = this.resources.items.pathTexture
    this.textures.path.wrapS = THREE.RepeatWrapping
    this.textures.path.wrapT = THREE.RepeatWrapping
    this.textures.path.repeat.set(10, 10) // Tile 10 times for paths
  }

  setMaterial() {
    this.material = new THREE.MeshStandardMaterial({
      metalness: 0,
      roughness: 1,
      color: '#858585'
    })

    const uSandColor = new THREE.Color('#f5e8d1')
    const uGrassColor = new THREE.Color('#a6bf8c')
    const uPathColor = new THREE.Color('#eedfce')

    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uSandColor = { value: uSandColor }
      shader.uniforms.uGrassColor = { value: uGrassColor }
      shader.uniforms.uPathColor = { value: uPathColor }
      shader.uniforms.uGrassTexture = { value: this.textures.grass }
      shader.uniforms.uPathTexture = { value: this.textures.path }

      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
                    #include <common>
                    varying vec2 vUv2;
                    varying vec3 vPosition;
                `
      )

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
                    #include <begin_vertex>
                    vUv2 = uv;
                    vPosition = position;
                `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
                    #include <common>
                    uniform vec3 uSandColor;
                    uniform vec3 uGrassColor;
                    uniform vec3 uPathColor;
                    uniform sampler2D uGrassTexture;
                    uniform sampler2D uPathTexture;
                    varying vec2 vUv2;
                    varying vec3 vPosition;
                `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `
                    #include <color_fragment>
                    
                    float distanceToCenter = length(vPosition.xz);
                    vec3 mixColor = uGrassColor;
                    
                    // Sample textures
                    vec4 grassSample = texture2D(uGrassTexture, vUv2 * 20.0);
                    vec4 pathSample = texture2D(uPathTexture, vUv2 * 10.0);
                    
                    // Calculate angle for radial paths
                    float angle = atan(vPosition.z, vPosition.x);
                    
                    // Create a mask for radial paths
                    float pathWidth = 1.2;
                    bool isRadialPath = false;
                    
                    // Cross shape paths
                    if(abs(vPosition.x) < pathWidth || abs(vPosition.z) < pathWidth)
                    {
                        isRadialPath = true;
                    }

                    // Sand Garden (0 - 3.5)
                    if(distanceToCenter < 3.5)
                    {
                        mixColor = uSandColor;
                        
                        // Visual Ripples (Texture)
                        float ripple = sin(distanceToCenter * 50.0);
                        mixColor *= 0.95 + ripple * 0.05;
                    }
                    // Water Ring (3.5 - 4.5)
                    else if(distanceToCenter < 4.5)
                    {
                        mixColor = uSandColor * 0.6; // Darker wet sand
                    }
                    // Inner Path (4.5 - 6.0)
                    else if(distanceToCenter < 6.0)
                    {
                        // 70% texture, 30% base color
                        mixColor = mix(uPathColor, pathSample.rgb, 0.7);
                    }
                    // Middle Grass (6.0 - 8.0)
                    else if(distanceToCenter < 8.0)
                    {
                        if(isRadialPath) {
                            // 70% texture, 30% base color
                            mixColor = mix(uPathColor, pathSample.rgb, 0.7);
                        } else {
                            // Use grass texture at 100%
                            mixColor = grassSample.rgb;
                        }
                    }
                    // Outer Path (8.0 - 9.5)
                    else if(distanceToCenter < 9.5)
                    {
                        // 70% texture, 30% base color
                        mixColor = mix(uPathColor, pathSample.rgb, 0.7);
                    }
                    // Outer Grass (> 9.5)
                    else
                    {
                        if(isRadialPath) {
                            // 70% texture, 30% base color
                            mixColor = mix(uPathColor, pathSample.rgb, 0.7);
                        } else {
                            // Use grass texture at 100%
                            mixColor = grassSample.rgb;
                        }
                    }

                    diffuseColor = vec4(mixColor, 1.0);
                `
      )
    }
  }

  setMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.mesh.receiveShadow = true
    this.scene.add(this.mesh)
  }
}
