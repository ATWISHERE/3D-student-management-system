import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';

function FishObject({ student, initialPos, isPresent, isAbsent, onClick }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const timeOffset = useMemo(() => Math.random() * 100, []);

  useFrame((state) => {
    if (meshRef.current) {
      if (!isPresent && !isAbsent) {
        meshRef.current.position.x += Math.sin(state.clock.elapsedTime + timeOffset) * 0.05;
        meshRef.current.position.y += Math.cos(state.clock.elapsedTime * 0.5 + timeOffset) * 0.02;
        meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime + timeOffset) * 0.5;
      } else if (isPresent) {
        meshRef.current.position.lerp(new THREE.Vector3(0, 0, 0), 0.05);
        meshRef.current.scale.lerp(new THREE.Vector3(2, 2, 2), 0.1);
        meshRef.current.rotation.y += 0.1;
      } else if (isAbsent) {
        meshRef.current.position.lerp(new THREE.Vector3(0, -20, 0), 0.05);
      }
    }
  });

  const color = isAbsent ? '#444444' : (hovered ? '#ffaa00' : '#00aaff');

  return (
    <group position={initialPos} ref={meshRef}>
      <mesh 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
        rotation={[0, 0, -Math.PI / 2]}
      >
        <coneGeometry args={[0.8, 3, 4]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
      </mesh>
      <Billboard>
        <Text position={[0, -2, 0]} fontSize={0.5} color="#ffffff" outlineWidth={0.05} outlineColor="#000000">{student.Name}</Text>
      </Billboard>
    </group>
  );
}

export default function SpaceAquariumGame({ students, attendanceData, selectedClass, selectedDate, setAttendanceStatus, markRemainingAbsent }) {
  const initialPositions = useMemo(() => students.map(() => new THREE.Vector3((Math.random() - 0.5) * 25, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 10)), [students]);

  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to bottom, #001122, #004466)' }}>
      <Canvas camera={{ position: [0, 0, 30], fov: 60 }}>
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#88aaff" />
        {students.map((student, idx) => {
          const status = attendanceData[selectedClass]?.[student.Name]?.[selectedDate];
          return (
            <FishObject
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
