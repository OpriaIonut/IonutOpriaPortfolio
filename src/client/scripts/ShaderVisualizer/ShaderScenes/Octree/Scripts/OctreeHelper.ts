import { Box3, Mesh, Object3D, SkinnedMesh, Vector3 } from "three";
import { OctreeObj } from "./OctreeObj";

//Utility class which contains various functions that help with complex calculation
export class OctreeHelper
{
    //Returns true if the point is inside the bounds
    public static containsPoint(bounds: Box3, point: Vector3): boolean
    {
        return bounds.containsPoint(point);
    }

    //Returns true if the small bounds is fully inside the large bunds
    public static containsBounds(largeBounds: Box3, smallBounds: Box3): boolean
    {
        let largeMin: Vector3 = largeBounds.min;
        let largeMax: Vector3 = largeBounds.max;

        let smallMin: Vector3 = smallBounds.min;
        let smallMax: Vector3 = smallBounds.max;

        return smallMin.x >= largeMin.x && smallMax.x <= largeMax.x &&
            smallMin.y >= largeMin.y && smallMax.y <= largeMax.y &&
            smallMin.z >= largeMin.z && smallMax.z <= largeMax.z;
    }

    //Goes through all of the object provided and creates a bounding box that encompases all of them
    //Can be used when initially creating the octree to have a bounds large enough, but if you have moving objects,
    //you should scale this by a factor (ex: 1.5) to make sure objects don't fly out of the octree
    public static calculateBoundsFromObjects(objects: Object3D[]): Box3
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

    //Goes through all of the object provided and creates a bounding box that encompases all of them
    //Can be used when initially creating the octree to have a bounds large enough, but if you have moving objects,
    //you should scale this by a factor (ex: 1.5) to make sure objects don't fly out of the octree
    public static calculateBoundsFromOctreeObjects(objects: OctreeObj[]): Box3
    {
        let isInit = false;
        let bounds = new Box3();
        if (objects == null || objects == undefined)
            return bounds;

        for (let index = 0; index < objects.length; ++index)
        {

            if (!isInit)
            {
                bounds.setFromObject(objects[index].getObject3D());
                isInit = true;
            }
            else
                bounds.expandByObject(objects[index].getObject3D());
        }
        return bounds;
    }
}