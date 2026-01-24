import { Material, Mesh, MeshStandardMaterial, Object3D, SkinnedMesh, Texture, TextureLoader, TorusKnotGeometry, Vector3 } from "three";
import { CutLinePreviewShader } from "../Materials/CutLinePreviewShader";
import { ObjectLoader } from "../../../../ThreeVisualizer/ObjectLoader";
import { MeshCutterLogic } from "./MeshCutterLogic";

export class MeshCutterResourceLoader
{
    private _objectLoader!: ObjectLoader;
    private _textureLoader!: TextureLoader;
    
    private _loadedFillTextures: Map<string, Texture> = new Map();
    private _cutData: MeshCutterLogic;

    constructor(sceneData: MeshCutterLogic)
    {
        this._objectLoader = new ObjectLoader();
        this._textureLoader = new TextureLoader();
        this._cutData = sceneData;
    }

    public isTextureLoaded(texName: string)
    {
        return this._loadedFillTextures.has(texName);
    }

    public getTexture(texName: string)
    {
        return this._loadedFillTextures.get(texName);
    }

    public loadTexture(texName: string, onTextureLoaded: (tex: Texture) => void)
    {
        let texPath = this.getPathFromFillTexture(texName);
        this._textureLoader.load(texPath, (texture: Texture) => {
            this._loadedFillTextures.set(texName, texture);
            onTextureLoaded(texture);
        });
    }

    public loadMesh(meshName: string, onModelLoaded: (parent: Object3D, pureMeshes: Mesh[]) => void)
    {
        let results: Mesh[] = [];

        if (meshName == "Torus Knot")
        {
            let mesh = new Mesh(new TorusKnotGeometry(1, 0.4, 256, 32), new CutLinePreviewShader({
                u_LineColor: { value: new Vector3(1.0, 1.0, 0.0) },
                u_LineThickness: { value: 0.01 },
                u_CutPlaneNormals: { value: this._cutData.getCutPlaneNormals() },
                u_CutPlanePoints: { value: this._cutData.getCutPlanePoints() },
                u_NumOfCutPlanes: { value: 0 }
            }));
            results.push(mesh);
            onModelLoaded(mesh, results);
        }
        else {
            let path = this.getPathFromModel(meshName);
            this._objectLoader.loadModel(path, (obj) => {
                obj.model.traverse((item) => {
                    let mesh = item as Mesh;
                    if (mesh != undefined && mesh != null && mesh.geometry != undefined) {
                        let newMat = new CutLinePreviewShader({
                            u_LineColor: { value: new Vector3(1.0, 1.0, 0.0) },
                            u_LineThickness: { value: 0.01 },
                            u_CutPlaneNormals: { value: this._cutData.getCutPlaneNormals() },
                            u_CutPlanePoints: { value: this._cutData.getCutPlanePoints() },
                            u_NumOfCutPlanes: { value: 0 }
                        });
                        if(mesh.material instanceof MeshStandardMaterial)
                            newMat.copy(mesh.material as Material);
                        mesh.material = newMat;
                        results.push(mesh);

                        if(item instanceof SkinnedMesh)
                        {
                            item.skeleton.pose();
                            item.updateMatrixWorld(true);
                        }
                    }
                });
                onModelLoaded(obj.model, results);
            }, () => { });
        }
    }

    private getPathFromModel(modelName: string)
    {
        switch (modelName)
        {
            case "Heart":
                return "models/ShaderProjects/MeshCutting/Heart.glb";
            case "Mecha Girl":
                return "models/MechaGirl.glb";
            case "God Eater Sword":
                return "models/GodEaterChainsaw.glb";
            case "City":
                return "models/ShaderProjects/MeshCutting/City.glb";
        }
        return "";
    }

    private getPathFromFillTexture(textureName: string)
    {
        switch (textureName)
        {
            case "Orange":
                return "images/textures/orange.png";
            case "Watermelon":
                return "images/textures/watermelon.png";
            case "Wood":
                return "images/textures/wood.jpg";
            case "Rock":
                return "images/textures/rock.jpg";
            case "Lava":
                return "images/textures/lava.jpg";
            case "Blood":
                return "images/textures/blood.jpg";
            case "Blood Veins":
                return "images/textures/blood-veins.jpg";
        }
        return "";
    }
}