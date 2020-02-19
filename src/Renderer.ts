import {MeshBuffer, MeshVertexAttributes} from "./Mesh.js";
import {Material} from "./Material.js";
import {Camera} from "./Camera.js";
import {Transform} from "./Transform.js";

import * as vec4 from "../external/gl-matrix/vec4.js";
import * as mat4 from "../external/gl-matrix/mat4.js";


export class Renderer {
    private gl: WebGLRenderingContext;

    private _camera: Camera = null;
    private _material: Material = null;

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;
    }

    public setCamera(camera: Camera) {
        this._camera = camera;
    }

    public activateMaterial(material: Material) {
        this._material = material;
        this.gl.useProgram(this._material.shader.program);

        this.gl.uniformMatrix4fv(material.shader.uniforms.get("uProjectionMatrix"), false, this._camera.projectionMatrix);

        material.vec4.forEach((value: vec4, key: string) => {
            this.gl.uniform4fv(material.shader.uniforms.get(key), value);
        });

        material.texture.forEach((value: WebGLTexture, key: string) => {
            this.gl.activeTexture(this.gl.TEXTURE0); // TODO: fixme
            this.gl.bindTexture(this.gl.TEXTURE_2D, value);
            const samplerLocation = material.shader.uniforms.get(key);
            this.gl.uniform1i(samplerLocation, 0);
        });
    }

    public drawMeshBuffer(meshBuffer: MeshBuffer, transform: Transform) {
        let modelView = mat4.create();
        mat4.multiply(modelView, this._camera.viewMatrix, transform.matrix);

        this.gl.uniformMatrix4fv(this._material.shader.uniforms.get("uModelViewMatrix"), false, modelView);

        const vertexPosition = this._material.shader.attributes.get("aVertexPosition");
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, meshBuffer.vertexBuffer);
        this.gl.vertexAttribPointer(vertexPosition, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vertexPosition);

        if (meshBuffer.hasVertexAttribute(MeshVertexAttributes.TexCoords)) {
            const textCordPosition = this._material.shader.attributes.get("aTextureCoord");
            this.gl.vertexAttribPointer(textCordPosition, 2, this.gl.FLOAT, false, 0, meshBuffer.getOffsetForAttribute(MeshVertexAttributes.TexCoords));
            this.gl.enableVertexAttribArray(textCordPosition);
        }

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, meshBuffer.elementBuffer);
        const indexType = meshBuffer.elementCount > 65536 ? this.gl.UNSIGNED_INT: this.gl.UNSIGNED_SHORT;
        this.gl.drawElements(this.gl.TRIANGLES, meshBuffer.elementCount, indexType, 0);
    }
}
