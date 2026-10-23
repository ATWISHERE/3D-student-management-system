import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line, Stars, Sparkles, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

import { SHAPES } from './shapes';

const COLORS = [
  '#00ffff', // Cyan
  '#ff00ff', // Magenta
  '#39ff14', // Neon Green
  '#ffea00', // Electric Gold
  '#ff007f', // Deep Rose
  '#00d4ff', // Sky Blue
  '#ff6b00', // Vibrant Orange
  '#a855f7'  // Purple
];

// Helper to evenly distribute points along the segments of a shape polygon
function distributePoints(polygon, numPoints) {
  if (!polygon || polygon.length < 2) return [];
  if (numPoints <= 0) return [];
  if (numPoints === 1) return [polygon[0]];
  
  let totalLength = 0;
  const segments = [];
  for (let i = 0; i < polygon.length - 1; i += 2) {
    const p1 = polygon[i];
    const p2 = polygon[i + 1];
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const len = Math.sqrt(dx * dx + dy * dy);
    segments.push({ p1, p2, len, dx, dy });
    totalLength += len;
  }
  
  if (totalLength === 0) {
    return Array(numPoints).fill(polygon[0]);
  }

  const step = totalLength / numPoints;
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const targetDist = i * step;
    let accumulated = 0;
    let found = false;
    for (const seg of segments) {
      if (accumulated + seg.len >= targetDist) {
        const ratio = seg.len === 0 ? 0 : (targetDist - accumulated) / seg.len;
        points.push([seg.p1[0] + seg.dx * ratio, seg.p1[1] + seg.dy * ratio]);
        found = true;
        break;
      }
      accumulated += seg.len;
    }
    if (!found) {
      points.push([...segments[segments.length - 1].p2]);
    }
  }
  return points;
}

function StarNode({ 
  student, 
  initialPos, 
  targetPos, 
  absentPos, 
  gridPos, 
  isPresent, 
  isAbsent, 
  isGathered, 
  isFinished, 
  clusterColor, 
  onClick, 
  onContextMenu, 
  ecoMode 
}) {
  const groupRef = useRef();
  const meshRef = useRef();
  const haloRef = useRef();
  const [hovered, setHovered] = useState(false);

  const currentPos = useRef(initialPos ? new THREE.Vector3().copy(initialPos) : new THREE.Vector3());

  useEffect(() => {
    if (initialPos && currentPos.current && currentPos.current.lengthSq() === 0) {
      currentPos.current.copy(initialPos);
    }
  }, [initialPos]);

  useFrame((state, delta) => {
    let destination;
    if (isFinished) {
      // When complete, present students form the shape, absent students drift to the side
      if (isPresent) destination = targetPos;
      else if (isAbsent) destination = absentPos;
      else destination = isGathered ? gridPos : initialPos;
    } else {
      // While taking attendance (before Complete), stars stay in space or grid
      destination = isGathered ? gridPos : initialPos;
    }
    
    if (destination && groupRef.current) {
      currentPos.current.lerp(destination, 0.06);
      groupRef.current.position.copy(currentPos.current);
    }
    
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.6;
      meshRef.current.rotation.x += delta * 0.3;
      const targetScale = isPresent 
        ? (isFinished ? 1.5 : 1.3) 
        : (hovered ? 1.25 : 0.85);
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }

    if (haloRef.current && isPresent) {
      haloRef.current.rotation.z += delta * 1.2;
    }
  });

  const materialColor = isPresent 
    ? clusterColor 
    : (isAbsent ? '#ef4444' : (hovered ? '#ffffff' : (isGathered ? '#aaddff' : '#64748b')));
    
  const emColor = isPresent 
    ? clusterColor 
    : (isAbsent ? '#991b1b' : (hovered ? '#334155' : (isGathered ? '#38bdf8' : '#0f172a')));

  return (
    <group 
      ref={groupRef}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onContextMenu={(e) => { e.stopPropagation(); if (onContextMenu) onContextMenu(e); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
    >
      {/* Invisible enlarged hit target to make clicking stars easy */}
      <mesh>
        <sphereGeometry args={[1.3, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Main Star Mesh */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.5, 1]} />
        {ecoMode ? (
          <meshStandardMaterial 
            color={materialColor}
            emissive={emColor}
            emissiveIntensity={isPresent ? 2.0 : (isAbsent ? 1.2 : 0.5)}
            roughness={0.6}
            transparent={true}
            opacity={0.95}
          />
        ) : (
          <meshPhysicalMaterial 
            color={materialColor}
            emissive={emColor}
            emissiveIntensity={isPresent ? 3.5 : (isAbsent ? 2.0 : (isGathered ? 1.0 : 0.2))}
            roughness={0.1}
            metalness={0.8}
            clearcoat={1}
            clearcoatRoughness={0.1}
            transparent={true}
            opacity={0.95}
          />
        )}
      </mesh>

      {/* Radiant Glowing Halo for Present Stars */}
      {isPresent && (
        <group ref={haloRef}>
          <mesh>
            <ringGeometry args={[0.7, 0.85, 24]} />
            <meshBasicMaterial color={clusterColor} transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <planeGeometry args={[1.4, 0.08]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.85} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 4]}>
            <planeGeometry args={[1.4, 0.08]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.85} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* Student Name Label */}
      <Billboard>
        <Text
          position={[0, -1.2, 0]}
          fontSize={0.4}
          color={isPresent ? '#ffffff' : (isAbsent ? '#fca5a5' : '#cbd5e1')}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.035}
          outlineColor={isPresent ? clusterColor : (isAbsent ? '#450a0a' : '#0f172a')}
        >
          {student.Name}
        </Text>
        {student.Class && (
          <Text
            position={[0, -1.65, 0]}
            fontSize={0.22}
            color={isPresent ? '#bae6fd' : (isAbsent ? '#f87171' : '#94a3b8')}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {`${student.Class} ${student.Section || ''}`.trim()}
          </Text>
        )}
      </Billboard>
    </group>
  );
}

function ConstellationLines({ selectedShape, isGathered, isFinished, ecoMode }) {
  const [visibleCount, setVisibleCount] = useState(0);

  const linePoints = useMemo(() => {
    const defaultShape = Object.keys(SHAPES)[0];
    const raw = SHAPES[selectedShape] || SHAPES[defaultShape];
    return raw.map(p => new THREE.Vector3(p[0] * 12, p[1] * 12, 0));
  }, [selectedShape]);

  // Unique vertices for glowing flare points
  const uniqueVertices = useMemo(() => {
    const map = new Map();
    linePoints.forEach(p => {
      const key = `${p.x.toFixed(2)}_${p.y.toFixed(2)}`;
      if (!map.has(key)) map.set(key, p);
    });
    return Array.from(map.values());
  }, [linePoints]);

  useEffect(() => {
    if (!isFinished) {
      setVisibleCount(0);
      return;
    }
    
    setVisibleCount(0);
    let count = 0;
    // Step by 2 since segments require pairs of points
    const step = Math.max(2, Math.ceil(linePoints.length / 30) * 2);
    const interval = setInterval(() => {
      count += step;
      if (count >= linePoints.length) {
        setVisibleCount(linePoints.length);
        clearInterval(interval);
      } else {
        setVisibleCount(count);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [linePoints, isFinished]);

  // If attendance not completed or gathered, shape stays completely hidden
  if (!isFinished || isGathered || visibleCount < 2) return null;

  const currentPoints = linePoints.slice(0, visibleCount);

  return (
    <group>
      {/* Central Radiance Point Lights illuminating the glowing constellation */}
      <pointLight position={[0, 0, 4]} intensity={ecoMode ? 2.5 : 5.0} color="#00ffff" distance={35} />
      <pointLight position={[0, 0, -3]} intensity={ecoMode ? 1.5 : 3.0} color="#ff00ff" distance={30} />

      {/* Layer 1: Core Crisp Neon White Line */}
      <Line 
        points={currentPoints}
        color="#ffffff"
        lineWidth={ecoMode ? 2 : 2.5}
        segments={true}
        transparent
        opacity={0.98}
      />

      {/* Layer 2: Radiant Cyan Glow Line */}
      <Line 
        points={currentPoints}
        color="#00e5ff"
        lineWidth={ecoMode ? 5 : 7}
        segments={true}
        transparent
        opacity={0.85}
      />

      {/* Layer 3: Soft Outer Cosmic Aura Line */}
      <Line 
        points={currentPoints}
        color="#0066ff"
        lineWidth={ecoMode ? 10 : 16}
        segments={true}
        transparent
        opacity={0.4}
      />

      {/* Glowing Star Flare Nodes on Vertices */}
      {uniqueVertices.map((v, i) => (
        <group key={i} position={v}>
          <mesh>
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh>
            <ringGeometry args={[0.26, 0.45, 16]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.65} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function ConstellationGame({ 
  students = [], 
  attendanceData = {}, 
  selectedClass, 
  selectedClasses, 
  selectedDate, 
  setAttendanceStatus, 
  onToggleAttendance, 
  markRemainingAbsent,
  markAllPresent,
  resetAttendance
}) {
  const toggleAttendance = setAttendanceStatus || onToggleAttendance;
  const [isGathered, setIsGathered] = useState(false);
  const [selectedShape, setSelectedShape] = useState(() => Object.keys(SHAPES)[0]);
  const [ecoMode, setEcoMode] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const shapeKeys = Object.keys(SHAPES);

  const getStudentClass = (s) => (s.Class ? `${s.Class} ${s.Section || ''}`.trim() : selectedClass);

  const studentKeysStr = useMemo(
    () => students.map((s, i) => `${s.Class || ''}_${s.Section || ''}_${s.Name}_${i}`).join(','), 
    [students]
  );

  // Live attendance counts
  const stats = useMemo(() => {
    let p = 0, a = 0, u = 0;
    students.forEach(s => {
      const cls = getStudentClass(s);
      const st = attendanceData[cls]?.[s.Name]?.[selectedDate];
      if (st === 'P') p++;
      else if (st === 'A') a++;
      else u++;
    });
    return { present: p, absent: a, unmarked: u, total: students.length };
  }, [students, attendanceData, selectedClass, selectedDate]);

  const handleComplete = () => {
    if (markRemainingAbsent) {
      markRemainingAbsent();
    }
    setIsFinished(true);
    setIsGathered(false);
  };

  const handleReset = () => {
    if (resetAttendance) {
      resetAttendance();
    }
    setIsFinished(false);
    setIsGathered(false);
  };

  const handleMarkAllPresent = () => {
    if (markAllPresent) {
      markAllPresent();
    }
  };

  const positions = useMemo(() => {
    const initial = [];
    const target = [];
    const absentTarget = [];
    const grid = [];
    
    const presentIndices = [];
    const absentIndices = [];

    const columns = Math.ceil(Math.sqrt(students.length)) || 1;
    const startX = -((columns - 1) * 2.5) / 2;
    const startY = ((Math.ceil(students.length / columns) - 1) * 2.5) / 2;

    students.forEach((student, i) => {
      const rand1 = Math.abs(Math.sin(i * 12.9898 + 1.23));
      const rand2 = Math.abs(Math.sin(i * 78.233 + 4.56));
      const rand3 = Math.abs(Math.sin(i * 45.123 + 7.89));

      const studentClass = getStudentClass(student);
      const status = attendanceData[studentClass]?.[student.Name]?.[selectedDate];
      if (status === 'P') presentIndices.push(i);
      else absentIndices.push(i);

      const rInit = 8 + rand1 * 6;
      const thetaInit = rand2 * Math.PI * 2;
      const phiInit = Math.acos((rand3 * 2) - 1);
      initial.push(new THREE.Vector3(
        rInit * Math.sin(phiInit) * Math.cos(thetaInit),
        rInit * Math.sin(phiInit) * Math.sin(thetaInit),
        rInit * Math.cos(phiInit)
      ));
      
      const gridRow = Math.floor(i / columns);
      const gridCol = i % columns;
      grid.push(new THREE.Vector3(startX + gridCol * 2.5, startY - gridRow * 2.5, 5));
    });

    // Enforce healthy distance between scattered names (Repulsion Algorithm)
    for (let iter = 0; iter < 20; iter++) {
      for (let i = 0; i < initial.length; i++) {
        for (let j = i + 1; j < initial.length; j++) {
          const p1 = initial[i];
          const p2 = initial[j];
          const dist = p1.distanceTo(p2);
          const minDistance = 4.5;
          if (dist < minDistance && dist > 0.001) {
            const overlap = minDistance - dist;
            const pushDir = new THREE.Vector3().subVectors(p1, p2).normalize().multiplyScalar(overlap * 0.5);
            p1.add(pushDir);
            p2.sub(pushDir);
          }
        }
      }
    }

    const defaultShape = Object.keys(SHAPES)[0];
    const shapePointsRaw = SHAPES[selectedShape] || SHAPES[defaultShape];
    const shapePoints = [...shapePointsRaw];

    // Distribute points along shape for present students
    const distributedPoints = distributePoints(shapePoints, presentIndices.length);

    presentIndices.forEach((studentIdx, pIdx) => {
      const [x, y] = distributedPoints[pIdx] || [0, 0];
      target[studentIdx] = new THREE.Vector3(x * 12, y * 12, 0);
      absentTarget[studentIdx] = new THREE.Vector3(x * 12, y * 12, 0);
    });

    absentIndices.forEach(studentIdx => {
      const rand1 = Math.abs(Math.sin(studentIdx * 33.333));
      const rand2 = Math.abs(Math.sin(studentIdx * 44.444));
      const rand3 = Math.abs(Math.sin(studentIdx * 55.555));

      const side = (studentIdx % 2 === 0 ? 1 : -1);
      const absentX = (18 + rand1 * 10) * side;
      const absentY = -12 + (rand2 * 24);
      const absentZ = -8 + (rand3 * 12);
      target[studentIdx] = new THREE.Vector3(absentX, absentY, absentZ);
      absentTarget[studentIdx] = new THREE.Vector3(absentX, absentY, absentZ);
    });

    // Enforce healthy distance for absent students
    for (let iter = 0; iter < 20; iter++) {
      for (let i = 0; i < absentIndices.length; i++) {
        for (let j = i + 1; j < absentIndices.length; j++) {
          const idx1 = absentIndices[i];
          const idx2 = absentIndices[j];
          const p1 = target[idx1];
          const p2 = target[idx2];
          if (p1 && p2) {
            const dist = p1.distanceTo(p2);
            const minDistance = 4.5;
            if (dist < minDistance && dist > 0.001) {
              const overlap = minDistance - dist;
              const pushDir = new THREE.Vector3().subVectors(p1, p2).normalize().multiplyScalar(overlap * 0.5);
              p1.add(pushDir);
              p2.sub(pushDir);
              absentTarget[idx1].copy(p1);
              absentTarget[idx2].copy(p2);
            }
          }
        }
      }
    }
    
    return { initial, target, absentTarget, grid };
  }, [studentKeysStr, attendanceData, selectedClass, selectedDate, selectedShape, students]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: 'linear-gradient(to bottom, #090e1f, #121e3a)' }}>
      
      {/* Top Floating Attendance Stats Badge */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0.8rem',
        background: 'rgba(10, 15, 35, 0.75)',
        padding: '0.45rem 1.4rem',
        borderRadius: '30px',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        zIndex: 15,
        boxShadow: '0 6px 25px rgba(0, 0, 0, 0.45)',
        color: '#f8fafc',
        fontSize: '0.85rem',
        fontFamily: 'Montserrat, sans-serif',
        pointerEvents: 'none'
      }}>
        <span>Total: <strong>{stats.total}</strong></span>
        <span style={{ color: '#10b981', fontWeight: 600 }}>● Present: {stats.present}</span>
        <span style={{ color: '#ef4444', fontWeight: 600 }}>● Absent: {stats.absent}</span>
        <span style={{ color: '#94a3b8', fontWeight: 600 }}>○ Unmarked: {stats.unmarked}</span>
        {isFinished && (
          <span style={{ 
            color: '#38bdf8', 
            fontWeight: 700, 
            background: 'rgba(56, 189, 248, 0.15)',
            padding: '0.15rem 0.6rem',
            borderRadius: '12px',
            border: '1px solid rgba(56, 189, 248, 0.4)'
          }}>
            ✨ {selectedShape} Constellation Active
          </span>
        )}
      </div>

      <Canvas camera={{ position: [0, 0, 25], fov: 50 }}>
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={2.5} color="#4488ff" />
        <pointLight position={[-10, -10, -10]} intensity={1.5} color="#ff88ff" />
        
        <Stars radius={100} depth={50} count={ecoMode ? 800 : 3000} factor={6} saturation={0.5} fade speed={1} />
        <Sparkles count={ecoMode ? 100 : 500} scale={30} size={4} speed={0.4} opacity={0.25} color="#aaddff" />
        
        {students.map((student, idx) => {
          const studentClass = getStudentClass(student);
          const status = attendanceData[studentClass]?.[student.Name]?.[selectedDate];
          const isPresent = status === 'P';
          const isAbsent = status === 'A';
          const clusterColor = COLORS[idx % COLORS.length];
          
          return (
            <StarNode
              key={`${studentClass}_${student.Name}_${idx}`}
              student={student}
              initialPos={positions.initial[idx]}
              targetPos={positions.target[idx]}
              absentPos={positions.absentTarget[idx]}
              gridPos={positions.grid[idx]}
              isPresent={isPresent}
              isAbsent={isAbsent}
              isGathered={isGathered}
              isFinished={isFinished}
              clusterColor={clusterColor}
              ecoMode={ecoMode}
              onClick={() => {
                if (toggleAttendance) {
                  if (!isPresent) {
                    toggleAttendance(student.Name, 'P', studentClass);
                  } else {
                    toggleAttendance(student.Name, '', studentClass);
                  }
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                if (toggleAttendance) {
                  toggleAttendance(student.Name, isAbsent ? '' : 'A', studentClass);
                }
              }}
            />
          );
        })}

        <ConstellationLines 
          selectedShape={selectedShape}
          isGathered={isGathered}
          isFinished={isFinished}
          ecoMode={ecoMode}
        />

        {!ecoMode && (
          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.6} radius={0.7} />
          </EffectComposer>
        )}

        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={false} 
        />
      </Canvas>
      
      {/* Bottom HUD Controls Bar */}
      <div style={{ 
        position: 'absolute', 
        bottom: '1.2rem', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '0.65rem', 
        background: 'rgba(10, 12, 30, 0.88)',
        padding: '0.5rem 1.2rem',
        borderRadius: '35px',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)',
        maxWidth: '95vw',
        zIndex: 25
      }}>
        
        {/* Complete Button: marks unclicked absent, forms constellation, and lights up glowing shape */}
        <button 
          onClick={handleComplete}
          title="Mark unclicked students absent and ignite the glowing constellation"
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.4)',
            padding: '0.6rem 1.3rem',
            borderRadius: '22px',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 0 16px rgba(16, 185, 129, 0.55)',
            transition: 'all 0.25s ease'
          }}
        >
          ✨ Complete
        </button>

        {/* Reset Button: resets attendance to 0, hides shape, and scatters stars */}
        <button 
          onClick={handleReset}
          title="Reset all attendance to 0, hide shape, and scatter stars"
          style={{
            background: 'rgba(239, 68, 68, 0.25)',
            color: '#fca5a5',
            border: '1px solid rgba(239, 68, 68, 0.55)',
            padding: '0.6rem 1.15rem',
            borderRadius: '22px',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.25s ease'
          }}
        >
          ↺ Reset
        </button>

        {/* Mark All Present */}
        <button 
          onClick={handleMarkAllPresent}
          title="Mark all students present"
          style={{
            background: 'rgba(59, 130, 246, 0.25)',
            color: '#93c5fd',
            border: '1px solid rgba(59, 130, 246, 0.55)',
            padding: '0.6rem 1.1rem',
            borderRadius: '22px',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.25s ease'
          }}
        >
          Mark All Present
        </button>

        {/* Shape Selector */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.4rem', 
          background: 'rgba(255,255,255,0.08)', 
          padding: '0.35rem 0.8rem', 
          borderRadius: '20px', 
          border: '1px solid rgba(255,255,255,0.2)' 
        }}>
          <label style={{ 
            color: '#cbd5e1', 
            fontSize: '0.75rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em', 
            fontWeight: 700 
          }}>
            Shape:
          </label>
          <select 
            value={selectedShape}
            onChange={e => setSelectedShape(e.target.value)}
            style={{ 
              padding: '0.25rem 0.6rem', 
              borderRadius: '10px', 
              background: '#1e293b', 
              color: '#f8fafc', 
              outline: 'none', 
              border: '1px solid rgba(255,255,255,0.2)', 
              fontWeight: 600, 
              fontSize: '0.85rem', 
              cursor: 'pointer' 
            }}
          >
            {shapeKeys.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        {/* Random Shape Button */}
        <button 
          onClick={() => {
            const randomKey = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];
            setSelectedShape(randomKey);
          }}
          title="Choose a random constellation shape"
          style={{
            background: 'rgba(147, 51, 234, 0.3)',
            color: '#d8b4fe',
            border: '1px solid rgba(168, 85, 247, 0.55)',
            padding: '0.6rem 1.1rem',
            borderRadius: '22px',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.25s ease'
          }}
        >
          🎲 Random Shape
        </button>

        {/* Gather / Release Stars Button */}
        <button 
          onClick={() => setIsGathered(!isGathered)}
          title="Toggle between organized grid and 3D scattered orbit"
          style={{
            background: isGathered ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.08)',
            color: isGathered ? '#0f172a' : '#fff',
            border: '1px solid rgba(255,255,255,0.3)',
            padding: '0.6rem 1.1rem',
            borderRadius: '22px',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            boxShadow: isGathered ? '0 0 15px rgba(255,255,255,0.4)' : 'none'
          }}
        >
          {isGathered ? "Release Stars" : "Gather Stars"}
        </button>

        {/* Eco Mode Toggle */}
        <button 
          onClick={() => setEcoMode(!ecoMode)}
          title="Toggle performance mode"
          style={{
            background: ecoMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.08)',
            color: ecoMode ? '#34d399' : '#94a3b8',
            border: ecoMode ? '1px solid rgba(52, 211, 153, 0.6)' : '1px solid rgba(255,255,255,0.2)',
            padding: '0.6rem 1.1rem',
            borderRadius: '22px',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.25s ease'
          }}
        >
          {ecoMode ? "Eco Mode: ON" : "Eco Mode: OFF"}
        </button>
      </div>
    </div>
  );
}
