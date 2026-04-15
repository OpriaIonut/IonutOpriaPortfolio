import { Box3, Box3Helper, Color, LineBasicMaterial, Scene } from "three";
import { GenericPool } from "../../../../Helper/GenericPool";

export class OctreeVisualizer
{
    private firstFreeId = 0;
    private objPool: GenericPool<Box3Helper>;
    private activeCubes: Map<number, Box3Helper>;
    private scene: Scene;
    private defaultBox: Box3 = new Box3();

    constructor(scene: Scene)
    {
        this.scene = scene;
        this.objPool = new GenericPool<Box3Helper>(0, () => { return this.spawnCube(this.defaultBox); });
        this.activeCubes = new Map();
    }

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

    public releaseCube(id: number)
    {
        let cube = this.getActiveCube(id);
        if(cube == undefined)
            return false;

        this.scene.remove(cube);
        this.objPool.release(cube);
        this.activeCubes.delete(id);

        cube.dispose();

        if(this.objPool.getPoolSize() == 0)
            this.firstFreeId = 0;

        return true;
    }

    public updateBounds(id: number, box: Box3)
    {
        let cube = this.getActiveCube(id);
        if(cube == undefined)
            return false;
        cube.box = box;
        return true;
    }

    public setCubeVisible(id: number, visible: boolean)
    {
        let cube = this.getActiveCube(id);
        if(cube == undefined)
            return false;

        cube.visible = visible;
    }

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

    private getActiveCube(id: number)
    {
        if(this.activeCubes.has(id) == false)
            return undefined;
        let cube = this.activeCubes.get(id);
        return cube;
    }

    private spawnCube(box: Box3): Box3Helper
    {
        let mesh = new Box3Helper(box);
        return mesh;
    }
}