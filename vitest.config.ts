import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // Run in Node environment — no browser APIs needed for pure service tests
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      // Mirror the `@/*` path alias defined in tsconfig.json
      '@': path.resolve(__dirname, './src'),
    },
  },
})
