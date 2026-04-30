import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: `assets/js/[name].js`,
        chunkFileNames: `assets/js/[name].js`,
        assetFileNames: ({name}) => {
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
