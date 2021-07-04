import {Shader, ShaderProgram} from "../Shader.js";
import {Material} from "../Material";
import {Texture} from "../Texture";
import {ShaderLibrary} from "./ShaderLibrary";

import {vec4} from "gl-matrix"
import {PhongMaterial, PhongShaderProgram} from "./Phong";

enum UnlitShaderFeatures {
    DiffuseMap = 1
}

export class UnlitMaterial extends Material {
    public diffuseColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
    public diffuseMap: Texture = null;

    public constructor(shader: Shader) {
        super(shader);
    }

    public featureMask(): number {
        let mask = 0;

        if (this.diffuseMap)
            mask |= UnlitShaderFeatures.DiffuseMap;

        return mask;
    }

    public copy(): UnlitMaterial {
        const material = new UnlitMaterial(this.shader);

        vec4.copy(material.diffuseColor, this.diffuseColor);
        material.diffuseMap = this.diffuseMap;

        return material;
    }
}

export class UnlitShaderProgram extends ShaderProgram {
    diffuseColorLocation: WebGLUniformLocation;
    diffuseSamplerLocation: WebGLUniformLocation;
}

export class UnlitShader implements Shader {
    public readonly name = "Unlit";
    public readonly vertexSource = ShaderLibrary.unlitVertex;
    public readonly fragmentSource = ShaderLibrary.unlitFragment;

    public preprocessorStatements(material: Material): string[] {
        const unlitMaterial = material as UnlitMaterial;
        const statements: string[] = [];

        if (unlitMaterial.diffuseMap)
            statements.push("#define WGL_UNLIT_DIFFUSE_MAP");

        return statements;
    }

    public programCompiled(gl: WebGL2RenderingContext, material: Material, programHash: number, program: WebGLProgram, globalBlockIndex: number, objectBlockIndex: number): ShaderProgram {
        const unlitShaderProgram = new UnlitShaderProgram(programHash, program, globalBlockIndex, objectBlockIndex);

        unlitShaderProgram.diffuseColorLocation = gl.getUniformLocation(program, "diffuse_color");
        unlitShaderProgram.diffuseSamplerLocation = gl.getUniformLocation(program, "diffuse_sampler");

        return unlitShaderProgram;
    }

    setUniforms(gl: WebGL2RenderingContext, material: Material) {
        const unlitMaterial = material as UnlitMaterial;
        const unlitProgram = material.program as UnlitShaderProgram;

        gl.uniform4fv(unlitProgram.diffuseColorLocation, unlitMaterial.diffuseColor);

        let textureUnit = 0;
        if (unlitMaterial.diffuseMap) {
            gl.activeTexture(gl.TEXTURE0 + textureUnit);
            gl.bindTexture(gl.TEXTURE_2D, unlitMaterial.diffuseMap.handle);
            gl.uniform1i(unlitProgram.diffuseSamplerLocation, textureUnit++);
        }
    }
}