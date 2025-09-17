import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/HHLC-user-study/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        demographicSurvey: resolve(__dirname, 'public/demographicSurvey.html'),
        instructions: resolve(__dirname, 'public/instructions.html'),
        study: resolve(__dirname, 'public/study.html'),
        postStudy: resolve(__dirname, 'public/postStudy.html'),
        vlTest: resolve(__dirname, 'public/vlTest.html')
      },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && (assetInfo.name.endsWith('.png') || assetInfo.name.endsWith('.jpg') || assetInfo.name.endsWith('.gif'))) {
            return 'images/[name][extname]';
          }
          return 'assets/[name][extname]';
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  publicDir: 'public'
})