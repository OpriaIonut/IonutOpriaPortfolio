import { Material, Mesh, Object3D } from "three";

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
}