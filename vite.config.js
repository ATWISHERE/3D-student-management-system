import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/3D-student-management-system/',
  plugins: [react()],
  server: {
    port: 5555,
    host: true,
    strictPort: true
  }
})
