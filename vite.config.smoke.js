import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 仅用于冒烟测试：jsdom 不支持 <script type="module">，
// 因此额外产出一份 IIFE（经典脚本）构建，让 jsdom 能真正执行 Vue。
export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    outDir: 'dist-smoke',
    modulePreload: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: { format: 'iife', inlineDynamicImports: true }
    }
  }
})
