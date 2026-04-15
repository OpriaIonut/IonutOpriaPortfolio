export const exposedCodeProceduralGeometry = `
import { BufferAttribute, BufferGeometry, Uint16BufferAttribute, Vector3 } from "three";
import { SimpleTriangle, SimpleVertex } from "../../../../types";

export class ProceduralGeometry
{
    //For the geometry we will use multiple groups to be able to add more easily custom materials on the cut sides
    //The first array is that of the groups and will hold an array of the vertices present in that group
    private vertices: SimpleVertex[][] = [];
    private indices: number[] = [];
    private center: Vector3 = new Vector3(); //Center of this geometry

    private firstFreeIndex: number = 0; //Used to generate indices for the geometry

    public getCenterPos() { return this.center; }
    public getNumOfGroups() { return this.vertices.length; }

    public constructGeometry(originalMeshScale: number): BufferGeometry
    {
        let geom = new BufferGeometry();

        //Count how many vertices we have in total (all of the groups added together)
        let count = 0;
        for(let groupIndex = 0; groupIndex < this.vertices.length; ++groupIndex)
        {
            count += this.vertices[groupIndex].length;
        }

        //Allocate memory for the geometry
        let indicesArr = new Uint16BufferAttribute(this.indices, 1);
        let vertArr = new Float32Array(count * 3);
        let normArr = new Float32Array(count * 3);
        let uvArr = new Float32Array(count * 2);

        //Copy the data into the arrays allocated above
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

        //Construct the geometry
        geom.setAttribute("position", new BufferAttribute(vertArr, 3));
        geom.setAttribute("normal", new BufferAttribute(normArr, 3));
        geom.setAttribute("uv", new BufferAttribute(uvArr, 2));
        geom.setIndex(indicesArr);

        //Define the groups
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
        //If we added a group with an index greater that what we currently have, fill the data until that specific group
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
        this.indices.push(this.firstFreeIndex, this.firstFreeIndex + 1, this.firstFreeIndex + 2);
        this.firstFreeIndex += 3;
    }

    //Apply an offset to the local position of each vertex
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

    //Calculate the center of the geometry based on all of the vertices
    //Simply add together all vertices and then divide based on how many there are
    public calculateGeometryCenter()
    {
        this.center.set(0.0, 0.0, 0.0);
        if(this.vertices.length == 0)
            return;

        //We need to go through each group and then through each vertex in said group
        let count = 0;
        for(let index = 0; index < this.vertices.length; ++index)
        {
            count += this.vertices[index].length;
            for(let index2 = 0; index2 < this.vertices[index].length; ++index2)
            {
                this.center.add(this.vertices[index][index2].pos);
            }
        }
        this.center.divideScalar(count);
    }
}
`;