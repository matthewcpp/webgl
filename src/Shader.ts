import {UniformBlock, UniformBlockInfo} from "./UniformBlock.js";

export interface ShaderInfo {
    attributes: string[];
    uniforms: string[];
    uniformBufferSize: number;
    uniformBlocks: UniformBlockInfo[];
}

export class ShaderData {
    public vertexSource: string;
    public fragmentSource: string;
    public info: ShaderInfo;
}

export class Shader {
    public readonly program: WebGLProgram;
    public readonly attributes: Map<string, number>;
    public readonly uniforms: Map<string, WebGLUniformLocation>;
    public readonly uniformBlocks: Map<string, UniformBlock>;

    public readonly uniformBuffer: WebGLBuffer;
    public readonly clientData: ArrayBuffer;

    constructor(program: WebGLProgram, attributes: Map<string, number>, uniforms: Map<string, WebGLUniformLocation>,
                uniformBuffer: WebGLBuffer, clientData: ArrayBuffer, uniformBlocks: Map<string, UniformBlock>) {
        this.program = program;
        this.attributes = attributes;
        this.uniforms = uniforms;

        this.uniformBuffer = uniformBuffer;
        this.clientData = clientData;
        this.uniformBlocks = uniformBlocks;
    }

    /** pushes the current state of the client array to the openGL buffer */
    public updateUniformBuffer(gl: WebGL2RenderingContext){
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.uniformBuffer);
        gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.clientData);
    }

    /** Sets up the uniform block bindings for this shader.  Note this should be called right after glUseProgram. */
    public bindUniformBlocks(gl: WebGL2RenderingContext) {
        this.uniformBlocks.forEach((block: UniformBlock) => {
            gl.uniformBlockBinding(this.program, block.blockIndex, block.bindPoint);
        });
    }

    public static create(gl: WebGL2RenderingContext, name: string, shaderData: ShaderData): Shader {
        if (!shaderData.info.attributes) {
            throw new Error(`Error compiling ${name}: Shader info must contain attributes array.`)
        }

        if (!shaderData.info.uniforms) {
            throw new Error(`Error compiling ${name}: Shader info must contain uniforms array.`)
        }

        const shaderProgram = Shader.compileShader(gl, shaderData.vertexSource, shaderData.fragmentSource);
        const clientData = new ArrayBuffer(shaderData.info.uniformBufferSize);
        const uniformBuffer = gl.createBuffer();
        gl.bindBuffer(gl.UNIFORM_BUFFER, uniformBuffer);
        gl.bufferData(gl.UNIFORM_BUFFER, clientData, gl.DYNAMIC_DRAW);

        try {
            const attributeLocations = Shader.getAttributeLocations(gl, name, shaderProgram, shaderData.info);
            const uniformLocations = Shader.getUniformLocations(gl, name, shaderProgram, shaderData.info);
            const uniformBlocks = Shader.createUniformBlocks(gl, shaderProgram, name, shaderData.info, uniformBuffer, clientData);

            return new Shader(shaderProgram, attributeLocations, uniformLocations, uniformBuffer, clientData, uniformBlocks);
        }
        catch (e) {
            gl.deleteProgram(shaderProgram);
            gl.deleteBuffer(uniformBuffer);

            throw e;
        }
    }

    private static compileShader(gl:WebGL2RenderingContext, vertexSource: string, fragmentSource: string) {
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

    private static getAttributeLocations(gl: WebGL2RenderingContext, name: string, program: WebGLProgram, info: ShaderInfo): Map<string, number> {
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

    private static getUniformLocations(gl: WebGL2RenderingContext, name: string, program: WebGLProgram, info: ShaderInfo): Map<string, WebGLUniformLocation> {
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

    private static nextUniformBlockBindPoint = 0;

    /**
     * Creates all the uniform block storage for this shader.
     * Note that all unform blocks will be tightly packed into the client data array that is passed into this function.
     * Each uniform block in the shader will have its own unique bind point.
     * This function assumes that the uniform block is using std140 alignment for all uniform blocks.
     * TODO: explicitly handle alignment rules.  For now assume that all types used in blocks align nicely.
     */
    private static createUniformBlocks(gl: WebGL2RenderingContext, shader: WebGLProgram, name: string, info: ShaderInfo, uniformBuffer: WebGLBuffer, clientBuffer: ArrayBuffer): Map<string, UniformBlock> {
        const uniformBlocks = new Map<string, UniformBlock>();
        let bufferOffest = 0;

        for (const uniformBlockInfo of info.uniformBlocks) {
            let blockSize = 0;
            const blockIndex = gl.getUniformBlockIndex(shader, uniformBlockInfo.name);

            if (blockIndex === gl.INVALID_INDEX) {
                throw new Error(`Error Building shader: ${name}.  Could not locate Uniform block: ${uniformBlockInfo.name}`);
            }

            const uniformBlock = new UniformBlock(blockIndex, Shader.nextUniformBlockBindPoint++);
            uniformBlocks.set(uniformBlockInfo.name, uniformBlock);

            for (const member of uniformBlockInfo.members) {
                switch (member.type) {
                    case "mat4":
                        const bufferView = new Float32Array(clientBuffer, blockSize, 16);
                        uniformBlock.members.set(member.name, bufferView);
                        blockSize += 64;
                        break;

                    default:
                        throw new Error(`Error Building shader: ${name}.  Unsupported data type: '${member.type}'`);
                }
            }

            gl.bindBufferRange(gl.UNIFORM_BUFFER, uniformBlock.bindPoint, uniformBuffer, bufferOffest, blockSize);

            bufferOffest += blockSize;
        }

        return uniformBlocks;
    }
}