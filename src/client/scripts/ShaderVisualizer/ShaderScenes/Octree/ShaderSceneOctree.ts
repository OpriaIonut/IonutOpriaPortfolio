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
    private _scene: Scene = new Scene();
    private _visualizer!: ShaderVisualizer;
    private _camera!: PerspectiveCamera;

    private _debugUI!: DebugUI;
    private _textureLoader: TextureLoader = new TextureLoader();
    private _spaceshipDemo!: OctreeSpaceshipDemo;
    private _frustumCullingDemo!: OctreeFrustumCullingDemo;

    private _defaultSceneColor!: Color;
    private _defaultCameraNear: number = 0.01;
    private _defaultCameraFar: number = 100.0;
    private _defaultCameraPos: Vector3 = new Vector3();

    private _settings = {
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

    public getUISettings() { return this._settings; }
    public setBackgroundColor(color: Color) { this._visualizer._cameraManager.scene.background = color; }
    public getCamera() { return this._camera; }
    public getObjectLoader() { return this._visualizer._objectLoader; }
    public getTextureLoader() { return this._textureLoader; }
    public getScene() { return this._scene; }

    public init(visualizer: ShaderVisualizer)
    {
        this._visualizer = visualizer;
        this._camera = visualizer._cameraManager.camera;

        this._defaultCameraFar = this._camera.far;
        this._defaultCameraNear = this._camera.near;
        this._defaultSceneColor = this._visualizer._cameraManager.scene.background as Color;
        this._defaultCameraPos.copy(this._camera.position);

        this._camera.near = 0.1;
        this._camera.far = 1000;
        this._camera.updateProjectionMatrix();

        //Set up lights in the scene
        let ambientLight = new AmbientLight(0xffffff, 0.25);
        this._scene.add(ambientLight);
        
        let directionalLight = new DirectionalLight(0xffffff, 3.0);
        directionalLight.position.set(10.0, 10.0, 5.0);
        this._scene.add(directionalLight);

        this._debugUI = new DebugUI();
        let guiHtml = this._debugUI.getGUIClass()!.domElement;
        let guiParent = document.getElementById("shaderVisualizer") as HTMLElement;
        guiParent.appendChild(guiHtml);
        guiHtml.style.position = "absolute";
        guiHtml.style.left = "0px";
        guiHtml.style.top = "0px";

        this._spaceshipDemo = new OctreeSpaceshipDemo(this);
        this._frustumCullingDemo = new OctreeFrustumCullingDemo(this);

        this.displayUI();
        Octree.EnableLogs(false, true);
        this.onSceneChanged();
    }

    public update(deltaTime: number)
    {
        this._spaceshipDemo.update();
        this._frustumCullingDemo.update();
    }

    //Called when you deactivate the view, dispose & reset everything
    public hide()
    {
        this._spaceshipDemo.discardScene();
        this._frustumCullingDemo.discardScene();

        this._debugUI.reset(); //Events will also unsubscribe here
        this._visualizer._cameraManager.scene.background = this._defaultSceneColor;
        this._camera.position.copy(this._defaultCameraPos);
        this._camera.far = this._defaultCameraFar;
        this._camera.near = this._defaultCameraNear;
    }


    private displayUI()
    {
        this._debugUI.reset();
        this._debugUI.addDropdown("", this._settings, "selectedDemo", this._settings.availableDemos, "DemoScene", () => { this.onSceneChanged(); });
        this._debugUI.addCheckbox("", this._settings, "displayOctreeDebug", "Display Octree", () => { this.onDebugDisplayChanged(); });
        this._debugUI.addCheckbox("", this._settings, "displayObjectsDebug", "Display Object Bounds", () => { this.onDebugDisplayChanged(); });

        if(this._settings.selectedDemo == "Spaceships")
        {
            this._debugUI.addSlider("", this._settings, "asteroidCount", 0, 5000, "Asteroid Count", () => { this._spaceshipDemo.updateAsteroidCount(); });
            this._debugUI.addSlider("", this._settings, "spaceshipCount", 0, 1000, "Spaceship Count", () => { this._spaceshipDemo.updateSpaceshipCount(); });
            this._debugUI.addText("", this._settings, "objBoundsUpdate", "Bounds Recompute", false);
            this._debugUI.addText("", this._settings, "octreeUpdateTime", "Octree Update", false);
        }
        else if(this._settings.selectedDemo == "FrustumCulling")
        {
            this._debugUI.addSlider("", this._settings, "treeCount", 0, 10000, "Tree Count", () => { this._frustumCullingDemo.updateTreeCount(); });
            this._debugUI.addText("", this._settings, "octreeQueryTime", "Octree Query", false);
            this._debugUI.addText("", this._settings, "frustumCullingTime", "Frustum Culling", false);
        }
    }

    private onSceneChanged()
    {
        this._frustumCullingDemo.hideScene();
        this._spaceshipDemo.hideScene();
        this.displayUI();

        switch(this._settings.selectedDemo)
        {
            case "Spaceships":
                this._spaceshipDemo.setupScene();
                break;
            case "FrustumCulling":
                this._frustumCullingDemo.setupScene();
                break;
        }
    }

    private onDebugDisplayChanged()
    {
        this._frustumCullingDemo.onDebugDisplayChanged();
        this._spaceshipDemo.onDebugDisplayChanged();
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

            this._scene.add(obj);
            let octreeObj = new OctreeObj(obj, isMovable, this._settings.displayObjectsDebug ? objectsDebugVisualizer : undefined);
            newObjects.push(octreeObj);
        }
        return newObjects;
    }
}
