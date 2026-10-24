import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { isWebGLAvailable } from './utils/webglDetect';

/**
 * ATW — Cinematic 3D Metallic Ribbon Logo Reveal
 * Engineered with Three.js, Frenet Frame Parametric Ribbon BufferGeometry,
 * Physically-Based Materials (PBR), Procedural Studio Softbox Reflection Mapping, and GSAP.
 */
export default function Cinematic3DLogoReveal({ onComplete, onClose }) {
  const mountRef = useRef(null);
  const flareCanvasRef = useRef(null);
  const [phaseText, setPhaseText] = useState('Phase 1: Pure Darkness');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showBrand, setShowBrand] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const audioCtxRef = useRef(null);
  const timelineRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // --- 1. Audio Synthesizer ---
    const initAudio = () => {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };

    const playCinematicSubBass = () => {
      if (!soundEnabled || !audioCtxRef.current) return;
      try {
        const ctx = audioCtxRef.current;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(45, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 3.5);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 4.0);
      } catch (e) {}
    };

    const playRibbonDrawSound = (progress) => {
      if (!soundEnabled || !audioCtxRef.current) return;
      try {
        const ctx = audioCtxRef.current;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180 + progress * 240, now);
        osc.frequency.exponentialRampToValueAtTime(220 + progress * 300, now + 0.12);
        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } catch (e) {}
    };

    const playSignatureLightSweepSound = () => {
      if (!soundEnabled || !audioCtxRef.current) return;
      try {
        const ctx = audioCtxRef.current;
        const now = ctx.currentTime;
        const notes = [440, 554.37, 659.25, 830.61, 1108.73, 1318.51];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = i % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.02, now + 2.8);
          gain.gain.setValueAtTime(0.06 / (i + 1), now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 2.8);
        });

        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(65, now);
        sub.frequency.exponentialRampToValueAtTime(28, now + 2.0);
        subGain.gain.setValueAtTime(0.22, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
        sub.connect(subGain);
        subGain.connect(ctx.destination);
        sub.start(now);
        sub.stop(now + 2.0);
      } catch (e) {}
    };

    // --- 2. Three.js Scene Setup ---
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    if (!isWebGLAvailable()) {
      setWebglFailed(true);
      return;
    }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance'
      });
    } catch (err) {
      console.warn('WebGL context creation failed:', err);
      setWebglFailed(true);
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    if (THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 11.5);
    camera.lookAt(0, 0, 0);

    // Procedural Studio Reflection Environment Map
    const generateStudioEnvironment = () => {
      const size = 512;
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size / 2;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#060608';
      ctx.fillRect(0, 0, size, size / 2);

      const g1 = ctx.createLinearGradient(0, 0, 0, size / 4);
      g1.addColorStop(0, '#ffffff');
      g1.addColorStop(0.3, '#fff4cc');
      g1.addColorStop(0.8, '#f59e0b');
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(size * 0.2, 0, size * 0.6, size / 4);

      const g2 = ctx.createRadialGradient(size * 0.85, size * 0.25, 10, size * 0.85, size * 0.25, 120);
      g2.addColorStop(0, '#ffffff');
      g2.addColorStop(0.5, '#ffd700');
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(size * 0.7, 0, size * 0.3, size / 2);

      const g3 = ctx.createRadialGradient(size * 0.15, size * 0.35, 10, size * 0.15, size * 0.35, 140);
      g3.addColorStop(0, '#f59e0b');
      g3.addColorStop(0.6, '#78350f');
      g3.addColorStop(1, 'transparent');
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, size * 0.35, size / 2);

      const texture = new THREE.CanvasTexture(c);
      texture.mapping = THREE.EquirectangularReflectionMapping;
      return texture;
    };
    const envMap = generateStudioEnvironment();
    scene.environment = envMap;

    // Studio Lights
    const keyLight = new THREE.DirectionalLight(0xfff3d0, 2.8);
    keyLight.position.set(4, 6, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 2.2);
    rimLight.position.set(-6, -3, 4);
    scene.add(rimLight);

    const bronzeFill = new THREE.DirectionalLight(0x92400e, 1.6);
    bronzeFill.position.set(0, -6, -3);
    scene.add(bronzeFill);

    const ambientLight = new THREE.AmbientLight(0x221a10, 0.8);
    scene.add(ambientLight);

    const sweepLight = new THREE.SpotLight(0xffe680, 0, 18, Math.PI / 6, 0.4, 1.2);
    sweepLight.position.set(-6, 0, 6);
    scene.add(sweepLight);
    scene.add(sweepLight.target);

    // --- 3. Materials ---
    const goldMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xf6d365),
      emissive: new THREE.Color(0x3a2205),
      metalness: 0.94,
      roughness: 0.14,
      clearcoat: 0.85,
      clearcoatRoughness: 0.1,
      reflectivity: 0.95,
      envMap: envMap,
      envMapIntensity: 1.8
    });

    const bronzeMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x92400e),
      emissive: new THREE.Color(0x200a02),
      metalness: 0.88,
      roughness: 0.28,
      clearcoat: 0.4,
      reflectivity: 0.85,
      envMap: envMap,
      envMapIntensity: 1.4
    });

    const sparkHeadMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // --- 4. Interwoven 3D Splines matching atw_logo_final.jpg ---
    const ribbonPaths = [
      // Ribbon 1: A-Leg & Peak
      [
        new THREE.Vector3(-3.25, -1.85, 0.0),
        new THREE.Vector3(-2.65, -0.45, 0.06),
        new THREE.Vector3(-2.05, 0.95, 0.12),
        new THREE.Vector3(-1.42, 2.32, 0.18),
        new THREE.Vector3(-1.08, 1.52, 0.22),
        new THREE.Vector3(-0.62, 0.52, 0.14)
      ],
      // Ribbon 2: Upper T-Bar & Grand 180° Curl into W
      [
        new THREE.Vector3(-1.12, 1.92, 0.05),
        new THREE.Vector3(0.28, 1.92, 0.05),
        new THREE.Vector3(1.68, 1.92, 0.05),
        new THREE.Vector3(2.48, 1.88, 0.0),
        new THREE.Vector3(3.08, 1.38, -0.16),
        new THREE.Vector3(2.96, 0.46, -0.22),
        new THREE.Vector3(2.46, -0.52, 0.05)
      ],
      // Ribbon 3: S-Curve Crossbar of A
      [
        new THREE.Vector3(-3.02, -0.72, 0.25),
        new THREE.Vector3(-2.22, -0.32, 0.20),
        new THREE.Vector3(-1.52, -0.12, 0.12),
        new THREE.Vector3(-0.82, 0.26, 0.06),
        new THREE.Vector3(-0.22, 0.92, 0.14),
        new THREE.Vector3(0.12, 1.52, 0.08)
      ],
      // Ribbon 4: The Flowing W
      [
        new THREE.Vector3(2.46, -0.52, 0.05),
        new THREE.Vector3(2.02, -1.36, 0.15),
        new THREE.Vector3(1.52, -1.86, 0.24),
        new THREE.Vector3(1.12, -1.32, 0.30),
        new THREE.Vector3(0.88, 0.28, 0.36),
        new THREE.Vector3(0.48, -0.82, 0.28),
        new THREE.Vector3(0.08, -1.86, 0.22),
        new THREE.Vector3(-0.42, -1.22, 0.10),
        new THREE.Vector3(-0.86, -0.36, -0.06)
      ]
    ];

    const createRibbonBand = (pathPoints, width = 0.52, thickness = 0.15) => {
      const curve = new THREE.CatmullRomCurve3(pathPoints);
      curve.curveType = 'centripetal';
      const steps = 180;
      const points = curve.getPoints(steps);
      const frames = curve.computeFrenetFrames(steps, false);

      const positions = [];
      const normals = [];
      const uvs = [];

      for (let i = 0; i <= steps; i++) {
        const p = points[i];
        const N = frames.normals[i];
        const B = frames.binormals[i];
        const u = i / steps;

        const hw = width * 0.5;
        const ht = thickness * 0.5;

        const v0 = new THREE.Vector3().copy(p).addScaledVector(B, hw).addScaledVector(N, ht);
        const v1 = new THREE.Vector3().copy(p).addScaledVector(B, -hw).addScaledVector(N, ht);
        const v2 = new THREE.Vector3().copy(p).addScaledVector(B, -hw).addScaledVector(N, -ht);
        const v3 = new THREE.Vector3().copy(p).addScaledVector(B, hw).addScaledVector(N, -ht);

        positions.push(
          v0.x, v0.y, v0.z,
          v1.x, v1.y, v1.z,
          v2.x, v2.y, v2.z,
          v3.x, v3.y, v3.z
        );

        normals.push(
          N.x, N.y, N.z,
          N.x, N.y, N.z,
          -N.x, -N.y, -N.z,
          -N.x, -N.y, -N.z
        );

        uvs.push(u, 1, u, 0, u, 0, u, 1);
      }

      const goldIndices = [];
      const bronzeIndices = [];

      for (let i = 0; i < steps; i++) {
        const base = i * 4;
        const next = (i + 1) * 4;

        goldIndices.push(base, next, next + 1);
        goldIndices.push(base, next + 1, base + 1);

        bronzeIndices.push(base + 3, next + 3, next);
        bronzeIndices.push(base + 3, next, base);

        bronzeIndices.push(base + 1, next + 1, next + 2);
        bronzeIndices.push(base + 1, next + 2, base + 2);

        bronzeIndices.push(base + 2, next + 2, next + 3);
        bronzeIndices.push(base + 2, next + 3, base + 3);
      }

      const allIndices = [...goldIndices, ...bronzeIndices];
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(allIndices);

      geometry.addGroup(0, goldIndices.length, 0);
      geometry.addGroup(goldIndices.length, bronzeIndices.length, 1);
      geometry.setDrawRange(0, 0);

      const mesh = new THREE.Mesh(geometry, [goldMaterial, bronzeMaterial]);

      const sparkGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const sparkMesh = new THREE.Mesh(sparkGeo, sparkHeadMaterial);
      sparkMesh.visible = false;
      scene.add(sparkMesh);

      return {
        mesh,
        curve,
        totalTris: allIndices.length,
        sparkMesh
      };
    };

    const ribbonObjects = ribbonPaths.map((p, idx) => {
      const band = createRibbonBand(p, idx === 0 ? 0.54 : 0.50, idx === 1 ? 0.16 : 0.14);
      scene.add(band.mesh);
      return band;
    });

    const setRibbonProgress = (band, progress) => {
      const count = Math.floor(band.totalTris * progress);
      band.mesh.geometry.setDrawRange(0, count - (count % 3));

      if (progress > 0.02 && progress < 0.98) {
        band.sparkMesh.visible = true;
        const pt = band.curve.getPointAt(Math.min(1, progress));
        band.sparkMesh.position.copy(pt);
      } else {
        band.sparkMesh.visible = false;
      }
    };

    // Flare canvas
    const flareCanvas = flareCanvasRef.current;
    let flareCtx = null;
    if (flareCanvas) {
      flareCanvas.width = width;
      flareCanvas.height = height;
      flareCtx = flareCanvas.getContext('2d');
    }

    const drawSpecularFlare = (x, intensity) => {
      if (!flareCtx) return;
      flareCtx.clearRect(0, 0, flareCanvas.width, flareCanvas.height);
      if (intensity <= 0.01) return;

      const y = flareCanvas.height * 0.5;
      const cx = (x + 4.5) / 9.0 * flareCanvas.width;

      const grad = flareCtx.createRadialGradient(cx, y, 5, cx, y, 320);
      grad.addColorStop(0, `rgba(255, 255, 230, ${intensity * 0.85})`);
      grad.addColorStop(0.2, `rgba(255, 215, 0, ${intensity * 0.45})`);
      grad.addColorStop(0.6, `rgba(217, 119, 6, ${intensity * 0.15})`);
      grad.addColorStop(1, 'transparent');
      flareCtx.fillStyle = grad;
      flareCtx.fillRect(cx - 350, y - 180, 700, 360);

      const beam = flareCtx.createLinearGradient(cx - 500, y, cx + 500, y);
      beam.addColorStop(0, 'transparent');
      beam.addColorStop(0.5, `rgba(255, 250, 200, ${intensity * 0.9})`);
      beam.addColorStop(1, 'transparent');
      flareCtx.fillStyle = beam;
      flareCtx.fillRect(cx - 500, y - 2, 1000, 4);
    };

    // --- 5. Timeline Implementation ---
    const buildTimeline = () => {
      if (timelineRef.current) timelineRef.current.kill();

      ribbonObjects.forEach(b => setRibbonProgress(b, 0));
      setShowBrand(false);
      camera.position.set(0, 0, 11.5);
      sweepLight.intensity = 0;
      drawSpecularFlare(0, 0);

      const tl = gsap.timeline({
        onComplete: () => {
          setPhaseText('Phase 6: Luxury Final Logo Hold');
          if (onComplete) onComplete();
        }
      });

      // Phase 1: Darkness (0.0s - 0.8s)
      tl.to({}, {
        duration: 0.8,
        onStart: () => {
          setPhaseText('Phase 1: Pure Darkness');
          playCinematicSubBass();
        }
      });

      // Phase 2: First ribbon emergence (0.8s - 2.2s)
      const r1 = { p: 0 };
      tl.to(r1, {
        p: 1,
        duration: 1.4,
        ease: 'power2.inOut',
        onStart: () => setPhaseText('Phase 2: First Ribbon Emergence (A-Pillar)'),
        onUpdate: () => {
          setRibbonProgress(ribbonObjects[0], r1.p);
          if (Math.random() < 0.28) playRibbonDrawSound(r1.p * 0.3);
        }
      }, 0.8);

      // Phase 3: Weaving (2.0s - 5.4s)
      const r2 = { p: 0 };
      const r3 = { p: 0 };
      const r4 = { p: 0 };

      tl.to(r2, {
        p: 1,
        duration: 1.8,
        ease: 'power2.inOut',
        onStart: () => setPhaseText('Phase 3: Interweaving 3D Monogram Ribbons'),
        onUpdate: () => {
          setRibbonProgress(ribbonObjects[1], r2.p);
          if (Math.random() < 0.25) playRibbonDrawSound(0.3 + r2.p * 0.25);
        }
      }, 2.0);

      tl.to(r3, {
        p: 1,
        duration: 1.6,
        ease: 'power2.inOut',
        onUpdate: () => {
          setRibbonProgress(ribbonObjects[2], r3.p);
          if (Math.random() < 0.25) playRibbonDrawSound(0.55 + r3.p * 0.2);
        }
      }, 2.7);

      tl.to(r4, {
        p: 1,
        duration: 2.0,
        ease: 'power2.inOut',
        onUpdate: () => {
          setRibbonProgress(ribbonObjects[3], r4.p);
          if (Math.random() < 0.25) playRibbonDrawSound(0.75 + r4.p * 0.25);
        }
      }, 3.4);

      tl.to(camera.position, { z: 10.8, duration: 3.5, ease: 'power1.out' }, 2.0);

      // Phase 4: Settle & Polish (5.4s - 6.5s)
      tl.to({}, {
        duration: 1.1,
        onStart: () => {
          setPhaseText('Phase 4: Alignment & Metallic Polish');
          ribbonObjects.forEach(b => setRibbonProgress(b, 1.0));
        }
      }, 5.4);

      // Phase 5: Light Sweep (6.5s - 7.3s)
      const sweep = { x: -5.0 };
      tl.to(sweep, {
        x: 5.0,
        duration: 0.8,
        ease: 'power1.inOut',
        onStart: () => {
          setPhaseText('Phase 5: Signature Golden Light Sweep');
          playSignatureLightSweepSound();
        },
        onUpdate: () => {
          sweepLight.position.x = sweep.x;
          sweepLight.target.position.x = sweep.x;
          sweepLight.intensity = Math.sin((sweep.x + 5.0) / 10.0 * Math.PI) * 7.5;
          const flareIntensity = Math.sin((sweep.x + 5.0) / 10.0 * Math.PI);
          drawSpecularFlare(sweep.x, flareIntensity);
        },
        onComplete: () => {
          sweepLight.intensity = 0;
          drawSpecularFlare(0, 0);
        }
      }, 6.5);

      // Phase 6: Final Logo Hold (7.3s - 8.0s+)
      tl.to({}, {
        duration: 0.7,
        onStart: () => {
          setPhaseText('Phase 6: Luxury Final Logo Hold');
          setShowBrand(true);
        }
      }, 7.3);

      timelineRef.current = tl;
      tl.restart();
    };

    initAudio();
    buildTimeline();

    // Render loop
    let animId;
    let clock = new THREE.Clock();
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      keyLight.position.x = 4 + Math.sin(elapsed * 0.6) * 0.8;
      keyLight.position.y = 6 + Math.cos(elapsed * 0.4) * 0.6;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      if (flareCanvas) {
        flareCanvas.width = w;
        flareCanvas.height = h;
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (timelineRef.current) timelineRef.current.kill();
      if (renderer) {
        renderer.dispose();
        if (container && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, [soundEnabled]);

  const replay = () => {
    if (timelineRef.current) {
      timelineRef.current.restart();
    }
  };

  if (webglFailed) {
    return (
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, #1c1917 0%, #0c0a09 60%, #000000 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f8fafc',
        fontFamily: 'Montserrat, sans-serif'
      }}>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '2rem',
              right: '2rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 700,
              padding: '0.5rem 1.1rem',
              borderRadius: '25px',
              cursor: 'pointer'
            }}
          >
            ✕ Exit
          </button>
        )}
        <div style={{
          padding: '2.5rem',
          borderRadius: '24px',
          background: 'rgba(28, 25, 23, 0.75)',
          border: '1px solid rgba(255, 215, 0, 0.35)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 40px rgba(245, 158, 11, 0.15)',
          textAlign: 'center',
          maxWidth: '460px',
          backdropFilter: 'blur(16px)'
        }}>
          <img 
            src="./logo/atw_logo.jpg" 
            alt="ATW Logo" 
            style={{
              width: '180px',
              height: '180px',
              objectFit: 'contain',
              borderRadius: '16px',
              margin: '0 auto 1.5rem',
              border: '2px solid rgba(255, 215, 0, 0.4)',
              boxShadow: '0 10px 30px rgba(217, 119, 6, 0.3)'
            }}
          />
          <h2 style={{
            fontFamily: 'Cinzel, serif',
            fontSize: '1.6rem',
            letterSpacing: '0.25em',
            background: 'linear-gradient(135deg, #ffffff 0%, #ffd700 70%, #d97706 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 0.5rem'
          }}>
            ABDUL TARIQUE WARSI
          </h2>
          <p style={{ color: '#a8a29e', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
            ATW • Cinematic Monogram (Safe 2D Mode)
          </p>
          <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginBottom: '1.8rem', lineHeight: 1.5 }}>
            Hardware WebGL acceleration is currently disabled or unavailable on this device. The 2D visual presentation is active.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: 'linear-gradient(135deg, #ffd700 0%, #d97706 100%)',
                  color: '#000000',
                  border: 'none',
                  fontWeight: 700,
                  padding: '0.65rem 1.6rem',
                  borderRadius: '30px',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                Enter System
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      minHeight: '100vh',
      background: '#000000',
      overflow: 'hidden',
      userSelect: 'none'
    }}>
      {/* 3D Canvas Mount */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />
      <canvas ref={flareCanvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10, mixBlendMode: 'screen' }} />

      {/* Anamorphic Bars */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4.5vh', background: '#000', zIndex: 20, borderBottom: '1px solid rgba(255,215,0,0.08)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4.5vh', background: '#000', zIndex: 20, borderTop: '1px solid rgba(255,215,0,0.08)' }} />

      {/* Phase Status */}
      <div style={{
        position: 'absolute',
        bottom: '6vh',
        left: '2.5rem',
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        background: 'rgba(18, 14, 10, 0.75)',
        border: '1px solid rgba(255, 215, 0, 0.25)',
        borderRadius: '20px',
        padding: '0.35rem 0.95rem',
        fontSize: '0.72rem',
        color: '#d6d3d1',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ffd700', boxShadow: '0 0 8px #ffd700' }} />
        <span>{phaseText}</span>
      </div>

      {/* Controls */}
      <div style={{
        position: 'absolute',
        top: '6vh',
        right: '2.5rem',
        display: 'flex',
        gap: '0.75rem',
        zIndex: 30
      }}>
        <button
          onClick={replay}
          style={{
            background: 'rgba(18, 14, 10, 0.8)',
            border: '1px solid rgba(255, 215, 0, 0.35)',
            color: '#ffd700',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.45rem 1.1rem',
            borderRadius: '25px',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.8)'
          }}
        >
          ▶ Replay
        </button>
        <button
          onClick={() => setSoundEnabled(prev => !prev)}
          style={{
            background: 'rgba(18, 14, 10, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#f8fafc',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.45rem 1rem',
            borderRadius: '25px',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)'
          }}
        >
          {soundEnabled ? '🔊 Audio: ON' : '🔇 Audio: OFF'}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'rgba(18, 14, 10, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#f8fafc',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.45rem 0.9rem',
              borderRadius: '25px',
              cursor: 'pointer'
            }}
          >
            ✕ Exit
          </button>
        )}
      </div>

      {/* Brand Overlay */}
      <div style={{
        position: 'absolute',
        bottom: '9vh',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.35rem',
        zIndex: 25,
        pointerEvents: 'none',
        opacity: showBrand ? 1 : 0,
        transition: 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{
          fontFamily: 'Cinzel, serif',
          fontSize: '1.6rem',
          fontWeight: 800,
          letterSpacing: '0.38em',
          background: 'linear-gradient(135deg, #ffffff 0%, #fef08a 40%, #ffd700 70%, #d97706 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 4px 25px rgba(245, 158, 11, 0.35)'
        }}>
          ABDUL TARIQUE WARSI
        </div>
        <div style={{
          fontSize: '0.72rem',
          letterSpacing: '0.3em',
          color: '#a8a29e',
          textTransform: 'uppercase',
          fontWeight: 500
        }}>
          ATW • METALLIC MONOGRAM REVEAL
        </div>
      </div>
    </div>
  );
}
