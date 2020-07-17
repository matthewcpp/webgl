import {Node} from "./Node.js";

import * as vec3 from "../external/gl-matrix/vec3.js";

export enum LightType {
    Directional,
    Point,
    Spot
}

export class Light {
    public color = vec3.fromValues(1.0, 1.0, 1.0);

    public constantAttenuation = 1.0;
    public linearAttenuation = 0.7;
    public quadraticAttenuation = 1.8

    public coneInnerAngle = 12.5;
    public coneOuterAngle = 17.5;

    public constructor(
        public type: LightType,
        public readonly node: Node
    ) {}

    public get direction(){
        return this.node.forward();
    }
}