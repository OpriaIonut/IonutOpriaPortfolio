import * as THREE from "three";
import { CameraManager, lutMap } from "./CameraManager";
import { ThreeModelConfig } from "./ThreeModelsConfig";
import { ObjectLoader } from "./ObjectLoader";
import { Asset3D, PostProcessingConfig, ThreeSceneConfig } from "../../types";
import { DebugUI } from "./DebugGUI";
import { threeDebugGUI } from "../../client";

export class ThreeModelView
{
    private _panel: HTMLDivElement;
    private _cameraManager: CameraManager;
    private _objectLoader: ObjectLoader;

    private _currentModel?: THREE.Object3D;
    private _currentModelName: string = "";
    private _currentProgressBar?: HTMLDivElement;

    private _gui!: DebugUI;

    private _debugPostSettings: PostProcessingConfig = {
        _bloomRadius: 0.05,
        _bloomStrength: 1.0,
        _bloomThreshold: 1.0,
        _chromaAberrationLength: 0.05,
        _chromaAberrationRedOut: false,
        _vignetteOffset: 1.0,
        _vignetteDarkness: 1.0,
        _lutName: "Bourbon 64.CUBE",
        _lutIntensity: 0.0
    }
    private _debugSceneConfig: ThreeSceneConfig = {
        _backgroundColor: new THREE.Color(0xffffff),
        _directionalIntensity: 3.0,
        _litLighting: true,
        _maxZoom: 10.0,
        _minZoom: 0.1,
        _ambientIntensity: 1.0,
        _lightColor: new THREE.Color(0xffffff)
    }

    constructor()
    {
        this._panel = document.createElement("div");
        this._panel.id = "threeModelViewParent";
        this._panel.style.display = "none";
        document.body.appendChild(this._panel);

        let viewPanel = document.createElement("div");
        viewPanel.id = "threeModelView";
        viewPanel.className = "fullwidth";
        this._panel.appendChild(viewPanel);

        let canvasElem = document.createElement("canvas");
        canvasElem.className = "fullres";
        viewPanel.appendChild(canvasElem);

        this._panel.onclick = () => { this.hideView(); };
        viewPanel.onclick = (event: any) => { event.stopPropagation(); };

        this._cameraManager = new CameraManager(canvasElem);
        this._objectLoader = new ObjectLoader();

        this.onModelLoaded = this.onModelLoaded.bind(this);
        this.onModelProgress = this.onModelProgress.bind(this);

        if(threeDebugGUI)
            this.createDebugUI();
    }

    private createDebugUI()
    {
        this.onDebugUIChanged = this.onDebugUIChanged.bind(this);
        this._gui = new DebugUI();

        this._gui.addSlider("", this._debugPostSettings, "_bloomRadius", 0.0, 1.0, "Bloom Radius", this.onDebugUIChanged);
        this._gui.addSlider("", this._debugPostSettings, "_bloomStrength", 0.0, 3.0, "Bloom Strength", this.onDebugUIChanged);
        this._gui.addSlider("", this._debugPostSettings, "_bloomThreshold", 0.0, 1.0, "Bloom Threshold", this.onDebugUIChanged);
        this._gui.addSlider("", this._debugPostSettings, "_chromaAberrationLength", 0.0, 0.25, "CHA Length", this.onDebugUIChanged);
        this._gui.addSlider("", this._debugPostSettings, "_vignetteOffset", 0.0, 1.0, "Vignette Offset", this.onDebugUIChanged);
        this._gui.addSlider("", this._debugPostSettings, "_vignetteDarkness", 0.0, 1.0, "Vignette Darkness", this.onDebugUIChanged);

        this._gui.addCheckbox("", this._debugPostSettings, "_chromaAberrationRedOut", "Red Out", this.onDebugUIChanged);
    
        this._gui.addSlider("", this._debugSceneConfig, "_ambientIntensity", 0.0, 3.0, "Ambient", this.onDebugUIChanged);
        this._gui.addSlider("", this._debugSceneConfig, "_directionalIntensity", 0.0, 10.0, "Directional", this.onDebugUIChanged);

        this._gui.addColorPicker("", this._debugSceneConfig, "_lightColor", "LightColor", (value: any) => { this._debugSceneConfig._lightColor.setStyle(value); this.onDebugUIChanged(); });
        // this._gui.addColorPicker("", this._sceneConfig, "_backgroundColor", "BG Color", (value: any) => { this._sceneConfig._backgroundColor.setStyle(value); this.onDebugUIChanged(); });

        this._gui.addSlider("", this._debugSceneConfig, "_minZoom", 0.0, 3.0, "MinZoom", this.onDebugUIChanged);
        this._gui.addSlider("", this._debugSceneConfig, "_maxZoom", 0.0, 10.0, "MaxZoom", this.onDebugUIChanged);

        let lutNames = Object.keys(lutMap);
        this._gui.addDropdown("", this._debugPostSettings, "_lutName", lutNames, "Lut", this.onDebugUIChanged);
        this._gui.addSlider("", this._debugPostSettings, "_lutIntensity", 0.0, 1.0, "Lut Intensity", this.onDebugUIChanged);
    }

    private onDebugUIChanged()
    {
        this._cameraManager.applyPostProcessing(this._debugPostSettings);
        this._cameraManager.applySceneConfig(this._debugSceneConfig);
    }

    public activateView(modelName: string, targetProgressBar: HTMLDivElement)
    {
        let config = ThreeModelConfig[modelName];
        this._currentModelName = modelName;
        this._currentProgressBar = targetProgressBar;

        this._cameraManager.applySceneConfig(config.sceneConfig);
        this._cameraManager.applyPostProcessing(config.postProcessing);

        this._debugPostSettings._bloomRadius = config.postProcessing._bloomRadius;
        this._debugPostSettings._bloomStrength = config.postProcessing._bloomStrength;
        this._debugPostSettings._bloomThreshold = config.postProcessing._bloomThreshold;
        this._debugPostSettings._chromaAberrationLength = config.postProcessing._chromaAberrationLength;
        this._debugPostSettings._chromaAberrationRedOut = config.postProcessing._chromaAberrationRedOut;
        this._debugPostSettings._vignetteDarkness = config.postProcessing._vignetteDarkness;
        this._debugPostSettings._vignetteOffset = config.postProcessing._vignetteOffset;
        this._debugPostSettings._lutName = config.postProcessing._lutName;
        this._debugPostSettings._lutIntensity = config.postProcessing._lutIntensity;
        
        this._debugSceneConfig._ambientIntensity = config.sceneConfig._ambientIntensity;
        this._debugSceneConfig._backgroundColor = config.sceneConfig._backgroundColor;
        this._debugSceneConfig._directionalIntensity = config.sceneConfig._directionalIntensity;
        this._debugSceneConfig._lightColor = config.sceneConfig._lightColor;
        this._debugSceneConfig._minZoom = config.sceneConfig._minZoom;
        this._debugSceneConfig._maxZoom = config.sceneConfig._maxZoom;

        this._cameraManager.resetCamera();
        this._objectLoader.loadModel(config.path, this.onModelLoaded, this.onModelProgress);
    }

    public hideView()
    {
        this._panel.style.display = "none";
        if(this._currentModel !== undefined)
        {
            this._cameraManager.scene.remove(this._currentModel);
            this._currentModel = undefined;
        }
    }

    public update(deltaTime: number)
    {
        if(this._panel.style.display == "block")
        {
            this._cameraManager.update(deltaTime);
        }
    }

    private onModelLoaded(asset: Asset3D)
    {
        this._panel.style.display = "block";
        this._currentModel = asset.model;
        let scale = ThreeModelConfig[this._currentModelName].scale;
        this._currentModel.scale.set(scale, scale, scale);
        this._currentModel.updateMatrixWorld();
        this._cameraManager.scene.add(this._currentModel);

        //Position model in center of the screen
        var bbox = new THREE.Box3().setFromObject(this._currentModel);
        let center = new THREE.Vector3();
        bbox.getCenter(center);
        this._cameraManager.controls.target = center;
        this._cameraManager.camera.position.copy(ThreeModelConfig[this._currentModelName].cameraPos);
    }

    private onModelProgress(bytesLoaded: number)
    {
        let totalBytes = ThreeModelConfig[this._currentModelName].totalBytes;
        let progress = bytesLoaded / totalBytes;

        if(this._currentProgressBar !== undefined)
            this._currentProgressBar.style.width = `${progress * 100}%`;
    }
}
