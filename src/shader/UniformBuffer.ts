/*
    Layout:
    mat4 camera_projection; (16)
    mat4 camera_view;       (16)
    vec4 ambient_light_color (3)
    float ambient_light_intensity (1)
 */

import * as mat4 from "../../external/gl-matrix/mat4.js"
import * as vec4 from "../../external/gl-matrix/vec4.js"

export class UniformBuffer {
    private static size = 144;
    private static defaultBindIndex = 0;

    private _data = new ArrayBuffer(UniformBuffer.size);
    private _glBuffer: WebGLBuffer;

    private _floatView: Float32Array;

    public constructor(
        private gl: WebGL2RenderingContext)
    {

        this._floatView = new Float32Array(this._data);

        // set up the default uniform buffer that is passed to all shaders
        // note that the default uniform buffer is bound at location 0
        this._glBuffer = this.gl.createBuffer();
        gl.bindBuffer(gl.UNIFORM_BUFFER, this._glBuffer);
        gl.bufferData(gl.UNIFORM_BUFFER, this._data, gl.DYNAMIC_DRAW);
        gl.bindBufferRange(gl.UNIFORM_BUFFER, UniformBuffer.defaultBindIndex, this._glBuffer, 0, this._data.byteLength);
    }

    // upload the latest standard shader data to the gl buffer on gpu
    public updateGpuBuffer(){
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this._glBuffer);
        this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, 0, this._data);
    }

    public set cameraProjection(projectionMatrix: mat4) {
        this._floatView.set(projectionMatrix, 0);
    }

    public set cameraView(viewMatrix: mat4) {
        this._floatView.set(viewMatrix, 16);
    }

    public set ambientColor(color: vec4) {
        this._floatView.set(color, 32);
    }

    public set ambientIntensity(intensity: number) {
        this._floatView[35] = intensity;
    }
}