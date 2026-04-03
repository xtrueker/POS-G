const fs = require('fs');
const path = require('path');

const directories = [
  path.join(__dirname, 'src', 'sections'),
  path.join(__dirname, 'src', 'pages')
];

const replacements = [
  { regex: /#F2CB05/g, replace: '#2563eb' }, // Primary Yellow -> Blue 600
  { regex: /#d9a900/g, replace: '#1d4ed8' }, // Darker Yellow -> Blue 700
  { regex: /#d9b704/g, replace: '#2563eb' }, // Another Dark Yellow -> Blue 600
  { regex: /bg-yellow-400/g, replace: 'bg-blue-600' },
  { regex: /text-yellow-400/g, replace: 'text-blue-600' },
  { regex: /border-yellow-400/g, replace: 'border-blue-600' },
  { regex: /ring-yellow-400/g, replace: 'ring-blue-600' },
  { regex: /bg-yellow-500/g, replace: 'bg-blue-600' },
  { regex: /text-yellow-500/g, replace: 'text-blue-600' },
];

function processDirectory(directory) {
  if (!fs.existsSync(directory)) return;
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Don't go deep, just files in pages and sections are enough, except dashboard which is already fine.
      // Actually we ONLY want files directly in src/pages and src/sections. 
      // Let's avoid src/pages/dashboard as it's already using correct colors.
      if (directory.endsWith('pages') && file === 'dashboard') {
        continue;
      }
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      for (const rule of replacements) {
        if (rule.regex.test(content)) {
          content = content.replace(rule.regex, rule.replace);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

for (const dir of directories) {
  processDirectory(dir);
}

console.log('Restyling complete.');
