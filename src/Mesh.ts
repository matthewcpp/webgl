export class MeshData {
    public positions: number[] = [];
    public texCoords: number[] = [];

    public triangles: number[] = [];
}

export enum MeshVertexAttributes {
    Positions = 1,
    TexCoords = 4
}

export class MeshBuffer {
    public readonly vertexBuffer: WebGLBuffer;
    public readonly vertexCount: number;
    public readonly vertexAttributes: MeshVertexAttributes;

    public readonly elementBuffer: WebGLBuffer;
    public readonly elementCount: number;

    constructor(vertexBuffer: WebGLBuffer, vertexCount:number, vertexAttributes: MeshVertexAttributes, elementBuffer: WebGLBuffer, elementCount: number) {
        this.vertexBuffer = vertexBuffer;
        this.vertexCount = vertexCount;
        this.vertexAttributes = vertexAttributes;

        this.elementBuffer = elementBuffer;
        this.elementCount = elementCount;
    }

    public hasVertexAttribute(attribute: MeshVertexAttributes) {
        return (this.vertexAttributes & attribute) == attribute;
    }

    public getOffsetForAttribute(attribute: MeshVertexAttributes) {
        switch (attribute) {
            case MeshVertexAttributes.Positions:
                return 0;
            case MeshVertexAttributes.TexCoords: {
                return this.vertexCount * 3 * 4;
            }
        }
    }


    public static create(gl:WebGLRenderingContext, meshData: MeshData, name: string): MeshBuffer {
        MeshBuffer._validateMeshData(meshData, name);

        const bufferSize = meshData.positions.length + meshData.texCoords.length;
        const bufferData = new Float32Array(bufferSize);

        let bufferIndex = 0;
        bufferData.set(meshData.positions, 0);
        bufferIndex += meshData.positions.length;
        let vertexAttributes = MeshVertexAttributes.Positions;

        if (meshData.texCoords.length > 0) {
            bufferData.set(meshData.texCoords, bufferIndex);
            vertexAttributes |= MeshVertexAttributes.TexCoords;
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

        return new MeshBuffer(arrayBuffer, meshData.positions.length / 3, vertexAttributes, elementBuffer, meshData.triangles.length);
    }

    private static _validateMeshData(meshData: MeshData, name: string) {
        if (meshData.positions.length > 0 && meshData.positions.length % 3 != 0) {
            throw new Error(`Error creating MeshBuffer: ${name}: positions must be evenly divisible by three.`)
        }

        if (meshData.texCoords.length > 0 && meshData.texCoords.length % 2 != 0) {
            throw new Error(`Error creating MeshBuffer: ${name}: texCoords must be evenly divisible by two.`)
        }

        if (meshData.texCoords.length > 0 && meshData.texCoords.length / 2 !== meshData.positions.length / 3) {
            throw new Error(`Error creating MeshBuffer: ${name}: texCoord count should equal vertex position count.`)
        }
    }
}

