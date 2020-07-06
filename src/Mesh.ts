import {Bounds} from "./Bounds.js";

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
    )
    {}
}

export class Primitive {
    type: number;
    indices: ElementBuffer = null;
    attributes = new Array<Attribute>();
    bounds: Bounds;
}

export class Mesh {
    public constructor(
        public readonly geometry: Primitive[]
    ){}
}