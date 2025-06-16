const fs = require('fs-extra');
const path = require('path');

console.log('Preparing files for GitHub Pages deployment...');

// Create docs directory if it doesn't exist
const docsDir = path.join(__dirname, 'docs');
fs.ensureDirSync(docsDir);

// Copy public directory to docs
fs.copySync(path.join(__dirname, 'public'), path.join(docsDir, 'public'), { 
  overwrite: true,
  recursive: true
});

// Copy data directory to docs
fs.copySync(path.join(__dirname, 'data'), path.join(docsDir, 'public/data'), {
  overwrite: true,
  recursive: true
});

// Create a simple index.html that redirects to population-map.html
const indexPath = path.join(docsDir, 'index.html');
fs.writeFileSync(indexPath, `
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=./public/population-map.html">
  <title>Danmarkskortet</title>
</head>
<body>
  <p>Redirecting to <a href="./public/population-map.html">Danmarkskortet</a>...</p>
</body>
</html>
`);

console.log('GitHub Pages build completed successfully!');
