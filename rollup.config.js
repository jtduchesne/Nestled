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
      exports: 'named',
      name: 'Nestled',
      sourcemap: true
    },
    {
      file: 'dist/nestled.umd.min.js',
      format: 'umd',
      exports: 'named',
      name: 'Nestled',
      plugins: [terser()],
      sourcemap: true
    }
  ]
};
