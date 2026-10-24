import React from 'react';

export default function ATWLogo({ size = 26, showText = true, isDark = true }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', userSelect: 'none' }}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 64 64" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: isDark ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.45))' : 'drop-shadow(0 2px 4px rgba(153, 127, 99, 0.25))' }}
      >
        <defs>
          <linearGradient id={`atwGold_${isDark}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id={`atwBg_${isDark}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? "#0a0e1a" : "#ffffff"} />
            <stop offset="100%" stopColor={isDark ? "#1e293b" : "#f4f1eb"} />
          </linearGradient>
          <linearGradient id={`atwCyan_${isDark}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>

        {/* Shield Hexagon */}
        <polygon 
          points="32,3 58,18 58,46 32,61 6,46 6,18" 
          fill={`url(#atwBg_${isDark})`} 
          stroke={`url(#atwGold_${isDark})`} 
          strokeWidth="2.5" 
        />
        
        {/* Inner Cyan Border */}
        <polygon 
          points="32,8 53,20 53,44 32,56 11,44 11,20" 
          fill="none" 
          stroke={`url(#atwCyan_${isDark})`} 
          strokeWidth="1" 
          opacity="0.65" 
        />

        {/* Top Star Accent */}
        <polygon 
          points="32,10 33.5,14 37.5,14.5 34.5,17 35.5,21 32,19 28.5,21 29.5,17 26.5,14.5 30.5,14" 
          fill="#fbbf24" 
        />

        {/* ATW Monogram */}
        <text 
          x="32" 
          y="42" 
          fontFamily="'Montserrat', 'Arial Black', sans-serif" 
          fontWeight="900" 
          fontSize="20" 
          fill={`url(#atwGold_${isDark})`} 
          textAnchor="middle" 
          letterSpacing="1"
        >
          ATW
        </text>

        {/* Horizontal Accent */}
        <rect x="22" y="47" width="20" height="2" rx="1" fill={`url(#atwCyan_${isDark})`} opacity="0.9" />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{ 
            fontFamily: 'Montserrat, sans-serif', 
            fontWeight: 800, 
            fontSize: '0.85rem', 
            letterSpacing: '0.08em',
            color: isDark ? '#fff' : 'var(--text-main)' 
          }}>
            ATW
          </span>
          <span style={{ 
            fontSize: '0.62rem', 
            letterSpacing: '0.12em', 
            color: isDark ? '#94a3b8' : 'var(--text-accent)',
            textTransform: 'uppercase'
          }}>
            MANAGEMENT
          </span>
        </div>
      )}
    </div>
  );
}
