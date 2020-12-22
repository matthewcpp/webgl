import {Camera} from "./Camera";
import {Node} from "./Node";
import {Shader} from "./Shader";
import {Mesh, MeshInstance, Primitive} from "./Mesh";
import {ObjectUniformBuffer, UniformBuffer} from "./shader/UniformBuffer";
import {Light, LightType} from "./Light";

import {mat4, vec4} from "gl-matrix"
import {Material} from "./Material";

class DrawCall {
    public constructor(
        public params: any,
        public primitive: Primitive,
        public matrix: mat4,
    ) {}
}

export class Renderer {
    private readonly gl: WebGL2RenderingContext;

    private _camera: Camera = null;

    private readonly _uniformBuffer: UniformBuffer;
    private readonly _objectUniformBuffer: ObjectUniformBuffer;

    private readonly _drawCalls = new Map<Shader, DrawCall[]>();

    private lights: Light[] = [];
    private meshInstances: MeshInstance[] = [];

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;

        this._uniformBuffer = new UniformBuffer(this.gl);
        this._uniformBuffer.ambientColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
        this._uniformBuffer.ambientIntensity = 0.1;

        this._objectUniformBuffer = new ObjectUniformBuffer(this.gl);
    }

    public setCamera(camera: Camera) {
        this._camera = camera;
        this._camera.aspect = this.gl.canvas.width / this.gl.canvas.height;

        this._uniformBuffer.cameraProjection = this._camera.projectionMatrix;
        this._uniformBuffer.cameraView = this._camera.viewMatrix;
        this._uniformBuffer.cameraWorldPos = this._camera.node.position;
    }

    private prepareDraw(root: Node) {
        this._drawCalls.clear();

        for (const meshInstance of this.meshInstances) {
            for (let i  = 0; i < meshInstance.materials.length; i++) {
                // Temporary
                if (meshInstance.mesh.primitives[i].type != this.gl.TRIANGLES)
                    return;

                const material = meshInstance.materials[i];
                const drawCall = new DrawCall(material.params, meshInstance.mesh.primitives[i], meshInstance._node.worldMatrix);

                if (this._drawCalls.has(material.shader))
                    this._drawCalls.get(material.shader).push(drawCall);
                else
                    this._drawCalls.set(material.shader, [drawCall]);
            }
        }
    }

    public createMeshInstance(node: Node, mesh: Mesh, materials?: Array<Material>): MeshInstance {
        this.meshInstances.push(new MeshInstance(node, mesh, materials));
        return this.meshInstances[this.meshInstances.length - 1];
    }

    public createLight(lightType: LightType, node: Node) {
        if (this.lights.length === UniformBuffer.maxLightCount)
            throw new Error("Maximum number of lights have already been created.");

        const light = new Light(lightType, node);
        this.lights.push(light);
        return light;
    }

    private updateLights() {
        this._uniformBuffer.lightCount = this.lights.length;

        for (let i = 0; i < this.lights.length; i++)
            this._uniformBuffer.setLight(i, this.lights[i]);
    }

    public drawScene(node: Node) {
        this.updateLights();
        this.prepareDraw(node);

        // set the standard shader data in the local buffer
        this._uniformBuffer.updateGpuBuffer();

        this._drawCalls.forEach((drawables: Array<DrawCall>, shader: Shader) => {
            this._drawList(shader, drawables);
        })
    }

    private _drawList(shader: Shader, drawCalls: Array<DrawCall>) {
        this.gl.useProgram(shader.program);

        const shaderAttributes = shader.shaderInterface.attributes();

        // send the default data to the newly active shader
        this.gl.uniformBlockBinding(shader.program, shader.globalBlockIndex, UniformBuffer.defaultBindIndex);
        this.gl.uniformBlockBinding(shader.program, shader.objectBlockIndex, ObjectUniformBuffer.defaultBindIndex);

        const normalMatrix = mat4.create();

        for (const drawCall of drawCalls) {
            // set the uniform buffer values for this particular object and upload to GPU
            this._objectUniformBuffer.matrix.set(drawCall.matrix, 0);
            mat4.invert(normalMatrix, drawCall.matrix);
            mat4.transpose(normalMatrix, normalMatrix);
            this._objectUniformBuffer.normalMatrix.set(normalMatrix, 0);
            this._objectUniformBuffer.updateGpuBuffer();

            shader.shaderInterface.push(shader.program, this.gl, drawCall.params);

            for (const attribute of drawCall.primitive.attributes) {
                if (shaderAttributes.indexOf(attribute.index) < 0)
                    continue;

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, attribute.buffer);
                this.gl.vertexAttribPointer(attribute.index, attribute.componentCount, attribute.componentType, false, attribute.stride, attribute.offset);
                this.gl.enableVertexAttribArray(attribute.index);
            }

            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, drawCall.primitive.indices.buffer);
            this.gl.drawElements(drawCall.primitive.type, drawCall.primitive.indices.count, drawCall.primitive.indices.componentType, drawCall.primitive.indices.offset);
        }
    }
}
