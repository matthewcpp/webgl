import {Node} from "../Node";

import {vec3, quat} from "gl-matrix";

export class Headlight{

    public constructor(
        private light: Node,
        private camera: Node)
    {
        this.update();
    }

    public update(): void {
        vec3.copy(this.light.position, this.camera.position);
        quat.copy(this.light.rotation, this.camera.rotation);
    }

    public reset(light:Node, camera: Node) {
        this.light = light;
        this.camera = camera;

        this.update();
    }
}