const fs = require('fs-extra');
const path = require('path');

console.log('Preparing files for GitHub Pages deployment...');

// Create docs directory if it doesn't exist
const docsDir = path.join(__dirname, 'docs');
fs.ensureDirSync(docsDir);

// Function to update HTML files with correct base path
function updateHtmlForGHPages(html) {
  // Add base tag if not exists
  if (!html.includes('<base href="/Danmarkskortet/"')) {
    html = html.replace(/<head>/, '<head>\n    <base href="/Danmarkskortet/">');
  }
  
  // Update navigation links
  html = html.replace(/href="\/([^"#]+)\.html/g, 'href="/Danmarkskortet/$1.html');
  
  return html;
}

// Process HTML files
const processHtmlFiles = (src, dest) => {
  if (src.endsWith('.html')) {
    let content = fs.readFileSync(src, 'utf8');
    content = updateHtmlForGHPages(content);
    fs.writeFileSync(dest, content);
    return false; // Skip default copy
  }
  return true; // Continue with default copy for other files
};

// Copy all files from public to docs root
fs.copySync(path.join(__dirname, 'public'), docsDir, { 
  overwrite: true,
  recursive: true,
  filter: (src, dest) => {
    // Skip node_modules and .git
    if (src.includes('node_modules') || src.includes('.git')) {
      return false;
    }
    // Process HTML files
    if (src.endsWith('.html')) {
      return processHtmlFiles(src, dest);
    }
    return true;
  }
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
const redirectHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=/Danmarkskortet/population-map.html">
  <title>Danmarkskortet</title>
</head>
<body>
  <p>Redirecting to <a href="/Danmarkskortet/population-map.html">Danmarkskortet</a>...</p>
</body>
</html>
`;

if (!fs.existsSync(indexPath)) {
  fs.writeFileSync(indexPath, redirectHtml);
}

console.log('GitHub Pages build completed successfully!');
