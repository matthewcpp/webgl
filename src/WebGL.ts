import {Mesh, Primitive} from "./Mesh.js"
import {Renderer} from "./Renderer.js";
import {Texture} from "./Texture.js"
import {Node} from "./Node.js";
import {Camera} from "./Camera.js";
import {Shader, ShaderData} from "./Shader.js";
import {DefaultShaders} from "./shader/DefaultShaders.js";

import * as glMatrix from "../external/gl-matrix/common.js";
import * as vec3 from "../external/gl-matrix/vec3.js"

export class WebGl {
    public readonly canvas: HTMLCanvasElement;
    public readonly gl: WebGL2RenderingContext;
    private readonly _renderer: Renderer;

    public shaders = new Map<string, Shader>();
    public meshes = new Map<string, Mesh>();
    public textures = new Map<string, WebGLTexture>();
    public renderFunc: (timestamp: DOMHighResTimeStamp, renderer: Renderer) => void = null;
    public mainCamera: Camera = null;

    public readonly defaultShaders = new DefaultShaders(this);
    public readonly rootNode = new Node("root");

    public constructor(canvas: HTMLCanvasElement) {
        glMatrix.setMatrixArrayType(Array);

        this.canvas = canvas;
        this.resizeCanvas();

        this.gl = this.canvas.getContext('webgl2');

        if (this.gl === null) {
            throw new Error("Unable to initialize WebGL 2.0");
        }

        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        this._createDefaultCamera();
        this._renderer = new Renderer(this.gl);
    }

    public start() {
        requestAnimationFrame((timestamp: DOMHighResTimeStamp) => {
            this.drawScene(timestamp);
        });
    }

    private drawScene(timestamp: DOMHighResTimeStamp) {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        this._renderer.setCamera(this.mainCamera);

        if (this.renderFunc !== null) {
            this.renderFunc(timestamp, this._renderer);
        }

        this._renderer.drawScene(this.rootNode);

        requestAnimationFrame((timestamp: DOMHighResTimeStamp) => {
            this.drawScene(timestamp);
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

        const shader = Shader.create(shaderData, this.gl);
        this.shaders.set(name, shader);

        return shader;
    }

    public createMesh(name: string, geometry: Primitive[]) {
        if (this.meshes.has(name)) {
            throw new Error(`MeshBuffer with name: ${name} already exists.`);
        }

        const mesh = new Mesh(geometry);
        this.meshes.set(name, mesh);

        return mesh;
    }

    public createTexture(name: string, image: HTMLImageElement) {
        if (this.textures.has(name)) {
            throw new Error(`Texture with ${name} already exists.`);
        }

        const texture = Texture.create(this.gl, image);
        this.textures.set(name, texture);

        return texture;
    }

    private _createDefaultCamera() {
        const cameraNode = new Node("Main Camera");
        vec3.set(cameraNode.transform.position, 0.0, 7.0, 10.0);
        cameraNode.transform.updateMatrix();
        cameraNode.transform.lookAt([0.0, 1.0, 0.0]);
        cameraNode.components.camera = new Camera(cameraNode);
        this.mainCamera = cameraNode.components.camera;
        this.rootNode.transform.addChild(cameraNode.transform);
    }
}
