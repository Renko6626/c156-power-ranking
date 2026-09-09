import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base: './' 让产物可以挂在任意子路径（GitHub Pages 的 /<repo>/）下
export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
