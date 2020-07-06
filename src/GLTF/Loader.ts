import {WebGl} from "../WebGL.js";
import * as GLTF from "./Schema.js";
import {Node} from "../Node.js";
import {Attribute, ElementBuffer, Mesh, Primitive} from "../Mesh.js";
import {Material} from "../Material.js";
import {DefaultAttributeLocations} from "../Shader.js";
import {downloadImage} from "../Util.js";
import {UnlitTexturedParams} from "../shader/Unlit.js";

export class Loader {
    private _baseUrl: string;
    private _gltf: GLTF.Schema = null;
    private _meshes: Mesh[] = null;
    private _arrayBuffers: ArrayBuffer[] = null;
    private _glBuffers: WebGLBuffer[] = null;
    private _textures: WebGLTexture[] = null;
    private _materials: Material[] = null;

    static readonly attributeLocations = new Map<string, number>();

    public constructor(
        private _webgl: WebGl)
    {
        if (Loader.attributeLocations.size === 0) {
            Loader.attributeLocations.set("POSITION", DefaultAttributeLocations.Position);
            Loader.attributeLocations.set("NORMAL", DefaultAttributeLocations.Normal);
            Loader.attributeLocations.set("TEXCOORD_0", DefaultAttributeLocations.TexCoord0);
        }
    }

    public async load(url: string) {
        const index = url.lastIndexOf("/");
        this._baseUrl = index >= 0 ? url.substring(0, index + 1) : "";

        const request = await fetch(url);

        if (request.status != 200)
            throw new Error(`Unable to load gltf file at: ${url}`);

        this._gltf = JSON.parse(await request.text()) as GLTF.Schema;

        this._meshes = this._gltf.meshes ? new Array<Mesh>(this._gltf.meshes.length) : null;
        this._arrayBuffers = this._gltf.buffers ? new Array<ArrayBuffer>(this._gltf.buffers.length) : null;
        this._glBuffers = this._gltf.bufferViews ? new Array<WebGLBuffer>(this._gltf.bufferViews.length) : null;
        this._textures = this._gltf.images ? new Array<WebGLTexture>(this._gltf.images.length) : null;
        this._materials = this._gltf.images ? new Array<Material>(this._gltf.materials.length) : null;

        if (this._gltf.scenes && this._gltf.scenes.length > 0)
            return await this._loadScene(this._gltf.scenes[0]);
        else
            return null;
    }

    private async _loadScene(scene: GLTF.Scene) {
        Node.freeze = true;
        let webglNodes: Node[] = new Array(this._gltf.nodes.length);

        // create all the nodes
        for (let i = 0; i < this._gltf.nodes.length; i++) {
            const node = new Node();
            webglNodes[i] = node;

            const gltfNode = this._gltf.nodes[i];
            if (gltfNode.name)
                node.name = gltfNode.name;

            if (gltfNode.hasOwnProperty("mesh")) {
                node.components.mesh = await this._getMesh(gltfNode.mesh);
                node.components.material = await this._getMaterial(gltfNode.mesh);
            }
        }

        // set the root nodes
        for(const rootNode of scene.nodes) {
            this._webgl.rootNode.addChild(webglNodes[rootNode]);
        }

        // update all matrices
        Node.freeze = false;
        this._webgl.rootNode.updateMatrix();

        return scene.nodes.map((index: number) => { return webglNodes[index]});
    }

    private async _getMesh(index: number) {
        if (this._meshes[index])
            return this._meshes[index];

        const gltfMesh = this._gltf.meshes[index];

        const primitives = new Array<Primitive>();
        for (const meshPrimitive of gltfMesh.primitives) {
            let primitive = new Primitive();
            primitive.type = this.getPrimitiveType(meshPrimitive);

            const attributeNames = Object.keys(meshPrimitive.attributes);
            for (const attributeName of attributeNames){
                const attribute = await this._getAttribute(attributeName, meshPrimitive.attributes[attributeName]);

                if (attribute !== null)
                    primitive.attributes.push(attribute);
            }

            primitive.indices = await this._getElementBuffer(meshPrimitive.indices);

            primitives.push(primitive);
        }

        const name = gltfMesh.name ? gltfMesh.name : index.toString();
        return this._webgl.createMesh(name, primitives);
    }

    private getPrimitiveType(primitive: GLTF.Primitive) {
        let mode = primitive.hasOwnProperty("mode") ? primitive.mode : GLTF.PrimitiveMode.Triangles;

        switch (mode) {
            case GLTF.PrimitiveMode.Triangles:
                return this._webgl.gl.TRIANGLES;

            default:
                throw new Error(`Unsupported Primitive Mode: ${mode}`);
        }
    }

    private static _getAttributeIndex(gltfName: string){
        if (Loader.attributeLocations.has(gltfName))
            return Loader.attributeLocations.get(gltfName);
        else{
            return -1;
        }
    }

    private static _getComponentType(componentType: GLTF.ComponentType, gl: WebGL2RenderingContext) {
        switch (componentType) {
            case GLTF.ComponentType.Float:
                return gl.FLOAT;
            case GLTF.ComponentType.UnsignedShort:
                return gl.UNSIGNED_SHORT;
            case GLTF.ComponentType.UnsignedInt:
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
        const accessor = this._gltf.accessors[index];
        const bufferView = this._gltf.bufferViews[accessor.bufferView];
        const attributeIndex = Loader._getAttributeIndex(gltfName);

        if (attributeIndex == -1) {
            return null;
        }

        return new Attribute(
            attributeIndex,
            Loader._getComponentType(accessor.componentType, this._webgl.gl),
            Loader._getComponentElementCount(accessor.type),
            accessor.count,
            accessor.byteOffset,
            bufferView.byteStride ? bufferView.byteStride : 0,
            await this._getBufferView(accessor.bufferView)
        );
    }

    private async _getElementBuffer(index) {
        const accessor = this._gltf.accessors[index];

        return new ElementBuffer(
            Loader._getComponentType(accessor.componentType, this._webgl.gl),
            accessor.count,
            accessor.byteOffset,
            await this._getBufferView(accessor.bufferView)
        );
    }

    private async _getBufferView(index: number) {
        if (!this._glBuffers[index]) {
            const bufferView = this._gltf.bufferViews[index];
            const arrayBuffer = await this._getBuffer(bufferView.buffer);
            const typedArray = new Uint8Array(arrayBuffer, bufferView.byteOffset, bufferView.byteLength);

            const gl = this._webgl.gl;
            const target = bufferView.target === GLTF.BufferViewTarget.ArrayBuffer ? gl.ARRAY_BUFFER : gl.ELEMENT_ARRAY_BUFFER;
            const glBuffer = gl.createBuffer();
            gl.bindBuffer(target, glBuffer);
            gl.bufferData(target, typedArray, gl.STATIC_DRAW);

            this._glBuffers[index] = glBuffer;
        }

        return this._glBuffers[index];
    }

    private _getFetchUri(uri: string) {
        if (uri.startsWith("data:"))
            return uri;

        return this._baseUrl + uri;
    }

    private async _getBuffer(index: number){
        if (!this._arrayBuffers[index]){
            const buffer = this._gltf.buffers[index];

            const response = await fetch(this._getFetchUri(buffer.uri));
            if (response.status != 200) {
                throw new Error(`unable to fetch buffer: ${buffer.uri}`);
            }
            this._arrayBuffers[index] = await response.arrayBuffer();
        }

        return this._arrayBuffers[index];
    }

    private async _getMaterial(meshIndex: number) {
        const gltfMesh = this._gltf.meshes[meshIndex];

        let faceMaterial: Material = null;

        for (const primitive of gltfMesh.primitives) {
            const type = primitive.hasOwnProperty("mode") ? primitive.mode : GLTF.PrimitiveMode.Triangles;

            if (type != GLTF.PrimitiveMode.Triangles)
                continue;

            if (primitive.hasOwnProperty("material")) {
                const gltfMaterial = this._gltf.materials[primitive.material];
                faceMaterial = new Material(await this._webgl.defaultShaders.unlitTextured());
                const params = faceMaterial.params as UnlitTexturedParams;
                params.texture = await this._getTexture(gltfMaterial.pbrMetallicRoughness.baseColorTexture.index);
            }
        }

        if (!faceMaterial)
            faceMaterial = new Material(await this._webgl.defaultShaders.unlit());

        return faceMaterial;
    }

    private async _getTexture(index: number) {
        if (!this._textures[index]) {
            const image = this._gltf.images[index];
            this._textures[index] = this._webgl.createTexture(index.toString(), await downloadImage(this._getFetchUri(image.uri)));
        }
        return this._textures[index];
    }
}