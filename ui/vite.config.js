import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isWeb = process.env.VITE_TARGET_ENV === 'web'

  return {
    plugins: [react()],
    
    // Resolve aliases
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@state': path.resolve(__dirname, './src/state'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
      },
    },

    // Development server
    server: {
      port: isWeb ? 3000 : 3001, // Use different ports for web and desktop dev
      strictPort: true,
      host: true,
      // Proxy API requests to backend
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },

    // Build options
    build: {
      outDir: isWeb ? 'dist-web' : 'dist',
      sourcemap: true,
      minify: 'terser',
      target: 'esnext',
      rollupOptions: {
        input: {
          main: isWeb ? path.resolve(__dirname, 'index.html') : path.resolve(__dirname, 'src/main.tsx'),
        },
      },
    },

    // Prevent vite from obscuring rust errors
    clearScreen: false,
    
    // Tauri configuration
    envPrefix: ['VITE_', 'TAURI_'],
  }
})
