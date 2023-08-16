import { Scene, WebGLRenderer, Vector3, PerspectiveCamera, NoToneMapping, Camera, Color } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ThreeSceneConfig } from "../../types";

const rightDir = new Vector3(1, 0, 0);
const upDir = new Vector3(0, 1, 0);

export class CameraManager
{
    private _canvas: HTMLCanvasElement;

    private _renderer: WebGLRenderer | undefined;
    private _camera: PerspectiveCamera | undefined;
    private _scene: Scene = new Scene();

    private _effectComposer: EffectComposer | undefined;
    private _renderPass: RenderPass | undefined;
    private _fxaaPass: ShaderPass | undefined;

    private _cameraForward: Vector3 = new Vector3();
    private _cameraRight:  Vector3 = new Vector3();
    private _cameraUp: Vector3 = new Vector3();

    private _controls: OrbitControls | undefined;

    public get controls(): OrbitControls { return this._controls as OrbitControls }

    public get scene() { return this._scene as Scene; }
    public get camera() { return this._camera as PerspectiveCamera; }
    public get renderer() { return this._renderer as WebGLRenderer; }
    public get effect() { return this._renderer as WebGLRenderer; }
    
    public get cameraForward() { return this._cameraForward; }
    public get cameraRight() { return this._cameraRight; }
    public get cameraUp() { return this._cameraUp; }

    constructor(canvas: HTMLCanvasElement)
    {
        this._canvas = canvas;
        this._renderer = new WebGLRenderer({
            canvas: canvas,
            powerPreference: "high-performance",
        });
        this._renderer.shadowMap.enabled = false;
        this._renderer.toneMapping = NoToneMapping;
        
        this._scene = new Scene();

        let aspect = window.innerWidth / window.innerHeight;
        this._camera = new PerspectiveCamera(40, aspect, 1, 100);

        this._effectComposer = new EffectComposer(this._renderer);
        this._renderPass = new RenderPass(this._scene, this._camera);
        this._effectComposer.addPass(this._renderPass);

        this._controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.onResize = this.onResize.bind(this);
        window.addEventListener('resize', this.onResize, false);
        this.onResize();
        this.resetCamera();

        this.refreshCameraVectors();
    }
    
    public resetCamera()
    {
        this._camera!.position.set(0, 0, 10);
        this._camera!.lookAt(0, 0, 0);
        this._controls!.position0.set(0, 0, 10);
        this._controls!.target.set(0, 0, 0);
    }

    public update()
    {
        this.refreshCameraVectors();
        this._controls?.update();
        // this._effectComposer?.render(gameApp.deltaTime);
        this._renderer?.render(this._scene, this._camera as Camera);
    }

    public applySceneConfig(config: ThreeSceneConfig)
    {
        this._scene.background = new Color(config._backgroundColor);
        this._controls!.minDistance = config._minZoom;
        this._controls!.maxDistance = config._maxZoom;
    }

    public onResize()
    {
        let width = window.innerWidth * 0.9;
        let height = window.innerHeight * 0.9;

        this._renderer?.setSize(width, height);
        this._renderer?.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this._camera!.aspect = width / height;
        this._camera!.updateProjectionMatrix();

        this._effectComposer?.setSize(width, height);
        this._effectComposer?.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        if(this._fxaaPass !== undefined)
        {
            this._fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( width * window.devicePixelRatio );
            this._fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( height * window.devicePixelRatio );
        }
    }

    public refreshCameraVectors()
    {
        this._camera?.getWorldDirection(this._cameraForward);

        this._cameraRight.copy(rightDir);
        this._camera?.localToWorld(this._cameraRight);

        this._cameraUp.copy(upDir);
        this._camera?.localToWorld(this._cameraUp);
    }
}