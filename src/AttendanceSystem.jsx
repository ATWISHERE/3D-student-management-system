import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { Settings, Upload, Save, Calendar, Check, X, ShieldAlert, Gamepad2, List } from 'lucide-react';
import ConstellationGame from './ConstellationGame';
import BubblePopperGame from './BubblePopperGame';
import FallingStarsGame from './FallingStarsGame';
import TargetPracticeGame from './TargetPracticeGame';

export default function AttendanceSystem({ students, onBack }) {
  // Navigation State
  const [activeView, setActiveView] = useState('game'); // 'game' or 'register'
  const [selectedGame, setSelectedGame] = useState('constellation');

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

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editMode, setEditMode] = useState(false); // Admin edit mode for past dates
  const fileInputRef = useRef(null);

  const activeStudents = students.filter(s => s.Name && s.Class);
  const classSections = [...new Set(activeStudents.map(s => `${s.Class} ${s.Section || ''}`.trim()))].sort();
  
  const [selectedClass, setSelectedClass] = useState(classSections[0] || '');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      
      const newAttendanceData = { ...attendanceData };

      wb.SheetNames.forEach(sheetName => {
        const ws = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (!newAttendanceData[sheetName]) {
          newAttendanceData[sheetName] = {};
        }

        data.forEach(row => {
          const studentName = row['Name'];
          if (studentName) {
            if (!newAttendanceData[sheetName][studentName]) {
              newAttendanceData[sheetName][studentName] = {};
            }
            Object.keys(row).forEach(key => {
              if (key !== 'Name' && key !== 'RollNo') {
                newAttendanceData[sheetName][studentName][key] = row[key];
              }
            });
          }
        });
      });

      setAttendanceData(newAttendanceData);
      alert("Attendance data loaded successfully!");
    };
    reader.readAsBinaryString(file);
  };

  const handleSave = () => {
    const wb = XLSX.utils.book_new();

    classSections.forEach(cls => {
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
        const row = { Name: student.Name, RollNo: student.RollNo || '' };
        sortedDates.forEach(date => {
          row[date] = classAttendance[student.Name]?.[date] || '';
        });
        sheetData.push(row);
      });

      if (sheetData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(sheetData);
        const safeSheetName = cls.replace(/[\[\]\*\?\/\\\:]/g, '').substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, safeSheetName || 'Unnamed');
      }
    });

    if (wb.SheetNames.length === 0) {
      alert("No attendance data to save.");
      return;
    }

    XLSX.writeFile(wb, 'attendance.xlsx');
  };

  const isPastDate = selectedDate !== new Date().toISOString().split('T')[0];

  const setAttendanceStatus = (studentName, status) => {
    if (isPastDate && !editMode) {
      alert("Please enable Admin Edit Mode (Gear Icon) to change past attendance.");
      return;
    }

    setAttendanceData(prev => {
      const currentClassData = prev[selectedClass] || {};
      const studentData = currentClassData[studentName] || {};
      
      const newStatus = studentData[selectedDate] === status ? '' : status;

      return {
        ...prev,
        [selectedClass]: {
          ...currentClassData,
          [studentName]: {
            ...studentData,
            [selectedDate]: newStatus
          }
        }
      };
    });
  };

  const markAllPresent = () => {
    if (isPastDate && !editMode) {
      alert("Please enable Admin Edit Mode to change past attendance.");
      return;
    }
    setAttendanceData(prev => {
      const currentClassData = { ...(prev[selectedClass] || {}) };
      
      currentClassStudents.forEach(student => {
        const studentData = { ...(currentClassData[student.Name] || {}) };
        studentData[selectedDate] = 'P';
        currentClassData[student.Name] = studentData;
      });

      return {
        ...prev,
        [selectedClass]: currentClassData
      };
    });
  };

  const markRemainingAbsent = () => {
    if (isPastDate && !editMode) {
      alert("Please enable Admin Edit Mode to change past attendance.");
      return;
    }
    setAttendanceData(prev => {
      const currentClassData = { ...(prev[selectedClass] || {}) };
      
      currentClassStudents.forEach(student => {
        const studentData = { ...(currentClassData[student.Name] || {}) };
        
        // If they are not marked 'P', mark them 'A'
        if (studentData[selectedDate] !== 'P') {
          studentData[selectedDate] = 'A';
        }
        currentClassData[student.Name] = studentData;
      });

      return {
        ...prev,
        [selectedClass]: currentClassData
      };
    });
  };

  const currentClassStudents = activeStudents.filter(s => `${s.Class} ${s.Section || ''}`.trim() === selectedClass);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflowY: activeView === 'register' ? 'auto' : 'hidden', background: activeView === 'game' ? '#0a0a1a' : '#fcfbfa', transition: 'background 0.5s ease' }}>
      
      {/* Top Navigation Bar & Global Selectors */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
          padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
          background: activeView === 'game' ? 'rgba(10,10,26,0.8)' : 'rgba(252,251,250,0.9)', 
          backdropFilter: 'blur(10px)',
          borderBottom: activeView === 'game' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
          color: activeView === 'game' ? '#fff' : 'var(--text-main)',
          transition: 'all 0.5s ease'
        }}
      >
        <button 
          onClick={onBack}
          style={{ 
            fontFamily: 'Cormorant Garamond', fontSize: '1rem', fontStyle: 'italic',
            background: 'transparent', border: 'none', cursor: 'pointer', 
            color: activeView === 'game' ? '#fff' : 'var(--text-main)',
            borderBottom: activeView === 'game' ? '1px solid rgba(255,255,255,0.5)' : '1px solid var(--text-accent)'
          }}
        >
          ← Back
        </button>

        {/* Pinned Minimal Selectors */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{ 
              padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.9rem', outline: 'none',
              background: activeView === 'game' ? 'rgba(255,255,255,0.1)' : '#fff',
              color: activeView === 'game' ? '#fff' : 'var(--text-main)',
              border: activeView === 'game' ? '1px solid rgba(255,255,255,0.2)' : '1px solid #eaeaea'
            }}
          >
            {classSections.map(cls => <option key={cls} value={cls} style={{ color: '#000' }}>{cls}</option>)}
          </select>

          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ 
              padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.9rem', outline: 'none',
              background: activeView === 'game' ? 'rgba(255,255,255,0.1)' : '#fff',
              color: activeView === 'game' ? '#fff' : 'var(--text-main)',
              border: activeView === 'game' ? '1px solid rgba(255,255,255,0.2)' : '1px solid #eaeaea'
            }}
          />
        </div>

        {/* Game Selector (only in game view) */}
        {activeView === 'game' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.8rem', borderRadius: '20px' }}>
            <label style={{ fontSize: '0.8rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Game:</label>
            <select 
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              style={{ background: 'transparent', color: '#fff', border: 'none', outline: 'none', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <option value="constellation" style={{ color: '#000' }}>Constellation</option>
              <option value="bubble" style={{ color: '#000' }}>Bubble Popper</option>
              <option value="falling" style={{ color: '#000' }}>Falling Stars</option>
              <option value="target" style={{ color: '#000' }}>Target Practice</option>
            </select>
          </div>
        )}

        {/* View Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', background: activeView === 'game' ? 'rgba(255,255,255,0.1)' : '#eaeaea', padding: '0.3rem', borderRadius: '30px' }}>
          <button
            onClick={() => setActiveView('game')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 1rem', borderRadius: '25px', border: 'none', cursor: 'pointer',
              background: activeView === 'game' ? '#fff' : 'transparent',
              color: activeView === 'game' ? '#000' : 'inherit',
              transition: 'all 0.3s'
            }}
          >
            <Gamepad2 size={16} /> Game View
          </button>
          <button
            onClick={() => setActiveView('register')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 1rem', borderRadius: '25px', border: 'none', cursor: 'pointer',
              background: activeView === 'register' ? 'var(--text-main)' : 'transparent',
              color: activeView === 'register' ? '#fff' : 'inherit',
              transition: 'all 0.3s'
            }}
          >
            <List size={16} /> Register
          </button>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div style={{ width: '100%', height: '100%', paddingTop: '80px' }}>
        
        {activeView === 'game' ? (
          <>
            {selectedGame === 'constellation' && <ConstellationGame students={currentClassStudents} attendanceData={attendanceData} selectedClass={selectedClass} selectedDate={selectedDate} setAttendanceStatus={setAttendanceStatus} markRemainingAbsent={markRemainingAbsent} />}
            {selectedGame === 'bubble' && <BubblePopperGame students={currentClassStudents} attendanceData={attendanceData} selectedClass={selectedClass} selectedDate={selectedDate} setAttendanceStatus={setAttendanceStatus} markRemainingAbsent={markRemainingAbsent} />}
            {selectedGame === 'falling' && <FallingStarsGame students={currentClassStudents} attendanceData={attendanceData} selectedClass={selectedClass} selectedDate={selectedDate} setAttendanceStatus={setAttendanceStatus} markRemainingAbsent={markRemainingAbsent} />}
            {selectedGame === 'target' && <TargetPracticeGame students={currentClassStudents} attendanceData={attendanceData} selectedClass={selectedClass} selectedDate={selectedDate} setAttendanceStatus={setAttendanceStatus} markRemainingAbsent={markRemainingAbsent} />}
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem', paddingBottom: '100px' }}
          >
            {/* Admin Header Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
              <h1 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2.5rem', color: 'var(--text-main)', margin: 0 }}>
                Admin Register
              </h1>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => fileInputRef.current.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid var(--text-main)', padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer', color: 'var(--text-main)' }}
                >
                  <Upload size={16} /> Load Excel
                </button>
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xls,.xlsx" onChange={handleFileUpload} />
                
                <button 
                  onClick={handleSave}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--text-accent)', color: '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '20px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(153, 127, 99, 0.3)' }}
                >
                  <Save size={16} /> Save to Excel
                </button>
              </div>
            </div>

            {/* Admin Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: '#fff', padding: '1.5rem', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin Edit Mode</label>
                  <button 
                    onClick={() => setEditMode(!editMode)}
                    style={{ 
                      background: editMode ? 'var(--text-main)' : '#f0f0f0', 
                      color: editMode ? '#fff' : 'var(--text-light)', 
                      border: 'none', padding: '0.8rem', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.3s' 
                    }}
                    title="Toggle Admin Edit Mode for past dates"
                  >
                    {editMode ? <ShieldAlert size={20} /> : <Settings size={20} />}
                  </button>
                </div>
              </div>
              <button 
                onClick={markAllPresent}
                style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Mark All Present
              </button>
            </div>

            {/* Warning Banner for Past Dates */}
            {isPastDate && (
              <div style={{ padding: '1rem', background: editMode ? '#fff3cd' : '#f8d7da', color: editMode ? '#856404' : '#721c24', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <ShieldAlert size={20} />
                <span style={{ fontSize: '0.9rem' }}>
                  You are viewing a past date. 
                  {editMode ? " Admin Edit Mode is ON. You can modify records." : " Admin Edit Mode is OFF. Records are locked. Click the gear icon to unlock."}
                </span>
              </div>
            )}

            {/* Student List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {currentClassStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)', background: '#fff', borderRadius: '15px' }}>
                  No students found for this class.
                </div>
              ) : (
                currentClassStudents.map((student, idx) => {
                  const status = attendanceData[selectedClass]?.[student.Name]?.[selectedDate] || '';
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                      key={student.Name}
                      style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
                        background: '#fff', padding: '1rem 1.5rem', borderRadius: '12px', 
                        boxShadow: '0 2px 10px rgba(0,0,0,0.02)', borderLeft: `4px solid ${status === 'P' ? '#4caf50' : status === 'A' ? '#f44336' : 'transparent'}`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f5f5f5', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'Cormorant Garamond', fontSize: '1.2rem', color: 'var(--text-accent)' }}>
                          {student.Name.charAt(0)}
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>{student.Name}</h3>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-light)' }}>Roll No: {student.RollNo || 'N/A'}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => setAttendanceStatus(student.Name, 'P')}
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
                          onClick={() => setAttendanceStatus(student.Name, 'A')}
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
