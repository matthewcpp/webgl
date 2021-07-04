import {Shader, ShaderProgram} from "./Shader";

export abstract class Material {
    public shader: Shader;
    public program: ShaderProgram;

    protected constructor(shader: Shader) {
        this.shader = shader;
        this.program = null;
    }

    public abstract featureMask(): number;
}