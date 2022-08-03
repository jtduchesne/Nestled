import babel from '@rollup/plugin-babel';
import { terser } from "rollup-plugin-terser";

export default  {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/nestled.esm.js',
      format: 'esm',
      sourcemap: true
    },
    {
      file: 'dist/nestled.esm.min.js',
      format: 'esm',
      plugins: [terser()],
      sourcemap: true
    },
    {
      file: 'dist/nestled.umd.js',
      format: 'umd',
      name: 'Nestled',
      sourcemap: true
    },
    {
      file: 'dist/nestled.umd.min.js',
      format: 'umd',
      name: 'Nestled',
      plugins: [terser()],
      sourcemap: true
    }
  ],
  plugins: [
    babel({ babelHelpers: 'bundled', exclude: './node_modules/**'})
  ]
}