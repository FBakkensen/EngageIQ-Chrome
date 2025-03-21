/**
 * Post-build script to fix Chrome extension structure
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const distDir = path.join(__dirname, '../dist');
const srcDir = path.join(__dirname, '../src');

console.log('Running post-build script...');

// Create necessary directories
fs.mkdirSync(path.join(distDir, 'popup'), { recursive: true });
fs.mkdirSync(path.join(distDir, 'options'), { recursive: true });
fs.mkdirSync(path.join(distDir, 'icons'), { recursive: true });

// Copy manifest.json
console.log('Copying manifest.json...');
fs.copyFileSync(
  path.join(srcDir, 'manifest.json'),
  path.join(distDir, 'manifest.json')
);

// Copy icons
console.log('Copying icons...');
const iconFiles = ['icon16.png', 'icon48.png', 'icon128.png'];
iconFiles.forEach(icon => {
  const srcPath = path.join(srcDir, 'icons', icon);
  const destPath = path.join(distDir, 'icons', icon);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
  } else {
    console.warn(`Warning: Icon file not found: ${srcPath}`);
  }
});

// Find all asset files for options and popup
const findAssetFile = (prefix) => {
  const files = fs.readdirSync(path.join(distDir, 'assets')).filter(file => 
    file.startsWith(prefix) && file.endsWith('.js')
  );
  return files.length > 0 ? files[0] : null;
};

const globalJsFile = findAssetFile('global-') || 'global-CvplXt-W.js';
const globalCssFile = fs.readdirSync(path.join(distDir, 'assets')).find(file => file.endsWith('.css')) || 'global-C6G_3qQV.css';
const optionsJsFile = findAssetFile('options-') || 'options-BSWSZGp2.js';
const popupJsFile = findAssetFile('popup-') || 'popup-CEswk9by.js';

// Create HTML files with correct paths
console.log('Creating HTML files with correct paths...');

// Create popup/index.html
const popupHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EngageIQ</title>
  <script type="module" crossorigin src="../assets/${popupJsFile}"></script>
  <link rel="modulepreload" crossorigin href="../assets/${globalJsFile}">
  <link rel="stylesheet" crossorigin href="../assets/${globalCssFile}">
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

fs.writeFileSync(path.join(distDir, 'popup', 'index.html'), popupHtml);
console.log(`Created popup/index.html with script=${popupJsFile}, global=${globalJsFile}`);

// Create options/index.html
const optionsHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EngageIQ Options</title>
  <script type="module" crossorigin src="../assets/${optionsJsFile}"></script>
  <link rel="modulepreload" crossorigin href="../assets/${globalJsFile}">
  <link rel="stylesheet" crossorigin href="../assets/${globalCssFile}">
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

fs.writeFileSync(path.join(distDir, 'options', 'index.html'), optionsHtml);
console.log(`Created options/index.html with script=${optionsJsFile}, global=${globalJsFile}`);

// Optionally remove the src directory from dist as it's no longer needed
console.log('Cleaning up...');
if (fs.existsSync(path.join(distDir, 'src'))) {
  fs.rmSync(path.join(distDir, 'src'), { recursive: true, force: true });
}

console.log('Post-build processing complete!');