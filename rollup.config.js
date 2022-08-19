import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'demo/index.js',
  output: {
    file: 'demo/bundle.js',
    format: 'iife',
  },
  plugins: [
    resolve(),
    commonjs(),
  ],
};
