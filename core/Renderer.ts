import {Camera} from "./Camera";
import {Node} from "./Node";
import {ShaderProgram} from "./Shader";
import {Mesh, Primitive} from "./Mesh";
import {MeshInstance} from "./MeshInstance";
import {ObjectUniformBuffer, UniformBuffer} from "./UniformBuffer";
import {Lights} from "./Light";

import {mat4, vec4} from "gl-matrix"
import {Material} from "./Material";
import {RenderTarget} from "./RenderTarget";

class DrawCall {
    public constructor(
        public meshInstance: MeshInstance,
        public primitive: number
    ) {}
}

export class Renderer {
    private readonly gl: WebGL2RenderingContext;

    public camera: Camera = null;

    private readonly _uniformBuffer: UniformBuffer;
    private readonly _objectUniformBuffer: ObjectUniformBuffer;

    private readonly _drawCalls = new Map<ShaderProgram, DrawCall[]>();

    private _lights: Lights;
    private _lightMask = 0xFFFF;
    private _meshInstances: MeshInstance[] = [];

    public renderTarget: RenderTarget | null = null;

    constructor(gl: WebGL2RenderingContext, lights: Lights) {
        this.gl = gl;
        this._lights = lights;

        this._uniformBuffer = new UniformBuffer(this.gl);
        this._uniformBuffer.ambientColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
        this._uniformBuffer.ambientIntensity = 0.1;

        this._objectUniformBuffer = new ObjectUniformBuffer(this.gl);
    }

    private _updateCamera() {
        if (this.renderTarget)
            this.camera.aspect = this.renderTarget.width / this.renderTarget.height;
        else
            this.camera.aspect = this.gl.canvas.width / this.gl.canvas.height;

        this._uniformBuffer.cameraProjection = this.camera.projectionMatrix;
        this._uniformBuffer.cameraView = this.camera.viewMatrix;
        this._uniformBuffer.cameraWorldPos = this.camera.node.position;
    }

    private prepareDraw() {
        this._drawCalls.clear();

        for (const meshInstance of this._meshInstances) {
            if ((this.camera.cullingMask & meshInstance.layerMask) === 0)
                continue;

            for (let i  = 0; i < meshInstance.mesh.primitives.length; i++) {
                // Temporary
                if (meshInstance.mesh.primitives[i].type != this.gl.TRIANGLES)
                    return;

                const material = meshInstance.getReadonlyMaterial(i);
                const drawCall = new DrawCall(meshInstance, i);

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
        this.camera = null;
    }

    private updateLights() {
        let lightCount = 0;

        for (let i = 0; i < this._lights.items.length; i++){
            const light = this._lights.items[i];

            if ((this._lightMask & light.layerMask) === 0)
                continue;

            this._uniformBuffer.setLight(lightCount++, light);
        }

        this._uniformBuffer.lightCount = lightCount;
    }

    public draw() {
        const gl = this.gl;
        this._updateCamera();
        this.prepareDraw();
        this._lightMask = 0;

        if (this.renderTarget){
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.renderTarget.handle);
            gl.viewport(0, 0, this.renderTarget.colorTexture.width, this.renderTarget.colorTexture.height);
        }

        else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        }

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this._drawCalls.forEach((drawables: Array<DrawCall>, program: ShaderProgram) => {
            this._drawList(program, drawables);
        })

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    private _drawList(shaderProgram: ShaderProgram, drawCalls: Array<DrawCall>) {
        this.gl.useProgram(shaderProgram.program);

        // send the default data to the newly active shader
        this.gl.uniformBlockBinding(shaderProgram.program, shaderProgram.globalBlockIndex, UniformBuffer.defaultBindIndex);
        this.gl.uniformBlockBinding(shaderProgram.program, shaderProgram.objectBlockIndex, ObjectUniformBuffer.defaultBindIndex);

        // todo: dont create me over and over
        const normalMatrix = mat4.create();

        for (const drawCall of drawCalls) {
            // check the lighting state
            if (drawCall.meshInstance.layerMask != this._lightMask) {
                this._lightMask = drawCall.meshInstance.layerMask;
                this.updateLights();
                this._uniformBuffer.updateGpuBuffer();
            }

            const matrix = drawCall.meshInstance.node.worldMatrix;
            const material = drawCall.meshInstance.getReadonlyMaterial(drawCall.primitive);
            const primitive = drawCall.meshInstance.mesh.primitives[drawCall.primitive];

            // set the uniform buffer values for this particular object and upload to GPU
            this._objectUniformBuffer.matrix.set(matrix, 0);
            mat4.invert(normalMatrix, matrix);
            mat4.transpose(normalMatrix, normalMatrix);
            this._objectUniformBuffer.normalMatrix.set(normalMatrix, 0);
            this._objectUniformBuffer.updateGpuBuffer();

            material.shader.setUniforms(this.gl, material);

            for (const attribute of primitive.attributes) {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, attribute.buffer);
                this.gl.vertexAttribPointer(attribute.type, attribute.componentCount, attribute.componentType, false, attribute.stride, attribute.offset);
                this.gl.enableVertexAttribArray(attribute.type);
            }

            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, primitive.indices.buffer);
            this.gl.drawElements(primitive.type, primitive.indices.count, primitive.indices.componentType, primitive.indices.offset);

            for (const attribute of primitive.attributes) {
                this.gl.disableVertexAttribArray(attribute.type);
            }
        }
    }
}
