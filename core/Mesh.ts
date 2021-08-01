import {Bounds} from "./Bounds";
import {Material} from "./Material";
import {vec3} from "gl-matrix";
import {PhongMaterial} from "./shader/Phong";
import {Shaders} from "./Shader";

/**
 * The value of each attribute corresponds to the attribute location in the shader
 */
export enum AttributeType {
    Position = 0,
    Normal = 1,
    TexCoord0 = 2
}

/**
 * Bitwise values indicating which attributes are active in a shader
 */
export enum AttributeFlag {
    None = 0,
    Position = 1,
    Normal = 2,
    TexCoord0 = 4
}

export class Attribute {
    public constructor(
        public readonly type: AttributeType,
        public readonly componentType: number,
        public readonly componentCount: number,
        public readonly count: number,
        public readonly offset: number,
        public readonly stride: number,
        public readonly buffer: WebGLBuffer
    ){}
}

export class ElementBuffer {
    public constructor(
        public readonly componentType: number,
        public readonly count: number,
        public readonly offset: number,
        public readonly buffer: WebGLBuffer
    ){}
}

export class Primitive {
    public readonly attributeMask: number;

    public constructor(
        public readonly type: number,
        public readonly indices: ElementBuffer,
        public readonly attributes: Array<Attribute>,
        public readonly bounds: Bounds,
        public readonly baseMaterial: Material,
    ) {
        this.attributeMask = this._calculateAttributeMask();
    }

    private _calculateAttributeMask() {
        let mask = AttributeFlag.None;

        for (const attribute of this.attributes) {
            switch (attribute.type) {
                case AttributeType.Position:
                    mask |= AttributeFlag.Position;
                    break;

                case AttributeType.Normal:
                    mask |= AttributeFlag.Normal;
                    break;

                case AttributeType.TexCoord0:
                    mask |= AttributeFlag.TexCoord0;
                    break;
            }
        }

        return mask;
    }
}

export class Mesh {
    public constructor(
        public readonly primitives: Primitive[]
    ){}

    public freeGlResources(gl: WebGL2RenderingContext) {
        const buffers = new Set<WebGLBuffer>();

        for (const primitive of this.primitives) {
            buffers.add(primitive.indices.buffer);

            for (const attribute of primitive.attributes) {
                buffers.add(attribute.buffer);
            }
        }

        buffers.forEach((buffer)=> {
            gl.deleteBuffer(buffer);
        });
    }
}

class PrimitiveData {
    public constructor(
        public elements: Uint16Array,
        public material: Material
    ){}
}

export class MeshData {
    public positions: Float32Array | null = null;
    public normals: Float32Array | null = null;
    public texCoords0: Float32Array | null = null;

    public bounds = new Bounds();

    public primitives: PrimitiveData[] = [];

    public constructor() {
        vec3.set(this.bounds.min, 0.0, 0.0, 0.0);
        vec3.set(this.bounds.max, 0.0, 0.0, 0.0);
    }

    public addPrimitive(elements: Uint16Array, material: Material) {
        this.primitives.push(new PrimitiveData(elements, material));
    }
}

function _vertexBufferSize(meshData: MeshData) {
    let size = 0;

    if (meshData.positions)
        size += meshData.positions.byteLength;

    if (meshData.normals)
        size += meshData.normals.byteLength;

    if (meshData.texCoords0)
        size += meshData.texCoords0.byteLength;

    return size;
}

export class Meshes {
    items: Mesh[] = [];

    public constructor(
        private _gl: WebGL2RenderingContext,
        private _shaders: Shaders
    ) {}

    public create(primitives: Primitive[]) {
        const mesh = new Mesh(primitives);
        this.items.push(mesh);

        return mesh;
    }

    public createFromData(meshData) {
        const gl = this._gl;

        const vertexGlBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexGlBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, _vertexBufferSize(meshData), gl.STATIC_DRAW);

        const attributes: Attribute[] = [];

        let offset = 0;
        if (meshData.positions) {
            gl.bufferSubData(gl.ARRAY_BUFFER, offset, meshData.positions);
            attributes.push(new Attribute(AttributeType.Position, gl.FLOAT, 3, meshData.positions.length / 3, offset, 0, vertexGlBuffer));
            offset += meshData.positions.byteLength;
        }

        if (meshData.normals) {
            gl.bufferSubData(gl.ARRAY_BUFFER, offset, meshData.normals);
            attributes.push(new Attribute(AttributeType.Normal, gl.FLOAT, 3, meshData.normals.length / 3, offset, 0, vertexGlBuffer))
            offset += meshData.normals.byteLength;
        }

        if (meshData.texCoords0) {
            gl.bufferSubData(gl.ARRAY_BUFFER, offset, meshData.texCoords0);
            attributes.push(new Attribute(AttributeType.TexCoord0, gl.FLOAT, 2, meshData.texCoords0.length / 2, offset, 0, vertexGlBuffer))
            offset += meshData.texCoords0.length;
        }

        const primitives: Primitive[] = [];

        for (const primitiveData of meshData.primitives) {
            const elementGlBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementGlBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, primitiveData.elements, gl.STATIC_DRAW);

            const elementBuffer = new ElementBuffer(gl.UNSIGNED_SHORT, primitiveData.elements.length, 0 , elementGlBuffer);

            const material = new PhongMaterial(this._shaders.defaultPhong);
            const primitive = new Primitive(gl.TRIANGLES, elementBuffer, attributes, meshData.bounds, material);
            this._shaders.updateProgram(material, primitive);

            primitives.push(primitive);
        }

        return this.create(primitives);
    }

    public clear() {
        for (const mesh of this.items) {
            mesh.freeGlResources(this._gl);
        }

        this.items = [];
    }
}
