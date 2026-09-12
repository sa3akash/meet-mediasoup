const fs = require('fs');
const path = require('path');

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!filePath.includes('components\\ui') && !filePath.includes('components/ui') && !filePath.includes('node_modules')) {
        getFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const root = path.join(__dirname, 'src');
const allFiles = getFiles(root);

const results = [];
for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n').length;
  if (lines > 150) {
    results.push({
      relPath: path.relative(path.join(__dirname, 'src'), file),
      lines,
    });
  }
}

results.sort((a, b) => b.lines - a.lines);
console.log(`\nFiles > 150 lines count: ${results.length}\n`);
for (const r of results) {
  console.log(`${r.lines.toString().padStart(4, ' ')} lines: ${r.relPath}`);
}
