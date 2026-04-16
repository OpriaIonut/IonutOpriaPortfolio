import { AmbientLight, AnimationClip, Box3, BoxGeometry, BoxHelper, Color, ConeGeometry, DirectionalLight, Material, MathUtils, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, Scene, SkinnedMesh, Vector3 } from "three";
import { ShaderVisualizer } from "../../ShaderVisualizer";
import { DebugUI } from "../../../ThreeVisualizer/DebugGUI";
import { Boid } from "./Scripts/Boid";
import { ThreeHelpers } from "../../../Helper/ThreeHelpers";
import { GenericPool } from "../../../Helper/GenericPool";
import { ObstacleRaycaster } from "./Scripts/BoidRaycaster";
import { Asset3D } from "../../../../types";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils";
import { timeStats } from "../../../../client";

/*
Don't load anything until scene is ready (all demos)
Clean up and comment
Expose scripts + credits

fish: https://sketchfab.com/3d-models/fish-5a2b7976ef5c44658de22e98bf381277
bird: https://sketchfab.com/3d-models/bird-flying-animation-c221ef6d36024feab16f4f43f4974bbb
bird skybox: https://sketchfab.com/3d-models/free-skybox-basic-sky-b2a4fd1b92c248abaae31975c9ea79e2
aquarium: https://sketchfab.com/3d-models/aquarium-e954de85f1f64c7eb5657c8f644fc066
ocean skybox: https://opengameart.org/content/ocean-hdriskybox
*/

//Demo scene with the boids
//Handles high-level management of the scene and it's components
export class ShaderSceneBoids
{
    private scene: Scene = new Scene();
    private visualizer!: ShaderVisualizer;
    private camera!: PerspectiveCamera;

    private limitBounds: Box3 = new Box3();
    private boundsSize: Vector3 = new Vector3(35, 35, 60);
    private spawnDistance: Vector3 = new Vector3(30, 30, 55);
    private debugUI!: DebugUI;

    private raycaster!: ObstacleRaycaster;
    private vec3Pool!: GenericPool<Vector3>;

    private boids: Boid[] = [];

    private pullTargetPos: Vector3 = new Vector3(0.0, 3.5, 0.0);
    private pullTargetRadius: number = 20.0;

    private cone!: Object3D;

    private bird?: Object3D;
    private birdAnim?: AnimationClip;
    private birdMaterials: MeshStandardMaterial[] = [];
    private skybox?: Object3D;
    private seaSkybox?: Object3D;

    private fishesToLoad: string[] = ["Fish1.glb", "Fish2.glb", "Fish3.glb"];
    private fishMeshes: Object3D[] = [];
    private fishAnims: AnimationClip[] = [];
    private aquariumObstacles?: Object3D;

    private previousFrameTime: number = 0.0;
    private smoothedFPS: number = 0.0;
    
    private settings = {
        currentDemo: "Fishes",
        availableDemos: ["Cones", "Birds", "Fishes"],
        boidCount: 500,

        boidUpdateTime: "",
        boidAnimUpdate: "",
        fps: "",

        boidSettings: {
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

        this.camera.position.set(50, 0.0, 0.0);
        this.camera.near = 0.1;
        this.camera.far = 1000.0;
        this.camera.updateProjectionMatrix();

        //Set up lights in the scene
        let ambientLight = new AmbientLight(0xffffff, 0.25);
        this.scene.add(ambientLight);
        
        let directionalLight = new DirectionalLight(0xffffff, 3.0);
        directionalLight.position.set(10.0, 10.0, 5.0);
        this.scene.add(directionalLight);

        let boundsGeom = new BoxGeometry(this.boundsSize.x, this.boundsSize.y, this.boundsSize.z);
        let boundsMesh = new Mesh(boundsGeom, new MeshBasicMaterial({ color: 0x00ff00, wireframe: true }));
        let box = new BoxHelper(boundsMesh, 0xffff00);
        this.scene.add(box);

        this.limitBounds.setFromObject(boundsMesh);
        this.cone = new Mesh(new ConeGeometry(0.25, 0.75, 16, 1).rotateX(Math.PI * 0.5), new MeshStandardMaterial({color: 0xbbbbbb}));

        this.debugUI = new DebugUI();
        let guiHtml = this.debugUI.getGUIClass()!.domElement;
        let guiParent = document.getElementById("shaderVisualizer") as HTMLElement;
        guiParent.appendChild(guiHtml);
        guiHtml.style.position = "absolute";
        guiHtml.style.left = "0px";
        guiHtml.style.top = "0px";

        for(let index = 0; index < this.fishesToLoad.length; ++index)
        {
            let path = "models/ShaderProjects/Boids/" + this.fishesToLoad[index];
            this.visualizer.objectLoader.loadModel(path, (model: Asset3D) => {
                this.fishMeshes.push(model.model);
                this.fishAnims.push(model.animations[0]);
                if(this.settings.currentDemo == "Fishes")
                    this.setupFishesDemo();
            }, () => {});
        }

        this.displayUI();
        this.changeScene();
    }

    public update(deltaTime: number)
    {
        let boidsUpdateStart = performance.now();
        for (let index = 0; index < this.boids.length; ++index)
        {
            this.boids[index].UpdateBoid(this.boids);
            // this.boids[index].UpdateDebugRays();
        }
        this.settings.boidUpdateTime = `${(performance.now() - boidsUpdateStart).toFixed(2)}ms`;

        let boidAnimStart = performance.now();
        for (let index = 0; index < this.boids.length; ++index)
        {
            this.boids[index].Animate();
        }
        this.settings.boidAnimUpdate = `${(performance.now() - boidAnimStart).toFixed(2)}ms`;

        let instantFPS = 1.0 / (timeStats.currentTime - this.previousFrameTime);
        this.smoothedFPS = this.smoothedFPS ? (this.smoothedFPS * 0.9 + instantFPS * 0.1) : instantFPS;
        this.settings.fps = `${(this.smoothedFPS).toFixed(2)}`;
        this.previousFrameTime = timeStats.currentTime;
    }

    //Called when you deactivate the view, dispose & reset everything
    public hide()
    {
        
    }

    public getScene() { return this.scene; }

    private displayUI()
    {
        this.debugUI.reset();
        this.debugUI.addDropdown("", this.settings, "currentDemo", this.settings.availableDemos, "Current Demo", () => { this.changeScene(); });

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

    private changeScene()
    {
        this.displayUI();
        for (let index = 0; index < this.boids.length; ++index)
        {
            this.boids[index].Destroy();
            let obj = this.boids[index].getObject3D();
            this.scene.remove(obj);
            ThreeHelpers.disposeObject(obj);
        }
        this.boids = [];

        if(this.skybox)
            this.skybox.visible = false;
        if(this.seaSkybox)
            this.seaSkybox.visible = false;
        if(this.aquariumObstacles)
            this.aquariumObstacles.visible = false;

        switch(this.settings.currentDemo)
        {
            case "Cones":
                this.setupConeDemo();
                break;
            case "Birds":
                this.setupBirdsDemo();
                break;
            case "Fishes":
                this.setupFishesDemo();
                break;
        }
    }

    private setupConeDemo()
    {
        this.spawnBoids([this.cone], [], this.settings.boidCount, 0.75, 1.0, this.spawnDistance, 0.75, 1.25);
    }

    private setupBirdsDemo()
    {
        if(this.skybox == undefined)
        {
            this.visualizer.objectLoader.loadModel("models/ShaderProjects/Boids/Skybox.glb", (model: Asset3D) => {
                this.skybox = model.model;
                this.skybox.rotateY(-Math.PI / 2.0);
                this.scene.add(this.skybox);
            }, () => {});
        }
        else
            this.skybox.visible = true;

        if(this.bird == undefined)
        {
            this.visualizer.objectLoader.loadModel("models/ShaderProjects/Boids/Bird.glb", (model: Asset3D) => {
                this.bird = model.model;
                this.bird.name = "Bird";
                this.birdAnim = model.animations[0];

                let birdMat!: MeshStandardMaterial;
                this.bird.traverse((asset) => {
                    if(!(asset instanceof Mesh))
                        return;
                    let mesh = asset as Mesh;
                    birdMat = mesh.material as MeshStandardMaterial;
                    birdMat.roughness = 1.0;
                });
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

                this.setupBirdsDemo();
            }, () => {});
            return;
        }

        let anim = [];
        if(this.birdAnim != undefined)
            anim.push(this.birdAnim);
        let addedObjs = this.spawnBoids([this.bird], anim, this.settings.boidCount, 0.5, 0.75, this.spawnDistance, 0.75, 1.25);
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

    private setupFishesDemo()
    {
        if(this.fishMeshes.length < this.fishesToLoad.length)
            return;

        if(this.seaSkybox == undefined)
        {
            this.visualizer.objectLoader.loadModel("models/ShaderProjects/Boids/SeaSkybox.glb", (model: Asset3D) => {
                this.seaSkybox = model.model;
                this.seaSkybox.receiveShadow = false;
                this.seaSkybox.castShadow = false;
                let mesh = this.seaSkybox.children[0] as Mesh
                let mat = mesh.material as MeshStandardMaterial;
                mesh.material = new MeshBasicMaterial().copy(mat);
                this.seaSkybox.rotateX(Math.PI);
                this.scene.add(this.seaSkybox);
            }, () => {});
        }
        else
            this.seaSkybox.visible = true;

        if(this.aquariumObstacles == undefined)
        {
            this.visualizer.objectLoader.loadModel("models/ShaderProjects/Boids/AquariumObstacles.glb", (model: Asset3D) => {
                this.aquariumObstacles = model.model;
                this.aquariumObstacles.scale.set(17.5, 17.5, 17.5);
                this.scene.add(this.aquariumObstacles);
                this.raycaster.addObstacle(this.aquariumObstacles);
            }, () => {});
            this.visualizer.objectLoader.loadModel("models/ShaderProjects/Boids/AquariumCover.glb", (model: Asset3D) => {
                let aquariumCover = model.model;
                aquariumCover.scale.set(17.5, 17.5, 17.5);
                let mat = (aquariumCover.children[0] as Mesh).material as MeshStandardMaterial;
                mat.color.set(0.25, 1.0, 1.0);
                // this.scene.add(aquariumCover);
            }, () => {});
        }
        else
            this.aquariumObstacles.visible = true;

        this.spawnBoids(this.fishMeshes, this.fishAnims, this.settings.boidCount, 0.25, 0.35, this.spawnDistance, 3.0, 5.0);
    }

    private updateBoidCount()
    {
        let diff = this.settings.boidCount - this.boids.length;
        if(diff < 0)
        {
            //If we have less boids now, discard them and remove from where they were referenced
            for (let index = 0; index < -diff; ++index)
            {
                this.boids[index].Destroy();
                let obj = this.boids[index].getObject3D();
                this.scene.remove(obj);
                ThreeHelpers.disposeObject(obj);
            }
            this.boids.splice(0, -diff);
        }
        else if (diff > 0)
        {
            let mesh: Object3D[] = [this.cone];
            let anim: AnimationClip[] = [];
            let animSpeedMin: number = 0.75;
            let animSpeedMax: number = 1.25;
            let scaleMin: number = 0.75;
            let scaleMax: number = 1.0;
            if(this.settings.currentDemo == "Birds")
            {
                mesh[0] = this.bird!;
                animSpeedMin = 0.75;
                animSpeedMax = 1.25;
                scaleMin = 0.5;
                scaleMax = 0.75;
                if(this.birdAnim != undefined)
                    anim.push(this.birdAnim);
            }
            else if(this.settings.currentDemo == "Fishes")
            {
                mesh = this.fishMeshes;
                anim = this.fishAnims;
                animSpeedMin = 3.0;
                animSpeedMax = 5.0;
                scaleMin = 0.25;
                scaleMax = 0.35;
            }

            //If we have more boids now, spawn new ones and initialize them
            let addedObjs = this.spawnBoids(mesh, anim, diff, scaleMin, scaleMax, this.spawnDistance, animSpeedMin, animSpeedMax);
            if(this.settings.currentDemo == "Birds")
            {
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

    private spawnBoids(objToSpawn: Object3D[], anim: AnimationClip[], count: number, minScale: number, maxScale: number, maxSpawnDistance: Vector3, animSpeedMin: number, animSpeedMax: number)
    {
        let addedObjects: Boid[] = [];
        for(let index = 0; index < count; ++index)
        {
            let meshID = Math.floor(Math.random() * (objToSpawn.length - 0.01));
            let obj = SkeletonUtils.clone(objToSpawn[meshID]);
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
                boid.SetPullTarget(this.pullTargetPos, this.pullTargetRadius);
            this.boids.push(boid);
            addedObjects.push(boid)

            // if(index == 0)
            //     boid.DrawDebugRays(this.scene);
        }
        return addedObjects
    }
}
