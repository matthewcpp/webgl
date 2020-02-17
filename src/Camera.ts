import {Transform} from "./Transform.js";

import * as vec3 from "../external/gl-matrix/vec3.js"
import * as mat4 from "../external/gl-matrix/mat4.js"

export class Camera {
    public near = 0.1;
    public far = 100.0;
    public aspect = 1.33;
    public fovy = 45.0;

    public projectionMatrix: mat4 = mat4.create();
    public viewMatrix: mat4 = mat4.create();

    public transform = new Transform();

    constructor() {
        this.updateProjectionMatrix();
    }

    public updateProjectionMatrix() {
        mat4.perspective(this.projectionMatrix,
            this.fovy * Math.PI / 180,
            this.aspect,
            this.near,
            this.far);
    }

    public updateViewMatrix() {
        let target = this.transform.forward();
        vec3.add(target, this.transform.position, target);

        let up = this.transform.up();

        mat4.lookAt(this.viewMatrix, this.transform.position, target, up);
    }
}