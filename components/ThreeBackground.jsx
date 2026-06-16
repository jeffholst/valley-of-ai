'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * ThreeBackground — opt-in WebGL parallax starfield + nebula rendered behind the
 * gallery content. Lazy-loaded via next/dynamic (ssr:false) so the `three` bundle
 * is only fetched when the user enables the "3D Galaxy" toggle in OptionsDrawer.
 *
 * Rendered inside `valley-cinematic-bg` below the mountain rows (z-index) so the
 * mountains occlude it and the stars read as living only in the sky. Pure visual
 * flourish with a gentle, ambient
 * time-based drift (no pointer interaction) — pointer-events: none,
 * aria-hidden. Respects prefers-reduced-motion (renders a single static frame)
 * and pauses its rAF loop when the tab is hidden. Fully disposes GPU resources
 * on unmount so toggling off leaks nothing.
 */

const STAR_COUNT = 2200;
const FIELD = 600; // half-extent of the cube the stars are scattered through

export default function ThreeBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, width / height, 1, 2000);
    camera.position.z = 500;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    } catch {
      // WebGL unavailable — bail out gracefully, CSS background still shows.
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // --- Starfield (THREE.Points across several implicit depth layers) ---
    const starGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);
    const palette = [
      new THREE.Color(0xc4b5fd), // light purple
      new THREE.Color(0x818cf8), // indigo
      new THREE.Color(0x60a5fa), // blue
      new THREE.Color(0xf9fafb), // near-white
    ];
    for (let i = 0; i < STAR_COUNT; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * FIELD * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * FIELD * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * FIELD * 2;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const starMaterial = new THREE.PointsMaterial({
      size: 2.4,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // --- Soft nebula: a few large additive sprites for volumetric glow ---
    const nebulaTexture = makeNebulaTexture();
    const nebula = new THREE.Group();
    const nebulaColors = [0x6d28d9, 0x1e3a8a, 0x4c1d95];
    for (let i = 0; i < 3; i += 1) {
      const mat = new THREE.SpriteMaterial({
        map: nebulaTexture,
        color: nebulaColors[i],
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.set((Math.random() - 0.5) * 500, (Math.random() - 0.5) * 320 - 60, -200);
      const scale = 520 + Math.random() * 280;
      sprite.scale.set(scale, scale, 1);
      nebula.add(sprite);
    }
    scene.add(nebula);

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let frameId = null;
    let running = true;
    const clock = new THREE.Clock();

    const renderFrame = () => {
      const t = clock.getElapsedTime();
      // Gentle time-based drift only — no pointer interaction.
      stars.rotation.y = t * 0.02;
      stars.rotation.x = Math.sin(t * 0.05) * 0.05;
      renderer.render(scene, camera);
    };

    const animate = () => {
      if (!running) {
        return;
      }
      renderFrame();
      frameId = requestAnimationFrame(animate);
    };

    if (reduceMotion) {
      renderFrame(); // single static frame, no loop
    } else {
      animate();
    }

    const onVisibility = () => {
      if (reduceMotion) {
        return;
      }
      if (document.hidden) {
        running = false;
        if (frameId !== null) {
          cancelAnimationFrame(frameId);
          frameId = null;
        }
      } else if (!running) {
        running = true;
        clock.getDelta(); // discard the paused interval
        animate();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      starGeometry.dispose();
      starMaterial.dispose();
      nebulaTexture.dispose();
      nebula.children.forEach((sprite) => sprite.material.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="three-bg" aria-hidden="true" />;
}

/** Radial-gradient canvas texture used for the soft additive nebula sprites. */
function makeNebulaTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.35)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
