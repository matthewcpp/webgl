import {Components} from "./Components.js";
import * as vec3 from "../external/gl-matrix/vec3.js";
import * as quat from "../external/gl-matrix/quat.js";
import * as mat4 from "../external/gl-matrix/mat4.js";

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
        const rotation = quat.create();
        quat.fromEuler(rotation, this.rotation[0], this.rotation[1], this.rotation[2]);
        mat4.fromRotationTranslationScale(this.localMatrix, rotation, this.position, this.scale);

        if (Node.freeze)
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

    public lookAt(target: vec3, up: vec3) {
        const lookAtMatrix = mat4.create();
        mat4.targetTo(lookAtMatrix, target, this.position, up);
        mat4.getRotation(this.rotation, lookAtMatrix);
    }
}