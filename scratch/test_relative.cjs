const path = require('path');
const artifactDir = 'C:\\Users\\panta\\.gemini\\antigravity\\brain\\524d729f-9962-4b5c-8870-f3b05f487c42';
const resolved = 'c:\\Users\\panta\\.gemini\\antigravity\\brain\\524d729f-9962-4b5c-8870-f3b05f487c42\\dashboard_wireframe_mockup_1781605730440.png';

const rel = path.relative(artifactDir, resolved);
console.log("Relative:", rel);
console.log("startsWith ..:", rel.startsWith('..'));
console.log("isAbsolute:", path.isAbsolute(rel));
