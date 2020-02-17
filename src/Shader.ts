export interface ShaderInfo {
    attributes: string[];
    uniforms: string[];
}

export class Shader {
    public readonly program: WebGLProgram;
    public readonly attributes: Map<string, number>;
    public readonly uniforms: Map<string, WebGLUniformLocation>;

    constructor(program: WebGLProgram, attributes: Map<string, number>, uniforms: Map<string, WebGLUniformLocation>) {
        this.program = program;
        this.attributes = attributes;
        this.uniforms = uniforms;
    }

    public static create(gl: WebGLRenderingContext, name: string, vertexSource: string, fragmentSource: string, info: ShaderInfo): Shader {
        if (!info.attributes) {
            throw new Error(`Error compiling ${name}: Shader info must contain attributes array.`)
        }

        if (!info.uniforms) {
            throw new Error(`Error compiling ${name}: Shader info must contain uniforms array.`)
        }

        const shaderProgram = Shader.compileShader(gl, vertexSource, fragmentSource);
        const attributeLocations = Shader.getAttributeLocations(gl, name, shaderProgram, info);
        const uniformLocations = Shader.getUniformLocations(gl, name, shaderProgram, info);

        return new Shader(shaderProgram, attributeLocations, uniformLocations);
    }

    private static compileShader(gl:WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
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

    private static getAttributeLocations(gl: WebGLRenderingContext, name: string, program: WebGLProgram, info: ShaderInfo): Map<string, number> {
        const locations = new Map<string, number>();

        for (const attribute of info.attributes) {
            const location = gl.getAttribLocation(program, attribute);

            if (location === -1) {
                gl.deleteProgram(program);
                throw new Error(`Error compiling ${name}: attribute '${attribute}' not found`);
            }

            locations.set(attribute, location);
        }

        return locations;
    }

    private static getUniformLocations(gl: WebGLRenderingContext, name: string, program: WebGLProgram, info: ShaderInfo): Map<string, WebGLUniformLocation> {
        const locations = new Map<string, WebGLUniformLocation>();

        for (const uniform of info.uniforms) {
            const location = gl.getUniformLocation(program, uniform);

            if (location === null) {
                gl.deleteProgram(program);
                throw new Error(`Error compiling ${name}: uniform '${uniform}' not found`);
            }

            locations.set(uniform, location);
        }

        return locations;
    }
}