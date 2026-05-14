import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/httpmocks/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
