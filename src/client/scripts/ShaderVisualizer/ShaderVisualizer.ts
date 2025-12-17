import { Scene } from "three";
import { IShaderScene } from "./ShaderScenes/IShaderScene";
import { getGPUTier } from "detect-gpu";
import { ShaderVisualizerCamera } from "./ShaderVisualizerCamera";
import { ShaderSceneTest } from "./ShaderScenes/ShaderSceneTest";

export enum ShaderSceneType
{
    Test,
    ProceduralSnow,
    MeshCutting
}

export class ShaderVisualizer
{
    private _currentScene?: IShaderScene;
    private _currentSceneType?: ShaderSceneType;

    private _panel!: HTMLDivElement;
    private _codePanelParent!: HTMLDivElement;
    private _codePanelHeader!: HTMLDivElement;
    private _codePanelInspector!: HTMLDivElement;
    private _codePanelBtnActivation!: HTMLButtonElement;

    private _cameraManager!: ShaderVisualizerCamera;
    // private _objectLoader: any;
    // private _materialCache: any;
    // private onModelLoaded: any;
    // private onModelProgress: any;
    private _isMobile: boolean = false;

    constructor()
    {
        this.initializeView();
    }

    public activateView(scene: ShaderSceneType)
    {
        this._panel.style.display = "block";
        this._currentScene = this.getSceneFromType(scene);
        // this._currentScene.init(this._cameraManager.scene, null, null);

    }

    public hideView()
    {
        this._panel.style.display = "none";
        if(this._currentScene != undefined)
        {
            this._currentScene.hide();
            this._currentScene = undefined;
        }
    }

    public update(deltaTime: number)
    {
        this._cameraManager.update(deltaTime);
        if(this._currentScene != undefined)
            this._currentScene.update(deltaTime);
    }

    private initializeView()
    {
        this._panel = document.createElement("div");
        this._panel.id = "shaderVisualizerParent";
        this._panel.style.display = "none";
        document.body.appendChild(this._panel);

        let viewPanel = document.createElement("div");
        viewPanel.id = "shaderVisualizer";
        viewPanel.className = "fullwidth";
        this._panel.appendChild(viewPanel);

        let canvasElem = document.createElement("canvas");
        canvasElem.className = "fullres";
        viewPanel.appendChild(canvasElem);

        this._codePanelParent = document.createElement("div");
        this._codePanelParent.id = "codePanelParent";
        this._codePanelParent.style.display = "none";
        viewPanel.appendChild(this._codePanelParent);

        this._codePanelHeader = document.createElement("div");
        this._codePanelHeader.id = "codePanelHeader";
        this._codePanelParent.appendChild(this._codePanelHeader);
        
        this._codePanelInspector = document.createElement("div");
        this._codePanelInspector.id = "codePanelInspector";
        this._codePanelParent.appendChild(this._codePanelInspector);

        this._codePanelBtnActivation = document.createElement("button");
        this._codePanelBtnActivation.id = "codePanelActivationBtn";
        this.updateCodeActivationBtnStyle();
        this._codePanelBtnActivation.onclick = () => {
            this._codePanelParent.style.display = (this._codePanelParent.style.display == "none") ? "block" : "none";
            this.updateCodeActivationBtnStyle();
        }
        viewPanel.appendChild(this._codePanelBtnActivation);

        this._panel.onclick = () => { this.hideView(); };
        viewPanel.onclick = (event: any) => { event.stopPropagation(); };

        this._cameraManager = new ShaderVisualizerCamera(canvasElem);
        // this._objectLoader = new ObjectLoader();
        // this._materialCache = new MaterialCache();

        // this.onModelLoaded = this.onModelLoaded.bind(this);
        // this.onModelProgress = this.onModelProgress.bind(this);

        this.checkStats(viewPanel);
    }

    private async checkStats(viewPanel: HTMLDivElement) 
    {
        let gpuTier = await getGPUTier();
        this._isMobile = gpuTier.isMobile == true;
        this._cameraManager.isMobile = this._isMobile;
    }

    private getSceneFromType(scene: ShaderSceneType)
    {
        switch(scene)
        {
            case ShaderSceneType.Test: return new ShaderSceneTest();
            default: undefined;
        }
    }

    private updateCodeActivationBtnStyle()
    {
        this._codePanelBtnActivation.style.right = (this._codePanelParent.style.display == "none") ? "0%" : "40%";
        this._codePanelBtnActivation.style.scale = (this._codePanelParent.style.display == "none") ? "-1" : "1";
    }
}