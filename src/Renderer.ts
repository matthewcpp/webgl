import {Material} from "./Material.js";
import {Camera} from "./Camera.js";
import {Node} from "./Node.js";

import * as mat4 from "../external/gl-matrix/mat4.js";

export class Renderer {
    private readonly gl: WebGL2RenderingContext;

    private _camera: Camera = null;

    private readonly _wglUnifromBlockBuffer: WebGLBuffer;
    private readonly _wglUnifromBlockData: ArrayBuffer;
    private readonly _wglMvpMatrixBuffer = new Float32Array(16)


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
        this._camera.updateProjectionMatrix();
        this._camera.updateViewMatrix();

        // set the standard shader data in the local buffer
        const view = new Float32Array(this._wglUnifromBlockData);
        view.set(this._camera.projectionMatrix, 0);
        view.set(this._camera.viewMatrix, 16);

        // upload the latest standard shader data to the gl buffer on gpu
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this._wglUnifromBlockBuffer);
        this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, 0, this._wglUnifromBlockData);
    }

    public drawScene(node: Node) {
        for (let i = 0; i < node.transform.getChildCount(); i++) {
            const child = node.transform.getChild(i);

            if (child.node.components.mesh && child.node.components.material)
                this._drawNode(child.node);
        }
    }

    private _drawNode(node: Node) {
        const material = node.components.material;
        const shader = material.shader;
        this.gl.useProgram(material.shader.program);

        // update the per object standard shader values
        // mat4.multiply(this._wglMvpMatrixBuffer, this._camera.viewMatrix, node.transform.localMatrix);
        mat4.copy(this._wglMvpMatrixBuffer, node.transform.localMatrix);

        // send the default data to the newly active shader
        this.gl.uniformBlockBinding(shader.program, shader.blockIndex, 0);
        this.gl.uniformMatrix4fv(shader.mvpLocation, false, this._wglMvpMatrixBuffer);

        shader.shaderInterface.init(shader.program, this.gl);

        const mesh = node.components.mesh;

        for (const geometry of mesh.geometry) {
            if (geometry.type != this.gl.TRIANGLES) // TEMP
                continue;

            const shaderAttributes = shader.shaderInterface.attributes();

            for (const attribute of geometry.attributes) {
                if (shaderAttributes.indexOf(attribute.index) < 0)
                    continue;

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, attribute.buffer);
                this.gl.vertexAttribPointer(attribute.index, attribute.componentCount, attribute.componentType, false, attribute.stride, attribute.offset);
                this.gl.enableVertexAttribArray(attribute.index);
            }

            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, geometry.indices.buffer);
            this.gl.drawElements(geometry.type, geometry.indices.count, geometry.indices.componentType, geometry.indices.offset);
        }
    }
}
