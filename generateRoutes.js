const fs = require('fs');
const path = require('path');

const indexFile = path.join(__dirname, 'src', 'app', 'routes', 'index.ts');

let indexContent = fs.readFileSync(indexFile, 'utf8');

let markdown = '# API Routes Documentation\n\nThis document outlines all the available REST API endpoints for the application.\n\n';

const moduleRegex = /import\s+\{\s*([a-zA-Z0-9_]+)\s*\}\s+from\s+["']([^"']+)["']/g;
let match;
let imports = {};
while ((match = moduleRegex.exec(indexContent)) !== null) {
  let varName = match[1].trim();
  let relPath = match[2].trim();
  imports[varName] = relPath;
}

const routeRegex = /\{\s*path:\s*["']([^"']+)["'],\s*route:\s*([a-zA-Z0-9_]+),?\s*\}/g;
let routes = [];
while ((match = routeRegex.exec(indexContent)) !== null) {
  let basePath = match[1].trim();
  let routeVar = match[2].trim();
  routes.push({ basePath, routeVar });
}

console.log("Imports found:", Object.keys(imports).length);
console.log("Routes found:", routes.length);

routes.forEach(r => {
  let relPath = imports[r.routeVar];
  if (!relPath) return;
  
  let absPath = path.resolve(path.join(__dirname, 'src', 'app', 'routes'), relPath + '.ts');
  if (!fs.existsSync(absPath)) {
      absPath = path.resolve(path.join(__dirname, 'src', 'app', 'routes'), relPath, 'index.ts');
  }
  if (!fs.existsSync(absPath)) return;

  let content = fs.readFileSync(absPath, 'utf8');
  
  let sectionTitle = r.basePath.replace(/^\//, '').split(/[\/-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  if (!sectionTitle) sectionTitle = 'Root';
  
  markdown += `## ${sectionTitle} (\`${r.basePath}\`)\n\n`;
  markdown += `| HTTP Method | Endpoint Path | \n`;
  markdown += `| :--- | :--- |\n`;

  // Matches router.get('/', ...) and router.get('/path', ...) handling whitespace and line breaks
  const methodRegex = /router\.(get|post|put|patch|delete)\(\s*["']([^"']+)["']/g;
  let m;
  let count = 0;
  while ((m = methodRegex.exec(content)) !== null) {
    let method = m[1].toUpperCase();
    let subPath = m[2];
    
    let fullPath = (r.basePath + (subPath === '/' ? '' : (subPath.startsWith('/') ? subPath : '/' + subPath)));
    if (fullPath === '') fullPath = '/';
    
    markdown += `| **${method}** | \`${fullPath}\` | \n`;
    count++;
  }
  if (count === 0) {
      markdown += `| N/A | No endpoints explicitly defined or matched | \n`;
  }
  markdown += '\n';
});

fs.writeFileSync(path.join(__dirname, 'README.md'), markdown);
console.log('README.md generated successfully!');
