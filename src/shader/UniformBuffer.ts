
import * as mat4 from "../../external/gl-matrix/mat4.js"
import * as vec4 from "../../external/gl-matrix/vec4.js"
import {Light} from "../Light.js";

export class ObjectUniformBuffer {
    private static size = (16 + 16) * 4;
    public static readonly defaultBindIndex = 1;

    private _data = new ArrayBuffer(ObjectUniformBuffer.size);
    private readonly _glBuffer: WebGLBuffer;

    private readonly _matrixView: Float32Array;
    private readonly _normalMatrixView: Float32Array;

    public constructor(
        private gl: WebGL2RenderingContext)
    {
        this._matrixView = new Float32Array(this._data, 0, 16);
        this._normalMatrixView = new Float32Array(this._data, 16 * 4, 16);

        this._glBuffer = this.gl.createBuffer();
        gl.bindBuffer(gl.UNIFORM_BUFFER, this._glBuffer);
        gl.bufferData(gl.UNIFORM_BUFFER, this._data, gl.DYNAMIC_DRAW);
        gl.bindBufferRange(gl.UNIFORM_BUFFER, ObjectUniformBuffer.defaultBindIndex, this._glBuffer, 0, this._data.byteLength);
    }

    public updateGpuBuffer(){
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this._glBuffer);
        this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, 0, this._data);
    }

    public get matrix() {
        return this._matrixView;
    }

    public get normalMatrix() {
        return this._normalMatrixView;
    }
}

/*
    Layout:
    mat4 camera_projection (16)
    mat4 camera_view       (16)
    vec4 camera_world_pos   (4)
    vec4 ambient_light_color (3)
    float ambient_light_intensity (1)
    Light lights[1]                 (16) * 1
    int lightCount                  (1)
 */

export class UniformBuffer {
    public static readonly defaultBindIndex = 0;

    private static baseDataSize = 40 * 4;
    private static lightStructSize = 16 * 4;
    static maxLightCount = 5;

    private readonly _data: ArrayBuffer;

    private readonly _glBuffer: WebGLBuffer;
    private readonly _floatView: Float32Array;
    private readonly _dataView: DataView;

    public constructor(
        private gl: WebGL2RenderingContext)
    {
        this._data = new ArrayBuffer(this.sizeInBytes);
        this._floatView = new Float32Array(this._data);
        this._dataView = new DataView(this._data);

        // set up the default uniform buffer that is passed to all shaders
        // note that the default uniform buffer is bound at location 0
        this._glBuffer = this.gl.createBuffer();
        gl.bindBuffer(gl.UNIFORM_BUFFER, this._glBuffer);
        gl.bufferData(gl.UNIFORM_BUFFER, this._data, gl.DYNAMIC_DRAW);
        gl.bindBufferRange(gl.UNIFORM_BUFFER, UniformBuffer.defaultBindIndex, this._glBuffer, 0, this._data.byteLength);
    }

    public get sizeInBytes() {
        return UniformBuffer.baseDataSize + (UniformBuffer.lightStructSize * UniformBuffer.maxLightCount) + 4; // light count
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

    public set cameraWorldPos(position: vec4) {
        this._floatView.set(position, 32)
    }

    public set ambientColor(color: vec4) {
        this._floatView.set(color, 36);
    }

    public set ambientIntensity(intensity: number) {
        this._floatView[39] = intensity;
    }


    public setLight(index: number, light: Light) {
        const lightBaseByteIndex = UniformBuffer.baseDataSize + (index * UniformBuffer.lightStructSize);
        const lightBaseFloatIndex =  lightBaseByteIndex / 4;


        this._dataView.setInt32(lightBaseByteIndex, light.type, true);
        this._dataView.setFloat32(lightBaseByteIndex + 4, light.range, true);
        this._dataView.setFloat32(lightBaseByteIndex + 8, light.intensity, true);
        this._dataView.setFloat32(lightBaseByteIndex + 28, light.spotInnerAngle, true);
        this._dataView.setFloat32(lightBaseByteIndex + 44, light.spotOuterAngle, true);

        this._floatView.set(light.node.position, lightBaseFloatIndex+ 4);
        this._floatView.set(light.direction, lightBaseFloatIndex + 8);
        this._floatView.set(light.color, lightBaseFloatIndex + 12);
    }

    public set lightCount(value: number) {
        const index = UniformBuffer.baseDataSize + (UniformBuffer.maxLightCount * UniformBuffer.lightStructSize);
        this._dataView.setInt32(index, value, true);
    }
}