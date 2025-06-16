const fs = require('fs-extra');
const path = require('path');

console.log('Preparing files for deployment...');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
fs.ensureDirSync(distDir);

// Copy only necessary files to dist
const filesToCopy = [
  'public',
  'data',
  '!public/build.txt'  // Exclude build.txt
];

// Clear dist directory except .git
fs.emptyDirSync(distDir);

// Copy files
filesToCopy.forEach(pattern => {
  fs.copySync(path.join(__dirname, pattern.replace(/^!?/, '')), 
               path.join(distDir, pattern.replace(/^!?[^/]*\//, '')), 
               { overwrite: true, recursive: true });
});

console.log('Build completed successfully!');
