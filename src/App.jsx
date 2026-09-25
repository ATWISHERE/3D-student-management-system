import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Search, Upload } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls, Scroll } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import ThreeScene from './ThreeBackground';
import FeeModal from './FeeModal';
import AttendanceSystem from './AttendanceSystem';
import './index.css';

function App() {
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('studentsCache');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('studentsCache', JSON.stringify(students));
  }, [students]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeClass, setActiveClass] = useState('All');
  const [activeSection, setActiveSection] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activePage, setActivePage] = useState('directory'); // Router State
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      
      const allStudentsData = [];

      wb.SheetNames.forEach(sheetName => {
        if (sheetName.toLowerCase().includes('all student') || sheetName.toLowerCase() === 'all') {
          return;
        }
        
        const ws = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(ws);
        
        data.forEach(row => {
          const studentObj = { ...row, sheetCategory: sheetName };
          
          Object.keys(row).forEach(key => {
            const lowerKey = key.toLowerCase().trim();
            if (lowerKey === 'class') studentObj.Class = row[key];
            if (lowerKey === 'section' || lowerKey === 'sec') studentObj.Section = row[key];
            if (lowerKey === 'name') studentObj.Name = row[key];
          });

          if (!studentObj.Class) {
            studentObj.Class = sheetName;
          }

          allStudentsData.push(studentObj);
        });
      });

      setStudents(allStudentsData);
      setActiveCategory('All');
      setActiveClass('All');
      setActiveSection('All');
    };
    reader.readAsBinaryString(file);
  };

  const displayStudents = students.length > 0 ? students : [
    { Name: 'John Doe', Class: '10th', Section: 'A', RollNo: '101', sheetCategory: 'Middle' },
    { Name: 'Jane Smith', Class: 'UKG', Section: 'B', RollNo: '22', sheetCategory: 'UKG' },
    { Name: 'Sam Wilson', Class: '5th', Section: 'C', RollNo: '45', sheetCategory: 'Primary' },
    { Name: 'Alice Brown', Class: '8th', Section: 'A', RollNo: '12', sheetCategory: 'Middle' },
    { Name: 'Emma Watson', Class: '10th', Section: 'B', RollNo: '105', sheetCategory: 'Middle' },
    { Name: 'David Clark', Class: '4th', Section: 'A', RollNo: '33', sheetCategory: 'Primary' }
  ];

  const categories = ['All', ...new Set(displayStudents.map(s => s.sheetCategory).filter(Boolean))];

  const availableClasses = ['All', ...new Set(
    displayStudents
      .filter(s => activeCategory === 'All' || s.sheetCategory === activeCategory)
      .map(s => s.Class?.toString()?.trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const availableSections = ['All', ...new Set(
    displayStudents
      .filter(s => 
        (activeCategory === 'All' || s.sheetCategory === activeCategory) &&
        (activeClass === 'All' || s.Class?.toString()?.trim() === activeClass)
      )
      .map(s => s.Section)
      .filter(Boolean)
  )].sort();

  const filteredStudents = displayStudents.filter(student => {
    const matchesCategory = activeCategory === 'All' || student.sheetCategory === activeCategory;
    const matchesClass = activeClass === 'All' || student.Class?.toString()?.trim() === activeClass;
    const matchesSection = activeSection === 'All' || student.Section === activeSection;
                      
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = Object.values(student).some(value => {
      if (value === null || value === undefined) return false;
      return value.toString().toLowerCase().includes(searchLower);
    });

    return matchesCategory && matchesClass && matchesSection && matchesSearch;
  });

  if (activePage === 'attendance') {
    return (
      <AttendanceSystem 
        students={filteredStudents} 
        onBack={() => setActivePage('directory')} 
      />
    );
  }

  return (
    <>
      <div className="canvas-wrapper">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          {/* 3D Scene reacting to scroll */}
          <ThreeScene 
            availableSections={availableSections} 
            activeSection={activeSection} 
            setActiveSection={setActiveSection} 
          />
        </Canvas>
      </div>

      <div className="scroll-container">
        
        <section className="hero-section">
          <motion.h1 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 1, ease: "easeOut" }}
          >
            ATW <i>Student</i> Management
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            The Premium Student Directory Experience
          </motion.p>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            style={{ marginTop: '3rem', fontSize: '0.8rem', letterSpacing: '0.2em', color: 'var(--text-light)', textTransform: 'uppercase' }}
          >
            Scroll to discover
          </motion.div>
        </section>

        <section className="interactive-section">
          {students.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="upload-area" 
              onClick={() => fileInputRef.current.click()}
            >
              <Upload size={48} color="var(--text-accent)" style={{ margin: '0 auto' }} />
              <p>Upload 'all student.xl' File</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".xls,.xlsx" 
                onChange={handleFileUpload} 
              />
            </motion.div>
          )}

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="controls-wrapper"
          >
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search students..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Top Level: Categories */}
            <div className="tabs">
              {categories.map(cat => (
                <button 
                  key={cat}
                  className={`tab-btn ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => {
                    setActiveCategory(cat);
                    setActiveClass('All');
                    setActiveSection('All');
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Second Level: Classes (Only show if a category is selected and has classes) */}
            {activeCategory !== 'All' && availableClasses.length > 1 && (
              <div className="tabs" style={{ marginTop: '1rem', gap: '1rem', opacity: 0.9 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', alignSelf: 'center', fontStyle: 'italic' }}>Class:</span>
                {availableClasses.map(cls => (
                  <button 
                    key={cls}
                    className={`tab-btn ${activeClass === cls ? 'active' : ''}`}
                    onClick={() => {
                      setActiveClass(cls);
                      setActiveSection('All');
                    }}
                    style={{ fontSize: '0.8rem', paddingBottom: '0.2rem' }}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            )}
            
            {activeClass !== 'All' && availableSections.length > 1 && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-accent)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                <span style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '20px', background: 'rgba(255,255,255,0.5)' }}>
                  Click a 3D bubble to filter by section
                </span>
              </motion.div>
            )}
          </motion.div>

          <div className="student-grid">
            {filteredStudents.slice(0, 50).map((student, idx) => (
              <div 
                className="student-card" 
                key={`${student.Name}-${idx}`}
                onClick={() => setSelectedStudent(student)}
                style={{ cursor: 'pointer' }}
                title="Click to view Fee Management"
              >
                <div className="photo-placeholder">
                  <span style={{ fontFamily: 'Cormorant Garamond', fontSize: '2rem', fontStyle: 'italic' }}>
                    {student.Name ? student.Name.charAt(0) : '?'}
                  </span>
                </div>
                <div className="student-info">
                  <h3>{student.Name || student.name || 'Unknown'}</h3>
                  <div className="class-badge">
                    {student.Class || student.class || student.sheetCategory} 
                    {student.Section ? ` • Sec ${student.Section}` : ''}
                  </div>
                  
                  <div className="student-details">
                    {Object.entries(student).map(([key, value]) => {
                      if (['Name', 'name', 'Class', 'class', 'Section', 'sheetCategory'].includes(key)) return null;
                      if (!value) return null;
                      return (
                        <div className="detail-row" key={key}>
                          <span>{key}</span>
                          <span>{value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredStudents.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.5rem', fontStyle: 'italic' }}>No students found matching your criteria.</p>
              </div>
            )}
          </div>

          {filteredStudents.length > 50 && (
            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <p style={{ color: 'var(--text-light)', fontStyle: 'italic', fontFamily: 'Cormorant Garamond', fontSize: '1.2rem' }}>
                Showing 50 of {filteredStudents.length} students. Please use the search bar to find specific students.
              </p>
            </div>
          )}
        </section>

        <section className="footer-spacer">
          <p>ATW Student Management © 2026</p>
        </section>

      </div>

      <motion.button 
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => setActivePage('attendance')}
        style={{
          position: 'fixed',
          bottom: '2rem', right: '2rem',
          background: 'var(--text-accent)', color: '#fff',
          padding: '1rem 2rem', borderRadius: '30px',
          border: 'none', cursor: 'pointer',
          fontFamily: 'Cormorant Garamond', fontSize: '1.2rem', fontStyle: 'italic',
          boxShadow: '0 10px 25px rgba(153, 127, 99, 0.4)',
          zIndex: 100
        }}
      >
        Take Attendance ✨
      </motion.button>

      {selectedStudent && (
        <FeeModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}
    </>
  );
}

export default App;
