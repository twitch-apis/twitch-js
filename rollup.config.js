import alias from '@rollup/plugin-alias'
import json from '@rollup/plugin-json'
import replace from '@rollup/plugin-replace'
import commonjs from 'rollup-plugin-commonjs'
import fileSize from 'rollup-plugin-filesize'
import gzipPlugin from 'rollup-plugin-gzip'
import resolve from 'rollup-plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import typescript from 'rollup-plugin-typescript'

import path from 'path'

import pkg from './package.json'

const aliasPlugin = alias({
  entries: Object.entries(pkg.browser).map(([find, replacement]) => ({
    find,
    replacement: replacement.startsWith('.')
      ? path.resolve(__dirname, replacement)
      : path.resolve(__dirname, 'node_modules', replacement),
  })),
})

const commonPlugins = [
  json(),
  typescript(),
  terser({ output: { comments: false } }),
  fileSize({ showMinifiedSize: false }),
  replace({
    'process.env.NODE_ENV': JSON.stringify('production'),
  }),
]

export default [
  {
    input: 'src/browser.ts',
    output: {
      name: 'TwitchJs',
      file: pkg.unpkg,
      format: 'iife',
      exports: 'default',
      sourcemap: true,
    },
    plugins: [
      aliasPlugin,
      resolve(),
      commonjs(),
      gzipPlugin(),
      ...commonPlugins,
    ],
  },

  {
    input: 'src/index.ts',
    output: [
      { file: pkg.main, format: 'cjs', exports: 'named', sourcemap: true },
      { file: pkg.module, format: 'es', exports: 'named', sourcemap: true },
    ],
    plugins: [...commonPlugins],
    external: id =>
      Object.keys(pkg.dependencies).some(dep => id.startsWith(dep)),
  },
]
