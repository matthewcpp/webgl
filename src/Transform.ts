import * as vec3 from "../external/gl-matrix/vec3.js"
import * as quat from "../external/gl-matrix/quat.js"
import * as mat4 from "../external/gl-matrix/mat4.js"

import {Node} from "./Node.js";

export class Transform {
    public static freeze = false;

    public parent: Transform = null;
    private readonly children: Transform[] = [];

    public position = vec3.fromValues(0.0, 0.0, 0.0);
    public rotation = quat.create();
    public scale = vec3.fromValues(1.0, 1.0, 1.0);

    public readonly localMatrix = mat4.create();
    public readonly worldMatrix = mat4.create();

    public constructor(
        public readonly node: Node
    ) {}

    public addChild(child: Transform) {
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

    public updateMatrix() {
        mat4.fromRotationTranslationScale(this.localMatrix, this.rotation, this.position, this.scale);

        if (Transform.freeze)
            return;

        if (this.parent)
            mat4.multiply(this.worldMatrix, this.parent.worldMatrix, this.localMatrix);

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

    public lookAt(target: vec3) {
        const lookAtMatrix = mat4.create();
        mat4.targetTo(lookAtMatrix, target, this.position, this.up());
        mat4.getRotation(this.rotation, lookAtMatrix);
    }
}