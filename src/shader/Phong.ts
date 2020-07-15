import {DefaultAttributeLocations, ShaderInterface} from "../Shader.js";
import * as vec4 from "../../external/gl-matrix/vec4.js";
import {Texture} from "../Texture.js";

export interface PhongParams {
    diffuseColor: vec4;
    specularStrength: number;
    shininess: number;
}

export class PhongShader implements ShaderInterface {
    private static _vertexAttributes = [DefaultAttributeLocations.Position, DefaultAttributeLocations.Normal];

    protected _diffuse_color: WebGLUniformLocation;
    protected _specular_strength: WebGLUniformLocation;
    protected _shininess: WebGLUniformLocation;

    public init(program: WebGLProgram, gl: WebGL2RenderingContext) {
        this._diffuse_color = gl.getUniformLocation(program, "diffuse_color");
        this._specular_strength = gl.getUniformLocation(program, "specular_strength");
        this._shininess = gl.getUniformLocation(program, "shininess");

        if (this._diffuse_color == null || this._specular_strength == null || this._shininess == null)
            throw new Error("Unable to get all uniform locations in phong shader");
    }

    public attributes() : Array<number> {
        return PhongShader._vertexAttributes;
    }

    public push(program: WebGLProgram, gl: WebGL2RenderingContext, params: Object): void {
        const phongParams = params as PhongParams;
        gl.uniform4fv(this._diffuse_color, phongParams.diffuseColor);
        gl.uniform1f(this._specular_strength, phongParams.specularStrength);
        gl.uniform1f(this._shininess, phongParams.shininess);
    }

    createParams(): Object {
        return {
            diffuseColor: vec4.fromValues(1.0, 1.0, 1.0, 1.0),
            specularStrength: 0.5,
            shininess: 32.0
        };
    }

    copyParams(src: Object): Object {
        const params = src as PhongParams;
        return {
            diffuseColor: vec4.fromValues(params.diffuseColor[0], params.diffuseColor[1], params.diffuseColor[2], params.diffuseColor[3]),
            specularStrength: params.specularStrength,
            shininess: params.shininess
        };
    }
}

export interface PhongTexturedParams extends PhongParams{
    diffuseTexture: WebGLTexture;
}

export class PhongTexturedShader extends PhongShader {
    private static _texuredVertexAttributes = [DefaultAttributeLocations.Position, DefaultAttributeLocations.Normal, DefaultAttributeLocations.TexCoord0];

    private _diffuse_sampler: WebGLUniformLocation;

    public attributes() : Array<number> {
        return PhongTexturedShader._texuredVertexAttributes;
    }

    public init(program: WebGLProgram, gl: WebGL2RenderingContext) {
        super.init(program, gl);

        this._diffuse_sampler = gl.getUniformLocation(program, "diffuse_sampler");
        if (this._diffuse_sampler == null)
            throw new Error("Unable to get all uniform locations in phong shader");
    }

    public push(program: WebGLProgram, gl: WebGL2RenderingContext, params: Object): void {
        super.push(program, gl, params);

        const phongParams = params as PhongTexturedParams;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, phongParams.diffuseTexture);
        gl.uniform1i(this._diffuse_sampler, 0);
    }

    createParams(): Object {
        const params = super.createParams() as PhongTexturedParams;
        params.diffuseTexture = Texture.defaultTexture;
        return params;
    }

    copyParams(src: Object): Object {
        const srcParams = src as PhongTexturedParams
        const copiedParams = super.copyParams(src) as PhongTexturedParams;
        copiedParams.diffuseTexture = srcParams.diffuseTexture
        return copiedParams;
    }
}