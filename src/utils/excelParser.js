/**
 * Intelligent Excel & Class Section Parser for ATW Student Management
 */

/**
 * Intelligently separates and normalizes Class and Section.
 * Handles formats:
 * - "8 D", "8-D", "8/D", "8_D" -> { cls: "8th", sec: "D" }
 * - "10th A", "10 A", "10-A" -> { cls: "10th", sec: "A" }
 * - "5-A", "5 A" -> { cls: "5th", sec: "A" }
 * - "UKG B", "LKG-A", "Nursery C" -> { cls: "UKG", sec: "B" }
 * - rawClass: "8", rawSec: "D" -> { cls: "8th", sec: "D" }
 * - rawClass: "8" -> { cls: "8th", sec: "" }
 */
export function parseClassSection(rawClass, rawSection) {
  let cls = (rawClass || '').toString().trim();
  let sec = (rawSection || '').toString().trim();

  // If section was provided explicitly in a separate column:
  if (sec) {
    if (/^\d+$/.test(cls)) {
      const n = parseInt(cls, 10);
      cls = (n === 1) ? '1st' : (n === 2) ? '2nd' : (n === 3) ? '3rd' : `${n}th`;
    }
    return { cls, sec: sec.toUpperCase() };
  }

  // If section is empty, parse combined class string:
  if (cls) {
    // 1. Numeric with optional suffix: e.g., '8 D', '8-D', '10th B', '10 A', '5-A'
    const numMatch = cls.match(/^(\d+)(?:st|nd|rd|th)?\s*[-/ ]?\s*([a-zA-Z])$/i);
    if (numMatch) {
      const n = parseInt(numMatch[1], 10);
      const suffix = (n === 1) ? '1st' : (n === 2) ? '2nd' : (n === 3) ? '3rd' : `${n}th`;
      return { cls: suffix, sec: numMatch[2].toUpperCase() };
    }

    // 2. Named class: e.g., 'UKG B', 'LKG-A', 'NURSERY C'
    const nameMatch = cls.match(/^([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s*[-/ ]\s*([a-zA-Z])$/i);
    if (nameMatch && !['master', 'class', 'student', 'all'].includes(nameMatch[1].toLowerCase())) {
      return { cls: nameMatch[1].toUpperCase(), sec: nameMatch[2].toUpperCase() };
    }

    // 3. Plain numeric: e.g., '8' -> '8th'
    if (/^\d+$/.test(cls)) {
      const n = parseInt(cls, 10);
      cls = (n === 1) ? '1st' : (n === 2) ? '2nd' : (n === 3) ? '3rd' : `${n}th`;
      return { cls, sec: '' };
    }
  }

  return { cls, sec };
}

/**
 * Auto-guesses the best matching column headers from an Excel file
 */
export function guessExcelColumns(headers) {
  let bestName = '';
  let bestClass = '';
  let bestSec = '';
  let bestId = '';

  headers.forEach(h => {
    const l = h.toLowerCase().trim();
    if (['name', 'student name', 'fullname', 'full name', "student's name", 'studentname', 'candidate name', 'student'].includes(l)) {
      bestName = h;
    }
    if (['class', 'std', 'standard', 'grade', 'class section', 'class/sec', 'class-sec', 'class_section', 'class & section', 'class / section'].includes(l)) {
      bestClass = h;
    }
    if (['sec', 'section', 'batch', 'division', 'stream'].includes(l)) {
      bestSec = h;
    }
    if (['roll', 'roll no', 'rollno', 'fee book', 'fee book no', 'book no.', 'id', 'admission no', 'adm no', 's.no.', 's.no', 'sr no', 'sr.no', 'sr. no.', 'serial no', 'scholar no'].includes(l)) {
      bestId = h;
    }
  });

  return { name: bestName, class: bestClass, section: bestSec, identifier: bestId };
}

/**
 * Filter out utility/summary/book sheets that do not contain actual student lists
 */
const IGNORED_SHEET_KEYWORDS = [
  'summary', 'visual', 'chart', 'distributed', 'book', 'dashboard',
  'total', 'raw entries', 'overview', 'report', 'net requirement', 'analysis'
];

export function isIgnoredSheet(sheetName) {
  const lower = (sheetName || '').toLowerCase().trim();
  return IGNORED_SHEET_KEYWORDS.some(keyword => lower.includes(keyword));
}
