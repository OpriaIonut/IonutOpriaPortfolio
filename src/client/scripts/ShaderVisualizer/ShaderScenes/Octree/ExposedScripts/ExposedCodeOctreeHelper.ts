export const exposedCodeOctreeHelper = `
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

    //Custom function to recompute the bounds of an object
    //Does what Three.js does with Box3.setFromObject() but faster
    //Modifies directly the bounds provided
    public static recomputeBoundsFast(bounds: Box3, obj: Object3D)
    {
        bounds.makeEmpty();
        
        let min = bounds.min;
        let max = bounds.max;
        
        //Go through the entire hierarchy of the object
        obj.traverse((child) => {
            if(!((child instanceof Mesh) || (child instanceof SkinnedMesh)))
                return;
        
            //Store a reference to it's mesh
            let mesh = child as THREE.Mesh;
            let matrix = mesh.matrixWorld;
        
            //If we don't have a bounding box computed for the geometry, compute it now (should be a one time process)
            if (!mesh.geometry.boundingBox)
                mesh.geometry.computeBoundingBox();
            let box = mesh.geometry.boundingBox!;
        
            let minX = box.min.x, minY = box.min.y, minZ = box.min.z;
            let maxX = box.max.x, maxY = box.max.y, maxZ = box.max.z;
        
            //Store a list of the 8 corners of the box. This will be multiplied with the modelMatrix of the geometry to generate points in space
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
        
            //Go through all 8 points on the cube that we want to create
            for (let i = 0; i < 8; i++)
            {
                //Compute the world location by multiplying with the matrix
                let tx = matrix.elements[0] * points[i][0] + matrix.elements[4] * points[i][1] + matrix.elements[8] * points[i][2] + matrix.elements[12];
                let ty = matrix.elements[1] * points[i][0] + matrix.elements[5] * points[i][1] + matrix.elements[9] * points[i][2] + matrix.elements[13];
                let tz = matrix.elements[2] * points[i][0] + matrix.elements[6] * points[i][1] + matrix.elements[10] * points[i][2] + matrix.elements[14];
        
                //Find global min & max from all points. This directly modifies the bounds parameter
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
`;