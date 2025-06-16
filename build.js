const fs = require('fs-extra');
const path = require('path');

console.log('Preparing files for GitHub Pages deployment...');

// Create docs directory if it doesn't exist
const docsDir = path.join(__dirname, 'docs');
fs.ensureDirSync(docsDir);

// Copy all files from public to docs root
fs.copySync(path.join(__dirname, 'public'), docsDir, { 
  overwrite: true,
  recursive: true,
  filter: (src) => !src.includes('node_modules') && !src.includes('.git')
});

// Copy data directory to docs
fs.ensureDirSync(path.join(docsDir, 'data'));
fs.copySync(path.join(__dirname, 'data'), path.join(docsDir, 'data'), {
  overwrite: true,
  recursive: true
});

// Create .nojekyll file to prevent Jekyll processing
fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');

// Create a simple index.html that redirects to population-map.html
const indexPath = path.join(docsDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  fs.writeFileSync(indexPath, `
    <!DOCTYPE html>
    <html>
    <head>
      <meta http-equiv="refresh" content="0; url=./population-map.html">
      <title>Danmarkskortet</title>
    </head>
    <body>
      <p>Redirecting to <a href="./population-map.html">Danmarkskortet</a>...</p>
    </body>
    </html>
  `);
}

console.log('GitHub Pages build completed successfully!');
