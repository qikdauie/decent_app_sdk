import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'client/index': resolve(__dirname, 'src/client/index.js'),
        'service-worker/index': resolve(__dirname, 'src/service-worker/index.js'),
        'protocols/index': resolve(__dirname, 'src/protocols/index.js'),
        'components/index': resolve(__dirname, 'src/components/index.js'),
      },
      output: {
        entryFileNames: (chunkInfo) => `${chunkInfo.name}.js`,
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        format: 'es',
        preserveModules: false,
      },
      external: [],
    },
    lib: false,
  },
});


