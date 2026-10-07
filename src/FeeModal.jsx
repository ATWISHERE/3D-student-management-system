import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Environment, Text } from '@react-three/drei';
import { X, Settings } from 'lucide-react';

function InstallmentOrb({ index, isPaid, onClick, position }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Float speed={2} rotationIntensity={isPaid ? 0.5 : 2} floatIntensity={isPaid ? 0.5 : 2}>
      <group 
        position={position} 
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        <Sphere args={[1, 64, 64]} scale={hovered && !isPaid ? 1.1 : 1}>
          <MeshDistortMaterial
            color={isPaid ? "#FFD700" : "#ffffff"}
            envMapIntensity={isPaid ? 3 : 1}
            clearcoat={1} clearcoatRoughness={0}
            metalness={isPaid ? 1 : 0.1} roughness={isPaid ? 0.2 : 0}
            transmission={isPaid ? 0 : 0.9} thickness={2}
            distort={isPaid ? 0 : (hovered ? 0.4 : 0.2)} speed={isPaid ? 0 : 3}
          />
        </Sphere>
        <Text position={[0, 0, 1.1]} fontSize={0.4} color={isPaid ? "#000000" : "#997F63"} anchorX="center" anchorY="middle">
          {String(index + 1)}
        </Text>
      </group>
    </Float>
  );
}

export default function FeeModal({ student, onClose }) {
  // Feature 2: Customizable Fee Structures
  const [feeConfig, setFeeConfig] = useState(() => {
    const saved = localStorage.getItem('feeConfig');
    return saved ? JSON.parse(saved) : { count: 3, amount: 500, label: 'Installment' };
  });
  const [showConfig, setShowConfig] = useState(false);

  const [installments, setInstallments] = useState(() => {
    const saved = localStorage.getItem(`fee_${student.Name}`);
    if (saved) return JSON.parse(saved);
    return Array(feeConfig.count).fill(false);
  });

  useEffect(() => {
    localStorage.setItem(`fee_${student.Name}`, JSON.stringify(installments));
  }, [installments, student.Name]);

  useEffect(() => {
    if (installments.length !== feeConfig.count) {
       const newInst = [...installments];
       if (feeConfig.count > installments.length) {
         newInst.push(...Array(feeConfig.count - installments.length).fill(false));
       } else {
         newInst.splice(feeConfig.count);
       }
       setInstallments(newInst);
    }
  }, [feeConfig.count, installments]);

  const handleOrbClick = (index) => {
    const newInstallments = [...installments];
    newInstallments[index] = !newInstallments[index];
    setInstallments(newInstallments);
  };

  const totalPaid = installments.filter(Boolean).length;
  const totalAmountPaid = totalPaid * feeConfig.amount;
  const totalAmountDue = (feeConfig.count - totalPaid) * feeConfig.amount;

  const getOrbPosition = (index, total) => {
    if (total <= 5) {
      const spacing = 2.5;
      const startX = -((total - 1) * spacing) / 2;
      return [startX + index * spacing, 0, 0];
    } else {
      const radius = 3.5;
      const angle = (index / total) * Math.PI * 2 - Math.PI / 2; // start from top
      return [Math.cos(angle) * radius, -Math.sin(angle) * radius, 0];
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-overlay"
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }} animate={{ opacity: 1, backdropFilter: "blur(15px)" }} exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(252, 251, 250, 0.6)', zIndex: 1000,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}
      >
        <motion.div 
          className="modal-content"
          initial={{ scale: 0.8, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 50 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(153, 127, 99, 0.3)',
            borderRadius: '24px', padding: '3rem', width: '90%', maxWidth: '800px',
            boxShadow: '0 25px 50px -12px rgba(153, 127, 99, 0.25)', position: 'relative', overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button onClick={() => setShowConfig(!showConfig)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }} title="Configure Global Fee Settings">
              <Settings size={24} />
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}>
              <X size={24} />
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: showConfig ? '1rem' : '2rem' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              {student.Name || student.name}
            </h2>
            <div className="class-badge" style={{ display: 'inline-block' }}>
              {student.Class} • Sec {student.Section}
            </div>
            {!showConfig && (
              <p style={{ marginTop: '1rem', color: 'var(--text-light)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Fee Management • {totalPaid}/{feeConfig.count} Paid • Total: ₹{totalAmountPaid} • Due: <span style={{color: '#d32f2f'}}>₹{totalAmountDue}</span>
              </p>
            )}
          </div>

          <AnimatePresence>
            {showConfig && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', background: '#fcfbfa', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid #eaeaea' }}
              >
                <h3 style={{ fontFamily: 'Cormorant Garamond', color: 'var(--text-main)', marginTop: 0 }}>Fee Configuration (Global)</h3>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Number of Installments / Months</label>
                    <input type="number" min="1" max="24" value={feeConfig.count} onChange={e => {
                      const newConfig = { ...feeConfig, count: parseInt(e.target.value) || 1 };
                      setFeeConfig(newConfig);
                      localStorage.setItem('feeConfig', JSON.stringify(newConfig));
                    }} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Amount per Installment (₹)</label>
                    <input type="number" value={feeConfig.amount} onChange={e => {
                      const newConfig = { ...feeConfig, amount: parseInt(e.target.value) || 0 };
                      setFeeConfig(newConfig);
                      localStorage.setItem('feeConfig', JSON.stringify(newConfig));
                    }} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }} />
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#d32f2f', marginTop: '1rem', fontStyle: 'italic' }}>* Changing the global fee structure will apply the new total count to all students.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ height: '350px', width: '100%', position: 'relative' }}>
            <Canvas camera={{ position: [0, 0, feeConfig.count > 5 ? 10 : 6], fov: 45 }}>
              <ambientLight intensity={0.5} />
              <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color="#FFD700" />
              <Environment preset="city" />
              
              {installments.map((isPaid, idx) => (
                <InstallmentOrb 
                  key={idx} index={idx} isPaid={isPaid} 
                  position={getOrbPosition(idx, feeConfig.count)}
                  onClick={() => handleOrbClick(idx)} 
                />
              ))}
            </Canvas>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <p style={{ color: 'var(--text-accent)', fontSize: '0.85rem', fontStyle: 'italic' }}>
              Click a 3D orb to mark the {feeConfig.label} as paid or unpaid
            </p>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
