import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CameraManager } from "./CameraManager";
import { ThreeModelConfig } from "./ThreeModelsConfig";
import { ObjectLoader } from "./ObjectLoader";
import { Asset3D } from "../../types";

export class ThreeModelView
{
    private _panel: HTMLDivElement;
    private _cameraManager: CameraManager;
    private _objectLoader: ObjectLoader;

    private _currentModel?: THREE.Object3D;
    private _currentModelName: string = "";
    private _currentProgressBar?: HTMLDivElement;

    private _ambientLight: THREE.AmbientLight;
    private _directionalLight: THREE.DirectionalLight;

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

        this._ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this._directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this._directionalLight.position.set(10, 10, 10);

        this._cameraManager.scene.add(this._ambientLight);
        this._cameraManager.scene.add(this._directionalLight);
    }

    public activateView(modelName: string, targetProgressBar: HTMLDivElement)
    {
        let config = ThreeModelConfig[modelName];
        this._currentModelName = modelName;
        this._currentProgressBar = targetProgressBar;

        this._cameraManager.applySceneConfig(config.sceneConfig);
        this._cameraManager.applyPostProcessing(config.postProcessing);
        this._ambientLight.intensity = config.sceneConfig._ambientIntensity;
        this._ambientLight.color.setStyle(config.sceneConfig._lightColor);
        this._directionalLight.intensity = config.sceneConfig._directionalIntensity;
        this._directionalLight.color.setStyle(config.sceneConfig._lightColor);

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
