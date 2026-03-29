import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const defaultProdBase = '/four-word-thinking/'
  const env = loadEnv(mode, '.', '')

  return {
    plugins: [react()],
    // Override with VITE_BASE_PATH in CI/forks when repo name differs.
    base: env.VITE_BASE_PATH || (mode === 'production' ? defaultProdBase : '/'),
  }
})
