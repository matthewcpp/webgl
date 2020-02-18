import {Shader} from "./Shader.js";
import * as vec4 from "../external/gl-matrix/vec4.js"

export class Material {
    public readonly shader: Shader;
    public readonly vec4 = new Map<string, vec4>();
    public readonly texture = new Map<string, WebGLTexture>();

    constructor(shader: Shader) {
        this.shader = shader;
    }
}