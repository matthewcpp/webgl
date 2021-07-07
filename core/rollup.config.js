import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2'

import combineDeclarations from "../build/combine_declarations";
import pkg from '../package.json'

const fs = require("fs");
const path = require("path");

const declarationSrcDir = path.resolve(__dirname, "../dist/scratch");
const declarationFile = path.resolve(__dirname, "..", pkg.types);
const shaderDir = path.resolve(__dirname, "glsl");

export default {
    input: path.resolve(__dirname, 'WebGL.ts'),
    output: [
        {
            file: pkg.module,
            format: 'es',
            paths: {
                "gl-matrix": "/gl-matrix/index.js"
            }
        }
    ],
    external: [ "gl-matrix" ],
    plugins: [
        replace({
            _WGL_GLSL_COMMON_HEADER_: () => { return fs.readFileSync(path.join(shaderDir, "wgl.header.glsl"), {encoding: "utf8"}); },
            _WGL_GLSL_COMMON_VERT_: () => { return fs.readFileSync(path.join(shaderDir, "wgl.vert.glsl"), {encoding: "utf8"}); },
            _WGL_UNLIT_FRAGMENT_SOURCE_: () => { return fs.readFileSync(path.join(shaderDir, "unlit.frag.glsl"), {encoding: "utf8"}); },
            _WGL_UNLIT_VERTEX_SOURCE_: () => { return fs.readFileSync(path.join(shaderDir, "unlit.vert.glsl"), {encoding: "utf8"}); },
            _WGL_GLSL_PHONG_FRAGMENT_: () => { return fs.readFileSync(path.join(shaderDir, "phong.frag.glsl"), {encoding: "utf8"}); },
            _WGL_GLSL_PHONG_VERTEX_: () => { return fs.readFileSync(path.join(shaderDir, "phong.vert.glsl"), {encoding: "utf8"}); }
        }),
        resolve(),
        typescript({
            useTsconfigDeclarationDir: true,
            tsconfig: path.resolve(__dirname, "tsconfig.json"),
            typescript: require('typescript'),
        }),
        combineDeclarations({
            inputDir: declarationSrcDir,
            outputFile: declarationFile
        })
    ],
}