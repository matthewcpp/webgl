import typescript from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve';
import pkg from './package.json'

export default {
    input: 'src/WebGL.ts',
    output: [
        {
            file: pkg.module,
            format: 'es',
            paths: {
                "gl-matrix": "./gl-matrix/index.js"
            }
        },
    ],
    external: [ "gl-matrix" ],
    plugins: [
        resolve(),
        typescript({
            typescript: require('typescript'),
        }),

    ],
}