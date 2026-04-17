import { AmbientLight, DirectionalLight, Scene } from "three";
import { ShaderVisualizer } from "../../ShaderVisualizer";
import { MeshCutterUIManager } from "./Utility/MeshCutterUIManager";
import { MeshCutterManager } from "./Utility/MeshCutterManager";
import { exposedCodeMeshCutter } from "./ExposedScripts/ExposedCodeMeshCutter";
import { exposedCodeProceduralGeometry } from "./ExposedScripts/ExposedCodeProceduralGeometry";
import { exposedCodeCutLineShader } from "./ExposedScripts/ExposedCodeCutLineShader";
import { exposedCodeCutFillMaterial } from "./ExposedScripts/ExposedCodeCutFillMaterial";
import { exposedCodeMeshCutterManager } from "./ExposedScripts/ExposedCodeMeshCutterManager";
import { IShaderScene } from "../IShaderScene";

//Demo scene with the mesh cutting project
//Handles high-level management of the scene and it's components
export class ShaderSceneMeshCutting implements IShaderScene
{
    private scene: Scene = new Scene();
    private visualizer!: ShaderVisualizer;

    private uiManager!: MeshCutterUIManager;
    private cutLogic!: MeshCutterManager;

    public init(visualizer: ShaderVisualizer)
    {
        this.visualizer = visualizer;

        //Set up lights in the scene
        let ambientLight = new AmbientLight(0xffffff, 0.25);
        this.scene.add(ambientLight);
        
        let directionalLight = new DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(10.0, 10.0, 5.0);
        this.scene.add(directionalLight);

        //Create logic scripts
        this.uiManager = new MeshCutterUIManager();
        this.cutLogic = new MeshCutterManager(this.scene);

        //Subscribe to needed events
        this.uiManager.subscribe_OnCutClicked(() => { this.runCuttingAlgoritm(); });
        this.uiManager.subscribe_OnResetClicked(() => { this.resetState(); });
        this.uiManager.subscribe_OnRandomizeCutsClicked(() => { this.cutLogic.updateCutPlanes(this.uiManager.getNumOfCutPlanes(), this.uiManager.getCutMode()); });

        this.uiManager.subscribe_OnExpandRadiusChanged(() => { this.onExpandRadiusChanged(); });
        this.uiManager.subscribe_OnCutModeChanged(() => { this.cutLogic.updateCutPlanes(this.uiManager.getNumOfCutPlanes(), this.uiManager.getCutMode()); });
        this.uiManager.subscribe_OnMeshChanged(() => { this.onMeshChanged(); });
        this.uiManager.subscribe_OnNumOfPlanesChanged(() => { this.cutLogic.updateCutPlanes(this.uiManager.getNumOfCutPlanes(), this.uiManager.getCutMode()); });
        this.uiManager.subscribe_OnFillTypeChanged(() => { this.cutLogic.updateCutMeshesMaterial(this.uiManager.getFillType(), this.uiManager.getCurrentTextureName(), this.uiManager.getFillColor()); } );
        this.uiManager.subscribe_OnFillColorChanged(() => { this.cutLogic.updateCutMeshesMaterial(this.uiManager.getFillType(), this.uiManager.getCurrentTextureName(), this.uiManager.getFillColor()); } );
        this.uiManager.subscribe_OnFillTextureChanged(() => { this.onFillTextureChanged(); });

        this.visualizer.addScript("MeshCutter.ts", exposedCodeMeshCutter);
        this.visualizer.addScript("ProceduralGeometry.ts", exposedCodeProceduralGeometry);
        this.visualizer.addScript("MeshCutterManager.ts", exposedCodeMeshCutterManager);
        this.visualizer.addScript("CutLinePreviewShader.ts", exposedCodeCutLineShader);
        this.visualizer.addScript("CutFillMaterial.ts", exposedCodeCutFillMaterial);
        this.visualizer.addScript("Credits", `
Special thanks to the following artist for their work:

City: https://sketchfab.com/3d-models/city-1f50f0d6ec5a493d8e91d7db1106b324
        `, false);

        //Activate base state of the scene
        this.uiManager.displayCutMenu();
        this.onFillTextureChanged();
        this.onMeshChanged();
    }

    public update(deltaTime: number)
    {

    }

    //Called when you deactivate the view, dispose & reset everything
    public hide()
    {
        this.cutLogic.reset(true);
        this.cutLogic.disposeBaseModel();
        this.uiManager.reset(); //Events will also unsubscribe here

        this.visualizer.removeScript("MeshCutter.ts");
        this.visualizer.removeScript("ProceduralGeometry.ts");
        this.visualizer.removeScript("MeshCutterManager.ts");
        this.visualizer.removeScript("CutLinePreviewShader.ts");
        this.visualizer.removeScript("CutFillMaterial.ts");
        this.visualizer.removeScript("Credits");
    }

    public getScene() { return this.scene; }

    //Called when you click "reset" on the ui
    private resetState()
    {
        this.cutLogic.reset(false);
        this.scene.add(this.cutLogic.getSceneBaseModel()!);
        this.uiManager.displayCutMenu();
    }

    //Called when you click "cut" on the ui, will cut the geometry and display a different menu
    public runCuttingAlgoritm()
    {
        const start = performance.now();
        this.cutLogic.runCuttingAlgoritm(this.uiManager.getCurrentTextureName());

        this.uiManager.setExpandRadius(0.05);
        this.uiManager.setCutDuration(performance.now() - start);

        this.uiManager.displayResetMenu();
    }

    //Called when you change the "expand" radius slider after the mesh is cut
    private onExpandRadiusChanged()
    {
        let expandRadius = this.uiManager.getExpandRadius();
        this.cutLogic.expandCutMeshes(expandRadius);
    }

    //Called when you change the texture selected
    private onFillTextureChanged()
    {
        let textureName = this.uiManager.getCurrentTextureName();
        this.cutLogic.updateFillTexture(textureName, this.uiManager.getFillType(), this.uiManager.getCurrentTextureName(), this.uiManager.getFillColor());
    }

    //Called when you change the mesh selected
    private onMeshChanged()
    {
        this.cutLogic.disposeBaseModel();
        this.cutLogic.reset(true);

        let meshName = this.uiManager.getCurrentMeshName();
        this.cutLogic.loadNewMesh(meshName, () => {
            this.uiManager.displayCutMenu();
            this.cutLogic.updateCutPlanes(this.uiManager.getNumOfCutPlanes(), this.uiManager.getCutMode());
        });
    }
}
