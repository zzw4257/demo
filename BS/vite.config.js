import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    vue(),
    nodePolyfills({
      // Enable specific polyfills
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Enable specific protocols for Node.js
      protocolImports: true,
    }),
  ],
  server: {
    port: 3001,
    host: 'localhost'
  },
  build: {
    outDir: 'dist'
  },
  define: {
    global: 'globalThis',
  },
})
