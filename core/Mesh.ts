import {Bounds} from "./Bounds";
import {Material} from "./Material";
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

    public clear() {
        for (const mesh of this.items) {
            mesh.freeGlResources(this._gl);
        }

        this.items = [];
    }
}
