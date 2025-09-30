import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['test/setup.js'],
    include: [
      'src/**/*.test.{js,jsx,ts,tsx}'
    ],
    exclude: ['node_modules', 'dist']
  }
});
