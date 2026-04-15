import { Box3, Object3D, Vector3 } from "three";
import { timeStats } from "../../../../../client";

export class Spaceship
{
    private _obj: Object3D;
    private _bounds: Box3;
    private _speed: number;
    private _steeringSpeed: number;

    private _velocity: Vector3;
    private _targetPos: Vector3;
    private _targetDir: Vector3;
    private _forward: Vector3 = new Vector3(0, 0, 1);

    private _aux: Vector3 = new Vector3();

    private _targetChangeCooldown: number = 5.0;
    private _lastTargetPickTime: number = 0.0;

    constructor(obj: Object3D, bounds: Box3, speed: number, steeringSpeed: number)
    {
        this._obj = obj;
        this._bounds = bounds;
        this._speed = speed;
        this._steeringSpeed = steeringSpeed;

        this._velocity = new Vector3(Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0).normalize();
        this._targetPos = new Vector3(
            this._bounds.min.x + (Math.random() * 0.8 + 0.1) * (this._bounds.max.x - this._bounds.min.x),
            this._bounds.min.y + (Math.random() * 0.8 + 0.1) * (this._bounds.max.y - this._bounds.min.y),
            this._bounds.min.z + (Math.random() * 0.8 + 0.1) * (this._bounds.max.z - this._bounds.min.z)
        );
        this._targetDir = new Vector3().copy(this._targetPos).sub(this._obj.position).normalize();
        this._lastTargetPickTime = timeStats.currentTime;
    }

    public update()
    {
        if(timeStats.currentTime - this._lastTargetPickTime > this._targetChangeCooldown || this._obj.position.distanceToSquared(this._targetPos) < 2.0)
        {
            this._targetPos = new Vector3(
                this._bounds.min.x + (Math.random() * 0.8 + 0.1) * (this._bounds.max.x - this._bounds.min.x),
                this._bounds.min.y + (Math.random() * 0.8 + 0.1) * (this._bounds.max.y - this._bounds.min.y),
                this._bounds.min.z + (Math.random() * 0.8 + 0.1) * (this._bounds.max.z - this._bounds.min.z)
            );
            this._lastTargetPickTime = timeStats.currentTime;

        }

        this._targetDir.copy(this._targetPos).sub(this._obj.position).normalize();
        this._velocity.lerp(this._targetDir, this._steeringSpeed * timeStats.deltaTime);

        this._aux.copy(this._obj.position).add(this._velocity);
        this._obj.lookAt(this._aux);
        this._obj.translateOnAxis(this._forward, this._speed * timeStats.deltaTime);
    }
}