import React, { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Environment, Sparkles, Text } from '@react-three/drei';
import * as THREE from 'three';

function SectionBubble({ section, index, total, isActive, onClick }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Position bubbles in an arc or circle
  const angle = (index / total) * Math.PI * 2;
  const radius = 3;
  const targetPosition = new THREE.Vector3(
    Math.cos(angle) * radius,
    isActive ? 1 : 0, // pop up if active
    Math.sin(angle) * radius - 2 // set back a bit
  );

  useFrame((state, delta) => {
    // Smoothly interpolate position and scale
    meshRef.current.position.lerp(targetPosition, 0.05);
    const scale = isActive ? 1.5 : (hovered ? 1.2 : 1);
    meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
  });

  return (
    <Float speed={2} rotationIntensity={hovered ? 2 : 1} floatIntensity={isActive ? 0 : 2}>
      <group ref={meshRef} 
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        <Sphere args={[0.8, 64, 64]}>
          <MeshDistortMaterial
            color={isActive ? "#997F63" : "#f4f1eb"}
            envMapIntensity={isActive ? 2 : 1}
            clearcoat={1}
            clearcoatRoughness={0}
            metalness={isActive ? 0.8 : 0.5}
            roughness={0.2}
            distort={isActive ? 0.4 : (hovered ? 0.3 : 0.1)}
            speed={isActive ? 3 : 1}
          />
        </Sphere>
        <Text
          position={[0, 0, 1.2]}
          fontSize={0.5}
          color={isActive ? "#ffffff" : "#997F63"}
          anchorX="center"
          anchorY="middle"
        >
          {String(section)}
        </Text>
      </group>
    </Float>
  );
}

export function Interactive3DShapes({ availableSections = [], activeSection, setActiveSection }) {
  const groupRef = useRef();
  const { viewport } = useThree();
  
  // Filter out 'All' for the bubbles if we only want actual sections
  const actualSections = availableSections.filter(s => s !== 'All');

  useFrame(() => {
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const offset = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    
    if (groupRef.current) {
      // If we have section bubbles, don't rotate them wildly, just subtly shift
      if (actualSections.length > 0) {
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, offset * Math.PI, 0.05);
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, offset * 2, 0.05);
      } else {
        // Original chaotic rotation when no sections are active
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, offset * Math.PI * 2, 0.05);
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, offset * 5, 0.05);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {actualSections.length > 0 ? (
        // Render Section Bubbles
        actualSections.map((sec, idx) => (
          <SectionBubble 
            key={sec} 
            section={sec} 
            index={idx} 
            total={actualSections.length} 
            isActive={activeSection === sec}
            onClick={() => setActiveSection && setActiveSection(activeSection === sec ? 'All' : sec)}
          />
        ))
      ) : (
        // Default Decorative Bubbles
        <>
          <Float speed={1.5} rotationIntensity={2} floatIntensity={2} position={[viewport.width / 4, 1, -2]}>
            <Sphere args={[1.5, 64, 64]}>
              <MeshDistortMaterial color="#997F63" envMapIntensity={1} clearcoat={1} clearcoatRoughness={0.1} metalness={0.9} roughness={0.1} distort={0.3} speed={2} />
            </Sphere>
          </Float>

          <Float speed={2} rotationIntensity={1} floatIntensity={1} position={[-viewport.width / 4, -2, -5]}>
            <Sphere args={[2, 64, 64]}>
              <MeshDistortMaterial color="#f4f1eb" envMapIntensity={2} clearcoat={1} clearcoatRoughness={0} metalness={0.5} roughness={0.2} distort={0.2} speed={1.5} />
            </Sphere>
          </Float>
          
          <Float speed={1} rotationIntensity={3} floatIntensity={3} position={[0, -viewport.height, -3]}>
             <Sphere args={[1.2, 64, 64]}>
              <meshPhysicalMaterial color="#ffffff" transmission={1} opacity={1} metalness={0} roughness={0} ior={1.5} thickness={2} specularIntensity={1} specularColor="#997F63" />
            </Sphere>
          </Float>
        </>
      )}
    </group>
  );
}

export default function ThreeScene(props) {
  return (
    <>
      <color attach="background" args={['#Fcfbfa']} />
      <ambientLight intensity={0.8} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color="#997F63" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      <Environment preset="city" />
      <Sparkles count={100} scale={12} size={1} speed={0.4} opacity={0.3} color="#997F63" />
      <Interactive3DShapes {...props} />
    </>
  );
}
