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
    private scene: Scene = new Scene();
    private visualizer!: ShaderVisualizer;
    private camera!: Camera;

    private debugUI!: DebugUI;

    private settings = {
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

    private volumetricCloudsParams!: VolumetricCloudsParams;

    public init(visualizer: ShaderVisualizer)
    {
        this.visualizer = visualizer;
        this.camera = visualizer.cameraManager.getCamera();

        this.camera.position.set(50, 0.0, 0.0);

        //Set up lights in the scene
        let ambientLight = new AmbientLight(0xffffff, 0.25);
        this.scene.add(ambientLight);
        
        let directionalLight = new DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(10.0, 10.0, 5.0);
        this.scene.add(directionalLight);

        // let worleyMesh = new Mesh(new BoxGeometry(), WorleyNoiseMaterial.createMaterial(this._settings.scale, this._settings.octaves, this._settings.persistance));
        let worleyMesh = new Mesh(new BoxGeometry(20, 20, 30), new MeshStandardMaterial());
        // this._scene.add(worleyMesh);

        // let extraObj = new Mesh(new SphereGeometry(1), new MeshStandardMaterial());
        // extraObj.position.set(3, 3, 0);
        // this._scene.add(extraObj);

        this.volumetricCloudsParams = {
            cameraPos: this.camera.position,
            cameraForward: new Vector3(),
            containerBounds: new Box3(),
            invProjMatrix: new Matrix4(),
            invViewMat: new Matrix4(),

            noiseScale: this.settings.scale,
            noiseOctaves: this.settings.octaves,
            noisePersistance: this.settings.persistance,
            detailNoiseWeight: this.settings.detailNoiseWeight,

            cloudOffset: this.settings.cloudOffset,
            cloudScale: this.settings.cloudScale,
            densityThreshold: this.settings.densityThreshold,
            densityMultiplier: this.settings.densityMultiplier,
            numSteps: this.settings.numSteps,

            lightPos: this.settings.lightPos,
            lightColor: this.settings.lightColor,

            lightStep: this.settings.lightStep,
            lightAbsorb: this.settings.lightAbsorb,
            
            lightAbsorptionThroughCloud: this.settings.lightAbsorptionThroughCloud,
            lightAbsorptionTowardSun: this.settings.lightAbsorptionTowardSun,
            darknessThreshold: this.settings.darknessThreshold
        }
        this.camera.getWorldDirection(this.volumetricCloudsParams.cameraForward);
        this.volumetricCloudsParams.containerBounds.setFromObject(worleyMesh, true);

        this.visualizer.cameraManager.usePostProcessing = true;
        const volumetricCloudsPass = new ShaderPass(VolumetricCloudsPostProcessing.createPass(this.volumetricCloudsParams), "u_mainSceneTex");

        this.visualizer.cameraManager.addPostProcessingPass(volumetricCloudsPass);
        this.visualizer.cameraManager.addPostProcessingPass(new OutputPass());




        this.debugUI = new DebugUI();
        let guiHtml = this.debugUI.getGUIClass()!.domElement;
        let guiParent = document.getElementById("shaderVisualizer") as HTMLElement;
        guiParent.appendChild(guiHtml);
        guiHtml.style.position = "absolute";
        guiHtml.style.left = "0px";
        guiHtml.style.top = "0px";

        this.debugUI.addSlider("", this.settings.scale, "value", 1.0, 10.0, "Worley Scale");
        this.debugUI.addSlider("", this.settings.octaves, "value", 1.0, 5.0, "Worley Octaves");
        this.debugUI.addSlider("", this.settings.persistance, "value", 1.0, 5.0, "Worley Persistance");
        this.debugUI.addSlider("", this.settings.detailNoiseWeight, "value", 0.0, 1.0, "DetailNoiseWeight");
        
        // this._debugUI.addSlider("", this._settings.cloudOffset.value, "x", -5.0, 5.0, "Cloud Offset X");
        // this._debugUI.addSlider("", this._settings.cloudOffset.value, "y", -5.0, 5.0, "Cloud Offset Y");
        // this._debugUI.addSlider("", this._settings.cloudOffset.value, "z", -5.0, 5.0, "Cloud Offset Z");
        
        this.debugUI.addSlider("", this.settings.cloudScale, "value", 1.0, 10.0, "Cloud Scale");
        this.debugUI.addSlider("", this.settings.densityThreshold, "value", 0.0, 1.0, "Density Threshold");
        this.debugUI.addSlider("", this.settings.densityMultiplier, "value", 0.0, 2.0, "Density Multiplier");
        this.debugUI.addSlider("", this.settings.numSteps, "value", 1.0, 10.0, "Num Steps");
        
        // this._debugUI.addSlider("", this._settings.lightPos.value, "x", -10.0, 10.0, "LightPos X");
        // this._debugUI.addSlider("", this._settings.lightPos.value, "y", -10.0, 10.0, "LightPos Y");
        // this._debugUI.addSlider("", this._settings.lightPos.value, "z", -10.0, 10.0, "LightPos Z");
        this.debugUI.addColorPicker("", this.settings.lightColor, "value", "Light Color");
        
        this.debugUI.addSlider("", this.settings.lightStep, "value", 0.0, 10.0, "LightStep");
        this.debugUI.addSlider("", this.settings.lightAbsorb, "value", 0.0, 1.0, "LightAbsorb");

        this.debugUI.addSlider("", this.settings.lightAbsorptionThroughCloud, "value", 0.0, 1.0, "LightAbsorbCloud");
        this.debugUI.addSlider("", this.settings.lightAbsorptionTowardSun, "value", 0.0, 1.0, "LightAbsorbSun");
        this.debugUI.addSlider("", this.settings.darknessThreshold, "value", 0.0, 1.0, "DarkThreshold");
    }

    public update(deltaTime: number)
    {
        this.camera.updateMatrix();
        this.camera.getWorldDirection(this.volumetricCloudsParams.cameraForward);
        this.volumetricCloudsParams.invProjMatrix.copy(this.camera.projectionMatrixInverse);
        this.volumetricCloudsParams.invViewMat.copy(this.camera.matrixWorld);
    }

    //Called when you deactivate the view, dispose & reset everything
    public hide()
    {
        
    }

    public getScene() { return this.scene; }
}
