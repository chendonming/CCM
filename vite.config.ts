import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Inject React DevTools standalone script only in dev mode
    {
      name: 'react-devtools',
      transformIndexHtml: {
        order: 'post',
        handler(html, ctx) {
          if (!ctx.server) return html
          return html.replace('</head>', '    <script src="http://localhost:8097"></script>\n  </head>')
        },
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Prevent vite from obscuring Rust errors
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
})
