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
        gl.uniform4f(this._fragColor, unlitParams.color[0], unlitParams.color[1], unlitParams.color[2], unlitParams.color[3]);
    }
}