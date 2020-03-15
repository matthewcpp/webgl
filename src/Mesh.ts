import {Bounds} from "./Bounds.js"
import * as vec3 from "../external/gl-matrix/vec3.js"

export enum MeshVertexAttributes {
    Positions = 1,
    Normals = 2,
    TexCoords = 4
}

export class MeshInfo {
    public positions: number[] = [];
    public normals: number[] = [];
    public texCoords: number[] = [];

    public triangles: number[] = [];
}

function calculateMinMax(positions: number[], min: vec3, max: vec3) {
    for (let i = 0; i < positions.length; i+= 3) {
        if (positions[i] < min[0]) min[0] = positions[0];
        if (positions[i + 1] < min[1]) min[1] = positions[i + 1];
        if (positions[i + 2] < min[2]) min[2] = positions[i + 2];

        if (positions[i] > max[0]) max[0] = positions[i];
        if (positions[i + 1] > max[1]) max[1] = positions[i + 1];
        if (positions[i + 2] > max[2]) max[2] = positions[i + 2];
    }
}

export class MeshBufferData {
    public vertexAttributes: MeshVertexAttributes;
    public vertexBuffer: Float32Array;
    public vertexCount: number;

    public elementBuffer: Uint16Array | Uint32Array;
    public elementCount: number;

    public min: vec3;
    public max: vec3;

    constructor(vertexAttributes: MeshVertexAttributes, vertexBuffer: Float32Array, vertexCount: number,
                elementBuffer: Uint16Array | Uint32Array, elementCount: number, min: vec3, max: vec3) {
        this.vertexAttributes = vertexAttributes;
        this.vertexBuffer = vertexBuffer;
        this.vertexCount = vertexCount;

        this.elementBuffer = elementBuffer;
        this.elementCount = elementCount;

        this.min = min;
        this.max = max;
    }

    static createFromMeshInfo(meshData: MeshInfo) {
        MeshBufferData._validateMeshInfo(meshData);

        const vertexCount = meshData.positions.length / 3;
        const bufferSize = meshData.positions.length + meshData.normals.length + meshData.texCoords.length;
        const bufferData = new Float32Array(bufferSize);

        let bufferIndex = 0;
        bufferData.set(meshData.positions, 0);
        bufferIndex += meshData.positions.length;
        let vertexAttributes = MeshVertexAttributes.Positions;

        if (meshData.normals.length > 0) {
            bufferData.set(meshData.normals, bufferIndex);
            bufferIndex += meshData.normals.length;
            vertexAttributes |= MeshVertexAttributes.Normals;
        }

        if (meshData.texCoords.length > 0) {
            bufferData.set(meshData.texCoords, bufferIndex);
            vertexAttributes |= MeshVertexAttributes.TexCoords;
        }

        let min = vec3.fromValues(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        let max = vec3.fromValues(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);
        calculateMinMax(meshData.positions, min, max);

        let elementBuffer = (meshData.triangles.length > 65535) ? new Uint32Array(meshData.triangles) : new Uint16Array(meshData.triangles);

        return new MeshBufferData(vertexAttributes, bufferData, vertexCount, elementBuffer, meshData.triangles.length, min, max);
    }

    private static _validateMeshInfo(meshData: MeshInfo) {
        if (meshData.positions.length > 0 && meshData.positions.length % 3 != 0) {
            throw new Error(`Error creating MeshBuffer: positions must be evenly divisible by three.`)
        }

        if (meshData.texCoords.length > 0 && meshData.texCoords.length % 2 != 0) {
            throw new Error(`Error creating MeshBuffer: texCoords must be evenly divisible by two.`)
        }

        if (meshData.texCoords.length > 0 && meshData.texCoords.length / 2 !== meshData.positions.length / 3) {
            throw new Error(`Error creating MeshBuffer: texCoord count should equal vertex position count.`)
        }
    }
}

export class MeshBuffer {
    public readonly vertexBuffer: WebGLBuffer;
    public readonly vertexCount: number;
    public readonly vertexAttributes: MeshVertexAttributes;

    public readonly elementBuffer: WebGLBuffer;
    public readonly elementCount: number;

    public readonly bounds: Bounds;

    constructor(vertexBuffer: WebGLBuffer, vertexCount:number, vertexAttributes: MeshVertexAttributes,
                elementBuffer: WebGLBuffer, elementCount: number,
                min: vec3, max: vec3) {
        this.vertexBuffer = vertexBuffer;
        this.vertexCount = vertexCount;
        this.vertexAttributes = vertexAttributes;

        this.elementBuffer = elementBuffer;
        this.elementCount = elementCount;

        this.bounds = Bounds.createFromMinMax(min, max);
    }

    public hasVertexAttribute(attribute: MeshVertexAttributes) {
        return (this.vertexAttributes & attribute) == attribute;
    }

    getVertexSize(): number {
        let vertexSize = 0;

        if (this.vertexAttributes & MeshVertexAttributes.Positions)
            vertexSize += 12;

        if (this.vertexAttributes & MeshVertexAttributes.Normals)
            vertexSize += 12;

        if (this.vertexAttributes & MeshVertexAttributes.TexCoords)
            vertexSize += 8;

        return vertexSize;
    }

    public static create(gl:WebGL2RenderingContext, meshBufferData: MeshBufferData): MeshBuffer {
        const arrayBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, meshBufferData.vertexBuffer, gl.STATIC_DRAW);

        const elementBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, meshBufferData.elementBuffer, gl.STATIC_DRAW);

        return new MeshBuffer(arrayBuffer, meshBufferData.vertexCount, meshBufferData.vertexAttributes,
                                elementBuffer, meshBufferData.elementCount,
                                meshBufferData.min, meshBufferData.max);
    }
}

