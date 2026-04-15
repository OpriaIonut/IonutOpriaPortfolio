import { Box3, BufferAttribute, BufferGeometry, Color, Object3D, Points, PointsMaterial, Vector3 } from "three";
import { OctreeObj } from "../Scripts/OctreeObj";
import { Spaceship } from "../Scripts/Spaceship";
import { Octree } from "../Scripts/Octree";
import { OctreeVisualizer } from "../Scripts/OctreeVisualizer";
import { ShaderSceneOctree } from "../ShaderSceneOctree";
import { ThreeHelpers } from "../../../../Helper/ThreeHelpers";
import { Asset3D } from "../../../../../types";

export class OctreeSpaceshipDemo
{
    private _scene: ShaderSceneOctree;

    private _spawnedAsteroids: OctreeObj[] = [];
    private _spawnedSpaceships: OctreeObj[] = [];
    private _spaceshipLogic: Spaceship[] = [];

    private _spawnDistance: Vector3 = new Vector3(100, 100, 100);
    private _octreeBounds: Box3 = new Box3(new Vector3(-150, -150, -150), new Vector3(150, 150, 150));
    
    private _octree!: Octree;
    private _octreeDebugVisualizer!: OctreeVisualizer;
    private _objectsDebugVisualizer!: OctreeVisualizer;
    
    //Don't deallocate because they are cached in ObjectLoader
    private _asteroid?: Object3D;
    private _spaceship?: Object3D;
    
    private _stars?: Points;

    constructor(sceneManager: ShaderSceneOctree)
    {
        this._scene = sceneManager;
        this._octreeDebugVisualizer = new OctreeVisualizer(this._scene.getScene());
        this._objectsDebugVisualizer = new OctreeVisualizer(this._scene.getScene());
    }

    public setupScene()
    {
        let settings = this._scene.getUISettings();
        settings.displayOctreeDebug = true;
        settings.displayObjectsDebug = true;
        
        let camera = this._scene.getCamera();
        this._scene.setBackgroundColor(new Color(0x000000));
        camera.position.set(500, 0, 0);
        camera.rotation.set(0, 0, 0);
                
        if(this._stars == undefined)
            this.generateStars();
        else
            this._stars.visible = true;
        
        let waitForLoad = false;
        if(this._asteroid == undefined)
        {
            waitForLoad = true;
            this._scene.getObjectLoader().loadModel("models/ShaderProjects/Octree/asteroid.glb", (model: Asset3D) => {
                this._asteroid = model.model;
                this.onSpaceAssetsLoaded();
            }, () => {});
        }
        if(this._spaceship == undefined)
        {
            waitForLoad = true;
            this._scene.getObjectLoader().loadModel("models/ShaderProjects/Octree/spaceship.glb", (model: Asset3D) => {
                this._spaceship = model.model;
                this.onSpaceAssetsLoaded();
            }, () => {});
        }
        if(!waitForLoad)
            this.onSpaceAssetsLoaded();
    }

    public update()
    {
        for(let index = 0; index < this._spaceshipLogic.length; ++index)
        {
            this._spaceshipLogic[index].update();
        }
        if(this._octree)
        {
            let settings = this._scene.getUISettings();
            let boundsStartTime = performance.now()
            this._octree.UpdateBounds();
            settings.objBoundsUpdate = `${(performance.now() - boundsStartTime).toFixed(2)}ms`;

            let movableStartTime = performance.now()
            this._octree.UpdateMovableObjects();
            settings.octreeUpdateTime = `${(performance.now() - movableStartTime).toFixed(2)}ms`;
        }
        if(this._stars && this._stars.visible)
            this._stars.position.copy(this._scene.getCamera().position);

    }

    public hideScene()
    {
        if(this._octree)
            this._octree.Destroy();
        for(let index = 0; index < this._spawnedAsteroids.length; ++index)
        {
            let obj = this._spawnedAsteroids[index].GetObject3D();
            this._scene.getScene().remove(obj);
            ThreeHelpers.disposeObject(obj);
        }
        for(let index = 0; index < this._spawnedSpaceships.length; ++index)
        {
            let obj = this._spawnedSpaceships[index].GetObject3D();
            this._scene.getScene().remove(obj);
            ThreeHelpers.disposeObject(obj);
        }
        
        this._spawnedAsteroids = [];
        this._spawnedSpaceships = [];
        this._spaceshipLogic = [];

        if(this._stars)
            this._stars.visible = false;

        this._octreeDebugVisualizer.releaseAllCubes();
        this._objectsDebugVisualizer.releaseAllCubes();
    }

    public discardScene()
    {
        this.hideScene();
        if(this._stars)
            ThreeHelpers.disposeObject(this._stars);
    }

    public onDebugDisplayChanged()
    {
        let settings = this._scene.getUISettings();
        if(this._octree)
            this._octree.SetDebugVisualizer(settings.displayOctreeDebug ? this._octreeDebugVisualizer : undefined);
        for(let index = 0; index < this._spawnedAsteroids.length; ++index)
        {
            this._spawnedAsteroids[index].SetDebugVisualizer(settings.displayObjectsDebug ? this._objectsDebugVisualizer : undefined);
        }
        for(let index = 0; index < this._spawnedSpaceships.length; ++index)
        {
            this._spawnedSpaceships[index].SetDebugVisualizer(settings.displayObjectsDebug ? this._objectsDebugVisualizer : undefined);
        }
    }

    public updateAsteroidCount()
    {
        let diff = this._scene.getUISettings().asteroidCount - this._spawnedAsteroids.length;
        if(diff < 0)
        {
            for(let index = 0; index < -diff; ++index)
            {
                this._spawnedAsteroids[index].SetDebugVisualizer(undefined);
                let obj = this._spawnedAsteroids[index].GetObject3D();
                this._octree.RemoveObject(obj);
                this._scene.getScene().remove(obj);
                ThreeHelpers.disposeObject(obj);
            }
            this._spawnedAsteroids.splice(0, -diff);
        }
        else if(diff > 0)
        {
            let newAsteroids = this._scene.spawnRandomObjects(this._asteroid!, diff, 1.0, 3.0, true, 0, this._spawnDistance, false, this._objectsDebugVisualizer);
            for(let index = 0; index < newAsteroids.length; ++index)
            {
                this._spawnedAsteroids.push(newAsteroids[index]);
                this._octree.AddObject(newAsteroids[index]);
            }
        }
    }

    public updateSpaceshipCount()
    {
        let diff = this._scene.getUISettings().spaceshipCount - this._spawnedSpaceships.length;
        if(diff < 0)
        {
            for(let index = 0; index < -diff; ++index)
            {
                this._spawnedSpaceships[index].SetDebugVisualizer(undefined);
                let obj = this._spawnedSpaceships[index].GetObject3D();
                this._octree.RemoveObject(obj);
                this._scene.getScene().remove(obj);
                ThreeHelpers.disposeObject(obj);
            }
            this._spawnedSpaceships.splice(0, -diff);
            this._spaceshipLogic.splice(0, -diff);
        }
        else if(diff > 0)
        {
            let newSpaceships = this._scene.spawnRandomObjects(this._spaceship!, diff, 1.0, 1.0, true, 0, this._spawnDistance, true, this._objectsDebugVisualizer);
            let length = this._spawnedSpaceships.length;
            for(let index = 0; index < newSpaceships.length; ++index)
            {
                let logic = new Spaceship(newSpaceships[index].GetObject3D(), this._octreeBounds, 20.0, 1.5);
                this._spaceshipLogic.push(logic);
                this._spawnedSpaceships.push(newSpaceships[index]);
                this._octree.AddObject(this._spawnedSpaceships[index + length]);
            }
        }
    }

    private onSpaceAssetsLoaded()
    {
        if(this._asteroid == undefined || this._spaceship == undefined)
            return;
        
        const settings = this._scene.getUISettings();
        this._spawnedAsteroids = this._scene.spawnRandomObjects(this._asteroid, settings.asteroidCount, 1.0, 3.0, true, 0, this._spawnDistance, false, this._objectsDebugVisualizer);
        this._spawnedSpaceships = this._scene.spawnRandomObjects(this._spaceship, settings.spaceshipCount, 1.0, 1.0, true, 0, this._spawnDistance, true, this._objectsDebugVisualizer);

        let objToAdd: OctreeObj[] = [];
        for(let index = 0; index < this._spawnedAsteroids.length; ++index)
        {
            objToAdd.push(this._spawnedAsteroids[index]);
        }
        for(let index = 0; index < this._spawnedSpaceships.length; ++index)
        {
            let logic = new Spaceship(this._spawnedSpaceships[index].GetObject3D(), this._octreeBounds, 20.0, 1.5);
            this._spaceshipLogic.push(logic);
            objToAdd.push(this._spawnedSpaceships[index]);
        }

        this._octree = new Octree(this._octreeBounds, objToAdd, 5, 5, 1, settings.displayOctreeDebug ? this._octreeDebugVisualizer : undefined);
    }

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

        this._stars = new Points(geometry, material);
        this._scene.getScene().add(this._stars);
    }
}