import { IShaderScene } from "./ShaderScenes/IShaderScene";
import { getGPUTier } from "detect-gpu";
import { ShaderVisualizerCamera } from "./ShaderVisualizerCamera";
import { ShaderInspectorData } from "../../types";
import { codePrettyPrinter } from "../../client";
import { ShaderSceneMeshCutting } from "./ShaderScenes/MeshCutting/ShaderSceneMeshCutting";
import { ShaderSceneVolumetricClouds } from "./ShaderScenes/VolumetricClouds/ShaderSceneVolumetricClouds";
import { ShaderSceneBoids } from "./ShaderScenes/Boids/ShaderSceneBoids";
import { ShaderSceneOctree } from "./ShaderScenes/Octree/ShaderSceneOctree";
import { ObjectLoader } from "../ThreeVisualizer/ObjectLoader";
import { ShaderSceneProceduralShapes2D } from "./ShaderScenes/ProceduralShapes2D/ShaderSceneProceduralShapes2D";
import { ShaderSceneWater } from "./ShaderScenes/Water/ShaderSceneWater";

export enum ShaderSceneType
{
    MeshCutting,
    ProceduralShuriken2D,
    Boids,
    Octree,
    Water,
    VolumetricClouds
}

export class ShaderVisualizer
{
    public currentScene?: IShaderScene; //To do: set to private when done debugging
    private currentSceneType?: ShaderSceneType;

    private panel!: HTMLDivElement;
    private codePanelParent!: HTMLDivElement;
    private codePanelHeader!: HTMLDivElement;
    private codePanelInspector!: HTMLDivElement;
    private codePanelBtnActivation!: HTMLButtonElement;

    private availableShaders: ShaderInspectorData[] = [];

    public cameraManager!: ShaderVisualizerCamera; //To do: set to private when done debugging
    public objectLoader: ObjectLoader
    // private materialCache: any;
    // private onModelLoaded: any;
    // private onModelProgress: any;
    private isMobile: boolean = false;

    constructor()
    {
        this.objectLoader = new ObjectLoader();
        this.initializeView();
    }

    public activateView(scene: ShaderSceneType)
    {
        this.panel.style.display = "block";
        this.currentScene = this.getSceneFromType(scene);
        if(this.currentScene != undefined)
        {
            this.currentScene.init(this);
            this.cameraManager.getScene().add(this.currentScene.getScene());
        }

    }

    public hideView()
    {
        if(this.currentScene != undefined)
        {
            this.currentScene.hide();
            this.cameraManager.getScene().remove(this.currentScene.getScene());
            this.currentScene = undefined;
        }
        this.cameraManager.resetCamera();
        this.panel.style.display = "none";
        this.codePanelParent.style.display = "none";
        this.updateCodeActivationBtnStyle();
    }

    public update(deltaTime: number)
    {
        this.cameraManager.update(deltaTime);
        if(this.currentScene != undefined)
            this.currentScene.update(deltaTime);
    }

    public render(deltaTime: number)
    {
        this.cameraManager.render(deltaTime);
    }

    public addScript(scriptName: string, scriptContent: string, prettyPrint: boolean = true)
    {
        let shaderBtn = document.createElement("div");
        shaderBtn.innerHTML = scriptName;
        shaderBtn.className = "shaderBtnHeader";
        shaderBtn.onclick = () => {
            let dataIndex = this.findScriptIndex(scriptName);
            if(dataIndex >= 0)
            {
                for(let index = 0; index < this.availableShaders.length; ++index)
                {
                    this.availableShaders[index].btn.className = "shaderBtnHeader";
                }
                this.codePanelInspector.innerHTML = this.availableShaders[dataIndex].code;
                this.availableShaders[dataIndex].btn.className = "shaderBtnHeaderSelected";
            }
        };
        this.codePanelHeader.appendChild(shaderBtn);

        let shaderData: ShaderInspectorData = {
            name: scriptName,
            code: prettyPrint ? codePrettyPrinter.formatCode(scriptContent) : scriptContent,
            btn: shaderBtn
        };
        this.availableShaders.push(shaderData);
    }

    public removeScript(scriptName: string)
    {
        if(this.availableShaders.length <= 0)
            return;

        let dataIndex = this.findScriptIndex(scriptName);
        if(dataIndex >= 0)
        {
            if(this.codePanelParent.contains(this.availableShaders[dataIndex].btn))
                this.codePanelHeader.removeChild(this.availableShaders[dataIndex].btn);
            this.availableShaders.splice(dataIndex, 1);
        }
        this.codePanelInspector.innerHTML = "";
    }

    private findScriptIndex(scriptName: string)
    {
        for(let index = 0; index < this.availableShaders.length; ++index)
        {
            if(this.availableShaders[index].name == scriptName)
            {
                return index;
            }
        }
        return -1;
    }

    private initializeView()
    {
        this.panel = document.createElement("div");
        this.panel.id = "shaderVisualizerParent";
        this.panel.style.display = "none";
        document.body.appendChild(this.panel);

        let viewPanel = document.createElement("div");
        viewPanel.id = "shaderVisualizer";
        viewPanel.className = "fullwidth";
        this.panel.appendChild(viewPanel);

        let canvasElem = document.createElement("canvas");
        canvasElem.className = "fullres";
        viewPanel.appendChild(canvasElem);

        this.codePanelParent = document.createElement("div");
        this.codePanelParent.id = "codePanelParent";
        this.codePanelParent.style.display = "none";
        viewPanel.appendChild(this.codePanelParent);

        this.codePanelHeader = document.createElement("div");
        this.codePanelHeader.id = "codePanelHeader";
        this.codePanelParent.appendChild(this.codePanelHeader);
        
        this.codePanelInspector = document.createElement("div");
        this.codePanelInspector.id = "codePanelInspector";
        this.codePanelParent.appendChild(this.codePanelInspector);

        this.codePanelBtnActivation = document.createElement("button");
        this.codePanelBtnActivation.id = "codePanelActivationBtn";
        this.updateCodeActivationBtnStyle();
        this.codePanelBtnActivation.onclick = () => {
            this.codePanelParent.style.display = (this.codePanelParent.style.display == "none") ? "block" : "none";
            this.updateCodeActivationBtnStyle();
        }
        viewPanel.appendChild(this.codePanelBtnActivation);

        this.panel.onclick = () => { this.hideView(); };
        viewPanel.onclick = (event: any) => { event.stopPropagation(); };

        this.cameraManager = new ShaderVisualizerCamera(canvasElem);
        // this._objectLoader = new ObjectLoader();
        // this.materialCache = new MaterialCache();

        // this.onModelLoaded = this.onModelLoaded.bind(this);
        // this.onModelProgress = this.onModelProgress.bind(this);

        this.checkStats(viewPanel);
    }

    private async checkStats(viewPanel: HTMLDivElement) 
    {
        let gpuTier = await getGPUTier();
        this.isMobile = gpuTier.isMobile == true;
        this.cameraManager.isMobile = this.isMobile;
    }

    private getSceneFromType(scene: ShaderSceneType): IShaderScene | undefined
    {
        switch(scene)
        {
            case ShaderSceneType.MeshCutting: return new ShaderSceneMeshCutting();
            case ShaderSceneType.VolumetricClouds: return new ShaderSceneVolumetricClouds();
            case ShaderSceneType.Boids: return new ShaderSceneBoids();
            case ShaderSceneType.Octree: return new ShaderSceneOctree();
            case ShaderSceneType.ProceduralShuriken2D: return new ShaderSceneProceduralShapes2D();
            case ShaderSceneType.Water: return new ShaderSceneWater();
            default: undefined;
        }
    }

    private updateCodeActivationBtnStyle()
    {
        this.codePanelBtnActivation.style.right = (this.codePanelParent.style.display == "none") ? "0%" : "40%";
        this.codePanelBtnActivation.style.transform = (this.codePanelParent.style.display == "none") ? "translateY(-50%) scale(-1, 1)" : "translateY(-50%) scale(1, 1)";
    }
}