import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2'

import prepareShader from "./build/prepare_shader";
import combineDeclarations from "./build/combine_declarations";
import pkg from './package.json'

const path = require("path");

const declarationSrcDir = path.resolve(__dirname, "dist/scratch");
const declarationFile = path.resolve(__dirname, pkg.types);

export default {
    input: 'src/WebGL.ts',
    output: [
        {
            file: pkg.module,
            format: 'es'
        },
    ],
    external: [ "gl-matrix" ],
    plugins: [
        replace({
            _WGL_UNLIT_FRAGMENT_SOURCE_: () => { return prepareShader("shaders/unlit.frag.glsl"); },
            _WGL_UNLIT_VERTEX_SOURCE_: () => { return prepareShader("shaders/unlit.vert.glsl"); },
            _WGL_PHONG_FRAGMENT_SOURCE_: () => { return prepareShader("shaders/phong.frag.glsl"); },
            _WGL_PHONG_VERTEX_SOURCE_: () => { return prepareShader("shaders/phong.vert.glsl"); }
        }),
        resolve(),
        typescript({
            useTsconfigDeclarationDir: true,
            tsconfig: path.resolve(__dirname, "tsconfig.json"),
            tsconfigOverride: {
                compilerOptions: {
                    declaration: true,
                    declarationDir: declarationSrcDir
                }
            },
            typescript: require('typescript'),
        }),
        combineDeclarations({
            inputDir: declarationSrcDir,
            outputFile: declarationFile
        })
    ],
}