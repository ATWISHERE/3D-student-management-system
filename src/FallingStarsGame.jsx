import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Billboard, Sparkles, Float } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { 
  playFirecrackerLaunch, 
  playFirecrackerBurst, 
  playClickSound, 
  playAbsentSound 
} from './utils/soundEffects';

// 40+ Authentic, High-Contrast Distinct Firecracker Colors with Curated Effects
export const FIRECRACKER_COLORS = [
  { name: 'Imperial Golden Willow', hex: '#ffd700', text: '#ffffff' },
  { name: 'Electric Cyan Chrysanthemum', hex: '#00f5ff', text: '#ffffff' },
  { name: 'Ruby Peony', hex: '#f43f5e', text: '#ffffff' },
  { name: 'Dragon Emerald Spark', hex: '#10b981', text: '#ffffff' },
  { name: 'Royal Amethyst Dahlia', hex: '#a855f7', text: '#ffffff' },
  { name: 'Solar Flare Orange', hex: '#ff5722', text: '#ffffff' },
  { name: 'Deep Sapphire Sky', hex: '#0284c7', text: '#ffffff' },
  { name: 'Radiant Fuchsia Blossom', hex: '#ff007f', text: '#ffffff' },
  { name: 'Tiger Tail Amber', hex: '#f59e0b', text: '#000000' },
  { name: 'Glacial Ice Turquoise', hex: '#06b6d4', text: '#ffffff' },
  { name: 'Neon Lime Starburst', hex: '#84cc16', text: '#000000' },
  { name: 'Twilight Purple Comet', hex: '#8b5cf6', text: '#ffffff' },
  { name: 'Coral Palm Flare', hex: '#fb7185', text: '#ffffff' },
  { name: 'Marigold Sunburst', hex: '#eab308', text: '#000000' },
  { name: 'Cobalt Strobe', hex: '#3b82f6', text: '#ffffff' },
  { name: 'Rose Gold Shimmer', hex: '#f472b6', text: '#ffffff' },
  { name: 'Jade Waterfall', hex: '#22c55e', text: '#ffffff' },
  { name: 'Electric Indigo Ray', hex: '#6366f1', text: '#ffffff' },
  { name: 'Phoenix Fire Orange', hex: '#ea580c', text: '#ffffff' },
  { name: 'Lagoon Aurora Teal', hex: '#14b8a6', text: '#ffffff' },
  { name: 'Crimson Velvet Willow', hex: '#e11d48', text: '#ffffff' },
  { name: 'Champagne Sparkle', hex: '#fef08a', text: '#000000' },
  { name: 'Cerulean Splash', hex: '#0ea5e9', text: '#ffffff' },
  { name: 'Ultra Magenta Flash', hex: '#d946ef', text: '#ffffff' },
  { name: 'Golden Honey Brocade', hex: '#d97706', text: '#ffffff' },
  { name: 'Mint Glaze Star', hex: '#34d399', text: '#000000' },
  { name: 'Electric Violet Meteor', hex: '#9333ea', text: '#ffffff' },
  { name: 'Blood Orange Cascade', hex: '#dc2626', text: '#ffffff' },
  { name: 'Aqua Marine Wave', hex: '#38bdf8', text: '#000000' },
  { name: 'Lemon Zing Sparkler', hex: '#facc15', text: '#000000' },
  { name: 'Orchid Dream', hex: '#c084fc', text: '#ffffff' },
  { name: 'Forest Jade Fountain', hex: '#059669', text: '#ffffff' },
  { name: 'Flamingo Pink Ring', hex: '#ec4899', text: '#ffffff' },
  { name: 'Sunset Bronze Tail', hex: '#b45309', text: '#ffffff' },
  { name: 'Deep Sea Cyan', hex: '#0891b2', text: '#ffffff' },
  { name: 'Radiant Lavender Burst', hex: '#a78bfa', text: '#ffffff' },
  { name: 'Scarlet Dragon Blaze', hex: '#b91c1c', text: '#ffffff' },
  { name: 'Electric Spring Bud', hex: '#4ade80', text: '#000000' },
  { name: 'Persian Blue Comet', hex: '#2563eb', text: '#ffffff' },
  { name: 'Copper Starlight', hex: '#c2410c', text: '#ffffff' },
  { name: 'Crystal Platinum Spark', hex: '#e2e8f0', text: '#000000' }
];

/**
 * Returns a guaranteed distinct, high-contrast color for every student
 */
export function getStudentFirecrackerColor(index) {
  // Use golden ratio stepping modulo 40 so adjacent students ALWAYS receive contrasting complementary colors!
  const goldenIndex = (index * 13) % FIRECRACKER_COLORS.length;
  return FIRECRACKER_COLORS[goldenIndex];
}

// 3D Firecracker Shack & Boy Master Component
function FirecrackerShack({ isLaunching, launchingStudent, studentColor }) {
  const shackRef = useRef();
  const boyRef = useRef();
  const sparklerRef = useRef();

  useFrame((state, delta) => {
    if (boyRef.current) {
      // Gentle idle sway and excited jumping during launch
      const t = state.clock.elapsedTime;
      if (isLaunching) {
        boyRef.current.position.y = -8.2 + Math.sin(t * 12) * 0.25;
        boyRef.current.rotation.z = Math.sin(t * 8) * 0.08;
      } else {
        boyRef.current.position.y = -8.2 + Math.sin(t * 2) * 0.06;
        boyRef.current.rotation.z = 0;
      }
    }
    if (sparklerRef.current) {
      sparklerRef.current.rotation.z += delta * 4;
    }
  });

  return (
    <group ref={shackRef} position={[15, -8.5, 0]}>
      {/* Wooden Kiosk Base Stand */}
      <mesh position={[0, -0.6, 0]}>
        <boxGeometry args={[4.2, 1.4, 2.4]} />
        <meshStandardMaterial color="#3d2314" roughness={0.7} />
      </mesh>
      
      {/* Front Counter Plank */}
      <mesh position={[0, 0.2, 0.9]}>
        <boxGeometry args={[4.5, 0.25, 0.8]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.4} />
      </mesh>

      {/* Roof Canopy with Festive Stripes */}
      <mesh position={[0, 2.5, 0.2]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[4.8, 0.3, 2.8]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.5} />
      </mesh>
      
      {/* Left & Right Roof Support Posts */}
      <mesh position={[-2, 1.2, 0.9]}>
        <cylinderGeometry args={[0.08, 0.08, 2.4]} />
        <meshStandardMaterial color="#8b5a2b" />
      </mesh>
      <mesh position={[2, 1.2, 0.9]}>
        <cylinderGeometry args={[0.08, 0.08, 2.4]} />
        <meshStandardMaterial color="#8b5a2b" />
      </mesh>

      {/* Warm Lantern Glow */}
      <pointLight position={[0, 1.5, 1]} intensity={3} color="#f59e0b" distance={8} />

      {/* The Firecracker Master / Boy Character */}
      <group ref={boyRef} position={[0.2, 0.3, 0.2]}>
        {/* Head */}
        <mesh position={[0, 1.3, 0]}>
          <sphereGeometry args={[0.42, 16, 16]} />
          <meshStandardMaterial color="#fcd34d" roughness={0.4} />
        </mesh>
        
        {/* Festive Hat / Turban */}
        <mesh position={[0, 1.65, 0]}>
          <coneGeometry args={[0.48, 0.6, 16]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>
        <mesh position={[0, 1.95, 0]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1} />
        </mesh>

        {/* Torso / Kurta */}
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[0.35, 0.42, 0.9, 12]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>

        {/* Arm holding igniter sparkler */}
        <mesh position={[-0.55, 0.85, 0.3]} rotation={[0.4, 0, 0.7]}>
          <cylinderGeometry args={[0.07, 0.07, 0.7]} />
          <meshStandardMaterial color="#fcd34d" />
        </mesh>

        {/* Igniter Sparkler Tip */}
        <group ref={sparklerRef} position={[-0.85, 1.2, 0.45]}>
          <mesh>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color={isLaunching && studentColor ? studentColor.hex : '#fbbf24'} />
          </mesh>
          <Sparkles count={isLaunching ? 18 : 6} scale={0.7} size={2.5} color={isLaunching && studentColor ? studentColor.hex : '#fbbf24'} />
        </group>
      </group>

      {/* Shack Signboard */}
      <Billboard position={[0, 3.2, 0.5]}>
        <Text fontSize={0.38} color="#fef08a" outlineWidth={0.05} outlineColor="#78350f" fontWeight="bold">
          🎆 FIRECRACKER STATION
        </Text>
        <Text position={[0, -0.38, 0]} fontSize={0.22} color="#ffffff" outlineWidth={0.03} outlineColor="#000000">
          {isLaunching && launchingStudent 
            ? `Igniting ${launchingStudent.Name}...` 
            : "Who's next for attendance?"}
        </Text>
      </Billboard>
    </group>
  );
}

// 3D Flying Rocket with Smoke/Spark Trail
function ActiveRocket({ rocket, onApex }) {
  const meshRef = useRef();
  const startTime = useRef(performance.now());
  const startPos = useMemo(() => new THREE.Vector3(14.2, -7.5, 0), []);

  useFrame(() => {
    const elapsed = (performance.now() - startTime.current) / 1000;
    const duration = 0.65; // Flight time to apex
    const progress = Math.min(1, elapsed / duration);
    
    // Smooth ease-out quad upward flight curve
    const currentX = THREE.MathUtils.lerp(startPos.x, rocket.targetPos.x, progress);
    const currentY = THREE.MathUtils.lerp(startPos.y, rocket.targetPos.y, Math.sin(progress * Math.PI * 0.5));
    const currentZ = THREE.MathUtils.lerp(startPos.z, rocket.targetPos.z, progress);

    if (meshRef.current) {
      meshRef.current.position.set(currentX, currentY, currentZ);
      // Tilt rocket in direction of motion
      const dx = rocket.targetPos.x - startPos.x;
      meshRef.current.rotation.z = Math.atan2(10, dx) - Math.PI / 2;
    }

    if (progress >= 1) {
      onApex(rocket);
    }
  });

  return (
    <group ref={meshRef}>
      {/* Rocket Cylindrical Shell */}
      <mesh>
        <cylinderGeometry args={[0.15, 0.18, 0.9, 12]} />
        <meshStandardMaterial color={rocket.color.hex} emissive={rocket.color.hex} emissiveIntensity={0.6} />
      </mesh>
      {/* Glowing Cone Nose */}
      <mesh position={[0, 0.55, 0]}>
        <coneGeometry args={[0.2, 0.45, 12]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
      </mesh>
      {/* Rocket Flame / Spark Tail */}
      <mesh position={[0, -0.6, 0]}>
        <coneGeometry args={[0.16, 0.6, 8]} />
        <meshBasicMaterial color="#ffaa00" />
      </mesh>
      <Sparkles count={15} scale={1.2} size={3} color={rocket.color.hex} speed={1.5} />
    </group>
  );
}

// 3D Firecracker Burst Explosion with Expanding Radial Sparks
function ActiveBurst({ burst, onComplete, ecoMode }) {
  const sparkGroupRef = useRef();
  const startTime = useRef(performance.now());
  const sparkCount = ecoMode ? 22 : 42;

  // Pre-generate radial explosion velocities
  const sparkVelocities = useMemo(() => {
    const list = [];
    for (let i = 0; i < sparkCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const speed = 4 + Math.random() * 7;
      list.push(new THREE.Vector3(
        speed * Math.sin(phi) * Math.cos(theta),
        speed * Math.sin(phi) * Math.sin(theta),
        speed * Math.cos(phi) * 0.4
      ));
    }
    return list;
  }, [sparkCount]);

  useFrame(() => {
    const elapsed = (performance.now() - startTime.current) / 1000;
    const duration = 1.6; // Total explosion decay
    const progress = Math.min(1, elapsed / duration);

    if (sparkGroupRef.current) {
      const children = sparkGroupRef.current.children;
      for (let i = 0; i < children.length; i++) {
        const mesh = children[i];
        if (mesh && sparkVelocities[i]) {
          const vel = sparkVelocities[i];
          // Drag and gravity
          const x = vel.x * elapsed * 0.9;
          const y = (vel.y * elapsed * 0.9) - (2.5 * elapsed * elapsed); // gravity pull
          const z = vel.z * elapsed * 0.9;
          mesh.position.set(x, y, z);
          // Scale down as sparks burn out
          const s = Math.max(0, 1 - progress);
          mesh.scale.set(s, s, s);
        }
      }
    }

    if (progress >= 1) {
      onComplete(burst.id);
    }
  });

  return (
    <group position={burst.targetPos}>
      {/* Central Expanding Flash Ring */}
      <mesh>
        <ringGeometry args={[0.2, 0.4, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Radiating Explosion Sparks */}
      <group ref={sparkGroupRef}>
        {sparkVelocities.map((_, idx) => (
          <mesh key={idx}>
            <sphereGeometry args={[0.12, 6, 6]} />
            <meshBasicMaterial color={burst.color.hex} />
          </mesh>
        ))}
      </group>

      {/* Shimmering Embers */}
      <Sparkles count={ecoMode ? 20 : 60} scale={6} size={3.5} color={burst.color.hex} speed={0.8} opacity={0.9} />

      {/* Radiant Glowing Student Name In The Sky */}
      <Billboard position={[0, 1.8, 0]}>
        <Text fontSize={0.85} color="#ffffff" outlineWidth={0.08} outlineColor={burst.color.hex} fontWeight="bold">
          {burst.student.Name}
        </Text>
        <Text position={[0, -0.65, 0]} fontSize={0.38} color={burst.color.hex} outlineWidth={0.04} outlineColor="#000000" fontWeight="bold">
          ✨ {burst.color.name}
        </Text>
        {burst.student.Class && (
          <Text position={[0, -1.15, 0]} fontSize={0.28} color="#e2e8f0" outlineWidth={0.03} outlineColor="#000000">
            {`${burst.student.Class} ${burst.student.Section || ''}`.trim()} • PRESENT ✓
          </Text>
        )}
      </Billboard>
    </group>
  );
}

// 3D Floating Lantern for Students Already Marked Present
function SkyLanternNode({ student, position, color, onSelect }) {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group position={position} onClick={onSelect}>
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
        {/* Festive Floating Lantern */}
        <mesh ref={meshRef}>
          <cylinderGeometry args={[0.45, 0.38, 0.85, 12]} />
          <meshStandardMaterial 
            color={color.hex} 
            emissive={color.hex} 
            emissiveIntensity={0.8} 
            roughness={0.2} 
            transparent 
            opacity={0.85} 
          />
        </mesh>
        
        {/* Lantern Core Light */}
        <pointLight intensity={1.5} color={color.hex} distance={4} />

        {/* Floating Student Name Banner */}
        <Billboard position={[0, -0.9, 0]}>
          <Text fontSize={0.34} color="#ffffff" outlineWidth={0.04} outlineColor="#000000" fontWeight="bold">
            {student.Name}
          </Text>
        </Billboard>
      </Float>
    </group>
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
  ecoMode = true 
}) {
  const toggleAttendance = setAttendanceStatus || onToggleAttendance;

  // Active animations state
  const [activeRockets, setActiveRockets] = useState([]);
  const [activeBursts, setActiveBursts] = useState([]);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchingStudent, setLaunchingStudent] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [filterMode, setFilterMode] = useState('unmarked'); // 'all', 'unmarked', 'present', 'absent'

  const getStudentClass = (s) => (s.Class ? `${s.Class} ${s.Section || ''}`.trim() : selectedClass);

  // Assign deterministic, non-clashing sky positions for all students
  const skyPositions = useMemo(() => {
    const map = {};
    const cols = Math.ceil(Math.sqrt(Math.max(1, students.length))) + 1;
    const spacingX = 4.2;
    const spacingY = 3.2;
    const startX = -14;
    const startY = 9;

    students.forEach((s, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const randOffset = Math.sin(idx * 7.77) * 0.6;
      map[s.Name] = new THREE.Vector3(
        startX + col * spacingX + randOffset,
        startY - row * spacingY + randOffset,
        (Math.cos(idx * 5.55) * 4) - 2
      );
    });
    return map;
  }, [students]);

  // Ignite & Launch Firecracker for Student
  const handleLaunchFirecracker = (student, index) => {
    const studentClass = getStudentClass(student);
    const color = getStudentFirecrackerColor(index);
    const targetPos = skyPositions[student.Name] || new THREE.Vector3(0, 5, 0);

    // Audio cue: Ascent whistle
    playFirecrackerLaunch();

    setIsLaunching(true);
    setLaunchingStudent(student);

    const rocketId = `${student.Name}_${Date.now()}`;
    setActiveRockets(prev => [...prev, { id: rocketId, student, studentClass, color, targetPos }]);

    // Mark as Present immediately or upon burst
    if (toggleAttendance) {
      toggleAttendance(student.Name, 'P', studentClass);
    }
  };

  // When rocket reaches apex altitude
  const handleApex = (rocket) => {
    setActiveRockets(prev => prev.filter(r => r.id !== rocket.id));
    setIsLaunching(false);
    setLaunchingStudent(null);

    // Audio cue: Explosion burst & crackle
    playFirecrackerBurst();

    const burstId = `burst_${rocket.student.Name}_${Date.now()}`;
    setActiveBursts(prev => [...prev, { id: burstId, student: rocket.student, color: rocket.color, targetPos: rocket.targetPos }]);
  };

  const handleBurstComplete = (burstId) => {
    setActiveBursts(prev => prev.filter(b => b.id !== burstId));
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
      const origIndex = students.findIndex(s => s.Name === nextStudent.Name);
      handleLaunchFirecracker(nextStudent, origIndex >= 0 ? origIndex : 0);
    }
  };

  // Filter students for bottom tray
  const filteredStudents = useMemo(() => {
    return students.filter((s, idx) => {
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
    <div style={{ width: '100%', height: '100%', position: 'relative', background: 'radial-gradient(circle at 75% 90%, #201335 0%, #080918 60%, #03040a 100%)', overflow: 'hidden' }}>
      
      {/* 3D Night Sky Canvas */}
      <Canvas
        camera={{ position: [0, 0, 26], fov: 50 }}
        dpr={ecoMode ? 1 : [1, 1.5]}
        gl={{ powerPreference: 'high-performance', antialias: !ecoMode }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[0, 15, 10]} intensity={1.5} color="#ffd700" />
        <Sparkles count={ecoMode ? 120 : 350} scale={45} size={2} color="#ffffff" opacity={0.35} speed={0.2} />

        {/* The Boy & Firecracker Station */}
        <FirecrackerShack 
          isLaunching={isLaunching} 
          launchingStudent={launchingStudent}
          studentColor={launchingStudent ? getStudentFirecrackerColor(students.findIndex(s => s.Name === launchingStudent.Name)) : null} 
        />

        {/* Flying Ascending Rockets */}
        {activeRockets.map(rocket => (
          <ActiveRocket key={rocket.id} rocket={rocket} onApex={handleApex} />
        ))}

        {/* Burst Explosions */}
        {activeBursts.map(burst => (
          <ActiveBurst key={burst.id} burst={burst} onComplete={handleBurstComplete} ecoMode={ecoMode} />
        ))}

        {/* Persistent Floating Lanterns for All Marked Students */}
        {students.map((student, idx) => {
          const studentClass = getStudentClass(student);
          const status = attendanceData[studentClass]?.[student.Name]?.[selectedDate];
          if (status !== 'P') return null;
          const pos = skyPositions[student.Name];
          if (!pos) return null;
          const color = getStudentFirecrackerColor(idx);
          return (
            <SkyLanternNode 
              key={`lantern_${student.Name}_${idx}`}
              student={student} 
              position={pos} 
              color={color} 
              onSelect={() => {
                if (toggleAttendance) toggleAttendance(student.Name, '', studentClass);
              }}
            />
          );
        })}

        {!ecoMode && (
          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={0.15} luminanceSmoothing={0.9} intensity={1.8} radius={0.7} />
          </EffectComposer>
        )}

        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>

      {/* Top Banner Information */}
      <div style={{
        position: 'absolute',
        top: '0.8rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        background: 'rgba(8, 12, 28, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        padding: '0.35rem 1.2rem',
        borderRadius: '30px',
        color: '#f8fafc',
        fontSize: '0.82rem',
        fontFamily: 'Montserrat, sans-serif',
        zIndex: 20,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        pointerEvents: 'none'
      }}>
        <span>🎆 <b>Festive Firecrackers Attendance</b></span>
        <span style={{ color: '#94a3b8' }}>•</span>
        <span style={{ color: '#ffd700' }}>Click any student name to ignite their personalized rocket!</span>
      </div>

      {/* Bottom Student Palette & Launcher Dock */}
      <div style={{
        position: 'absolute',
        bottom: '0.8rem',
        left: '1rem',
        width: 'calc(100% - 22rem)', // Leave room for the 3D shack on bottom-right!
        maxHeight: '190px',
        background: 'rgba(10, 15, 30, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: '18px',
        padding: '0.65rem 0.9rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        zIndex: 25,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)'
      }}>
        {/* Controls Header Row */}
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
                  padding: '0.18rem 0.55rem',
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
              padding: '0.2rem 0.6rem',
              outline: 'none',
              width: '170px'
            }}
          />

          {/* Quick Action: Fire Next */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={handleLaunchNext}
              title="Ignite firecracker for the next unmarked student"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                padding: '0.25rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)'
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
                padding: '0.25rem 0.6rem',
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
          gap: '0.35rem',
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
                      handleLaunchFirecracker(student, origIdx);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (toggleAttendance) {
                      toggleAttendance(student.Name, isAbsent ? '' : 'A', studentClass);
                      playAbsentSound();
                    }
                  }}
                  title={`Left click: Launch ${color.name} Rocket (Present) | Right click: Mark Absent`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: isPresent 
                      ? 'rgba(16, 185, 129, 0.22)' 
                      : (isAbsent ? 'rgba(239, 68, 68, 0.22)' : 'rgba(255, 255, 255, 0.08)'),
                    border: isPresent 
                      ? '1px solid #10b981' 
                      : (isAbsent ? '1px solid #ef4444' : `1px solid ${color.hex}`),
                    borderRadius: '16px',
                    padding: '0.22rem 0.55rem',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.15s ease',
                    boxShadow: isPresent ? '0 0 8px rgba(16, 185, 129, 0.3)' : 'none'
                  }}
                >
                  {/* Color Bulb Dot */}
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
