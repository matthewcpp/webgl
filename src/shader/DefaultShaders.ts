import {WebGl} from "../WebGL";
import {downloadShaderSource} from "../Util";
import {UnlitShader, UnlitTexturedShader} from "./Unlit";
import {PhongShader, PhongTexturedShader} from "./Phong";

export class DefaultShaders {
    public baseUrl = "/dist/shaders";
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
        shaderData.preprocessorDefines.push("#define WGL_TEXTURE_COORDS");
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

    public async phongTextured() {
        const name = "__default_phong_textured__";
        if (this._webGl.shaders.has(name))
            return this._webGl.shaders.get(name);

        const shaderData = await downloadShaderSource(`${this.baseUrl}/phong`);
        shaderData.preprocessorDefines.push("#define WGL_TEXTURE_COORDS");
        shaderData.shaderInterface = new PhongTexturedShader();

        return this._webGl.createShader(name, shaderData);
    }
}