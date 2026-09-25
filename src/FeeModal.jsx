import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Environment, Text } from '@react-three/drei';
import { X, Check } from 'lucide-react';

function InstallmentOrb({ index, isPaid, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Float speed={2} rotationIntensity={isPaid ? 0.5 : 2} floatIntensity={isPaid ? 0.5 : 2}>
      <group 
        position={[(index - 1) * 2.5, 0, 0]} 
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        <Sphere args={[1, 64, 64]} scale={hovered && !isPaid ? 1.1 : 1}>
          <MeshDistortMaterial
            color={isPaid ? "#FFD700" : "#ffffff"}
            envMapIntensity={isPaid ? 3 : 1}
            clearcoat={1}
            clearcoatRoughness={0}
            metalness={isPaid ? 1 : 0.1}
            roughness={isPaid ? 0.2 : 0}
            transmission={isPaid ? 0 : 0.9} // Glassy if unpaid
            thickness={2}
            distort={isPaid ? 0 : (hovered ? 0.4 : 0.2)}
            speed={isPaid ? 0 : 3}
          />
        </Sphere>
        <Text
          position={[0, 0, 1.1]}
          fontSize={0.4}
          color={isPaid ? "#000000" : "#997F63"}
          anchorX="center"
          anchorY="middle"
        >
          {String(index + 1)}
        </Text>
      </group>
    </Float>
  );
}

export default function FeeModal({ student, onClose }) {
  // Mock data for installments (In a real app, this would be saved in student object/excel)
  const [installments, setInstallments] = useState([
    student.Installment1 === 'Paid' || false,
    student.Installment2 === 'Paid' || false,
    student.Installment3 === 'Paid' || false,
  ]);

  const handleOrbClick = (index) => {
    const newInstallments = [...installments];
    newInstallments[index] = !newInstallments[index];
    setInstallments(newInstallments);
    // Here you would normally also update the main students array and trigger an Excel save
  };

  const totalPaid = installments.filter(Boolean).length;

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-overlay"
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
        animate={{ opacity: 1, backdropFilter: "blur(15px)" }}
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(252, 251, 250, 0.6)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <motion.div 
          className="modal-content"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            border: '1px solid rgba(153, 127, 99, 0.3)',
            borderRadius: '24px',
            padding: '3rem',
            width: '90%',
            maxWidth: '600px',
            boxShadow: '0 25px 50px -12px rgba(153, 127, 99, 0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <button 
            onClick={onClose}
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}
          >
            <X size={24} />
          </button>

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              {student.Name || student.name}
            </h2>
            <div className="class-badge" style={{ display: 'inline-block' }}>
              {student.Class} • Sec {student.Section}
            </div>
            <p style={{ marginTop: '1rem', color: 'var(--text-light)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Fee Management • {totalPaid}/3 Paid
            </p>
          </div>

          <div style={{ height: '250px', width: '100%', position: 'relative' }}>
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
              <ambientLight intensity={0.5} />
              <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color="#FFD700" />
              <Environment preset="city" />
              
              {installments.map((isPaid, idx) => (
                <InstallmentOrb 
                  key={idx} 
                  index={idx} 
                  isPaid={isPaid} 
                  onClick={() => handleOrbClick(idx)} 
                />
              ))}
            </Canvas>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <p style={{ color: 'var(--text-accent)', fontSize: '0.85rem', fontStyle: 'italic' }}>
              Click a 3D orb to toggle installment payment
            </p>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
