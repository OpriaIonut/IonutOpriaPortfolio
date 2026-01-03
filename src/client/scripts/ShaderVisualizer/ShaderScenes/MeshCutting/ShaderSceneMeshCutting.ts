import { AmbientLight, BoxGeometry, DirectionalLight, DoubleSide, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, Plane, PlaneHelper, Scene, ShaderMaterial, Vector3 } from "three";
import { ShaderVisualizer } from "../../ShaderVisualizer";
import { IShaderScene } from "../IShaderScene";
import { MeshCutter } from "./MeshCutter";
import { DebugUI } from "../../../ThreeVisualizer/DebugGUI";
import { ObjectLoader } from "../../../ThreeVisualizer/ObjectLoader";
import { Asset3D } from "../../../../types";
import { CutLinePreviewShader } from "./CutLinePreviewShader";

export class ShaderSceneMeshCutting implements IShaderScene
{
    private _visualizer!: ShaderVisualizer;
    private _scene: Scene = new Scene();

    private _objectLoader!: ObjectLoader
    private _meshesToCut: Mesh[] = [];

    private _ambientLight!: AmbientLight;
    private _directionalLight!: DirectionalLight;

    private _meshCutter: MeshCutter = new MeshCutter();
    private _meshes: Mesh[] = [];
    private _explodeDir: Vector3[] = [];
    private _centers: Vector3[] = [];

    private _debugUI!: DebugUI;
    private _debugUISettings = {
        explodeRadius: 0.0
    }

    public init(visualizer: ShaderVisualizer): void 
    {
        this._visualizer = visualizer;

        this._ambientLight = new AmbientLight(0xffffff, 0.25);
        this._scene.add(this._ambientLight);

        this._directionalLight = new DirectionalLight(0xffffff, 1.0);
        this._directionalLight.position.set(10.0, 10.0, 5.0);
        this._scene.add(this._directionalLight);

        this._objectLoader = new ObjectLoader();
        // this._objectLoader.loadModel("models/ShaderProjects/MeshCutting/Heart.glb", (obj: Asset3D) => {
        this._objectLoader.loadModel("models/MechaGirl.glb", (obj: Asset3D) => {

            let numOfCuts = 5;
            let cutPlanes: Plane[] = [];
            let cutPlanesUniformNormals: Vector3[] = [];
            let cutPlanesUniformPoints: Vector3[] = [];
            for(let index = 0; index < 50; ++index) // Needs to match max planes in the shader
            {
                cutPlanesUniformNormals.push(new Vector3());
                cutPlanesUniformPoints.push(new Vector3());
            }
            for(let index = 0; index < numOfCuts; ++index)
            {
                let plane = new Plane(new Vector3(Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0).normalize(), Math.random() * 2.0 - 1.0);
                cutPlanes.push(plane);
                cutPlanesUniformNormals[index].copy(plane.normal);
                cutPlanesUniformPoints[index].copy(plane.normal).multiplyScalar(-plane.constant);
            }

            console.log(obj)
            this._scene.add(obj.model);
            obj.model.traverse((item) => {
                let mesh = item as Mesh;
                if(mesh != undefined && mesh != null && mesh.geometry != undefined)
                {
                    let newMat = new CutLinePreviewShader({
                        u_LineColor: { value: new Vector3(1.0, 1.0, 0.0) },
                        u_LineThickness: { value: 0.01 },
                        u_CutPlaneNormals: { value: cutPlanesUniformNormals },
                        u_CutPlanePoints: { value: cutPlanesUniformPoints },
                        u_NumOfCutPlanes: { value: numOfCuts }
                    });
                    newMat.copy(mesh.material as Material);
                    mesh.material = newMat;
                    this._meshesToCut.push(mesh);
                }
            });
            console.log(this._meshesToCut);
            
            let cutMeshes = [...this._meshesToCut];
            for(let index = 0; index < numOfCuts; ++index)
            {
               cutMeshes = this.cutMesh(cutMeshes, cutPlanes[index]);
            }

            for(let index = 0; index < cutMeshes.length; ++index)
            {
                this._meshes.push(cutMeshes[index]);
                this._explodeDir.push(cutMeshes[index].position.clone());//.sub(this._meshToCut.position));
                this._centers.push(cutMeshes[index].position.clone());
                this._scene.add(this._meshes[index]);
            }

            // Debug UI
            this._debugUI = new DebugUI();
            let guiHtml = this._debugUI.getGUIClass()!.domElement;
            document.getElementById("shaderVisualizer")?.appendChild(guiHtml);
            guiHtml.style.position = "absolute";
            guiHtml.style.left = "0px";
            guiHtml.style.top = "0px";

            this._debugUI.addSlider("", this._debugUISettings, "explodeRadius", 0.0, 10.0, "Explode Radius", (value) => {
                for(let index = 0; index < this._meshes.length; ++index)
                {
                    let dir = this._explodeDir[index].clone().normalize();
                    this._meshes[index].position.copy(this._centers[index]).add(dir.multiplyScalar(this._debugUISettings.explodeRadius));
                }
            });
        }, () => {});

        /* To do:
            Add texture/color to cut part
            Optimize vertices by calculating proper indices
            Explode physics
            Test on skinned meshes
            Be able to cut hierarchies
            Optimize code
            Stress-test to know limitations
            Make demonstration scenes
            Clean up the code
            Add code inspection (also add error checking for everything: check index 0, throw proper errors, etc.)
        */
    }

    public update(deltaTime: number): void 
    {

    }

    public hide(): void 
    {
        
    }

    public getScene(): Scene { return this._scene; }

    //Artificial offset is used because we are setting the origin of the cut meshes in the center of the new geometry.
    //This shifts the coordinate space that they are in, and for consequent cuts it produces wrong results
    private cutMesh(meshes: Mesh[], plane: Plane, displayPlane: boolean = true): Mesh[]
    {
        if(displayPlane)
        {
            const helper = new PlaneHelper( plane, 25, 0xffff00 );
            // this._scene.add( helper );
        }

        let results: Mesh[] = [];
        for(let index = 0; index < meshes.length; ++index)
        {
            let result = this._meshCutter.cutGeometry(meshes[index], plane, true, true);
            let leftMesh = new Mesh(result.leftMesh, new MeshStandardMaterial());
            leftMesh.position.copy(result.leftCenter);

            let rightMesh = new Mesh(result.rightMesh, new MeshStandardMaterial());
            rightMesh.position.copy(result.rightCenter);

            results.push(leftMesh, rightMesh);
        }

        return results;
    }
}