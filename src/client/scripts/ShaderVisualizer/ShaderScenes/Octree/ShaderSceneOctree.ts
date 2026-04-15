import { AmbientLight, Color, DirectionalLight, Object3D, PerspectiveCamera, Scene, TextureLoader, Vector3 } from "three";
import { ShaderVisualizer } from "../../ShaderVisualizer";
import { DebugUI } from "../../../ThreeVisualizer/DebugGUI";
import { Octree } from "./Scripts/Octree";
import { OctreeObj } from "./Scripts/OctreeObj";
import { OctreeVisualizer } from "./Scripts/OctreeVisualizer";
import { OctreeSpaceshipDemo } from "./Utility/OctreeSpaceshipDemo";
import { OctreeFrustumCullingDemo } from "./Utility/OctreeFrustumCullingDemo";

/* Demo scenes to build:
        Comment everything
        Display scripts on the page & add credits

spaceship model: https://sketchfab.com/3d-models/spaceship-70e786969e70447c86bc4168df8ccbcd
tree: https://sketchfab.com/3d-models/pine-tree-e52769d653cd4e52a4acff3041961e65
*/

//Handles high-level management of the scene and it's components
export class ShaderSceneOctree
{
    private scene: Scene = new Scene();
    private visualizer!: ShaderVisualizer;
    private camera!: PerspectiveCamera;

    private debugUI!: DebugUI;
    private textureLoader: TextureLoader = new TextureLoader();
    private spaceshipDemo!: OctreeSpaceshipDemo;
    private frustumCullingDemo!: OctreeFrustumCullingDemo;

    private defaultSceneColor!: Color;
    private defaultCameraNear: number = 0.01;
    private defaultCameraFar: number = 100.0;
    private defaultCameraPos: Vector3 = new Vector3();

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
        frustumCullingTime: ""
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

        this.defaultCameraFar = this.camera.far;
        this.defaultCameraNear = this.camera.near;
        this.defaultSceneColor = this.visualizer.cameraManager.getScene().background as Color;
        this.defaultCameraPos.copy(this.camera.position);

        this.camera.near = 0.1;
        this.camera.far = 1000;
        this.camera.updateProjectionMatrix();

        //Set up lights in the scene
        let ambientLight = new AmbientLight(0xffffff, 0.25);
        this.scene.add(ambientLight);
        
        let directionalLight = new DirectionalLight(0xffffff, 3.0);
        directionalLight.position.set(10.0, 10.0, 5.0);
        this.scene.add(directionalLight);

        this.debugUI = new DebugUI();
        let guiHtml = this.debugUI.getGUIClass()!.domElement;
        let guiParent = document.getElementById("shaderVisualizer") as HTMLElement;
        guiParent.appendChild(guiHtml);
        guiHtml.style.position = "absolute";
        guiHtml.style.left = "0px";
        guiHtml.style.top = "0px";

        this.spaceshipDemo = new OctreeSpaceshipDemo(this);
        this.frustumCullingDemo = new OctreeFrustumCullingDemo(this);

        this.displayUI();
        Octree.enableLogs(false, true);
        this.onSceneChanged();
    }

    public update(deltaTime: number)
    {
        this.spaceshipDemo.update();
        this.frustumCullingDemo.update();
    }

    //Called when you deactivate the view, dispose & reset everything
    public hide()
    {
        this.spaceshipDemo.discardScene();
        this.frustumCullingDemo.discardScene();

        this.debugUI.reset(); //Events will also unsubscribe here
        this.visualizer.cameraManager.getScene().background = this.defaultSceneColor;
        this.camera.position.copy(this.defaultCameraPos);
        this.camera.far = this.defaultCameraFar;
        this.camera.near = this.defaultCameraNear;
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
    }

    private onSceneChanged()
    {
        this.frustumCullingDemo.hideScene();
        this.spaceshipDemo.hideScene();
        this.displayUI();

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

    private onDebugDisplayChanged()
    {
        this.frustumCullingDemo.onDebugDisplayChanged();
        this.spaceshipDemo.onDebugDisplayChanged();
    }

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
