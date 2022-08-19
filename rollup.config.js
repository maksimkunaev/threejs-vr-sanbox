import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'demo/index.js',
  external: ['mapbox-gl-dev'],
  output: {
    file: 'demo/bundle.js',
    format: 'iife',
    // name: 'bundle',
  },
  plugins: [
    resolve(), // so Rollup can find `mapbox-gl`
    commonjs(),
  ],
};
