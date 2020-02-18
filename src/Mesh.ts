export class MeshData {
    public positions: number[] = [];
    public texCoords: number[] = [];

    public triangles: number[] = [];
}

export class MeshBuffer {
    public readonly arrayBuffer: WebGLBuffer;
    public readonly vertexCount: number;

    public readonly elementBuffer: WebGLBuffer;
    public readonly elementCount: number;

    constructor(arrayBuffer: WebGLBuffer, vertexCount:number, elementBuffer: WebGLBuffer, elementCount: number) {
        this.arrayBuffer = arrayBuffer;
        this.vertexCount = vertexCount;

        this.elementBuffer = elementBuffer;
        this.elementCount = elementCount;
    }

    // todo validate data / divis by three, same length, etc
    public static create(gl:WebGLRenderingContext, meshData: MeshData): MeshBuffer {
        const bufferSize = meshData.positions.length + meshData.texCoords.length;
        const bufferData = new Float32Array(bufferSize);

        let bufferIndex = 0;
        bufferData.set(meshData.positions, 0);
        bufferIndex += meshData.positions.length;

        if (meshData.texCoords.length > 0) {
            bufferData.set(meshData.texCoords, bufferIndex);
        }

        const arrayBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);

        const elementBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
        if (meshData.triangles.length > 65536) {
            gl.bufferData(gl.ARRAY_BUFFER, new Uint32Array(meshData.triangles), gl.STATIC_DRAW);
        }
        else {
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(meshData.triangles), gl.STATIC_DRAW);
        }

        return new MeshBuffer(arrayBuffer, meshData.positions.length / 3, elementBuffer, meshData.triangles.length);
    }
}

