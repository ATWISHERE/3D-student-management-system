import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { Settings, Upload, Save, Check, X, ShieldAlert, Gamepad2, List, Volume2, VolumeX } from 'lucide-react';
import ThreeScene from './ThreeBackground';
import ConstellationGame from './ConstellationGame';
import BubblePopperGame from './BubblePopperGame';
import FallingStarsGame from './FallingStarsGame';
import TargetPracticeGame from './TargetPracticeGame';
import ATWLogo from './ATWLogo';
import { 
  playPresentSound, 
  playAbsentSound, 
  playCompleteSound, 
  playClickSound, 
  soundSettings 
} from './utils/soundEffects';
import { parseClassSection, normalizeDate, isSummaryOrInvalidRow } from './utils/excelParser';

export default function AttendanceSystem({ students, onBack }) {
  // Navigation State
  const [activeView, setActiveView] = useState('game'); // 'game' or 'register'
  const [selectedGame, setSelectedGame] = useState('constellation');
  const [allMarkState, setAllMarkState] = useState('present'); // toggle state
  const [toast, setToast] = useState(null);

  const [soundEnabled, setSoundEnabled] = useState(() => soundSettings.isEnabled());

  const toggleSound = () => {
    const next = soundSettings.toggle();
    setSoundEnabled(next);
    if (next) {
      playClickSound();
    }
  };

  const [ecoMode, setEcoMode] = useState(() => {
    const saved = localStorage.getItem('ecoMode');
    return saved !== null ? saved === 'true' : true; // Eco mode ON by default!
  });

  const toggleEcoMode = () => {
    setEcoMode(prev => {
      const next = !prev;
      localStorage.setItem('ecoMode', String(next));
      return next;
    });
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Attendance State Structure: { "ClassName": { "StudentName": { "2026-09-25": "P", "2026-09-24": "A" } } }
  const [attendanceData, setAttendanceData] = useState(() => {
    const saved = localStorage.getItem('attendanceDataCache');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return {}; }
    }
    return {};
  });
  
  useEffect(() => {
    localStorage.setItem('attendanceDataCache', JSON.stringify(attendanceData));
  }, [attendanceData]);

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [editMode, setEditMode] = useState(true); // Always allow editing by default
  const fileInputRef = useRef(null);
  
  const [exportStartClass, setExportStartClass] = useState(1);
  const [exportEndClass, setExportEndClass] = useState(12);
  const [enableExportFilter, setEnableExportFilter] = useState(false);

  const activeStudents = students.filter(s => s.Name && s.Class);
  const classSections = [...new Set(activeStudents.map(s => `${s.Class} ${s.Section || ''}`.trim()))].sort();
  
  const [selectedClasses, setSelectedClasses] = useState(classSections[0] ? [classSections[0]] : []);
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [mergeMode, setMergeMode] = useState(false);

  const availableBatches = ['All', ...new Set(activeStudents.map(s => s.Batch?.toString()?.trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, undefined, { numeric: true })
  );

  const toggleClassSelection = (cls) => {
    if (selectedClasses.includes(cls)) {
      if (selectedClasses.length > 1) {
        setSelectedClasses(selectedClasses.filter(c => c !== cls));
      }
    } else {
      setSelectedClasses([...selectedClasses, cls]);
    }
  };

  // Dynamic Document Title based on active view, game, and selected classes
  useEffect(() => {
    const classLabel = selectedClasses.length > 0 ? selectedClasses.join(', ') : 'All Classes';
    if (activeView === 'register') {
      document.title = `ATW • Attendance Register (${classLabel})`;
    } else {
      let gameName = '3D Constellation Attendance';
      if (selectedGame === 'bubble') gameName = 'Bubble Popper Attendance';
      else if (selectedGame === 'falling') gameName = 'Festive Crackers Attendance';
      else if (selectedGame === 'target') gameName = 'Target Practice Attendance';
      document.title = `ATW • ${gameName} (${classLabel})`;
    }
  }, [activeView, selectedGame, selectedClasses]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        const newAttendanceData = { ...attendanceData };
        let recordCount = 0;

        wb.SheetNames.forEach(sheetName => {
          const ws = wb.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(ws);

          data.forEach(row => {
            if (isSummaryOrInvalidRow(row)) return;

            let studentName = null;
            let studentClass = null;
            let studentSec = '';

            Object.keys(row).forEach(key => {
              const lowerKey = key.toLowerCase().trim();
              if (['name', 'student name', 'studentname', 'full name', "student's name"].includes(lowerKey)) {
                studentName = row[key];
              }
              if (['class', 'std', 'standard', 'grade', 'class section'].includes(lowerKey)) {
                studentClass = row[key];
              }
              if (['sec', 'section', 'batch'].includes(lowerKey)) {
                studentSec = row[key];
              }
            });

            if (studentName) {
              const nameStr = studentName.toString().trim();
              let targetClassKey = sheetName;

              if (studentClass) {
                const { cls, sec } = parseClassSection(studentClass, studentSec);
                targetClassKey = `${cls} ${sec}`.trim();
              } else {
                const matchedStudent = activeStudents.find(s => s.Name?.toLowerCase().trim() === nameStr.toLowerCase());
                if (matchedStudent) {
                  targetClassKey = `${matchedStudent.Class} ${matchedStudent.Section || ''}`.trim();
                }
              }

              if (!newAttendanceData[targetClassKey]) {
                newAttendanceData[targetClassKey] = {};
              }
              if (!newAttendanceData[targetClassKey][nameStr]) {
                newAttendanceData[targetClassKey][nameStr] = {};
              }

              Object.keys(row).forEach(key => {
                const normDate = normalizeDate(key);
                if (normDate) {
                  const val = (row[key] || '').toString().trim().toUpperCase();
                  if (val === 'P' || val === 'A') {
                    newAttendanceData[targetClassKey][nameStr][normDate] = val;
                    recordCount++;
                  }
                }
              });
            }
          });
        });

        setAttendanceData(newAttendanceData);
        showToast(`Attendance loaded: ${recordCount} records synchronized!`, 'success');
      } catch (err) {
        console.error(err);
        showToast('Error reading attendance Excel file.', 'error');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  const handleSave = () => {
    const wb = XLSX.utils.book_new();

    classSections.forEach(cls => {
      // Filter by class numeric range if enabled
      if (enableExportFilter) {
        const match = cls.match(/\d+/);
        const classNum = match ? parseInt(match[0], 10) : 0;
        if (classNum < exportStartClass || classNum > exportEndClass) {
          return;
        }
      }

      const studentsInClass = activeStudents.filter(s => `${s.Class} ${s.Section || ''}`.trim() === cls);
      if (studentsInClass.length === 0) return;

      const sheetData = [];
      const classAttendance = attendanceData[cls] || {};

      const allDates = new Set();
      Object.values(classAttendance).forEach(studentRecords => {
        Object.keys(studentRecords).forEach(date => allDates.add(date));
      });
      allDates.add(selectedDate);
      
      const sortedDates = Array.from(allDates).sort();

      studentsInClass.forEach(student => {
        const row = {
          'Roll No': student.IdentifierValue || student.RollNo || '',
          'Name': student.Name,
          'Class': student.Class,
          'Section': student.Section || '',
          'Batch': student.Batch || ''
        };

        sortedDates.forEach(date => {
          row[date] = classAttendance[student.Name]?.[date] || '-';
        });

        sheetData.push(row);
      });

      if (sheetData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(sheetData);
        const baseSheetName = cls.replace(/[[\]*?/\\]/g, '').substring(0, 28) || 'Class';
        let safeSheetName = baseSheetName;
        let counter = 1;
        while (wb.SheetNames.includes(safeSheetName)) {
          safeSheetName = `${baseSheetName.substring(0, 25)}_${counter++}`;
        }
        XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
      }
    });

    if (wb.SheetNames.length === 0) {
      showToast("No attendance data to save.", "warning");
      return;
    }

    XLSX.writeFile(wb, 'attendance_records.xlsx');
    showToast("Attendance workbook exported successfully!", "success");
  };

  const isPastDate = selectedDate !== new Date().toISOString().split('T')[0];

  const currentClassStudents = activeStudents.filter(s => {
    const matchesClass = selectedClasses.includes(`${s.Class} ${s.Section || ''}`.trim());
    const matchesBatch = selectedBatch === 'All' || (s.Batch && String(s.Batch) === selectedBatch);
    return matchesClass && matchesBatch;
  });

  const setAttendanceStatus = (studentName, status, targetClassOverride) => {
    setAttendanceData(prev => {
      const studentObj = currentClassStudents.find(s => 
        s.Name === studentName && (!targetClassOverride || `${s.Class} ${s.Section || ''}`.trim() === targetClassOverride)
      ) || currentClassStudents.find(s => s.Name === studentName);

      const targetClass = targetClassOverride || (studentObj ? `${studentObj.Class} ${studentObj.Section || ''}`.trim() : selectedClasses[0]);

      const currentClassData = prev[targetClass] || {};
      const studentData = currentClassData[studentName] || {};
      
      const newStatus = studentData[selectedDate] === status ? '' : status;

      // Play ultra-responsive synthesizer sound
      if (newStatus === 'P') {
        playPresentSound();
      } else if (newStatus === 'A') {
        playAbsentSound();
      } else {
        playClickSound();
      }

      return {
        ...prev,
        [targetClass]: {
          ...currentClassData,
          [studentName]: {
            ...studentData,
            [selectedDate]: newStatus
          }
        }
      };
    });
  };

  const markRemainingAbsent = () => {
    playAbsentSound();
    setAttendanceData(prev => {
      const newData = { ...prev };
      currentClassStudents.forEach(student => {
        const targetClass = `${student.Class} ${student.Section || ''}`.trim();
        if (!newData[targetClass]) newData[targetClass] = {};
        if (!newData[targetClass][student.Name]) newData[targetClass][student.Name] = {};
        
        if (newData[targetClass][student.Name][selectedDate] !== 'P') {
          newData[targetClass][student.Name][selectedDate] = 'A';
        }
      });
      return newData;
    });
    showToast("Remaining students marked absent.", "info");
  };

  const resetClassAttendance = () => {
    playClickSound();
    setAttendanceData(prev => {
      const newData = { ...prev };
      currentClassStudents.forEach(student => {
        const targetClass = `${student.Class} ${student.Section || ''}`.trim();
        if (!newData[targetClass]) newData[targetClass] = {};
        if (!newData[targetClass][student.Name]) newData[targetClass][student.Name] = {};
        newData[targetClass][student.Name][selectedDate] = '';
      });
      return newData;
    });
    setAllMarkState('present');
    showToast("Attendance reset to 0.", "info");
  };

  const markAllPresent = () => {
    playCompleteSound();
    setAttendanceData(prev => {
      const newData = { ...prev };
      currentClassStudents.forEach(student => {
        const targetClass = `${student.Class} ${student.Section || ''}`.trim();
        if (!newData[targetClass]) newData[targetClass] = {};
        if (!newData[targetClass][student.Name]) newData[targetClass][student.Name] = {};
        newData[targetClass][student.Name][selectedDate] = 'P';
      });
      return newData;
    });
    setAllMarkState('absent');
    showToast("All students marked present.", "success");
  };

  const handleMarkAllToggle = () => {
    let targetStatus = '';
    let nextState = 'present';

    if (allMarkState === 'present') {
      targetStatus = 'P';
      nextState = 'absent';
      playCompleteSound();
    } else if (allMarkState === 'absent') {
      targetStatus = 'A';
      nextState = 'clear';
      playAbsentSound();
    } else if (allMarkState === 'clear') {
      targetStatus = '';
      nextState = 'present';
      playClickSound();
    }
    
    setAttendanceData(prev => {
      const newData = { ...prev };
      
      currentClassStudents.forEach(student => {
        const targetClass = `${student.Class} ${student.Section || ''}`.trim();
        if (!newData[targetClass]) newData[targetClass] = {};
        if (!newData[targetClass][student.Name]) newData[targetClass][student.Name] = {};
        
        newData[targetClass][student.Name][selectedDate] = targetStatus;
      });

      return newData;
    });

    setAllMarkState(nextState);
  };

  const totalCount = currentClassStudents.length;
  let presentCount = 0;
  let absentCount = 0;
  currentClassStudents.forEach(student => {
    const targetClass = `${student.Class} ${student.Section || ''}`.trim();
    const status = attendanceData[targetClass]?.[student.Name]?.[selectedDate];
    if (status === 'P') presentCount++;
    if (status === 'A') absentCount++;
  });

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflowY: activeView === 'register' ? 'auto' : 'hidden', background: activeView === 'game' ? '#0a0a1a' : '#fcfbfa', transition: 'background 0.5s ease' }}>
      
      {/* 3D Decorative Bubbles Background for Register View */}
      {activeView === 'register' && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 0 }}>
          <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
            <Suspense fallback={null}>
              <ThreeScene />
            </Suspense>
          </Canvas>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              zIndex: 99999,
              background: toast.type === 'error' ? '#d32f2f' : toast.type === 'success' ? '#2e7d32' : toast.type === 'warning' ? '#f57c00' : '#4488ff',
              color: '#fff',
              padding: '0.7rem 1.5rem',
              borderRadius: '25px',
              boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
              fontFamily: 'Montserrat, sans-serif',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              pointerEvents: 'none'
            }}
          >
            <span>{toast.type === 'success' ? '✓' : toast.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation Bar - Strict Single Line Ribbon */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
          height: '52px',
          padding: '0 0.8rem',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'nowrap', 
          whiteSpace: 'nowrap',
          gap: '0.6rem',
          background: activeView === 'game' ? 'rgba(10,10,26,0.92)' : 'rgba(252,251,250,0.95)', 
          backdropFilter: 'blur(16px)',
          borderBottom: activeView === 'game' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
          color: activeView === 'game' ? '#fff' : 'var(--text-main)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          overflowX: 'auto',
          scrollbarWidth: 'none'
        }}
      >
        {/* Left: ATW Logo Brand & Back Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <ATWLogo size={24} showText={true} isDark={activeView === 'game'} />
          <button 
            onClick={onBack}
            style={{ 
              fontFamily: 'Cormorant Garamond', fontSize: '0.95rem', fontStyle: 'italic',
              background: 'transparent', border: 'none', cursor: 'pointer', 
              color: activeView === 'game' ? '#fff' : 'var(--text-main)',
              borderBottom: activeView === 'game' ? '1px solid rgba(255,255,255,0.4)' : '1px solid var(--text-accent)',
              whiteSpace: 'nowrap',
              padding: '0.2rem 0',
              flexShrink: 0
            }}
          >
            ← Directory
          </button>
        </div>

        {/* Center: Selectors & Live Stats */}
        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'nowrap', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            {mergeMode ? (
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'nowrap', maxHeight: '36px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {classSections.map(cls => (
                  <label key={cls} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.15)', padding: '0.15rem 0.45rem', borderRadius: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={selectedClasses.includes(cls)} onChange={() => toggleClassSelection(cls)} />
                    <span style={{ color: activeView === 'game' ? '#fff' : '#000' }}>{cls}</span>
                  </label>
                ))}
              </div>
            ) : (
              <select 
                value={selectedClasses[0] || ''} 
                onChange={(e) => setSelectedClasses([e.target.value])}
                style={{ 
                  padding: '0.25rem 0.65rem', borderRadius: '16px', fontSize: '0.82rem', outline: 'none',
                  background: activeView === 'game' ? 'rgba(255,255,255,0.12)' : '#fff',
                  color: activeView === 'game' ? '#fff' : 'var(--text-main)',
                  border: activeView === 'game' ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e0e0e0',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {classSections.map(cls => <option key={cls} value={cls} style={{ color: '#000' }}>{cls}</option>)}
              </select>
            )}
            <button 
              onClick={() => setMergeMode(!mergeMode)} 
              title="Merge multiple classes"
              style={{ 
                background: mergeMode ? 'var(--text-accent)' : 'transparent', 
                color: mergeMode ? '#fff' : (activeView === 'game' ? '#fff' : 'var(--text-main)'), 
                border: `1px solid ${mergeMode ? 'var(--text-accent)' : (activeView === 'game' ? 'rgba(255,255,255,0.2)' : '#e0e0e0')}`, 
                padding: '0.25rem 0.55rem', borderRadius: '16px', fontSize: '0.76rem', cursor: 'pointer', transition: 'all 0.2s',
                fontWeight: 600
              }}>
              {mergeMode ? 'Done' : 'Merge'}
            </button>
          </div>

          {/* Batch Selector if batches exist */}
          {availableBatches.length > 1 && (
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              style={{
                padding: '0.25rem 0.55rem', borderRadius: '16px', fontSize: '0.8rem', outline: 'none',
                background: activeView === 'game' ? 'rgba(255,255,255,0.12)' : '#fff',
                color: activeView === 'game' ? '#fff' : 'var(--text-main)',
                border: activeView === 'game' ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e0e0e0',
                cursor: 'pointer'
              }}
            >
              {availableBatches.map(b => (
                <option key={b} value={b} style={{ color: '#000' }}>
                  {b === 'All' ? 'All Batches' : `Batch ${b}`}
                </option>
              ))}
            </select>
          )}

          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ 
              padding: '0.22rem 0.55rem', borderRadius: '16px', fontSize: '0.8rem', outline: 'none',
              background: activeView === 'game' ? 'rgba(255,255,255,0.12)' : '#fff',
              color: activeView === 'game' ? '#fff' : 'var(--text-main)',
              border: activeView === 'game' ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e0e0e0',
              cursor: 'pointer'
            }}
          />

          {/* Live Attendance Stats */}
          <div style={{
            display: 'flex', gap: '0.5rem', 
            background: activeView === 'game' ? 'rgba(255,255,255,0.08)' : '#fff', 
            padding: '0.22rem 0.65rem', borderRadius: '16px', 
            fontSize: '0.8rem', fontWeight: 600,
            border: activeView === 'game' ? '1px solid rgba(255,255,255,0.18)' : '1px solid #e0e0e0',
            whiteSpace: 'nowrap'
          }}>
            <span style={{ color: activeView === 'game' ? '#aaa' : '#666' }}>Total: {totalCount}</span>
            <span style={{ color: '#10b981' }}>P: {presentCount}</span>
            <span style={{ color: '#ef4444' }}>A: {absentCount}</span>
          </div>

          {/* Game Selector (only in game view) */}
          {activeView === 'game' && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.3rem', 
              background: 'rgba(255,255,255,0.08)', 
              padding: '0.18rem 0.55rem', 
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.18)'
            }}>
              <select 
                value={selectedGame} 
                onChange={(e) => setSelectedGame(e.target.value)}
                style={{ 
                  background: 'transparent', 
                  color: '#fff', 
                  border: 'none', 
                  outline: 'none', 
                  fontSize: '0.8rem', 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                <option value="constellation" style={{ color: '#000' }}>✨ Constellation</option>
                <option value="bubble" style={{ color: '#000' }}>🫧 Bubble Popper</option>
                <option value="falling" style={{ color: '#000' }}>🎆 Festive Crackers</option>
                <option value="target" style={{ color: '#000' }}>🎯 Target Practice</option>
              </select>
            </div>
          )}

          {/* Eco Mode Toggle in Upper Ribbon */}
          <button 
            onClick={toggleEcoMode}
            title={ecoMode ? "Eco Mode is ON (Super Fast). Click to turn OFF." : "Eco Mode is OFF. Click to turn ON."}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              background: ecoMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.08)',
              color: ecoMode ? '#34d399' : '#94a3b8',
              border: ecoMode ? '1px solid rgba(52, 211, 153, 0.5)' : '1px solid rgba(255,255,255,0.2)',
              padding: '0.22rem 0.55rem',
              borderRadius: '16px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            {ecoMode ? "⚡ Eco: ON" : "Eco: OFF"}
          </button>

          {/* Sound FX Toggle in Upper Ribbon */}
          <button 
            onClick={toggleSound}
            title={soundEnabled ? "Sound Effects are ON. Click to mute." : "Sound Effects are MUTED. Click to enable."}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              background: soundEnabled ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.08)',
              color: soundEnabled ? '#38bdf8' : '#94a3b8',
              border: soundEnabled ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255,255,255,0.2)',
              padding: '0.22rem 0.55rem',
              borderRadius: '16px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span>{soundEnabled ? "Sound: ON" : "Muted"}</span>
          </button>
        </div>

        {/* Right Section: Mode Toggle & Actions */}
        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexShrink: 0 }}>
          <button 
            onClick={() => setActiveView(activeView === 'game' ? 'register' : 'game')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              background: 'transparent', color: activeView === 'game' ? '#fff' : 'var(--text-main)', 
              border: activeView === 'game' ? '1px solid rgba(255,255,255,0.25)' : '1px solid #e0e0e0', 
              padding: '0.25rem 0.75rem', borderRadius: '16px', cursor: 'pointer', fontSize: '0.8rem',
              fontWeight: 600,
              flexShrink: 0
            }}
          >
            {activeView === 'game' ? <List size={14} /> : <Gamepad2 size={14} />}
            {activeView === 'game' ? 'Register' : 'Game'}
          </button>

          {isPastDate && (
            <button 
              onClick={() => setEditMode(!editMode)} 
              title="Admin Edit Mode for past dates"
              style={{ 
                background: editMode ? '#ff9800' : 'transparent', 
                color: editMode ? '#fff' : (activeView === 'game' ? '#fff' : 'var(--text-main)'), 
                border: 'none', cursor: 'pointer', padding: '0.3rem', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <Settings size={16} />
            </button>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept=".xls,.xlsx" 
            onChange={handleFileUpload} 
          />

          <button 
            onClick={() => fileInputRef.current?.click()} 
            title="Import Attendance Excel"
            style={{ 
              background: 'transparent', 
              color: activeView === 'game' ? '#fff' : 'var(--text-main)', 
              border: 'none', 
              cursor: 'pointer', 
              padding: '0.3rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Upload size={16} />
          </button>

          <button 
            onClick={handleSave} 
            title="Save/Export to Excel"
            style={{ 
              background: 'transparent', 
              color: activeView === 'game' ? '#fff' : 'var(--text-main)', 
              border: 'none', 
              cursor: 'pointer', 
              padding: '0.3rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Save size={16} />
          </button>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div style={{ width: '100%', height: '100%', paddingTop: '52px' }}>
        {activeView === 'game' ? (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {selectedGame === 'constellation' && (
              <ConstellationGame 
                students={currentClassStudents} 
                attendanceData={attendanceData} 
                selectedClass={selectedClasses[0]} 
                selectedDate={selectedDate} 
                setAttendanceStatus={setAttendanceStatus}
                onToggleAttendance={setAttendanceStatus} 
                markRemainingAbsent={markRemainingAbsent}
                markAllPresent={markAllPresent}
                resetAttendance={resetClassAttendance}
                ecoMode={ecoMode}
                onToggleEcoMode={toggleEcoMode}
              />
            )}
            {selectedGame === 'bubble' && (
              <BubblePopperGame 
                students={currentClassStudents} 
                attendanceData={attendanceData} 
                selectedClass={selectedClasses[0]} 
                selectedDate={selectedDate} 
                setAttendanceStatus={setAttendanceStatus}
                onToggleAttendance={setAttendanceStatus} 
                markRemainingAbsent={markRemainingAbsent}
                ecoMode={ecoMode}
              />
            )}
            {selectedGame === 'falling' && (
              <FallingStarsGame 
                students={currentClassStudents} 
                attendanceData={attendanceData} 
                selectedClass={selectedClasses[0]} 
                selectedDate={selectedDate} 
                setAttendanceStatus={setAttendanceStatus}
                onToggleAttendance={setAttendanceStatus} 
                markRemainingAbsent={markRemainingAbsent}
                ecoMode={ecoMode}
              />
            )}
            {selectedGame === 'target' && (
              <TargetPracticeGame 
                students={currentClassStudents} 
                attendanceData={attendanceData} 
                selectedClass={selectedClasses[0]} 
                selectedDate={selectedDate} 
                setAttendanceStatus={setAttendanceStatus}
                onToggleAttendance={setAttendanceStatus} 
                markRemainingAbsent={markRemainingAbsent}
                ecoMode={ecoMode}
              />
            )}

            {/* Quick Action Floating Bar - For Bubble, Falling Stars, Target games */}
            {selectedGame !== 'constellation' && (
              <div style={{ 
                position: 'absolute', 
                bottom: '1rem', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                display: 'flex', 
                flexWrap: 'nowrap',
                gap: '0.4rem', 
                alignItems: 'center',
                background: 'rgba(10, 10, 26, 0.9)', 
                padding: '0.3rem 0.7rem', 
                borderRadius: '24px', 
                backdropFilter: 'blur(16px)', 
                border: '1px solid rgba(255, 255, 255, 0.16)', 
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                zIndex: 25,
                whiteSpace: 'nowrap'
              }}>
                <button 
                  onClick={handleMarkAllToggle}
                  style={{ 
                    background: allMarkState === 'present' ? '#2e7d32' : allMarkState === 'absent' ? '#d32f2f' : '#616161',
                    color: '#fff', 
                    border: '1px solid rgba(255,255,255,0.25)', 
                    padding: '0.35rem 0.85rem', 
                    borderRadius: '16px', 
                    cursor: 'pointer', 
                    fontSize: '0.78rem', 
                    fontWeight: 600,
                    fontFamily: 'Montserrat, sans-serif',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Mark All {allMarkState === 'present' ? 'Present' : allMarkState === 'absent' ? 'Absent' : 'Clear'}
                </button>
                <button 
                  onClick={markRemainingAbsent}
                  style={{ 
                    background: '#c62828', 
                    color: '#fff', 
                    border: '1px solid rgba(255,255,255,0.25)', 
                    padding: '0.35rem 0.85rem', 
                    borderRadius: '16px', 
                    cursor: 'pointer', 
                    fontSize: '0.78rem', 
                    fontWeight: 600,
                    fontFamily: 'Montserrat, sans-serif',
                    transition: 'all 0.2s ease' 
                  }}
                >
                  Remaining Absent
                </button>
                <button 
                  onClick={resetClassAttendance}
                  style={{ 
                    background: 'rgba(239, 68, 68, 0.25)', 
                    color: '#fca5a5', 
                    border: '1px solid rgba(239, 68, 68, 0.5)', 
                    padding: '0.35rem 0.75rem', 
                    borderRadius: '16px', 
                    cursor: 'pointer', 
                    fontSize: '0.78rem', 
                    fontWeight: 600,
                    fontFamily: 'Montserrat, sans-serif',
                    transition: 'all 0.2s ease' 
                  }}
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Register Table View */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ position: 'relative', zIndex: 1, padding: '2rem 10vw', maxWidth: '1200px', margin: '0 auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2.5rem', margin: 0 }}>Attendance Register</h2>
                <p style={{ color: 'var(--text-light)', margin: 0 }}>
                  Managing {selectedClasses.join(', ')} • {selectedDate}
                  {selectedBatch !== 'All' && ` • Batch ${selectedBatch}`}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={handleMarkAllToggle}
                  style={{ 
                    background: allMarkState === 'present' ? '#4caf50' : allMarkState === 'absent' ? '#f44336' : '#888', 
                    color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.9rem' 
                  }}
                >
                  Mark All {allMarkState === 'present' ? 'Present' : allMarkState === 'absent' ? 'Absent' : 'Clear'}
                </button>
                <button 
                  onClick={markRemainingAbsent}
                  style={{ background: '#f44336', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  Mark Remaining Absent
                </button>
              </div>
            </div>

            {/* Past date warning */}
            {isPastDate && !editMode && (
              <div style={{ background: '#fff3e0', borderLeft: '4px solid #ff9800', padding: '1rem', marginBottom: '1.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} color="#ff9800" />
                <span style={{ fontSize: '0.9rem', color: '#e65100' }}>Viewing historical record. Click the gear icon to enable edit mode.</span>
              </div>
            )}

            {/* Export Range Filter Panel */}
            <div style={{ background: '#fff', padding: '1.2rem 1.5rem', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  <input 
                    type="checkbox" 
                    checked={enableExportFilter} 
                    onChange={e => setEnableExportFilter(e.target.checked)} 
                  />
                  Filter Export by Class Range:
                </label>
              </div>

              {enableExportFilter && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>From Class:</span>
                    <input 
                      type="number" 
                      min="1" 
                      max="12" 
                      value={exportStartClass} 
                      onChange={e => setExportStartClass(parseInt(e.target.value, 10) || 1)}
                      style={{ width: '60px', padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>To Class:</span>
                    <input 
                      type="number" 
                      min="1" 
                      max="12" 
                      value={exportEndClass} 
                      onChange={e => setExportEndClass(parseInt(e.target.value, 10) || 12)}
                      style={{ width: '60px', padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Student List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {currentClassStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)', background: '#fff', borderRadius: '15px' }}>
                  No students found for this class and batch selection.
                </div>
              ) : (
                currentClassStudents.map((student, idx) => {
                  const targetClass = `${student.Class} ${student.Section || ''}`.trim();
                  const status = attendanceData[targetClass]?.[student.Name]?.[selectedDate] || '';
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.015 }}
                      key={`${student.Name}_${idx}`}
                      style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
                        background: '#fff', padding: '1rem 1.5rem', borderRadius: '12px', 
                        boxShadow: '0 2px 10px rgba(0,0,0,0.02)', borderLeft: `4px solid ${status === 'P' ? '#4caf50' : status === 'A' ? '#f44336' : 'transparent'}`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', color: 'var(--text-light)', fontWeight: 'bold', minWidth: '30px' }}>
                          {idx + 1}.
                        </div>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f5f5f5', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'Cormorant Garamond', fontSize: '1.2rem', color: 'var(--text-accent)' }}>
                          {student.Name ? String(student.Name).charAt(0) : '?'}
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {student.Name}
                            <span style={{ fontSize: '0.75rem', background: '#f0f0f0', padding: '0.2rem 0.5rem', borderRadius: '10px', color: 'var(--text-light)' }}>
                              {targetClass}
                            </span>
                            {student.Batch && (
                              <span style={{ fontSize: '0.75rem', background: 'rgba(153, 127, 99, 0.15)', color: 'var(--text-accent)', padding: '0.2rem 0.5rem', borderRadius: '10px', fontWeight: 600 }}>
                                Batch {student.Batch}
                              </span>
                            )}
                          </h3>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-light)' }}>{student.IdentifierField || 'Roll No'}: {student.IdentifierValue || student.RollNo || 'N/A'}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => setAttendanceStatus(student.Name, 'P', targetClass)}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                            background: status === 'P' ? '#4caf50' : '#f5f5f5', 
                            color: status === 'P' ? '#fff' : '#666',
                            border: 'none', padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s',
                            opacity: (isPastDate && !editMode) ? 0.5 : 1
                          }}
                        >
                          <Check size={16} /> Present
                        </button>
                        <button 
                          onClick={() => setAttendanceStatus(student.Name, 'A', targetClass)}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                            background: status === 'A' ? '#f44336' : '#f5f5f5', 
                            color: status === 'A' ? '#fff' : '#666',
                            border: 'none', padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s',
                            opacity: (isPastDate && !editMode) ? 0.5 : 1
                          }}
                        >
                          <X size={16} /> Absent
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
