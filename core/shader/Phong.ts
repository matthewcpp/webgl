import {Shader, ShaderProgram} from "../Shader.js";
import {vec4} from "gl-matrix"
import {Material} from "../Material";
import {Texture} from "../Texture";
import {ShaderLibrary} from "./ShaderLibrary";

enum PhongShaderFeatures {
    DiffuseMap = 1,
    SpecularMap = 2,
    EmissionMap = 4
}

export class PhongMaterial extends Material {
    public diffuseColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
    public specularStrength = 0.5;
    public shininess = 32.0;
    public diffuseMap: Texture = null;
    public specularMap: Texture = null;
    public emissionMap: Texture = null;

    public constructor(shader: Shader) {
        super(shader);
    }

    public featureMask(): number {
        let mask = 0;

        if (this.diffuseMap)
            mask |= PhongShaderFeatures.DiffuseMap;

        if (this.specularMap)
            mask |= PhongShaderFeatures.SpecularMap;

        if (this.emissionMap)
            mask |= PhongShaderFeatures.EmissionMap;

        return mask;
    }

    public copy(): PhongMaterial {
        const material = new PhongMaterial(this.shader);

        vec4.copy(material.diffuseColor, this.diffuseColor);
        material.specularStrength = this.specularStrength;
        material.shininess = this.shininess;
        material.diffuseMap = this.diffuseMap;
        material.specularMap = this.specularMap;
        material.emissionMap = this.emissionMap;

        return material;
    }
}

export class PhongShaderProgram extends ShaderProgram {
    diffuseColorLocation: WebGLUniformLocation;
    specularStrengthLocation: WebGLUniformLocation;
    shininessLocation: WebGLUniformLocation;
    diffuseSamplerLocation: WebGLUniformLocation;
    specularSamplerLocation: WebGLUniformLocation;
    emissionSamplerLocation: WebGLUniformLocation;
}

export class PhongShader implements Shader {
    public readonly name = "Phong";
    public readonly vertexSource = ShaderLibrary.phongVertex;
    public readonly fragmentSource = ShaderLibrary.phongFragment;

    public preprocessorStatements(material: Material): string[] {
        const phongMaterial = material as PhongMaterial;
        const statements: string[] = [];

        if (phongMaterial.diffuseMap)
            statements.push("#define WGL_PHONG_DIFFUSE_MAP");

        if (phongMaterial.specularMap)
            statements.push("#define WGL_PHONG_SPECULAR_MAP");

        if (phongMaterial.emissionMap)
            statements.push("#define WGL_PHONG_EMISSION_MAP");

        return statements;
    }

    public programCompiled(gl: WebGL2RenderingContext, material: Material, programHash: number, program: WebGLProgram, globalBlockIndex: number, objectBlockIndex: number): ShaderProgram {
        const phongShaderProgram = new PhongShaderProgram(programHash, program, globalBlockIndex, objectBlockIndex);

        phongShaderProgram.diffuseColorLocation = gl.getUniformLocation(program, "diffuse_color");
        phongShaderProgram.specularStrengthLocation = gl.getUniformLocation(program, "specular_strength");
        phongShaderProgram.shininessLocation = gl.getUniformLocation(program, "shininess");
        phongShaderProgram.diffuseSamplerLocation = gl.getUniformLocation(program, "diffuse_sampler");
        phongShaderProgram.specularSamplerLocation = gl.getUniformLocation(program, "specular_sampler");
        phongShaderProgram.emissionSamplerLocation = gl.getUniformLocation(program, "emission_sampler");

        return phongShaderProgram;
    }

    setUniforms(gl: WebGL2RenderingContext, material: Material) {
        const phongMaterial = material as PhongMaterial;
        const phongProgram = material.program as PhongShaderProgram;

        gl.uniform4fv(phongProgram.diffuseColorLocation, phongMaterial.diffuseColor);
        gl.uniform1f(phongProgram.specularStrengthLocation, phongMaterial.specularStrength);
        gl.uniform1f(phongProgram.shininessLocation, phongMaterial.shininess);

        let textureIndex = 0;
        if (phongMaterial.diffuseMap) {
            const tex = gl.TEXTURE0 + textureIndex++;
            gl.activeTexture(gl.TEXTURE0 + textureIndex++);
            gl.bindTexture(gl.TEXTURE_2D, phongMaterial.diffuseMap.handle);
            gl.uniform1i(phongProgram.diffuseSamplerLocation, tex);
        }

        if (phongMaterial.specularMap) {
            const tex = gl.TEXTURE0 + textureIndex++;
            gl.activeTexture(gl.TEXTURE0 + textureIndex++);
            gl.bindTexture(gl.TEXTURE_2D, phongMaterial.specularMap.handle);
            gl.uniform1i(phongProgram.specularSamplerLocation, tex);
        }

        if (phongMaterial.emissionMap) {
            const tex = gl.TEXTURE0 + textureIndex++;
            gl.activeTexture(gl.TEXTURE0 + textureIndex++);
            gl.bindTexture(gl.TEXTURE_2D, phongMaterial.emissionMap.handle);
            gl.uniform1i(phongProgram.emissionSamplerLocation, tex);
        }
    }
}
