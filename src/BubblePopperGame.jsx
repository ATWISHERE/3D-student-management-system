import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import SafeCanvas from './components/SafeCanvas';
import { OrbitControls, Text, Billboard, Sparkles, Float, MeshDistortMaterial } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

function BubbleNode({ student, initialPos, isPresent, isAbsent, onClick, ecoMode }) {
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
    <group 
      ref={groupRef} 
      position={initialPos}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
    >
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[1.2, 24, 24]} />
          {ecoMode ? (
            <meshStandardMaterial 
              color={materialColor}
              emissive={emissiveColor}
              emissiveIntensity={hovered ? 0.8 : 0.25}
              transparent
              opacity={0.7}
              roughness={0.2}
              metalness={0.4}
            />
          ) : (
            <MeshDistortMaterial 
              color={materialColor}
              emissive={emissiveColor}
              emissiveIntensity={hovered ? 1 : 0.2}
              transparent
              opacity={0.7}
              distort={0.25}
              speed={1.8}
              roughness={0.1}
              metalness={0.5}
              clearcoat={1}
              clearcoatRoughness={0.1}
            />
          )}
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
        {student.Class && (
          <Text
            position={[0, -0.4, 0]}
            fontSize={0.25}
            color="#aaddff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="#000000"
          >
            {`${student.Class} ${student.Section || ''}`.trim()}
          </Text>
        )}
      </Billboard>
    </group>
  );
}

export default function BubblePopperGame({ students, attendanceData, selectedClass, selectedClasses, selectedDate, setAttendanceStatus, onToggleAttendance, markRemainingAbsent, ecoMode = true }) {
  const toggleAttendance = setAttendanceStatus || onToggleAttendance;
  const initialPositions = useMemo(() => {
    return students.map((_, i) => new THREE.Vector3(
      (Math.random() - 0.5) * 25,
      (Math.random() - 0.5) * 25 - 5,
      (Math.random() - 0.5) * 10
    ));
  }, [students]);

  const getStudentClass = (s) => (s.Class ? `${s.Class} ${s.Section || ''}`.trim() : selectedClass);

  return (
    <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at center, #004e92 0%, #000428 100%)' }}>
      <SafeCanvas 
        camera={{ position: [0, 0, 25], fov: 50 }}
        dpr={ecoMode ? 1 : [1, 1.5]}
        gl={{ powerPreference: 'high-performance', antialias: !ecoMode }}
        fallback={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#e2e8f0', textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🫧</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#38bdf8', marginBottom: '0.5rem' }}>3D Bubble Popper Requires WebGL</div>
            <div style={{ maxWidth: '420px', fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Your browser or hardware currently has WebGL disabled. You can still use the <strong>Festive Firecrackers</strong> mode for full interactive attendance with smooth 2D graphics!
            </div>
          </div>
        }
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 10]} intensity={3} color="#aaccff" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#ff00ff" />
        
        {/* Magical Environment Sparkles */}
        <Sparkles count={ecoMode ? 80 : 300} scale={30} size={3} speed={0.4} opacity={0.25} color="#88ccff" />

        {students.map((student, idx) => {
          const studentClass = getStudentClass(student);
          const status = attendanceData[studentClass]?.[student.Name]?.[selectedDate];
          return (
            <BubbleNode
              key={`${studentClass}_${student.Name}_${idx}`}
              student={student}
              initialPos={initialPositions[idx]}
              isPresent={status === 'P'}
              isAbsent={status === 'A'}
              ecoMode={ecoMode}
              onClick={() => {
                if (toggleAttendance && status !== 'P') toggleAttendance(student.Name, 'P', studentClass);
              }}
            />
          );
        })}
        
        {!ecoMode && (
          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.5} radius={0.8} />
          </EffectComposer>
        )}
        
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </SafeCanvas>
    </div>
  );
}
