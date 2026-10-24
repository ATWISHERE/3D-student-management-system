import React, { useRef, useState, useMemo, useEffect } from 'react';
import { 
  playFirecrackerLaunch, 
  playFirecrackerBurst, 
  playClickSound, 
  playAbsentSound 
} from './utils/soundEffects';

// 40+ Authentic, High-Contrast Distinct Firecracker Colors with Curated Effects
export const FIRECRACKER_COLORS = [
  { name: 'Imperial Golden Willow', hex: '#ffd700', text: '#ffffff', type: 'willow' },
  { name: 'Electric Cyan Chrysanthemum', hex: '#00f5ff', text: '#ffffff', type: 'peony' },
  { name: 'Ruby Peony', hex: '#f43f5e', text: '#ffffff', type: 'peony' },
  { name: 'Dragon Emerald Spark', hex: '#10b981', text: '#ffffff', type: 'willow' },
  { name: 'Royal Amethyst Dahlia', hex: '#a855f7', text: '#ffffff', type: 'peony' },
  { name: 'Solar Flare Orange', hex: '#ff5722', text: '#ffffff', type: 'willow' },
  { name: 'Deep Sapphire Sky', hex: '#0284c7', text: '#ffffff', type: 'peony' },
  { name: 'Radiant Fuchsia Blossom', hex: '#ff007f', text: '#ffffff', type: 'peony' },
  { name: 'Tiger Tail Amber', hex: '#f59e0b', text: '#000000', type: 'willow' },
  { name: 'Glacial Ice Turquoise', hex: '#06b6d4', text: '#ffffff', type: 'peony' },
  { name: 'Neon Lime Starburst', hex: '#84cc16', text: '#000000', type: 'peony' },
  { name: 'Twilight Purple Comet', hex: '#8b5cf6', text: '#ffffff', type: 'willow' },
  { name: 'Coral Palm Flare', hex: '#fb7185', text: '#ffffff', type: 'peony' },
  { name: 'Marigold Sunburst', hex: '#eab308', text: '#000000', type: 'willow' },
  { name: 'Cobalt Strobe', hex: '#3b82f6', text: '#ffffff', type: 'peony' },
  { name: 'Rose Gold Shimmer', hex: '#f472b6', text: '#ffffff', type: 'willow' },
  { name: 'Jade Waterfall', hex: '#22c55e', text: '#ffffff', type: 'willow' },
  { name: 'Electric Indigo Ray', hex: '#6366f1', text: '#ffffff', type: 'peony' },
  { name: 'Phoenix Fire Orange', hex: '#ea580c', text: '#ffffff', type: 'willow' },
  { name: 'Lagoon Aurora Teal', hex: '#14b8a6', text: '#ffffff', type: 'peony' },
  { name: 'Crimson Velvet Willow', hex: '#e11d48', text: '#ffffff', type: 'willow' },
  { name: 'Champagne Sparkle', hex: '#fef08a', text: '#000000', type: 'willow' },
  { name: 'Cerulean Splash', hex: '#0ea5e9', text: '#ffffff', type: 'peony' },
  { name: 'Ultra Magenta Flash', hex: '#d946ef', text: '#ffffff', type: 'peony' },
  { name: 'Golden Honey Brocade', hex: '#d97706', text: '#ffffff', type: 'willow' },
  { name: 'Mint Glaze Star', hex: '#34d399', text: '#000000', type: 'peony' },
  { name: 'Electric Violet Meteor', hex: '#9333ea', text: '#ffffff', type: 'willow' },
  { name: 'Blood Orange Cascade', hex: '#dc2626', text: '#ffffff', type: 'willow' },
  { name: 'Aqua Marine Wave', hex: '#38bdf8', text: '#000000', type: 'peony' },
  { name: 'Lemon Zing Sparkler', hex: '#facc15', text: '#000000', type: 'peony' },
  { name: 'Orchid Dream', hex: '#c084fc', text: '#ffffff', type: 'willow' },
  { name: 'Forest Jade Fountain', hex: '#059669', text: '#ffffff', type: 'willow' },
  { name: 'Flamingo Pink Ring', hex: '#ec4899', text: '#ffffff', type: 'peony' },
  { name: 'Sunset Bronze Tail', hex: '#b45309', text: '#ffffff', type: 'willow' },
  { name: 'Deep Sea Cyan', hex: '#0891b2', text: '#ffffff', type: 'peony' },
  { name: 'Radiant Lavender Burst', hex: '#a78bfa', text: '#ffffff', type: 'willow' },
  { name: 'Scarlet Dragon Blaze', hex: '#b91c1c', text: '#ffffff', type: 'willow' },
  { name: 'Electric Spring Bud', hex: '#4ade80', text: '#000000', type: 'peony' },
  { name: 'Persian Blue Comet', hex: '#2563eb', text: '#ffffff', type: 'willow' },
  { name: 'Copper Starlight', hex: '#c2410c', text: '#ffffff', type: 'willow' },
  { name: 'Crystal Platinum Spark', hex: '#e2e8f0', text: '#000000', type: 'peony' }
];

export function getStudentFirecrackerColor(index) {
  // Golden ratio stepping modulo 40 ensures adjacent students always receive contrasting complementary colors
  const goldenIndex = (index * 13) % FIRECRACKER_COLORS.length;
  return FIRECRACKER_COLORS[goldenIndex];
}

// 2D High-Performance Ascending Rocket Class (Optimized with zero heap churn)
class CanvasRocket {
  constructor(startX, startY, targetX, targetY, color, student, onApex) {
    this.x = startX;
    this.y = startY;
    this.prevX = startX;
    this.prevY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.color = color;
    this.student = student;
    this.onApex = onApex;
    this.alive = true;

    const dx = targetX - startX;
    const dy = targetY - startY;
    const distance = Math.hypot(dx, dy);
    this.angle = Math.atan2(dy, dx);
    this.speed = Math.max(9, distance / 32);
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
  }

  update() {
    this.prevX = this.x;
    this.prevY = this.y;
    this.x += this.vx;
    this.y += this.vy;

    // Check if reached apex altitude
    if (this.y <= this.targetY) {
      this.alive = false;
      this.onApex(this.x, this.y, this.color, this.student);
    }
  }

  draw(ctx) {
    // Continuous streak trail without heap array allocations
    ctx.strokeStyle = this.color.hex;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(this.prevX - this.vx * 1.6, this.prevY - this.vy * 1.6);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    // Glowing Rocket Head
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3.5, 0, 6.2831853);
    ctx.fill();
  }
}

// 2D Ultra-Fast Spark Particle Class (Eliminates 30,000+ ctx.save/restore calls & array allocations)
class CanvasSpark {
  constructor(x, y, colorHex, type = 'spark', isUltraLight = false) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.color = colorHex;
    this.type = type; // 'spark', 'willow', 'crackler'
    this.alpha = 1;
    this.alive = true;
    this.isUltraLight = isUltraLight;

    const angle = Math.random() * 6.2831853; // 2 * PI
    const speed = type === 'willow' 
      ? (1.8 + Math.random() * 4.6) 
      : (type === 'crackler' ? (2.4 + Math.random() * 5.8) : (2.2 + Math.random() * 8.4));

    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.gravity = type === 'willow' ? 0.08 : 0.055;
    this.drag = type === 'willow' ? 0.965 : 0.955;
    this.decay = type === 'willow' 
      ? (0.007 + Math.random() * 0.009) 
      : (0.013 + Math.random() * 0.015);
    
    // In ultra-light mode, boost particle radius so fewer particles look just as rich and dense
    const baseSize = isUltraLight ? 2.5 : 1.9;
    this.size = type === 'willow' ? baseSize + 0.5 : (type === 'crackler' ? baseSize : (baseSize + Math.random() * 1.4));
    this.flicker = Math.random() > 0.45;
  }

  update() {
    this.prevX = this.x;
    this.prevY = this.y;

    this.vx *= this.drag;
    this.vy = (this.vy * this.drag) + this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;

    if (this.alpha <= 0) {
      this.alive = false;
    }
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    const currentAlpha = this.flicker && Math.random() < 0.2 ? this.alpha * 0.4 : this.alpha;
    
    // Fast comet streak - ZERO save/restore, ZERO object allocations
    ctx.globalAlpha = currentAlpha;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.size;
    ctx.beginPath();
    ctx.moveTo(this.prevX, this.prevY);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    // Hot blinding white core for high intensity
    if (this.alpha > 0.55) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 0.45, 0, 6.2831853);
      ctx.fill();
    }
  }
}

// 2D Instant Shockwave Flash Ring
class CanvasShockwave {
  constructor(x, y, colorHex) {
    this.x = x;
    this.y = y;
    this.color = colorHex;
    this.radius = 4;
    this.maxRadius = 65;
    this.alpha = 1;
    this.alive = true;
  }

  update() {
    this.radius += 5.5;
    this.alpha -= 0.06;
    if (this.alpha <= 0 || this.radius >= this.maxRadius) {
      this.alive = false;
    }
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.globalAlpha = this.alpha * 0.85;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 6.2831853);
    ctx.stroke();

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(1, this.radius - 3), 0, 6.2831853);
    ctx.stroke();
  }
}

// 2D Glowing Celebration Student Banner
class CanvasCelebrationBanner {
  constructor(x, y, student, color, isUltraLight = false) {
    this.x = x;
    this.y = y;
    this.student = student;
    this.color = color;
    this.alpha = 1;
    this.alive = true;
    this.age = 0;
    this.isUltraLight = isUltraLight;
  }

  update() {
    this.age++;
    if (this.age > 150) {
      this.alpha -= 0.025;
      if (this.alpha <= 0) this.alive = false;
    }
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);

    // Centered text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // In ultra-light mode, avoid heavy blur filters which stutter on mobile Canvas 2D
    if (!this.isUltraLight) {
      ctx.shadowColor = this.color.hex;
      ctx.shadowBlur = 14;
    } else {
      ctx.shadowBlur = 0;
    }

    // Glowing Student Name
    ctx.font = 'bold 24px Montserrat, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.student.Name, this.x, this.y - 12);

    ctx.shadowBlur = 0;
    // Firecracker Effect Title
    ctx.font = '600 13px Montserrat, sans-serif';
    ctx.fillStyle = this.color.hex;
    ctx.fillText(`✨ ${this.color.name}`, this.x, this.y + 14);

    // Class & Status
    if (this.student.Class) {
      ctx.font = '500 11px Montserrat, sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`${this.student.Class} ${this.student.Section || ''} • PRESENT ✓`.trim(), this.x, this.y + 32);
    }

    ctx.restore();
  }
}

// Animated Character Component: Boy who bends down and ignites the firecracker bomb
function BoyBombIgniter({ action, activeStudent, studentColor }) {
  const isBending = action === 'bending' || action === 'igniting';
  const isIgniting = action === 'igniting';
  const isWatching = action === 'watching';

  return (
    <div style={{
      position: 'absolute',
      bottom: '0.8rem',
      right: '1rem',
      width: '240px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      zIndex: 25,
      userSelect: 'none',
      willChange: 'transform',
      transform: 'translateZ(0)'
    }}>
      {/* Speech Dialogue Bubble */}
      <div style={{
        background: 'rgba(15, 20, 38, 0.94)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: '16px',
        padding: '0.45rem 0.75rem',
        fontSize: '0.74rem',
        color: '#f8fafc',
        textAlign: 'center',
        lineHeight: 1.35,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        marginBottom: '0.4rem',
        maxWidth: '220px',
        transition: 'all 0.25s ease'
      }}>
        {isBending || isIgniting ? (
          <span style={{ color: '#ffd700', fontWeight: 700 }}>
            🔥 Lighting {activeStudent ? activeStudent.Name : ''}'s bomb!
          </span>
        ) : isWatching ? (
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>
            🚀 Go {activeStudent ? activeStudent.Name : ''}! Look up!
          </span>
        ) : (
          <span>👉 <b>Tap or touch your name</b> to ignite your rocket!</span>
        )}
      </div>

      {/* Interactive Animated SVG Scene with Boy Bending and Igniting Firecracker Bomb */}
      <svg width="210" height="175" viewBox="0 0 210 175" fill="none" style={{ overflow: 'visible' }}>
        <defs>
          <filter id="emberGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ground Surface Shadow */}
        <ellipse cx="105" cy="165" rx="90" ry="10" fill="rgba(0,0,0,0.5)" />

        {/* Ground Firecracker Bomb (Anar / Pot Rocket) */}
        <g id="firecrackerBomb">
          <ellipse cx="60" cy="164" rx="22" ry="6" fill="rgba(0,0,0,0.6)" />
          <path 
            d="M 45 162 L 53 130 L 67 130 L 75 162 Z" 
            fill={studentColor ? studentColor.hex : "#dc2626"} 
            stroke="#fbbf24" 
            strokeWidth="1.5" 
          />
          <path d="M 48 152 L 72 152" stroke="#fbbf24" strokeWidth="2" />
          <path d="M 51 140 L 69 140" stroke="#fef08a" strokeWidth="1.5" />
          <polygon points="56,130 60,118 64,130" fill="#f59e0b" />
          <path d="M 60 120 Q 56 112 50 114" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Sizzling Fuse Flame & Sparks when Igniting */}
          {isIgniting && (
            <g transform="translate(50, 114)">
              <circle cx="0" cy="0" r="4.5" fill="#ffffff" filter="url(#emberGlow)" />
              <circle cx="0" cy="0" r="7" fill="#ffaa00" opacity="0.8" />
              <circle cx="-3" cy="-4" r="1.5" fill="#ffd700" />
              <circle cx="4" cy="-5" r="1.5" fill="#ff4400" />
              <circle cx="-5" cy="2" r="1" fill="#ffff00" />
              <circle cx="3" cy="4" r="1.5" fill="#ff7700" />
            </g>
          )}
        </g>

        {/* Animated Boy Character */}
        <g 
          id="boyCharacter"
          style={{
            transformOrigin: '120px 160px',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: isBending 
              ? 'translate(-14px, 4px) scale(0.98)' 
              : (isWatching ? 'translate(8px, -2px) scale(1.02)' : 'none')
          }}
        >
          {/* Legs & Shoes */}
          <g id="boyLegs">
            <path 
              d={isBending ? "M 112 138 L 102 152 L 96 166" : "M 114 136 L 110 152 L 108 166"} 
              stroke="#1e293b" 
              strokeWidth="9" 
              strokeLinecap="round" 
              fill="none" 
            />
            <ellipse cx={isBending ? "93" : "105"} cy="166" rx="8" ry="4.5" fill="#0f172a" />

            <path 
              d={isBending ? "M 126 138 L 132 152 L 136 166" : "M 128 136 L 130 152 L 130 166"} 
              stroke="#1e293b" 
              strokeWidth="9" 
              strokeLinecap="round" 
              fill="none" 
            />
            <ellipse cx={isBending ? "138" : "131"} cy="166" rx="8" ry="4.5" fill="#0f172a" />
          </g>

          {/* Upper Body (Bends forward when lighting bomb!) */}
          <g 
            id="boyUpperBody"
            style={{
              transformOrigin: '120px 136px',
              transition: 'transform 0.28s cubic-bezier(0.34, 1.3, 0.64, 1)',
              transform: isBending 
                ? 'rotate(34deg) translate(-2px, 2px)' 
                : (isWatching ? 'rotate(-12deg) translate(2px, -3px)' : 'rotate(0deg)')
            }}
          >
            {/* Torso / Festive Kurta */}
            <path d="M 108 100 L 132 100 L 130 138 L 110 138 Z" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
            <path d="M 116 100 L 120 114 L 124 100" stroke="#f59e0b" strokeWidth="2.5" fill="none" />

            {/* Left Arm (Balancing arm) */}
            <path 
              d={isBending ? "M 130 106 L 144 116 L 140 128" : (isWatching ? "M 130 106 L 145 92 L 152 78" : "M 130 106 L 140 120 L 138 132")} 
              stroke="#2563eb" 
              strokeWidth="7" 
              strokeLinecap="round" 
              fill="none" 
            />
            <circle cx={isBending ? "140" : (isWatching ? "152" : "138")} cy={isBending ? "128" : (isWatching ? "78" : "132")} r="4" fill="#fcd34d" />

            {/* Head & Face */}
            <g 
              id="boyHead"
              style={{
                transformOrigin: '120px 92px',
                transition: 'transform 0.28s ease',
                transform: isBending 
                  ? 'rotate(8deg) translate(-3px, 2px)' 
                  : (isWatching ? 'rotate(-20deg) translate(0px, -4px)' : 'rotate(0deg)')
              }}
            >
              <rect x="117" y="90" width="6" height="12" fill="#fcd34d" />
              <circle cx="120" cy="80" r="15" fill="#fcd34d" />
              <path d="M 105 76 Q 120 60 135 76 Q 128 66 120 66 Q 112 66 105 76 Z" fill="#b91c1c" />
              <polygon points="120,58 123,66 117,66" fill="#f59e0b" />

              {/* Eyes */}
              {isWatching ? (
                <>
                  <circle cx="115" cy="76" r="2.2" fill="#0f172a" />
                  <circle cx="125" cy="76" r="2.2" fill="#0f172a" />
                  <circle cx="116" cy="75" r="0.8" fill="#ffffff" />
                  <circle cx="126" cy="75" r="0.8" fill="#ffffff" />
                </>
              ) : (
                <>
                  <circle cx={isBending ? "114" : "115"} cy="78" r="2" fill="#0f172a" />
                  <circle cx={isBending ? "123" : "124"} cy="78" r="2" fill="#0f172a" />
                </>
              )}

              {/* Smile */}
              <path 
                d={isWatching ? "M 115 85 Q 120 90 125 85" : "M 116 84 Q 120 88 124 84"} 
                stroke="#991b1b" 
                strokeWidth="2" 
                strokeLinecap="round" 
                fill="none" 
              />
            </g>

            {/* Right Arm: Holding the Incense Stick (Bends down to touch fuse!) */}
            <g id="igniterArm">
              <path 
                d={isBending 
                  ? "M 110 106 L 90 122 L 68 128" 
                  : (isWatching ? "M 110 106 L 95 94 L 85 82" : "M 110 106 L 96 118 L 86 130")
                } 
                stroke="#2563eb" 
                strokeWidth="7" 
                strokeLinecap="round" 
                fill="none" 
              />
              <circle cx={isBending ? "66" : (isWatching ? "85" : "85")} cy={isBending ? "128" : (isWatching ? "82" : "130")} r="4" fill="#fcd34d" />

              {/* Incense Stick reaching down to touch the bomb fuse */}
              <line 
                x1={isBending ? "66" : (isWatching ? "85" : "85")} 
                y1={isBending ? "128" : (isWatching ? "82" : "130")} 
                x2={isBending ? "52" : (isWatching ? "75" : "66")} 
                y2={isBending ? "116" : (isWatching ? "68" : "132")} 
                stroke="#78350f" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
              />

              {/* Glowing Ember Spark at the tip of the stick */}
              <circle 
                cx={isBending ? "51" : (isWatching ? "74" : "65")} 
                cy={isBending ? "115" : (isWatching ? "67" : "132")} 
                r={isBending ? "4.5" : "3"} 
                fill="#ff5500" 
                filter="url(#emberGlow)" 
              />
              <circle 
                cx={isBending ? "51" : (isWatching ? "74" : "65")} 
                cy={isBending ? "115" : (isWatching ? "67" : "132")} 
                r="1.8" 
                fill="#ffffaa" 
              />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}

export default function FallingStarsGame({ 
  students = [], 
  attendanceData = {}, 
  selectedClass, 
  selectedClasses = [], 
  selectedDate, 
  setAttendanceStatus, 
  onToggleAttendance, 
  markRemainingAbsent, 
  ecoMode = false 
}) {
  const toggleAttendance = setAttendanceStatus || onToggleAttendance;

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Simulation collections
  const rocketsRef = useRef([]);
  const sparksRef = useRef([]);
  const shockwavesRef = useRef([]);
  const bannersRef = useRef([]);

  // UI state
  const [boyAction, setBoyAction] = useState('idle'); // 'idle' | 'bending' | 'igniting' | 'watching'
  const [activeStudent, setActiveStudent] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [filterMode, setFilterMode] = useState('unmarked'); // 'all', 'unmarked', 'present', 'absent'

  // Dedicated Ultra-Light Fast Mode state (stored in localStorage & synced with ecoMode)
  const [ultraLightMode, setUltraLightMode] = useState(() => {
    try {
      const saved = localStorage.getItem('festive_ultra_light');
      return saved !== null ? saved === 'true' : ecoMode;
    } catch {
      return ecoMode;
    }
  });

  const effectiveUltraLight = ultraLightMode || ecoMode;

  const toggleUltraLight = () => {
    setUltraLightMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem('festive_ultra_light', String(next));
      } catch {}
      return next;
    });
  };

  const getStudentClass = (s) => (s.Class ? `${s.Class} ${s.Section || ''}`.trim() : selectedClass);

  // Persistent sky positions for students marked present
  const presentLanterns = useMemo(() => {
    const list = [];
    students.forEach((student, idx) => {
      const cls = getStudentClass(student);
      const status = attendanceData[cls]?.[student.Name]?.[selectedDate];
      if (status === 'P') {
        const color = getStudentFirecrackerColor(idx);
        // Deterministic sky coordinates
        const cols = Math.ceil(Math.sqrt(Math.max(1, students.length))) + 1;
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        list.push({
          student,
          idx,
          color,
          gridCol: col,
          gridRow: row
        });
      }
    });
    return list;
  }, [students, attendanceData, selectedDate, selectedClass]);

  // Main 2D Animation Loop (Optimized for smooth 60 FPS on any device)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    let animationFrameId;

    const handleResize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        canvas.width = Math.floor(rect.width);
        canvas.height = Math.floor(rect.height);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      // 1. Semi-transparent black clear to produce natural long-exposure glowing comet trails!
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(6, 8, 20, 0.22)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Additive Blending ('lighter') for blinding fireworks glow!
      ctx.globalCompositeOperation = 'lighter';

      // Update & Draw Rockets (In-place zero-allocation loop)
      const rockets = rocketsRef.current;
      let rAlive = 0;
      for (let i = 0; i < rockets.length; i++) {
        const r = rockets[i];
        r.update();
        if (r.alive) {
          r.draw(ctx);
          rockets[rAlive++] = r;
        }
      }
      rockets.length = rAlive;

      // Update & Draw Shockwaves (In-place zero-allocation loop)
      const shockwaves = shockwavesRef.current;
      let swAlive = 0;
      for (let i = 0; i < shockwaves.length; i++) {
        const sw = shockwaves[i];
        sw.update();
        if (sw.alive) {
          sw.draw(ctx);
          shockwaves[swAlive++] = sw;
        }
      }
      shockwaves.length = swAlive;

      // Update & Draw Sparks (In-place zero-allocation loop - buttery smooth 60 FPS)
      const sparks = sparksRef.current;
      let sAlive = 0;
      for (let i = 0; i < sparks.length; i++) {
        const s = sparks[i];
        s.update();
        if (s.alive) {
          s.draw(ctx);
          sparks[sAlive++] = s;
        }
      }
      sparks.length = sAlive;

      // 3. Normal Blending for Celebration Typography Banners
      ctx.globalCompositeOperation = 'source-over';
      const banners = bannersRef.current;
      let bAlive = 0;
      for (let i = 0; i < banners.length; i++) {
        const b = banners[i];
        b.update();
        if (b.alive) {
          b.draw(ctx);
          banners[bAlive++] = b;
        }
      }
      banners.length = bAlive;

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Launch Firecracker for a Student
  const handleLaunch = (student, index) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const studentClass = getStudentClass(student);
    const color = getStudentFirecrackerColor(index);

    // 1. Boy bends down towards the bomb
    setBoyAction('bending');
    setActiveStudent(student);

    // 2. Fuse touches and ignites
    setTimeout(() => {
      setBoyAction('igniting');
      playFirecrackerLaunch();

      // Launch coordinates: From the bomb on ground
      const startX = canvas.width - 150;
      const startY = canvas.height - 110;

      // Target apex: Random pleasant sky location
      const targetX = canvas.width * 0.12 + Math.random() * (canvas.width * 0.65);
      const targetY = canvas.height * 0.14 + Math.random() * (canvas.height * 0.38);

      // 3. Boy steps back watching up as rocket ascends
      setTimeout(() => {
        setBoyAction('watching');
      }, 160);

      const onApex = (apexX, apexY, rocketColor, rocketStudent) => {
        // Audio: Deep boom & crackle
        playFirecrackerBurst();

        // Shockwave flash ring
        shockwavesRef.current.push(new CanvasShockwave(apexX, apexY, rocketColor.hex));

        // High-Density Sparks: Ultra-Light uses 160 high-impact sparks; standard uses 360
        const sparkCount = effectiveUltraLight ? 160 : 360;
        for (let i = 0; i < sparkCount; i++) {
          const rand = Math.random();
          const type = rand < 0.65 ? 'spark' : (rand < 0.90 ? 'willow' : 'crackler');
          sparksRef.current.push(new CanvasSpark(apexX, apexY, rocketColor.hex, type, effectiveUltraLight));
        }

        // Radiant Celebration Banner
        bannersRef.current.push(new CanvasCelebrationBanner(apexX, apexY, rocketStudent, rocketColor, effectiveUltraLight));

        // Mark Present
        if (toggleAttendance) {
          toggleAttendance(rocketStudent.Name, 'P', studentClass);
        }

        // Return boy to idle after fireworks burst settles
        setTimeout(() => {
          setBoyAction('idle');
          setActiveStudent(null);
        }, 1800);
      };

      rocketsRef.current.push(new CanvasRocket(startX, startY, targetX, targetY, color, student, onApex));
    }, 280);
  };

  // Launch Next Unmarked Student
  const handleLaunchNext = () => {
    const unmarked = students.filter(s => {
      const cls = getStudentClass(s);
      const st = attendanceData[cls]?.[s.Name]?.[selectedDate];
      return st !== 'P' && st !== 'A';
    });

    if (unmarked.length > 0) {
      const nextStudent = unmarked[0];
      const origIdx = students.findIndex(s => s.Name === nextStudent.Name);
      handleLaunch(nextStudent, origIdx >= 0 ? origIdx : 0);
    }
  };

  // Filter students for bottom tray
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const cls = getStudentClass(s);
      const status = attendanceData[cls]?.[s.Name]?.[selectedDate];
      
      const matchesSearch = s.Name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (s.IdentifierValue && String(s.IdentifierValue).toLowerCase().includes(searchFilter.toLowerCase()));
      
      if (!matchesSearch) return false;
      if (filterMode === 'unmarked') return status !== 'P' && status !== 'A';
      if (filterMode === 'present') return status === 'P';
      if (filterMode === 'absent') return status === 'A';
      return true;
    });
  }, [students, attendanceData, selectedDate, searchFilter, filterMode]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative', 
        background: 'radial-gradient(circle at 75% 85%, #180d28 0%, #070914 60%, #020308 100%)', 
        overflow: 'hidden' 
      }}
    >
      {/* High-Performance 2D Fireworks Canvas */}
      <canvas 
        ref={canvasRef} 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          display: 'block' 
        }} 
      />

      {/* Top Floating Badge with Ultra-Light Turbo Mode Toggle */}
      <div style={{
        position: 'absolute',
        top: '0.8rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.7rem',
        background: 'rgba(10, 15, 35, 0.92)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(255, 255, 255, 0.16)',
        padding: '0.35rem 0.95rem 0.35rem 1.25rem',
        borderRadius: '30px',
        color: '#f8fafc',
        fontSize: '0.85rem',
        fontFamily: 'Montserrat, sans-serif',
        zIndex: 20,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        pointerEvents: 'auto'
      }}>
        <span>🎆 <b>Festive Firecrackers</b></span>

        {/* Dedicated Ultra-Light Fast Mode Toggle */}
        <button
          onClick={toggleUltraLight}
          title={effectiveUltraLight ? "Ultra-Light Mode Active (60 FPS on any device)" : "Click to activate Ultra-Light Fast Mode"}
          style={{
            background: effectiveUltraLight ? 'rgba(16, 185, 129, 0.28)' : 'rgba(255, 255, 255, 0.1)',
            border: effectiveUltraLight ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.2)',
            color: effectiveUltraLight ? '#34d399' : '#cbd5e1',
            borderRadius: '20px',
            padding: '0.2rem 0.6rem',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.32rem',
            transition: 'all 0.2s ease',
            boxShadow: effectiveUltraLight ? '0 0 10px rgba(16, 185, 129, 0.3)' : 'none'
          }}
        >
          <span>⚡</span>
          <span>{effectiveUltraLight ? 'Ultra-Light: ON' : 'Fast Mode'}</span>
        </button>
      </div>

      {/* Persistent Night Sky Lanterns for All Marked Students */}
      <div style={{
        position: 'absolute',
        top: '3.8rem',
        left: '1.5rem',
        right: '18rem',
        height: 'calc(100% - 17rem)',
        pointerEvents: 'none',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1.2rem',
        alignContent: 'flex-start',
        overflow: 'hidden'
      }}>
        {presentLanterns.map(({ student, color }) => (
          <div
            key={student.Name}
            onClick={() => {
              const cls = getStudentClass(student);
              if (toggleAttendance) toggleAttendance(student.Name, '', cls);
            }}
            title={`${student.Name} (Present) - Click to unmark`}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(10, 15, 30, 0.7)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${color.hex}`,
              boxShadow: `0 0 12px ${color.hex}66`,
              padding: '0.25rem 0.65rem',
              borderRadius: '20px',
              cursor: 'pointer',
              userSelect: 'none',
              animation: 'floatLantern 3s ease-in-out infinite alternate'
            }}
          >
            {/* Glowing Lantern Bulb */}
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: color.hex,
              boxShadow: `0 0 8px ${color.hex}`
            }} />
            <span style={{ fontSize: '0.74rem', color: '#ffffff', fontWeight: 600 }}>
              {student.Name}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#10b981' }}>✓</span>
          </div>
        ))}
      </div>

      {/* Bottom-Right Animated Boy who bends down and ignites the firecracker bomb */}
      <BoyBombIgniter 
        action={boyAction} 
        activeStudent={activeStudent} 
        studentColor={activeStudent ? getStudentFirecrackerColor(students.findIndex(s => s.Name === activeStudent.Name)) : null} 
      />

      {/* Bottom Student Palette & Launcher Dock */}
      <div style={{
        position: 'absolute',
        bottom: '0.8rem',
        left: '1rem',
        width: 'calc(100% - 17.5rem)',
        maxHeight: '190px',
        background: 'rgba(10, 15, 30, 0.94)',
        backdropFilter: 'blur(18px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: '20px',
        padding: '0.7rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.55rem',
        zIndex: 25,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.65)'
      }}>
        {/* Controls Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: '0.6rem' }}>
          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginRight: '0.2rem' }}>
              Palette:
            </span>
            {['unmarked', 'all', 'present', 'absent'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilterMode(tab)}
                style={{
                  background: filterMode === tab ? '#38bdf8' : 'rgba(255,255,255,0.08)',
                  color: filterMode === tab ? '#0a0e1a' : '#cbd5e1',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <input 
            type="text" 
            placeholder="Search student or roll..." 
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              color: '#ffffff',
              fontSize: '0.75rem',
              padding: '0.22rem 0.65rem',
              outline: 'none',
              width: '180px'
            }}
          />

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <button
              onClick={handleLaunchNext}
              title="Ignite firecracker for the next unmarked student"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                padding: '0.28rem 0.85rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 0 12px rgba(245, 158, 11, 0.45)'
              }}
            >
              <span>🚀 Fire Next</span>
            </button>
            <button
              onClick={() => {
                if (markRemainingAbsent) markRemainingAbsent();
                playAbsentSound();
              }}
              title="Mark remaining students absent"
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '14px',
                padding: '0.28rem 0.65rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Remaining Absent
            </button>
          </div>
        </div>

        {/* Scrollable Student Name & Unique Color Badges */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.38rem',
          maxHeight: '135px',
          overflowY: 'auto',
          paddingRight: '0.4rem',
          scrollbarWidth: 'thin'
        }}>
          {filteredStudents.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontStyle: 'italic', padding: '0.5rem' }}>
              No students match this filter.
            </div>
          ) : (
            filteredStudents.map((student) => {
              const origIdx = students.findIndex(s => s.Name === student.Name);
              const color = getStudentFirecrackerColor(origIdx >= 0 ? origIdx : 0);
              const studentClass = getStudentClass(student);
              const status = attendanceData[studentClass]?.[student.Name]?.[selectedDate];
              const isPresent = status === 'P';
              const isAbsent = status === 'A';

              return (
                <div
                  key={`${student.Name}_${origIdx}`}
                  onClick={() => {
                    if (isPresent) {
                      if (toggleAttendance) toggleAttendance(student.Name, '', studentClass);
                      playClickSound();
                    } else {
                      handleLaunch(student, origIdx);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (toggleAttendance) {
                      toggleAttendance(student.Name, isAbsent ? '' : 'A', studentClass);
                      playAbsentSound();
                    }
                  }}
                  title={`Left click: Launch ${color.name} (Present) | Right click: Mark Absent`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.38rem',
                    background: isPresent 
                      ? 'rgba(16, 185, 129, 0.24)' 
                      : (isAbsent ? 'rgba(239, 68, 68, 0.24)' : 'rgba(255, 255, 255, 0.08)'),
                    border: isPresent 
                      ? '1px solid #10b981' 
                      : (isAbsent ? '1px solid #ef4444' : `1px solid ${color.hex}`),
                    borderRadius: '16px',
                    padding: '0.24rem 0.58rem',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.15s ease',
                    boxShadow: isPresent ? '0 0 10px rgba(16, 185, 129, 0.35)' : 'none'
                  }}
                >
                  {/* Glowing Color Bulb Dot */}
                  <div style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    background: color.hex,
                    boxShadow: `0 0 6px ${color.hex}`,
                    flexShrink: 0
                  }} />

                  {/* Student Name */}
                  <span style={{
                    color: isPresent ? '#34d399' : (isAbsent ? '#f87171' : '#f8fafc'),
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}>
                    {student.Name}
                  </span>

                  {/* Status Indicator */}
                  {isPresent && <span style={{ fontSize: '0.7rem', color: '#10b981' }}>✓</span>}
                  {isAbsent && <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>✗</span>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
