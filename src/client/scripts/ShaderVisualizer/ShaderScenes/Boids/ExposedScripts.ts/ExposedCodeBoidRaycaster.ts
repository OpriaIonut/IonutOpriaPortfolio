export const exposedCodeBoidRaycaster = `
import { Object3D, Raycaster, Vector3 } from "three";

//This script helps keep trach of obstacles in the scene that we want to raycast to
export class ObstacleRaycaster
{
    private raycaster: Raycaster;
    private obstacles: Object3D[] = [];

    constructor(obstacles: Object3D[])
    {
        this.raycaster = new Raycaster();
        this.obstacles = obstacles;
    }

    public addObstacle(obj: Object3D)
    {
        this.obstacles.push(obj);
    }

    public removeObstacle(obj: Object3D)
    {
        for(let index = 0; index < this.obstacles.length; ++index)
        {
            if(this.obstacles[index] == obj)
            {
                this.obstacles.splice(index, 1);
                index--;
            }
        }
    }

    public raycast(origin: Vector3, dir: Vector3, distance: number = 1000.0)
    {
        this.raycaster.set(origin, dir);
        this.raycaster.far = distance;
        return this.raycaster.intersectObjects(this.obstacles, true);
    }
}
`;