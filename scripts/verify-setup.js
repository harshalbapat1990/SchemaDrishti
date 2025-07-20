#!/usr/bin/env node

console.log('🚀 SchemaDrishti MVP 1 - Task 1 Verification');
console.log('='.repeat(50));

// Check if required dependencies are installed
try {
  require.resolve('@monaco-editor/react');
  console.log('✅ Monaco Editor dependency found');
} catch (e) {
  console.log('❌ Monaco Editor dependency missing');
}

try {
  require.resolve('mermaid');
  console.log('✅ Mermaid dependency found');
} catch (e) {
  console.log('❌ Mermaid dependency missing');
}

// Check if required files exist
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'src/App.js',
  'src/index.js',
  'src/index.css',
  'src/styles/theme.css',
  'src/utils/constants.js',
  'src/utils/helpers.js',
  '.env',
  '.vscode/settings.json'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file))) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
});

console.log('='.repeat(50));
console.log('🎉 Task 1 Setup Verification Complete!');
console.log('');
console.log('Next steps:');
console.log('1. Run: npm start (will start on port 3001)');
console.log('2. Open: http://localhost:3001');
console.log('3. Verify theme system is working');
console.log('4. Ready for Task 2: Layout Container & Theme System');
