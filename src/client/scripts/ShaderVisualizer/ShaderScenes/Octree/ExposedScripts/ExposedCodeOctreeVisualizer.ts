export const exposedCodeOctreeVisualizer = `
import { Box3, Box3Helper, Color, LineBasicMaterial, Scene } from "three";
import { GenericPool } from "../../../../Helper/GenericPool";

//Utility script which can be used to draw boxes on the screen. It also contains an ObjectPool for best performance
export class OctreeVisualizer
{
    private firstFreeId = 0;                        //Will increase whenever cubes get reserved and will be set to 0 when all of them are released
    private objPool: GenericPool<Box3Helper>;       //ObjectPool to reduce allocations required
    private activeCubes: Map<number, Box3Helper>;   //Cubes that are currently reserved
    private scene: Scene;                           //Scene in which we will add our debug data
    private defaultBox: Box3 = new Box3();          //Utility box that is used only for allocations

    constructor(scene: Scene)
    {
        this.scene = scene;
        this.objPool = new GenericPool<Box3Helper>(0, () => { return this.spawnCube(this.defaultBox); });
        this.activeCubes = new Map();
    }

    //Grab a cube from the object pool and reserve it's id for further operations
    public reserveCube(box: Box3, color: Color)
    {
        let cube = this.objPool.reserve();
        cube.box = box;
        let mat = cube.material as LineBasicMaterial;
        mat.color = color;
        
        let id = this.firstFreeId++;
        this.scene.add(cube);
        this.activeCubes.set(id, cube);
        return id;
    }

    //Release a cube based on it's id
    public releaseCube(id: number)
    {
        let cube = this.getActiveCube(id);
        if(cube == undefined)
            return false;

        this.scene.remove(cube);
        this.objPool.release(cube);
        this.activeCubes.delete(id);

        if(this.objPool.getPoolSize() == 0)
            this.firstFreeId = 0;

        return true;
    }

    //Update the bounding box of the cube
    public updateBounds(id: number, box: Box3)
    {
        let cube = this.getActiveCube(id);
        if(cube == undefined)
            return false;
        cube.box = box;
        return true;
    }

    //Can be used to turn on/off the cube without discarding any data
    public setCubeVisible(id: number, visible: boolean)
    {
        let cube = this.getActiveCube(id);
        if(cube == undefined)
            return false;

        cube.visible = visible;
    }

    //Clear everything out
    public releaseAllCubes()
    {
        for (let [key, cube] of this.activeCubes)
        {
            this.scene.remove(cube);
            this.objPool.release(cube);
            cube.dispose();
        }

        this.activeCubes.clear();
        this.firstFreeId = 0;
    }

    //Can be used to grab a reference to a cube internally
    private getActiveCube(id: number)
    {
        if(this.activeCubes.has(id) == false)
            return undefined;
        let cube = this.activeCubes.get(id);
        return cube;
    }

    //Utility function called by the ObjectPool whenever new allocations need to be made.
    private spawnCube(box: Box3): Box3Helper
    {
        let mesh = new Box3Helper(box);
        return mesh;
    }
}
`;