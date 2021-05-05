import {Shader} from "./Shader";

export class Material {
    public readonly shader: Shader;
    public params: Object;
    public constructor(shader: Shader, params?: Object){
        this.shader = shader;

        if (params)
            this.params = shader.shaderInterface.copyParams(params);
        else
            this.params = shader.shaderInterface.createParams();
    }

    public clone(): Material {
        return new Material(this.shader, this.params);
    }
}