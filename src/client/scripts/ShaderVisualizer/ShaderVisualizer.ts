import { IShaderScene } from "./ShaderScenes/IShaderScene";
import { getGPUTier } from "detect-gpu";
import { ShaderVisualizerCamera } from "./ShaderVisualizerCamera";
import { ShaderInspectorData } from "../../types";
import { codePrettyPrinter } from "../../client";
import { ShaderSceneMeshCutting } from "./ShaderScenes/MeshCutting/ShaderSceneMeshCutting";

export enum ShaderSceneType
{
    MeshCutting,
    ProceduralSnow
}

export class ShaderVisualizer
{
    public _currentScene?: IShaderScene; //To do: set to private when done debugging
    private _currentSceneType?: ShaderSceneType;

    private _panel!: HTMLDivElement;
    private _codePanelParent!: HTMLDivElement;
    private _codePanelHeader!: HTMLDivElement;
    private _codePanelInspector!: HTMLDivElement;
    private _codePanelBtnActivation!: HTMLButtonElement;

    private _availableShaders: ShaderInspectorData[] = [];

    public _cameraManager!: ShaderVisualizerCamera; //To do: set to private when done debugging
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
        if(this._currentScene != undefined)
        {
            this._currentScene.init(this);
            this._cameraManager.scene.add(this._currentScene.getScene());
        }

    }

    public hideView()
    {
        if(this._currentScene != undefined)
        {
            this._currentScene.hide();
            this._cameraManager.scene.remove(this._currentScene.getScene());
            this._currentScene = undefined;
        }
        this._panel.style.display = "none";
        this._codePanelParent.style.display = "none";
        this.updateCodeActivationBtnStyle();
    }

    public update(deltaTime: number)
    {
        this._cameraManager.update(deltaTime);
        if(this._currentScene != undefined)
            this._currentScene.update(deltaTime);
    }

    public addScript(scriptName: string, scriptContent: string)
    {
        let shaderBtn = document.createElement("div");
        shaderBtn.innerHTML = scriptName;
        shaderBtn.className = "shaderBtnHeader";
        shaderBtn.onclick = () => {
            let dataIndex = this.findScriptIndex(scriptName);
            if(dataIndex >= 0)
            {
                for(let index = 0; index < this._availableShaders.length; ++index)
                {
                    this._availableShaders[index].btn.className = "shaderBtnHeader";
                }
                this._codePanelInspector.innerHTML = this._availableShaders[dataIndex].code;
                this._availableShaders[dataIndex].btn.className = "shaderBtnHeaderSelected";
            }
        };
        this._codePanelHeader.appendChild(shaderBtn);

        let shaderData: ShaderInspectorData = {
            name: scriptName,
            code: codePrettyPrinter.formatCode(scriptContent),
            btn: shaderBtn
        };
        this._availableShaders.push(shaderData);
    }

    public removeScript(scriptName: string)
    {
        if(this._availableShaders.length <= 0)
            return;

        let dataIndex = this.findScriptIndex(scriptName);
        if(dataIndex >= 0)
        {
            if(this._codePanelParent.contains(this._availableShaders[dataIndex].btn))
                this._codePanelHeader.removeChild(this._availableShaders[dataIndex].btn);
            this._availableShaders.splice(dataIndex, 1);
        }
        this._codePanelInspector.innerHTML = "";
    }

    private findScriptIndex(scriptName: string)
    {
        for(let index = 0; index < this._availableShaders.length; ++index)
        {
            if(this._availableShaders[index].name == scriptName)
            {
                return index;
            }
        }
        return -1;
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
            case ShaderSceneType.MeshCutting: return new ShaderSceneMeshCutting();
            default: undefined;
        }
    }

    private updateCodeActivationBtnStyle()
    {
        this._codePanelBtnActivation.style.right = (this._codePanelParent.style.display == "none") ? "0%" : "40%";
        this._codePanelBtnActivation.style.transform = (this._codePanelParent.style.display == "none") ? "translateY(-50%) scale(-1, 1)" : "translateY(-50%) scale(1, 1)";
    }
}