import { Box3, Object3D, Vector3 } from "three";
import { timeStats } from "../../../../../client";

export class Spaceship
{
    private obj: Object3D;
    private bounds: Box3;
    private speed: number;
    private steeringSpeed: number;

    private velocity: Vector3;
    private targetPos: Vector3;
    private targetDir: Vector3;
    private forward: Vector3 = new Vector3(0, 0, 1);

    private aux: Vector3 = new Vector3();

    private targetChangeCooldown: number = 5.0;
    private lastTargetPickTime: number = 0.0;

    constructor(obj: Object3D, bounds: Box3, speed: number, steeringSpeed: number)
    {
        this.obj = obj;
        this.bounds = bounds;
        this.speed = speed;
        this.steeringSpeed = steeringSpeed;

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
        if(timeStats.currentTime - this.lastTargetPickTime > this.targetChangeCooldown || this.obj.position.distanceToSquared(this.targetPos) < 2.0)
        {
            this.targetPos = new Vector3(
                this.bounds.min.x + (Math.random() * 0.8 + 0.1) * (this.bounds.max.x - this.bounds.min.x),
                this.bounds.min.y + (Math.random() * 0.8 + 0.1) * (this.bounds.max.y - this.bounds.min.y),
                this.bounds.min.z + (Math.random() * 0.8 + 0.1) * (this.bounds.max.z - this.bounds.min.z)
            );
            this.lastTargetPickTime = timeStats.currentTime;

        }

        this.targetDir.copy(this.targetPos).sub(this.obj.position).normalize();
        this.velocity.lerp(this.targetDir, this.steeringSpeed * timeStats.deltaTime);

        this.aux.copy(this.obj.position).add(this.velocity);
        this.obj.lookAt(this.aux);
        this.obj.translateOnAxis(this.forward, this.speed * timeStats.deltaTime);
    }
}