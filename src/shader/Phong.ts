import {DefaultAttributeLocations, ShaderInterface} from "../Shader.js";
import * as vec4 from "../../external/gl-matrix/vec4.js";

export interface PhongParams {
    diffuseColor: vec4;
}

export class PhongShader implements ShaderInterface {
    private static _vertexAttributes = [DefaultAttributeLocations.Position, DefaultAttributeLocations.Normal];

    private _diffuse_color: WebGLUniformLocation;

    public init(program: WebGLProgram, gl: WebGL2RenderingContext) {
        this._diffuse_color = gl.getUniformLocation(program, "diffuse_color");

        if (this._diffuse_color == null) {
            throw new Error("Unable to get uniform location for diffuse_color in phong shader.");
        }
    }

    public attributes() : Array<number> {
        return PhongShader._vertexAttributes;
    }

    public push(program: WebGLProgram, gl: WebGL2RenderingContext, params: Object): void {
        const phongParams = params as PhongParams;
        gl.uniform4fv(this._diffuse_color, phongParams.diffuseColor);
    }

    createParams(): Object {
        return {
            diffuseColor: vec4.fromValues(1.0, 1.0, 1.0, 1.0)
        };
    }

    copyParams(src: Object): Object {
        const unlitParams = src as PhongParams;
        return {
            diffuseColor: vec4.fromValues(unlitParams.diffuseColor[0], unlitParams.diffuseColor[1], unlitParams.diffuseColor[2], unlitParams.diffuseColor[3])
        };
    }
}