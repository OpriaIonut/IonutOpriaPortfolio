import { Box3, Material, Mesh, Object3D, SkinnedMesh } from "three";

export class ThreeHelpers
{
    public static disposeObject(obj: Object3D)
    {
        obj.traverse((item) => {
            if(item instanceof Mesh)
            {
                let mesh = item as Mesh;
                if(Object.prototype.toString.call(mesh.material) === '[object Object]')
                    (mesh.material as Material).dispose();
                else
                {
                    let material = mesh.material as Material[];
                    for(let index = 0; index < material.length; ++index)
                    {
                        material[index].dispose();
                    }
                }
                mesh.geometry.dispose();
            }
        });
    }

    public static random(min: number, max: number)
    {
        return min + Math.random() * (max - min);
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