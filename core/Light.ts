import {Node} from "./Node.js";

import {vec3} from "gl-matrix"
import {UniformBuffer} from "./UniformBuffer";

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

export class Lights {
    public static maxLightCount = 5;
    public items: Light[] = [];

    clear() {
        this.items = [];
    }

    create(node: Node, type: LightType): Light {
        if (this.items.length === Lights.maxLightCount)
            throw new Error("Maximum number of lights have already been created.");

        const light = new Light(type, node);
        this.items.push(light);
        return light;
    }
}