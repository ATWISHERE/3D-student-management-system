import React, { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Environment, Sparkles, Text } from '@react-three/drei';
import * as THREE from 'three';


export function Interactive3DShapes() {
  const groupRef = useRef();
  const { viewport } = useThree();

  useFrame(() => {
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const offset = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, offset * Math.PI * 2, 0.05);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, offset * 5, 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Top right bronze/metallic liquid bubble */}
      <Float speed={1.5} rotationIntensity={2} floatIntensity={2} position={[viewport.width / 4, 1, -2]}>
        <Sphere args={[1.5, 32, 32]}>
          <MeshDistortMaterial color="#997F63" envMapIntensity={1} clearcoat={1} clearcoatRoughness={0.1} metalness={0.9} roughness={0.1} distort={0.25} speed={1.8} />
        </Sphere>
      </Float>

      {/* Top left pearl/white metallic bubble */}
      <Float speed={2} rotationIntensity={1} floatIntensity={1} position={[-viewport.width / 4, -2, -5]}>
        <Sphere args={[2, 32, 32]}>
          <MeshDistortMaterial color="#f4f1eb" envMapIntensity={2} clearcoat={1} clearcoatRoughness={0} metalness={0.5} roughness={0.2} distort={0.18} speed={1.4} />
        </Sphere>
      </Float>
      
      {/* Mid glass / crystal refractive bubble */}
      <Float speed={1} rotationIntensity={3} floatIntensity={3} position={[0, -viewport.height * 0.8, -3]}>
        <Sphere args={[1.2, 32, 32]}>
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.6} metalness={0.1} roughness={0.1} clearcoat={1} clearcoatRoughness={0.05} />
        </Sphere>
      </Float>

      {/* Secondary bronze floating accent for deeper scroll */}
      <Float speed={1.8} rotationIntensity={1.5} floatIntensity={2} position={[viewport.width / 3.5, -viewport.height * 1.6, -4]}>
        <Sphere args={[1.4, 32, 32]}>
          <MeshDistortMaterial color="#997F63" envMapIntensity={1.5} clearcoat={1} clearcoatRoughness={0.1} metalness={0.85} roughness={0.15} distort={0.22} speed={1.6} />
        </Sphere>
      </Float>

      {/* Secondary pearl floating bubble for deeper scroll */}
      <Float speed={2.2} rotationIntensity={1.2} floatIntensity={1.8} position={[-viewport.width / 3.5, -viewport.height * 2.2, -5]}>
        <Sphere args={[1.7, 32, 32]}>
          <MeshDistortMaterial color="#f4f1eb" envMapIntensity={2} clearcoat={1} clearcoatRoughness={0} metalness={0.5} roughness={0.2} distort={0.18} speed={1.4} />
        </Sphere>
      </Float>
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
