import {Bounds} from "./Bounds";
import {Material} from "./Material";

export class Attribute {
    public constructor(
        public readonly index: number,
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
    public constructor(
        public type: number,
        public indices: ElementBuffer,
        public attributes: Array<Attribute>,
        public bounds: Bounds,
        public baseMaterial: Material,
    ) {}

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
    _meshes = new Set<Mesh>();

    public constructor(
        private _gl: WebGL2RenderingContext
    ) {}

    create(primitives: Primitive[]) {
        const mesh = new Mesh(primitives);
        this._meshes.add(mesh);

        return mesh;
    }

    clear() {
        this._meshes.forEach((mesh: Mesh) => {
            mesh.freeGlResources(this._gl);
        });

        this._meshes.clear();
    }
}
