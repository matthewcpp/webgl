import {WebGl} from "../WebGL.js";
import {downloadShaderSource} from "../Util.js";
import {UnlitParams, UnlitShader, UnlitTexturedParams, UnlitTexturedShader} from "./Unlit.js";

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
        shaderData.createParams = () => { return new UnlitParams(); }

        return this._webGl.createShader(name, shaderData);
    }

    public async unlitTextured() {
        const name = "__default_unlit_textured__";
        if (this._webGl.shaders.has(name))
            return this._webGl.shaders.get(name);

        const shaderData = await downloadShaderSource(`${this.baseUrl}/unlit`);
        shaderData.preprocessorDefines.push("#define WGL_TEXTURE_COORDS")
        shaderData.shaderInterface = new UnlitTexturedShader();
        shaderData.createParams = () => { return new UnlitTexturedParams(); }

        return this._webGl.createShader(name, shaderData);
    }
}