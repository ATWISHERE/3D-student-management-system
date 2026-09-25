const XLSX = require('xlsx');

try {
  const wb = XLSX.readFile('4.ALL STUDENTS.xlsx');
  const classCounts = {};
  let totalStudents = 0;

  wb.SheetNames.forEach(sheetName => {
    if (sheetName.toLowerCase().includes('all student') || sheetName.toLowerCase() === 'all') return;
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws);
    
    // Group by class if specified, or by sheet name
    data.forEach(row => {
      let className = '';
      Object.keys(row).forEach(key => {
        if (key.toLowerCase().trim() === 'class') className = row[key];
      });
      if (!className) className = sheetName;
      
      const key = className.toString().trim();
      if (!classCounts[key]) classCounts[key] = 0;
      classCounts[key]++;
      totalStudents++;
    });
  });

  console.log("Total Students:", totalStudents);
  console.log("Counts per class:");
  Object.keys(classCounts).sort().forEach(cls => {
    console.log(`- Class ${cls}: ${classCounts[cls]} students`);
  });
} catch (e) {
  console.error("Error reading excel:", e);
}
