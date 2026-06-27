// Cross-platform Build and Packaging Script
// File: scripts/build-prod.js

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

try {
  console.log('🚀 Step 1: Building Vite production client bundle...');
  execSync('npm run build -w frontend', { stdio: 'inherit', cwd: rootDir });

  const srcDir = path.join(rootDir, 'frontend', 'dist');
  const destDir = path.join(rootDir, 'backend', 'public', 'client');

  console.log(`📂 Step 2: Preparing static client directory at: ${destDir}`);
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }
  fs.mkdirSync(destDir, { recursive: true });

  console.log('✍️ Step 3: Copying static assets over...');
  copyFolderSync(srcDir, destDir);

  console.log('🎉 Full-stack application ready for production deployment!');
} catch (err) {
  console.error('❌ Build script encountered an error:', err);
  process.exit(1);
}

function copyFolderSync(from, to) {
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    const srcPath = path.join(from, element);
    const destPath = path.join(to, element);
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyFolderSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}
