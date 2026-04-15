export const exposedCodeSpaceship = `
import { Box3, Object3D, Vector3 } from "three";
import { timeStats } from "../../../../../client";

//Entity script used in OctreeSpaceshipDemo.ts
//This class is used to move spaceships on the screen with a very simple steering behavior
export class Spaceship
{
    private obj: Object3D;
    private bounds: Box3;
    private movementSpeed: number;
    private steeringSpeed: number;

    private velocity: Vector3; //The current direction that we are facing. This vector will interpolate towards targetDir
    private targetPos: Vector3; //Target destination that we need to move towards. If we reach it, we will pick a new location
    private targetDir: Vector3; //Direction towards the targetPos
    private forward: Vector3 = new Vector3(0, 0, 1);

    private aux: Vector3 = new Vector3(); //Helper vec3 to reduce allocations

    private targetChangeCooldown: number = 5.0; //How long to wait in-between targets
    private lastTargetPickTime: number = 0.0;

    constructor(obj: Object3D, bounds: Box3, speed: number, steeringSpeed: number)
    {
        this.obj = obj;
        this.bounds = bounds;
        this.movementSpeed = speed;
        this.steeringSpeed = steeringSpeed;

        //Initialize the variables by picking random directions
        this.velocity = new Vector3(Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0).normalize();
        this.targetPos = new Vector3(
            this.bounds.min.x + (Math.random() * 0.8 + 0.1) * (this.bounds.max.x - this.bounds.min.x),
            this.bounds.min.y + (Math.random() * 0.8 + 0.1) * (this.bounds.max.y - this.bounds.min.y),
            this.bounds.min.z + (Math.random() * 0.8 + 0.1) * (this.bounds.max.z - this.bounds.min.z)
        );
        this.targetDir = new Vector3().copy(this.targetPos).sub(this.obj.position).normalize();
        this.lastTargetPickTime = timeStats.currentTime;
    }

    public update()
    {
        //If too much time passed since we picked a target or if we reached our current target, pick a new location to move towards
        if(timeStats.currentTime - this.lastTargetPickTime > this.targetChangeCooldown || this.obj.position.distanceToSquared(this.targetPos) < 2.0)
        {
            this.targetPos = new Vector3(
                this.bounds.min.x + (Math.random() * 0.8 + 0.1) * (this.bounds.max.x - this.bounds.min.x),
                this.bounds.min.y + (Math.random() * 0.8 + 0.1) * (this.bounds.max.y - this.bounds.min.y),
                this.bounds.min.z + (Math.random() * 0.8 + 0.1) * (this.bounds.max.z - this.bounds.min.z)
            );
            this.lastTargetPickTime = timeStats.currentTime;
        }

        //Steer the velocity towards our target location
        this.targetDir.copy(this.targetPos).sub(this.obj.position).normalize();
        this.velocity.lerp(this.targetDir, this.steeringSpeed * timeStats.deltaTime);

        //Move & rotate object to face velocity
        this.aux.copy(this.obj.position).add(this.velocity);
        this.obj.lookAt(this.aux);
        this.obj.translateOnAxis(this.forward, this.movementSpeed * timeStats.deltaTime);
    }
}
`;