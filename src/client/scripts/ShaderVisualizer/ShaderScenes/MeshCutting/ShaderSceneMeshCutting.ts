import { AmbientLight, DirectionalLight, Scene } from "three";
import { ShaderVisualizer } from "../../ShaderVisualizer";
import { MeshCutterUIManager } from "./Utility/MeshCutterUIManager";
import { MeshCutterManager } from "./Utility/MeshCutterManager";
import { exposedCodeMeshCutter } from "./ExposedScripts/ExposedCodeMeshCutter";
import { exposedCodeProceduralGeometry } from "./ExposedScripts/ExposedCodeProceduralGeometry";
import { exposedCodeCutLineShader } from "./ExposedScripts/ExposedCodeCutLineShader";
import { exposedCodeCutFillMaterial } from "./ExposedScripts/ExposedCodeCutFillMaterial";
import { exposedCodeMeshCutterManager } from "./ExposedScripts/ExposedCodeMeshCutterManager";

//Demo scene with the mesh cutting project
//Handles high-level management of the scene and it's components
export class ShaderSceneMeshCutting
{
    private _scene: Scene = new Scene();
    private _visualizer!: ShaderVisualizer;

    private _uiManager!: MeshCutterUIManager;
    private _cutLogic!: MeshCutterManager;

    public init(visualizer: ShaderVisualizer)
    {
        this._visualizer = visualizer;

        //Set up lights in the scene
        let ambientLight = new AmbientLight(0xffffff, 0.25);
        this._scene.add(ambientLight);
        
        let directionalLight = new DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(10.0, 10.0, 5.0);
        this._scene.add(directionalLight);

        //Create logic scripts
        this._uiManager = new MeshCutterUIManager();
        this._cutLogic = new MeshCutterManager(this._scene);

        //Subscribe to needed events
        this._uiManager.subscribe_OnCutClicked(() => { this.runCuttingAlgoritm(); });
        this._uiManager.subscribe_OnResetClicked(() => { this.resetState(); });
        this._uiManager.subscribe_OnRandomizeCutsClicked(() => { this._cutLogic.updateCutPlanes(this._uiManager.getNumOfCutPlanes(), this._uiManager.getCutMode()); });

        this._uiManager.subscribe_OnExpandRadiusChanged(() => { this.onExpandRadiusChanged(); });
        this._uiManager.subscribe_OnCutModeChanged(() => { this._cutLogic.updateCutPlanes(this._uiManager.getNumOfCutPlanes(), this._uiManager.getCutMode()); });
        this._uiManager.subscribe_OnMeshChanged(() => { this.onMeshChanged(); });
        this._uiManager.subscribe_OnNumOfPlanesChanged(() => { this._cutLogic.updateCutPlanes(this._uiManager.getNumOfCutPlanes(), this._uiManager.getCutMode()); });
        this._uiManager.subscribe_OnFillTypeChanged(() => { this._cutLogic.updateCutMeshesMaterial(this._uiManager.getFillType(), this._uiManager.getCurrentTextureName(), this._uiManager.getFillColor()); } );
        this._uiManager.subscribe_OnFillColorChanged(() => { this._cutLogic.updateCutMeshesMaterial(this._uiManager.getFillType(), this._uiManager.getCurrentTextureName(), this._uiManager.getFillColor()); } );
        this._uiManager.subscribe_OnFillTextureChanged(() => { this.onFillTextureChanged(); });

        this._visualizer.addScript("MeshCutter.ts", exposedCodeMeshCutter);
        this._visualizer.addScript("ProceduralGeometry.ts", exposedCodeProceduralGeometry);
        this._visualizer.addScript("MeshCutterManager.ts", exposedCodeMeshCutterManager);
        this._visualizer.addScript("CutLinePreviewShader.ts", exposedCodeCutLineShader);
        this._visualizer.addScript("CutFillMaterial.ts", exposedCodeCutFillMaterial);

        //Activate base state of the scene
        this._uiManager.displayCutMenu();
        this.onFillTextureChanged();
        this.onMeshChanged();
    }

    public update(deltaTime: number)
    {

    }

    //Called when you deactivate the view, dispose & reset everything
    public hide()
    {
        this._cutLogic.reset(true);
        this._cutLogic.disposeBaseModel();
        this._uiManager.reset(); //Events will also unsubscribe here

        this._visualizer.removeScript("MeshCutter.ts");
        this._visualizer.removeScript("ProceduralGeometry.ts");
        this._visualizer.removeScript("MeshCutterManager.ts");
        this._visualizer.removeScript("CutLinePreviewShader.ts");
        this._visualizer.removeScript("CutFillMaterial.ts");
    }

    public getScene() { return this._scene; }

    //Called when you click "reset" on the ui
    private resetState()
    {
        this._cutLogic.reset(false);
        this._scene.add(this._cutLogic.getSceneBaseModel()!);
        this._uiManager.displayCutMenu();
    }

    //Called when you click "cut" on the ui, will cut the geometry and display a different menu
    public runCuttingAlgoritm()
    {
        const start = performance.now();
        this._cutLogic.runCuttingAlgoritm(this._uiManager.getCurrentTextureName());

        this._uiManager.setExpandRadius(0.05);
        this._uiManager.setCutDuration(performance.now() - start);

        this._uiManager.displayResetMenu();
    }

    //Called when you change the "expand" radius slider after the mesh is cut
    private onExpandRadiusChanged()
    {
        let expandRadius = this._uiManager.getExpandRadius();
        this._cutLogic.expandCutMeshes(expandRadius);
    }

    //Called when you change the texture selected
    private onFillTextureChanged()
    {
        let textureName = this._uiManager.getCurrentTextureName();
        this._cutLogic.updateFillTexture(textureName, this._uiManager.getFillType(), this._uiManager.getCurrentTextureName(), this._uiManager.getFillColor());
    }

    //Called when you change the mesh selected
    private onMeshChanged()
    {
        this._cutLogic.disposeBaseModel();
        this._cutLogic.reset(true);

        let meshName = this._uiManager.getCurrentMeshName();
        this._uiManager.setArtistCreditsDisplay(meshName == "City");
        this._cutLogic.loadNewMesh(meshName, () => {
            this._uiManager.displayCutMenu();
            this._cutLogic.updateCutPlanes(this._uiManager.getNumOfCutPlanes(), this._uiManager.getCutMode());
        });
    }
}
