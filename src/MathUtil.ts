import {vec3, quat, mat4} from "gl-matrix"

export class MathUtil {
// https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles
    public static extractEuler(out: vec3, q: quat) {
        // roll (x-axis rotation)
        const sinr_cosp = 2 * (q[3] * q[0] + q[1] * q[2]);
        const cosr_cosp = 1 - 2 * (q[0] * q[0] + q[1] * q[1]);
        out[0] = Math.atan2(sinr_cosp, cosr_cosp);

        // pitch (y-axis rotation)
        const sinp = 2 * (q[3] * q[1] - q[2] * q[0]);
        if (Math.abs(sinp) >= 1)
            out[1] = sinp >= 0 ? Math.PI / 2.0 : -Math.PI / 2.0;  // use 90 degrees if out of range
        else
            out[1] = Math.asin(sinp);

        // yaw (z-axis rotation)
        const siny_cosp = 2 * (q[3] * q[2] + q[0] * q[1]);
        const cosy_cosp = 1 - 2 * (q[1] * q[1] + q[2] * q[2]);
        out[2] = Math.atan2(siny_cosp, cosy_cosp);

        for (let i = 0; i < 3; i++)
            out[i] = out[i] * 180.0 / Math.PI;
    }

    public static extractTRS(matrix: mat4, translation: vec3, rotation: quat, scale: vec3) {
        mat4.getScaling(scale, matrix);

        // To extract a correct rotation, the scaling component must be eliminated.
        const mn = mat4.create();
        for(const col of [0, 1, 2])
        {
            mn[col] = matrix[col] / scale[0];
            mn[col + 4] = matrix[col + 4] / scale[1];
            mn[col + 8] = matrix[col + 8] / scale[2];
        }
        mat4.getRotation(rotation, mn);
        quat.normalize(rotation, rotation);

        mat4.getTranslation(translation, matrix);
    }
}