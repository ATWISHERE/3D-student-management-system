import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';

function StarObject({ student, initialPos, isPresent, isAbsent, onClick }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  useFrame(() => {
    if (meshRef.current) {
      if (!isPresent && !isAbsent) {
        meshRef.current.position.y -= 0.05; // falling
        meshRef.current.rotation.y += 0.02;
        meshRef.current.rotation.x += 0.01;
        if (meshRef.current.position.y < -15) {
          meshRef.current.position.y = 15; // wrap to top
        }
      } else if (isPresent) {
        meshRef.current.position.lerp(new THREE.Vector3(0, 10, -10), 0.05);
        meshRef.current.scale.lerp(new THREE.Vector3(0, 0, 0), 0.1);
      } else if (isAbsent) {
        meshRef.current.position.lerp(new THREE.Vector3(0, -15, -10), 0.05);
        meshRef.current.scale.lerp(new THREE.Vector3(0.5, 0.5, 0.5), 0.1);
      }
    }
  });

  const materialColor = isAbsent ? '#ff4444' : (hovered ? '#ffffff' : '#ffd700');

  return (
    <group ref={meshRef} position={initialPos}>
      <mesh 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={materialColor} emissive={materialColor} emissiveIntensity={hovered ? 1 : 0.5} roughness={0.2} metalness={0.8} />
      </mesh>
      <Billboard>
        <Text position={[0, -1.5, 0]} fontSize={0.5} color="#ffffff" outlineWidth={0.05} outlineColor="#000000">{student.Name}</Text>
      </Billboard>
    </group>
  );
}

export default function FallingStarsGame({ students, attendanceData, selectedClass, selectedDate, setAttendanceStatus, markRemainingAbsent }) {
  const initialPositions = useMemo(() => students.map(() => new THREE.Vector3((Math.random() - 0.5) * 30, Math.random() * 20 + 5, (Math.random() - 0.5) * 10)), [students]);

  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to bottom, #050510, #1a0520)' }}>
      <Canvas camera={{ position: [0, 0, 30], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
        {students.map((student, idx) => {
          const status = attendanceData[selectedClass]?.[student.Name]?.[selectedDate];
          return (
            <StarObject
              key={student.Name} student={student} initialPos={initialPositions[idx]}
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
