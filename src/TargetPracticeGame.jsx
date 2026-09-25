import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';

function TargetObject({ student, index, total, isPresent, isAbsent, onClick }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const timeOffset = useMemo(() => Math.random() * 100, []);

  // Arrange targets in a semi-circle or grid
  const initialPos = useMemo(() => {
    const cols = Math.ceil(Math.sqrt(total));
    const row = Math.floor(index / cols);
    const col = index % cols;
    return new THREE.Vector3((col - cols/2 + 0.5) * 4, (cols/2 - row - 0.5) * 4, (Math.random() - 0.5) * 5);
  }, [index, total]);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,256,256);
    ctx.beginPath(); ctx.arc(128,128,120,0,Math.PI*2); ctx.fillStyle = '#f00'; ctx.fill();
    ctx.beginPath(); ctx.arc(128,128,80,0,Math.PI*2); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.beginPath(); ctx.arc(128,128,40,0,Math.PI*2); ctx.fillStyle = '#f00'; ctx.fill();
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      if (!isPresent && !isAbsent) {
        meshRef.current.position.y = initialPos.y + Math.sin(state.clock.elapsedTime * 2 + timeOffset) * 0.5;
        meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2 + timeOffset) * 0.2;
      } else if (isPresent) {
        meshRef.current.rotation.y += 0.2; // spin wildly when hit
        meshRef.current.scale.lerp(new THREE.Vector3(0, 0, 0), 0.1);
      } else if (isAbsent) {
        meshRef.current.position.lerp(new THREE.Vector3(initialPos.x, -20, initialPos.z), 0.05); // fall down
      }
    }
  });

  return (
    <group position={initialPos} ref={meshRef}>
      <mesh 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'crosshair'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[1.5, 1.5, 0.2, 32]} />
        <meshStandardMaterial color={isAbsent ? '#555555' : (hovered ? '#ffaaaa' : '#ffffff')} map={texture} roughness={0.5} />
      </mesh>
      <Billboard>
        <Text position={[0, -2, 0]} fontSize={0.6} color="#ffffff" outlineWidth={0.05} outlineColor="#000000">{student.Name}</Text>
      </Billboard>
    </group>
  );
}

export default function TargetPracticeGame({ students, attendanceData, selectedClass, selectedDate, setAttendanceStatus, markRemainingAbsent }) {
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to bottom, #2e3b4e, #1a2530)' }}>
      <Canvas camera={{ position: [0, 0, 25], fov: 60 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[0, 10, 10]} intensity={1.5} />
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
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
      <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', zIndex: 10 }}>
        <button onClick={markRemainingAbsent} style={{ background: 'rgba(255, 50, 50, 0.8)', color: '#fff', border: '1px solid rgba(255,100,100,0.8)', padding: '0.8rem 1.2rem', borderRadius: '25px', fontFamily: 'Cormorant Garamond', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 0 15px rgba(255, 50, 50, 0.4)' }}>
          Finish Game (Mark Absent)
        </button>
      </div>
    </div>
  );
}
