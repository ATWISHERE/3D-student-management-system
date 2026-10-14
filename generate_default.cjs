const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function parseClassSection(rawClass, rawSection) {
  let cls = (rawClass || '').toString().trim();
  let sec = (rawSection || '').toString().trim();

  if (sec) {
    if (/^\d+$/.test(cls)) {
      const n = parseInt(cls, 10);
      cls = (n === 1) ? '1st' : (n === 2) ? '2nd' : (n === 3) ? '3rd' : (n + 'th');
    }
    return { cls, sec: sec.toUpperCase() };
  }

  if (cls) {
    const numMatch = cls.match(/^(\d+)(?:st|nd|rd|th)?\s*[-/ ]?\s*([a-zA-Z])$/i);
    if (numMatch) {
      const n = parseInt(numMatch[1], 10);
      const suffix = (n === 1) ? '1st' : (n === 2) ? '2nd' : (n === 3) ? '3rd' : (n + 'th');
      return { cls: suffix, sec: numMatch[2].toUpperCase() };
    }

    const nameMatch = cls.match(/^([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s*[-/ ]\s*([a-zA-Z])$/i);
    if (nameMatch && !['master', 'class', 'student'].includes(nameMatch[1].toLowerCase())) {
      return { cls: nameMatch[1].toUpperCase(), sec: nameMatch[2].toUpperCase() };
    }

    if (/^\d+$/.test(cls)) {
      const n = parseInt(cls, 10);
      cls = (n === 1) ? '1st' : (n === 2) ? '2nd' : (n === 3) ? '3rd' : (n + 'th');
      return { cls, sec: '' };
    }
  }

  return { cls, sec };
}

const excelPath = 'D:\\ST.Gabriel School\\AI LIST\\3.MIDDLE SCHOOL 5 TO 10.xlsx';
if (!fs.existsSync(excelPath)) {
  console.error('Cannot find excel at:', excelPath);
  process.exit(1);
}

const wb = XLSX.readFile(excelPath);
const ws = wb.Sheets['Master List'];
const rawData = XLSX.utils.sheet_to_json(ws);

const students = rawData.map(r => {
  const { cls, sec } = parseClassSection(r['Class Section']);
  const student = {
    Name: (r['Student Name'] || '').toString().trim(),
    Class: cls,
    Section: sec,
    RollNo: (r['S.No.'] || '').toString().trim(),
    IdentifierField: 'S.No.',
    IdentifierValue: (r['S.No.'] || '').toString().trim(),
    sheetCategory: 'Middle School'
  };
  if (r.notes) student.notes = r.notes.toString().trim();
  if (r['13-Oct']) student['13-Oct'] = r['13-Oct'].toString().trim();
  return student;
});

const defaultAttendance = {};
students.forEach(s => {
  if (s['13-Oct']) {
    const clsKey = (s.Class + ' ' + (s.Section || '')).trim();
    if (!defaultAttendance[clsKey]) defaultAttendance[clsKey] = {};
    if (!defaultAttendance[clsKey][s.Name]) defaultAttendance[clsKey][s.Name] = {};
    defaultAttendance[clsKey][s.Name]['2026-10-13'] = s['13-Oct'].toUpperCase();
  }
});

const dataDir = path.join(__dirname, 'src', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const outputContent = `export const DEFAULT_DATASET_NAME = 'St. Gabriel Middle School (Classes 5 to 10)';

export const DEFAULT_STUDENTS = ${JSON.stringify(students, null, 2)};

export const DEFAULT_ATTENDANCE = ${JSON.stringify(defaultAttendance, null, 2)};
`;

fs.writeFileSync(path.join(dataDir, 'defaultStudents.js'), outputContent, 'utf8');
console.log('Successfully written src/data/defaultStudents.js with', students.length, 'students!');
