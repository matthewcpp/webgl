import {Mesh, MeshInstance, Primitive} from "./Mesh"
import {Renderer} from "./Renderer";
import {Texture} from "./Texture"
import {Node} from "./Node";
import {Camera} from "./Camera";
import {Shader, ShaderData} from "./Shader";
import {DefaultShaders} from "./shader/DefaultShaders";
import {Behavior} from "./behaviors/Behavior";
import {Material} from "./Material";
import {Light, LightType} from "./Light";
import {Bounds} from "./Bounds";

import {vec3} from "gl-matrix";

export class Scene {
    public readonly canvas: HTMLCanvasElement;
    public readonly gl: WebGL2RenderingContext;
    private readonly _renderer: Renderer;

    public shaders = new Map<string, Shader>();
    public meshes = new Map<string, Mesh>();
    public textures = new Map<string, WebGLTexture>();
    public mainCamera: Camera = null;

    public readonly worldBounding = Bounds.createFromMinMax(vec3.fromValues(-1.0, -1.0, -1.0), vec3.fromValues(1.0, 1.0, 1.0));
    public readonly defaultShaders = new DefaultShaders(this);
    public readonly rootNode = new Node("root");

    public readonly _behaviors = new Array<Behavior>();

    public deltaTime: number;
    private _lastUpdateTime: DOMHighResTimeStamp = 0.0;

    public defaultMaterial: Material;

    public constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.canvasResized();

        this.gl = this.canvas.getContext('webgl2');

        if (this.gl === null) {
            throw new Error("Unable to initialize WebGL 2.0");
        }

        this._renderer = new Renderer(this.gl);
    }

    public async init() {
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        this._createDefaultCamera();
        Texture.createDefault(this.gl);
        this.defaultMaterial = new Material(await this.defaultShaders.unlit());
    }

    public start() {
        requestAnimationFrame((timestamp: DOMHighResTimeStamp) => {
            this._lastUpdateTime = timestamp;
            this._mainLoop(timestamp);
        });
    }

    private _mainLoop(currentTime: DOMHighResTimeStamp) {
        this.deltaTime = (currentTime - this._lastUpdateTime) / 1000.0;
        this._update();
        this._drawScene()

        this._lastUpdateTime = currentTime;

        requestAnimationFrame((currentTime: DOMHighResTimeStamp) => {
            this._mainLoop(currentTime);
        });
    }

    private _update() {
        for (const behavior of this._behaviors) {
            if (behavior.active)
                behavior.update();
        }
    }

    private _drawScene() {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

        this._renderer.setCamera(this.mainCamera);
        this._renderer.drawScene(this.rootNode);
    }

    public canvasResized() {
        // set the client's width and height to their actual screen size.
        // This is needed in order for the webgl drawing buffer to be correctly sized.
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    public createShader(name: string, shaderData: ShaderData): Shader {
        if (this.shaders.has(name)) {
            throw new Error(`Shader with name: ${name} already exists.`);
        }

        const shader = Shader.create(name, shaderData, this.gl);
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

    public createMeshInstance(node: Node, mesh: Mesh, materials?: Array<Material>): MeshInstance {
        const meshInstance = this._renderer.createMeshInstance(node, mesh, materials);
        node.components.meshInstance = meshInstance;
        return meshInstance;
    }

    public createTextureFromImage(name: string, image: HTMLImageElement) {
        if (this.textures.has(name)) {
            throw new Error(`Texture with ${name} already exists.`);
        }

        const texture = Texture.createFromImage(this.gl, image);
        this.textures.set(name, texture);

        return texture;
    }

    public createTextureFromRGBAData(name: string, width: number, height: number, data: ArrayBufferView) {
        if (this.textures.has(name)) {
            throw new Error(`Texture with ${name} already exists.`);
        }

        const texture = Texture.createFromRGBAData(this.gl, width, height, data);
        this.textures.set(name, texture);

        return texture;
    }

    public createLight(lightType: LightType, node: Node): Light {
        return this._renderer.createLight(lightType, node);
    }

    private _createDefaultCamera() {
        const cameraNode = new Node("Main Camera");
        vec3.set(cameraNode.position, 0.0, 7.0, 10.0);
        cameraNode.updateMatrix();
        cameraNode.lookAt(vec3.fromValues(0.0, 1.0, 0.0), cameraNode.up());
        cameraNode.components.camera = new Camera(cameraNode);
        this.mainCamera = cameraNode.components.camera;
        this.rootNode.addChild(cameraNode);
    }

    public calculateWorldBounding() {
        this.worldBounding.invalidate();
        Scene._getBoundsRec(this.rootNode, this.worldBounding);

        return this.worldBounding;
    }

    private static _getBoundsRec(node: Node, bounds: Bounds) {
        if (node.components.meshInstance)
            bounds.encapsulateBounds(node.components.meshInstance.worldBounds);

        const childCount = node.getChildCount();
        for (let i = 0; i < childCount; i++) {
            Scene._getBoundsRec(node.getChild(i), bounds);
        }
    }
}
