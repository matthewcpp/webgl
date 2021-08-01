import {vec3, quat} from "gl-matrix";
import {Light} from "../Light";
import {Camera} from "../Camera";

export class Headlight{

    public constructor(
        private light: Light,
        private camera: Camera)
    {
        this.update();
    }

    public update(): void {
        vec3.copy(this.light.node.position, this.camera.node.position);
        quat.copy(this.light.node.rotation, this.camera.node.rotation);
    }

    public reset(light:Light, camera: Camera) {
        this.light = light;
        this.camera = camera;

        this.update();
    }
}