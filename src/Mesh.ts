import {Bounds} from "./Bounds.js";
import {Material} from "./Material.js";

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
        public indices: ElementBuffer = null,
        public attributes: Array<Attribute>,
        public bounds: Bounds,
        public baseMaterial: Material,
    ) {}

}

export class Mesh {
    public constructor(
        public readonly primitives: Primitive[]
    ){}
}

export class MeshInstance {
    public materials: Array<Material>;

    public constructor(
        public readonly mesh: Mesh
    ) {
        this.materials = new Array<Material>(mesh.primitives.length);

        for (let i = 0; i < mesh.primitives.length; i++)
            this.materials[i] = mesh.primitives[i].baseMaterial.clone();
    }
}