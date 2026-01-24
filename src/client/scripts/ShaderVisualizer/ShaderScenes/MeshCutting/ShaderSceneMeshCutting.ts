import { AmbientLight, DirectionalLight, Scene } from "three";
import { ShaderVisualizer } from "../../ShaderVisualizer";
import { MeshCutterUIManager } from "./Utility/MeshCutterUIManager";
import { MeshCutterLogic } from "./Utility/MeshCutterLogic";

export class ShaderSceneMeshCutting
{
    private _scene: Scene = new Scene();
    private _visualizer!: ShaderVisualizer;

    private _uiManager!: MeshCutterUIManager;
    private _cutLogic!: MeshCutterLogic;

    public init(visualizer: ShaderVisualizer)
    {
        this._visualizer = visualizer;

        let ambientLight = new AmbientLight(0xffffff, 0.25);
        this._scene.add(ambientLight);
        
        let directionalLight = new DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(10.0, 10.0, 5.0);
        this._scene.add(directionalLight);

        this._uiManager = new MeshCutterUIManager();
        this._cutLogic = new MeshCutterLogic(this._scene);

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

        this._uiManager.displayCutMenu();
        this.onFillTextureChanged();
        this.onMeshChanged();
    }

    public update(deltaTime: number)
    {

    }

    public hide()
    {
        this._cutLogic.reset(true);
        this._cutLogic.disposeBaseModel();
        this._uiManager.reset(); //Events will also unsubscribe here
        console.log(this._scene);
    }

    public getScene() { return this._scene; }

    private resetState()
    {
        this._cutLogic.reset(false);
        this._scene.add(this._cutLogic.getSceneBaseModel()!);
        this._uiManager.displayCutMenu();
    }

    public runCuttingAlgoritm()
    {
        const start = performance.now();
        this._cutLogic.runCuttingAlgoritm(this._uiManager.getCurrentTextureName());

        this._uiManager.setExpandRadius(0.05);
        this._uiManager.setCutDuration(performance.now() - start);

        this._uiManager.displayResetMenu();
    }

    private onExpandRadiusChanged()
    {
        let expandRadius = this._uiManager.getExpandRadius();
        this._cutLogic.expandCutMeshes(expandRadius);
    }

    private onFillTextureChanged()
    {
        let textureName = this._uiManager.getCurrentTextureName();
        this._cutLogic.updateFillTexture(textureName, this._uiManager.getFillType(), this._uiManager.getCurrentTextureName(), this._uiManager.getFillColor());
    }

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
