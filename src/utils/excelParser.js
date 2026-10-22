/**
 * Universal Excel & Class/Section Parser for ATW Student Management
 */

/**
 * Intelligently separates and normalizes Class and Section.
 * Handles formats:
 * - "10 A", "10-A", "10/A", "10_A", "10th A" -> { cls: "10th", sec: "A" }
 * - "8 D", "8-D", "8/D", "8_D" -> { cls: "8th", sec: "D" }
 * - "5-A", "5 A", "5A" -> { cls: "5th", sec: "A" }
 * - "UKG B", "UKG-A", "UKG A" -> { cls: "UKG", sec: "A" }
 * - "1A", "1-A", "1 A" -> { cls: "1st", sec: "A" }
 * - "10th", "10" -> { cls: "10th", sec: "" }
 */
export function parseClassSection(rawClass, rawSection) {
  let cls = (rawClass || '').toString().trim();
  let sec = (rawSection || '').toString().trim();

  // 1. If rawClass already contains numeric grade + section letter: e.g. "10 A", "10-A", "8 D", "5th B", "1A"
  const numLetterMatch = cls.match(/^(\d+)(?:st|nd|rd|th)?\s*[-/ ]?\s*([a-zA-Z])$/i);
  if (numLetterMatch) {
    const n = parseInt(numLetterMatch[1], 10);
    const suffix = (n === 1) ? '1st' : (n === 2) ? '2nd' : (n === 3) ? '3rd' : `${n}th`;
    const finalSec = (sec && /^[a-zA-Z]$/.test(sec)) ? sec.toUpperCase() : numLetterMatch[2].toUpperCase();
    return { cls: suffix, sec: finalSec };
  }

  // 2. Named class with section: e.g., 'UKG B', 'LKG-A', 'NURSERY C'
  const nameMatch = cls.match(/^([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s*[-/ ]?\s*([a-zA-Z])$/i);
  if (nameMatch && !['master', 'class', 'student', 'all'].includes(nameMatch[1].toLowerCase())) {
    const finalSec = (sec && /^[a-zA-Z]$/.test(sec)) ? sec.toUpperCase() : nameMatch[2].toUpperCase();
    return { cls: nameMatch[1].toUpperCase(), sec: finalSec };
  }

  // 3. Purely numeric class: e.g. "10" or "8"
  if (/^\d+$/.test(cls)) {
    const n = parseInt(cls, 10);
    const suffix = (n === 1) ? '1st' : (n === 2) ? '2nd' : (n === 3) ? '3rd' : `${n}th`;
    return { cls: suffix, sec: sec.toUpperCase() };
  }

  // 4. Plain numeric with suffix already (e.g. "10th")
  const numSuffixMatch = cls.match(/^(\d+)(?:st|nd|rd|th)$/i);
  if (numSuffixMatch) {
    const n = parseInt(numSuffixMatch[1], 10);
    const suffix = (n === 1) ? '1st' : (n === 2) ? '2nd' : (n === 3) ? '3rd' : `${n}th`;
    return { cls: suffix, sec: sec.toUpperCase() };
  }

  return { cls, sec: sec.toUpperCase() };
}

/**
 * Normalizes varied Excel date strings into standard 'YYYY-MM-DD'
 * Handles:
 * - '03-10-2026', '03/10/2026' (DD-MM-YYYY)
 * - '01-Oct', '03-Oct', '13-Oct' (DD-Mon)
 * - '2026-10-03' (YYYY-MM-DD)
 */
export function normalizeDate(rawDate) {
  if (!rawDate) return null;
  const str = rawDate.toString().trim();
  
  // 1. Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // 2. DD-MM-YYYY (e.g. 03-10-2026 or 03/10/2026)
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
  }

  // 3. DD-Mon or DD-Mon-YYYY (e.g. 01-Oct, 03-Oct, 13-Oct, 01-Oct-2026)
  const months = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };
  const monMatch = str.match(/^(\d{1,2})[-/ ]([a-zA-Z]{3,})(?:[-/ ](\d{2,4}))?$/);
  if (monMatch) {
    const d = monMatch[1].padStart(2, '0');
    const mName = monMatch[2].toLowerCase().substring(0, 3);
    const m = months[mName];
    if (m) {
      let y = monMatch[3] || new Date().getFullYear().toString();
      if (y.length === 2) y = '20' + y;
      return `${y}-${m}-${d}`;
    }
  }

  return null;
}

/**
 * Detects whether an Excel row is an invalid footer, summary, or total row
 */
export function isSummaryOrInvalidRow(row, nameKey) {
  if (!row || typeof row !== 'object') return true;

  const nameVal = (nameKey ? row[nameKey] : (row['Student Name'] || row['Name'] || row['name'])) || '';
  const nameStr = nameVal.toString().trim().toUpperCase();

  // If no name is found or name is empty
  if (!nameStr) return true;

  // Total / Summary markers
  if (['TOTAL', 'SUBTOTAL', 'GRAND TOTAL', 'COUNT', 'SUMMARY', 'AVERAGE', 'NET TOTAL'].includes(nameStr)) {
    return true;
  }

  // Check if roll no or identifier is 'TOTAL'
  const idVal = (row['S.No.'] || row['Roll No'] || row['RollNo'] || row['Roll'] || row['Sr. No.'] || row['BOOK No.'] || '').toString().trim().toUpperCase();
  if (['TOTAL', 'SUBTOTAL', 'GRAND TOTAL'].includes(idVal)) return true;

  return false;
}

/**
 * Auto-guesses the best matching column headers from an Excel file
 */
export function guessExcelColumns(headers) {
  let bestName = '';
  let bestClass = '';
  let bestSec = '';
  let bestId = '';
  let bestBatch = '';

  headers.forEach(h => {
    const l = h.toLowerCase().trim();
    if (['name', 'student name', 'fullname', 'full name', "student's name", 'studentname', 'candidate name', 'student'].includes(l)) {
      bestName = h;
    }
    // Combined class-section headers or class
    if (['class section', 'class/sec', 'class-sec', 'class_section', 'class & section', 'class / section', 'class', 'std', 'standard', 'grade'].includes(l)) {
      if (!bestClass || l.includes('section') || l.includes('sec')) {
        bestClass = h;
      }
    }
    // Section headers
    if (['section', 'sec', 'division', 'stream'].includes(l)) {
      bestSec = h;
    }
    // Batch headers
    if (['batch', 'batch no', 'batchno'].includes(l)) {
      bestBatch = h;
    }
    if (['roll', 'roll no', 'rollno', 'fee book', 'fee book no', 'book no.', 'book no', 'id', 'admission no', 'adm no', 's.no.', 's.no', 'sr no', 'sr.no', 'sr. no.', 'serial no', 'scholar no'].includes(l)) {
      bestId = h;
    }
  });

  return { name: bestName, class: bestClass, section: bestSec, identifier: bestId, batch: bestBatch };
}

/**
 * Filter out utility/summary/book sheets that do not contain actual student lists
 */
const IGNORED_SHEET_KEYWORDS = [
  'summary', 'visual', 'chart', 'distributed', 'dashboard',
  'totals', 'raw entries', 'overview', 'report', 'net requirement', 'analysis'
];

export function isIgnoredSheet(sheetName) {
  const lower = (sheetName || '').toLowerCase().trim();
  return IGNORED_SHEET_KEYWORDS.some(keyword => lower.includes(keyword));
}

/**
 * Universal Deduplicating Sheet Reader
 * When a workbook has master sheets ('ALL') and sub-category sheets ('UKG', 'PRIMARY', 'MIDDLE')
 * or batch sheets ('1ST BATCH'), this selects the ideal sheets to prevent row duplication.
 */
export function filterSheetsForImport(sheetNames) {
  const valid = sheetNames.filter(s => !isIgnoredSheet(s));
  
  const hasMasterAll = valid.some(s => {
    const l = s.toLowerCase().trim();
    return l === 'all' || l === 'all student' || l === 'all students' || l === 'master';
  });

  const categorySheets = valid.filter(s => {
    const l = s.toLowerCase().trim();
    return ['ukg', 'primary', 'middle', 'senior', 'high', 'nursery', 'lkg'].some(k => l.includes(k));
  });

  // If both 'ALL' and sub-division category sheets exist, prefer the category sheets so categories are preserved and rows are NOT duplicated
  if (hasMasterAll && categorySheets.length > 0) {
    return categorySheets;
  }

  // If only 'ALL' exists, return 'ALL'
  if (hasMasterAll) {
    return valid.filter(s => {
      const l = s.toLowerCase().trim();
      return l === 'all' || l === 'all student' || l === 'all students' || l === 'master';
    });
  }

  return valid;
}
