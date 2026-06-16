const path = require('path');
const fs = require('fs');

const artifactDir = 'C:\\Users\\panta\\.gemini\\antigravity\\brain\\524d729f-9962-4b5c-8870-f3b05f487c42';
const filename = 'dashboard_wireframe_mockup_1781605730440.png';

// Let's see how different paths resolve relative to directory or drive root
console.log("resolve /filename:", path.resolve(artifactDir, '/' + filename));
console.log("resolve ./filename:", path.resolve(artifactDir, './' + filename));
console.log("resolve filename:", path.resolve(artifactDir, filename));
console.log("resolve /Users/...:", path.resolve(artifactDir, '/Users/panta/.gemini/antigravity/brain/524d729f-9962-4b5c-8870-f3b05f487c42/' + filename));

// Let's check if the file actually exists
const fullPath = path.join(artifactDir, filename);
console.log("File exists at:", fullPath, fs.existsSync(fullPath));
