import { AmbientLight, Box3, BoxGeometry, BoxHelper, ConeGeometry, DirectionalLight, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, Scene, Vector3 } from "three";
import { ShaderVisualizer } from "../../ShaderVisualizer";
import { DebugUI } from "../../../ThreeVisualizer/DebugGUI";
import { Boid } from "./Scripts/Boid";
import { ThreeHelpers } from "../../../Helper/ThreeHelpers";
import { GenericPool } from "../../../Helper/GenericPool";
import { ObstacleRaycaster } from "./Scripts/BoidRaycaster";

/*
Decide if you will use octree or not
Add debug display?
Make birds demo
Make fish demo
Clean up and comment
Expose scripts + credits
*/

//Demo scene with the boids
//Handles high-level management of the scene and it's components
export class ShaderSceneBoids
{
    private scene: Scene = new Scene();
    private visualizer!: ShaderVisualizer;
    private camera!: PerspectiveCamera;

    private limitBounds: Box3 = new Box3();
    private boundsSize: Vector3 = new Vector3(35, 35, 50);
    private spawnDistance: Vector3 = new Vector3(30, 30, 45);
    private debugUI!: DebugUI;

    private raycaster!: ObstacleRaycaster;
    private vec3Pool!: GenericPool<Vector3>;

    private boids: Boid[] = [];
    // private octree!: Octree;

    private bird?: Mesh;
    
    private settings = {
        boidCount: 100,

        boidSettings: {
            minSpeed: 3.0,
            maxSpeed: 5.0,
            maxForce: 10.0,

            separationFactor: 3.0,
            alignmentFactor: 1.5,
            cohesionFactor: 2.0,
            boundsSteerFactor: 2.5,
            collisionAvoidFactor: 5.0,

            boundsDetectDist: 2.0,
            viewRadius: 2.5,
            separationRadius: 1.0,
            viewAngle: 1.0,
            viewRadiusSegmentSize: 0.5
        },

        // boundsUpdateTime: "",
        // octreeUpdateTime: "",
        // octreeQueryTime: "",
        boidUpdateTime: "",
        // totalTime: "",
    }

    public init(visualizer: ShaderVisualizer)
    {
        this.visualizer = visualizer;
        this.camera = visualizer.cameraManager.getCamera();

        this.raycaster = new ObstacleRaycaster([]);
        this.vec3Pool = new GenericPool<Vector3>(10, () => { return new Vector3(); });

        this.camera.position.set(50, 0.0, 0.0);
        this.camera.near = 0.1;
        this.camera.far = 1000.0;
        this.camera.updateProjectionMatrix();

        //Set up lights in the scene
        let ambientLight = new AmbientLight(0xffffff, 0.25);
        this.scene.add(ambientLight);
        
        let directionalLight = new DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(10.0, 10.0, 5.0);
        this.scene.add(directionalLight);

        let boundsGeom = new BoxGeometry(this.boundsSize.x, this.boundsSize.y, this.boundsSize.z);
        let boundsMesh = new Mesh(boundsGeom, new MeshBasicMaterial({ color: 0x00ff00, wireframe: true }));
        let box = new BoxHelper(boundsMesh, 0xffff00);
        this.scene.add(box);

        this.limitBounds.setFromObject(boundsMesh);
        this.bird = new Mesh(new ConeGeometry(0.25, 0.75, 16, 1).rotateX(Math.PI * 0.5), new MeshStandardMaterial());

        this.debugUI = new DebugUI();
        let guiHtml = this.debugUI.getGUIClass()!.domElement;
        let guiParent = document.getElementById("shaderVisualizer") as HTMLElement;
        guiParent.appendChild(guiHtml);
        guiHtml.style.position = "absolute";
        guiHtml.style.left = "0px";
        guiHtml.style.top = "0px";

        this.displayUI();
        this.boids = this.spawnBoids(this.bird, this.settings.boidCount, 1.0, 1.5, this.spawnDistance);
    }

    public update(deltaTime: number)
    {
        let boidsUpdateStart = performance.now();
        for(let index = 0; index < this.boids.length; ++index)
        {
            this.boids[index].UpdateBoid(this.boids);
        }
        this.settings.boidUpdateTime = `${(performance.now() - boidsUpdateStart).toFixed(2)}ms`;
    }

    //Called when you deactivate the view, dispose & reset everything
    public hide()
    {
        
    }

    public getScene() { return this.scene; }

    private displayUI()
    {
        this.debugUI.reset();
        this.debugUI.addSlider("", this.settings, "boidCount", 0, 1500, "Boid Count", () => { this.updateBoidCount(); });
        this.debugUI.addSlider("", this.settings.boidSettings, "minSpeed", 1.0, 10.0, "Min Speed");
        this.debugUI.addSlider("", this.settings.boidSettings, "maxSpeed", 1.0, 10.0, "Max Speed");
        this.debugUI.addSlider("", this.settings.boidSettings, "maxForce", 1.0, 10.0, "Max Force");

        this.debugUI.addSlider("", this.settings.boidSettings, "separationFactor", 0.0, 5.0, "Separation Factor");
        this.debugUI.addSlider("", this.settings.boidSettings, "alignmentFactor", 0.0, 5.0, "Alignment Factor");
        this.debugUI.addSlider("", this.settings.boidSettings, "cohesionFactor", 0.0, 5.0, "Cohesion Factor");
        this.debugUI.addSlider("", this.settings.boidSettings, "boundsSteerFactor", 0.0, 5.0, "Bounds Steer Factor"); //To do: should this be exposed?
        this.debugUI.addSlider("", this.settings.boidSettings, "collisionAvoidFactor", 0.0, 5.0, "Collision Avoid Factor"); //To do: should this be exposed?

        this.debugUI.addText("", this.settings, "boidUpdateTime", "Boids Update", false);
    }

    public updateBoidCount()
    {
        let diff = this.settings.boidCount - this.boids.length;
        if(diff < 0)
        {
            //If we have less boids now, discard them and remove from where they were referenced
            for (let index = 0; index < -diff; ++index)
            {
                let obj = this.boids[index].getObject3D();
                // this.octree.removeObject(obj);
                this.scene.remove(obj);
                ThreeHelpers.disposeObject(obj);
            }
            this.boids.splice(0, -diff);
        }
        else if (diff > 0)
        {
            //If we have more boids now, spawn new ones and initialize them
            let newBoids = this.spawnBoids(this.bird!, diff, 1.0, 1.5, this.spawnDistance);
            for (let index = 0; index < newBoids.length; ++index)
            {
                this.boids.push(newBoids[index]);
                // this.octree.addObject(this.spawnedTrees[index + length]);
            }
        }
    }

    public spawnBoids(objToSpawn: Object3D, count: number, minScale: number, maxScale: number, maxSpawnDistance: Vector3)
    {
        let newObjects: Boid[] = [];
        for(let index = 0; index < count; ++index)
        {
            let obj = objToSpawn.clone();
            obj.position.set(
                (Math.random() * 2.0 - 1.0) * maxSpawnDistance.x,
                (Math.random() * 2.0 - 1.0) * maxSpawnDistance.y,
                (Math.random() * 2.0 - 1.0) * maxSpawnDistance.z
            );
            let scale = minScale + Math.random() * (maxScale - minScale)
            obj.scale.set(scale, scale, scale);

            this.scene.add(obj);
            let octreeObj = new Boid(obj, this.limitBounds, this.raycaster, this.settings.boidSettings, this.vec3Pool);
            newObjects.push(octreeObj);
        }
        return newObjects;
    }
}
