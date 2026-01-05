import { BufferAttribute, BufferGeometry, Uint16BufferAttribute, Vector3 } from "three";
import { SimpleTriangle, SimpleVertex } from "../../../../types";

export class ProceduralGeometry
{
    private vertices: SimpleVertex[][] = [];
    private indices: number[] = [];
    private center: Vector3 = new Vector3();

    private _firstFreeIndex: number = 0;

    public getCenterPos() { return this.center; }
    public getNumOfGroups() { return this.vertices.length; }

    public constructGeometry(originalMeshScale: number): BufferGeometry
    {
        let geom = new BufferGeometry();

        let count = 0;
        for(let groupIndex = 0; groupIndex < this.vertices.length; ++groupIndex)
        {
            count += this.vertices[groupIndex].length;
        }

        let indicesArr = new Uint16BufferAttribute(this.indices, 1);
        let vertArr = new Float32Array(count * 3);
        let normArr = new Float32Array(count * 3);
        let uvArr = new Float32Array(count * 2);

        let vertIndex = 0;
        let uvIndex = 0;
        for(let groupIndex = 0; groupIndex < this.vertices.length; ++groupIndex)
        {
            for(let index2 = 0; index2 < this.vertices[groupIndex].length; ++index2)
            {
                //We converted vertices to world space, so the vertices were already multiplied with the scale of the object. We are doing it reverse to keep things consistent
                vertArr[vertIndex] = this.vertices[groupIndex][index2].pos.x / originalMeshScale;
                vertArr[vertIndex + 1] = this.vertices[groupIndex][index2].pos.y / originalMeshScale;
                vertArr[vertIndex + 2] = this.vertices[groupIndex][index2].pos.z / originalMeshScale;

                normArr[vertIndex] = this.vertices[groupIndex][index2].normal.x;
                normArr[vertIndex + 1] = this.vertices[groupIndex][index2].normal.y;
                normArr[vertIndex + 2] = this.vertices[groupIndex][index2].normal.z;

                uvArr[uvIndex] = this.vertices[groupIndex][index2].uv.x;
                uvArr[uvIndex + 1] = this.vertices[groupIndex][index2].uv.y;

                vertIndex += 3;
                uvIndex += 2;
            }
        }

        geom.setAttribute("position", new BufferAttribute(vertArr, 3));
        geom.setAttribute("normal", new BufferAttribute(normArr, 3));
        geom.setAttribute("uv", new BufferAttribute(uvArr, 2));

        geom.setIndex(indicesArr);

        let counter = 0;
        for(let index = 0; index < this.vertices.length; ++index)
        {
            geom.addGroup(counter, this.vertices[index].length, index);
            counter += this.vertices[index].length;
        }

        return geom;
    }

    public addTriangle(groupIndex: number, triangle: SimpleTriangle)
    {
        while(this.vertices.length <= groupIndex)
        {
            this.vertices.push([]);
        }
        //Clone the triangles to make sure no 2 triangles share the same data (produces wrong results when modifiying vertices)
        this.vertices[groupIndex].push(
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
            for(let index2 = 0; index2 < this.vertices[index].length; ++index2)
            {
                this.vertices[index][index2].pos.sub(offset);
            }
        }
    }

    public updateGeometryCenter()
    {
        if(this.vertices.length == 0)
        {
            this.center.set(0.0, 0.0, 0.0);
            return;
        }
        let count = 0;
        let firstAdd = true;
        for(let index = 0; index < this.vertices.length; ++index)
        {
            count += this.vertices[index].length;
            for(let index2 = 0; index2 < this.vertices[index].length; ++index2)
            {
                if (firstAdd)
                {
                    this.center.copy(this.vertices[index][index2].pos);
                    firstAdd = false;
                }
                this.center.add(this.vertices[index][index2].pos);
            }
        }
        this.center.divideScalar(count);

        this.offsetVertices(this.center);
    }
}