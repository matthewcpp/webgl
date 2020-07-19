import {Node} from "./Node.js";

import * as vec3 from "../external/gl-matrix/vec3.js";

export enum LightType {
    Directional,
    Point,
    Spot
}

export class Light {
    public color = vec3.fromValues(1.0, 1.0, 1.0);

    public range = 10.0;
    public intensity = 1.0;

    public spotInnerAngle = 12.5;
    public spotOuterAngle = 45.0;

    public constructor(
        public type: LightType,
        public readonly node: Node
    ) {}

    public get direction(){
        return this.node.forward();
    }
}