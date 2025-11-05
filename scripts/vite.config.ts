import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'scripts/seedProducts.ts',
      formats: ['es'],
    },
  },
});