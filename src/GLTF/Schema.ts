export enum ComponentType {
    Byte = 5120,
    UnsignedByte = 5121,
    Short = 5122,
    UnsignedShort = 5123,
    UnsignedInt = 5125,
    Float = 5126
}

export interface Node {
    name?: string,
    mesh?: number,
}

export interface Scene {
    name?: string;
    nodes: number[];
}

export enum PrimitiveMode{
    Points = 0,
    Lines = 1,
    LineLoop = 2,
    LineStrip = 3,
    Triangles = 4,
    TriangleStrip = 5,
    TriangleFan = 6
}

export interface PBRMetallicRoughness {
    baseColorTexture: {
        index: number;
    }
}

export interface Material {
    name: string;
    pbrMetallicRoughness: PBRMetallicRoughness;
}

export interface Primitive
{
    attributes: {[key: string]: number};
    mode: PrimitiveMode;
    indices: number;
    material?: number;
}

export interface Mesh {
    name?: string;
    primitives: Primitive[];
}

export interface Accessor {
    bufferView: number;
    byteOffset: number;
    componentType: ComponentType;
    count: number;
    type: string;
    max: number[];
    min: number[];
}

export enum BufferViewTarget {
    ArrayBuffer = 34962,
    ElementArrayBuffer = 34963
}

export interface BufferView {
    buffer: number;
    byteOffset: number;
    byteLength: number;
    byteStride?: number;
    target: BufferViewTarget;
}

export interface Buffer {
    uri: string;
    byteLength: number;
}

export interface Asset {
    version: string;
}

export interface Image {
    uri: string;
}

export interface Schema {
    scene?: number;
    scenes?: Scene[];
    nodes?: Node[];
    meshes?: Mesh[];
    buffers?: Buffer[];
    bufferViews?: BufferView[];
    accessors?: Accessor[];
    images?: Image[];
    materials?: Material[]
    asset: Asset;
}