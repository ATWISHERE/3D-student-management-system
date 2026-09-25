import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Billboard, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

function TargetObject({ student, index, total, isPresent, isAbsent, onClick }) {
  const meshRef = useRef();
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const timeOffset = useMemo(() => Math.random() * 100, []);

  const initialPos = useMemo(() => {
    const cols = Math.ceil(Math.sqrt(total));
    const row = Math.floor(index / cols);
    const col = index % cols;
    return new THREE.Vector3((col - cols/2 + 0.5) * 5, (cols/2 - row - 0.5) * 5, (Math.random() - 0.5) * 5);
  }, [index, total]);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Background transparent
    ctx.clearRect(0,0,512,512);
    
    // Draw concentric glowing rings
    const drawRing = (radius, color) => {
      ctx.beginPath(); ctx.arc(256, 256, radius, 0, Math.PI*2);
      ctx.fillStyle = color; ctx.fill();
    };

    drawRing(240, '#ff1111');
    drawRing(160, '#ffffff');
    drawRing(80, '#ff1111');
    
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current && meshRef.current) {
      if (!isPresent && !isAbsent) {
        groupRef.current.position.y = initialPos.y + Math.sin(state.clock.elapsedTime * 2 + timeOffset) * 0.5;
        // Face the camera perfectly
        meshRef.current.rotation.x = Math.PI / 2; 
        meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5 + timeOffset) * 0.1; 
      } else if (isPresent) {
        meshRef.current.rotation.z += delta * 15; // spin wildly when hit
        groupRef.current.scale.lerp(new THREE.Vector3(0, 0, 0), 0.1);
      } else if (isAbsent) {
        groupRef.current.position.lerp(new THREE.Vector3(initialPos.x, -25, initialPos.z), 0.05); // fall down
      }
    }
  });

  const emissiveColor = isAbsent ? '#220000' : (hovered ? '#ff5555' : '#ff0000');

  return (
    <group position={initialPos} ref={groupRef}>
      <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
        <mesh 
          ref={meshRef}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'crosshair'; }}
          onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[1.5, 1.5, 0.2, 64]} />
          <meshStandardMaterial 
            color={isAbsent ? '#444444' : '#ffffff'} 
            emissive={emissiveColor}
            emissiveIntensity={hovered ? 2 : 0.8}
            map={texture} 
            roughness={0.2} 
            metalness={0.6}
          />
        </mesh>
      </Float>
      <Billboard position={[0, -2.2, 0]}>
        <Text fontSize={0.6} color="#ffffff" outlineWidth={0.06} outlineColor="#000000" fontWeight="bold">
          {student.Name}
        </Text>
      </Billboard>
    </group>
  );
}

export default function TargetPracticeGame({ students, attendanceData, selectedClass, selectedDate, setAttendanceStatus, markRemainingAbsent }) {
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to bottom, #111827, #030712)' }}>
      <Canvas camera={{ position: [0, 0, 30], fov: 60 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[0, 10, 10]} intensity={2} color="#ffffff" />
        <spotLight position={[0, 0, 20]} angle={0.5} penumbra={1} intensity={2} color="#ff3333" />

        {students.map((student, idx) => {
          const status = attendanceData[selectedClass]?.[student.Name]?.[selectedDate];
          return (
            <TargetObject
              key={student.Name} student={student} index={idx} total={students.length}
              isPresent={status === 'P'} isAbsent={status === 'A'}
              onClick={() => { if (status !== 'P') setAttendanceStatus(student.Name, 'P'); }}
            />
          );
        })}
        
        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0.3} luminanceSmoothing={0.9} intensity={2.5} radius={0.8} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>

        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
      <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', zIndex: 10 }}>
        <button onClick={markRemainingAbsent} style={{ background: 'rgba(255, 50, 50, 0.9)', color: '#fff', border: '1px solid rgba(255,150,150,0.8)', padding: '1rem 2rem', borderRadius: '30px', fontFamily: 'Cormorant Garamond', fontSize: '1.2rem', cursor: 'pointer', boxShadow: '0 0 25px rgba(255, 50, 50, 0.6)', transition: 'transform 0.2s', fontWeight: 'bold' }} onMouseOver={e => e.target.style.transform='scale(1.05)'} onMouseOut={e => e.target.style.transform='scale(1)'}>
          Finish Game (Mark Absent)
        </button>
      </div>
    </div>
  );
}
