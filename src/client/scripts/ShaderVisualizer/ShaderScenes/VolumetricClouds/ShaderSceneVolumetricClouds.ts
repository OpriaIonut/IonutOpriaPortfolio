import { AmbientLight, Box3, BoxGeometry, Camera, Color, DirectionalLight, Matrix4, Mesh, MeshStandardMaterial, Scene, SphereGeometry, Vector3, Vector4 } from "three";
import { ShaderVisualizer } from "../../ShaderVisualizer";
import { DebugUI } from "../../../ThreeVisualizer/DebugGUI";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { VolumetricCloudsParams, VolumetricCloudsPostProcessing } from "./Materials/VolumetricCloudsPostProcessing";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass";

//Demo scene with the volumetric clouds
//Handles high-level management of the scene and it's components
export class ShaderSceneVolumetricClouds
{
    private _scene: Scene = new Scene();
    private _visualizer!: ShaderVisualizer;
    private _camera!: Camera;

    private _debugUI!: DebugUI;

    private _settings = {
        scale: { value: 5.1 },
        octaves: { value: 3.0 },
        persistance: { value: 3.6 },
        detailNoiseWeight: { value: 0.5 },

        cloudOffset: { value: new Vector3() },
        cloudScale: { value: 2.0 },
        densityThreshold: { value: 0.6 },
        densityMultiplier: { value: 1.0 },
        numSteps: { value: 4 },
        
        lightColor: { value: new Color(1, 1, 1) },
        lightPos: { value: new Vector3(50, 50, 50) },

        lightStep: { value: 3.0 },
        lightAbsorb: { value: 0.38 },
        
        lightAbsorptionThroughCloud: { value: 0.75 },
        lightAbsorptionTowardSun: { value: 1.2 },
        darknessThreshold: { value: 0.05 }
    }

    private _volumetricCloudsParams!: VolumetricCloudsParams;

    public init(visualizer: ShaderVisualizer)
    {
        this._visualizer = visualizer;
        this._camera = visualizer._cameraManager.camera;

        this._camera.position.set(50, 0.0, 0.0);

        //Set up lights in the scene
        let ambientLight = new AmbientLight(0xffffff, 0.25);
        this._scene.add(ambientLight);
        
        let directionalLight = new DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(10.0, 10.0, 5.0);
        this._scene.add(directionalLight);

        // let worleyMesh = new Mesh(new BoxGeometry(), WorleyNoiseMaterial.createMaterial(this._settings.scale, this._settings.octaves, this._settings.persistance));
        let worleyMesh = new Mesh(new BoxGeometry(20, 20, 30), new MeshStandardMaterial());
        // this._scene.add(worleyMesh);

        // let extraObj = new Mesh(new SphereGeometry(1), new MeshStandardMaterial());
        // extraObj.position.set(3, 3, 0);
        // this._scene.add(extraObj);

        this._volumetricCloudsParams = {
            cameraPos: this._camera.position,
            cameraForward: new Vector3(),
            containerBounds: new Box3(),
            invProjMatrix: new Matrix4(),
            invViewMat: new Matrix4(),

            noiseScale: this._settings.scale,
            noiseOctaves: this._settings.octaves,
            noisePersistance: this._settings.persistance,
            detailNoiseWeight: this._settings.detailNoiseWeight,

            cloudOffset: this._settings.cloudOffset,
            cloudScale: this._settings.cloudScale,
            densityThreshold: this._settings.densityThreshold,
            densityMultiplier: this._settings.densityMultiplier,
            numSteps: this._settings.numSteps,

            lightPos: this._settings.lightPos,
            lightColor: this._settings.lightColor,

            lightStep: this._settings.lightStep,
            lightAbsorb: this._settings.lightAbsorb,
            
            lightAbsorptionThroughCloud: this._settings.lightAbsorptionThroughCloud,
            lightAbsorptionTowardSun: this._settings.lightAbsorptionTowardSun,
            darknessThreshold: this._settings.darknessThreshold
        }
        this._camera.getWorldDirection(this._volumetricCloudsParams.cameraForward);
        this._volumetricCloudsParams.containerBounds.setFromObject(worleyMesh, true);

        this._visualizer._cameraManager.usePostProcessing = true;
        const volumetricCloudsPass = new ShaderPass(VolumetricCloudsPostProcessing.createPass(this._volumetricCloudsParams), "u_mainSceneTex");

        this._visualizer._cameraManager.addPostProcessingPass(volumetricCloudsPass);
        this._visualizer._cameraManager.addPostProcessingPass(new OutputPass());




        this._debugUI = new DebugUI();
        let guiHtml = this._debugUI.getGUIClass()!.domElement;
        let guiParent = document.getElementById("shaderVisualizer") as HTMLElement;
        guiParent.appendChild(guiHtml);
        guiHtml.style.position = "absolute";
        guiHtml.style.left = "0px";
        guiHtml.style.top = "0px";

        this._debugUI.addSlider("", this._settings.scale, "value", 1.0, 10.0, "Worley Scale");
        this._debugUI.addSlider("", this._settings.octaves, "value", 1.0, 5.0, "Worley Octaves");
        this._debugUI.addSlider("", this._settings.persistance, "value", 1.0, 5.0, "Worley Persistance");
        this._debugUI.addSlider("", this._settings.detailNoiseWeight, "value", 0.0, 1.0, "DetailNoiseWeight");
        
        // this._debugUI.addSlider("", this._settings.cloudOffset.value, "x", -5.0, 5.0, "Cloud Offset X");
        // this._debugUI.addSlider("", this._settings.cloudOffset.value, "y", -5.0, 5.0, "Cloud Offset Y");
        // this._debugUI.addSlider("", this._settings.cloudOffset.value, "z", -5.0, 5.0, "Cloud Offset Z");
        
        this._debugUI.addSlider("", this._settings.cloudScale, "value", 1.0, 10.0, "Cloud Scale");
        this._debugUI.addSlider("", this._settings.densityThreshold, "value", 0.0, 1.0, "Density Threshold");
        this._debugUI.addSlider("", this._settings.densityMultiplier, "value", 0.0, 2.0, "Density Multiplier");
        this._debugUI.addSlider("", this._settings.numSteps, "value", 1.0, 10.0, "Num Steps");
        
        // this._debugUI.addSlider("", this._settings.lightPos.value, "x", -10.0, 10.0, "LightPos X");
        // this._debugUI.addSlider("", this._settings.lightPos.value, "y", -10.0, 10.0, "LightPos Y");
        // this._debugUI.addSlider("", this._settings.lightPos.value, "z", -10.0, 10.0, "LightPos Z");
        this._debugUI.addColorPicker("", this._settings.lightColor, "value", "Light Color");
        
        this._debugUI.addSlider("", this._settings.lightStep, "value", 0.0, 10.0, "LightStep");
        this._debugUI.addSlider("", this._settings.lightAbsorb, "value", 0.0, 1.0, "LightAbsorb");

        this._debugUI.addSlider("", this._settings.lightAbsorptionThroughCloud, "value", 0.0, 1.0, "LightAbsorbCloud");
        this._debugUI.addSlider("", this._settings.lightAbsorptionTowardSun, "value", 0.0, 1.0, "LightAbsorbSun");
        this._debugUI.addSlider("", this._settings.darknessThreshold, "value", 0.0, 1.0, "DarkThreshold");
    }

    public update(deltaTime: number)
    {
        this._camera.updateMatrix();
        this._camera.getWorldDirection(this._volumetricCloudsParams.cameraForward);
        this._volumetricCloudsParams.invProjMatrix.copy(this._camera.projectionMatrixInverse);
        this._volumetricCloudsParams.invViewMat.copy(this._camera.matrixWorld);
    }

    //Called when you deactivate the view, dispose & reset everything
    public hide()
    {
        
    }

    public getScene() { return this._scene; }
}
