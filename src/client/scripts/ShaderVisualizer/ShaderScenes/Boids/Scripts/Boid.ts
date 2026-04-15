import { Box3, MathUtils, Object3D, Quaternion, Vector2, Vector3 } from "three";
import { BoidSettings } from "./BoidSettings";
import { ThreeHelpers } from "../../../../Helper/ThreeHelpers";
import { timeStats } from "../../../../../client";
import { ObstacleRaycaster } from "./BoidRaycaster";
import { GenericPool } from "../../../../Helper/GenericPool";

export class Boid
{
    private obj: Object3D;
    private settings: BoidSettings;
    private raycaster: ObstacleRaycaster;
    private vec3Pool: GenericPool<Vector3>;

    private rayShootCooldown: Vector2 = new Vector2(0.15, 0.25); //Range to not make all boids shoot at the same time

    private drawDebugData: boolean = false;
    // private MeshRenderer _rend;
    // private _baseColor: Color;
    // private _debugColor: Color;

    private nextRayShootTime: number = 0.0;
    private limitBounds: Box3 = new Box3();
    private limitBoundsCenter: Vector3 = new Vector3();
    private velocity: Vector3 = new Vector3(0, 0, 1);
    private acceleration: Vector3 = new Vector3();
    private sphereRays: Vector3[] = []; //Directions in which we can shoot to detect if we are about to collide with objects

    private cosViewAngle: number = 0.0;

    private aux1: Vector3 = new Vector3();
    private aux2: Vector3 = new Vector3();
    private aux3: Vector3 = new Vector3();
    private quaternion: Quaternion = new Quaternion();

    public getObject3D() { return this.obj; }

    constructor(obj: Object3D, limitBounds: Box3, raycaster: ObstacleRaycaster, settings: BoidSettings, vec3Pool: GenericPool<Vector3>)
    {
        this.obj = obj;
        this.settings = settings;
        this.raycaster = raycaster;
        this.vec3Pool = vec3Pool;

        this.limitBounds = limitBounds;
        this.limitBounds.getCenter(this.limitBoundsCenter);

        this.PrecomputeViewRays();
        this.GetRandomVelocity();
        // _rend.material.color = this._baseColor;

        this.cosViewAngle = Math.cos(this.settings.viewAngle);

        obj.position.set(
            ThreeHelpers.random(this.limitBounds.min.x, this.limitBounds.max.x),
            ThreeHelpers.random(this.limitBounds.min.y, this.limitBounds.max.y),
            ThreeHelpers.random(this.limitBounds.min.z, this.limitBounds.max.z)
        );
        this.aux1.copy(obj.position).add(this.velocity);
        obj.lookAt(this.aux1);
    }

    public Destroy()
    {
        for(let index = 0; index < this.sphereRays.length; ++index)
        {
            this.vec3Pool.release(this.sphereRays[index]);
        }
    }

    public GetVelocity(): Vector3 { return this.velocity; }

    public UpdateBoid(nearbyBoids: Boid[])
    {
        if (timeStats.currentTime > this.nextRayShootTime)
        {
            this.DetectClearPath();
            this.nextRayShootTime = timeStats.currentTime + ThreeHelpers.random(this.rayShootCooldown.x, this.rayShootCooldown.y);
        }

        this.UpdateMoveDir(nearbyBoids);
        this.Move();
    }

    public GetViewBounds(): Box3
    {
        let radius: number = this.settings.viewRadius;
        let angle: number = this.settings.viewAngle;
        
        let coneRadius: number = radius * Math.sin(angle);
        let boundsExtends: Vector3 = this.aux3.set(radius + coneRadius, radius + coneRadius, radius + coneRadius);

        this.aux2.copy(this.velocity).normalize();
        let center: Vector3 = this.aux1.copy(this.obj.position).addScaledVector(this.aux2, radius * 0.5); //Center of the bounds

        let min = center.clone().sub(boundsExtends);
        let max = center.clone().add(boundsExtends);

        return new Box3(min, max); //To do: see if you can pass a temporary box rather than allocate every frame
    }

    public DrawDebugData(value: boolean)
    {
        this.drawDebugData = value;
        // _rend.material.color = value ? this._debugColor : this._baseColor;
    }

    private UpdateMoveDir(nearbyBoids: Boid[])
    {
        if (this.IsAboutToHitBounds())
        {
            let boundsSteerForce: Vector3 = this.GetBoundsSteerForce();
            this.acceleration.addScaledVector(boundsSteerForce, this.settings.boundsSteerFactor);
        }

        let boidsFound: number = 0;
        let separationForce: Vector3 = this.vec3Pool.reserve().set(0.0, 0.0, 0.0);
        let alignmentForce: Vector3 = this.vec3Pool.reserve().set(0.0, 0.0, 0.0);
        let cohesionForce: Vector3 = this.vec3Pool.reserve().set(0.0, 0.0, 0.0);

        for (let index = 0; index < nearbyBoids.length; ++index)
        {
            let neighbour: Boid = nearbyBoids[index];
            if (neighbour != this && this.IsPointInConeView(neighbour.obj.position))
            {
                boidsFound++;
                separationForce.add(this.Separation(neighbour));
                alignmentForce.add(neighbour.GetVelocity());
                cohesionForce.add(neighbour.obj.position);
            }
        }
        if (boidsFound > 0)
        {
            cohesionForce.divideScalar(boidsFound).sub(this.obj.position);

            this.SteerTowards(alignmentForce).multiplyScalar(this.settings.alignmentFactor);
            this.SteerTowards(separationForce).multiplyScalar(this.settings.separationFactor)
            this.SteerTowards(cohesionForce).multiplyScalar(this.settings.cohesionFactor);

            this.acceleration.add(alignmentForce);
            this.acceleration.add(separationForce);
            this.acceleration.add(cohesionForce);
        }

        this.vec3Pool.release(separationForce);
        this.vec3Pool.release(alignmentForce);
        this.vec3Pool.release(cohesionForce);
    }

    private Move()
    {
        this.velocity.addScaledVector(this.acceleration, timeStats.deltaTime);
        let speed: number = this.velocity.length();
        if (speed > 0.001)
        {
            if (speed > this.settings.maxSpeed)
                this.velocity.multiplyScalar(this.settings.maxSpeed / speed);
            else if (speed < this.settings.minSpeed)
                this.velocity.multiplyScalar(this.settings.minSpeed / speed);
        }
        this.acceleration.set(0.0, 0.0, 0.0);

        this.obj.position.addScaledVector(this.velocity, timeStats.deltaTime);
        this.aux1.copy(this.obj.position).add(this.velocity);
        this.obj.lookAt(this.aux1);
    }

    private GetRandomVelocity()
    {
        this.velocity.set(ThreeHelpers.random(-1.0, 1.0), ThreeHelpers.random(-1.0, 1.0), ThreeHelpers.random(-1.0, 1.0)).normalize();
        let length = MathUtils.clamp(this.velocity.length(), this.settings.minSpeed, this.settings.maxForce);
        this.velocity.normalize().multiplyScalar(length);
    }

    private GetBoundsSteerForce(): Vector3
    {
        let steerForce: Vector3 = this.aux3.copy(this.limitBoundsCenter).sub(this.obj.position);
        steerForce.normalize().multiplyScalar(this.settings.maxSpeed).sub(this.velocity);
        steerForce.clampLength(0, this.settings.maxForce);
        return steerForce;
    }

    private Separation(boid: Boid): Vector3
    {
        this.aux1.copy(this.obj.position).sub(boid.obj.position);
        let dist = this.aux1.lengthSq();
        if (dist > 0.0 && dist <= this.settings.separationRadius * this.settings.separationRadius)
            return this.aux1.normalize(); //This makes closer boids have more influence
        return this.aux1.set(0, 0, 0);
    }

    private SteerTowards(dir: Vector3): Vector3
    {
        dir.normalize().multiplyScalar(this.settings.maxSpeed).sub(this.velocity);
        dir.clampLength(0, this.settings.maxForce);
        return dir;
    }

    private IsAboutToHitBounds(): boolean
    {
        this.aux1.copy(this.obj.position).addScaledVector(this.velocity, this.settings.boundsDetectDist);
        return !this.limitBounds.containsPoint(this.aux1);
    }

    private IsPointInConeView(point: Vector3): boolean
    {
        this.aux1.copy(point).sub(this.obj.position);
        if (this.aux1.lengthSq() > this.settings.viewRadius * this.settings.viewRadius)
            return false;
        this.aux1.normalize();
        return this.velocity.dot(this.aux1) >= this.cosViewAngle;
    }

    private DetectClearPath()
    {
        this.aux1.set(0, 0, 1);
        this.aux2.copy(this.velocity).normalize();
        let rot: Quaternion = this.quaternion.setFromUnitVectors(this.aux1, this.aux2);
        for (let index = 0; index < this.sphereRays.length; ++index)
        {
            let rayDir = this.aux3.copy(this.sphereRays[index]).applyQuaternion(rot); //Rotate the precomputed rays
            let hitResults = this.raycaster.raycast(this.obj.position, rayDir);
            if (hitResults.length > 0)
            {
                if (index == 0) //Index 0 is the same direction as our this._velocity so we can just skip it if it is a clear path (just wanted to check if it is an obstacle or not)
                    return;

                //If we have a clear path, steer velocity towards this direction
                let avoidDir: Vector3 = rayDir.normalize().multiplyScalar(this.settings.maxSpeed).sub(this.velocity);
                avoidDir.clampLength(0, this.settings.maxForce);
                this.velocity.addScaledVector(avoidDir, this.settings.collisionAvoidFactor);
                return;
            }
        }
    }

    // public DrawViewCone(color: Color)
    // {
    //     this._aux1.set(0, 0, 1);
    //     this._aux2.copy(this._velocity).normalize();
    //     let rot: Quaternion = this._quaternion.setFromUnitVectors(this._aux1, this._aux2);
    //     for (let index = 0; index < this._sphereRays.length; ++index)
    //     {
    //         let worldRay: Vector3 = this._aux3.copy(this._sphereRays[index]).applyQuaternion(rot); //Rotate the precomputed rays
    //         // Debug.DrawLine(this._obj.position, this._obj.position + worldRay * this._settings.viewRadius, color);
    //     }
    // }

    private PrecomputeViewRays()
    {
        for(let index = 0; index < this.sphereRays.length; ++index)
        {
            this.vec3Pool.release(this.sphereRays[index]);
        }
        this.sphereRays = [];
        for (let angle = 0.0; angle <= this.settings.viewAngle; angle += this.settings.viewRadiusSegmentSize)
        {
            angle = Math.min(angle, this.settings.viewAngle);

            if (this.settings.viewRadius <= 0 || this.settings.viewRadiusSegmentSize <= 0)
                return;

            let vel: Vector3 = this.vec3Pool.reserve().copy(this.velocity).normalize();

            if (angle <= 0)
            {
                this.sphereRays.push(vel);
                continue;
            }

            // Build orthonormal basis around view direction
            let up: Vector3 = this.aux3.set(0, 1, 0);
            if(Math.abs(vel.y) >= 0.999)
                up.set(1, 0, 0);

            let right: Vector3 = this.aux1.copy(vel).cross(up).normalize();
            let forwardUp: Vector3 = this.aux2.copy(right).cross(vel).normalize();

            let sinTheta: number = Math.sin(angle);
            let cosTheta: number = Math.cos(angle);
            let azimuthStep: number = this.settings.viewRadiusSegmentSize * 1.5 / Math.max(sinTheta, 0.0001);

            for (let phi = 0; phi < 2 * Math.PI; phi += azimuthStep)
            {
                let cosPhi = Math.cos(phi);
                let sinPhi = Math.sin(phi);

                // Spherical to cartesian in local cone space
                let localDir: Vector3 = vel.multiplyScalar(cosTheta).addScaledVector(right, sinTheta * cosPhi).addScaledVector(forwardUp, sinTheta * sinPhi);
                this.sphereRays.push(localDir.normalize());
            }
        }
    }
}