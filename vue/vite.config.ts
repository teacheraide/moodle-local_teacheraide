import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

import { resolve } from 'node:path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            // treat all tags with a dash as custom elements
            isCustomElement: (tag) => tag.includes('-')
          }
        }
      }),
      vueJsx(),
      vueDevTools()
    ],
    build: {
      // outDir: resolve(__dirname, `../amd/${mode === 'production' ? 'build' : 'src'}`),
      outDir: resolve(__dirname, `../amd/build`),
      assetsDir: 'dist',
      rollupOptions: {
        preserveEntrySignatures: 'strict',
        input: {
          main: resolve(__dirname, 'src/main.ts')
        },
        output: {
          format: 'amd',
          // entryFileNames: `app-lazy${mode === 'production' ? '.min' : ''}.js`,
          entryFileNames: `app-lazy.min.js`,
          amd: {
            define: 'define'
          }
        },
        external: [
          'core/ajax',
          'core/str',
          'core/modal_factory',
          'core/modal_events',
          'core/fragment',
          'core/yui',
          'core/localstorage',
          'core/notification',
          'jquery'
        ]
      },
      sourcemap: mode === 'development',
      minify: mode === 'production' ? 'esbuild' : false
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  }
})
