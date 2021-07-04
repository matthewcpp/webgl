import {Camera} from "./Camera";
import {Node} from "./Node";
import {ShaderProgram} from "./Shader";
import {Mesh, Primitive} from "./Mesh";
import {MeshInstance} from "./MeshInstance";
import {ObjectUniformBuffer, UniformBuffer} from "./shader/UniformBuffer";
import {Lights} from "./Light";

import {mat4, vec4} from "gl-matrix"
import {Material} from "./Material";

class DrawCall {
    public constructor(
        public material: Material,
        public primitive: Primitive,
        public matrix: mat4,
    ) {}
}

export class Renderer {
    private readonly gl: WebGL2RenderingContext;

    private _camera: Camera = null;

    private readonly _uniformBuffer: UniformBuffer;
    private readonly _objectUniformBuffer: ObjectUniformBuffer;

    private readonly _drawCalls = new Map<ShaderProgram, DrawCall[]>();

    private _lights: Lights;
    private _meshInstances: MeshInstance[] = [];

    constructor(gl: WebGL2RenderingContext, lights: Lights) {
        this.gl = gl;
        this._lights = lights;

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

        for (const meshInstance of this._meshInstances) {
            for (let i  = 0; i < meshInstance.mesh.primitives.length; i++) {
                // Temporary
                if (meshInstance.mesh.primitives[i].type != this.gl.TRIANGLES)
                    return;

                const material = meshInstance.getReadonlyMaterial(i);
                const drawCall = new DrawCall(material, meshInstance.mesh.primitives[i], meshInstance.node.worldMatrix);

                if (this._drawCalls.has(material.program))
                    this._drawCalls.get(material.program).push(drawCall);
                else
                    this._drawCalls.set(material.program, [drawCall]);
            }
        }
    }

    public createMeshInstance(node: Node, mesh: Mesh): MeshInstance {
        this._meshInstances.push(new MeshInstance(node, mesh));
        return this._meshInstances[this._meshInstances.length - 1];
    }

    public clear() {
        this._meshInstances = [];
        this._camera = null;
    }

    private updateLights() {
        this._uniformBuffer.lightCount = this._lights.items.length;

        for (let i = 0; i < this._lights.items.length; i++)
            this._uniformBuffer.setLight(i, this._lights.items[i]);
    }

    public drawScene(node: Node) {
        this.updateLights();
        this.prepareDraw(node);

        // set the standard shader data in the local buffer
        this._uniformBuffer.updateGpuBuffer();

        this._drawCalls.forEach((drawables: Array<DrawCall>, program: ShaderProgram) => {
            this._drawList(program, drawables);
        })
    }

    private _drawList(shaderProgram: ShaderProgram, drawCalls: Array<DrawCall>) {
        this.gl.useProgram(shaderProgram.program);

        // send the default data to the newly active shader
        this.gl.uniformBlockBinding(shaderProgram.program, shaderProgram.globalBlockIndex, UniformBuffer.defaultBindIndex);
        this.gl.uniformBlockBinding(shaderProgram.program, shaderProgram.objectBlockIndex, ObjectUniformBuffer.defaultBindIndex);

        // todo: dont create me over and over
        const normalMatrix = mat4.create();

        for (const drawCall of drawCalls) {
            // set the uniform buffer values for this particular object and upload to GPU
            this._objectUniformBuffer.matrix.set(drawCall.matrix, 0);
            mat4.invert(normalMatrix, drawCall.matrix);
            mat4.transpose(normalMatrix, normalMatrix);
            this._objectUniformBuffer.normalMatrix.set(normalMatrix, 0);
            this._objectUniformBuffer.updateGpuBuffer();

            drawCall.material.shader.setUniforms(this.gl, drawCall.material);

            for (const attribute of drawCall.primitive.attributes) {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, attribute.buffer);
                this.gl.vertexAttribPointer(attribute.type, attribute.componentCount, attribute.componentType, false, attribute.stride, attribute.offset);
                this.gl.enableVertexAttribArray(attribute.type);
            }

            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, drawCall.primitive.indices.buffer);
            this.gl.drawElements(drawCall.primitive.type, drawCall.primitive.indices.count, drawCall.primitive.indices.componentType, drawCall.primitive.indices.offset);

            for (const attribute of drawCall.primitive.attributes) {
                this.gl.disableVertexAttribArray(attribute.type);
            }
        }
    }
}
