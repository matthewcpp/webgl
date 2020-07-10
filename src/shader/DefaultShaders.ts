import {WebGl} from "../WebGL.js";
import {downloadShaderSource} from "../Util.js";
import {UnlitShader, UnlitTexturedShader} from "./Unlit.js";
import {PhongShader} from "./Phong.js";

export class DefaultShaders {
    public baseUrl = "/shaders";
    public constructor(
        private readonly _webGl: WebGl
    ) {}

    public async unlit() {
        const name = "__default_unlit__";
        if (this._webGl.shaders.has(name))
            return this._webGl.shaders.get(name);

        const shaderData = await downloadShaderSource(`${this.baseUrl}/unlit`);
        shaderData.shaderInterface = new UnlitShader();

        return this._webGl.createShader(name, shaderData);
    }

    public async unlitTextured() {
        const name = "__default_unlit_textured__";
        if (this._webGl.shaders.has(name))
            return this._webGl.shaders.get(name);

        const shaderData = await downloadShaderSource(`${this.baseUrl}/unlit`);
        shaderData.preprocessorDefines.push("#define WGL_TEXTURE_COORDS")
        shaderData.shaderInterface = new UnlitTexturedShader();

        return this._webGl.createShader(name, shaderData);
    }

    public async phong() {
        const name = "__default_phong__";
        if (this._webGl.shaders.has(name))
            return this._webGl.shaders.get(name);

        const shaderData = await downloadShaderSource(`${this.baseUrl}/phong`);
        shaderData.shaderInterface = new PhongShader();

        return this._webGl.createShader(name, shaderData);
    }
}