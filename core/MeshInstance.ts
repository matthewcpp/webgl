import {Node} from "./Node";
import {Material} from "./Material";
import {Bounds} from "./Bounds";
import {Mesh} from "./Mesh";
import {Renderer} from "./Renderer";

export class MeshInstance {
    public readonly node: Node;
    public readonly mesh: Mesh;
    public readonly _instanceMaterials: Material[];
    public worldBounds = new Bounds();

    public constructor(
        node: Node,
        mesh: Mesh,
    ) {
        this.node = node;
        this.mesh = mesh;
        this._instanceMaterials = new Array<Material>(this.mesh.primitives.length);

        this.updateBounds();
    }

    public getReadonlyMaterial(index): Material {
        return this._instanceMaterials[index] ? this._instanceMaterials[index] : this.mesh.primitives[index].baseMaterial;
    }

    public updateBounds() {
        Bounds.transform(this.worldBounds, this.node.worldMatrix, this.mesh.primitives[0].bounds);
    }
}

export class MeshInstances {
    constructor(private _renderer: Renderer) {}

    public create(node: Node, mesh: Mesh) {
        const meshInstance = this._renderer.createMeshInstance(node, mesh);
        node.components.meshInstance = meshInstance;
        return meshInstance;
    }
}