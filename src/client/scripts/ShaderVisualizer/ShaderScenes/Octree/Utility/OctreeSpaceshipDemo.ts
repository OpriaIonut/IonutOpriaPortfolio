import { Box3, BufferAttribute, BufferGeometry, Color, Object3D, Points, PointsMaterial, Vector3 } from "three";
import { OctreeObj } from "../Scripts/OctreeObj";
import { Spaceship } from "../Scripts/Spaceship";
import { Octree } from "../Scripts/Octree";
import { OctreeVisualizer } from "../Scripts/OctreeVisualizer";
import { ShaderSceneOctree } from "../ShaderSceneOctree";
import { ThreeHelpers } from "../../../../Helper/ThreeHelpers";
import { Asset3D } from "../../../../../types";

//Utility script to hold all logic related to the spaceship demo
export class OctreeSpaceshipDemo
{
    private scene: ShaderSceneOctree;

    private spawnedAsteroids: OctreeObj[] = [];
    private spawnedSpaceships: OctreeObj[] = [];
    private spaceshipLogic: Spaceship[] = [];

    private spawnDistance: Vector3 = new Vector3(100, 100, 100); //How far objects can spawn
    //Size of the octree. Larger just in case some objects end up outside the octree (can happen because of the spaceship logic)
    private octreeBounds: Box3 = new Box3(new Vector3(-150, -150, -150), new Vector3(150, 150, 150));
    
    //Octree-related data
    private octree!: Octree;
    private octreeDebugVisualizer!: OctreeVisualizer;
    private objectsDebugVisualizer!: OctreeVisualizer;
    
    //Meshes relevant to this demo
    private stars?: Points;
    //Don't deallocate because they are cached in ObjectLoader
    private asteroid?: Object3D;
    private spaceship?: Object3D;

    constructor(sceneManager: ShaderSceneOctree)
    {
        this.scene = sceneManager;
        this.octreeDebugVisualizer = new OctreeVisualizer(this.scene.getScene());
        this.objectsDebugVisualizer = new OctreeVisualizer(this.scene.getScene());
    }

    //Called whenever we shitch to this scene
    public setupScene()
    {
        let settings = this.scene.getUISettings();
        settings.displayOctreeDebug = true;
        settings.displayObjectsDebug = true;
        
        let camera = this.scene.getCamera();
        this.scene.setBackgroundColor(new Color(0x000000));
        camera.position.set(500, 0, 0);
        camera.rotation.set(0, 0, 0);
        
        //If we haven't initialized the stars, generate them now
        if(this.stars == undefined)
            this.generateStars();
        else
            this.stars.visible = true;
        
        //Load the asteroid & spaceship and initialize the scene once they are both loaded
        let waitForLoad = false;
        if(this.asteroid == undefined)
        {
            waitForLoad = true;
            this.scene.getObjectLoader().loadModel("models/ShaderProjects/Octree/asteroid.glb", (model: Asset3D) => {
                this.asteroid = model.model;
                this.onSpaceAssetsLoaded();
            }, () => {});
        }
        if(this.spaceship == undefined)
        {
            waitForLoad = true;
            this.scene.getObjectLoader().loadModel("models/ShaderProjects/Octree/spaceship.glb", (model: Asset3D) => {
                this.spaceship = model.model;
                this.onSpaceAssetsLoaded();
            }, () => {});
        }
        //If both the spaceship and asteroid are loaded, initialize the scene
        if(!waitForLoad)
            this.onSpaceAssetsLoaded();
    }

    public update()
    {
        //Move the spaceships
        for(let index = 0; index < this.spaceshipLogic.length; ++index)
        {
            this.spaceshipLogic[index].update();
        }
        if(this.octree)
        {
            //Update the spaceship's bounds
            let settings = this.scene.getUISettings();
            let boundsStartTime = performance.now()
            this.octree.updateMovableObjectBounds();
            settings.objBoundsUpdate = `${(performance.now() - boundsStartTime).toFixed(2)}ms`;

            //Update the octree based on the new bounds
            let movableStartTime = performance.now()
            this.octree.updateMovableObjects();
            settings.octreeUpdateTime = `${(performance.now() - movableStartTime).toFixed(2)}ms`;
        }
        //Move the stars together with the camera
        if(this.stars && this.stars.visible)
            this.stars.position.copy(this.scene.getCamera().position);

    }

    //Called when we switch to another scene. Deletes procedural data but keeps references to the things loaded through the network
    public hideScene()
    {
        if(this.octree)
            this.octree.destroy();
        for(let index = 0; index < this.spawnedAsteroids.length; ++index)
        {
            let obj = this.spawnedAsteroids[index].getObject3D();
            this.scene.getScene().remove(obj);
            ThreeHelpers.disposeObject(obj);
        }
        for(let index = 0; index < this.spawnedSpaceships.length; ++index)
        {
            let obj = this.spawnedSpaceships[index].getObject3D();
            this.scene.getScene().remove(obj);
            ThreeHelpers.disposeObject(obj);
        }
        
        this.spawnedAsteroids = [];
        this.spawnedSpaceships = [];
        this.spaceshipLogic = [];

        if(this.stars)
            this.stars.visible = false;

        this.octreeDebugVisualizer.releaseAllCubes();
        this.objectsDebugVisualizer.releaseAllCubes();
    }

    //Called when we deactivate the octree experiment. Will discard all data
    public discardScene()
    {
        this.hideScene();
        if(this.stars)
            ThreeHelpers.disposeObject(this.stars);
    }

    //Change debug display
    public onDebugDisplayChanged()
    {
        let settings = this.scene.getUISettings();
        if(this.octree)
            this.octree.setDebugVisualizer(settings.displayOctreeDebug ? this.octreeDebugVisualizer : undefined);
        for(let index = 0; index < this.spawnedAsteroids.length; ++index)
        {
            this.spawnedAsteroids[index].setDebugVisualizer(settings.displayObjectsDebug ? this.objectsDebugVisualizer : undefined);
        }
        for(let index = 0; index < this.spawnedSpaceships.length; ++index)
        {
            this.spawnedSpaceships[index].setDebugVisualizer(settings.displayObjectsDebug ? this.objectsDebugVisualizer : undefined);
        }
    }

    //Called when we change the asteroid slider
    public updateAsteroidCount()
    {
        let diff = this.scene.getUISettings().asteroidCount - this.spawnedAsteroids.length;
        if(diff < 0)
        {
            //If we have less asteroids now, discard them and remove from where they were referenced
            for(let index = 0; index < -diff; ++index)
            {
                this.spawnedAsteroids[index].setDebugVisualizer(undefined);
                let obj = this.spawnedAsteroids[index].getObject3D();
                this.octree.removeObject(obj);
                this.scene.getScene().remove(obj);
                ThreeHelpers.disposeObject(obj);
            }
            this.spawnedAsteroids.splice(0, -diff);
        }
        else if(diff > 0)
        {
            //If we have more asteroids now, spawn new ones and initialize them
            let newAsteroids = this.scene.spawnRandomObjects(this.asteroid!, diff, 1.0, 3.0, true, 0, this.spawnDistance, false, this.objectsDebugVisualizer);
            for(let index = 0; index < newAsteroids.length; ++index)
            {
                this.spawnedAsteroids.push(newAsteroids[index]);
                this.octree.addObject(newAsteroids[index]);
            }
        }
    }

    //Called when we change the spaceship slider
    public updateSpaceshipCount()
    {
        let diff = this.scene.getUISettings().spaceshipCount - this.spawnedSpaceships.length;
        if(diff < 0)
        {
            //If we have less spaceships now, discard them and remove from where they were referenced
            for(let index = 0; index < -diff; ++index)
            {
                this.spawnedSpaceships[index].setDebugVisualizer(undefined);
                let obj = this.spawnedSpaceships[index].getObject3D();
                this.octree.removeObject(obj);
                this.scene.getScene().remove(obj);
                ThreeHelpers.disposeObject(obj);
            }
            this.spawnedSpaceships.splice(0, -diff);
            this.spaceshipLogic.splice(0, -diff);
        }
        else if(diff > 0)
        {
            //If we have more spaceships now, spawn new ones and initialize them
            let newSpaceships = this.scene.spawnRandomObjects(this.spaceship!, diff, 1.0, 1.0, true, 0, this.spawnDistance, true, this.objectsDebugVisualizer);
            let length = this.spawnedSpaceships.length;
            for(let index = 0; index < newSpaceships.length; ++index)
            {
                let logic = new Spaceship(newSpaceships[index].getObject3D(), this.octreeBounds, 20.0, 1.5);
                this.spaceshipLogic.push(logic);
                this.spawnedSpaceships.push(newSpaceships[index]);
                this.octree.addObject(this.spawnedSpaceships[index + length]);
            }
        }
    }

    //Called when resources load
    private onSpaceAssetsLoaded()
    {
        //Header guard to not generate the scene until all assets are fully loaded
        if(this.asteroid == undefined || this.spaceship == undefined)
            return;
        
        //Spawn the objects desired
        const settings = this.scene.getUISettings();
        this.spawnedAsteroids = this.scene.spawnRandomObjects(this.asteroid, settings.asteroidCount, 1.0, 3.0, true, 0, this.spawnDistance, false, this.objectsDebugVisualizer);
        this.spawnedSpaceships = this.scene.spawnRandomObjects(this.spaceship, settings.spaceshipCount, 1.0, 1.0, true, 0, this.spawnDistance, true, this.objectsDebugVisualizer);

        //Make a list of all objects that will go into the octree
        let objToAdd: OctreeObj[] = [];
        for(let index = 0; index < this.spawnedAsteroids.length; ++index)
        {
            objToAdd.push(this.spawnedAsteroids[index]);
        }
        for(let index = 0; index < this.spawnedSpaceships.length; ++index)
        {
            let logic = new Spaceship(this.spawnedSpaceships[index].getObject3D(), this.octreeBounds, 20.0, 1.5);
            this.spaceshipLogic.push(logic);
            objToAdd.push(this.spawnedSpaceships[index]);
        }

        //Generate the octree
        this.octree = new Octree(this.octreeBounds, objToAdd, 5, 5, 1, settings.displayOctreeDebug ? this.octreeDebugVisualizer : undefined);
    }

    //Generate star particles in a sphere around the camera
    private generateStars()
    {
        const starCount = 5000;
        const minRadius = 600;
        const maxRadius = 800;
        const positions = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++)
        {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            const xDir = Math.sin(phi) * Math.cos(theta);
            const yDir = Math.cos(phi);
            const zDir = Math.sin(phi) * Math.sin(theta);

           const radius = minRadius + Math.random() * (maxRadius - minRadius);

            const idx = i * 3;
            positions[idx] = xDir * radius;
            positions[idx + 1] = yDir * radius;
            positions[idx + 2] = zDir * radius;
        }

        const geometry = new BufferGeometry();
        geometry.setAttribute("position", new BufferAttribute(positions, 3));

        const material = new PointsMaterial({
            color: 0xffffff,
            size: 2.0,
            sizeAttenuation: true,
        });

        this.stars = new Points(geometry, material);
        this.scene.getScene().add(this.stars);
    }
}