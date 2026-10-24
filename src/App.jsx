import React, { useState, useRef, useEffect, Suspense } from 'react';
import * as XLSX from 'xlsx';
import { Upload, RefreshCw } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import ThreeScene from './ThreeBackground';
import FeeModal from './FeeModal';
import AttendanceSystem from './AttendanceSystem';
import { 
  parseClassSection, 
  normalizeDate, 
  isSummaryOrInvalidRow, 
  guessExcelColumns, 
  filterSheetsForImport 
} from './utils/excelParser';
import ATWLogo from './ATWLogo';
import LogoPageTransition from './LogoPageTransition';
import Cinematic3DLogoReveal from './Cinematic3DLogoReveal';
import './index.css';

function App() {
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('studentsCache');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { 
        return []; 
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('studentsCache', JSON.stringify(students));
  }, [students]);

  const [activeCategory, setActiveCategory] = useState('All');
  const [activeClass, setActiveClass] = useState('All');
  const [activeSection, setActiveSection] = useState('All');
  const [activeBatch, setActiveBatch] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activePage, setActivePage] = useState('directory'); // 'directory' or 'attendance'
  const [previewData, setPreviewData] = useState(null);
  const [columnMap, setColumnMap] = useState({ name: '', class: '', section: '', identifier: '', batch: '' });
  const [showDefaulters, setShowDefaulters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [notification, setNotification] = useState(null);
  const fileInputRef = useRef(null);

  // Auto-dismiss toast
  const showToast = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Seamless Logo Page Transition State
  const [transitionState, setTransitionState] = useState({
    isActive: false,
    targetPage: 'Attendance System',
    previousPage: 'Student Directory'
  });

  const navigateToPage = (target) => {
    if (target === activePage) return;
    setTransitionState({
      isActive: true,
      targetPage: target === 'attendance' ? 'Attendance System' : 'Student Directory',
      previousPage: activePage === 'attendance' ? 'Attendance System' : 'Student Directory'
    });
    // Switch active view at midpoint of transition
    setTimeout(() => {
      setActivePage(target);
    }, 400);
  };

  const handleTransitionComplete = () => {
    setTransitionState(prev => ({ ...prev, isActive: false }));
  };

  // 3D Metallic Ribbon Reveal Cinematic Modal
  const [show3DReveal, setShow3DReveal] = useState(false);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, activeClass, activeSection, activeBatch, searchQuery, showDefaulters]);

  // Dynamic Document Title based on current page, selected student, defaulter filter, or class
  useEffect(() => {
    if (activePage === 'directory') {
      if (selectedStudent) {
        document.title = `ATW • ${selectedStudent.Name} | Fee Records`;
      } else if (showDefaulters) {
        document.title = "ATW • Defaulters Directory";
      } else if (activeClass !== 'All') {
        document.title = `ATW • Class ${activeClass} Directory`;
      } else {
        document.title = "ATW • Student Directory";
      }
    }
  }, [activePage, selectedStudent, showDefaulters, activeClass]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const allHeaders = new Set();
        const rawData = [];

        // Universal deduplicating sheet selection
        const sheetsToProcess = filterSheetsForImport(wb.SheetNames);

        sheetsToProcess.forEach(sheetName => {
          const ws = wb.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(ws);
          
          if (data.length > 0) {
            data.forEach(row => {
              if (!isSummaryOrInvalidRow(row)) {
                Object.keys(row).forEach(k => allHeaders.add(k));
                rawData.push({ ...row, _sheet: sheetName });
              }
            });
          }
        });

        const headers = Array.from(allHeaders);
        const guessed = guessExcelColumns(headers);

        setColumnMap({ 
          name: guessed.name, 
          class: guessed.class, 
          section: guessed.section, 
          identifier: guessed.identifier,
          batch: guessed.batch 
        });

        setPreviewData({ headers, rawData, fileName: file.name, totalSheets: wb.SheetNames.length });
      } catch (err) {
        console.error(err);
        showToast('Error reading Excel file. Please ensure it is a valid .xlsx or .xls file.', 'error');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  const confirmMapping = () => {
    if (!previewData) return;
    const feeConfig = JSON.parse(localStorage.getItem('feeConfig') || '{"count":3,"amount":500}');
    const attendanceCache = JSON.parse(localStorage.getItem('attendanceDataCache') || '{}');
    let attendanceSynced = 0;

    // Use a Map for universal deduplication: key = lower(name) + '_' + lower(class)
    const studentMap = new Map();

    previewData.rawData
      .filter(row => !isSummaryOrInvalidRow(row, columnMap.name))
      .forEach(row => {
        const name = (row[columnMap.name] || row['Student Name'] || row['Name'] || '').toString().trim();
        if (!name) return;

        const rawClass = columnMap.class ? row[columnMap.class] : (row['Class Section'] || row['Class'] || row._sheet);
        const rawSec = columnMap.section ? row[columnMap.section] : (row['Section'] || row['Sec'] || '');
        const { cls, sec } = parseClassSection(rawClass, rawSec);

        const idField = columnMap.identifier || 'RollNo';
        const idVal = columnMap.identifier ? row[columnMap.identifier] : (row['RollNo'] || row['Roll No'] || row['BOOK No.'] || row['S.No.'] || '');

        let batchVal = columnMap.batch ? row[columnMap.batch] : (row['Batch'] || row['batch'] || '');
        if (!batchVal && row._sheet && row._sheet.toLowerCase().includes('batch')) {
          const m = row._sheet.match(/(\d+)/);
          if (m) batchVal = m[1];
        }

        const dedupKey = `${name.toLowerCase()}_${cls.toLowerCase()}`;

        if (!studentMap.has(dedupKey)) {
          const studentObj = { 
            ...row, 
            sheetCategory: row._sheet || 'General',
            Name: name,
            Class: cls,
            Section: sec,
            Batch: batchVal ? String(batchVal) : '',
            IdentifierField: idField,
            IdentifierValue: idVal,
            RollNo: idVal
          };

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
          try {
            localStorage.setItem(`fee_${name}`, JSON.stringify(installments));
          } catch (e) {}

          studentMap.set(dedupKey, studentObj);
        } else {
          // Merge missing properties
          const existing = studentMap.get(dedupKey);
          if (!existing.Batch && batchVal) existing.Batch = String(batchVal);
          if (!existing.Section && sec) existing.Section = sec;
          if (!existing.RollNo && idVal) {
            existing.RollNo = idVal;
            existing.IdentifierValue = idVal;
          }
        }

        // Auto-sync attendance dates from any Excel column matching normalizeDate
        const classKey = `${cls} ${sec}`.trim();
        if (classKey && name) {
          Object.keys(row).forEach(key => {
            const normDate = normalizeDate(key);
            if (normDate) {
              const val = (row[key] || '').toString().trim().toUpperCase();
              if (val === 'P' || val === 'A') {
                if (!attendanceCache[classKey]) attendanceCache[classKey] = {};
                if (!attendanceCache[classKey][name]) attendanceCache[classKey][name] = {};
                attendanceCache[classKey][name][normDate] = val;
                attendanceSynced++;
              }
            }
          });
        }
      });

    if (attendanceSynced > 0) {
      try {
        localStorage.setItem('attendanceDataCache', JSON.stringify(attendanceCache));
      } catch (e) {}
    }

    const finalData = Array.from(studentMap.values());
    setStudents(finalData);
    setActiveCategory('All');
    setActiveClass('All');
    setActiveSection('All');
    setActiveBatch('All');
    setPreviewData(null);
    showToast(`Successfully imported ${finalData.length} students${attendanceSynced > 0 ? ` and synchronized ${attendanceSynced} attendance records` : ''}!`, 'success');
  };

  const handleClearCache = () => {
    if (window.confirm("Are you sure you want to clear loaded student data and cache?")) {
      localStorage.removeItem('studentsCache');
      localStorage.removeItem('attendanceDataCache');
      setStudents([]);
      setActiveCategory('All');
      setActiveClass('All');
      setActiveSection('All');
      setActiveBatch('All');
      showToast('Cache cleared. You can now upload a fresh file.', 'info');
    }
  };

  const displayStudents = students.length > 0 ? students : [
    { Name: 'John Doe', Class: '10th', Section: 'A', RollNo: '101', Batch: '1', sheetCategory: 'Middle' },
    { Name: 'Jane Smith', Class: 'UKG', Section: 'B', RollNo: '22', Batch: '', sheetCategory: 'UKG' },
    { Name: 'Sam Wilson', Class: '5th', Section: 'C', RollNo: '45', Batch: '', sheetCategory: 'Primary' },
    { Name: 'Alice Brown', Class: '8th', Section: 'A', RollNo: '12', Batch: '', sheetCategory: 'Middle' },
    { Name: 'Emma Watson', Class: '10th', Section: 'B', RollNo: '105', Batch: '2', sheetCategory: 'Middle' },
    { Name: 'David Clark', Class: '4th', Section: 'A', RollNo: '33', Batch: '', sheetCategory: 'Primary' }
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

  const availableBatches = ['All', ...new Set(
    displayStudents
      .filter(s => 
        (activeCategory === 'All' || s.sheetCategory === activeCategory) &&
        (activeClass === 'All' || s.Class?.toString()?.trim() === activeClass) &&
        (activeSection === 'All' || s.Section === activeSection)
      )
      .map(s => s.Batch?.toString()?.trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const today = new Date().toISOString().split('T')[0];
  const attendanceCache = JSON.parse(localStorage.getItem('attendanceDataCache') || '{}');

  const isDefaulter = (student) => {
    const targetClass = `${student.Class} ${student.Section || ''}`.trim();
    const status = attendanceCache[targetClass]?.[student.Name]?.[today];
    const isAbsent = status === 'A';
    
    const feeDataRaw = localStorage.getItem(`fee_${student.Name}`);
    let hasUnpaidFees = false;
    if (feeDataRaw) {
      try {
        const feeData = JSON.parse(feeDataRaw);
        hasUnpaidFees = Array.isArray(feeData) && feeData.includes(false);
      } catch (e) {
        hasUnpaidFees = false;
      }
    } else {
      hasUnpaidFees = true;
    }
    
    return isAbsent || hasUnpaidFees;
  };

  const filteredStudents = displayStudents.filter(student => {
    const matchesCategory = activeCategory === 'All' || student.sheetCategory === activeCategory;
    const matchesClass = activeClass === 'All' || student.Class?.toString()?.trim() === activeClass;
    const matchesSection = activeSection === 'All' || student.Section === activeSection;
    const matchesBatch = activeBatch === 'All' || (student.Batch && student.Batch.toString() === activeBatch);
    const matchesDefaulter = showDefaulters ? isDefaulter(student) : true;
                      
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = Object.values(student).some(value => {
      if (value === null || value === undefined) return false;
      return value.toString().toLowerCase().includes(searchLower);
    });

    return matchesCategory && matchesClass && matchesSection && matchesBatch && matchesDefaulter && matchesSearch;
  });

  const ITEMS_PER_PAGE = 50;
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
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
    showToast('Exported filtered students to Excel!', 'success');
  };

  if (activePage === 'attendance') {
    return (
      <>
        <LogoPageTransition 
          isActive={transitionState.isActive}
          targetPage={transitionState.targetPage}
          previousPage={transitionState.previousPage}
          onComplete={handleTransitionComplete}
        />
        <AttendanceSystem 
          students={filteredStudents} 
          onBack={() => navigateToPage('directory')} 
        />
      </>
    );
  }

  return (
    <>
      {/* Luxury Logo Page Transition Overlay */}
      <LogoPageTransition 
        isActive={transitionState.isActive}
        targetPage={transitionState.targetPage}
        previousPage={transitionState.previousPage}
        onComplete={handleTransitionComplete}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              zIndex: 99999,
              background: notification.type === 'error' ? '#d32f2f' : notification.type === 'success' ? '#2e7d32' : '#997F63',
              color: '#fff',
              padding: '0.8rem 1.6rem',
              borderRadius: '30px',
              boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
              fontFamily: 'Montserrat, sans-serif',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              pointerEvents: 'none'
            }}
          >
            <span>{notification.type === 'success' ? '✓' : notification.type === 'error' ? '⚠️' : 'ℹ️'}</span>
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="canvas-wrapper">
        <Canvas 
          camera={{ position: [0, 0, 8], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>
            <ThreeScene 
              availableSections={availableSections} 
              activeSection={activeSection} 
              setActiveSection={setActiveSection} 
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Feature: Intelligent Universal Excel Mapping Modal */}
      <AnimatePresence>
        {previewData && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '18px', width: '92%', maxWidth: '620px', boxShadow: '0 15px 40px rgba(0,0,0,0.35)' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2.2rem', marginTop: 0, color: 'var(--text-main)' }}>Confirm Column Mapping</h2>
              <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>
                We analyzed <b>{previewData.fileName}</b>. Verify the columns below to cleanly organize names, classes, and batches:
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Student Name Column:</label>
                  <select value={columnMap.name} onChange={e => setColumnMap({...columnMap, name: e.target.value})} style={{ padding: '0.6rem', width: '260px', borderRadius: '8px', border: '1px solid #ccc' }}>
                    <option value="">-- Select --</option>
                    {previewData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Class / Standard Column:</label>
                  <select value={columnMap.class} onChange={e => setColumnMap({...columnMap, class: e.target.value})} style={{ padding: '0.6rem', width: '260px', borderRadius: '8px', border: '1px solid #ccc' }}>
                    <option value="">Use Sheet Name if empty</option>
                    {previewData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Section Column:</label>
                  <select value={columnMap.section} onChange={e => setColumnMap({...columnMap, section: e.target.value})} style={{ padding: '0.6rem', width: '260px', borderRadius: '8px', border: '1px solid #ccc' }}>
                    <option value="">Auto-extract from Class or leave empty</option>
                    {previewData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Batch Column (Optional):</label>
                  <select value={columnMap.batch} onChange={e => setColumnMap({...columnMap, batch: e.target.value})} style={{ padding: '0.6rem', width: '260px', borderRadius: '8px', border: '1px solid #ccc' }}>
                    <option value="">Auto-detect Batch (if present)</option>
                    {previewData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Identifier (Book No / Roll No):</label>
                  <select value={columnMap.identifier} onChange={e => setColumnMap({...columnMap, identifier: e.target.value})} style={{ padding: '0.6rem', width: '260px', borderRadius: '8px', border: '1px solid #ccc' }}>
                    <option value="">Leave empty if none</option>
                    {previewData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setPreviewData(null)} style={{ padding: '0.6rem 1.2rem', background: '#f0f0f0', border: 'none', borderRadius: '25px', cursor: 'pointer', fontFamily: 'Montserrat', fontWeight: 500 }}>Cancel</button>
                <button onClick={confirmMapping} style={{ padding: '0.6rem 1.8rem', background: 'var(--text-accent)', color: '#fff', border: 'none', borderRadius: '25px', cursor: 'pointer', fontFamily: 'Montserrat', fontWeight: 500, boxShadow: '0 4px 15px rgba(153, 127, 99, 0.3)' }}>Confirm & Import</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="scroll-container">
        
        <section className="hero-section">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            whileHover={{ scale: 1.08 }}
            onClick={() => setShow3DReveal(true)}
            title="Click to experience the 3D Metallic Ribbon Reveal Animation ✨"
            style={{ marginBottom: '1.2rem', display: 'flex', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ATWLogo size={72} showText={false} isDark={false} />
          </motion.div>
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
              style={{ cursor: 'pointer' }}
            >
              <Upload size={48} color="var(--text-accent)" style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontSize: '1.4rem', fontWeight: 400 }}>Upload Excel Student File</p>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.5rem', display: 'block' }}>Supports .xlsx & .xls with automatic batch & section recognition</span>
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
            <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '750px', margin: '0 auto', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
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
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: showDefaulters ? '#d32f2f' : '#fff', color: showDefaulters ? '#fff' : '#d32f2f', border: '1px solid #d32f2f', padding: '0.7rem 1.4rem', borderRadius: '30px', cursor: 'pointer', fontFamily: 'Cormorant Garamond', fontSize: '1.05rem', whiteSpace: 'nowrap', transition: 'all 0.3s' }}
              >
                {showDefaulters ? 'Viewing Defaulters' : 'Show Defaulters'}
              </button>
              <button 
                onClick={exportToExcel}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#4caf50', color: '#fff', border: 'none', padding: '0.7rem 1.4rem', borderRadius: '30px', cursor: 'pointer', fontFamily: 'Cormorant Garamond', fontSize: '1.05rem', whiteSpace: 'nowrap', transition: 'all 0.3s' }}
              >
                Export Excel
              </button>
              {students.length > 0 && (
                <>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--text-accent)', color: '#fff', border: 'none', padding: '0.7rem 1.4rem', borderRadius: '30px', cursor: 'pointer', fontFamily: 'Cormorant Garamond', fontSize: '1.05rem', whiteSpace: 'nowrap', boxShadow: '0 4px 15px rgba(153, 127, 99, 0.3)', transition: 'transform 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.transform='scale(1.04)'}
                    onMouseOut={e => e.currentTarget.style.transform='scale(1)'}
                  >
                    <Upload size={16} /> Change File
                  </button>
                  <button 
                    onClick={handleClearCache}
                    title="Clear cached data"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'transparent', color: 'var(--text-light)', border: '1px solid #ddd', padding: '0.7rem 1rem', borderRadius: '30px', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    <RefreshCw size={14} /> Reset
                  </button>
                </>
              )}
            </div>

            {/* Top Level: Categories */}
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
                      setActiveBatch('All');
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Second Level: Classes */}
            {availableClasses.length > 1 && (
              <div className="tabs" style={{ marginTop: '0.8rem', gap: '0.8rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', alignSelf: 'center', fontStyle: 'italic', fontWeight: 600 }}>Class:</span>
                {availableClasses.map(cls => (
                  <button 
                    key={cls}
                    className={`tab-btn ${activeClass === cls ? 'active' : ''}`}
                    onClick={() => {
                      setActiveClass(cls);
                      setActiveSection('All');
                      setActiveBatch('All');
                    }}
                    style={{ fontSize: '0.9rem', padding: '0.3rem 0.9rem' }}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            )}
            
            {/* Third Level: Sections */}
            {availableSections.length > 1 && (
              <div className="tabs" style={{ marginTop: '0.6rem', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', alignSelf: 'center', fontStyle: 'italic', fontWeight: 600 }}>Section:</span>
                {availableSections.map(sec => (
                  <button 
                    key={sec}
                    className={`tab-btn ${activeSection === sec ? 'active' : ''}`}
                    onClick={() => {
                      setActiveSection(sec);
                      setActiveBatch('All');
                    }}
                    style={{ fontSize: '0.85rem', padding: '0.25rem 0.8rem' }}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            )}

            {/* Fourth Level: Batches (Only shown if students have Batch assignments) */}
            {availableBatches.length > 1 && (
              <div className="tabs" style={{ marginTop: '0.6rem', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', alignSelf: 'center', fontStyle: 'italic', fontWeight: 600 }}>Batch:</span>
                {availableBatches.map(b => (
                  <button 
                    key={b}
                    className={`tab-btn ${activeBatch === b ? 'active' : ''}`}
                    onClick={() => setActiveBatch(b)}
                    style={{ fontSize: '0.85rem', padding: '0.25rem 0.8rem' }}
                  >
                    {b === 'All' ? 'All Batches' : `Batch ${b}`}
                  </button>
                ))}
              </div>
            )}

            {availableSections.length > 1 && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ marginTop: '1.2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-accent)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                <span style={{ padding: '0.4rem 1rem', border: '1px solid var(--border-color)', borderRadius: '20px', background: 'rgba(255,255,255,0.6)' }}>
                  ✨ You can also click floating 3D orbs to filter sections
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
                    {student.Name ? String(student.Name).charAt(0) : '?'}
                  </span>
                </div>
                <div className="student-info">
                  <h3>{student.Name || student.name || 'Unknown'}</h3>
                  <div className="class-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span>
                      {student.Class || student.class || student.sheetCategory} 
                      {student.Section ? ` • Sec ${student.Section}` : ''}
                    </span>
                    {student.Batch && (
                      <span style={{ 
                        background: 'rgba(153, 127, 99, 0.15)', 
                        color: 'var(--text-accent)', 
                        padding: '0.15rem 0.6rem', 
                        borderRadius: '12px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600 
                      }}>
                        Batch {student.Batch}
                      </span>
                    )}
                  </div>
                  
                  <div className="student-details">
                    {Object.entries(student).map(([key, value]) => {
                      const kLower = key.toLowerCase();
                      if (['name', 'class', 'section', 'batch', 'sheetcategory', '_sheet', 'identifierfield', 'identifiervalue'].includes(kLower)) return null;
                      if (kLower.includes('install')) return null;
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
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-light)' }}>
                <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.6rem', fontStyle: 'italic' }}>No students found matching your criteria.</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '3rem' }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ padding: '0.8rem 1.6rem', borderRadius: '30px', border: '1px solid var(--border-color)', background: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, fontFamily: 'Cormorant Garamond', fontSize: '1rem' }}
              >
                Previous
              </button>
              <span style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.2rem', color: 'var(--text-accent)' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: '0.8rem 1.6rem', borderRadius: '30px', border: '1px solid var(--border-color)', background: '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, fontFamily: 'Cormorant Garamond', fontSize: '1rem' }}
              >
                Next
              </button>
            </div>
          )}
        </section>

        <section className="footer-spacer" style={{ padding: '4rem 2rem', background: '#fcfbfa', borderTop: '1px solid rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
              ABDUL TARIQUE WARSI
            </h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', color: 'var(--text-light)', fontSize: '0.9rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📞 8770463418
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ✉️ abdultarique5@gmail.com
              </span>
            </div>
            <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              ATW Student Management &copy; 2026
            </p>
          </div>
        </section>

      </div>

      {/* Floating Action Buttons */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', display: 'flex', gap: '0.8rem', zIndex: 100 }}>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShow3DReveal(true)}
          title="Watch the Cinematic 3D Metallic Ribbon Logo Reveal"
          style={{
            background: 'linear-gradient(135deg, #18120c, #0a0806)',
            color: '#ffd700',
            padding: '0.85rem 1.4rem',
            borderRadius: '30px',
            border: '1.5px solid rgba(255, 215, 0, 0.45)',
            cursor: 'pointer',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '0.85rem',
            fontWeight: 700,
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.6), 0 0 15px rgba(245, 158, 11, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <span>✨</span>
          <span>3D Logo Reveal</span>
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigateToPage('attendance')}
          style={{
            background: 'var(--text-accent)',
            color: '#fff',
            padding: '1rem 2rem',
            borderRadius: '30px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Cormorant Garamond',
            fontSize: '1.2rem',
            fontStyle: 'italic',
            boxShadow: '0 10px 25px rgba(153, 127, 99, 0.4)'
          }}
        >
          Take Attendance ✨
        </motion.button>
      </div>

      {/* Cinematic 3D Metallic Ribbon Logo Reveal Fullscreen Overlay */}
      {show3DReveal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999999 }}>
          <Cinematic3DLogoReveal onClose={() => setShow3DReveal(false)} />
        </div>
      )}

      {/* Fee Modal Overlay */}
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
