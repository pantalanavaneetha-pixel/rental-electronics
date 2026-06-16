const path = require('path');

const artifactDir = 'C:\\Users\\panta\\.gemini\\antigravity\\brain\\524d729f-9962-4b5c-8870-f3b05f487c42';

// Let's try to resolve with lowercase and uppercase C drive letter, backslashes, relative paths, etc.
const candidates = [
  '/C:/Users/panta/.gemini/antigravity/brain/524d729f-9962-4b5c-8870-f3b05f487c42/dashboard_wireframe_mockup_1781605730440.png',
  '/c:/Users/panta/.gemini/antigravity/brain/524d729f-9962-4b5c-8870-f3b05f487c42/dashboard_wireframe_mockup_1781605730440.png',
  '/Users/panta/.gemini/antigravity/brain/524d729f-9962-4b5c-8870-f3b05f487c42/dashboard_wireframe_mockup_1781605730440.png',
  '/Users\\panta\\.gemini\\antigravity\\brain\\524d729f-9962-4b5c-8870-f3b05f487c42\\dashboard_wireframe_mockup_1781605730440.png',
  '/../../.gemini/antigravity/brain/524d729f-9962-4b5c-8870-f3b05f487c42/dashboard_wireframe_mockup_1781605730440.png',
  '/..\\..\\.gemini\\antigravity\\brain\\524d729f-9962-4b5c-8870-f3b05f487c42\\dashboard_wireframe_mockup_1781605730440.png'
];

candidates.forEach(c => {
  const resolved = path.resolve(c);
  console.log(`Input: ${c}`);
  console.log(`Resolved: ${resolved}`);
  console.log(`startsWith: ${resolved.startsWith(artifactDir)}`);
});
