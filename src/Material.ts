import {Shader} from "./Shader.js";

export class Material {
    public params: any;
    public constructor(
        public readonly shader: Shader,
    ){
        this.params = shader.createParams();
    }

    public clone(): Material {
        return new Material(this.shader);
    }
}