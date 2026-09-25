import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Billboard, Sparkles, Float, MeshDistortMaterial } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

function BubbleNode({ student, initialPos, isPresent, isAbsent, onClick }) {
  const groupRef = useRef();
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const timeOffset = useMemo(() => Math.random() * 100, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      if (!isPresent && !isAbsent) {
        // Floating upwards gracefully
        groupRef.current.position.y += delta * 1.5;
        groupRef.current.position.x += Math.sin(state.clock.elapsedTime * 0.5 + timeOffset) * 0.02;
        if (groupRef.current.position.y > 15) {
          groupRef.current.position.y = -15; // Reset to bottom
        }
      } else if (isPresent) {
        // Pop / move to top right
        groupRef.current.position.lerp(new THREE.Vector3(15, 15, -5), 0.08);
        groupRef.current.scale.lerp(new THREE.Vector3(0, 0, 0), 0.15); 
      } else if (isAbsent) {
        // Move to bottom left
        groupRef.current.position.lerp(new THREE.Vector3(-15, -15, -5), 0.08);
        groupRef.current.scale.lerp(new THREE.Vector3(0.5, 0.5, 0.5), 0.1); 
      }
    }
  });

  if (isPresent && groupRef.current?.scale.x < 0.1) return null; // fully popped

  const materialColor = isAbsent ? '#ff2222' : (hovered ? '#ffffff' : '#00bfff');
  const emissiveColor = isAbsent ? '#440000' : (hovered ? '#66ccff' : '#003366');

  return (
    <group ref={groupRef} position={initialPos}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh 
          ref={meshRef}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
        >
          <sphereGeometry args={[1.2, 64, 64]} />
          <MeshDistortMaterial 
            color={materialColor}
            emissive={emissiveColor}
            emissiveIntensity={hovered ? 1 : 0.2}
            transparent
            opacity={0.7}
            distort={0.3}
            speed={2}
            roughness={0.1}
            metalness={0.5}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </mesh>
      </Float>
      
      {/* Moved Billboard Forward to Prevent Hiding Behind Bubble */}
      <Billboard position={[0, 0, 1.5]}>
        <Text
          fontSize={0.45}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.06}
          outlineColor="#000000"
          fontWeight="bold"
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
      (Math.random() - 0.5) * 25,
      (Math.random() - 0.5) * 25 - 5,
      (Math.random() - 0.5) * 10
    ));
  }, [students]);

  return (
    <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at center, #004e92 0%, #000428 100%)' }}>
      <Canvas camera={{ position: [0, 0, 25], fov: 50 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 10]} intensity={3} color="#aaccff" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#ff00ff" />
        
        {/* Magical Environment Sparkles */}
        <Sparkles count={300} scale={30} size={3} speed={0.5} opacity={0.3} color="#88ccff" />

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
        
        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.5} radius={0.8} />
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
