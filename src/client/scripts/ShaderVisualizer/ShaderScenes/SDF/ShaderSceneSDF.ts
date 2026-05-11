import { AmbientLight, BoxGeometry, Color, DirectionalLight, Matrix4, Mesh, MeshStandardMaterial, Object3D, PerspectiveCamera, Scene, TextureLoader, Vector2, Vector3, WebGLRenderer } from "three";
import { ShaderVisualizer } from "../../ShaderVisualizer";
import { DebugUI } from "../../../ThreeVisualizer/DebugGUI";
import { IShaderScene } from "../IShaderScene";
import { SDFPostProcessing, SDFPostProcessingUniforms } from "./Scripts/SDFPostProcessing";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FreeFlyCamera } from "../../../ThreeVisualizer/FreeFlyCamera";

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

    private sphereTarget!: Object3D;
    private boxTarget!: Object3D;
    private capsuleTarget!: Object3D;

    private sdfUniforms: SDFPostProcessingUniforms = {
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
            color: new Color(0xff0000)
        }},
        u_BoxData: { value: {
            pos: new Vector3(-1.25, -1.25, 0.0),
            size: 2.0,
            color: new Color(0x00ff00)
        }},
        u_CapsuleData: { value: {
            pos: new Vector3(1.25, -1.25, 0.0),
            size: 1.0,
            color: new Color(0x0000ff)
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

        this.camera.position.set(5.0, 5.0, 15.0);

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

        this.sphereTarget = this.spawnTransformControls(this.sdfUniforms.u_SphereData.value.pos);
        this.boxTarget = this.spawnTransformControls(this.sdfUniforms.u_BoxData.value.pos);
        this.capsuleTarget = this.spawnTransformControls(this.sdfUniforms.u_CapsuleData.value.pos);


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

        this.defaultCameraFar = this.camera.far;
        this.defaultCameraNear = this.camera.near;
        this.defaultCameraPos.copy(this.camera.position);
    }


    private displayUI()
    {
        this.debugUI.reset();

        this.debugUI.addFolder("Basic Shapes SDF", "");
        this.debugUI.addSlider("Basic Shapes SDF", this.sdfUniforms.u_SphereData.value, "size", 0.0, 5.0, "Sphere Radius");
        this.debugUI.addSlider("Basic Shapes SDF", this.sdfUniforms.u_BoxData.value, "size", 0.0, 5.0, "Box Size");
        this.debugUI.addSlider("Basic Shapes SDF", this.sdfUniforms.u_CapsuleData.value, "size", 0.0, 5.0, "Capsule Radius");
        this.debugUI.addSlider("Basic Shapes SDF", this.sdfUniforms.u_ShapeSmoothness, "value", 0.001, 5.0, "Shape Smoothness");
    }

    private spawnTransformControls(pos: Vector3)
    {
        let targetObj = new Object3D();
        this.scene.add(targetObj);

        let transfControls = new TransformControls(this.camera, this.renderer.domElement);
        transfControls.attach(targetObj);
        transfControls.setMode('translate');

        transfControls.addEventListener('dragging-changed', (event) => { this.onTransformControlDragChange(event); });
        this.scene.add(transfControls);

        targetObj.position.copy(pos);
        return targetObj;
    }

    private onTransformControlDragChange(event: any)
    {
        if(this.orbitControls && this.orbitControls instanceof OrbitControls)
                this.orbitControls.enabled = !event.value;
    }
}
