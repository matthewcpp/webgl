import {Meshes} from "./Mesh"
import {MeshInstances} from "./MeshInstance";
import {Renderer} from "./Renderer";
import {Textures} from "./Texture"
import {Node} from "./Node";
import {Camera} from "./Camera";
import {Shaders} from "./Shader";
import {LightType, Lights} from "./Light";
import {Bounds} from "./Bounds";

import {quat, vec3} from "gl-matrix";
import {PhongShader} from "./shader/Phong";
import {UnlitShader} from "./shader/Unlit";
import {RenderTargets} from "./RenderTarget";

export class Scene {
    public readonly canvas: HTMLCanvasElement;
    public readonly gl: WebGL2RenderingContext;
    private readonly _renderer: Renderer;

    public readonly meshes: Meshes;
    public readonly meshInstances: MeshInstances;
    public readonly textures: Textures;
    public readonly shaders: Shaders;
    public readonly lights: Lights;

    public readonly worldBounding = Bounds.createFromMinMax(vec3.fromValues(-1.0, -1.0, -1.0), vec3.fromValues(1.0, 1.0, 1.0));
    public rootNode: Node = null;
    public mainCamera: Camera = null;

    public constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.canvasResized();

        this.gl = this.canvas.getContext('webgl2');

        if (this.gl === null) {
            throw new Error("Unable to initialize WebGL 2.0");
        }

        this.lights = new Lights();
        this._renderer = new Renderer(this.gl, this.lights);
        this.textures = new Textures(this.gl);
        this.meshes = new Meshes(this.gl);
        this.shaders = new Shaders(this.gl, new PhongShader(), new UnlitShader());
        this.meshInstances = new MeshInstances(this._renderer);
        this.renderTargets = new RenderTargets(this.gl);
    }

    public async init() {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.createDefault();
    }

    public clear() {
        Node.cleanupNode(this.rootNode);

        this.mainCamera = null;
        this.meshes.clear();
        this.textures.clear();
        this._renderer.clear();
        this.shaders.clear();
        this.lights.clear();
    }

    public draw() {
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

    public createDefault() {
        this.rootNode = new Node("root");
        const cameraNode = new Node("Main Camera");

        vec3.set(cameraNode.position, 0.0, 7.0, 10.0);
        cameraNode.updateMatrix();
        cameraNode.lookAt(vec3.fromValues(0.0, 1.0, 0.0), cameraNode.up());
        cameraNode.components.camera = new Camera(cameraNode);
        this.mainCamera = cameraNode.components.camera;
        this.mainCamera.near = 0.01;
        this.mainCamera.far = 1000
        this.rootNode.addChild(cameraNode);

        const directionalLightNode = new Node();
        directionalLightNode.components.light = this.lights.create(directionalLightNode, LightType.Directional);
        directionalLightNode.position = vec3.fromValues(0.0, 3, 0.0);
        quat.fromEuler(directionalLightNode.rotation, 50.0, -30.0, 0.0);
        directionalLightNode.updateMatrix();
        this.rootNode.addChild(directionalLightNode);
    }
}
