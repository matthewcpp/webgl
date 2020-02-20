import {Shader, ShaderData} from "./Shader.js";
import {MeshBuffer, MeshBufferData} from "./Mesh.js"
import {Renderer} from "./Renderer.js";
import {Texture} from "./Texture.js"

export class WebGl {
    public readonly canvas: HTMLCanvasElement;
    private readonly gl: WebGLRenderingContext;
    private readonly _renderer: Renderer;

    public shaders = new Map<string, Shader>();
    public meshBuffers = new Map<string, MeshBuffer>();
    public textures = new Map<string, WebGLTexture>();
    public renderFunc: (renderer: Renderer) => void;

    public constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.resizeCanvas();

        this.gl = this.canvas.getContext('webgl');

        if (this.gl === null) {
            throw new Error("Unable to initialize WebGL");
        }

        // This extension is needed to support rendering meshes with > vertices.
        const ext = this.gl.getExtension('OES_element_index_uint');
        if (!ext) {
            throw new Error("Implementation does not support uint indices");
        }

        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

        this._renderer = new Renderer(this.gl);

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
    }

    public start() {
        requestAnimationFrame(() => {
            this.drawScene();
        });
    }

    private drawScene() {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

        if (this.renderFunc !== null) {
            this.renderFunc(this._renderer);
        }

        requestAnimationFrame(() => {
            this.drawScene();
        });
    }

    public resizeCanvas() {
        // set the client's width and height to their actual screen size.
        // This is needed in order for the webgl drawing buffer to be correctly sized.
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    public createShader(name: string, shaderData: ShaderData): Shader {
        if (this.shaders.has(name)) {
            throw new Error(`Shader with name: ${name} already exists.`);
        }

        const shader = Shader.create(this.gl, name, shaderData);
        this.shaders.set(name, shader);

        return shader;
    }

    public createMeshBuffer(name: string, meshData: MeshBufferData): MeshBuffer {
        if (this.meshBuffers.has(name)) {
            throw new Error(`MeshBuffer with name: ${name} already exists.`);
        }

        const meshBuffer = MeshBuffer.create(this.gl, meshData);
        this.meshBuffers.set(name, meshBuffer);

        return meshBuffer;
    }

    public createTexture(name: string, image: HTMLImageElement) {
        if (this.textures.has(name)) {
            throw new Error(`Texture with ${name} already exists.`);
        }

        const texture = Texture.create(this.gl, image);
        this.textures.set(name, texture);

        return texture;
    }
}
