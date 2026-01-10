import { AmbientLight, DirectionalLight, Group, Material, MathUtils, Mesh, Plane, PlaneHelper, Scene, Vector3 } from "three";
import { ShaderVisualizer } from "../../ShaderVisualizer";
import { IShaderScene } from "../IShaderScene";
import { MeshCutter } from "./MeshCutter";
import { DebugUI } from "../../../ThreeVisualizer/DebugGUI";
import { ObjectLoader } from "../../../ThreeVisualizer/ObjectLoader";
import { Asset3D } from "../../../../types";
import { CutLinePreviewShader } from "./CutLinePreviewShader";

declare type CutGroupData = 
{
    group: Group,
    expandDir: Vector3,
    referencePos: Vector3
}

export class ShaderSceneMeshCutting implements IShaderScene
{
    private _visualizer!: ShaderVisualizer;
    private _scene: Scene = new Scene();

    private _objectLoader!: ObjectLoader
    private _meshesToCut: Mesh[] = [];

    private _ambientLight!: AmbientLight;
    private _directionalLight!: DirectionalLight;

    private _meshCutter: MeshCutter = new MeshCutter();
    private _cutMeshes: CutGroupData[] = [];

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
        // this._objectLoader.loadModel("models/ShaderProjects/MeshCutting/MixamoKnight.glb", (obj: Asset3D) => {
        this._objectLoader.loadModel("models/MechaGirl.glb", (obj: Asset3D) => {

            let numOfCuts = 10;
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
                // let plane = new Plane(new Vector3(0, 1, 0).normalize(), MathUtils.lerp(-2.25, -0.1, Math.random()));
                cutPlanes.push(plane);
                cutPlanesUniformNormals[index].copy(plane.normal);
                cutPlanesUniformPoints[index].copy(plane.normal).multiplyScalar(-plane.constant);
            }

            this._scene.add(obj.model);
            obj.model.name = "Hello World";
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
            
            setTimeout(() => {
                this._cutMeshes.push({
                    group: new Group(),
                    expandDir: new Vector3(),
                    referencePos: new Vector3()
                });
                for(let index = 0; index < this._meshesToCut.length; ++index)
                {
                    this._cutMeshes[0].group.add(this._meshesToCut[index].clone(true)); //Clone to keep original mesh visible
                }
                for(let index = 0; index < numOfCuts; ++index)
                {
                    this._cutMeshes = this.cutMesh(this._cutMeshes, cutPlanes[index], false);
                }

                for(let index = 0; index < this._cutMeshes.length; ++index)
                {
                    this._cutMeshes[index].group.position.add(new Vector3(3, 0, 0));
                    this._cutMeshes[index].referencePos.copy(this._cutMeshes[index].group.position);
                    this._scene.add(this._cutMeshes[index].group);
                }
            }, 1000);
            

            // Debug UI
            this._debugUI = new DebugUI();
            let guiHtml = this._debugUI.getGUIClass()!.domElement;
            document.getElementById("shaderVisualizer")?.appendChild(guiHtml);
            guiHtml.style.position = "absolute";
            guiHtml.style.left = "0px";
            guiHtml.style.top = "0px";

            this._debugUI.addSlider("", this._debugUISettings, "explodeRadius", 0.0, 3.0, "Expand Radius", (value) => {
                this._scene.children[2].position.set(0, 0, 0);
                for(let index = 0; index < this._cutMeshes.length; ++index)
                {
                    this._cutMeshes[index].group.position.copy(this._cutMeshes[index].referencePos).addScaledVector(this._cutMeshes[index].expandDir, this._debugUISettings.explodeRadius);
                }
            });
        }, () => {});

        /* To do:
            Test on skinned meshes
                * Doesn't cut pose, cuts only base position. Is this ok?
                * Animate mesh and make cut parts also animated
            Optimize code
            Stress-test to know limitations
            Make demonstration scenes
            Explode physics?
            Clean up the code
            Add code inspection (also add error checking for everything: check index 0, throw proper errors, etc.)
            Bunny 3D model base color view broken
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
    private cutMesh(meshes: CutGroupData[], plane: Plane, displayPlane: boolean = true)
    {
        if(displayPlane)
        {
            const helper = new PlaneHelper( plane, 25, 0xffff00 );
            this._scene.add( helper );
        }

        let planeCenter = plane.normal.clone().multiplyScalar(-plane.constant);

        let results: CutGroupData[] = [];
        for(let index = 0; index < meshes.length; ++index)
        {
            const left: CutGroupData = {
                group: new Group(),
                expandDir: meshes[index].expandDir.clone(),
                referencePos: new Vector3()
            };

            const right: CutGroupData = {
                group: new Group(),
                expandDir: meshes[index].expandDir.clone(),
                referencePos: new Vector3()
            };
            left.group.position.copy(planeCenter);
            right.group.position.copy(planeCenter);

            left.expandDir.sub(plane.normal);
            right.expandDir.add(plane.normal);
            for(let index2 = 0; index2 < meshes[index].group.children.length; ++index2)
            {
                let result = this._meshCutter.cutGeometry(meshes[index].group.children[index2] as Mesh, plane, true, true);
                result.leftMesh.position.sub(left.group.position);
                result.rightMesh.position.sub(right.group.position);

                left.group.add(result.leftMesh);
                right.group.add(result.rightMesh);
            }
            results.push(left, right);
        }

        return results;
    }
}