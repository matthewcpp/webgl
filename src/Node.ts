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
        if (Node.freeze)
            return;

        const rotation = quat.create();
        quat.fromEuler(rotation, this.rotation[0], this.rotation[1], this.rotation[2]);
        mat4.fromRotationTranslationScale(this.localMatrix, rotation, this.position, this.scale);

        if (this.parent)
            mat4.multiply(this.worldMatrix, this.parent.worldMatrix, this.localMatrix);

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
        Node.extractEuler(this.rotation, rotation);
    }

    // TODO: Find better place for this function
    // https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles
    private static extractEuler(out: vec3, q: quat) {
        // roll (x-axis rotation)
        const sinr_cosp = 2 * (q[3] * q[0] + q[1] * q[2]);
        const cosr_cosp = 1 - 2 * (q[0] * q[0] + q[1] * q[1]);
        out[0] = Math.atan2(sinr_cosp, cosr_cosp);

        // pitch (y-axis rotation)
        const sinp = 2 * (q[3] * q[1] - q[2] * q[0]);
        if (Math.abs(sinp) >= 1)
            out[1] = sinp >= 0 ? Math.PI / 2.0 : -Math.PI / 2.0;  // use 90 degrees if out of range
        else
            out[1] = Math.asin(sinp);

        // yaw (z-axis rotation)
        const siny_cosp = 2 * (q[3] * q[2] + q[0] * q[1]);
        const cosy_cosp = 1 - 2 * (q[1] * q[1] + q[2] * q[2]);
        out[2] = Math.atan2(siny_cosp, cosy_cosp);

        for (let i = 0; i < 3; i++)
            out[i] = out[i] * 180.0 / Math.PI;
    }
}