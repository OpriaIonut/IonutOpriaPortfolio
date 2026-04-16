export const exposedCodeBoid = `
import { AnimationClip, AnimationMixer, Box3, MathUtils, Object3D, Quaternion, Vector2, Vector3 } from "three";
import { BoidSettings } from "./BoidSettings";
import { ThreeHelpers } from "../../../../Helper/ThreeHelpers";
import { timeStats } from "../../../../../client";
import { ObstacleRaycaster } from "./BoidRaycaster";
import { GenericPool } from "../../../../Helper/GenericPool";

//This class represents a flying agent that tries to simulate boid-like movement patterns by following the following principles:
//      - a boid has a view radius and uses it to detect other boids that are closeby
//      - separation: if a boid gets too close to another, we will pull them apart to not collide
//      - alignment: a boid will try to move in the same overall direction as it's neighbours
//      - cohesion: a boid will try to move towards the center of mass of closeby boids (this generates interesting movement patterns)
//      - fixed bounds to force boids to stay in the same overall area (they can exit the bounds slightly but will be pulled back)
//      - collision detection to not collide with obstacles in the scene
//      - pull targets: boids that are close to pull targets will try to move towards them if they in their view direction (won't try to go to them if they are behind,
//      otherwise it would generate spheres of boids that revolve around these pull targets)
export class Boid
{
    private obj: Object3D;                  //Main graphics of this boid
    private settings: BoidSettings;         //Settings that control how the boid behaves
    private raycaster: ObstacleRaycaster;   //Utility script to keep track of obstacles in the scene and to raycast to them
    private vec3Pool: GenericPool<Vector3>; //Object pool to reduce allocations of Vector3 for math calculations
    private animMixer?: AnimationMixer;     //If the object is not animated, this will be undefined

    //Boids will shoot rays once every couple of seconds to check if there are obstacles in front of them
    //This variable controls how often this will be checked, and it is a range to not make all boids shoot rays at the same time (would be too expensive to raycast lots of boids in a single frame)
    private rayShootCooldown: Vector2 = new Vector2(0.15, 0.25);
    private nextRayShootTime: number = 0.0;

    //Bounds that the boids will try to avoid exiting
    private limitBounds: Box3 = new Box3();
    private limitBoundsCenter: Vector3 = new Vector3();
    
    private velocity: Vector3 = new Vector3(0, 0, 1);   //Direction in which the boid tries to move
    private acceleration: Vector3 = new Vector3();      //Stores all of the forces applied to a boid added together and is used to update velocity
    private sphereRays: Vector3[] = [];                 //Directions in which we can shoot to detect if we are about to collide with objects. This needs to be converted to world-space every time you shoot them

    //Variables that control pull target behavior
    private usePullTarget: boolean = false;
    private pullTargetRadius: number = 6.0;
    private pullTargetPosition: Vector3 = new Vector3();

    private cosViewAngle: number = 0.0; //Pre-computed cosine to reduce math calculations

    //Utility variables that are used to reduce allocations
    private aux1: Vector3 = new Vector3();
    private aux2: Vector3 = new Vector3();
    private aux3: Vector3 = new Vector3();
    private quaternion: Quaternion = new Quaternion();

    constructor(obj: Object3D, anim: AnimationClip | undefined, animSpeed: number, limitBounds: Box3, raycaster: ObstacleRaycaster, settings: BoidSettings, vec3Pool: GenericPool<Vector3>)
    {
        this.obj = obj;
        this.settings = settings;
        this.raycaster = raycaster;
        this.vec3Pool = vec3Pool;

        //If we have animations available, initialize the mixer
        if(anim != undefined)
        {
            this.animMixer = new AnimationMixer(obj);
            this.animMixer.clipAction(anim).play();
            this.animMixer.timeScale = animSpeed;
        }

        this.limitBounds = limitBounds;
        this.limitBounds.getCenter(this.limitBoundsCenter);

        this.precomputeViewRays();  //Generate rays which will be used for collision detection
        this.getRandomVelocity();   //Pick a random direction to move towards

        //Pre-compute cosine of view angle to not have to do it every frame
        this.cosViewAngle = Math.cos(this.settings.viewAngle);

        //Look towards the view direction
        this.aux1.copy(obj.position).add(this.velocity);
        obj.lookAt(this.aux1);
    }

    //Call to deallocate all boid-relevant data
    public destroy()
    {
        for(let index = 0; index < this.sphereRays.length; ++index)
        {
            this.vec3Pool.release(this.sphereRays[index]);
        }
    }

    public getVelocity(): Vector3 { return this.velocity; }
    public getObject3D() { return this.obj; }

    //Should be called every frame to update the behavior
    public updateBoid(nearbyBoids: Boid[])
    {
        //If it's time to check for collisions, shoot rays and find a direction that makes us not collide with anything
        if (timeStats.currentTime > this.nextRayShootTime)
        {
            this.detectClearPath();

            //Random to not cause all boids to shoot rays at the same time as that would be too expensive
            this.nextRayShootTime = timeStats.currentTime + ThreeHelpers.random(this.rayShootCooldown.x, this.rayShootCooldown.y);
        }

        this.updateMoveDir(nearbyBoids);    //Apply all of the boid rules and find out what our acceleration should be
        this.move();                        //Update the velocity and move in the desired direction
    }

    //Separate function to animate the boids (if it has animations). It's separate certain meshes are complex and animating them is very expensive (thus we can control their animation better)
    public animate()
    {
        this.animMixer?.update(timeStats.deltaTime);
    }

    //Boids will get pulled towards this pull target if they are in radius
    public setPullTarget(pos: Vector3, radius: number)
    {
        this.usePullTarget = true;
        this.pullTargetPosition.copy(pos);
        this.pullTargetRadius = radius;
    }

    //Stop moving boids towards the pull target
    public clearPullTarget()
    {
        this.usePullTarget = false;
    }

    //This is the heart of the boid behavior. It applies all of the boid rules and find out what direction it should move towards
    private updateMoveDir(nearbyBoids: Boid[])
    {
        //First of all, check if we are about to go out of bounds, and prenet it if so
        if (this.isAboutToHitBounds())
        {
            let boundsSteerForce: Vector3 = this.getBoundsSteerForce();
            this.acceleration.addScaledVector(boundsSteerForce, this.settings.boundsSteerFactor);
        }

        let boidsFoundInConeView: number = 0;
        let boidsFoundInRadius: number = 0;

        let separationForce: Vector3 = this.vec3Pool.reserve().set(0.0, 0.0, 0.0);
        let alignmentForce: Vector3 = this.vec3Pool.reserve().set(0.0, 0.0, 0.0);
        let cohesionForce: Vector3 = this.vec3Pool.reserve().set(0.0, 0.0, 0.0);

        //Go through all boids in our vecinity
        for (let index = 0; index < nearbyBoids.length; ++index)
        {
            let neighbour: Boid = nearbyBoids[index];
            if(neighbour != this)
            {
                //For cohesion we do a simple radius check to be able to detect boids both in front and behind us
                //For every boid in this radius add them to our force (will later average it to get overall center)
                if (this.isPointInDetectionRadius(neighbour.obj.position))
                {
                    boidsFoundInRadius++;
                    cohesionForce.add(neighbour.obj.position);
                }
                //For separation & alignment we only count the boids in our view
                if (this.isPointInConeView(neighbour.obj.position))
                {
                    boidsFoundInConeView++;
                    separationForce.add(this.separation(neighbour));    //Separation will pull away from the neighbour
                    alignmentForce.add(neighbour.getVelocity());        //Alignemnt will make them move in the same overall direction
                }
            }
        }
        //If we found neighbours, update the acceleration based on the directions
        if (boidsFoundInConeView > 0)
        {
            alignmentForce.divideScalar(boidsFoundInConeView);

            this.normalizeDirection(separationForce).multiplyScalar(this.settings.separationFactor);
            this.normalizeDirection(alignmentForce).multiplyScalar(this.settings.alignmentFactor);

            this.acceleration.add(separationForce);
            this.acceleration.add(alignmentForce);
        }
        if(boidsFoundInRadius)
        {
            cohesionForce.divideScalar(boidsFoundInRadius).sub(this.obj.position);
            this.normalizeDirection(cohesionForce).multiplyScalar(this.settings.cohesionFactor);
            this.acceleration.add(cohesionForce);
        }

        //If we have a valid pull target, also take into account it's force (if we are close enough to it and it is in front of us)
        if(this.usePullTarget)
        {
            let pullDir: Vector3 = this.vec3Pool.reserve();
            pullDir.copy(this.pullTargetPosition).sub(this.obj.position);

            //Are we in the pull target radius?
            if(pullDir.lengthSq() <= this.pullTargetRadius * this.pullTargetRadius)
            {
                pullDir.normalize();
                this.aux1.copy(this.velocity).normalize();

                //Is the pull target in front of us?
                if(pullDir.dot(this.aux1) >= this.cosViewAngle)
                {
                    this.normalizeDirection(pullDir).multiplyScalar(this.settings.pullTargetFactor);
                    this.acceleration.add(pullDir);
                    this.vec3Pool.release(pullDir);
                }
            }
        }

        //Release allocated resources for this function
        this.vec3Pool.release(separationForce);
        this.vec3Pool.release(alignmentForce);
        this.vec3Pool.release(cohesionForce);
    }

    //Update velocity based on acceleration and move the object
    private move()
    {
        this.acceleration.clampLength(0, this.settings.maxForce);
        this.velocity.addScaledVector(this.acceleration, timeStats.deltaTime);

        //Make sure we don't go over the speed limit
        let speed: number = this.velocity.length();
        if (speed > 0.001)
        {
            if (speed > this.settings.maxSpeed)
                this.velocity.multiplyScalar(this.settings.maxSpeed / speed);
            else if (speed < this.settings.minSpeed)
                this.velocity.multiplyScalar(this.settings.minSpeed / speed);
        }
        this.acceleration.set(0.0, 0.0, 0.0);

        //Move the object
        this.obj.position.addScaledVector(this.velocity, timeStats.deltaTime);
        this.aux1.copy(this.obj.position).add(this.velocity);
        this.obj.lookAt(this.aux1);
    }

    private getRandomVelocity()
    {
        this.velocity.set(ThreeHelpers.random(-1.0, 1.0), ThreeHelpers.random(-1.0, 1.0), ThreeHelpers.random(-1.0, 1.0)).normalize();
        let length = MathUtils.clamp(this.velocity.length(), this.settings.minSpeed, this.settings.maxSpeed);
        this.velocity.normalize().multiplyScalar(length);
    }

    //Calculates a force that makes us not exit the bounds
    private getBoundsSteerForce(): Vector3
    {
        let steerForce: Vector3 = this.aux3.copy(this.limitBoundsCenter).sub(this.obj.position);
        steerForce.normalize().multiplyScalar(this.settings.maxSpeed).sub(this.velocity);
        steerForce.clampLength(0, this.settings.maxForce);
        return steerForce;
    }

    //Calculate a force that makes us avoid collision with this boid
    private separation(boid: Boid): Vector3
    {
        this.aux1.copy(this.obj.position).sub(boid.obj.position);
        let dist = this.aux1.lengthSq();
        if (dist > 0.0 && dist <= this.settings.separationRadius * this.settings.separationRadius)
            return this.aux1.normalize().divideScalar(dist); //This makes closer boids have more influence
        return this.aux1.set(0, 0, 0);
    }

    //Makes sure the direction doesn't go over our speed limits
    private normalizeDirection(dir: Vector3): Vector3
    {
        dir.normalize().multiplyScalar(this.settings.maxSpeed).sub(this.velocity);
        dir.clampLength(0, this.settings.maxForce);
        return dir;
    }

    //Checks if we are about to go out of bounds
    private isAboutToHitBounds(): boolean
    {
        this.aux1.copy(this.obj.position).addScaledVector(this.velocity, this.settings.boundsDetectDist);
        return !this.limitBounds.containsPoint(this.aux1);
    }

    //Is point in our proximity? (doesn't take into consideration the cone view, just a spherical check)
    private isPointInDetectionRadius(point: Vector3): boolean
    {
        this.aux1.copy(point).sub(this.obj.position);
        if (this.aux1.lengthSq() > this.settings.viewRadius * this.settings.viewRadius)
            return false;
        return true;
    }

    //Is point in our cone view?
    private isPointInConeView(point: Vector3): boolean
    {
        this.aux1.copy(point).sub(this.obj.position);
        if (this.aux1.lengthSq() > this.settings.viewRadius * this.settings.viewRadius)
            return false;
        this.aux1.normalize();
        return this.velocity.dot(this.aux1) >= this.cosViewAngle;
    }

    //Shoot rays to detect if have a clear path, and if not, keep shooting them until you find a proper path
    private detectClearPath()
    {
        //Find out the rotation of our object based on velocty
        this.aux1.set(0, 0, 1);
        this.aux2.copy(this.velocity).normalize();
        let rot: Quaternion = this.quaternion.setFromUnitVectors(this.aux1, this.aux2);

        for (let index = 0; index < this.sphereRays.length; ++index)
        {
            //Rotate the pre-computed rays based on our rotation
            let rayDir = this.aux3.copy(this.sphereRays[index]).applyQuaternion(rot);
            this.aux1.copy(this.obj.position).addScaledVector(rayDir, this.settings.viewRadius * 0.75);

            //Early out in case we would end up outside the bounds if we pick this ray
            if(!this.limitBounds.containsPoint(this.aux1))
                continue;

            //Shoot the ray agains obstacles. If we don't get any results for the raycast, it means we have a clear path
            let hitResults = this.raycaster.raycast(this.obj.position, rayDir);
            if (hitResults.length == 0)
            {
                //Index 0 is the same direction as our this._velocity so we can just skip it if it is a clear path (just wanted to check if it is an obstacle or not)
                if (index == 0)
                    return;

                //If we have a clear path, steer velocity towards this direction
                let avoidDir: Vector3 = rayDir.normalize().multiplyScalar(this.settings.maxSpeed).sub(this.velocity);
                avoidDir.clampLength(0, this.settings.maxForce);
                this.velocity.addScaledVector(avoidDir, this.settings.collisionAvoidFactor).normalize();
                return;
            }
        }

        //If we didn't find any valid direction, move towards scene origin
        this.aux1.copy(this.limitBoundsCenter).sub(this.obj.position).normalize();
        this.aux1.multiplyScalar(this.settings.maxSpeed).sub(this.velocity);
        this.aux1.clampLength(0, this.settings.maxForce);
        this.velocity.addScaledVector(this.aux1, this.settings.collisionAvoidFactor).normalize();
    }

    //Called a single time when initializing the boid
    //Calculates rays that we would use to detect obstacles in our path based on the view angle and view radius.
    //These rays are in local space, so every time they are used, they need to be converted to world space.
    private precomputeViewRays()
    {
        //Release previous rays
        for(let index = 0; index < this.sphereRays.length; ++index)
        {
            this.vec3Pool.release(this.sphereRays[index]);
        }
        this.sphereRays = [];

        if (this.settings.viewRadius <= 0 || this.settings.viewRadiusSegmentSize <= 0)
            return;

        //Uses spherical polar coordinates to generate the rays.
        //First ray will be directly in front of us, and rays will expand from there until they cover the entire cone view
        for (let angle = 0.0; angle <= this.settings.viewAngle; angle += this.settings.viewRadiusSegmentSize)
        {
            angle = Math.min(angle, this.settings.viewAngle);
            let dir: Vector3 = this.vec3Pool.reserve().set(0, 0, 1);
            
            //If it's the first ray, store it directly because it will point directly forward (and when moving in world-space will point in the same direction as velocity)
            if (angle <= 0)
            {
                this.sphereRays.push(dir);
                continue;
            }

            //Build orthonormal basis around view direction
            let up: Vector3 = this.aux3.set(0, 1, 0);
            if(Math.abs(dir.y) >= 0.999)
                up.set(1, 0, 0);

            let right: Vector3 = this.aux1.copy(dir).cross(up).normalize();
            let forwardUp: Vector3 = this.aux2.copy(right).cross(dir).normalize();

            let sinTheta: number = Math.sin(angle);
            let cosTheta: number = Math.cos(angle);
            let azimuthStep: number = this.settings.viewRadiusSegmentSize * 1.5 / Math.max(sinTheta, 0.0001);

            for (let phi = 0; phi < 2 * Math.PI; phi += azimuthStep)
            {
                let cosPhi = Math.cos(phi);
                let sinPhi = Math.sin(phi);

                // Spherical to cartesian in local cone space
                let localDir: Vector3 = this.vec3Pool.reserve()
                localDir.copy(dir).multiplyScalar(cosTheta)
                        .addScaledVector(right, sinTheta * cosPhi)
                        .addScaledVector(forwardUp, sinTheta * sinPhi);
                this.sphereRays.push(localDir.normalize());
            }
        }
    }
}
`;