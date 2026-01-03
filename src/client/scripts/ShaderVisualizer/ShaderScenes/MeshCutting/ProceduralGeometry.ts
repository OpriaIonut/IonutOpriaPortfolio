import { BufferAttribute, BufferGeometry, Uint16BufferAttribute, Vector3 } from "three";
import { SimpleTriangle, SimpleVertex } from "../../../../types";

export class ProceduralGeometry
{
    private vertices: SimpleVertex[] = [];
    private indices: number[] = [];
    private center: Vector3 = new Vector3();

    private _firstFreeIndex: number = 0;

    public getCenterPos() { return this.center; }

    public constructGeometry(originalMeshScale: number): BufferGeometry
    {
        let geom = new BufferGeometry();

        let indicesArr = new Uint16BufferAttribute(this.indices, 1);
        let vertArr = new Float32Array(this.vertices.length * 3);
        let normArr = new Float32Array(this.vertices.length * 3);
        let uvArr = new Float32Array(this.vertices.length * 2);

        for(let index = 0; index < this.vertices.length; ++index)
        {
            let vertIndex = index * 3;
            //We converted vertices to world space, so the vertices were already multiplied with the scale of the object. We are doing it reverse to keep things consistent
            vertArr[vertIndex] = this.vertices[index].pos.x / originalMeshScale;
            vertArr[vertIndex + 1] = this.vertices[index].pos.y / originalMeshScale;
            vertArr[vertIndex + 2] = this.vertices[index].pos.z / originalMeshScale;

            normArr[vertIndex] = this.vertices[index].normal.x;
            normArr[vertIndex + 1] = this.vertices[index].normal.y;
            normArr[vertIndex + 2] = this.vertices[index].normal.z;

            uvArr[vertIndex] = this.vertices[index].uv.x;
            uvArr[vertIndex + 1] = this.vertices[index].uv.y;
        }

        geom.setAttribute("position", new BufferAttribute(vertArr, 3));
        geom.setAttribute("normal", new BufferAttribute(normArr, 3));
        geom.setAttribute("uv", new BufferAttribute(uvArr, 2));

        geom.setIndex(indicesArr);

        return geom;
    }

    public addTriangle(triangle: SimpleTriangle)
    {
        //Clone the triangles to make sure no 2 triangles share the same data (produces wrong results when modifiying vertices)
        this.vertices.push(
        {
            pos: triangle.vert1.pos.clone(),
            normal: triangle.vert1.normal.clone(),
            uv: triangle.vert1.uv.clone()
        },
        {
            pos: triangle.vert2.pos.clone(),
            normal: triangle.vert2.normal.clone(),
            uv: triangle.vert2.uv.clone()
        },
        {
            pos: triangle.vert3.pos.clone(),
            normal: triangle.vert3.normal.clone(),
            uv: triangle.vert3.uv.clone()
        });
        this.indices.push(this._firstFreeIndex, this._firstFreeIndex + 1, this._firstFreeIndex + 2);
        this._firstFreeIndex += 3;
    }

    public offsetVertices(offset: Vector3)
    {
        for(let index = 0; index < this.vertices.length; ++index)
        {
            this.vertices[index].pos.sub(offset);
        }
    }

    public updateGeometryCenter()
    {
        if(this.vertices.length == 0)
        {
            this.center.set(0.0, 0.0, 0.0);
            return;
        }
        for(let index = 0; index < this.vertices.length; ++index)
        {
            if (index == 0)
                this.center.copy(this.vertices[index].pos);
            this.center.add(this.vertices[index].pos);
        }
        this.center.divideScalar(this.vertices.length);

        this.offsetVertices(this.center);
    }
}