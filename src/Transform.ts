import * as vec3 from "../external/gl-matrix/vec3.js"
import * as quat from "../external/gl-matrix/quat.js"
import * as mat4 from "../external/gl-matrix/mat4.js"

export class Transform {
    public position = vec3.fromValues(0.0, 0.0, 0.0);
    public rotation = vec3.fromValues(0.0, 0.0, 0.0);
    public scale = vec3.fromValues(1.0, 1.0, 1.0);

    public readonly matrix = mat4.create();

    public updateMatrix() {
        const rotationQuat = this._rotationQuat();
        mat4.fromRotationTranslationScale(this.matrix, rotationQuat, this.position, this.scale);
    }

    public forward(): vec3 {
        const rotationQuat = this._rotationQuat();
        const fwd = vec3.fromValues(0.0, 0.0, 1.0);
        vec3.transformQuat(fwd, fwd, rotationQuat);
        vec3.normalize(fwd, fwd);

        return fwd;
    }

    public up(): vec3 {
        const rotationQuat = this._rotationQuat();
        const upp = vec3.fromValues(0.0, 1.0, 0.0);
        vec3.transformQuat(upp, upp, rotationQuat);
        vec3.normalize(upp, upp);

        return upp;
    }

    private _rotationQuat(): quat {
        const rotationQuat = quat.create();
        quat.fromEuler(rotationQuat, this.rotation[0], this.rotation[1], this.rotation[2]);

        return rotationQuat;
    }
}