import {Material} from "./Material";
import {Bounds} from "./Bounds";
import {vec3} from "gl-matrix";
import {Scene} from "./Scene";
import {PhongMaterial} from "./shader/Phong";
import {Attribute, AttributeType, ElementBuffer, Mesh, Primitive} from "./Mesh";

class PrimitiveData {
    public constructor(
        public elements: Uint16Array,
        public material: Material
    ){}
}

export class MeshData {
    public positions: Float32Array | null = null;
    public normals: Float32Array | null = null;
    public texCoords0: Float32Array | null = null;

    public bounds = new Bounds();

    public primitives: PrimitiveData[] = [];

    public constructor() {
        vec3.set(this.bounds.min, 0.0, 0.0, 0.0);
        vec3.set(this.bounds.max, 0.0, 0.0, 0.0);
    }

    public addPrimitive(elements: Uint16Array, material: Material) {
        this.primitives.push(new PrimitiveData(elements, material));
    }

    private _vertexBufferSize(): number {
        let size = 0;

        if (this.positions)
            size += this.positions.byteLength;

        if (this.normals)
            size += this.normals.byteLength;

        if (this.texCoords0)
            size += this.texCoords0.byteLength;

        return size;
    }

    public create(scene: Scene): Mesh {
        const gl = scene.gl;

        const vertexGlBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexGlBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._vertexBufferSize(), gl.STATIC_DRAW);

        const attributes: Attribute[] = [];

        let offset = 0;
        if (this.positions) {
            gl.bufferSubData(gl.ARRAY_BUFFER, offset, this.positions);
            attributes.push(new Attribute(AttributeType.Position, gl.FLOAT, 3, this.positions.length / 3, offset, 0, vertexGlBuffer));
            offset += this.positions.byteLength;
        }

        if (this.normals) {
            gl.bufferSubData(gl.ARRAY_BUFFER, offset, this.normals);
            attributes.push(new Attribute(AttributeType.Normal, gl.FLOAT, 3, this.normals.length / 3, offset, 0, vertexGlBuffer))
            offset += this.normals.byteLength;
        }

        if (this.texCoords0) {
            gl.bufferSubData(gl.ARRAY_BUFFER, offset, this.texCoords0);
            attributes.push(new Attribute(AttributeType.TexCoord0, gl.FLOAT, 2, this.texCoords0.length / 2, offset, 0, vertexGlBuffer))
            offset += this.texCoords0.length;
        }

        const primitives: Primitive[] = [];

        for (const primitiveData of this.primitives) {
            const elementGlBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementGlBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, primitiveData.elements, gl.STATIC_DRAW);

            const elementBuffer = new ElementBuffer(gl.UNSIGNED_SHORT, primitiveData.elements.length, 0 , elementGlBuffer);

            const material = new PhongMaterial(scene.shaders.defaultPhong);
            const primitive = new Primitive(gl.TRIANGLES, elementBuffer, attributes, this.bounds, material);
            scene.shaders.updateProgram(material, primitive);

            primitives.push(primitive);
        }

        return scene.meshes.create(primitives);
    }
}