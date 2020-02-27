/**
 * Describes a single member of a uniform member
 */
interface UniformMemberInfo{
    type: string;
    name: string;
}

/**
 * Represents JSON data describing a Uniform Block
 */
export interface UniformBlockInfo {
    /** Name of the uniform block.  Note: not the instance name used when manipulating its member sin the shader! */
    name: string;

    /** Note when defining the members of the uniform block, the order needs to match up with the declaration order in the shader code. */
    members: UniformMemberInfo[];
}

/**
 * This class represents a Uniform block present in a shader.
 * Each member of the block is backed by an ArrayBufferView of the main client data array on the shader.
 */
export class UniformBlock {
    readonly blockIndex: number;
    readonly bindPoint: number;

    readonly members = new Map<string, Float32Array>();

    constructor(blockIndex: number, bindPoint: number) {
        this.blockIndex = blockIndex;
        this.bindPoint = bindPoint;
    }
}