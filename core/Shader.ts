import {Material} from "./Material";
import {ShaderLibrary} from "./shader/ShaderLibrary";
import {AttributeType, Primitive} from "./Mesh";

export class ShaderProgram {
    public constructor(
    /** The unique hash for this program.
     * This distinguishes it from other compiled versions of the same shader source code.
     * The hash is a combination of primitive (16 bits) attributes and shader features (16 bits).
     */
    public readonly programHash: number,

    /** Handle to compiled shader object. */
    public readonly program: WebGLProgram,

    /** The index of global uniform block.  This uniform block represents common data such as camera and lighting info that is passed to all shaders from the webgl engine */
    public readonly globalBlockIndex: number,

    /** Index of the object block.  This is object specific data such as transform  and normal matrix passed to the shader by the webgl engine. */
    public readonly objectBlockIndex: number
    ){}
}

export interface Shader {
    readonly name: string;
    readonly vertexSource: string;
    readonly fragmentSource: string;

    preprocessorStatements(material: Material): string[];
    programCompiled(gl: WebGL2RenderingContext, material: Material, programHash: number, program: WebGLProgram, globalBlockIndex: number, objectBlockIndex: number): ShaderProgram;
    setUniforms(gl: WebGL2RenderingContext, material: Material);
}


export class Shaders {
    private _shaderPrograms = new Map<Shader, ShaderProgram[]>();

    public constructor(
        private _gl: WebGL2RenderingContext,
        public readonly defaultPhong: Shader,
        public readonly defaultUnlit: Shader
    ){ }

    public updateProgram(material: Material, primitive: Primitive) {
        material.program = null;

        if (material.shader === null)
            return;

        let shaderPrograms = this._shaderPrograms.get(material.shader);

        if (!shaderPrograms) {
            shaderPrograms = [];
            this._shaderPrograms.set(material.shader, shaderPrograms);
        }

        const programHash = primitive.attributeMask | (material.featureMask() << 16);
        for (const program of shaderPrograms) {
            if (program.programHash === programHash) {
                material.program = program;
                return;
            }
        }

        if (material.program === null) {
            this._compileShader(primitive, material, programHash);
        }
    }

    public clear() {
        this._shaderPrograms.forEach((programs: ShaderProgram[]) => {
            for (const program of programs) {
                this._gl.deleteProgram(program.program);
            }
        })

        this._shaderPrograms.clear();
    }

    private _compileShader(primitive: Primitive, material: Material, programHash: number) {
        try {
            const attributePreprocessorStatements = Shaders.attributePreprocessorStatements(primitive);
            const shaderPreprocessorStatements = material.shader.preprocessorStatements(material);
            const preprocessorCode = attributePreprocessorStatements.concat(shaderPreprocessorStatements).join('\n') + "\n";

            const vertexSource = ShaderLibrary.commonHeader + ShaderLibrary.commonVertex + preprocessorCode + material.shader.vertexSource;
            const fragmentSource = ShaderLibrary.commonHeader + preprocessorCode + material.shader.fragmentSource;

            const webglProgram = this._webglCompile(vertexSource, fragmentSource);

            const wglGlobalDataIndex = this._gl.getUniformBlockIndex(webglProgram, 'wglData');
            const wglObjectDataLocation = this._gl.getUniformBlockIndex(webglProgram, 'wglObjectData');

            console.assert(wglGlobalDataIndex !== -1 && wglObjectDataLocation !== -1);

            const shaderProgram = material.shader.programCompiled(this._gl, material, programHash, webglProgram, wglGlobalDataIndex, wglObjectDataLocation);
            material.program = shaderProgram;

            let shaderPrograms = this._shaderPrograms.get(material.shader);
            shaderPrograms.push(shaderProgram);
        }
        catch(e) {
            throw new Error(`${material.shader.name}: ${e.toString()}`)
        }
    }

    private _webglCompile(vertexSource: string, fragmentSource: string): WebGLProgram {
        const gl = this._gl;

        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            const errorMessage = `Error compiling vertex shader: ${gl.getShaderInfoLog(vertexShader)}`;
            gl.deleteShader(vertexShader);

            throw new Error(errorMessage);
        }

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);

        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            const errorMessage = `Error compiling fragment shader: ${gl.getShaderInfoLog(fragmentShader)}`;
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);

            throw new Error(errorMessage);
        }

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            const errorMessage = `Error linking shader program: ${gl.getProgramInfoLog(shaderProgram)}`;
            gl.deleteProgram(shaderProgram);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);

            throw new Error(errorMessage);
        }

        return shaderProgram;
    }

    private static attributePreprocessorStatements(primitive: Primitive): string[] {
        const preprocessorStatements: string[] = [];

        for (const attribute of primitive.attributes) {
            switch (attribute.type) {
                case AttributeType.Position:
                    preprocessorStatements.push("#define WGL_POSITIONS");
                    break;

                case AttributeType.Normal:
                    preprocessorStatements.push("#define WGL_NORMALS");
                    break;

                case AttributeType.TexCoord0:
                    preprocessorStatements.push("#define WGL_TEXTURE_COORDS0");
                    break;
            }
        }

        return preprocessorStatements;
    }
}

