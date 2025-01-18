import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import libCss from 'vite-plugin-libcss';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), libCss()],
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'VueInfiniteCarousel',
      fileName: (format) => `infinite-carousel-vue.${format}.js`
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        }
      }
    },
    cssCodeSplit: true,
    assetsInlineLimit: 0
  }
})
