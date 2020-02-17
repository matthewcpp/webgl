export class MeshData {
    public positions: number[] = [];
    triangles: number[] = [];
}

export class MeshBuffer {
    public readonly arrayBuffer: WebGLBuffer;
    public readonly elementBuffer: WebGLBuffer;
    public readonly elementCount: number;

    constructor(arrayBuffer: WebGLBuffer, elementBuffer: WebGLBuffer, elementCount: number) {
        this.arrayBuffer = arrayBuffer;
        this.elementBuffer = elementBuffer;
        this.elementCount = elementCount;
    }

    public static create(gl:WebGLRenderingContext, meshData: MeshData): MeshBuffer {
        const arrayBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshData.positions), gl.STATIC_DRAW);

        const elementBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
        if (meshData.triangles.length > 65536) {
            gl.bufferData(gl.ARRAY_BUFFER, new Uint32Array(meshData.triangles), gl.STATIC_DRAW);
        }
        else {
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(meshData.triangles), gl.STATIC_DRAW);
        }

        return new MeshBuffer(arrayBuffer, elementBuffer, meshData.triangles.length);
    }
}

