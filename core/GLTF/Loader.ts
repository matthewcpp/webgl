import {Scene} from "../Scene";
import * as GLTF from "./Schema";
import {Node} from "../Node";
import {Attribute, ElementBuffer, Mesh, MeshInstance, Primitive} from "../Mesh";
import {Material} from "../Material.js";
import {DefaultAttributeLocations} from "../Shader";
import {downloadImage} from "../Util";
import {Bounds} from "../Bounds";
import {PhongParams, PhongTexturedParams} from "../shader/Phong";
import {MathUtil} from "../MathUtil"

import {vec3, vec4, quat, mat4} from "gl-matrix"

export class Loader {
    private _baseUrl: string;
    private _gltf: GLTF.Schema = null;
    private _meshes: Mesh[] = null;
    private _arrayBuffers: ArrayBuffer[] = null;
    private _glBuffers: WebGLBuffer[] = null;
    private _textures: WebGLTexture[] = null;
    private _materials: Material[] = null;

    public autoscaleScene = true;

    static readonly attributeLocations = new Map<string, number>();

    public constructor(
        private _scene: Scene)
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
        this._materials = this._gltf.materials ? new Array<Material>(this._gltf.materials.length) : null;

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
            this._scene.createMeshInstance(wglNode, await this._getMesh(gltfNode.mesh));
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

                primitives.push(new Primitive(type, indicesBuffer, attributes, bounds, baseMaterial));
            }

            const name = gltfMesh.name ? gltfMesh.name : index.toString();
            this._meshes[index] = this._scene.createMesh(name, primitives);
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
        const attributeIndex = Loader._getAttributeIndex(gltfName);

        if (attributeIndex == -1) {
            return null;
        }

        return new Attribute(
            attributeIndex,
            Loader._getComponentType(accessor.componentType, this._scene.gl),
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
            Loader._getComponentType(accessor.componentType, this._scene.gl),
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

            const gl = this._scene.gl;
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

    private async _getMaterial(primitive: GLTF.Primitive) {
        if (primitive.hasOwnProperty("material")) {

            if (!this._materials[primitive.material]) {
                const gltfMaterial = this._gltf.materials[primitive.material];
                let faceMaterial:Material = null;

                if (gltfMaterial.pbrMetallicRoughness.baseColorTexture) {
                    faceMaterial = new Material(await this._scene.defaultShaders.phongTextured());
                    const params = faceMaterial.params as PhongTexturedParams;
                    params.diffuseTexture = await this._getTexture(gltfMaterial.pbrMetallicRoughness.baseColorTexture.index);
                }
                else {
                    faceMaterial = new Material(await this._scene.defaultShaders.phong());
                }

                const params = faceMaterial.params as PhongParams;
                if (gltfMaterial.pbrMetallicRoughness.baseColorFactor) {
                    vec4.copy(params.diffuseColor, gltfMaterial.pbrMetallicRoughness.baseColorFactor as unknown as vec4);
                }

                this._materials[primitive.material] = faceMaterial;
            }

            return this._materials[primitive.material].clone();
        }
        else {
            return this._scene.defaultMaterial.clone();
        }
    }

    private async _getTexture(index: number) {
        if (!this._textures[index]) {
            const image = this._gltf.images[index];
            this._textures[index] = this._scene.createTextureFromImage(index.toString(), await downloadImage(this._getFetchUri(image.uri)));
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