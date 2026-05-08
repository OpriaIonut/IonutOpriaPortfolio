import { AmbientLight, Color, DirectionalLight, Object3D, PerspectiveCamera, Scene, TextureLoader, Vector3 } from "three";
import { ShaderVisualizer } from "../../ShaderVisualizer";
import { DebugUI } from "../../../ThreeVisualizer/DebugGUI";
import { Octree } from "./Scripts/Octree";
import { OctreeObj } from "./Scripts/OctreeObj";
import { OctreeVisualizer } from "./Scripts/OctreeVisualizer";
import { OctreeSpaceshipDemo } from "./Utility/OctreeSpaceshipDemo";
import { OctreeFrustumCullingDemo } from "./Utility/OctreeFrustumCullingDemo";
import { exposedCodeOctree } from "./ExposedScripts/ExposedCodeOctree";
import { exposedCodeOctreeObj } from "./ExposedScripts/ExposedCodeOctreeObj";
import { exposedCodeOctreeNode } from "./ExposedScripts/ExposedCodeOctreeNode";
import { exposedCodeOctreeHelper } from "./ExposedScripts/ExposedCodeOctreeHelper";
import { exposedCodeOctreeVisualizer } from "./ExposedScripts/ExposedCodeOctreeVisualizer";
import { exposedCodeSpaceship } from "./ExposedScripts/ExposedCodeSpaceship";
import { IShaderScene } from "../IShaderScene";
import { timeStats } from "../../../../client";

//Handles high-level management of the scene and it's components
export class ShaderSceneOctree implements IShaderScene
{
    private scene: Scene = new Scene();
    private visualizer!: ShaderVisualizer;
    private camera!: PerspectiveCamera;

    private debugUI!: DebugUI;
    private textureLoader: TextureLoader = new TextureLoader();

    //Demo scripts which hold all logic related to their respective demos
    private spaceshipDemo!: OctreeSpaceshipDemo;
    private frustumCullingDemo!: OctreeFrustumCullingDemo;

    //Default properties of the camera/scene in order to reset things back to how they were before
    private defaultSceneColor!: Color;
    private defaultCameraNear: number = 0.01;
    private defaultCameraFar: number = 100.0;
    private defaultCameraPos: Vector3 = new Vector3();

    //Settings to display proper FPS
    private previousFrameTime: number = 0.0;
    private smoothedFPS: number = 0.0;

    private settings = {
        //General
        selectedDemo: "Spaceships",
        availableDemos: ["Spaceships", "FrustumCulling"],
        displayOctreeDebug: true,
        displayObjectsDebug: true,

        //Space
        asteroidCount: 50,
        spaceshipCount: 50,
        objBoundsUpdate: "",
        octreeUpdateTime: "",

        //Frustum
        treeCount: 1000,
        octreeQueryTime: "",
        frustumCullingTime: "",
        fps: ""
    }

    public getUISettings() { return this.settings; }
    public setBackgroundColor(color: Color) { this.visualizer.cameraManager.getScene().background = color; }
    public getCamera() { return this.camera; }
    public getObjectLoader() { return this.visualizer.objectLoader; }
    public getTextureLoader() { return this.textureLoader; }
    public getScene() { return this.scene; }

    public init(visualizer: ShaderVisualizer)
    {
        this.visualizer = visualizer;
        this.camera = visualizer.cameraManager.getCamera();

        //Store current camera properties to be able to reset them later on
        this.defaultCameraFar = this.camera.far;
        this.defaultCameraNear = this.camera.near;
        this.defaultSceneColor = this.visualizer.cameraManager.getScene().background as Color;
        this.defaultCameraPos.copy(this.camera.position);

        //Set desired camera properties
        this.camera.near = 0.1;
        this.camera.far = 1000;
        this.camera.updateProjectionMatrix();

        //Set up lights in the scene
        let ambientLight = new AmbientLight(0xffffff, 0.25);
        this.scene.add(ambientLight);
        
        let directionalLight = new DirectionalLight(0xffffff, 3.0);
        directionalLight.position.set(10.0, 10.0, 5.0);
        this.scene.add(directionalLight);

        //Initialize debug ui
        this.debugUI = new DebugUI();
        let guiHtml = this.debugUI.getGUIClass()!.domElement;
        let guiParent = document.getElementById("shaderVisualizer") as HTMLElement;
        guiParent.appendChild(guiHtml);
        guiHtml.style.position = "absolute";
        guiHtml.style.left = "0px";
        guiHtml.style.top = "0px";

        //Create demo scripts
        this.spaceshipDemo = new OctreeSpaceshipDemo(this);
        this.frustumCullingDemo = new OctreeFrustumCullingDemo(this);

        //Set up the current scene
        this.displayUI();
        Octree.enableLogs(false, true);
        this.onSceneChanged();
        
        this.visualizer.addScript("OctreeObj.ts", exposedCodeOctreeObj);
        this.visualizer.addScript("Octree.ts", exposedCodeOctree);
        this.visualizer.addScript("OctreeNode.ts", exposedCodeOctreeNode);
        this.visualizer.addScript("OctreeHelper.ts", exposedCodeOctreeHelper);
        this.visualizer.addScript("OctreeVisualizer.ts", exposedCodeOctreeVisualizer);
        this.visualizer.addScript("Spaceship.ts", exposedCodeSpaceship);

        this.visualizer.addScript("Credits", `
Special thanks to the following artists for their work:

Tree: https://sketchfab.com/3d-models/pine-tree-e52769d653cd4e52a4acff3041961e65
Spaceship: https://sketchfab.com/3d-models/spaceship-70e786969e70447c86bc4168df8ccbcd
        `, false);
    }

    public update(deltaTime: number)
    {
        this.spaceshipDemo.update();
        this.frustumCullingDemo.update();

        //Calculate and display FPS. Uses a smoothing formula to make numbers easier to read
        let instantFPS = 1.0 / (timeStats.currentTime - this.previousFrameTime);
        this.smoothedFPS = this.smoothedFPS ? (this.smoothedFPS * 0.9 + instantFPS * 0.1) : instantFPS;
        this.settings.fps = `${(this.smoothedFPS).toFixed(2)}`;
        this.previousFrameTime = timeStats.currentTime;
    }

    public postRender()
    {
        
    }

    //Called when you deactivate the view, dispose & reset everything
    public hide()
    {
        //Discard everything from the scenes
        this.spaceshipDemo.discardScene();
        this.frustumCullingDemo.discardScene();

        //Reset the debug ui and the camera
        this.debugUI.reset(); //Events will also unsubscribe here
        this.visualizer.cameraManager.getScene().background = this.defaultSceneColor;
        this.camera.position.copy(this.defaultCameraPos);
        this.camera.far = this.defaultCameraFar;
        this.camera.near = this.defaultCameraNear;
        this.camera.updateProjectionMatrix();
        
        this.visualizer.removeScript("OctreeObj.ts");
        this.visualizer.removeScript("Octree.ts");
        this.visualizer.removeScript("OctreeNode.ts");
        this.visualizer.removeScript("OctreeHelper.ts");
        this.visualizer.removeScript("OctreeVisualizer.ts");
        this.visualizer.removeScript("Spaceship.ts");
        this.visualizer.removeScript("Credits");
    }


    private displayUI()
    {
        this.debugUI.reset();
        this.debugUI.addDropdown("", this.settings, "selectedDemo", this.settings.availableDemos, "DemoScene", () => { this.onSceneChanged(); });
        this.debugUI.addCheckbox("", this.settings, "displayOctreeDebug", "Display Octree", () => { this.onDebugDisplayChanged(); });
        this.debugUI.addCheckbox("", this.settings, "displayObjectsDebug", "Display Object Bounds", () => { this.onDebugDisplayChanged(); });

        if(this.settings.selectedDemo == "Spaceships")
        {
            this.debugUI.addSlider("", this.settings, "asteroidCount", 0, 5000, "Asteroid Count", () => { this.spaceshipDemo.updateAsteroidCount(); });
            this.debugUI.addSlider("", this.settings, "spaceshipCount", 0, 1000, "Spaceship Count", () => { this.spaceshipDemo.updateSpaceshipCount(); });
            this.debugUI.addText("", this.settings, "objBoundsUpdate", "Bounds Recompute", false);
            this.debugUI.addText("", this.settings, "octreeUpdateTime", "Octree Update", false);
        }
        else if(this.settings.selectedDemo == "FrustumCulling")
        {
            this.debugUI.addSlider("", this.settings, "treeCount", 0, 10000, "Tree Count", () => { this.frustumCullingDemo.updateTreeCount(); });
            this.debugUI.addText("", this.settings, "octreeQueryTime", "Octree Query", false);
            this.debugUI.addText("", this.settings, "frustumCullingTime", "Frustum Culling", false);
        }
        this.debugUI.addText("", this.settings, "fps", "FPS", false);
    }

    private onSceneChanged()
    {
        //Hide both scenes
        this.frustumCullingDemo.hideScene();
        this.spaceshipDemo.hideScene();
        this.displayUI();

        //Display the current selected scene
        switch(this.settings.selectedDemo)
        {
            case "Spaceships":
                this.spaceshipDemo.setupScene();
                break;
            case "FrustumCulling":
                this.frustumCullingDemo.setupScene();
                break;
        }
    }

    //When changing debug toggles, change them in the demos
    private onDebugDisplayChanged()
    {
        this.frustumCullingDemo.onDebugDisplayChanged();
        this.spaceshipDemo.onDebugDisplayChanged();
    }

    //Utility function to spawn objects. Called by both demos
    public spawnRandomObjects(objToSpawn: Object3D, count: number, minScale: number, maxScale: number, randomizeY: boolean, fixedY: number, maxSpawnDistance: Vector3, isMovable: boolean, objectsDebugVisualizer: OctreeVisualizer)
    {
        let newObjects: OctreeObj[] = [];
        for(let index = 0; index < count; ++index)
        {
            let obj = objToSpawn.clone();
            if(randomizeY)
            {
                obj.position.set(
                    (Math.random() * 2.0 - 1.0) * maxSpawnDistance.x,
                    (Math.random() * 2.0 - 1.0) * maxSpawnDistance.y,
                    (Math.random() * 2.0 - 1.0) * maxSpawnDistance.z
                );
            }
            else
            {
                obj.position.set(
                    (Math.random() * 2.0 - 1.0) * maxSpawnDistance.x,
                    fixedY,
                    (Math.random() * 2.0 - 1.0) * maxSpawnDistance.z
                );
            }
            let scale = minScale + Math.random() * (maxScale - minScale)
            obj.scale.set(scale, scale, scale);

            this.scene.add(obj);
            let octreeObj = new OctreeObj(obj, isMovable, this.settings.displayObjectsDebug ? objectsDebugVisualizer : undefined);
            newObjects.push(octreeObj);
        }
        return newObjects;
    }
}
