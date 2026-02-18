import { Camera, Color, DepthTexture, NoToneMapping, PerspectiveCamera, Scene, SRGBColorSpace, UnsignedByteType, Vector3, WebGLRenderer, WebGLRenderTarget } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FirstPersonControls } from "three/examples/jsm/controls/FirstPersonControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { Pass } from "three/examples/jsm/postprocessing/Pass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";

const rightDir = new Vector3(1, 0, 0);
const upDir = new Vector3(0, 1, 0);

export class ShaderVisualizerCamera
{
    public isMobile: boolean = false;
    public usePostProcessing: boolean = false;
    public renderPasses: Pass[] = [];
    public controls: OrbitControls | FirstPersonControls | undefined;

    private _canvas: HTMLCanvasElement;

    private _renderer: WebGLRenderer | undefined;
    private _camera: PerspectiveCamera | undefined;
    private _scene: Scene = new Scene();

    private _effectComposer: EffectComposer | undefined;

    private _cameraForward: Vector3 = new Vector3();
    private _cameraRight:  Vector3 = new Vector3();
    private _cameraUp: Vector3 = new Vector3();

    public get scene() { return this._scene as Scene; }
    public get camera() { return this._camera as PerspectiveCamera; }
    public get renderer() { return this._renderer as WebGLRenderer; }
    
    public get cameraForward() { return this._cameraForward; }
    public get cameraRight() { return this._cameraRight; }
    public get cameraUp() { return this._cameraUp; }

    constructor(canvas: HTMLCanvasElement)
    {
        this._canvas = canvas;
        this._renderer = new WebGLRenderer({
            canvas: canvas,
            powerPreference: "high-performance"
        });
        this._renderer.shadowMap.enabled = false;
        this._renderer.toneMapping = NoToneMapping;
        this._renderer.outputColorSpace = SRGBColorSpace;
        
        this._scene = new Scene();
        // new TextureLoader().load("images/model-bg/dark-dirty.jpg", (texture) => {
        //     this._scene.background = texture;
        // });
        this._scene.background = new Color(0x555555);

        let aspect = window.innerWidth / window.innerHeight;
        this._camera = new PerspectiveCamera(40, aspect, 0.01, 100);
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

        this._effectComposer = new EffectComposer(this._renderer!, postProcessingRT);
        const renderPass = new RenderPass(this._scene, this._camera!);
        this._effectComposer.addPass(renderPass);   
    }
    
    public resetCamera()
    {
        this._camera!.position.set(0, 0, 10);
        this._camera!.lookAt(0, 0, 0);
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
            this._effectComposer?.render(deltaTime);
        else
            this._renderer?.render(this._scene, this._camera as Camera);
    }

    public onResize()
    {
        let width = window.innerWidth * 0.89;
        let height = window.innerHeight * 0.9;

        this._renderer?.setSize(width, height);
        this._renderer?.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this._camera!.aspect = width / height;
        this._camera!.updateProjectionMatrix();

        this._effectComposer?.setSize(width, height);
        this._effectComposer?.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    public refreshCameraVectors()
    {
        this._camera?.getWorldDirection(this._cameraForward);

        this._cameraRight.copy(rightDir);
        this._camera?.localToWorld(this._cameraRight);

        this._cameraUp.copy(upDir);
        this._camera?.localToWorld(this._cameraUp);
    }

    public addPostProcessingPass(pass: Pass)
    {
        this._effectComposer?.addPass(pass);
    }

    public removePostProcessingPass(pass: Pass)
    {
        this._effectComposer?.removePass(pass);
    }
}