import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  build: {
    // Kleinere Chunks → schnelleres erstes Laden
    rollupOptions: {
      output: {
        entryFileNames:  'assets/app-[hash].js',
        chunkFileNames:  'assets/chunk-[hash].js',
        assetFileNames:  'assets/style-[hash].[ext]',
        // Vendor-Splitting: React separat von App-Code
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    // Gzip-Threshold senken → mehr Dateien werden komprimiert
    chunkSizeWarningLimit: 600,
  },
})
