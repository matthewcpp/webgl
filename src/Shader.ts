export interface ShaderInterface {
    // called after the shader has been successfully compiled
    init(program: WebGLProgram, gl: WebGL2RenderingContext);

    // called to query whether the given geometry attribute should be activated for this shader
    attributes() : Array<number>;

    // called when an object will be drawn with this shader
    push(program: WebGLProgram, gl: WebGL2RenderingContext, params: any)
}

export enum DefaultAttributeLocations {
    Position = 0,
    Normal = 1,
    TexCoord0
}

export class ShaderData {
    public preprocessorDefines = new Array<string>();
    public vertexSource: string;
    public fragmentSource: string;
    public shaderInterface: ShaderInterface;
    public createParams: () => Object;
}

export class Shader {
    public constructor(
        public readonly program: WebGLProgram,
        public readonly blockIndex: number,
        public readonly mvpLocation: WebGLUniformLocation,
        public readonly shaderInterface: ShaderInterface,
        public readonly createParams: () => Object
    ){}

    public static create(shaderData: ShaderData, gl: WebGL2RenderingContext) {
        const program = Shader._compileShader(shaderData.vertexSource, shaderData.fragmentSource, shaderData.preprocessorDefines, gl);

        const wglDataIndex = gl.getUniformBlockIndex(program, 'wglData');
        const wglMvpLocation = gl.getUniformLocation(program, "wgl_mvp");

        if (wglDataIndex == -1)
            throw new Error(`Unable to find wglData uniform block`);
        if (wglMvpLocation == null)
            throw new Error(`Unable to find wgl_mvp uniform`);

        shaderData.shaderInterface.init(program, gl);

        return new Shader(program, wglDataIndex, wglMvpLocation, shaderData.shaderInterface, shaderData.createParams);
    }

    private static _shaderDefineStr = "//!WGL_DEFINES";
    private static _compileShader(vertexSource: string, fragmentSource: string, preprocessorDefines: string[], gl: WebGL2RenderingContext) {
        if (preprocessorDefines.length > 0) {
            const preprocessorDefinitions = preprocessorDefines.join("\n");
            vertexSource = vertexSource.replace(Shader._shaderDefineStr, preprocessorDefinitions);
            fragmentSource = fragmentSource.replace(Shader._shaderDefineStr, preprocessorDefinitions);
        }

        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            const errorMessage = `Error compiling ${name} vertex shader: ${gl.getShaderInfoLog(vertexShader)}`;
            gl.deleteShader(vertexShader);

            throw new Error(errorMessage);
        }

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);

        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            const errorMessage = `Error compiling ${name} fragment shader: ${gl.getShaderInfoLog(fragmentShader)}`;
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);

            throw new Error(errorMessage);
        }

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            const errorMessage = `Error linking ${name}: ${gl.getProgramInfoLog(shaderProgram)}`;
            gl.deleteProgram(shaderProgram);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);

            throw new Error(errorMessage);
        }

        return shaderProgram;
    }
}

