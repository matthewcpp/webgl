import {Components} from "./Components";
import {MathUtil} from "./MathUtil";

import {vec3, quat, mat4} from "gl-matrix"

export class Node {
    public static freeze = false;

    public parent: Node = null;
    private readonly children = new Array<Node>();

    public position = vec3.fromValues(0.0, 0.0, 0.0);
    public rotation = quat.create();
    public scale = vec3.fromValues(1.0, 1.0, 1.0);

    public readonly localMatrix = mat4.create();
    public readonly worldMatrix = mat4.create();
    public readonly components: Components = {}

    public constructor(
        public name: string = null
    ) {}

    public addChild(child: Node) {
        // remove the child from its parent's children array
        if (child.parent)
            child.parent.children.filter((c: Node) => { return c != child; });

        child.parent = this;
        this.children.push(child);

        child.updateMatrix();
    }

    public getChild(index: number) {
        return this.children[index];
    }

    public getChildCount() {
        return this.children.length;
    }

    public setTransformFromMatrix(matrix: mat4) {
        MathUtil.extractTRS(matrix, this.position, this.rotation, this.scale);
    }

    public updateMatrix() {
        if (Node.freeze)
            return;

        mat4.identity(this.localMatrix);
        mat4.fromRotationTranslationScale(this.localMatrix, this.rotation, this.position, this.scale);

        if (this.parent)
            mat4.multiply(this.worldMatrix, this.parent.worldMatrix, this.localMatrix);
        else
            mat4.copy(this.worldMatrix, this.localMatrix);

        if (this.components.meshInstance)
            this.components.meshInstance.updateBounds();

        for (const child of this.children)
            child.updateMatrix();
    }

    public forward(): vec3 {
        const fwd = vec3.fromValues(0.0, 0.0, 1.0);
        vec3.transformQuat(fwd, fwd, this.rotation);
        vec3.normalize(fwd, fwd);

        return fwd;
    }

    public up(): vec3 {
        const upp = vec3.fromValues(0.0, 1.0, 0.0);
        vec3.transformQuat(upp, upp, this.rotation);
        vec3.normalize(upp, upp);

        return upp;
    }

    public lookAt(target: vec3, up: vec3) {
        const lookAtMatrix = mat4.create();
        mat4.targetTo(lookAtMatrix, target, this.position, up);

        mat4.getRotation(this.rotation, lookAtMatrix);
        quat.normalize(this.rotation, this.rotation);
    }
}