import { BufferAttribute, Color, InterleavedBufferAttribute, Material, Mesh, MeshStandardMaterial, Plane, Texture, Vector2, Vector3 } from "three";
import { ProceduralGeometry } from "./ProceduralGeometry";
import { Edge, SimpleTriangle, SimpleVertex } from "../../../../types";
import { CutFillMaterial } from "./Materials/CutFillMaterial";
import { CutLinePreviewShader } from "./Materials/CutLinePreviewShader";
import { GenericPool } from "../../../Helper/GenericPool";

export class MeshCutter
{
    //Pulls of reutilizable objects to reduce allocations
    private _vec3Pool = new GenericPool<Vector3>(10, () => { return new Vector3(); });
    private _vec2Pool = new GenericPool<Vector2>(10, () => { return new Vector2(); });

    //Main function which cuts a geometry into 2 parts based on a cut plane
    public cutGeometry(originalMesh: Mesh, cutter: Plane, cutTexture: Texture, fill: boolean = true, placeOriginInCenter: boolean = true)
    {
        let leftMesh = new ProceduralGeometry();
        let rightMesh = new ProceduralGeometry();

        let loopCuts: Edge[][] = [];

        let submeshIndices = originalMesh.geometry.index as BufferAttribute;
        for(let index = 0; index < submeshIndices.array.length; index += 3)
        {
            let indexA = submeshIndices.array[index];
            let indexB = submeshIndices.array[index + 1];
            let indexC = submeshIndices.array[index + 2];

            let currentTriangle = this.getTriangle(indexA, indexB, indexC, originalMesh);
            let groupIndexA = this.getGroupIndex(indexA, originalMesh);
            let groupIndexB = this.getGroupIndex(indexB, originalMesh);
            let groupIndexC = this.getGroupIndex(indexC, originalMesh);

            //Take the most "common" group (in case some vertices don't have the same group for whatever reason)
            //Assume that groupA is the right one, then compare the remaining ones. 
            //If the remaining groups are equal, this will fix both scenarios in which A is different than them or equal to them
            //(ex: (0, 1, 0) -> will result in the first 0; (1, 0, 0) -> will result in the middle 0; (1, 1, 1) -> will result in the middle 1)
            let groupIndex = groupIndexA;
            if(groupIndexB == groupIndexC)
                groupIndex = groupIndexB;

            let isALeftSide = this.getPlaneSide(cutter, currentTriangle.vert1.pos);
            let isBLeftSide = this.getPlaneSide(cutter, currentTriangle.vert2.pos);
            let isCLeftSide = this.getPlaneSide(cutter, currentTriangle.vert3.pos);

            if(isALeftSide && isBLeftSide && isCLeftSide)
            {
                leftMesh.addTriangle(groupIndex, currentTriangle);
            }
            else if(!isALeftSide && !isBLeftSide && !isCLeftSide)
            {
                rightMesh.addTriangle(groupIndex, currentTriangle);
            }
            else
            {
                this.cutTriangle(cutter, currentTriangle, groupIndex, [isALeftSide, isBLeftSide, isCLeftSide], leftMesh, rightMesh, loopCuts);
            }

            this._vec3Pool.release(currentTriangle.vert1.pos);
            this._vec3Pool.release(currentTriangle.vert1.normal);
            this._vec2Pool.release(currentTriangle.vert1.uv);
            this._vec3Pool.release(currentTriangle.vert2.pos);
            this._vec3Pool.release(currentTriangle.vert2.normal);
            this._vec2Pool.release(currentTriangle.vert2.uv);
            this._vec3Pool.release(currentTriangle.vert3.pos);
            this._vec3Pool.release(currentTriangle.vert3.normal);
            this._vec2Pool.release(currentTriangle.vert3.uv);
        }

        if(fill && loopCuts.length > 0)
        {
            this.fillGeometry(leftMesh, rightMesh, loopCuts, cutter);
        }

        if(placeOriginInCenter)
        {
            leftMesh.updateGeometryCenter();
            rightMesh.updateGeometryCenter();
        }

        let newMaterials: Material[] = [];
        if(Object.prototype.toString.call(originalMesh.material) === '[object Object]')
            newMaterials.push(new MeshStandardMaterial().copy(originalMesh.material as Material));
        else
        {
            let mat = originalMesh.material as Material[];
            for(let index = 0; index < mat.length; ++index)
            {
                if(mat[index] instanceof CutLinePreviewShader)
                    newMaterials.push(new MeshStandardMaterial().copy(mat[index]));
                else
                    newMaterials.push(mat[index]);
            }
        }
        newMaterials.push(CutFillMaterial.createMaterial(new Color(1.0, 1.0, 1.0), cutTexture));

        let generatedLeftMesh = new Mesh(leftMesh.constructGeometry(originalMesh.scale.x), newMaterials);
        generatedLeftMesh.position.copy(leftMesh.getCenterPos());

        let generatedRightMesh = new Mesh(rightMesh.constructGeometry(originalMesh.scale.x), newMaterials);
        generatedRightMesh.position.copy(rightMesh.getCenterPos());

        return { 
            leftMesh: generatedLeftMesh,
            rightMesh: generatedRightMesh
        };
    }

    private cutTriangle(cutter: Plane, originalTriangle: SimpleTriangle, originalGroupIndex: number, isLeftSide: boolean[], leftMesh: ProceduralGeometry, rightMesh: ProceduralGeometry, loopCutVertices: Edge[][])
    {
        //Identify single vertex
        let leftVertices: SimpleVertex[] = [];
        let rightVertices: SimpleVertex[] = [];

        let vertArr = [originalTriangle.vert1, originalTriangle.vert2, originalTriangle.vert3];
        for(let index = 0; index < isLeftSide.length; ++index)
        {
            if(isLeftSide[index])
                leftVertices.push(vertArr[index]);
            else
                rightVertices.push(vertArr[index]);
        }
        let singleVertex = leftVertices[0];
        let sideWithTwoVertices = rightVertices;
        let isLeftSideWithOneVertex = true;
        if(leftVertices.length > 1)
        {
            singleVertex = rightVertices[0];
            sideWithTwoVertices = leftVertices;
            isLeftSideWithOneVertex = false;
        }

        //From single vertex, find intersection with the plane and define 2 new vertices in there (will call them D, E)
        let lineIntersection1 = this.getLineIntersection(cutter, singleVertex.pos, sideWithTwoVertices[0].pos);
        let lineIntersection2 = this.getLineIntersection(cutter, singleVertex.pos, sideWithTwoVertices[1].pos);

        let intersectPoint1: SimpleVertex = {
            pos: lineIntersection1!.point,
            normal: this._vec3Pool.reserve().copy(singleVertex.normal).lerp(sideWithTwoVertices[0].normal, lineIntersection1!.lerpFactor),
            uv: this._vec2Pool.reserve().copy(singleVertex.uv).lerp(sideWithTwoVertices[0].uv, lineIntersection1!.lerpFactor)
        }
        let intersectPoint2: SimpleVertex = {
            pos: lineIntersection2!.point,
            normal: this._vec3Pool.reserve().copy(singleVertex.normal).lerp(sideWithTwoVertices[1].normal, lineIntersection2!.lerpFactor),
            uv: this._vec2Pool.reserve().copy(singleVertex.uv).lerp(sideWithTwoVertices[1].uv, lineIntersection2!.lerpFactor)
        }

        //Make triangle A, D, E
        let newTriangle1: SimpleTriangle = { 
            vert1: singleVertex,
            vert2: intersectPoint1,
            vert3: intersectPoint2
        }
        //Make triangle D, B, C
        let newTriangle2: SimpleTriangle = {
            vert1: intersectPoint1,
            vert2: sideWithTwoVertices[0],
            vert3: sideWithTwoVertices[1]
        }
        //Make triangle E, D, C
        let newTriangle3: SimpleTriangle = {
            vert1: intersectPoint2,
            vert2: intersectPoint1,
            vert3: sideWithTwoVertices[1]
        }

        let originalTriangleNormal = this.computeTriangleNormal(originalTriangle);
        this.fixTriangleWindingOrder(newTriangle1, originalTriangleNormal);
        this.fixTriangleWindingOrder(newTriangle2, originalTriangleNormal);
        this.fixTriangleWindingOrder(newTriangle3, originalTriangleNormal);
        this._vec3Pool.release(originalTriangleNormal);

        if(isLeftSideWithOneVertex)
        {
            leftMesh.addTriangle(originalGroupIndex, newTriangle1);
            rightMesh.addTriangle(originalGroupIndex, newTriangle2);
            rightMesh.addTriangle(originalGroupIndex, newTriangle3);
        }
        else
        {
            rightMesh.addTriangle(originalGroupIndex, newTriangle1);
            leftMesh.addTriangle(originalGroupIndex, newTriangle2);
            leftMesh.addTriangle(originalGroupIndex, newTriangle3);
        }

        //Find & define all loop cuts resulting from the plane cutting.
        //A loop cut means connected vertices that were added on the plane transition. There may be multiple cuts resulting, which is why it is a 2D array.
        let foundIndices: number[] = [];
        for(let index = 0; index < loopCutVertices.length; ++index)
        {
            for(let index2 = 0; index2 < loopCutVertices[index].length; ++index2)
            {
                if(this.vec3Equal(intersectPoint1.pos, loopCutVertices[index][index2].pos1) || this.vec3Equal(intersectPoint1.pos, loopCutVertices[index][index2].pos2) ||
                    this.vec3Equal(intersectPoint2.pos, loopCutVertices[index][index2].pos1) || this.vec3Equal(intersectPoint2.pos, loopCutVertices[index][index2].pos2))
                {
                    foundIndices.push(index);
                    if(foundIndices.length == 1)
                        loopCutVertices[index].push({ pos1: intersectPoint1.pos, pos2: intersectPoint2.pos });
                    break;
                }
            }
        }
        if(foundIndices.length == 0)
        {
            loopCutVertices.push([{ pos1: intersectPoint1.pos, pos2: intersectPoint2.pos }]);
        }
        if(foundIndices.length > 1)
        {
            foundIndices.sort((a, b) => a - b); //Sort to make splicing easier
            for (let discardLoopCutIndex = foundIndices.length - 1; discardLoopCutIndex > 0; --discardLoopCutIndex) 
            {
                loopCutVertices[foundIndices[0]] = loopCutVertices[foundIndices[0]].concat(loopCutVertices[foundIndices[discardLoopCutIndex]]);
                loopCutVertices.splice(foundIndices[discardLoopCutIndex], 1);
            }
        }
        
        this._vec3Pool.release(intersectPoint1.normal);
        this._vec2Pool.release(intersectPoint1.uv);
        this._vec3Pool.release(intersectPoint2.normal);
        this._vec2Pool.release(intersectPoint2.uv);
    }

    private extractVertex3(vertex: Vector3, index: number, vertexArray: BufferAttribute | InterleavedBufferAttribute, originalMesh: Mesh, convertToWorld: boolean): Vector3
    {
       vertex.set(
            vertexArray.array[index * 3],
            vertexArray.array[index * 3 + 1],
            vertexArray.array[index * 3 + 2]
        );
        if(convertToWorld)
            vertex = originalMesh.localToWorld(vertex);
        return vertex;
    }
    private extractVertex2(vertex: Vector2, index: number, vertexArray: BufferAttribute | InterleavedBufferAttribute): Vector2
    {
       vertex.set(
            vertexArray.array[index * 2],
            vertexArray.array[index * 2 + 1]
        );
        return vertex;
    }

    private getTriangle(indexA: number, indexB: number, indexC: number, originalMesh: Mesh): SimpleTriangle
    {
        let meshVertices = originalMesh.geometry.getAttribute("position");
        let meshNormals = originalMesh.geometry.getAttribute("normal");
        let meshUVs = originalMesh.geometry.getAttribute("uv");

        let triangle: SimpleTriangle = {
            vert1: {
                pos: this.extractVertex3(this._vec3Pool.reserve(), indexA, meshVertices, originalMesh, true),
                normal: this.extractVertex3(this._vec3Pool.reserve(), indexA, meshNormals, originalMesh, false),
                uv: this.extractVertex2(this._vec2Pool.reserve(), indexA, meshUVs)
            },
            vert2: {
                pos: this.extractVertex3(this._vec3Pool.reserve(), indexB, meshVertices, originalMesh, true),
                normal: this.extractVertex3(this._vec3Pool.reserve(), indexB, meshNormals, originalMesh, false),
                uv: this.extractVertex2(this._vec2Pool.reserve(), indexB, meshUVs)
            },
            vert3: {
                pos: this.extractVertex3(this._vec3Pool.reserve(), indexC, meshVertices, originalMesh, true),
                normal: this.extractVertex3(this._vec3Pool.reserve(), indexC, meshNormals, originalMesh, false),
                uv: this.extractVertex2(this._vec2Pool.reserve(), indexC, meshUVs)
            },
        }
        return triangle;
    }

    private getPlaneSide(plane: Plane, vertex: Vector3): boolean
    {
        return plane.distanceToPoint(vertex) < 0.0001;
    }

    private getLineIntersection(plane: Plane, point1: Vector3, point2: Vector3)
    {
        let aux = this._vec3Pool.reserve().subVectors(point2, point1).normalize();
        let nDotDir = plane.normal.dot(aux);
        if (Math.abs(nDotDir) < 1e-6)
            return null;

        let nDotA = plane.normal.dot(point1);
        let distance = -(plane.constant + nDotA) / nDotDir;

        let point = this._vec3Pool.reserve().copy(point1).add(aux.multiplyScalar(distance));
        this._vec3Pool.release(aux);

        return {
            point: point,
            distance: distance,
            lerpFactor: Math.abs(distance / point1.distanceTo(point2))
        }
    }

    private computeTriangleNormal(triangle: SimpleTriangle) 
    {
        let vec1 = this._vec3Pool.reserve().copy(triangle.vert2.pos).sub(triangle.vert1.pos);
        let vec2 = this._vec3Pool.reserve().copy(triangle.vert3.pos).sub(triangle.vert1.pos);
        
        vec1.cross(vec2).normalize();
        this._vec3Pool.release(vec2);
        return vec1;
    }

    private fixTriangleWindingOrder(triangle: SimpleTriangle, originalTriangleNormal: Vector3)
    {
        let norm = this.computeTriangleNormal(triangle);
        if(norm.dot(originalTriangleNormal) < 0)
        {
            let aux = triangle.vert2;
            triangle.vert2 = triangle.vert3;
            triangle.vert3 = aux;
        }
        this._vec3Pool.release(norm);
    }
    
    private fillGeometry(leftMesh: ProceduralGeometry, rightMesh: ProceduralGeometry, loopCuts: Edge[][], cutter: Plane) 
    {
        let center = this._vec3Pool.reserve();
        let newGroupIDLeft = leftMesh.getNumOfGroups();
        let newGroupIDRight = rightMesh.getNumOfGroups();

        for(let cutIndex = 0; cutIndex < loopCuts.length; ++cutIndex)
        {
            center.copy(loopCuts[cutIndex][0].pos1).add(loopCuts[cutIndex][0].pos2);
            for(let index = 1; index < loopCuts[cutIndex].length; ++index)
            {
                center.add(loopCuts[cutIndex][index].pos1).add(loopCuts[cutIndex][index].pos2);
            }
            center.divideScalar(loopCuts[cutIndex].length * 2);
            for(let index = 0; index < loopCuts[cutIndex].length; ++index)
            {
                let vertNorm = this._vec3Pool.reserve().copy(cutter.normal);
                let triangle: SimpleTriangle = {
                    vert1: {
                        pos: loopCuts[cutIndex][index].pos1,
                        normal: vertNorm,
                        uv: this.vertexToPolarUV(loopCuts[cutIndex][index].pos1, center, vertNorm)
                    },
                    vert2: {
                        pos: loopCuts[cutIndex][index].pos2,
                        normal: vertNorm,
                        uv: this.vertexToPolarUV(loopCuts[cutIndex][index].pos2, center, vertNorm)
                    },
                    vert3: {
                        pos: center.clone(),
                        normal: vertNorm,
                        uv: this._vec2Pool.reserve().set(0.5, 0.5)
                    }
                }

                this.fixTriangleWindingOrder(triangle, cutter.normal);
                leftMesh.addTriangle(newGroupIDLeft, triangle);

                vertNorm.multiplyScalar(-1);
                triangle.vert1.normal.copy(vertNorm);
                triangle.vert2.normal.copy(vertNorm);
                triangle.vert3.normal.copy(vertNorm);

                let inverseCutterNorm = this._vec3Pool.reserve().copy(cutter.normal).multiplyScalar(-1);
                this.fixTriangleWindingOrder(triangle, inverseCutterNorm);
                rightMesh.addTriangle(newGroupIDRight, triangle);
                
                this._vec3Pool.release(loopCuts[cutIndex][index].pos1);
                this._vec3Pool.release(loopCuts[cutIndex][index].pos2);
                this._vec3Pool.release(vertNorm);
                this._vec3Pool.release(inverseCutterNorm);
                
                this._vec2Pool.release(triangle.vert1.uv);
                this._vec2Pool.release(triangle.vert2.uv);
                this._vec2Pool.release(triangle.vert3.uv);
            }
        }

        this._vec3Pool.release(center);
    }

    private vec3Equal(vec1: Vector3, vec2: Vector3, threshold = 0.00001)
    {
        return (Math.abs(vec1.x - vec2.x) < threshold) && (Math.abs(vec1.y - vec2.y) < threshold) && (Math.abs(vec1.z - vec2.z) < threshold);
    }

    private vertexToPolarUV(position: Vector3, center: Vector3, normal: Vector3)
    {
        let tangent = this._vec3Pool.reserve().set(1, 0, 0);
        if (Math.abs(tangent.dot(normal)) > 0.99)
            tangent.set(0, 1, 0);
        tangent.cross(normal).normalize();
        let bitangent = this._vec3Pool.reserve().copy(normal).cross(tangent);
        let dir = this._vec3Pool.reserve().copy(position).sub(center);
        let uvPlanar = this._vec2Pool.reserve().set(dir.dot(tangent), dir.dot(bitangent));
        let angle = Math.atan2(uvPlanar.y, uvPlanar.x);

        this._vec3Pool.release(bitangent);
        this._vec3Pool.release(dir);
        this._vec3Pool.release(tangent);
        this._vec2Pool.release(uvPlanar);
        return this._vec2Pool.reserve().set(0.5 + Math.cos(angle) * 0.5, 0.5 + Math.sin(angle) * 0.5);
    }

    private getGroupIndex(vertIndex: number, mesh: Mesh)
    {
        for(let index = 0; index < mesh.geometry.groups.length; ++index)
        {
            if(vertIndex >= mesh.geometry.groups[index].start && vertIndex <= mesh.geometry.groups[index].start + mesh.geometry.groups[index].count)
            {
                return index;
            }
        }
        return 0;
    }
}