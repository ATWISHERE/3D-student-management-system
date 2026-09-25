import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line, Stars, Sparkles, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

import { SHAPES } from './shapes';

const COLORS = ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ffaa00'];

function distributePoints(polygon, numPoints) {
  if (numPoints <= 0) return [];
  if (numPoints === 1) return [polygon[0]];
  let totalLength = 0;
  const segments = [];
  for (let i = 0; i < polygon.length - 1; i++) {
    const p1 = polygon[i], p2 = polygon[i + 1];
    const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
    const len = Math.sqrt(dx*dx + dy*dy);
    segments.push({ p1, p2, len, dx, dy });
    totalLength += len;
  }
  const step = totalLength / numPoints;
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const targetDist = i * step;
    let accumulated = 0, found = false;
    for (const seg of segments) {
      if (accumulated + seg.len >= targetDist) {
        const ratio = seg.len === 0 ? 0 : (targetDist - accumulated) / seg.len;
        points.push([seg.p1[0] + seg.dx * ratio, seg.p1[1] + seg.dy * ratio]);
        found = true; break;
      }
      accumulated += seg.len;
    }
    if (!found) points.push([...segments[segments.length - 1].p2]);
  }
  return points;
}

function StarNode({ student, initialPos, targetPos, absentPos, gridPos, isPresent, isAbsent, isGathered, clusterColor, onClick, ecoMode }) {
  const groupRef = useRef();
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  const currentPos = useRef(new THREE.Vector3().copy(initialPos));

  useFrame((state, delta) => {
    let destination;
    if (isPresent) destination = targetPos;
    else if (isAbsent) destination = absentPos;
    else destination = isGathered ? gridPos : initialPos;
    
    currentPos.current.lerp(destination, 0.05);
    if (groupRef.current) {
      groupRef.current.position.copy(currentPos.current);
    }
    
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x += delta * 0.2;
      const targetScale = isPresent ? 1.5 : (hovered ? 1.2 : 0.8);
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  const materialColor = isPresent ? clusterColor : (isAbsent ? '#ff0000' : (hovered ? '#ffffff' : (isGathered ? '#aaddff' : '#444444')));
  const emColor = isPresent ? clusterColor : (isAbsent ? '#cc0000' : (hovered ? '#555555' : (isGathered ? '#5588aa' : '#000000')));

  return (
    <group ref={groupRef}>
      <mesh 
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <icosahedronGeometry args={[0.5, 1]} />
        {ecoMode ? (
          <meshStandardMaterial 
            color={materialColor}
            emissive={emColor}
            emissiveIntensity={isPresent ? 1.5 : 0.5}
            roughness={0.8}
            transparent={true}
            opacity={0.9}
          />
        ) : (
          <meshPhysicalMaterial 
            color={materialColor}
            emissive={emColor}
            emissiveIntensity={isPresent ? 3 : (isAbsent ? 2 : (isGathered ? 1 : 0))}
            roughness={0.1}
            metalness={0.8}
            clearcoat={1}
            clearcoatRoughness={0.1}
            transparent={true}
            opacity={0.9}
          />
        )}
      </mesh>
      
      <Billboard>
        <Text
          position={[0, -1.2, 0]}
          fontSize={0.4}
          color={isPresent ? '#ffffff' : (isAbsent ? '#ffbbbb' : '#cccccc')}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor={isPresent ? "#003366" : (isAbsent ? "#330000" : "#222222")}
        >
          {student.Name}
        </Text>
      </Billboard>
    </group>
  );
}

function ConstellationLines({ selectedShape, isGathered }) {
  const [visiblePoints, setVisiblePoints] = useState([]);

  const linePoints = useMemo(() => {
    const raw = SHAPES[selectedShape] || SHAPES["Lion"];
    const pts = raw.map(p => new THREE.Vector3(p[0] * 12, p[1] * 12, 0));
    pts.push(pts[0]); // close loop
    return pts;
  }, [selectedShape]);

  useEffect(() => {
    setVisiblePoints([]);
    let count = 1;
    const interval = setInterval(() => {
      count++;
      setVisiblePoints(linePoints.slice(0, count));
      if (count >= linePoints.length) clearInterval(interval);
    }, 100); // Connects a new dot every 100ms
    return () => clearInterval(interval);
  }, [linePoints]);

  if (isGathered || visiblePoints.length < 2) return null;

  return (
    <Line 
      points={visiblePoints}
      color="#44ccff"
      lineWidth={4}
      opacity={0.8}
      transparent
    />
  );
}

export default function ConstellationGame({ students, attendanceData, selectedClass, selectedDate, setAttendanceStatus, markRemainingAbsent }) {
  const [isGathered, setIsGathered] = useState(false);
  const [selectedShape, setSelectedShape] = useState("Lion");
  const [ecoMode, setEcoMode] = useState(false);
  const shapeKeys = Object.keys(SHAPES);

  const studentNamesStr = useMemo(() => students.map(s => s.Name).join(','), [students]);

  const positions = useMemo(() => {
    const initial = [];
    const target = [];
    const absentTarget = [];
    const grid = [];
    
    const presentIndices = [];
    const absentIndices = [];

    const columns = Math.ceil(Math.sqrt(students.length));
    const startX = -((columns - 1) * 2.5) / 2;
    const startY = ((Math.ceil(students.length / columns) - 1) * 2.5) / 2;

    students.forEach((student, i) => {
      const rand1 = Math.abs(Math.sin(i * 12.9898 + 1.23));
      const rand2 = Math.abs(Math.sin(i * 78.233 + 4.56));
      const rand3 = Math.abs(Math.sin(i * 45.123 + 7.89));

      const status = attendanceData[selectedClass]?.[student.Name]?.[selectedDate];
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

    const shapePoints = SHAPES[selectedShape] || SHAPES["Lion"];
    const distributedPoints = distributePoints(shapePoints, presentIndices.length);

    presentIndices.forEach((studentIdx, pIdx) => {
      const [x, y] = distributedPoints[pIdx];
      target[studentIdx] = new THREE.Vector3(x * 12, y * 12, 0);
      absentTarget[studentIdx] = new THREE.Vector3(x * 12, y * 12, 0);
    });

    absentIndices.forEach(studentIdx => {
      const rand1 = Math.abs(Math.sin(studentIdx * 33.333));
      const rand2 = Math.abs(Math.sin(studentIdx * 44.444));
      const rand3 = Math.abs(Math.sin(studentIdx * 55.555));

      const absentX = 14 + (rand1 * 8);
      const absentY = -10 + (rand2 * 6);
      const absentZ = -5 + (rand3 * 4);
      target[studentIdx] = new THREE.Vector3(absentX, absentY, absentZ);
      absentTarget[studentIdx] = new THREE.Vector3(absentX, absentY, absentZ);
    });
    
    return { initial, target, absentTarget, grid };
  }, [studentNamesStr, attendanceData, selectedClass, selectedDate, selectedShape]);

  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to bottom, #101c3a, #1a2a50)' }}>
      <Canvas camera={{ position: [0, 0, 25], fov: 50 }}>
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#4488ff" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#ff88ff" />
        
        <Stars radius={100} depth={50} count={ecoMode ? 800 : 3000} factor={6} saturation={0.5} fade speed={1} />
        <Sparkles count={ecoMode ? 100 : 500} scale={30} size={4} speed={0.4} opacity={0.2} color="#aaddff" />
        
        {students.map((student, idx) => {
          const status = attendanceData[selectedClass]?.[student.Name]?.[selectedDate];
          const isPresent = status === 'P';
          const isAbsent = status === 'A';
          const clusterColor = COLORS[Math.floor(idx / 10) % COLORS.length];
          
          return (
            <StarNode
              key={student.Name}
              student={student}
              initialPos={positions.initial[idx]}
              targetPos={positions.target[idx]}
              absentPos={positions.absentTarget[idx]}
              gridPos={positions.grid[idx]}
              isPresent={isPresent}
              isAbsent={isAbsent}
              isGathered={isGathered}
              clusterColor={clusterColor}
              ecoMode={ecoMode}
              onClick={() => {
                if (!isPresent) {
                  setAttendanceStatus(student.Name, 'P');
                } else {
                  setAttendanceStatus(student.Name, '');
                }
              }}
            />
          );
        })}

        <ConstellationLines 
          selectedShape={selectedShape}
          isGathered={isGathered}
        />

        {!ecoMode && (
          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.5} radius={0.6} />
          </EffectComposer>
        )}

        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={false} 
        />
      </Canvas>
      
      {/* HUD Controls */}
      <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '1rem', pointerEvents: 'auto' }}>
        
        <button 
          onClick={() => setEcoMode(!ecoMode)}
          style={{
            background: ecoMode ? 'rgba(76, 175, 80, 0.8)' : 'rgba(0,0,0,0.5)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.5)', padding: '0.8rem 1.2rem', borderRadius: '25px',
            fontFamily: 'Cormorant Garamond', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.3s'
          }}
        >
          {ecoMode ? "Eco Mode: ON" : "Eco Mode: OFF"}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', background: 'rgba(0,0,0,0.6)', padding: '0.3rem 0.8rem', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.2)' }}>
          <label style={{ color: '#aaa', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>Shape of the Day</label>
          <select 
            value={selectedShape}
            onChange={e => setSelectedShape(e.target.value)}
            style={{ padding: '0.2rem 0.5rem', borderRadius: '8px', background: '#fff', outline: 'none', border: 'none', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}
          >
            {shapeKeys.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        <button 
          onClick={() => setIsGathered(!isGathered)}
          style={{
            background: isGathered ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.5)',
            color: isGathered ? '#000' : '#fff',
            border: '1px solid rgba(255,255,255,0.5)', padding: '0.8rem 1.2rem', borderRadius: '25px',
            fontFamily: 'Cormorant Garamond', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.3s',
            boxShadow: isGathered ? '0 0 20px rgba(255,255,255,0.5)' : 'none'
          }}
        >
          {isGathered ? "Release Stars" : "Gather Stars"}
        </button>
        
        <button 
          onClick={markRemainingAbsent}
          style={{
            background: 'rgba(255, 50, 50, 0.8)', color: '#fff',
            border: '1px solid rgba(255,100,100,0.8)', padding: '0.8rem 1.2rem', borderRadius: '25px',
            fontFamily: 'Cormorant Garamond', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.3s',
            boxShadow: '0 0 15px rgba(255, 50, 50, 0.4)'
          }}
        >
          Finish Game
        </button>
      </div>
    </div>
  );
}
