import {Node} from "./Node.js";

import * as vec3 from "../external/gl-matrix/vec3.js"
import * as mat4 from "../external/gl-matrix/mat4.js"

export class Camera {
    public near = 0.1;
    public far = 100.0;
    public aspect = 1.33;
    public fovy = 45.0;

    public projectionMatrix: mat4 = mat4.create();
    public viewMatrix: mat4 = mat4.create();

    constructor(
        public readonly node
    ) {
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
        let target = this.node.transform.forward();
        vec3.add(target, this.node.transform.position, target);

        let up = this.node.transform.up();

        mat4.lookAt(this.viewMatrix, this.node.transform.position, target, up);
    }
}