import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Search, Upload, RefreshCw, Star, Sparkles } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls, Scroll } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import ThreeScene from './ThreeBackground';
import FeeModal from './FeeModal';
import AttendanceSystem from './AttendanceSystem';
import { DEFAULT_STUDENTS, DEFAULT_DATASET_NAME } from './data/defaultStudents';
import { parseClassSection, guessExcelColumns, isIgnoredSheet } from './utils/excelParser';
import './index.css';

function App() {
  const [students, setStudents] = useState(() => {
    // 1. If user previously saved a custom dataset as their default, prioritize it
    const customDefault = localStorage.getItem('customDefaultStudents');
    if (customDefault) {
      try {
        const parsed = JSON.parse(customDefault);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }

    // 2. Check active cached session
    const saved = localStorage.getItem('studentsCache');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If it was the old 6 dummy students, auto-upgrade to real middle school dataset!
        const isOldDummy = Array.isArray(parsed) && parsed.length <= 6 && parsed.some(s => s.Name === 'John Doe');
        if (!isOldDummy && Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }

    // 3. Fallback to official built-in default dataset (1,141 middle school students)
    return DEFAULT_STUDENTS;
  });

  const [notification, setNotification] = useState(null);
  const [datasetLabel, setDatasetLabel] = useState(() => {
    return localStorage.getItem('datasetCustomLabel') || '';
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

  const isCustomDefaultSaved = Boolean(localStorage.getItem('customDefaultStudents'));
  const isUsingOfficialDefault = !isCustomDefaultSaved && (students === DEFAULT_STUDENTS || students.length === DEFAULT_STUDENTS.length);

  const setAsMyDefault = () => {
    localStorage.setItem('customDefaultStudents', JSON.stringify(students));
    const label = `My Default (${students.length} Students)`;
    localStorage.setItem('datasetCustomLabel', label);
    setDatasetLabel(label);
    setNotification({
      message: `Current dataset (${students.length} students) is now saved as your personal default!`,
      type: 'success'
    });
    setTimeout(() => setNotification(null), 3500);
  };

  const restoreOfficialDefault = () => {
    localStorage.removeItem('customDefaultStudents');
    localStorage.removeItem('datasetCustomLabel');
    localStorage.setItem('studentsCache', JSON.stringify(DEFAULT_STUDENTS));
    setStudents(DEFAULT_STUDENTS);
    setDatasetLabel('');
    setActiveCategory('All');
    setActiveClass('All');
    setActiveSection('All');
    setNotification({
      message: `Restored official default: ${DEFAULT_DATASET_NAME} (1,141 students)!`,
      type: 'info'
    });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const allHeaders = new Set();
      const rawData = [];

      // Exclude summaries, visuals, book lists, and dashboard sheets
      const validSheets = wb.SheetNames.filter(s => !isIgnoredSheet(s));

      // If workbook has Master List or All sheet, prefer it
      const masterSheet = wb.SheetNames.find(s => {
        const l = s.toLowerCase();
        return l === 'master list' || l.includes('all student') || l === 'all';
      });

      let sheetsToProcess = validSheets;
      if (masterSheet && (validSheets.length === 0 || validSheets.includes(masterSheet))) {
        sheetsToProcess = [masterSheet];
      }
      if (sheetsToProcess.length === 0) {
        sheetsToProcess = [wb.SheetNames[0]];
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
      const guessed = guessExcelColumns(headers);

      setColumnMap(guessed);
      setPreviewData({ headers, rawData, fileName: file.name });
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  const confirmMapping = () => {
    if (!previewData) return;
    const feeConfig = JSON.parse(localStorage.getItem('feeConfig') || '{"count":3,"amount":500}');

    const finalData = previewData.rawData.map(row => {
      const studentObj = { ...row, sheetCategory: row._sheet || 'General' };
      studentObj.Name = (row[columnMap.name] || 'Unknown').toString().trim();
      
      const rawClass = columnMap.class ? row[columnMap.class] : (row['Class Section'] || row['Class'] || row._sheet);
      const rawSec = columnMap.section ? row[columnMap.section] : (row['Section'] || row['Sec'] || '');
      
      // Intelligently separate Class & Section (e.g. '8 D' -> Class: '8th', Section: 'D')
      const { cls, sec } = parseClassSection(rawClass, rawSec);
      studentObj.Class = cls;
      studentObj.Section = sec;

      studentObj.IdentifierField = columnMap.identifier || 'RollNo';
      studentObj.IdentifierValue = columnMap.identifier ? row[columnMap.identifier] : (row['RollNo'] || row['Roll No'] || row['S.No.'] || row['BOOK No.'] || '');
      studentObj.RollNo = studentObj.IdentifierValue;

      // Auto-sync fees
      const installments = Array(feeConfig.count).fill(false);
      Object.keys(row).forEach(key => {
        const k = key.toUpperCase();
        if (k.includes('INSTALL') && !k.match(/^INSTALLMENT$/i)) {
          const match = k.match(/(\d+)/);
          if (match) {
            const index = parseInt(match[1], 10) - 1;
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
    const label = previewData.fileName ? `${previewData.fileName} (${finalData.length} Students)` : `Uploaded (${finalData.length} Students)`;
    setDatasetLabel(label);
    setActiveCategory('All');
    setActiveClass('All');
    setActiveSection('All');
    setPreviewData(null);
    setNotification({
      message: `Imported ${finalData.length} students! Click "Make My Default" above to save as your default.`,
      type: 'info'
    });
    setTimeout(() => setNotification(null), 4500);
  };

  const displayStudents = students.length > 0 ? students : DEFAULT_STUDENTS;

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
      .map(s => s.Section?.toString()?.trim())
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
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE) || 1;
  const currentStudents = filteredStudents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const exportToExcel = () => {
    if (filteredStudents.length === 0) return;
    
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
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`floating-toast ${notification.type}`}
          >
            <span>{notification.type === 'success' ? '✓' : 'ℹ️'}</span>
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
              <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
                We analyzed <b>{previewData.fileName || 'your Excel sheet'}</b>. Combined columns like <i>"Class Section" (e.g. 8 D)</i> are automatically separated into Class and Section!
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
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
                    <option value="">Leave empty if combined in Class</option>
                    {previewData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold' }}>Identifier (Roll/S.No./Fee Book):</label>
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
          {/* Dataset Management Ribbon */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="dataset-banner"
          >
            <div className="dataset-info-box">
              <div className="dataset-icon-circle">🏫</div>
              <div>
                <div className="dataset-title-row">
                  <span className="dataset-title-text">
                    {datasetLabel || (isUsingOfficialDefault ? DEFAULT_DATASET_NAME : 'Active Student Directory')}
                  </span>
                  <span className={`dataset-badge ${isCustomDefaultSaved ? 'custom-default' : (isUsingOfficialDefault ? 'official' : 'temporary')}`}>
                    {isCustomDefaultSaved ? '⭐ My Saved Default' : (isUsingOfficialDefault ? '✓ Official Default' : 'Session Dataset')}
                  </span>
                </div>
                <div className="dataset-meta-text">
                  {displayStudents.length} Students Total • Classes {availableClasses.filter(c => c !== 'All').join(', ')}
                </div>
              </div>
            </div>

            <div className="dataset-actions-group">
              {!isCustomDefaultSaved ? (
                <button 
                  onClick={setAsMyDefault} 
                  className="dataset-btn make-default" 
                  title="Make this dataset your personal default whenever you open this site"
                >
                  ⭐ Make My Default
                </button>
              ) : (
                <button 
                  onClick={setAsMyDefault} 
                  className="dataset-btn make-default" 
                  title="Update and save current changes as your personal default"
                >
                  ⭐ Update Default
                </button>
              )}
              
              {(isCustomDefaultSaved || !isUsingOfficialDefault) && (
                <button 
                  onClick={restoreOfficialDefault} 
                  className="dataset-btn restore" 
                  title="Restore official St. Gabriel Middle School default dataset (1,141 students)"
                >
                  <RefreshCw size={14} /> Restore School Default
                </button>
              )}

              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="dataset-btn upload"
                title="Upload another Excel file"
              >
                <Upload size={14} /> Upload Custom Excel
              </button>
            </div>
          </motion.div>

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
            <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '650px', margin: '0 auto', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search students, roll no, or classes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, minWidth: '220px', margin: 0 }}
              />
              <button 
                onClick={() => setShowDefaulters(!showDefaulters)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: showDefaulters ? '#d32f2f' : '#fff', color: showDefaulters ? '#fff' : '#d32f2f', border: '1px solid #d32f2f', padding: '0.7rem 1.3rem', borderRadius: '30px', cursor: 'pointer', fontFamily: 'Cormorant Garamond', fontSize: '1rem', whiteSpace: 'nowrap', transition: 'all 0.3s' }}
              >
                {showDefaulters ? 'Viewing Defaulters' : 'Show Defaulters'}
              </button>
              <button 
                onClick={exportToExcel}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#4caf50', color: '#fff', border: 'none', padding: '0.7rem 1.3rem', borderRadius: '30px', cursor: 'pointer', fontFamily: 'Cormorant Garamond', fontSize: '1rem', whiteSpace: 'nowrap', transition: 'all 0.3s' }}
              >
                Export Excel
              </button>
            </div>

            {/* Top Level: Categories (Only shown if multiple sheet categories exist) */}
            {categories.length > 2 && (
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
            )}

            {/* Second Level: Classes (Clean, naturally sorted 5th, 6th, 7th, 8th, 9th, 10th) */}
            {availableClasses.length > 1 && (
              <div className="tabs" style={{ marginTop: '0.5rem', gap: '0.8rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', alignSelf: 'center', fontStyle: 'italic', fontWeight: 600 }}>Class:</span>
                {availableClasses.map(cls => (
                  <button 
                    key={cls}
                    className={`tab-btn ${activeClass === cls ? 'active' : ''}`}
                    onClick={() => {
                      setActiveClass(cls);
                      setActiveSection('All');
                    }}
                    style={{ fontSize: '0.9rem', padding: '0.3rem 0.9rem' }}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            )}
            
            {/* Third Level: Sections (A, B, C, D, E, F, G) */}
            {availableSections.length > 1 && (
              <div className="tabs" style={{ marginTop: '0.5rem', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', alignSelf: 'center', fontStyle: 'italic', fontWeight: 600 }}>Section:</span>
                {availableSections.map(sec => (
                  <button 
                    key={sec}
                    className={`tab-btn ${activeSection === sec ? 'active' : ''}`}
                    onClick={() => setActiveSection(sec)}
                    style={{ fontSize: '0.85rem', padding: '0.25rem 0.8rem' }}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            )}

            {availableSections.length > 1 && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-accent)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                <span style={{ padding: '0.4rem 0.9rem', border: '1px solid var(--border-color)', borderRadius: '20px', background: 'rgba(255,255,255,0.6)' }}>
                  ✨ You can also click any 3D floating orb to filter by section
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
