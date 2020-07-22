import * as vec3 from "../external/gl-matrix/vec3";
import * as quat from "../external/gl-matrix/quat";

// https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles
export function extractEuler(out: vec3, q: quat) {
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