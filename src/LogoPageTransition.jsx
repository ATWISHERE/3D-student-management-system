import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * World-Class Logo Page Transition Component
 * Color Palette: Obsidian Black, Polished Gold, Warm Espresso Brown, Pure White
 */
export default function LogoPageTransition({ 
  isActive, 
  targetPage = 'Attendance System',
  previousPage = 'Student Directory',
  onComplete,
  duration = 900 // Snappy, professional duration
}) {
  const [phase, setPhase] = useState('entering'); // 'entering' | 'holding' | 'revealing'

  useEffect(() => {
    if (!isActive) return;

    setPhase('entering');
    
    // Play subtle zero-lag audio if available
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        
        // Gentle cinematic swoosh rise
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.35);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);

        // Soft metallic chime at peak
        setTimeout(() => {
          try {
            const chime = ctx.createOscillator();
            const chimeGain = ctx.createGain();
            chime.type = 'triangle';
            chime.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            chimeGain.gain.setValueAtTime(0.05, ctx.currentTime);
            chimeGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
            chime.connect(chimeGain);
            chimeGain.connect(ctx.destination);
            chime.start();
            chime.stop(ctx.currentTime + 0.6);
          } catch {}
        }, 220);
      }
    } catch {}

    const holdTimer = setTimeout(() => {
      setPhase('revealing');
    }, duration * 0.45);

    const finishTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(finishTimer);
    };
  }, [isActive, duration, onComplete]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28, ease: 'easeInOut' }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99999,
          pointerEvents: 'all',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 50% 48%, rgba(24, 18, 12, 0.98) 0%, rgba(10, 8, 6, 0.99) 55%, #030303 100%)',
          backdropFilter: 'blur(28px)',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Ambient Golden Radial Glow */}
        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.16) 0%, rgba(217, 119, 6, 0.06) 45%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(40px)',
          transform: phase === 'revealing' ? 'scale(1.3)' : 'scale(1)',
          transition: 'transform 0.5s ease-out'
        }} />

        {/* Central Monogram Logo Medallion with Perimeter Tracing Light */}
        <motion.div
          initial={{ scale: 0.75, opacity: 0, y: 15 }}
          animate={{ 
            scale: phase === 'revealing' ? 1.08 : 1, 
            opacity: phase === 'revealing' ? 0.9 : 1, 
            y: 0 
          }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative',
            width: '160px',
            height: '160px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.4rem'
          }}
        >
          {/* Outer Squircle Ring with Animated Conic Gold Sweep */}
          <div style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '40px',
            background: 'conic-gradient(from 0deg, #d97706, #ffd700, #ffffff, #d97706, #78350f, #d97706)',
            filter: 'blur(3px)',
            opacity: 0.85,
            animation: 'rotateConic 2s linear infinite'
          }} />

          {/* Squircle Badge Backdrop */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: '36px',
            background: 'radial-gradient(circle at 35% 30%, #1e1915 0%, #0d0b09 70%, #050403 100%)',
            border: '1.5px solid rgba(255, 215, 0, 0.35)',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.85), inset 0 1px 2px rgba(255, 255, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            {/* The ATW Pure Ribbon Logo */}
            <img 
              src="./logo/atw_logo.jpg" 
              alt="ATW Logo" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '34px'
              }}
              onError={(e) => {
                // Fallback to vector badge if static asset isn't resolved in local dev
                e.target.style.display = 'none';
              }}
            />

            {/* Specular Light Sweep Shimmer across Logo */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '200%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent 20%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 215, 0, 0.35) 60%, transparent 80%)',
              transform: 'skewX(-25deg)',
              animation: 'logoShimmer 1.1s ease-in-out forwards'
            }} />
          </div>
        </motion.div>

        {/* Cinematic Navigation Breadcrumb Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.35 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.35rem',
            textAlign: 'center'
          }}
        >
          {/* Brand Identity Header */}
          <div style={{
            fontSize: '0.72rem',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: '#ffd700',
            fontWeight: 700,
            fontFamily: 'Montserrat, sans-serif',
            textShadow: '0 0 12px rgba(245, 158, 11, 0.5)'
          }}>
            ATW ACADEMY
          </div>

          {/* Navigation Transition Indicator */}
          <div style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            color: '#f8fafc',
            fontFamily: 'Montserrat, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem'
          }}>
            <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>{previousPage}</span>
            <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>➔</span>
            <span style={{ 
              background: 'linear-gradient(135deg, #ffffff 0%, #fef08a 50%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {targetPage}
            </span>
          </div>

          {/* High-Precision Progress Micro-Bar */}
          <div style={{
            width: '180px',
            height: '3px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            overflow: 'hidden',
            marginTop: '0.65rem'
          }}>
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: duration / 1000, ease: [0.16, 1, 0.3, 1] }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #d97706, #fbbf24, #ffffff)',
                boxShadow: '0 0 8px rgba(251, 191, 36, 0.7)'
              }}
            />
          </div>
        </motion.div>

        {/* Global Keyframes for Conic Rotation and Shimmer */}
        <style>{`
          @keyframes rotateConic {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes logoShimmer {
            0% { transform: translateX(-100%) skewX(-25deg); }
            100% { transform: translateX(100%) skewX(-25deg); }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}
