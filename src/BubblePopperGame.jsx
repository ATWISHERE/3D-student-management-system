import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';

function BubbleNode({ student, initialPos, isPresent, isAbsent, onClick }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const timeOffset = useMemo(() => Math.random() * 100, []);

  useFrame((state) => {
    if (meshRef.current) {
      if (!isPresent && !isAbsent) {
        // Floating upwards
        meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 2 + timeOffset) * 0.01 + 0.02;
        meshRef.current.position.x += Math.sin(state.clock.elapsedTime + timeOffset) * 0.01;
        if (meshRef.current.position.y > 15) {
          meshRef.current.position.y = -15; // Reset to bottom
        }
      } else if (isPresent) {
        // Pop / move to top right
        meshRef.current.position.lerp(new THREE.Vector3(10, 10, -5), 0.05);
        meshRef.current.scale.lerp(new THREE.Vector3(0, 0, 0), 0.1); // Disappear
      } else if (isAbsent) {
        // Move to bottom left
        meshRef.current.position.lerp(new THREE.Vector3(-10, -10, -5), 0.05);
        meshRef.current.scale.lerp(new THREE.Vector3(0.5, 0.5, 0.5), 0.1); 
      }
    }
  });

  if (isPresent && meshRef.current?.scale.x < 0.1) return null; // fully popped

  const materialColor = isAbsent ? '#ff4444' : (hovered ? '#ffffff' : '#88ccff');

  return (
    <group ref={meshRef} position={initialPos}>
      <mesh 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhysicalMaterial 
          color={materialColor}
          transmission={0.9}
          opacity={1}
          metalness={0.1}
          roughness={0.1}
          ior={1.5}
          thickness={0.5}
          clearcoat={1}
        />
      </mesh>
      
      <Billboard>
        <Text
          position={[0, 0, 0]}
          fontSize={0.4}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          {student.Name}
        </Text>
      </Billboard>
    </group>
  );
}

export default function BubblePopperGame({ students, attendanceData, selectedClass, selectedDate, setAttendanceStatus, markRemainingAbsent }) {
  const initialPositions = useMemo(() => {
    return students.map((_, i) => new THREE.Vector3(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20 - 5,
      (Math.random() - 0.5) * 10
    ));
  }, [students]);

  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to top, #001f3f, #0074D9)' }}>
      <Canvas camera={{ position: [0, 0, 25], fov: 50 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
        
        {students.map((student, idx) => {
          const status = attendanceData[selectedClass]?.[student.Name]?.[selectedDate];
          return (
            <BubbleNode
              key={student.Name}
              student={student}
              initialPos={initialPositions[idx]}
              isPresent={status === 'P'}
              isAbsent={status === 'A'}
              onClick={() => {
                if (status !== 'P') setAttendanceStatus(student.Name, 'P');
              }}
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
