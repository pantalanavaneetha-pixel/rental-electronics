import { defineConfig, transformWithOxc } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'treat-js-files-as-jsx',
      enforce: 'pre',
      async transform(code, id) {
        // Normalize windows path backslashes to forward slashes
        const normalizedId = id.replace(/\\/g, '/');
        if (normalizedId.endsWith('src/App.js')) {
          return transformWithOxc(code, id, {
            lang: 'jsx',
          });
        }
        return null;
      },
    },
    react(),
  ],
})
