import { Camera, Color, DepthTexture, NoToneMapping, PerspectiveCamera, Scene, SRGBColorSpace, UnsignedByteType, Vector3, WebGLRenderer, WebGLRenderTarget } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { Pass } from "three/examples/jsm/postprocessing/Pass";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { FreeFlyCamera } from "./ShaderScenes/Water/FreeFlyCamera";

const rightDir = new Vector3(1, 0, 0);
const upDir = new Vector3(0, 1, 0);

export class ShaderVisualizerCamera
{
    public isMobile: boolean = false;
    public usePostProcessing: boolean = false;
    public renderPasses: Pass[] = [];
    public controls: OrbitControls | FreeFlyCamera | undefined;

    private canvas: HTMLCanvasElement;

    private renderer: WebGLRenderer | undefined;
    private camera: PerspectiveCamera | undefined;
    private scene: Scene = new Scene();

    private effectComposer: EffectComposer | undefined;

    private cameraForward: Vector3 = new Vector3();
    private cameraRight:  Vector3 = new Vector3();
    private cameraUp: Vector3 = new Vector3();

    public getScene() { return this.scene as Scene; }
    public getCamera() { return this.camera as PerspectiveCamera; }
    public getRenderer() { return this.renderer as WebGLRenderer; }
    
    public getCameraForward() { return this.cameraForward; }
    public getCameraRight() { return this.cameraRight; }
    public getCameraUp() { return this.cameraUp; }

    constructor(canvas: HTMLCanvasElement)
    {
        this.canvas = canvas;
        this.renderer = new WebGLRenderer({
            canvas: canvas,
            powerPreference: "high-performance"
        });
        this.renderer.shadowMap.enabled = false;
        this.renderer.toneMapping = NoToneMapping;
        this.renderer.outputColorSpace = SRGBColorSpace;
        
        this.scene = new Scene();
        // new TextureLoader().load("images/model-bg/dark-dirty.jpg", (texture) => {
        //     this._scene.background = texture;
        // });
        this.scene.background = new Color(0x555555);

        let aspect = window.innerWidth / window.innerHeight;
        this.camera = new PerspectiveCamera(40, aspect, 0.01, 100);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.setupPostProcessing();

        this.onResize = this.onResize.bind(this);
        window.addEventListener('resize', this.onResize, false);
        this.onResize();
        this.resetCamera();

        this.refreshCameraVectors();
    }

    private setupPostProcessing()
    {
        const postProcessingRT = new WebGLRenderTarget(
            window.innerWidth,
            window.innerHeight
        );
        postProcessingRT.depthTexture = new DepthTexture(window.innerWidth, window.innerHeight, UnsignedByteType);

        this.effectComposer = new EffectComposer(this.renderer!, postProcessingRT);
        const renderPass = new RenderPass(this.scene, this.camera!);
        this.effectComposer.addPass(renderPass);   
    }
    
    public resetCamera()
    {
        this.camera!.position.set(0, 0, 10);
        this.camera!.lookAt(0, 0, 0);
        if(this.controls instanceof OrbitControls)
        {
            this.controls!.position0.set(0, 0, 10);
            this.controls!.target.set(0, 0, 0);
        }
        else
        {
            //To do: reset fps camera
        }
    }

    public update(deltaTime: number)
    {
        this.refreshCameraVectors();
        this.controls?.update(deltaTime);

        if(this.usePostProcessing)
            this.effectComposer?.render(deltaTime);
        else
            this.renderer?.render(this.scene, this.camera as Camera);
    }

    public onResize()
    {
        let width = window.innerWidth * 0.89;
        let height = window.innerHeight * 0.9;

        this.renderer?.setSize(width, height);
        this.renderer?.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.camera!.aspect = width / height;
        this.camera!.updateProjectionMatrix();

        this.effectComposer?.setSize(width, height);
        this.effectComposer?.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    public refreshCameraVectors()
    {
        this.camera?.getWorldDirection(this.cameraForward);

        this.cameraRight.copy(rightDir);
        this.camera?.localToWorld(this.cameraRight);

        this.cameraUp.copy(upDir);
        this.camera?.localToWorld(this.cameraUp);
    }

    public addPostProcessingPass(pass: Pass)
    {
        this.effectComposer?.addPass(pass);
    }

    public removePostProcessingPass(pass: Pass)
    {
        this.effectComposer?.removePass(pass);
    }

    public changeControls(controls: OrbitControls | FreeFlyCamera)
    {
        this.controls?.dispose();
        this.controls = controls;
    }
}