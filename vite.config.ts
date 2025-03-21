import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts')
      },
      output: {
        entryFileNames: (chunk) => {
          return chunk.name === 'background' || chunk.name === 'content'
            ? '[name].js'
            : 'assets/[name]-[hash].js';
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js'
      }
    },
    emptyOutDir: false
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  base: './',
  // Define our own patterns for HTML files to ensure correct path references
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'html') {
        if (filename.startsWith('assets/')) {
          return '../' + filename;
        }
        return filename;
      }
      // For other assets like CSS references from CSS
      return filename;
    }
  }
});
