import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Billboard, Sparkles, Trail } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

function StarObject({ student, initialPos, isPresent, isAbsent, onClick }) {
  const groupRef = useRef();
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const fallSpeed = useMemo(() => 0.01 + Math.random() * 0.015, []); // Slowed down significantly!
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      if (!isPresent && !isAbsent) {
        groupRef.current.position.y -= fallSpeed; // falling slowly
        if (meshRef.current) {
          meshRef.current.rotation.y += delta;
          meshRef.current.rotation.x += delta * 0.5;
        }
        if (groupRef.current.position.y < -15) {
          groupRef.current.position.y = 15; // wrap to top
        }
      } else if (isPresent) {
        groupRef.current.position.lerp(new THREE.Vector3(0, 15, -10), 0.05); // fly away up
        groupRef.current.scale.lerp(new THREE.Vector3(0, 0, 0), 0.1);
      } else if (isAbsent) {
        groupRef.current.position.lerp(new THREE.Vector3(0, -20, -10), 0.05); // fall away down
        groupRef.current.scale.lerp(new THREE.Vector3(0.3, 0.3, 0.3), 0.1);
      }
    }
  });

  const materialColor = isAbsent ? '#ff2222' : (hovered ? '#ffffff' : '#ffd700');
  const emissiveIntensity = hovered ? 2 : (isAbsent ? 0.5 : 1);

  return (
    <group 
      ref={groupRef} 
      position={initialPos}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
    >
      {/* Invisible enlarged hit target for easy clicking */}
      <mesh>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <Trail width={0.5} length={4} color={materialColor} attenuation={(t) => t * t}>
        <mesh ref={meshRef}>
          <octahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial 
            color={materialColor} 
            emissive={materialColor} 
            emissiveIntensity={emissiveIntensity} 
            roughness={0.1} 
            metalness={0.9} 
          />
        </mesh>
      </Trail>
      
      {/* Added localized sparkles for magic effect */}
      {!isPresent && !isAbsent && (
        <Sparkles count={5} scale={1.5} size={2} color={materialColor} speed={0.4} />
      )}

      <Billboard position={[0, -1.2, 0]}>
        <Text fontSize={0.4} color="#ffffff" outlineWidth={0.05} outlineColor="#000000" fontWeight="bold">
          {student.Name}
        </Text>
        {student.Class && (
          <Text position={[0, -0.4, 0]} fontSize={0.22} color="#ffdd88" outlineWidth={0.03} outlineColor="#000000">
            {`${student.Class} ${student.Section || ''}`.trim()}
          </Text>
        )}
      </Billboard>
    </group>
  );
}

export default function FallingStarsGame({ students, attendanceData, selectedClass, selectedClasses, selectedDate, setAttendanceStatus, onToggleAttendance, markRemainingAbsent }) {
  const toggleAttendance = setAttendanceStatus || onToggleAttendance;
  const initialPositions = useMemo(() => students.map(() => new THREE.Vector3((Math.random() - 0.5) * 30, Math.random() * 30 + 5, (Math.random() - 0.5) * 10)), [students]);

  const getStudentClass = (s) => (s.Class ? `${s.Class} ${s.Section || ''}`.trim() : selectedClass);

  return (
    <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at bottom, #2b003b 0%, #050510 100%)' }}>
      <Canvas camera={{ position: [0, 0, 30], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
        <Sparkles count={200} scale={40} size={1} color="#aaaaff" opacity={0.2} speed={0.1} />

        {students.map((student, idx) => {
          const studentClass = getStudentClass(student);
          const status = attendanceData[studentClass]?.[student.Name]?.[selectedDate];
          return (
            <StarObject
              key={`${studentClass}_${student.Name}_${idx}`}
              student={student} 
              initialPos={initialPositions[idx]}
              isPresent={status === 'P'} 
              isAbsent={status === 'A'}
              onClick={() => { if (toggleAttendance && status !== 'P') toggleAttendance(student.Name, 'P', studentClass); }}
            />
          );
        })}
        
        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} intensity={2.0} radius={0.8} />
        </EffectComposer>

        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  );
}
