import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import livereload from 'rollup-plugin-livereload';

export default {
  input: 'src/demo/index.ts',
  output: {
    file: 'src/demo/bundle.js',
    format: 'iife',
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      useTsconfigDeclarationDir: true,
      tsconfig: 'tsconfig.json',
    }),
    // Live reload only in watch mode (npm run dev); otherwise its server keeps `npm run build` from exiting.
    process.env.ROLLUP_WATCH && livereload(),
  ],
};
