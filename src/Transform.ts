import * as vec3 from "../external/gl-matrix/vec3.js"
import * as quat from "../external/gl-matrix/quat.js"
import * as mat4 from "../external/gl-matrix/mat4.js"

export class Transform {
    public position = vec3.fromValues(0.0, 0.0, 0.0);
    public rotation = quat.create();
    public scale = vec3.fromValues(1.0, 1.0, 1.0);

    public readonly matrix = mat4.create();

    public updateMatrix() {
        mat4.fromRotationTranslationScale(this.matrix, this.rotation, this.position, this.scale);
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