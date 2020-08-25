import {Components} from "./Components";
import {MathUtil} from "./MathUtil";

import {vec3, quat, mat4} from "gl-matrix"

export class Node {
    public static freeze = false;

    public parent: Node = null;
    private readonly children = new Array<Node>();

    public position = vec3.fromValues(0.0, 0.0, 0.0);
    public rotation = vec3.fromValues(0.0, 0.0, 0.0);
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
        const rotation = quat.create();
        MathUtil.extractTRS(matrix, this.position, rotation, this.scale);
        MathUtil.extractEuler(this.rotation, rotation);
    }

    public updateMatrix() {
        if (Node.freeze)
            return;

        mat4.identity(this.localMatrix);
        const rotation = quat.create();
        quat.fromEuler(rotation, this.rotation[0], this.rotation[1], this.rotation[2]);
        mat4.fromRotationTranslationScale(this.localMatrix, rotation, this.position, this.scale);

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
        const rotation = quat.create();
        quat.fromEuler(rotation, this.rotation[0], this.rotation[1], this.rotation[2]);

        const fwd = vec3.fromValues(0.0, 0.0, 1.0);
        vec3.transformQuat(fwd, fwd, rotation);
        vec3.normalize(fwd, fwd);

        return fwd;
    }

    public up(): vec3 {
        const rotation = quat.create();
        quat.fromEuler(rotation, this.rotation[0], this.rotation[1], this.rotation[2]);

        const upp = vec3.fromValues(0.0, 1.0, 0.0);
        vec3.transformQuat(upp, upp, rotation);
        vec3.normalize(upp, upp);

        return upp;
    }

    public lookAt(target: vec3, up: vec3) {
        const lookAtMatrix = mat4.create();
        mat4.targetTo(lookAtMatrix, target, this.position, up);

        const rotation = quat.create();
        mat4.getRotation(rotation, lookAtMatrix);
        quat.normalize(rotation, rotation);
        MathUtil.extractEuler(this.rotation, rotation);
    }
}