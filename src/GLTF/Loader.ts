import {WebGl} from "../WebGL.js";
import {
    GlTFBufferViewTarget,
    GLTFComponentType,
    GLTFPrimitive,
    GLTFPrimitiveMode,
    GLTFScene,
    GLTFSchema
} from "./Schema.js";
import {Node} from "../Node.js";
import {Transform} from "../Transform.js";
import {Attribute, ElementBuffer, Mesh, Primitive} from "../Mesh.js";
import {Material} from "../Material.js";
import {DefaultAttributeLocations} from "../Shader.js";

export class GLTFLoader {
    private _schema: GLTFSchema = null;
    private _meshes: Mesh[] = null;
    private _buffers: ArrayBuffer[] = null;
    private _bufferViews: WebGLBuffer[] = null;

    public defaultMaterial: Material = null;

    static readonly attributeLocations = new Map<string, number>();

    public constructor(
        private _webgl: WebGl)
    {
        if (GLTFLoader.attributeLocations.size === 0) {
            GLTFLoader.attributeLocations.set("POSITION", DefaultAttributeLocations.Position)
        }
    }

    public async load(url: string) {
        const request = await fetch(url);
        this._schema = JSON.parse(await request.text()) as GLTFSchema;

        this._meshes = this._schema.meshes ? new Array<Mesh>(this._schema.meshes.length) : null;
        this._buffers = this._schema.buffers ? new Array<ArrayBuffer>(this._schema.buffers.length) : null;
        this._bufferViews = this._schema.bufferViews ? new Array<WebGLBuffer>(this._schema.bufferViews.length) : null;

        if (this._schema.scenes && this._schema.scenes.length > 0) {
            await this._loadScene(this._schema.scenes[0]);
        }
    }

    private async _loadScene(scene: GLTFScene) {
        Transform.freeze = true;
        let webglNodes: Node[] = new Array(this._schema.nodes.length);

        // create all the nodes
        for (let i = 0; i < this._schema.nodes.length; i++) {
            const node = new Node();
            webglNodes[i] = node;

            const gltfNode = this._schema.nodes[i];
            if (gltfNode.name)
                node.name = gltfNode.name;

            if (gltfNode.hasOwnProperty("mesh")) {
                node.components.mesh = await this._getMesh(gltfNode.mesh);
                node.components.material = this.defaultMaterial.clone();
            }
        }

        // set the root nodes
        for(const rootNode of scene.nodes) {
            this._webgl.rootNode.transform.addChild(webglNodes[rootNode].transform);
        }

        // update all matrices
        Transform.freeze = false;
        this._webgl.rootNode.transform.updateMatrix();
    }

    private async _getMesh(index: number) {
        if (this._meshes[index])
            return this._meshes[index];

        const gltfMesh = this._schema.meshes[index];

        const primitives = new Array<Primitive>();
        for (const meshPrimitive of gltfMesh.primitives) {
            let primitive = new Primitive();
            primitive.type = this.getPrimitiveType(meshPrimitive);

            const attributeNames = Object.keys(meshPrimitive.attributes);
            for (const attributeName of attributeNames)
                primitive.attributes.push(await this._getAttribute(attributeName, meshPrimitive.attributes[attributeName]));

            primitive.indices = await this._getElementBuffer(meshPrimitive.indices);

            primitives.push(primitive);
        }

        const name = gltfMesh.name ? gltfMesh.name : index.toString();
        return this._webgl.createMesh(name, primitives);
    }

    private getPrimitiveType(primitive: GLTFPrimitive) {
        let mode = primitive.hasOwnProperty("mode") ? primitive.mode : GLTFPrimitiveMode.Triangles;

        switch (mode) {
            case GLTFPrimitiveMode.Triangles:
                return this._webgl.gl.TRIANGLES;

            default:
                throw new Error(`Unsupported Primitive Mode: ${mode}`);
        }
    }

    private static _getAttributeIndex(gltfName: string){
        if (GLTFLoader.attributeLocations.has(gltfName))
            return GLTFLoader.attributeLocations.get(gltfName);
        else
            throw new Error(`Unknown attribute position for type: ${gltfName}`);
    }

    private static _getComponentType(componentType: GLTFComponentType, gl: WebGL2RenderingContext) {
        switch (componentType) {
            case GLTFComponentType.Float:
                return gl.FLOAT;
            case GLTFComponentType.UnsignedShort:
                return gl.UNSIGNED_SHORT;
            case GLTFComponentType.UnsignedInt:
                return gl.UNSIGNED_INT;

            default:
                throw new Error(`Unsupported Component Type: ${componentType}`);
        }
    }

    private static _getComponentElementCount(type: string) {
        switch (type) {
            case "SCALAR":
                return 1;
            case "VEC2":
                return 2;
            case "VEC3":
                return 3;
            case "VEC4":
                return 4;
            case "MAT2":
                return 4;
            case "MAT3":
                return 9;
            case "MAT4":
                return 16;

            default:
                throw new Error(`Unsupported Component Type: ${type}`);
        }
    }

    private async _getAttribute(gltfName: string, index: number) {
        const accessor = this._schema.accessors[index];
        const bufferView = this._schema.bufferViews[accessor.bufferView];

        return new Attribute(
            GLTFLoader._getAttributeIndex(gltfName),
            GLTFLoader._getComponentType(accessor.componentType, this._webgl.gl),
            GLTFLoader._getComponentElementCount(accessor.type),
            accessor.count,
            accessor.byteOffset,
            bufferView.byteStride ? bufferView.byteStride : 0,
            await this._getBufferView(accessor.bufferView)
        );
    }

    private async _getElementBuffer(index) {
        const accessor = this._schema.accessors[index];

        return new ElementBuffer(
            GLTFLoader._getComponentType(accessor.componentType, this._webgl.gl),
            accessor.count,
            accessor.byteOffset,
            await this._getBufferView(accessor.bufferView)
        );
    }

    private async _getBufferView(index: number) {
        if (!this._bufferViews[index]) {
            const bufferView = this._schema.bufferViews[index];
            const arrayBuffer = await this._getBuffer(bufferView.buffer);
            const typedArray = new Uint8Array(arrayBuffer, bufferView.byteOffset, bufferView.byteLength);

            const gl = this._webgl.gl;
            const target = bufferView.target === GlTFBufferViewTarget.ArrayBuffer ? gl.ARRAY_BUFFER : gl.ELEMENT_ARRAY_BUFFER;
            const glBuffer = gl.createBuffer();
            gl.bindBuffer(target, glBuffer);
            gl.bufferData(target, typedArray, gl.STATIC_DRAW);

            this._bufferViews[index] = glBuffer;
        }

        return this._bufferViews[index];
    }

    private async _getBuffer(index: number){
        if (!this._buffers[index]){
            const buffer = this._schema.buffers[index];
            const response = await fetch(buffer.uri);
            this._buffers[index] = await response.arrayBuffer();
        }

        return this._buffers[index];
    }
}