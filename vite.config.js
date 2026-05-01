import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  base: '/',
  css: {
    // Disable PostCSS auto-detection of tailwindcss.
    // CSS files (main.css, style.css) are plain CSS.
    // Tailwind is loaded via CDN in each module's <head> (handled by patchFrame in app.js).
    postcss: {
      plugins: [],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: `assets/js/[name].js`,
        chunkFileNames: `assets/js/[name].js`,
        assetFileNames: ({ name }) => {
          if (name && name.endsWith('.css')) {
            return `assets/css/[name].[ext]`;
          }
          return `assets/[name].[ext]`;
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
