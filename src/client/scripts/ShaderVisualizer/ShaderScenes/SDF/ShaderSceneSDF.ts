import { AmbientLight, Color, DirectionalLight, Matrix4, Object3D, PerspectiveCamera, Scene, TextureLoader, Vector2, Vector3, WebGLRenderer } from "three";
import { ShaderVisualizer } from "../../ShaderVisualizer";
import { DebugUI } from "../../../ThreeVisualizer/DebugGUI";
import { IShaderScene } from "../IShaderScene";
import { SDFPostProcessing, SDFPostProcessingUniforms } from "./Scripts/SDFPostProcessing";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FreeFlyCamera } from "../../../ThreeVisualizer/FreeFlyCamera";
import { exposedCodeSDFPostProcessingFrag, exposedCodeSDFPostProcessingVert } from "./ExposedScripts/ExposedCodeSDFPostProcessing";

//Handles high-level management of the scene and it's components
export class ShaderSceneSDF implements IShaderScene
{
    private scene: Scene = new Scene();
    private visualizer!: ShaderVisualizer;
    private camera!: PerspectiveCamera;
    private renderer!: WebGLRenderer;
    private orbitControls: OrbitControls | FreeFlyCamera | undefined;

    private debugUI!: DebugUI;
    private textureLoader: TextureLoader = new TextureLoader();

    //Default properties of the camera/scene in order to reset things back to how they were before
    private defaultCameraNear: number = 0.01;
    private defaultCameraFar: number = 100.0;
    private defaultCameraPos: Vector3 = new Vector3();
    private defaultControls!: OrbitControls;

    private sphereTarget: Object3D = new Object3D();
    private boxTarget: Object3D = new Object3D();
    private capsuleTarget: Object3D = new Object3D();

    private sphereTargetControl?: TransformControls;
    private boxTargetControl?: TransformControls;
    private capsuleTargetControl?: TransformControls;

    private sdfShaderPass!: ShaderPass;

    private generalSettings = {
        currentDemo: "Terrain SDF",
        availableDemos: ["Basic Shapes", "Terrain SDF"],

        currentOperation: "Union",
        availableOperations: ["Union", "Subtraction", "Intersection"],
        
        displayTransformControls: true,
    }

    private sdfUniforms: SDFPostProcessingUniforms = {
        u_DisplayBasicShapes: { value: false },
        u_DisplayTerrain: { value: false },
        u_Operation: { value: 0 }, // 0 - union, 1 - intersection, 2 - subtraction

        u_ScreenResolution: { value: new Vector2() },
        u_CameraPos: { value: new Vector3() },
        u_CameraMatrixWorld: { value: new Matrix4() },
        u_ProjectionMatrixInverse: { value: new Matrix4() },

        u_LightDir: { value: new Vector3 },
        u_AmbientIntensity: { value: 0.25 },
        u_SceneColor: { value: new Color(0xffffff) },

        u_SphereData: { value: {
            pos: new Vector3(0.0, 1.25, 0.0),
            size: 2.0,
            color: new Color(0xcc0000)
        }},
        u_BoxData: { value: {
            pos: new Vector3(-1.25, -1.25, 0.0),
            size: 2.0,
            color: new Color(0x00cc00)
        }},
        u_CapsuleData: { value: {
            pos: new Vector3(1.25, -1.25, 0.0),
            size: 1.0,
            color: new Color(0x0000cc)
        }},
        u_TerrainData: { value: {
            hillFrequency: new Vector2(0.05, 0.1),
            hillHeight: 2.7,
            caveData: {
                octaves: 3.0,
                scale: 0.1,
                frequency: 3.0,
                amplitude: 0.43
            },
            caveThreshold: 0.425,
            caveRenderDepth: 8.0,
            terrainColor: new Color(0x78bc6a),
            caveColor: new Color(0xaa8f54)
        }},

        u_ShapeSmoothness: { value: 0.5 },

        u_DiffuseTex: { value: null }
    }

    public getScene() { return this.scene; }

    public init(visualizer: ShaderVisualizer)
    {
        this.visualizer = visualizer;
        this.camera = visualizer.cameraManager.getCamera();
        this.renderer = visualizer.cameraManager.getRenderer();
        this.orbitControls = visualizer.cameraManager.controls;

        //Store current camera properties to be able to reset them later on
        this.defaultCameraFar = this.camera.far;
        this.defaultCameraNear = this.camera.near;
        this.defaultCameraPos.copy(this.camera.position);
        this.defaultControls = this.visualizer.cameraManager.controls as OrbitControls;

        this.camera.position.set(5.0, 5.0, 15.0);

        this.sphereTarget.position.copy(this.sdfUniforms.u_SphereData.value.pos);
        this.boxTarget.position.copy(this.sdfUniforms.u_BoxData.value.pos);
        this.capsuleTarget.position.copy(this.sdfUniforms.u_CapsuleData.value.pos);

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

        this.sdfUniforms.u_LightDir.value.copy(directionalLight.target.position).sub(directionalLight.position).normalize();
        this.sdfUniforms.u_SceneColor.value.setStyle((this.visualizer.cameraManager.getScene().background as Color).getStyle());

        this.visualizer.cameraManager.usePostProcessing = true;
        this.sdfShaderPass = new ShaderPass(SDFPostProcessing.createPass(this.sdfUniforms), "u_DiffuseTex");
        this.visualizer.cameraManager.addPostProcessingPass(this.sdfShaderPass);

        //Initialize debug ui
        this.debugUI = new DebugUI();
        let guiHtml = this.debugUI.getGUIClass()!.domElement;
        let guiParent = document.getElementById("shaderVisualizer") as HTMLElement;
        guiParent.appendChild(guiHtml);
        guiHtml.style.position = "absolute";
        guiHtml.style.left = "0px";
        guiHtml.style.top = "0px";

        this.visualizer.addScript("SDFPostProcessing.vert", exposedCodeSDFPostProcessingVert);
        this.visualizer.addScript("SDFPostProcessing.frag", exposedCodeSDFPostProcessingFrag);

        //Set up the current scene
        this.setupScene();
    }

    public update(deltaTime: number)
    {
        this.sdfUniforms.u_ScreenResolution.value.set(this.renderer.domElement.width, this.renderer.domElement.height);
        this.sdfUniforms.u_CameraMatrixWorld.value.copy(this.camera.matrixWorld);
        this.sdfUniforms.u_ProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse);
        this.sdfUniforms.u_CameraPos.value.copy(this.camera.position);

        this.sdfUniforms.u_SphereData.value.pos.copy(this.sphereTarget.position);
        this.sdfUniforms.u_BoxData.value.pos.copy(this.boxTarget.position);
        this.sdfUniforms.u_CapsuleData.value.pos.copy(this.capsuleTarget.position);
    }

    public postRender()
    {
        
    }

    //Called when you deactivate the view, dispose & reset everything
    public hide()
    {
        this.debugUI.reset(); //Events will also unsubscribe here
        this.disposeData();

        this.defaultCameraFar = this.camera.far;
        this.defaultCameraNear = this.camera.near;
        this.defaultCameraPos.copy(this.camera.position);

        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.target.copy(this.defaultControls.target);
        this.orbitControls.position0.copy(this.defaultControls.position0);
        this.visualizer.cameraManager.changeControls(this.orbitControls);

        this.visualizer.cameraManager.removePostProcessingPass(this.sdfShaderPass);
        this.visualizer.cameraManager.usePostProcessing = false;

        this.visualizer.removeScript("SDFPostProcessing.vert");
        this.visualizer.removeScript("SDFPostProcessing.frag");
        this.visualizer.displayInstructions("");
    }

    private disposeData()
    {
        this.destroyTransformControls(this.sphereTargetControl, this.sphereTarget);
        this.destroyTransformControls(this.boxTargetControl, this.boxTarget);
        this.destroyTransformControls(this.capsuleTargetControl, this.capsuleTarget);

        this.sphereTargetControl = undefined;
        this.boxTargetControl = undefined;
        this.capsuleTargetControl = undefined;
    }

    private displayUI()
    {
        this.debugUI.reset();

        this.debugUI.addDropdown("", this.generalSettings, "currentDemo", this.generalSettings.availableDemos, "Current Demo", () => { this.setupScene(); });

        if(this.generalSettings.currentDemo == "Basic Shapes")
        {
            this.debugUI.addSlider("", this.sdfUniforms.u_SphereData.value, "size", 0.0, 5.0, "Sphere Radius");
            this.debugUI.addSlider("", this.sdfUniforms.u_BoxData.value, "size", 0.0, 5.0, "Box Size");
            this.debugUI.addSlider("", this.sdfUniforms.u_CapsuleData.value, "size", 0.0, 5.0, "Capsule Radius");
            this.debugUI.addSlider("", this.sdfUniforms.u_ShapeSmoothness, "value", 0.001, 5.0, "Shape Smoothness");
            this.debugUI.addDropdown("", this.generalSettings, "currentOperation", this.generalSettings.availableOperations, "Operation", () => { this.updateOperation(); });
            this.debugUI.addCheckbox("", this.generalSettings, "displayTransformControls", "Display Gizmos", () => {
                if(this.sphereTargetControl)
                    this.sphereTargetControl.visible = this.generalSettings.displayTransformControls;
                if(this.boxTargetControl)
                    this.boxTargetControl.visible = this.generalSettings.displayTransformControls;
                if(this.capsuleTargetControl)
                    this.capsuleTargetControl.visible = this.generalSettings.displayTransformControls;
            });
        }
        else if(this.generalSettings.currentDemo == "Terrain SDF")
        {
            this.debugUI.addSlider("", this.sdfUniforms.u_TerrainData.value.hillFrequency, "x", 0.0, 0.25, "Hill Frequency X");
            this.debugUI.addSlider("", this.sdfUniforms.u_TerrainData.value.hillFrequency, "y", 0.0, 0.25, "Hill Frequency Y");
            this.debugUI.addSlider("", this.sdfUniforms.u_TerrainData.value, "hillHeight", 0.0, 5.0, "Hill Height");
            this.debugUI.addSlider("", this.sdfUniforms.u_TerrainData.value.caveData, "octaves", 1.0, 5.0, "Cave Octaves");
            this.debugUI.addSlider("", this.sdfUniforms.u_TerrainData.value.caveData, "scale", 0.0, 2.0, "Cave Scale");
            this.debugUI.addSlider("", this.sdfUniforms.u_TerrainData.value.caveData, "frequency", 1.0, 5.0, "Cave Frequency");
            this.debugUI.addSlider("", this.sdfUniforms.u_TerrainData.value.caveData, "amplitude", 0.0, 1.0, "Cave Amplitude");
            this.debugUI.addSlider("", this.sdfUniforms.u_TerrainData.value, "caveThreshold", 0.0, 1.0, "Cave Threshold");
            this.debugUI.addSlider("", this.sdfUniforms.u_TerrainData.value, "caveRenderDepth", 1.0, 10.0, "Cave Render Depth");
            // this.debugUI.addColorPicker("", this.sdfUniforms.u_TerrainData.value, "terrainColor", "Terrain Color", (value) => { this.sdfUniforms.u_TerrainData.value.terrainColor.set(value); });
            // this.debugUI.addColorPicker("", this.sdfUniforms.u_TerrainData.value, "caveColor", "Cave Color", (value) => { this.sdfUniforms.u_TerrainData.value.caveColor.set(value); });
        }
    }

    private setupScene()
    {
        this.disposeData();

        this.sdfUniforms.u_DisplayBasicShapes.value = (this.generalSettings.currentDemo == "Basic Shapes");
        this.sdfUniforms.u_DisplayTerrain.value = (this.generalSettings.currentDemo == "Terrain SDF");

        if(this.generalSettings.currentDemo == "Basic Shapes")
        {
            this.camera.position.set(5.0, 5.0, 15.0);
            this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
            this.orbitControls.target.copy(this.defaultControls.target);
            this.orbitControls.position0.copy(this.defaultControls.position0);
            this.visualizer.cameraManager.changeControls(this.orbitControls);

            this.sphereTargetControl = this.spawnTransformControls(this.sphereTarget, this.sdfUniforms.u_SphereData.value.pos);
            this.boxTargetControl = this.spawnTransformControls(this.boxTarget, this.sdfUniforms.u_BoxData.value.pos);
            this.capsuleTargetControl = this.spawnTransformControls(this.capsuleTarget, this.sdfUniforms.u_CapsuleData.value.pos);

            this.visualizer.displayInstructions("Left Click - rotate camera; Scrollwheel - zoom in/out; Right click - drag the camera");
        }
        else if(this.generalSettings.currentDemo == "Terrain SDF")
        {
            let newControls = new FreeFlyCamera(this.camera, this.renderer.domElement);
            newControls.moveSpeed = 25.0;
            this.visualizer.cameraManager.changeControls(newControls);

            this.visualizer.displayInstructions("WASD - move; Right click - rotate camera");
        }

        this.displayUI();
    }

    private updateOperation()
    {
        if(this.generalSettings.currentOperation == "Union")
            this.sdfUniforms.u_Operation.value = 0;
        else if(this.generalSettings.currentOperation == "Intersection")
            this.sdfUniforms.u_Operation.value = 1;
        else if(this.generalSettings.currentOperation == "Subtraction")
            this.sdfUniforms.u_Operation.value = 2;
    }

    private spawnTransformControls(target: Object3D, pos: Vector3)
    {
        target.position.set(0.0, 0.0, 0.0);
        this.scene.add(target);

        let transfControls = new TransformControls(this.camera, this.renderer.domElement);
        transfControls.attach(target);
        transfControls.setMode('translate');

        transfControls.addEventListener('dragging-changed', (event) => { this.onTransformControlDragChange(event); });
        this.scene.add(transfControls);

        target.position.copy(pos);
        return transfControls;
    }

    private destroyTransformControls(controls: TransformControls | undefined, target: Object3D)
    {
        this.scene.remove(target);
        if(controls != undefined)
        {
            this.scene.remove(controls);
            controls.dispose();
        }
    }

    private onTransformControlDragChange(event: any)
    {
        if(this.orbitControls && this.orbitControls instanceof OrbitControls)
            this.orbitControls.enabled = !event.value;
    }
}
