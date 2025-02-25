const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Copy files to dist
const filesToCopy = [
  'index.html',
  'scripts/app.js',
  'scripts/firebase-config.js',
  'styles/main.css',
  // Add other files you need
];

filesToCopy.forEach(file => {
  const sourcePath = path.join(__dirname, '..', file);
  const destPath = path.join(__dirname, '..', 'dist', file);
  
  // Create directories if they don't exist
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Copy the file
  fs.copyFileSync(sourcePath, destPath);
});