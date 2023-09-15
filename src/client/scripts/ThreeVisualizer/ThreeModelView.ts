import * as THREE from "three";
import { CameraManager, lutMap } from "./CameraManager";
import { ThreeModelConfig } from "./ThreeModelsConfig";
import { ObjectLoader } from "./ObjectLoader";
import { Asset3D, PostProcessingConfig, ThreeSceneConfig } from "../../types";
import { DebugUI } from "./DebugGUI";
import { mouseAnim, threeDebugGUI } from "../../client";
import { ButtonsWithSelection } from "../Helper/ButtonsWithSelection";
import { MaterialCache } from "./MaterialCache";
import { HorizontalSliderWithTitle } from "../Helper/HorizontalSliderWithTitle";

export class ThreeModelView
{
    private _panel: HTMLDivElement;
    private _cameraManager: CameraManager;
    private _objectLoader: ObjectLoader;
    private _materialCache: MaterialCache;

    private _animMixer?: THREE.AnimationMixer;
    private _currentModel?: THREE.Object3D;
    private _currentAnimations: Map<string, THREE.AnimationAction> = new Map();
    private _currentModelName: string = "";
    private _currentProgressBar?: HTMLDivElement;
    private _previousAnim: string = "";

    private _trisCounter!: HTMLDivElement;
    private _poseSettings!: ButtonsWithSelection;
    private _meshSettings!: ButtonsWithSelection;
    private _lightSettings!: HorizontalSliderWithTitle;

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
        this._materialCache = new MaterialCache();

        this.onModelLoaded = this.onModelLoaded.bind(this);
        this.onModelProgress = this.onModelProgress.bind(this);

        this.createSettingsPanel(viewPanel);
        if(threeDebugGUI)
            this.createDebugUI();
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

        mouseAnim.setActive(false);
    }

    public hideView()
    {
        this._panel.style.display = "none";
        if(this._currentModel !== undefined)
        {
            this._cameraManager.scene.remove(this._currentModel);
            this._currentModel = undefined;
        }
        mouseAnim.setActive(true);
    }

    public update(deltaTime: number)
    {
        if(this._panel.style.display == "block")
        {
            this._cameraManager.update(deltaTime);
            if(this._animMixer !== undefined)
                this._animMixer.update(deltaTime);
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

        this._materialCache.registerModel(this._currentModel);
        this._meshSettings.changeSelectedButton(0);
        this._lightSettings.resetValue();

        this.findModelAnimations(asset);
        this.findModelStatistics();
    }

    private onModelProgress(bytesLoaded: number)
    {
        let totalBytes = ThreeModelConfig[this._currentModelName].totalBytes;
        let progress = bytesLoaded / totalBytes;

        if(this._currentProgressBar !== undefined)
            this._currentProgressBar.style.width = `${progress * 100}%`;
    }

    private findModelAnimations(asset: Asset3D)
    {
        this._poseSettings.clear();
        this._currentAnimations.clear();
        this._animMixer = undefined;
        this._previousAnim = "";
        let animNames = [];

        let animSettings = ThreeModelConfig[this._currentModelName].animations;
        let firstAnimIndex = 0;

        for(let index = 0; index < asset.animations.length; ++index)
        {
            animNames.push(asset.animations[index].name);
        }
        if(animNames.length > 1)
        {
            this._animMixer = new THREE.AnimationMixer(this._currentModel!);

            for(let index = 0; index < animNames.length; ++index)
            {
                let animAction = this._animMixer.clipAction(asset.animations[index]);
                if(animSettings !== undefined)
                {
                    if(animSettings.firstAnimation !== undefined && animNames[index] == animSettings.firstAnimation)
                        firstAnimIndex = index;
                    if(animSettings[animNames[index]] !== undefined)
                    {
                        animAction.setLoop(animSettings[animNames[index]].looping ? THREE.LoopRepeat : THREE.LoopOnce, 100);
                        animAction.clampWhenFinished = true;
                        animAction.timeScale = animSettings[animNames[index]].speed;
                    }
                }
                this._currentAnimations.set(animNames[index], animAction);
            }
            this._poseSettings.init(animNames, firstAnimIndex);
            this.onPoseChanged(animNames[firstAnimIndex]);
        }
    }

    private findModelStatistics()
    {
        let vertices = 0;
        let triangles = 0;
        this._currentModel!.traverseVisible((object) => {
            if ( object instanceof THREE.Mesh || object instanceof THREE.SkinnedMesh ) 
            {
                const geometry = object.geometry;
                vertices += geometry.attributes.position.count;
                if ( geometry.index !== null )
                    triangles += geometry.index.count / 3;
                else
                    triangles += geometry.attributes.position.count / 3;
            }
        });
        this._trisCounter.innerHTML = `Vertices: ${this.prettyPrintNumber(vertices)}<br>Triangles: ${this.prettyPrintNumber(triangles)}`;
    }

    private prettyPrintNumber(value: number)
    {
        let val = Math.floor(value);

        let unit = "";
        if(val > 1000)
        {
            unit = " K";
            val /= 1000;
        }
        if(val > 1000)
        {
            unit = " M";
            val /= 1000;
        }
        let result = parseFloat(val.toFixed(2)) + unit;
        return result;
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

    private createSettingsPanel(parentNode: HTMLElement)
    {
        this.onPoseChanged = this.onPoseChanged.bind(this);
        this.onModelSettingChanged = this.onModelSettingChanged.bind(this);
        this.onLightSliderChanged = this.onLightSliderChanged.bind(this);

        let settingsParent = document.createElement("div");
        settingsParent.id = "threeViewSettingsParent";
        parentNode.appendChild(settingsParent);

        //Tris + poly count
        this._trisCounter = document.createElement("div");
        this._trisCounter.className = "threeViewTrisCounter";
        settingsParent.appendChild(this._trisCounter);

        this._lightSettings = new HorizontalSliderWithTitle(settingsParent, "Light Angle", 0, 360, 0, this.onLightSliderChanged);
        this._poseSettings = new ButtonsWithSelection(settingsParent, "Mesh Poses", this.onPoseChanged);

        this._meshSettings = new ButtonsWithSelection(settingsParent, "Mesh Rendering", this.onModelSettingChanged);
        this._meshSettings.init(["Final Render", "No Post-Processing", "Base Color", "Base Color + Wireframe", "Wireframe", "NormalMap", "Matcap"], 0);

        //Close button
        let closeBtn = document.createElement("div");
        closeBtn.className = "closeBtn";
        closeBtn.innerHTML = "X";
        parentNode.appendChild(closeBtn);

        closeBtn.onclick = () => {
            this.hideView();
        }
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.cursor = 'pointer';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.cursor = 'default';
        });

        //Dowload btutton
        let btnElem = document.createElement("div");
        btnElem.id = "modelDownloadBtn";
        btnElem.innerHTML = "Download";
        settingsParent.appendChild(btnElem);

        btnElem.onclick = () => {
            this.downloadModel();
        }
        btnElem.addEventListener('mouseenter', () => {
            btnElem.style.cursor = 'pointer';
        });
        btnElem.addEventListener('mouseleave', () => {
            btnElem.style.cursor = 'default';
        });
    }

    private onModelSettingChanged(settingName: string)
    {
        this._materialCache.resetOriginalMat();
        this._cameraManager.usePostProcessing = false;

        if(settingName == "Final Render")
        {
            this._cameraManager.usePostProcessing = true;
        }
        else if(settingName == "No Post-Processing")
        {
            //Intentionally left empty
        }
        else if(settingName == "Base Color + Wireframe")
        {
            this._currentModel?.traverse((child) => {
                if(child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh)
                {
                    child.material = child.material.clone();
                    child.material.wireframe = true;
                }
            });
        }
        else if(settingName == "Wireframe")
        {
            let mat = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
            this._currentModel?.traverse((child) => {
                if(child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh)
                {
                    child.material = mat;
                }
            });
        }
        else if(settingName == "Base Color")
        {
            this._currentModel?.traverse((child) => {
                if(child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh)
                {
                    let color = child.material.color;
                    let map = child.material.map;
                    if(map == null || map == undefined)
                        map = child.material.emissiveMap;
                    if(child.material.name == "Outline" || child.material.name == "outline")
                        color = new THREE.Color(0x000000);
                    child.material = new THREE.MeshBasicMaterial({ color: color, map: map });
                }
            });
        }
        else if(settingName == "NormalMap")
        {
            this._currentModel?.traverse((child) => {
                if(child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh)
                {
                    child.material = new THREE.MeshNormalMaterial({ normalMap: child.material.normalMap });
                }
            });
        }
        else if(settingName == "Matcap")
        {
            this._currentModel?.traverse((child) => {
                if(child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh)
                {
                    child.material = new THREE.MeshMatcapMaterial({ color: 0xffffff });
                }
            });
        }
    }

    private onPoseChanged(poseName: string)
    {
        if(this._previousAnim != "")
        {
            let prevAction = this._currentAnimations.get(this._previousAnim);
            if(prevAction !== undefined)
                prevAction.fadeOut(3.0).stop();
        }

        let action = this._currentAnimations.get(poseName);
        if(action !== undefined)
            action.fadeIn(3.0).play();
        this._previousAnim = poseName;
    }

    private onLightSliderChanged(value: number)
    {
        this._cameraManager.setDirLightAngle(value * (Math.PI / 180));
    }

    private onDebugUIChanged()
    {
        this._cameraManager.applyPostProcessing(this._debugPostSettings);
        this._cameraManager.applySceneConfig(this._debugSceneConfig);
    }

    private downloadModel() 
    {
        const link = document.createElement('a');
        link.href = ThreeModelConfig[this._currentModelName].path;
        link.download = this._currentModelName + ".glb";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
