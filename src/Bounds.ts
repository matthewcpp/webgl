import * as vec3 from "../external/gl-matrix/vec3.js"

export class Bounds {
    public min = vec3.fromValues(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    public max = vec3.fromValues(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);

    public static createFromMinMax(min: vec3, max: vec3) {
        const bounds = new Bounds();

        vec3.copy(bounds.min, min);
        vec3.copy(bounds.max, max);

        return bounds;
    }

    public center() {
        let c = vec3.fromValues(0,0,0);
        vec3.add(c, this.min, this.max);
        vec3.scale(c, c,0.5);

        return c;
    }
}