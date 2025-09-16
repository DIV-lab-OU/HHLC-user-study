import { defineConfig } from 'vite'

export default defineConfig({
  base: '/HHLC-user-study/', // Update this to match your GitHub repo name
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html',
        demographics: './public/demographicSurvey.html',
        instructions: './public/instructions.html',
        study: './public/study.html',
        postStudy: './public/postStudy.html',
        vlTest: './public/vlTest.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  publicDir: 'public'
})