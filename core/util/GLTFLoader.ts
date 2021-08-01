import {Scene} from "../Scene";
import * as GLTF from "./GLTFSchema";
import {Node} from "../Node";
import {Attribute, AttributeType, ElementBuffer, Mesh, Primitive} from "../Mesh";
import {Bounds} from "../Bounds";
import {BinaryGltf} from "@matthewcpp/binary-gltf";

import {vec3, vec4, quat, mat4} from "gl-matrix"
import {Texture} from "../Texture";
import {PhongMaterial} from "../shader/Phong";

export class GLTFLoader {
    private _baseUrl: string;
    private _gltf: GLTF.GLTFSchema = null;
    private _glb: BinaryGltf = null;
    private _meshes: Mesh[] = null;
    private _arrayBuffers: DataView[] = null;
    private _bufferViews: DataView[] = null;
    private _glBuffers: WebGLBuffer[] = null;
    private _textures: Texture[] = null;
    private _materials: PhongMaterial[] = null;

    public autoscaleScene = true;
    public meshInstanceLayerMask = 1;

    static readonly _attributeNameToType = new Map<string, AttributeType>();

    public constructor(
        private _scene: Scene)
    {
        if (GLTFLoader._attributeNameToType.size === 0) {
            GLTFLoader._attributeNameToType.set("POSITION", AttributeType.Position);
            GLTFLoader._attributeNameToType.set("NORMAL", AttributeType.Normal);
            GLTFLoader._attributeNameToType.set("TEXCOORD_0", AttributeType.TexCoord0);
        }
    }

    private async _requestResource(url: string) {
        const response = await fetch(url);

        if (response.status != 200)
            throw new Error(`Unable to load gltf file at: ${url}`);

        const index = url.lastIndexOf("/");
        this._baseUrl = index >= 0 ? url.substring(0, index + 1) : "";

        return response;
    }

    private async _load() {
        this._meshes = this._gltf.meshes ? new Array<Mesh>(this._gltf.meshes.length) : null;
        this._arrayBuffers = this._gltf.buffers ? new Array<DataView>(this._gltf.buffers.length) : null;
        this._bufferViews = this._gltf.bufferViews ? new Array<DataView>(this._gltf.bufferViews.length) : null;
        this._glBuffers = this._gltf.bufferViews ? new Array<WebGLBuffer>(this._gltf.bufferViews.length) : null;
        this._textures = this._gltf.images ? new Array<Texture>(this._gltf.images.length) : null;
        this._materials = this._gltf.materials ? new Array<PhongMaterial>(this._gltf.materials.length) : null;

        if (this._gltf.scenes && this._gltf.scenes.length > 0)
            return await this._loadScene(this._gltf.scenes[0]);
        else
            return null;
    }

    public async load(url: string) {
        const response = await this._requestResource(url);
        this._gltf = JSON.parse(await response.text()) as GLTF.GLTFSchema;
        await this._load();
    }

    public async loadBinary(url: string) {
        const response = await this._requestResource(url);

        this._glb = BinaryGltf.parse(await response.arrayBuffer());
        this._gltf = this._glb.json as GLTF.GLTFSchema;

        await this._load();
    }

    private async _loadScene(scene: GLTF.Scene) {
        Node.freeze = true;
        let webglNodes: Node[] = new Array(this._gltf.nodes.length);

        // create all the nodes
        for (let i = 0; i < this._gltf.nodes.length; i++) {
            const node = await this._createNode(this._gltf.nodes[i]);
            webglNodes[i] = node;
        }

        // set the root nodes
        for (const rootNode of scene.nodes) {
            this._scene.rootNode.addChild(webglNodes[rootNode]);
        }

        // set children nodes
        for (let i = 0; i < this._gltf.nodes.length; i++) {
            const gltfNode = this._gltf.nodes[i];

            if (!gltfNode.hasOwnProperty("children"))
                continue;

            for (const child of gltfNode.children) {
                webglNodes[i].addChild(webglNodes[child]);
            }
        }

        // update all matrices
        Node.freeze = false;
        this._scene.rootNode.updateMatrix();

        if (this.autoscaleScene)
            this._autoscaleScene();

        return scene.nodes.map((index: number) => { return webglNodes[index]});
    }

    private async _createNode(gltfNode: GLTF.Node) {
        const wglNode = new Node();

        if (gltfNode.translation)
            vec3.copy(wglNode.position, gltfNode.translation as unknown as vec3);

        if (gltfNode.scale)
            vec3.copy(wglNode.scale, gltfNode.scale as unknown as vec3);

        if (gltfNode.rotation) {
            quat.copy(wglNode.rotation, gltfNode.rotation as unknown as quat);
            quat.normalize(wglNode.rotation, wglNode.rotation);
        }

        if (gltfNode.matrix)
            wglNode.setTransformFromMatrix(gltfNode.matrix as unknown as mat4);

        if (gltfNode.name)
            wglNode.name = gltfNode.name;

        if (gltfNode.hasOwnProperty("mesh")) {
            const meshInstance = this._scene.meshInstances.create(wglNode, await this._getMesh(gltfNode.mesh));
            meshInstance.layerMask = this.meshInstanceLayerMask;
        }

        return wglNode;
    }

    private async _getMesh(index: number) {
        if (!this._meshes[index]) {
            const gltfMesh = this._gltf.meshes[index];

            const primitives = new Array<Primitive>();
            for (const meshPrimitive of gltfMesh.primitives) {
                const type = this._getPrimitiveType(meshPrimitive);
                const baseMaterial = await this._getMaterial(meshPrimitive);

                const attributes = new Array<Attribute>();
                const attributeNames = Object.keys(meshPrimitive.attributes);
                const bounds = new Bounds();
                for (const attributeName of attributeNames){
                    const attribute = await this._getAttribute(attributeName, meshPrimitive.attributes[attributeName]);

                    if (attribute !== null)
                        attributes.push(attribute);

                    // position accessor must specify min and max properties
                    if (attributeName == "POSITION") {
                        const gltfAccessor = this._gltf.accessors[meshPrimitive.attributes[attributeName]];
                        vec3.copy(bounds.min, gltfAccessor.min as unknown as vec3);
                        vec3.copy(bounds.max, gltfAccessor.max as unknown as vec3);
                    }
                }

                const indicesBuffer = await this._getElementBuffer(meshPrimitive.indices);

                const primitive = new Primitive(type, indicesBuffer, attributes, bounds, baseMaterial);
                primitives.push(primitive);

                this._scene.shaders.updateProgram(baseMaterial, primitive);
            }

            this._meshes[index] = this._scene.meshes.create(primitives);
        }

        return this._meshes[index];
    }

    private _getPrimitiveType(primitive: GLTF.Primitive) {
        let mode = primitive.hasOwnProperty("mode") ? primitive.mode : GLTF.PrimitiveMode.Triangles;

        switch (mode) {
            case GLTF.PrimitiveMode.Triangles:
                return this._scene.gl.TRIANGLES;

            default:
                throw new Error(`Unsupported Primitive Mode: ${mode}`);
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
            case GLTF.ComponentType.UnsignedByte:
                return gl.UNSIGNED_BYTE;

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

        const attributeType = GLTFLoader._attributeNameToType.get(gltfName);
        if (attributeType === undefined)
            return null;

        return new Attribute(
            attributeType,
            GLTFLoader._getComponentType(accessor.componentType, this._scene.gl),
            GLTFLoader._getComponentElementCount(accessor.type),
            accessor.count,
            accessor.byteOffset,
            bufferView.byteStride ? bufferView.byteStride : 0,
            await this._createGlBufferFromView(accessor.bufferView)
        );
    }

    private async _getElementBuffer(index) {
        const accessor = this._gltf.accessors[index];

        return new ElementBuffer(
            GLTFLoader._getComponentType(accessor.componentType, this._scene.gl),
            accessor.count,
            accessor.byteOffset,
            await this._createGlBufferFromView(accessor.bufferView)
        );
    }

    private async _getBufferView(index: number) {
        if (!this._bufferViews[index]) {
            const bufferView = this._gltf.bufferViews[index];
            const buffer = await this._getBuffer(bufferView.buffer);

            this._bufferViews[index] = new DataView(buffer.buffer, bufferView.byteOffset + buffer.byteOffset, bufferView.byteLength);
        }

        return this._bufferViews[index];
    }

    private async _createGlBufferFromView(index: number) {
        if (!this._glBuffers[index]) {
            const gltfBufferView = this._gltf.bufferViews[index];
            const bufferView = await this._getBufferView(index);

            const gl = this._scene.gl;
            const target = gltfBufferView.target === GLTF.BufferViewTarget.ArrayBuffer ? gl.ARRAY_BUFFER : gl.ELEMENT_ARRAY_BUFFER;
            const glBuffer = gl.createBuffer();
            gl.bindBuffer(target, glBuffer);
            gl.bufferData(target, bufferView, gl.STATIC_DRAW);

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

            // if the buffer does not have a URI, then we are loading from GLB
            if (index === 0 && this._glb !== null && !buffer.uri) {
                this._arrayBuffers[index] = this._glb.binary;
            }
            else {
                const response = await fetch(this._getFetchUri(buffer.uri));
                if (response.status != 200) {
                    throw new Error(`unable to fetch buffer: ${buffer.uri}`);
                }
                this._arrayBuffers[index] = new DataView(await response.arrayBuffer());
            }
        }

        return this._arrayBuffers[index];
    }

    private async _getMaterial(primitive: GLTF.Primitive) {
        if (primitive.hasOwnProperty("material")) {
            if (!this._materials[primitive.material]) {
                const gltfMaterial = this._gltf.materials[primitive.material];
                let faceMaterial: PhongMaterial = new PhongMaterial(this._scene.shaders.defaultPhong);

                if (gltfMaterial.pbrMetallicRoughness.baseColorTexture) {
                    faceMaterial.diffuseMap = await this._getTexture(gltfMaterial.pbrMetallicRoughness.baseColorTexture.index);
                }

                if (gltfMaterial.pbrMetallicRoughness.baseColorFactor) {
                    const color = gltfMaterial.pbrMetallicRoughness.baseColorFactor;
                    vec4.set(faceMaterial.diffuseColor, color[0], color[1], color[2], color[3]);
                }

                this._materials[primitive.material] = faceMaterial;
            }

            return this._materials[primitive.material]
        }
        else {
            return new PhongMaterial(this._scene.shaders.defaultPhong);
        }
    }

    private async _getTexture(index: number) {
        if (!this._textures[index]) {
            const image = this._gltf.images[index];

            if (image.bufferView) {
                const bufferView = await this._getBufferView(image.bufferView);
                this._textures[index] = await this._scene.textures.createFromBuffer(bufferView, image.mimeType);
            }
            else {
                this._textures[index] = await this._scene.textures.createFromUrl(this._getFetchUri(image.uri));
            }

        }
        return this._textures[index];
    }

    private _autoscaleScene() {
        const worldBounding = this._scene.calculateWorldBounding();
        const minValue = Math.min(worldBounding.min[0], Math.min(worldBounding.min[1], worldBounding.min[2]));
        const maxValue = Math.max(worldBounding.max[0], Math.max(worldBounding.max[1], worldBounding.max[2]));
        const deltaValue = maxValue - minValue;
        const scale = 1.0 / deltaValue;

        vec3.set(this._scene.rootNode.scale, scale, scale, scale);
        this._scene.rootNode.updateMatrix();

        vec3.scale(this._scene.worldBounding.min, this._scene.worldBounding.min, scale);
        vec3.scale(this._scene.worldBounding.max, this._scene.worldBounding.max, scale);
    }
}