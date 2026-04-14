import { Box3, Mesh, Object3D, SkinnedMesh, Vector3 } from "three";
import { OctreeObj } from "./OctreeObj";

export class OctreeHelper
{
    public static ContainsPoint(bounds: Box3, point: Vector3): boolean
    {
        return bounds.containsPoint(point);
    }

    public static ContainsBounds(largeBounds: Box3, smallBounds: Box3): boolean
    {
        let largeMin: Vector3 = largeBounds.min;
        let largeMax: Vector3 = largeBounds.max;

        let smallMin: Vector3 = smallBounds.min;
        let smallMax: Vector3 = smallBounds.max;

        return smallMin.x >= largeMin.x && smallMax.x <= largeMax.x &&
            smallMin.y >= largeMin.y && smallMax.y <= largeMax.y &&
            smallMin.z >= largeMin.z && smallMax.z <= largeMax.z;
    }

    public static CalculateBoundsFromObjects(objects: Object3D[]): Box3
    {
        let isInit = false;
        let bounds = new Box3();
        if (objects == null || objects == undefined)
            return bounds;

        for (let index = 0; index < objects.length; ++index)
        {

            if (!isInit)
            {
                bounds.setFromObject(objects[index]);
                isInit = true;
            }
            else
                bounds.expandByObject(objects[index]);
        }
        return bounds;
    }

    public static CalculateBoundsFromOctreeObjects(objects: OctreeObj[]): Box3
    {
        let isInit = false;
        let bounds = new Box3();
        if (objects == null || objects == undefined)
            return bounds;

        for (let index = 0; index < objects.length; ++index)
        {

            if (!isInit)
            {
                bounds.setFromObject(objects[index].GetObject3D());
                isInit = true;
            }
            else
                bounds.expandByObject(objects[index].GetObject3D());
        }
        return bounds;
    }

    public static RecomputeBoundsFast(bounds: Box3, obj: Object3D)
    {
        bounds.makeEmpty();
        
        let min = bounds.min;
        let max = bounds.max;
        
        obj.traverse((child) => {
            if(!((child instanceof Mesh) || (child instanceof SkinnedMesh)))
                return;
        
            let mesh = child as THREE.Mesh;
            let matrix = mesh.matrixWorld;
        
            if (!mesh.geometry.boundingBox)
                mesh.geometry.computeBoundingBox();
            let box = mesh.geometry.boundingBox!;
        
            let minX = box.min.x, minY = box.min.y, minZ = box.min.z;
            let maxX = box.max.x, maxY = box.max.y, maxZ = box.max.z;
        
            let points = [
                [minX, minY, minZ],
                [minX, minY, maxZ],
                [minX, maxY, minZ],
                [minX, maxY, maxZ],
                [maxX, minY, minZ],
                [maxX, minY, maxZ],
                [maxX, maxY, minZ],
                [maxX, maxY, maxZ],
            ];
        
            for (let i = 0; i < 8; i++)
            {
                let tx = matrix.elements[0] * points[i][0] + matrix.elements[4] * points[i][1] + matrix.elements[8] * points[i][2] + matrix.elements[12];
                let ty = matrix.elements[1] * points[i][0] + matrix.elements[5] * points[i][1] + matrix.elements[9] * points[i][2] + matrix.elements[13];
                let tz = matrix.elements[2] * points[i][0] + matrix.elements[6] * points[i][1] + matrix.elements[10] * points[i][2] + matrix.elements[14];
        
                if (tx < min.x)     min.x = tx;
                if (ty < min.y)     min.y = ty;
                if (tz < min.z)     min.z = tz;
        
                if (tx > max.x)     max.x = tx;
                if (ty > max.y)     max.y = ty;
                if (tz > max.z)     max.z = tz;
            }
        });
    }
}