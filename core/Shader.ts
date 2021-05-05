export interface ShaderInterface {
    // called after the shader has been successfully compiled
    init(program: WebGLProgram, gl: WebGL2RenderingContext): void;

    // called by renderer to know what attributes should be bound for this program
    attributes() : Array<number>;

    // called when an object will be drawn with this shader
    push(program: WebGLProgram, gl: WebGL2RenderingContext, params: Object);

    // create a fresh copy of shader parameters with default values
    createParams(): Object;

    // deep copy an existing set of shader parameters
    copyParams(src: Object): Object;
}

export enum DefaultAttributeLocations {
    Position = 0,
    Normal = 1,
    TexCoord0 = 2
}

export class ShaderData {
    public preprocessorDefines = new Array<string>();
    public vertexSource: string;
    public fragmentSource: string;
    public shaderInterface: ShaderInterface;
}

export class Shader {
    public constructor(
        public readonly program: WebGLProgram,
        public readonly globalBlockIndex: number,
        public readonly objectBlockIndex: number,
        public readonly shaderInterface: ShaderInterface,
    ){}

    public static create(name: string, shaderData: ShaderData, gl: WebGL2RenderingContext) {
        const program = Shader._compileShader(name, shaderData.vertexSource, shaderData.fragmentSource, shaderData.preprocessorDefines, gl);

        const wglGlobalDataIndex = gl.getUniformBlockIndex(program, 'wglData');
        const wglObjectDataLocation = gl.getUniformBlockIndex(program, 'wglModelData');

        if (wglGlobalDataIndex == -1)
            throw new Error(`Unable to find wglData uniform block`);
        if (wglObjectDataLocation == -1)
            throw new Error(`Unable to find wglModelData uniform block`);

        shaderData.shaderInterface.init(program, gl);

        return new Shader(program, wglGlobalDataIndex, wglObjectDataLocation, shaderData.shaderInterface);
    }

    private static _shaderDefineStr = "//!WGL_DEFINES";
    private static _compileShader(name: string, vertexSource: string, fragmentSource: string, preprocessorDefines: string[], gl: WebGL2RenderingContext) {
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

