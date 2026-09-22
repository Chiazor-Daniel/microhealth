import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  /* This is the *second* instance — the one running the vitals branch beside
     the live app rather than instead of it. Three things differ from the root
     config, and all three have to:
       - port: otherwise it collides with the running server.
       - proxy target: otherwise it would serve the new UI off the *old*
         backend's data, which is the worst of both and very hard to notice.
       - cacheDir: node_modules is hard-linked from the primary checkout, so a
         shared Vite cache would have the two branches fighting over it. */
  cacheDir: 'node_modules/.vite-vitals',
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    host: true,
    port: 5175,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:3002",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:3002",
        changeOrigin: true,
        ws: true,
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
