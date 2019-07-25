import buble from 'rollup-plugin-buble'
import typescript from 'rollup-plugin-typescript'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import vue from 'rollup-plugin-vue'
export default {
  input: 'src/index.ts',
  output: {
    name: 'VuePullUpPanel',
    file: 'dist/vue_pull_up_panel.js',
    format: 'umd',
    sourcemap: true,
    exports: 'named',
    globals: {
      vue: 'Vue'
    }
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript(),
    vue({
      css: true,
      compileTemplate: true
    }),
    buble()
  ],
  external: ['vue']
}
