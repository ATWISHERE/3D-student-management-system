const fs = require('fs');

const code = fs.readFileSync('src/ConstellationGame.jsx', 'utf8');

// A simple regex or eval to check if it parses?
try {
  new Function(code);
} catch (e) {
  console.log("Syntax error?", e.message);
}
