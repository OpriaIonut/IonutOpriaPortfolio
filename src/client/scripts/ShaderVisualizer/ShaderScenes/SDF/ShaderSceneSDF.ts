import { AmbientLight, Color, DirectionalLight, PerspectiveCamera, Scene, TextureLoader, Vector3 } from "three";
import { ShaderVisualizer } from "../../ShaderVisualizer";
import { DebugUI } from "../../../ThreeVisualizer/DebugGUI";
import { IShaderScene } from "../IShaderScene";
import { SDFPostProcessing, SDFPostProcessingUniforms } from "./Scripts/SDFPostProcessing";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";

//Handles high-level management of the scene and it's components
export class ShaderSceneSDF implements IShaderScene
{
    private scene: Scene = new Scene();
    private visualizer!: ShaderVisualizer;
    private camera!: PerspectiveCamera;

    private debugUI!: DebugUI;
    private textureLoader: TextureLoader = new TextureLoader();

    //Default properties of the camera/scene in order to reset things back to how they were before
    private defaultCameraNear: number = 0.01;
    private defaultCameraFar: number = 100.0;
    private defaultCameraPos: Vector3 = new Vector3();

    private sdfUniforms: SDFPostProcessingUniforms = {

    }

    public getScene() { return this.scene; }

    public init(visualizer: ShaderVisualizer)
    {
        this.visualizer = visualizer;
        this.camera = visualizer.cameraManager.getCamera();

        //Store current camera properties to be able to reset them later on
        this.defaultCameraFar = this.camera.far;
        this.defaultCameraNear = this.camera.near;
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


        this.visualizer.cameraManager.usePostProcessing = true;
        const volumetricCloudsPass = new ShaderPass(SDFPostProcessing.createPass(this.sdfUniforms), "u_DiffuseTex");

        this.visualizer.cameraManager.addPostProcessingPass(volumetricCloudsPass);

        //Initialize debug ui
        this.debugUI = new DebugUI();
        let guiHtml = this.debugUI.getGUIClass()!.domElement;
        let guiParent = document.getElementById("shaderVisualizer") as HTMLElement;
        guiParent.appendChild(guiHtml);
        guiHtml.style.position = "absolute";
        guiHtml.style.left = "0px";
        guiHtml.style.top = "0px";

        //Set up the current scene
        this.displayUI();
    }

    public update(deltaTime: number)
    {
        
    }

    public postRender()
    {
        
    }

    //Called when you deactivate the view, dispose & reset everything
    public hide()
    {
        this.debugUI.reset(); //Events will also unsubscribe here
    }


    private displayUI()
    {
        this.debugUI.reset();

        this.defaultCameraFar = this.camera.far;
        this.defaultCameraNear = this.camera.near;
        this.defaultCameraPos.copy(this.camera.position);
    }
}
