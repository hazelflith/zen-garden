import * as THREE from 'three'

export default class WindShader {
  constructor(environment) {
    this.environment = environment
  }

  apply(material) {
    material.onBeforeCompile = (shader) => {
      // Add uniforms
      shader.uniforms.uTime = { value: 0 }
      shader.uniforms.uWindDirection = { value: new THREE.Vector2(1, 1) }
      shader.uniforms.uWindStrength = { value: 1.0 }

      // Store reference to update uniforms later
      material.userData.shader = shader

      // Vertex Shader - Header
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        #include <common>
        uniform float uTime;
        uniform vec2 uWindDirection;
        uniform float uWindStrength;
        
        #ifdef USE_WIND_INFLUENCE
          attribute float aWindInfluence;
        #endif

        // Simple noise function
        float noise(vec2 p) {
          return sin(p.x * 10.0) * sin(p.y * 10.0);
        }
        `
      )

      // Vertex Shader - Main
      // We want the wind to affect the top of the object more than the bottom
      // Assuming the object's pivot is at the bottom (y=0)
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        // Calculate world position for wind effect
        vec3 windWorldPosition;
        
        #ifdef USE_INSTANCING
          windWorldPosition = (instanceMatrix * vec4(transformed, 1.0)).xyz;
        #else
          windWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
        #endif

        // Calculate wind effect
        // Use local height (transformed.y) for intensity so objects at y=0 still sway if they have height
        float heightFactor = max(0.0, transformed.y); 
        float windTime = uTime * 2.0;
        
        // Main wind sway
        float sway = sin(windTime + windWorldPosition.x * 0.5 + windWorldPosition.z * 0.5) * 0.1;
        
        // Gusts
        float gust = sin(windTime * 0.5 + windWorldPosition.x * 0.1) * 0.5 + 0.5;
        
        float influence = 1.0;
        #ifdef USE_WIND_INFLUENCE
          influence = aWindInfluence;
        #endif

        // Combine
        vec3 windOffset = vec3(
          uWindDirection.x * (sway + gust) * uWindStrength * heightFactor * 0.2 * influence,
          0.0,
          uWindDirection.y * (sway + gust) * uWindStrength * heightFactor * 0.2 * influence
        );

        // Apply offset
        transformed += windOffset;
        `
      )
    }

    // Add update method to material
    material.userData.updateWind = (time, direction, strength) => {
      if (material.userData.shader) {
        material.userData.shader.uniforms.uTime.value = time
        material.userData.shader.uniforms.uWindDirection.value = direction
        material.userData.shader.uniforms.uWindStrength.value = strength
      }
    }
  }
}
