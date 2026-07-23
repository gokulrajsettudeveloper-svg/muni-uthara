import * as THREE from 'three';

/**
 * Flowing pink silk behind the centre of the frame — a subdivided plane
 * displaced by two travelling sine waves in the vertex shader, fading out
 * toward its edges so it reads as a drifting veil rather than a rectangle.
 */
export class SilkCloth {
  readonly mesh: THREE.Mesh;
  private readonly uniforms = {
    uTime: { value: 0 },
  };

  constructor() {
    const geometry = new THREE.PlaneGeometry(26, 14, 48, 24);

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying float vWave;
        void main() {
          vUv = uv;
          vec3 p = position;
          float w1 = sin(p.x * 0.45 + uTime * 0.6) * 0.9;
          float w2 = sin(p.y * 0.8 + uTime * 0.85) * 0.5;
          p.z += w1 + w2;
          vWave = (w1 + w2) * 0.5;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying float vWave;
        void main() {
          // Soft edge falloff so the sheet has no visible rectangle border.
          float edgeX = smoothstep(0.0, 0.22, vUv.x) * smoothstep(1.0, 0.78, vUv.x);
          float edgeY = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.75, vUv.y);
          float alpha = edgeX * edgeY * 0.16;
          // Wave crests catch a touch more light, like folded silk.
          vec3 silk = mix(vec3(0.984, 0.812, 0.886), vec3(1.0, 0.92, 0.95), vWave * 0.5 + 0.5);
          gl_FragColor = vec4(silk, alpha);
        }
      `,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0, -9);
    this.mesh.rotation.z = -0.12;
  }

  update(elapsed: number): void {
    this.uniforms.uTime.value = elapsed;
  }
}
