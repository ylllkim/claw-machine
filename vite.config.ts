/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
  },
  test: {
    // logic/ 순수 로직 테스트만 대상 — DOM 불필요
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
