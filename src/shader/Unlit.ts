import * as vec4 from "../../external/gl-matrix/vec4.js";
import {ShaderInterface} from "../Shader.js";

export class UnlitParams {
    public color: vec4 = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
}

export class UnlitShader implements ShaderInterface{
    private _fragColor: WebGLUniformLocation;
    private static _vertexAttributes = [0];

    public init(program: WebGLProgram, gl: WebGL2RenderingContext) {
        this._fragColor = gl.getUniformLocation(program, "frag_color");

        if (this._fragColor == null) {
            throw new Error("Unable to get uniform location for frag_color in unlit shader.")
        }
    }

    public attributes() : Array<number> {
        return UnlitShader._vertexAttributes;
    }

    public push(program: WebGLProgram, gl: WebGL2RenderingContext, params: any) {
        const unlitParams = params as UnlitParams;
        gl.uniform4fv(this._fragColor, unlitParams.color);
    }
}

export class UnlitTexturedParams {
    public color: vec4 = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
    public texture: WebGLTexture = null;
}

export class UnlitTexturedShader implements ShaderInterface{
    private _fragColor: WebGLUniformLocation;
    private _sampler0: WebGLUniformLocation;
    private static _vertexAttributes = [0, 2];

    public init(program: WebGLProgram, gl: WebGL2RenderingContext) {
        this._fragColor = gl.getUniformLocation(program, "frag_color");
        this._sampler0 = gl.getUniformLocation(program, "sampler0");

        if (this._fragColor == null || this._sampler0 == null) {
            throw new Error("Unable to get uniform location for frag_color in unlit shader.")
        }
    }

    public attributes() : Array<number> {
        return UnlitTexturedShader._vertexAttributes;
    }

    public push(program: WebGLProgram, gl: WebGL2RenderingContext, params: any) {
        const unlitParams = params as UnlitTexturedParams;
        gl.uniform4fv(this._fragColor, unlitParams.color);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, unlitParams.texture);
        gl.uniform1i(this._sampler0, 0);
    }
}