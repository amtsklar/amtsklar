import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const COPYRIGHT_BANNER = `/* AmtsKlar © 2025-2026 Philipp Hofer | www.amtsklar.at | All rights reserved | Unauthorized copying/reverse engineering prohibited */`

export default defineConfig({
  plugins: [react()],

  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 3,
        toplevel: true,
        dead_code: true,
        unsafe: true,
        unsafe_comps: true,
      },
      mangle: {
        toplevel: true,
        keep_classnames: false,
        keep_fnames: false,
      },
      format: {
        comments: false,
        ascii_only: true,
        preamble: COPYRIGHT_BANNER, // Copyright als erste Zeile in JS
      },
    },

    rollupOptions: {
      output: {
        entryFileNames:  'assets/[hash].js',
        chunkFileNames:  'assets/[hash].js',
        assetFileNames:  'assets/[hash].[ext]',
        manualChunks: {
          'r': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false,
  },
})
