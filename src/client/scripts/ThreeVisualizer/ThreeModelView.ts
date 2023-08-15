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
    }

    public activateView(modelName: string)
    {
        this._panel.style.display = "block";
        this._cameraManager.applySceneConfig(ThreeModelConfig[modelName].sceneConfig);
        this._objectLoader.loadModel(ThreeModelConfig[modelName].path, this.onModelLoaded);
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
            this._cameraManager.update();
        }
    }

    private onModelLoaded(asset: Asset3D)
    {
        this._currentModel = asset.model;
        this._cameraManager.scene.add(asset.model);
    }
}