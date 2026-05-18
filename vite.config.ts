import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Visual-Searcher/',
  optimizeDeps: {
    exclude: ['react-force-graph-3d'],
  },
})
