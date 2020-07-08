import {Material} from "./Material.js";
import {Camera} from "./Camera.js";
import {Node} from "./Node.js";

import * as mat4 from "../external/gl-matrix/mat4.js";
import {Shader} from "./Shader.js";
import {dfsWalk} from "./Walk.js";
import {Primitive} from "./Mesh.js";

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

    private readonly _wglUnifromBlockBuffer: WebGLBuffer;
    private readonly _wglUnifromBlockData: ArrayBuffer;
    private readonly _wglMvpMatrixBuffer = new Float32Array(16)

    private readonly _drawCalls = new Map<Shader, Array<DrawCall>>();

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;

        // set up the default uniform buffer that is passed to all shaders
        // note that the default uniform buffer is bound at location 0
        // right now we are just passing 2 matrices
        this._wglUnifromBlockData = new ArrayBuffer(16 * 4 * 2)
        this._wglUnifromBlockBuffer = gl.createBuffer();
        gl.bindBuffer(gl.UNIFORM_BUFFER, this._wglUnifromBlockBuffer);
        gl.bufferData(gl.UNIFORM_BUFFER, this._wglUnifromBlockData, gl.DYNAMIC_DRAW);
        gl.bindBufferRange(gl.UNIFORM_BUFFER, 0, this._wglUnifromBlockBuffer, 0, this._wglUnifromBlockData.byteLength);
    }

    public setCamera(camera: Camera) {
        this._camera = camera;
        this._camera.aspect = this.gl.canvas.width / this.gl.canvas.height;

        // set the standard shader data in the local buffer
        const view = new Float32Array(this._wglUnifromBlockData);
        view.set(this._camera.projectionMatrix, 0);
        view.set(this._camera.viewMatrix, 16);

        // upload the latest standard shader data to the gl buffer on gpu
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this._wglUnifromBlockBuffer);
        this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, 0, this._wglUnifromBlockData);
    }

    private prepareDraw(root: Node) {
        this._drawCalls.clear();

        dfsWalk(root, (node: Node) => {
            const meshInstance = node.components.meshInstance;

            if (meshInstance) {
                for (let i  = 0; i < meshInstance.materials.length; i++) {
                    // Temporary
                    if (meshInstance.mesh.primitives[i].type != this.gl.TRIANGLES)
                        return;

                    const material = meshInstance.materials[i];
                    const drawCall = new DrawCall(material.params, meshInstance.mesh.primitives[i], node.worldMatrix);

                    if (this._drawCalls.has(material.shader))
                        this._drawCalls.get(material.shader).push(drawCall);
                    else
                        this._drawCalls.set(material.shader, [drawCall]);
                }
            }
        });
    }

    public drawScene(node: Node) {
        this.prepareDraw(node);

        this._drawCalls.forEach((drawables: Array<DrawCall>, shader: Shader) => {
            this._drawList(shader, drawables);
        })
    }

    private _drawList(shader: Shader, drawCalls: Array<DrawCall>) {
        this.gl.useProgram(shader.program);

        const shaderAttributes = shader.shaderInterface.attributes();

        // send the default data to the newly active shader
        this.gl.uniformBlockBinding(shader.program, shader.blockIndex, 0);
        this.gl.uniformMatrix4fv(shader.mvpLocation, false, this._wglMvpMatrixBuffer);

        for (const drawCall of drawCalls) {
            // TODO pass the mvp matrix
            mat4.copy(this._wglMvpMatrixBuffer, drawCall.matrix);
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
