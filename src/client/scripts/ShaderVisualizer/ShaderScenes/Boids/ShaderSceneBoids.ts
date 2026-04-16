import { AmbientLight, AnimationClip, Box3, BoxGeometry, BoxHelper, ConeGeometry, DirectionalLight, MathUtils, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, Scene, Vector3 } from "three";
import { ShaderVisualizer } from "../../ShaderVisualizer";
import { DebugUI } from "../../../ThreeVisualizer/DebugGUI";
import { Boid } from "./Scripts/Boid";
import { ThreeHelpers } from "../../../Helper/ThreeHelpers";
import { GenericPool } from "../../../Helper/GenericPool";
import { ObstacleRaycaster } from "./Scripts/BoidRaycaster";
import { Asset3D } from "../../../../types";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils";
import { timeStats } from "../../../../client";
import { exposedCodeBoid } from "./ExposedScripts.ts/ExposedCodeBoid";
import { exposedCodeBoidSettings } from "./ExposedScripts.ts/ExposedCodeBoidSettings";
import { exposedCodeBoidRaycaster } from "./ExposedScripts.ts/ExposedCodeBoidRaycaster";

//Struct defining some settings which are used to spawn the boids and which are different for each demo
declare type BoidSpawnSettings =
{
    minSpeed: number,
    maxSpeed: number,
    minScale: number,
    maxScale: number
}

//Handles high-level management of the scene and it's components
export class ShaderSceneBoids
{
    private scene: Scene = new Scene();
    private visualizer!: ShaderVisualizer;
    private camera!: PerspectiveCamera;

    //Default properties of the camera/scene in order to reset things back to how they were before
    private defaultCameraNear: number = 0.01;
    private defaultCameraFar: number = 100.0;
    private defaultCameraPos: Vector3 = new Vector3();

    //The bounds that boids should avoid exiting from. When they get close to this they will try to move to the center
    private limitBounds: Box3 = new Box3();
    private boundsSize: Vector3 = new Vector3(35, 35, 60);
    private spawnDistance: Vector3 = new Vector3(15, 15, 28); //Should be less than half of boundsSize to make sure they spawn inside it

    //Utility scripts
    private debugUI!: DebugUI;
    private raycaster!: ObstacleRaycaster;
    private vec3Pool!: GenericPool<Vector3>;

    //List in which we will store all spawned boids
    private boids: Boid[] = [];
    private birdMaterials: MeshStandardMaterial[] = [];
    private cone?: Object3D;

    //For the fishes demo, we are pulling boids towards the red circle, these variables control that
    private pullTargetPos: Vector3 = new Vector3(0.0, 3.5, 0.0);
    private pullTargetRadius: number = 20.0;

    //Assets loaded from the disk. Do not dispose them because they are cached in ObjectLoader
    private bird?: Object3D;
    private birdAnim?: AnimationClip;
    private skybox?: Object3D;
    private seaSkybox?: Object3D;

    private fishesToLoad: string[] = ["Fish1.glb", "Fish2.glb", "Fish3.glb"];
    private fishMeshes: Object3D[] = [];
    private fishAnims: AnimationClip[] = [];
    private aquariumObstacles?: Object3D;

    //Settings to display proper FPS
    private previousFrameTime: number = 0.0;
    private smoothedFPS: number = 0.0;

    //Settings which will be used to spawn the boids
    private spawnSettings = {
        Cones: { minSpeed: 0.75, maxSpeed: 1.25, minScale: 0.75, maxScale: 1.0 },
        Birds: { minSpeed: 0.75, maxSpeed: 1.25, minScale: 0.5, maxScale: 0.75 },
        Fishes: { minSpeed: 3.0, maxSpeed: 5.0, minScale: 0.25, maxScale: 0.3 }
    }

    //Settings that will go into the ui
    private settings = {
        currentDemo: "Fishes",
        availableDemos: ["Cones", "Birds", "Fishes"],
        boidCount: 300,

        boidUpdateTime: "",
        boidAnimUpdate: "",
        fps: "",

        boidSettings: { //These settings need to be equivalent to BoidsSettings.ts and are passed directly to all boids.
            minSpeed: 3.0,
            maxSpeed: 5.0,
            maxForce: 10.0,

            separationFactor: 3.0,
            alignmentFactor: 1.0,
            cohesionFactor: 1.0,
            boundsSteerFactor: 2.5,
            collisionAvoidFactor: 1.0,
            pullTargetFactor: 1.5,

            boundsDetectDist: 2.0,
            viewRadius: 3.5,
            separationRadius: 2.0,
            viewAngle: 1,
            viewRadiusSegmentSize: 0.5
        },
    }

    public init(visualizer: ShaderVisualizer)
    {
        this.visualizer = visualizer;
        this.camera = visualizer.cameraManager.getCamera();

        this.raycaster = new ObstacleRaycaster([]);
        this.vec3Pool = new GenericPool<Vector3>(10, () => { return new Vector3(); });

        //Store current camera properties to be able to reset them later on
        this.defaultCameraFar = this.camera.far;
        this.defaultCameraNear = this.camera.near;
        this.defaultCameraPos.copy(this.camera.position);

        this.camera.position.set(75, 10.0, 0.0);
        this.camera.near = 0.1;
        this.camera.far = 1000.0;
        this.camera.updateProjectionMatrix();

        //Set up lights in the scene
        let ambientLight = new AmbientLight(0xffffff, 0.25);
        this.scene.add(ambientLight);
        
        let directionalLight = new DirectionalLight(0xffffff, 3.0);
        directionalLight.position.set(10.0, 10.0, 5.0);
        this.scene.add(directionalLight);

        //Create the bounds and add a visualizer to be able to see it
        let boundsGeom = new BoxGeometry(this.boundsSize.x, this.boundsSize.y, this.boundsSize.z);
        let boundsMesh = new Mesh(boundsGeom, new MeshBasicMaterial({ color: 0x00ff00, wireframe: true }));
        this.limitBounds.setFromObject(boundsMesh);

        let box = new BoxHelper(boundsMesh, 0xffff00);
        this.scene.add(box);

        //Create the debug ui
        this.debugUI = new DebugUI();
        let guiHtml = this.debugUI.getGUIClass()!.domElement;
        let guiParent = document.getElementById("shaderVisualizer") as HTMLElement;
        guiParent.appendChild(guiHtml);
        guiHtml.style.position = "absolute";
        guiHtml.style.left = "0px";
        guiHtml.style.top = "0px";

        this.loadNeededResources(); //Start loading all resources needed for the demo. Once the resources finish loading, it will start the demo
        this.displayUI(); //Display the debug ui

        this.visualizer.addScript("Boid.ts", exposedCodeBoid);
        this.visualizer.addScript("BoidSettings.ts", exposedCodeBoidSettings);
        this.visualizer.addScript("BoidRaycaster.ts", exposedCodeBoidRaycaster);
        this.visualizer.addScript("Credits", `
Special thanks to the following artists for their work:

Fish demo:
- Fish: https://sketchfab.com/3d-models/fish-5a2b7976ef5c44658de22e98bf381277
- Aquarium: https://sketchfab.com/3d-models/aquarium-e954de85f1f64c7eb5657c8f644fc066
- Skybox: https://opengameart.org/content/ocean-hdriskybox

Bird demo:
- Bird: https://sketchfab.com/3d-models/bird-flying-animation-c221ef6d36024feab16f4f43f4974bbb
- Skybox: https://sketchfab.com/3d-models/free-skybox-basic-sky-b2a4fd1b92c248abaae31975c9ea79e2
`, false);
    }

    public update(deltaTime: number)
    {
        //Move the boids
        let boidsUpdateStart = performance.now();
        for (let index = 0; index < this.boids.length; ++index)
        {
            this.boids[index].updateBoid(this.boids);
        }
        this.settings.boidUpdateTime = `${(performance.now() - boidsUpdateStart).toFixed(2)}ms`;

        //Animate the boids if they have animations
        let boidAnimStart = performance.now();
        for (let index = 0; index < this.boids.length; ++index)
        {
            this.boids[index].animate();
        }
        this.settings.boidAnimUpdate = `${(performance.now() - boidAnimStart).toFixed(2)}ms`;

        //Calculate and display FPS. Uses a smoothing formula to make numbers easier to read
        let instantFPS = 1.0 / (timeStats.currentTime - this.previousFrameTime);
        this.smoothedFPS = this.smoothedFPS ? (this.smoothedFPS * 0.9 + instantFPS * 0.1) : instantFPS;
        this.settings.fps = `${(this.smoothedFPS).toFixed(2)}`;
        this.previousFrameTime = timeStats.currentTime;
    }

    //Called when you deactivate the view, dispose & reset everything
    public hide()
    {
        //Reset the debug ui and the camera
        this.debugUI.reset(); //Events will also unsubscribe here
        this.camera.position.copy(this.defaultCameraPos);
        this.camera.far = this.defaultCameraFar;
        this.camera.near = this.defaultCameraNear;
        this.camera.updateProjectionMatrix();

        //Discard all previously generated data
        for (let index = 0; index < this.boids.length; ++index)
        {
            this.boids[index].destroy();
            let obj = this.boids[index].getObject3D();
            this.scene.remove(obj);
            ThreeHelpers.disposeObject(obj);
        }
        this.boids = [];

        if(this.cone != undefined)
            ThreeHelpers.disposeObject(this.cone);
        for(let index = 0; index < this.birdMaterials.length; ++index)
        {
            this.birdMaterials[index].dispose();
        }
        this.birdMaterials = [];

        this.visualizer.removeScript("Boid.ts");
        this.visualizer.removeScript("BoidSettings.ts");
        this.visualizer.removeScript("BoidRaycaster.ts");
        this.visualizer.removeScript("Credits");
    }

    public getScene() { return this.scene; }

    private displayUI()
    {
        this.debugUI.reset();
        //Calling onResourceLoaded because that one has some checks becore changing the scene. Safety measure in case the user changes the scene before all resources are loaded
        this.debugUI.addDropdown("", this.settings, "currentDemo", this.settings.availableDemos, "Current Demo", () => { this.onResourceLoaded(); });

        //Limit boids based on the demo
        let maxCount = this.settings.currentDemo == "Birds" ? 500 : 1000;
        this.settings.boidCount = MathUtils.clamp(this.settings.boidCount, 0, maxCount);

        this.debugUI.addSlider("", this.settings, "boidCount", 0, maxCount, "Boid Count", () => { this.updateBoidCount(); });
        this.debugUI.addSlider("", this.settings.boidSettings, "minSpeed", 1.0, 10.0, "Min Speed");
        this.debugUI.addSlider("", this.settings.boidSettings, "maxSpeed", 1.0, 10.0, "Max Speed");

        this.debugUI.addSlider("", this.settings.boidSettings, "separationFactor", 0.0, 5.0, "Separation Factor");
        this.debugUI.addSlider("", this.settings.boidSettings, "alignmentFactor", 0.0, 5.0, "Alignment Factor");
        this.debugUI.addSlider("", this.settings.boidSettings, "cohesionFactor", 0.0, 5.0, "Cohesion Factor");
        this.debugUI.addSlider("", this.settings.boidSettings, "pullTargetFactor", 0.0, 5.0, "Pull Target Force");

        this.debugUI.addText("", this.settings, "boidUpdateTime", "Boids Update", false);
        if(this.settings.currentDemo != "Cones")
            this.debugUI.addText("", this.settings, "boidAnimUpdate", "Boids Animation", false);
        this.debugUI.addText("", this.settings, "fps", "FPS", false);
    }

    //This function is called when initially starting this experiment, and loads all resources needed for all demos
    private loadNeededResources()
    {
        const objLoader = this.visualizer.objectLoader;

        //Create cone geometry for the cone demo
        this.cone = new Mesh(new ConeGeometry(0.25, 0.75, 16, 1).rotateX(Math.PI * 0.5), new MeshStandardMaterial({color: 0xbbbbbb}));

        //Load fish demo resources
        objLoader.loadModel("models/ShaderProjects/Boids/AquariumObstacles.glb", (model: Asset3D) => {
            this.aquariumObstacles = model.model;
            this.aquariumObstacles.scale.set(17.5, 17.5, 17.5);
            this.aquariumObstacles.visible = false;
            this.scene.add(this.aquariumObstacles);
            this.raycaster.addObstacle(this.aquariumObstacles);
            this.onResourceLoaded();
        }, () => {});

        objLoader.loadModel("models/ShaderProjects/Boids/SeaSkybox.glb", (model: Asset3D) => {
            this.seaSkybox = model.model;
            this.seaSkybox.receiveShadow = false;
            this.seaSkybox.castShadow = false;
            this.seaSkybox.visible = false;
            let mesh = this.seaSkybox.children[0] as Mesh
            let mat = mesh.material as MeshStandardMaterial;
            mesh.material = new MeshBasicMaterial().copy(mat);
            this.seaSkybox.rotateX(Math.PI);
            this.scene.add(this.seaSkybox);
            this.onResourceLoaded();
        }, () => {});

        for(let index = 0; index < this.fishesToLoad.length; ++index)
        {
            let path = "models/ShaderProjects/Boids/" + this.fishesToLoad[index];
            objLoader.loadModel(path, (model: Asset3D) => {
                this.fishMeshes.push(model.model);
                this.fishAnims.push(model.animations[0]);
                this.onResourceLoaded();
            }, () => {});
        }

        //Load birds demo resources
        objLoader.loadModel("models/ShaderProjects/Boids/Bird.glb", (model: Asset3D) => {
            this.bird = model.model;
            this.bird.name = "Bird";
            this.birdAnim = model.animations[0];
            this.setupBirdMaterials();
            this.onResourceLoaded();
        }, () => {});

        objLoader.loadModel("models/ShaderProjects/Boids/Skybox.glb", (model: Asset3D) => {
            this.skybox = model.model;
            this.skybox.rotateY(-Math.PI / 2.0);
            this.skybox.visible = false;
            this.scene.add(this.skybox);
            this.onResourceLoaded();
        }, () => {});
    }

    //Called whenever a resource loads. Should check depending on the demo if all resources are loaded for that respective demo, and if so, start initializing it
    private onResourceLoaded()
    {
        if(this.settings.currentDemo == "Fishes" && (this.seaSkybox == undefined || this.aquariumObstacles == undefined || this.fishMeshes.length < this.fishesToLoad.length))
            return;
        else if(this.settings.currentDemo == "Birds" && (this.bird == undefined || this.skybox == undefined))
            return;

        this.changeScene();
    }

    private changeScene()
    {
        //Discard all previously generated data
        this.displayUI();
        for (let index = 0; index < this.boids.length; ++index)
        {
            this.boids[index].destroy();
            let obj = this.boids[index].getObject3D();
            this.scene.remove(obj);
            ThreeHelpers.disposeObject(obj);
        }
        this.boids = [];

        //Reset environment
        if(this.skybox)
            this.skybox.visible = false;
        if(this.seaSkybox)
            this.seaSkybox.visible = false;
        if(this.aquariumObstacles)
            this.aquariumObstacles.visible = false;

        //Load desired scene
        switch(this.settings.currentDemo)
        {
            case "Cones":
                this.setupConeDemo();
                break;
            case "Birds":
                this.settings.boidCount = 150;
                this.setupBirdsDemo();
                break;
            case "Fishes":
                this.setupFishesDemo();
                break;
        }
    }

    //Called when we are ready to display the cone demo
    private setupConeDemo()
    {
        this.spawnBoids([this.cone!], [], this.settings.boidCount, 0.75, 1.0, this.spawnDistance, 0.75, 1.25);
    }

    //Called when we are ready to display the birds demo
    private setupBirdsDemo()
    {
        this.skybox!.visible = true;

        let anim = [];
        if(this.birdAnim != undefined)
            anim.push(this.birdAnim);
        let addedObjs = this.spawnBoids([this.bird!], anim, this.settings.boidCount, 0.5, 0.75, this.spawnDistance, 0.75, 1.25);
        for(let index = 0; index < addedObjs.length; ++index)
        {
            //Pick a random material for each bird, to add some variation
            let randColorId = Math.floor(Math.random() * (this.birdMaterials.length - 0.01));
            addedObjs[index].getObject3D().traverse((asset) => {
                if(!(asset instanceof Mesh))
                    return;
                let mesh = asset as Mesh;
                mesh.material = this.birdMaterials[randColorId];
            });
        }
    }

    //Called when we are ready to display the fishes demo
    private setupFishesDemo()
    {
        this.seaSkybox!.visible = true;
        this.aquariumObstacles!.visible = true;
        this.spawnBoids(this.fishMeshes, this.fishAnims, this.settings.boidCount, 0.25, 0.35, this.spawnDistance, 3.0, 5.0);
    }

    //Called when we change the boidCount slider. Should despawn/spawn more boids depending on it's new value
    private updateBoidCount()
    {
        //Safety checks to make sure the user didn't change the slider before all resources are fully loaded
        //Needs to match the check from onResourceLoaded
        if(this.settings.currentDemo == "Fishes" && (this.seaSkybox == undefined || this.aquariumObstacles == undefined || this.fishMeshes.length < this.fishesToLoad.length))
            return;
        else if(this.settings.currentDemo == "Birds" && (this.bird == undefined || this.skybox == undefined))
            return;

        let diff = this.settings.boidCount - this.boids.length;
        if(diff < 0)
        {
            //If we want less boids now, discard them and remove from where they were referenced
            for (let index = 0; index < -diff; ++index)
            {
                this.boids[index].destroy();
                let obj = this.boids[index].getObject3D();
                this.scene.remove(obj);
                ThreeHelpers.disposeObject(obj);
            }
            this.boids.splice(0, -diff);
        }
        else if (diff > 0)
        {
            //If we want more boids now, spawn new ones
            //First of all decide what settings we are going to use to spawn them depending on the current demo
            let mesh: Object3D[] = [this.cone!];
            let anim: AnimationClip[] = [];
            let settings: BoidSpawnSettings = this.spawnSettings.Cones;
            if(this.settings.currentDemo == "Birds")
            {
                mesh[0] = this.bird!;
                if(this.birdAnim != undefined)
                    anim.push(this.birdAnim);
                settings = this.spawnSettings.Birds;
            }
            else if(this.settings.currentDemo == "Fishes")
            {
                mesh = this.fishMeshes;
                anim = this.fishAnims;
                settings = this.spawnSettings.Fishes;
            }

            //Spawn the boids
            let addedObjs = this.spawnBoids(mesh, anim, diff, settings.minScale, settings.maxScale, this.spawnDistance, settings.minSpeed, settings.maxSpeed);
            if(this.settings.currentDemo == "Birds")
            {
                //Pick a random material for each bird, to add some variation
                for(let index = 0; index < addedObjs.length; ++index)
                {
                    let randColorId = Math.floor(Math.random() * (this.birdMaterials.length - 0.01));
                    addedObjs[index].getObject3D().traverse((asset) => {
                        if(!(asset instanceof Mesh))
                            return;
                        let mesh = asset as Mesh;
                        mesh.material = this.birdMaterials[randColorId];
                    });
                }
            }
        }
    }

    //Function mainly responsible for spawning & initializing boids
    private spawnBoids(objToSpawn: Object3D[], anim: AnimationClip[], count: number, minScale: number, maxScale: number, maxSpawnDistance: Vector3, animSpeedMin: number, animSpeedMax: number)
    {
        let addedObjects: Boid[] = [];
        for(let index = 0; index < count; ++index)
        {
            let meshID = Math.floor(Math.random() * (objToSpawn.length - 0.01));
            let obj = SkeletonUtils.clone(objToSpawn[meshID]); //Need to use SkeletonUtils to make sure bone hierarchy gets cloned properly
            obj.position.set(
                (Math.random() * 2.0 - 1.0) * maxSpawnDistance.x,
                (Math.random() * 2.0 - 1.0) * maxSpawnDistance.y,
                (Math.random() * 2.0 - 1.0) * maxSpawnDistance.z
            );
            let scale = minScale + Math.random() * (maxScale - minScale)
            obj.scale.set(scale, scale, scale);
            this.scene.add(obj);

            let animClip: AnimationClip | undefined = anim.length == 0 ? undefined : anim[meshID];
            let animSpeed = MathUtils.lerp(animSpeedMin, animSpeedMax, Math.random());
            let boid = new Boid(obj, animClip, animSpeed, this.limitBounds, this.raycaster, this.settings.boidSettings, this.vec3Pool);

            if(this.settings.currentDemo == "Fishes")
                boid.setPullTarget(this.pullTargetPos, this.pullTargetRadius);

            this.boids.push(boid);
            addedObjects.push(boid);
        }
        return addedObjects
    }

    //Utility function for the Birds demo. Creates multiple materials for the birds and when spawning them will pick a random one from this list
    private setupBirdMaterials()
    {
        if(this.bird == undefined)
            return;

        //Find the material reference
        let birdMat!: MeshStandardMaterial;
        this.bird.traverse((asset) => {
            if(!(asset instanceof Mesh))
                return;
            let mesh = asset as Mesh;
            birdMat = mesh.material as MeshStandardMaterial;
            birdMat.roughness = 1.0;
        });

        //Create clones of the material and set up desired color themes
        let newMat = birdMat.clone();
        newMat.color.set(1.0, 1.0, 1.0);
        this.birdMaterials.push(newMat);

        newMat = birdMat.clone();
        newMat.color.set(0.0, 1.0, 1.0);
        this.birdMaterials.push(newMat);

        newMat = birdMat.clone();
        newMat.color.set(1.0, 1.0, 0.0);
        this.birdMaterials.push(newMat);

        newMat = birdMat.clone();
        newMat.color.set(1.0, 0.25, 1.0);
        this.birdMaterials.push(newMat);
    }
}
