"use client";

import { useEffect, useRef } from "react";

type SloganThreeBackgroundProps = {
  className?: string;
};

export function SloganThreeBackground({ className = "" }: SloganThreeBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return;

    let renderer: import("three").WebGLRenderer | null = null;
    let frameId = 0;
    let resizeObserver: ResizeObserver | null = null;
    let disposed = false;
    let disposeScene: (() => void) | null = null;

    Promise.all([import("three")]).then(([THREE]) => {
      if (!mountRef.current || disposed) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.set(0, 0, 8);

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      mountNode.appendChild(renderer.domElement);

      const rootGroup = new THREE.Group();
      scene.add(rootGroup);

      const ambient = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambient);

      const pointLight = new THREE.PointLight(0x7dd3fc, 1.8, 30, 2);
      pointLight.position.set(2.5, 2, 6);
      scene.add(pointLight);

      const fillLight = new THREE.PointLight(0xf8fafc, 1.1, 24, 2);
      fillLight.position.set(-3, -1.5, 5);
      scene.add(fillLight);

      const orbGeometry = new THREE.IcosahedronGeometry(2.35, 12);
      const orbMaterial = new THREE.MeshBasicMaterial({
        color: 0x7dd3fc,
        wireframe: true,
        transparent: true,
        opacity: 0.16,
      });
      const orb = new THREE.Mesh(orbGeometry, orbMaterial);
      orb.rotation.x = 0.45;
      orb.rotation.y = 0.35;
      rootGroup.add(orb);

      const ringGeometry = new THREE.TorusGeometry(2.9, 0.02, 12, 180);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.12,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = 1.1;
      ring.rotation.y = 0.4;
      rootGroup.add(ring);

      const haloGeometry = new THREE.PlaneGeometry(9, 9);
      const haloMaterial = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform float uTime;

          void main() {
            vec2 uv = vUv - 0.5;
            float angle = atan(uv.y, uv.x);
            float radius = length(uv);
            float glow = smoothstep(0.62, 0.0, radius);
            float ripple = 0.5 + 0.5 * sin(angle * 5.0 - uTime * 0.9 + radius * 12.0);
            vec3 colorA = vec3(0.02, 0.42, 0.78);
            vec3 colorB = vec3(0.82, 0.93, 1.0);
            vec3 color = mix(colorA, colorB, ripple);
            float alpha = glow * 0.22;
            gl_FragColor = vec4(color, alpha);
          }
        `,
      });
      const halo = new THREE.Mesh(haloGeometry, haloMaterial);
      halo.position.z = -1.4;
      rootGroup.add(halo);

      const particleCount = 180;
      const particlePositions = new Float32Array(particleCount * 3);
      const particleScales = new Float32Array(particleCount);

      for (let index = 0; index < particleCount; index += 1) {
        const stride = index * 3;
        const radius = 2.8 + Math.random() * 2.6;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        particlePositions[stride] = radius * Math.sin(phi) * Math.cos(theta);
        particlePositions[stride + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.58;
        particlePositions[stride + 2] = (Math.random() - 0.5) * 2.4;
        particleScales[index] = 0.6 + Math.random() * 1.4;
      }

      const particlesGeometry = new THREE.BufferGeometry();
      particlesGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
      particlesGeometry.setAttribute("aScale", new THREE.BufferAttribute(particleScales, 1));

      const particlesMaterial = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
        },
        vertexShader: `
          attribute float aScale;
          uniform float uTime;

          void main() {
            vec3 transformed = position;
            transformed.x += sin(uTime * 0.18 + position.y * 0.6) * 0.12;
            transformed.y += cos(uTime * 0.22 + position.x * 0.7) * 0.08;

            vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = (2.4 + aScale * 2.8) * (12.0 / -mvPosition.z);
          }
        `,
        fragmentShader: `
          void main() {
            float dist = distance(gl_PointCoord, vec2(0.5));
            float strength = smoothstep(0.5, 0.0, dist);
            vec3 color = mix(vec3(0.55, 0.81, 0.98), vec3(1.0), strength);
            gl_FragColor = vec4(color, strength * 0.55);
          }
        `,
      });

      const particles = new THREE.Points(particlesGeometry, particlesMaterial);
      rootGroup.add(particles);

      const resize = () => {
        if (!mountNode || !renderer) return;
        const { clientWidth, clientHeight } = mountNode;
        if (!clientWidth || !clientHeight) return;
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(clientWidth, clientHeight, false);
      };

      resize();
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mountNode);

      const clock = new THREE.Clock();

      const animate = () => {
        if (!renderer || disposed) return;
        const elapsed = clock.getElapsedTime();
        rootGroup.rotation.y = elapsed * 0.12;
        rootGroup.rotation.x = Math.sin(elapsed * 0.3) * 0.08;
        orb.rotation.z = elapsed * 0.08;
        ring.rotation.z = elapsed * 0.18;
        haloMaterial.uniforms.uTime.value = elapsed;
        particlesMaterial.uniforms.uTime.value = elapsed;
        renderer.render(scene, camera);
        frameId = window.requestAnimationFrame(animate);
      };

      animate();

      disposeScene = () => {
        window.cancelAnimationFrame(frameId);
        resizeObserver?.disconnect();
        particlesGeometry.dispose();
        particlesMaterial.dispose();
        haloGeometry.dispose();
        haloMaterial.dispose();
        ringGeometry.dispose();
        ringMaterial.dispose();
        orbGeometry.dispose();
        orbMaterial.dispose();
        renderer?.dispose();
        if (renderer?.domElement.parentNode === mountNode) {
          mountNode.removeChild(renderer.domElement);
        }
      };
    });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      disposeScene?.();
      if (renderer?.domElement.parentNode === mountNode) {
        mountNode.removeChild(renderer.domElement);
      }
      renderer?.dispose();
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}
