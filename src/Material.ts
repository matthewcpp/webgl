import {Shader} from "./Shader.js";

export class Material {
    public readonly shader: Shader;
    public params: Object;
    public constructor(shader: Shader, params?: Object){
        this.shader = shader;

        if (params)
            this.params = Object.assign({}, params);
        else
            this.params = shader.createParams();
    }

    public clone(): Material {
        return new Material(this.shader, this.params);
    }
}