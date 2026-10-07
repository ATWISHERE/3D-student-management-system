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
  const [previewData, setPreviewData] = useState(null); // Intelligent Excel Parsing mapping state
  const [columnMap, setColumnMap] = useState({ name: '', class: '', section: '', identifier: '' });
  const [showDefaulters, setShowDefaulters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef(null);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, activeClass, activeSection, searchQuery, showDefaulters]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const allHeaders = new Set();
      const rawData = [];

      // Intelligent sheet selection
      let sheetsToProcess = [];
      const hasAllStudents = wb.SheetNames.some(s => s.toLowerCase().includes('all student'));
      if (hasAllStudents) {
        sheetsToProcess = wb.SheetNames.filter(s => s.toLowerCase().includes('all student'));
      } else {
        // Exclude common non-data sheets
        sheetsToProcess = wb.SheetNames.filter(s => !['dashboard', 'summary', 'totals', 'raw entries', 'classwise summary', 'class totals'].includes(s.toLowerCase()));
      }

      sheetsToProcess.forEach(sheetName => {
        const ws = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (data.length > 0) {
          Object.keys(data[0]).forEach(k => allHeaders.add(k));
          data.forEach(row => rawData.push({ ...row, _sheet: sheetName }));
        }
      });

      const headers = Array.from(allHeaders);
      
      // Auto-guess columns (The "Intelligent" Part)
      let bestName = '', bestClass = '', bestSec = '', bestId = '';
      headers.forEach(h => {
        const l = h.toLowerCase().trim();
        if (['name', 'student name', 'fullname', 'student\'s name', 'studentname'].includes(l)) bestName = h;
        if (['class', 'std', 'standard', 'grade'].includes(l)) bestClass = h;
        if (['sec', 'section', 'batch'].includes(l)) bestSec = h;
        if (['roll', 'roll no', 'rollno', 'fee book', 'fee book no', 'id', 'admission no'].includes(l)) bestId = h;
      });

      setColumnMap({ name: bestName, class: bestClass, section: bestSec, identifier: bestId });
      setPreviewData({ headers, rawData });
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  const confirmMapping = () => {
    if (!previewData) return;
    const feeConfig = JSON.parse(localStorage.getItem('feeConfig') || '{"count":3,"amount":500}');

    const finalData = previewData.rawData.map(row => {
      const studentObj = { ...row, sheetCategory: row._sheet };
      studentObj.Name = row[columnMap.name] || 'Unknown';
      studentObj.Class = columnMap.class ? row[columnMap.class] : row._sheet;
      studentObj.Section = columnMap.section ? row[columnMap.section] : '';
      studentObj.IdentifierField = columnMap.identifier || 'RollNo';
      studentObj.IdentifierValue = columnMap.identifier ? row[columnMap.identifier] : (row['RollNo'] || row['Roll No'] || '');

      // Auto-sync fees
      const installments = Array(feeConfig.count).fill(false);
      Object.keys(row).forEach(key => {
        const k = key.toUpperCase();
        if (k.includes('INSTALL') && !k.match(/^INSTALLMENT$/i)) {
          const match = k.match(/(\d+)/);
          if (match) {
            const index = parseInt(match[1]) - 1;
            if (index >= 0 && index < feeConfig.count) {
              const val = row[key];
              if (val > 0 || (typeof val === 'string' && val.toLowerCase() === 'paid')) {
                installments[index] = true;
              }
            }
          }
        }
      });
      localStorage.setItem(`fee_${studentObj.Name}`, JSON.stringify(installments));

      return studentObj;
    });

    setStudents(finalData);
    setActiveCategory('All');
    setActiveClass('All');
    setActiveSection('All');
    setPreviewData(null);
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

  const today = new Date().toISOString().split('T')[0];
  const attendanceCache = JSON.parse(localStorage.getItem('attendanceDataCache') || '{}');
  const feeConfig = JSON.parse(localStorage.getItem('feeConfig') || '{"count":3,"amount":500}');

  const isDefaulter = (student) => {
    const targetClass = `${student.Class} ${student.Section || ''}`.trim();
    const status = attendanceCache[targetClass]?.[student.Name]?.[today];
    const isAbsent = status === 'A';
    
    const feeDataRaw = localStorage.getItem(`fee_${student.Name}`);
    let hasUnpaidFees = false;
    if (feeDataRaw) {
      const feeData = JSON.parse(feeDataRaw);
      hasUnpaidFees = feeData.includes(false);
    } else {
      // If no fee data exists, they haven't paid anything
      hasUnpaidFees = true;
    }
    
    return isAbsent || hasUnpaidFees;
  };

  const filteredStudents = displayStudents.filter(student => {
    const matchesCategory = activeCategory === 'All' || student.sheetCategory === activeCategory;
    const matchesClass = activeClass === 'All' || student.Class?.toString()?.trim() === activeClass;
    const matchesSection = activeSection === 'All' || student.Section === activeSection;
    const matchesDefaulter = showDefaulters ? isDefaulter(student) : true;
                      
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = Object.values(student).some(value => {
      if (value === null || value === undefined) return false;
      return value.toString().toLowerCase().includes(searchLower);
    });

    return matchesCategory && matchesClass && matchesSection && matchesDefaulter && matchesSearch;
  });

  const ITEMS_PER_PAGE = 50;
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const currentStudents = filteredStudents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const exportToExcel = () => {
    if (filteredStudents.length === 0) return;
    
    // Clean up internal fields before export so the excel looks nice
    const exportData = filteredStudents.map(s => {
      const { _sheet, sheetCategory, IdentifierField, IdentifierValue, ...cleanData } = s;
      return cleanData;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Filtered_Students");
    XLSX.writeFile(wb, "Filtered_Students_List.xlsx");
  };

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

      {/* Feature 1: Intelligent Excel Mapping Modal */}
      <AnimatePresence>
        {previewData && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '15px', width: '90%', maxWidth: '600px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2rem', marginTop: 0 }}>Map Your Columns</h2>
              <p style={{ color: 'var(--text-light)' }}>We analyzed your Excel file. Please confirm the mapping below to ensure accuracy.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold' }}>Student Name Column:</label>
                  <select value={columnMap.name} onChange={e => setColumnMap({...columnMap, name: e.target.value})} style={{ padding: '0.5rem', width: '250px', borderRadius: '8px' }}>
                    <option value="">-- Select --</option>
                    {previewData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold' }}>Class Column:</label>
                  <select value={columnMap.class} onChange={e => setColumnMap({...columnMap, class: e.target.value})} style={{ padding: '0.5rem', width: '250px', borderRadius: '8px' }}>
                    <option value="">Use Sheet Name if empty</option>
                    {previewData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold' }}>Section Column:</label>
                  <select value={columnMap.section} onChange={e => setColumnMap({...columnMap, section: e.target.value})} style={{ padding: '0.5rem', width: '250px', borderRadius: '8px' }}>
                    <option value="">Leave empty if none</option>
                    {previewData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold' }}>Identifier (Roll/Fee Book No):</label>
                  <select value={columnMap.identifier} onChange={e => setColumnMap({...columnMap, identifier: e.target.value})} style={{ padding: '0.5rem', width: '250px', borderRadius: '8px' }}>
                    <option value="">Leave empty if none</option>
                    {previewData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setPreviewData(null)} style={{ padding: '0.5rem 1rem', background: '#eaeaea', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={confirmMapping} style={{ padding: '0.5rem 1.5rem', background: 'var(--text-accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Confirm & Import</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            </motion.div>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept=".xls,.xlsx" 
            onChange={handleFileUpload} 
          />

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="controls-wrapper"
          >
            <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '600px', margin: '0 auto', marginBottom: '1.5rem', alignItems: 'center' }}>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search students..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, margin: 0 }}
              />
              <button 
                onClick={() => setShowDefaulters(!showDefaulters)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: showDefaulters ? '#d32f2f' : '#fff', color: showDefaulters ? '#fff' : '#d32f2f', border: '1px solid #d32f2f', padding: '0.8rem 1.5rem', borderRadius: '30px', cursor: 'pointer', fontFamily: 'Cormorant Garamond', fontSize: '1rem', whiteSpace: 'nowrap', transition: 'all 0.3s' }}
              >
                {showDefaulters ? 'Viewing Defaulters' : 'Show Defaulters'}
              </button>
              <button 
                onClick={exportToExcel}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#4caf50', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '30px', cursor: 'pointer', fontFamily: 'Cormorant Garamond', fontSize: '1rem', whiteSpace: 'nowrap', transition: 'all 0.3s' }}
              >
                Export Excel
              </button>
              {students.length > 0 && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--text-accent)', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '30px', cursor: 'pointer', fontFamily: 'Cormorant Garamond', fontSize: '1rem', whiteSpace: 'nowrap', boxShadow: '0 4px 15px rgba(153, 127, 99, 0.3)', transition: 'transform 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.transform='scale(1.05)'}
                  onMouseOut={e => e.currentTarget.style.transform='scale(1)'}
                >
                  <Upload size={18} /> Change File
                </button>
              )}
            </div>

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
            {currentStudents.map((student, idx) => (
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
                      const kLower = key.toLowerCase();
                      // Hide internal fields and unwanted raw columns
                      if (['name', 'class', 'section', 'sheetcategory', '_sheet', 'identifierfield', 'identifiervalue'].includes(kLower)) return null;
                      if (kLower.includes('install')) return null; // Hides '1 INSTALL', 'INSTALLMENT', etc.
                      if (value === null || value === undefined || value === '') return null;
                      
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

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '3rem' }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ padding: '0.8rem 1.5rem', borderRadius: '30px', border: '1px solid var(--border-color)', background: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, fontFamily: 'Cormorant Garamond', fontSize: '1rem' }}
              >Previous</button>
              
              <span style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.2rem', fontStyle: 'italic', color: 'var(--text-light)' }}>
                Page {currentPage} of {totalPages}
              </span>
              
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: '0.8rem 1.5rem', borderRadius: '30px', border: '1px solid var(--border-color)', background: '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, fontFamily: 'Cormorant Garamond', fontSize: '1rem' }}
              >Next</button>
            </div>
          )}
        </section>

        <section className="footer-spacer" style={{ padding: '4rem 2rem', background: '#fcfbfa', borderTop: '1px solid rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2rem', color: 'var(--text-main)', marginBottom: '1rem' }}>ABDUL TARIQUE WARSI</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', color: 'var(--text-light)', fontSize: '0.9rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📞 8770463418</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✉️ abdultarique5@gmail.com</span>
            </div>
            <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>ATW Student Management © 2026</p>
          </div>
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
