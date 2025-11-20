import * as THREE from 'three'

const PencilShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'uResolution': { value: new THREE.Vector2() },
        'uStrength': { value: 1.0 }, // Edge strength (reduced)
        'uBrightness': { value: 1.05 }, // Paper brightness (reduced)
        'uNoiseStrength': { value: 0.08 } // Paper grain (reduced)
    },

    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `,

    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 uResolution;
        uniform float uStrength;
        uniform float uBrightness;
        uniform float uNoiseStrength;
        varying vec2 vUv;

        float getLuminance(vec3 color) {
            return dot(color, vec3(0.299, 0.587, 0.114));
        }

        // Pseudo-random noise
        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            vec2 texel = 1.0 / uResolution;
            
            // Sobel Operator for Edge Detection
            float gx = 0.0;
            float gy = 0.0;
            
            // Horizontal Gradient
            gx += -1.0 * getLuminance(texture2D(tDiffuse, vUv + vec2(-1.0, -1.0) * texel).rgb);
            gx += -2.0 * getLuminance(texture2D(tDiffuse, vUv + vec2(-1.0,  0.0) * texel).rgb);
            gx += -1.0 * getLuminance(texture2D(tDiffuse, vUv + vec2(-1.0,  1.0) * texel).rgb);
            gx +=  1.0 * getLuminance(texture2D(tDiffuse, vUv + vec2( 1.0, -1.0) * texel).rgb);
            gx +=  2.0 * getLuminance(texture2D(tDiffuse, vUv + vec2( 1.0,  0.0) * texel).rgb);
            gx +=  1.0 * getLuminance(texture2D(tDiffuse, vUv + vec2( 1.0,  1.0) * texel).rgb);
            
            // Vertical Gradient
            gy += -1.0 * getLuminance(texture2D(tDiffuse, vUv + vec2(-1.0, -1.0) * texel).rgb);
            gy += -2.0 * getLuminance(texture2D(tDiffuse, vUv + vec2( 0.0, -1.0) * texel).rgb);
            gy += -1.0 * getLuminance(texture2D(tDiffuse, vUv + vec2( 1.0, -1.0) * texel).rgb);
            gy +=  1.0 * getLuminance(texture2D(tDiffuse, vUv + vec2(-1.0,  1.0) * texel).rgb);
            gy +=  2.0 * getLuminance(texture2D(tDiffuse, vUv + vec2( 0.0,  1.0) * texel).rgb);
            gy +=  1.0 * getLuminance(texture2D(tDiffuse, vUv + vec2( 1.0,  1.0) * texel).rgb);
            
            float edge = sqrt(gx * gx + gy * gy);
            
            // Original Color
            vec4 color = texture2D(tDiffuse, vUv);
            
            // Apply Edge
            // Invert edge (0 = edge, 1 = no edge) for multiplying
            float outline = 1.0 - (edge * uStrength);
            outline = clamp(outline, 0.0, 1.0);
            
            // Paper Grain Noise
            float noise = hash(vUv * uResolution);
            
            // Mix
            vec3 finalColor = color.rgb * uBrightness;
            finalColor *= outline; // Apply dark outlines
            
            // Apply noise (darken slightly)
            finalColor -= noise * uNoiseStrength;
            
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `
}

export default PencilShader
