export enum GLTFComponentType {
    Byte = 5120,
    UnsignedByte = 5121,
    Short = 5122,
    UnsignedShort = 5123,
    UnsignedInt = 5125,
    Float = 5126
}

export interface GLTFNode {
    name?: string,
    mesh?: number,
}

export interface GLTFScene {
    name?: string;
    nodes: number[];
}

export enum GLTFPrimitiveMode{
    Points = 0,
    Lines = 1,
    LineLoop = 2,
    LineStrip = 3,
    Triangles = 4,
    TriangleStrip = 5,
    TriangleFan = 6
}

export interface GLTFPrimitive
{
    attributes: {[key: string]: number};
    mode: GLTFPrimitiveMode;
    indices: number;
}

export interface GLTFMesh {
    name?: string;
    primitives: GLTFPrimitive[],
}

export interface GLTFAccessor {
    bufferView: number,
        byteOffset: number,
        componentType: GLTFComponentType,
        count: number,
        type: string,
        max: number[],
        min: number[],
}

export enum GlTFBufferViewTarget {
    ArrayBuffer = 34962,
    ElementArrayBuffer = 34963
}

export interface GLTFBufferView {
    buffer: number,
    byteOffset: number,
    byteLength: number,
    byteStride?: number,
    target: GlTFBufferViewTarget,
}

export interface GLTFBuffer {
    uri: string,
    byteLength: number,
}

export interface GLTFAsset {
    version: string,
}

export interface GLTFSchema {
    scene?: number;
    scenes?: GLTFScene[];
    nodes?: GLTFNode[];
    meshes?: GLTFMesh[];
    buffers?: GLTFBuffer[];
    bufferViews?: GLTFBufferView[];
    accessors?: GLTFAccessor[];
    asset: GLTFAsset;
}