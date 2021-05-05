import {Scene} from "../Scene";
import {UnlitShader, UnlitTexturedShader} from "./Unlit";
import {PhongShader, PhongTexturedShader} from "./Phong";
import {Shader, ShaderData} from "../Shader";

export class DefaultShaders {
    private static _unlitFragmentSource = "_WGL_UNLIT_FRAGMENT_SOURCE_";
    private static _unlitVertexSource = "_WGL_UNLIT_VERTEX_SOURCE_";

    private static _phongFragmentSource = "_WGL_PHONG_FRAGMENT_SOURCE_";
    private static _phongVertexSource = "_WGL_PHONG_VERTEX_SOURCE_";

    public constructor(
        private readonly _scene: Scene
    ) {}

    public async unlit() {
        const name = "__default_unlit__";
        if (this._scene.shaders.has(name))
            return this._scene.shaders.get(name);

        const shaderData = new ShaderData();
        shaderData.fragmentSource = DefaultShaders._unlitFragmentSource;
        shaderData.vertexSource = DefaultShaders._unlitVertexSource;
        shaderData.shaderInterface = new UnlitShader();

        return this._scene.createShader(name, shaderData);
    }

    public async unlitTextured() {
        const name = "__default_unlit_textured__";
        if (this._scene.shaders.has(name))
            return this._scene.shaders.get(name);

        const shaderData = new ShaderData();
        shaderData.fragmentSource = DefaultShaders._unlitFragmentSource;
        shaderData.vertexSource = DefaultShaders._unlitVertexSource;
        shaderData.preprocessorDefines.push("#define WGL_TEXTURE_COORDS");
        shaderData.shaderInterface = new UnlitTexturedShader();

        return this._scene.createShader(name, shaderData);
    }

    public async phong() {
        const name = "__default_phong__";
        if (this._scene.shaders.has(name))
            return this._scene.shaders.get(name);

        const shaderData = new ShaderData();
        shaderData.fragmentSource = DefaultShaders._phongFragmentSource;
        shaderData.vertexSource = DefaultShaders._phongVertexSource;
        shaderData.shaderInterface = new PhongShader();

        return this._scene.createShader(name, shaderData);
    }

    public async phongTextured() {
        const name = "__default_phong_textured__";
        if (this._scene.shaders.has(name))
            return this._scene.shaders.get(name);

        const shaderData = new ShaderData();
        shaderData.fragmentSource = DefaultShaders._phongFragmentSource;
        shaderData.vertexSource = DefaultShaders._phongVertexSource;
        shaderData.preprocessorDefines.push("#define WGL_TEXTURE_COORDS");
        shaderData.shaderInterface = new PhongTexturedShader();

        return this._scene.createShader(name, shaderData);
    }
}