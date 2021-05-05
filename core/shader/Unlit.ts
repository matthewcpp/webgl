import {DefaultAttributeLocations, ShaderInterface} from "../Shader";

import {vec4} from "gl-matrix"

export interface UnlitParams {
    color: vec4;
}

export class UnlitShader implements ShaderInterface{
    private static _vertexAttributes = [DefaultAttributeLocations.Position];

    private _fragColor: WebGLUniformLocation;


    public init(program: WebGLProgram, gl: WebGL2RenderingContext) {
        this._fragColor = gl.getUniformLocation(program, "frag_color");

        if (this._fragColor == null) {
            throw new Error("Unable to get uniform location for frag_color in unlit shader.");
        }
    }

    public attributes() : Array<number> {
        return UnlitShader._vertexAttributes;
    }

    public push(program: WebGLProgram, gl: WebGL2RenderingContext, params: Object): void {
        const unlitParams = params as UnlitParams;
        gl.uniform4fv(this._fragColor, unlitParams.color);
    }

    createParams(): Object {
        return {
            color: vec4.fromValues(1.0, 1.0, 1.0, 1.0)
        };
    }

    copyParams(src: Object): Object {
        const unlitParams = src as UnlitParams;
        return {
            color: vec4.fromValues(unlitParams.color[0], unlitParams.color[1], unlitParams.color[2], unlitParams.color[3])
        };
    }
}

export interface UnlitTexturedParams {
    color: vec4;
    texture: WebGLTexture;
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

    createParams(): Object {
        return {
            color: vec4.fromValues(1.0, 1.0, 1.0, 1.0),
            texture: WebGLTexture = null
        };
    }

    copyParams(src: Object): Object {
        const params = src as UnlitTexturedParams;
        return {
            color: vec4.fromValues(params.color[0], params.color[1], params.color[2], params.color[3]),
            texture: params.texture
        };
    }
}