import {Shader} from "./Shader.js";

export class Material {
    public params: any;
    public constructor(
        public readonly shader: Shader,
    ){
        this.params = shader.createParams();

    }

    public clone(): Material {
        const material = new Material(this.shader);
        Object.assign(material.params, this.params);
        return material;
    }
}