import { Scene, WebGLRenderer, Vector3, PerspectiveCamera, NoToneMapping, Camera, Color, Vector2, TextureLoader, AmbientLight, DirectionalLight, Texture } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";
import { VignetteShader } from "three/examples/jsm/shaders/VignetteShader";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { LUTPass } from "three/examples/jsm/postprocessing/LUTPass";
import { LUTCubeLoader } from "three/examples/jsm/loaders/LUTCubeLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { PostProcessingConfig, ThreeSceneConfig } from "../../types";
import { ChromaticAberrationsShader } from "./Shaders/ChromaticAberrationsShader";

const rightDir = new Vector3(1, 0, 0);
const upDir = new Vector3(0, 1, 0);

export const lutMap: any = {
    'Bourbon 64.CUBE': null,
    'Chemical 168.CUBE': null,
    // 'Clayton 33.CUBE': null,
    // 'Cubicle 99.CUBE': null,
    'Remy 24.CUBE': null
};

export class CameraManager
{
    private _canvas: HTMLCanvasElement;

    private _renderer: WebGLRenderer | undefined;
    private _camera: PerspectiveCamera | undefined;
    private _scene: Scene = new Scene();

    private _effectComposer: EffectComposer | undefined;
    private _renderPass: RenderPass | undefined;
    private _fxaaPass: ShaderPass | undefined;
    private _bloomPass: UnrealBloomPass | undefined;
    private _chromaticAberrationsPass: ShaderPass | undefined;
    private _lutPass: LUTPass | undefined;
    private _vignettePass: ShaderPass | undefined;

    private _cameraForward: Vector3 = new Vector3();
    private _cameraRight:  Vector3 = new Vector3();
    private _cameraUp: Vector3 = new Vector3();

    private _ambientLight: THREE.AmbientLight;
    private _directionalLight: THREE.DirectionalLight;
    private _directionalLightBasePosition: Vector3 = new Vector3(10, 10, 10);

    private _controls: OrbitControls | undefined;

    public isMobile: boolean = false;
    public usePostProcessing: boolean = true;

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
            powerPreference: "high-performance"
        });
        this._renderer.shadowMap.enabled = false;
        this._renderer.toneMapping = NoToneMapping;
        
        this._scene = new Scene();
        // new TextureLoader().load("images/model-bg/dark-dirty.jpg", (texture) => {
        //     this._scene.background = texture;
        // });

        this._ambientLight = new AmbientLight(0xffffff, 0.5);
        this._directionalLight = new DirectionalLight(0xffffff, 1.0);
        this._directionalLight.position.copy(this._directionalLightBasePosition);

        this.scene.add(this._ambientLight);
        this.scene.add(this._directionalLight);

        let aspect = window.innerWidth / window.innerHeight;
        this._camera = new PerspectiveCamera(40, aspect, 0.01, 100);

        this._effectComposer = new EffectComposer(this._renderer);
        
        this._renderPass = new RenderPass(this._scene, this._camera);
        this._fxaaPass = new ShaderPass(FXAAShader);
        this._bloomPass = new UnrealBloomPass(new Vector2(), 0, 0, 1.0);
        this._chromaticAberrationsPass = new ShaderPass(ChromaticAberrationsShader);
        this._lutPass = new LUTPass({lut: lutMap['Bourbon 64.CUBE'], intensity: 0});
        this._vignettePass = new ShaderPass(VignetteShader);

        this._effectComposer.addPass(this._renderPass);
        this._effectComposer.addPass(this._fxaaPass);
        this._effectComposer.addPass(this._bloomPass);
        this._effectComposer.addPass(this._chromaticAberrationsPass);
        this._effectComposer.addPass(this._lutPass);
        this._effectComposer.addPass(this._vignettePass);

        this._controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.onResize = this.onResize.bind(this);
        window.addEventListener('resize', this.onResize, false);
        this.onResize();
        this.resetCamera();

        //Load all available luts
        Object.keys(lutMap).forEach(name => {
            new LUTCubeLoader().load('luts/' + name, (result: any) => {
                lutMap[name] = result;
            });
        });

        this.refreshCameraVectors();
    }
    
    public resetCamera()
    {
        this._camera!.position.set(0, 0, 10);
        this._camera!.lookAt(0, 0, 0);
        this._controls!.position0.set(0, 0, 10);
        this._controls!.target.set(0, 0, 0);
    }

    public update(deltaTime: number)
    {
        this.refreshCameraVectors();
        this._controls?.update();

        if(this.usePostProcessing && !this.isMobile)
            this._effectComposer?.render(deltaTime);
        else
            this._renderer?.render(this._scene, this._camera as Camera);
    }

    public applySceneConfig(config: ThreeSceneConfig)
    {
        this._scene.background = new Color(config._backgroundColor);
        this._controls!.minDistance = config._minZoom;
        this._controls!.maxDistance = config._maxZoom;
        
        this._ambientLight.intensity = config._ambientIntensity;
        this._ambientLight.color.setStyle(config._lightColor.getStyle());
        this._directionalLight.intensity = config._directionalIntensity;
        this._directionalLight.color.setStyle(config._lightColor.getStyle());
    }

    public applyPostProcessing(config: PostProcessingConfig)
    {
        this._bloomPass!.strength = config._bloomStrength;
        this._bloomPass!.threshold = config._bloomThreshold;
        this._bloomPass!.radius = config._bloomRadius;

        this._vignettePass!.uniforms.offset.value = config._vignetteOffset;
        this._vignettePass!.uniforms.darkness.value = config._vignetteDarkness;

        this._chromaticAberrationsPass!.uniforms.u_rgbSplitLength.value = config._chromaAberrationLength;
        this._chromaticAberrationsPass!.uniforms.u_redChannelOut.value = config._chromaAberrationRedOut;

        this._lutPass!.intensity = config._lutIntensity;
        this._lutPass!.lut = lutMap[config._lutName].texture;
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

        if(this._fxaaPass !== undefined)
        {
            this._fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( width * window.devicePixelRatio );
            this._fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( height * window.devicePixelRatio );
        }
        if(this._bloomPass !== undefined)
        {
            this._bloomPass.resolution.set(width, height);
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

    public setDirLightAngle(angle: number)
    {
        let newVect = this._directionalLightBasePosition.clone();
        newVect.applyAxisAngle(upDir, angle);
        this._directionalLight.position.copy(newVect);
    }
}