import { Group, Vector3, Plane, Mesh, MathUtils, Object3D, Scene, Material, Box3, ShaderMaterial, Color, SkinnedMesh, MeshStandardMaterial } from "three";
import { CutLinePreviewShader } from "../Materials/CutLinePreviewShader";
import { MeshCutter } from "../MeshCutter";
import { MeshCutterResourceLoader } from "./MeshCutterResourceLoader";

//For cut meshes we group them on the sides of the planes they are. This makes expanding objects easier
declare type CutGroup =
{
    group: Group,
    referencePos: Vector3,
    expandDir: Vector3
}

export class MeshCutterManager
{
    private _scene: Scene;
    private _meshCutter = new MeshCutter(); //Script that contains all of our cutting logic
    private _resourceLoader!: MeshCutterResourceLoader; //Utility script to load and cache resources
    
    private _sceneBaseModel?: Object3D; //Model that you see in the scene before cutting it
    private _modelBounds: Box3 = new Box3(); //Bounding box of the model that you see in the scene
    private _boundsCenter: Vector3 = new Vector3(); //Center of the bounding box
    
    private _meshesToCut: Mesh[] = []; //Meshes that will be cut when you run the cutting algorithm
    private _generatedCutMeshes: CutGroup[] = []; //Meshes that were generated after running the cut algorithm

    //Plane data used in the cutting logic
    private _cutPlanes: Plane[] = [];
    private _cutPlaneNormals: Vector3[] = [];
    private _cutPlanePoints: Vector3[] = [];

    constructor(scene: Scene)
    {
        this._scene = scene;
        this._resourceLoader = new MeshCutterResourceLoader();
        for (let index = 0; index < 50; ++index) // Needs to match max planes in the shader
        {
            this._cutPlaneNormals.push(new Vector3());
            this._cutPlanePoints.push(new Vector3());
        }
    }

    //Getters and setters
    public getSceneBaseModel() { return this._sceneBaseModel; }
    public getCutPlanes() { return this._cutPlanes; }
    public getCutPlanePoints() { return this._cutPlanePoints; }
    public getCutPlaneNormals() { return this._cutPlaneNormals; }

    //Dispose of the generated data and reset the current state of the script
    public reset(resetMeshesToCut: boolean)
    {
        for(let index = 0; index < this._generatedCutMeshes.length; ++index)
        {
            this._scene.remove(this._generatedCutMeshes[index].group);
            this._generatedCutMeshes[index].group.traverse((obj) => {
                this.disposeObject(obj);
            });
        }
        this._generatedCutMeshes = [];
        if(resetMeshesToCut)
            this._meshesToCut = [];
    }

    //Utility script to destroy an deallocate all data of the model that you see in the scene
    public disposeBaseModel()
    {
        if(this._sceneBaseModel)
        {
            this._scene.remove(this._sceneBaseModel);
            this.disposeObject(this._sceneBaseModel);
        }
    }

    //Called when you change the mesh in the scene
    public loadNewMesh(meshName: string, onMeshLoadedCallback: () => void)
    {
        this._resourceLoader.loadMesh(meshName, (parent: Object3D, pureMeshes: Mesh[]) => {
            this.onMeshLoaded(meshName, parent, pureMeshes, onMeshLoadedCallback);
        });
    }

    //Start cutting the mesh
    public runCuttingAlgoritm(fillTextureName: string)
    {
        //Create a single group that holds all of the meshes that we need to cut
        this._generatedCutMeshes.push({
            group: new Group(),
            expandDir: new Vector3(),
            referencePos: new Vector3()
        });
        this._generatedCutMeshes[0].group.position.copy(this._sceneBaseModel!.position);
        for (let index = 0; index < this._meshesToCut.length; ++index)
        {
            this._generatedCutMeshes[0].group.add(this._meshesToCut[index].clone(true)); //Clone to keep original mesh visible
        }
        //For each of the cut planes, run the cutting algorithm over all of the meshes
        //This will generate additional groups (ex: we have a single group, we run the algorithm and this will return 2 groups: a "left" and "right" group)
        //Grouping helps in expanding objects by slider after the cut
        for (let index = 0; index < this._cutPlanes.length; ++index)
        {
            this._generatedCutMeshes = this.cutMesh(this._generatedCutMeshes, this._cutPlanes[index], fillTextureName);
        }

        //Add the new generated meshes to the scene and remove the base model to not see it
        for (let index = 0; index < this._generatedCutMeshes.length; ++index)
        {
            this._generatedCutMeshes[index].referencePos.copy(this._generatedCutMeshes[index].group.position);
            this._scene.add(this._generatedCutMeshes[index].group);
        }
        this._scene.remove(this._sceneBaseModel!);
    }

    //Recalculate the data for all of the cut planes
    public updateCutPlanes(numOfPlanes: number, cutMode: string)
    {
        this._cutPlanes = [];

        //We are using the bounds data for the cut planes to make sure that we don't cut "empty space"
        let boundsCenter = new Vector3();
        let boundsSize = new Vector3();
        this._modelBounds.getSize(boundsSize);
        this._modelBounds.getCenter(boundsCenter);

        let constant = 0;
        let increment = 0;

        //Based on the cut mode selected, calculate the planes
        if (cutMode == "Grid")
        {
            //Create a grid on the X and Y planes 
            for (let width = 0; width < Math.floor(numOfPlanes); ++width)
            {
                let normal = new Vector3(1, 0, 0);
                increment = boundsSize.x / (numOfPlanes + 1);
                constant = this._modelBounds.min.x + increment * (width + 1);
                this._cutPlanes.push(new Plane(normal, -constant));
            }
            for (let height = 0; height < Math.floor(numOfPlanes); ++height)
            {
                let normal = new Vector3(0, 1, 0);
                increment = boundsSize.y / (numOfPlanes + 1);
                constant = this._modelBounds.min.y + increment * (height + 1);
                this._cutPlanes.push(new Plane(normal, -constant));
            }
            //Calculate data for the generated planes
            for (let index = 0; index < this._cutPlanes.length; ++index)
            {
                this._cutPlaneNormals[index].copy(this._cutPlanes[index].normal);
                this._cutPlanePoints[index].copy(this._cutPlanes[index].normal).multiplyScalar(-this._cutPlanes[index].constant);
            }
        }
        else
        {
            for (let index = 0; index < Math.floor(numOfPlanes); ++index)
            {
                let normal = new Vector3(0, 0, 0);
                switch (cutMode)
                {
                    case "Horizontal":
                        normal.set(1, 0, 0);
                        increment = boundsSize.x / (numOfPlanes + 1);
                        constant = this._modelBounds.min.x + increment * (index + 1);
                        break;
                    case "Vertical":
                        normal.set(0, 1, 0);
                        increment = boundsSize.y / (numOfPlanes + 1);
                        constant = this._modelBounds.min.y + increment * (index + 1);
                        break;
                    case "Depth":
                        normal.set(0, 0, 1);
                        increment = boundsSize.z / (numOfPlanes + 1);
                        constant = this._modelBounds.min.z + increment * (index + 1);
                        break;
                    case "Random":
                        normal.set(Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0).normalize();
                        let boundsSizeToUse = boundsSize.x;
                        if (normal.y > normal.x)
                            boundsSizeToUse = boundsSize.y;
                        if (normal.z > normal.y)
                            boundsSizeToUse = boundsSize.z;
                        constant = MathUtils.lerp(-boundsSizeToUse / 4.0, boundsSizeToUse / 4.0, Math.random());
                        break;
                }
                this._cutPlanes.push(new Plane(normal, -constant));
                this._cutPlaneNormals[index].copy(normal);
                this._cutPlanePoints[index].copy(normal).multiplyScalar(constant);
            }
        }
        //Finally, update materials on the scene model, to display where it will be cut
        this.updateBaseMeshMaterial();
    }

    //Utility script to deallocate memory for a given object
    public disposeObject(obj: Object3D)
    {
        obj.traverse((item) => {
            if(item instanceof Mesh)
            {
                let mesh = item as Mesh;
                if(Object.prototype.toString.call(mesh.material) === '[object Object]')
                    (mesh.material as Material).dispose();
                else
                {
                    let material = mesh.material as Material[];
                    for(let index = 0; index < material.length; ++index)
                    {
                        material[index].dispose();
                    }
                }
                mesh.geometry.dispose();
            }
        });
    }

    //Change the texture displayed on the cut parts
    public updateFillTexture(textureName: string, fillType: string, fillTextureName: string, fillColor: Color)
    {
        this._resourceLoader.loadTexture(textureName, (tex) => {
            this.updateCutMeshesMaterial(fillType, fillTextureName, fillColor);
        });
    }

    //Update the material for scene model (before the cut)
    public updateBaseMeshMaterial()
    {
        for (let index = 0; index < this._meshesToCut.length; ++index)
        {
            let mat = this._meshesToCut[index].material as CutLinePreviewShader;
            mat.updateUniforms({
                u_LineColor: { value: new Vector3(1.0, 1.0, 0.0) },
                u_LineThickness: { value: 0.01 },
                u_CutPlaneNormals: { value: this._cutPlaneNormals },
                u_CutPlanePoints: { value: this._cutPlanePoints },
                u_NumOfCutPlanes: { value: this._cutPlanes.length }
            });
        }
    }

    //Update the materials for the generated meshes after the cut
    public updateCutMeshesMaterial(fillType: string, fillTextureName: string, fillColor: Color)
    {
        for(let index = 0; index < this._generatedCutMeshes.length; ++index)
        {
            this._generatedCutMeshes[index].group.traverse((obj) => {
                if(obj instanceof Mesh)
                {
                    let mesh = obj as Mesh;
                    let materials = mesh.material as Material[];
                    for(let index2 = 0; index2 < materials.length; ++index2)
                    {
                        if(materials[index2] instanceof ShaderMaterial)
                        {
                            let shader = materials[index2] as ShaderMaterial;
                            if(shader.uniforms.u_DiffuseColor && shader.uniforms.u_DiffuseMap && shader.uniforms.u_UseDiffuseMap && shader.uniforms.u_HideShader)
                            {
                                shader.uniforms.u_UseDiffuseMap.value = (fillType == "Texture Fill");
                                shader.uniforms.u_HideShader.value = (fillType == "No Fill");
                                shader.uniforms.u_DiffuseColor.value = fillColor;
                                shader.uniforms.u_DiffuseMap.value = this._resourceLoader.getTexture(fillTextureName);
                            }
                        }
                    }
                }
            });
        }
    }

    //Move the generated groups closer or father to one another
    public expandCutMeshes(value: number)
    {
        for (let index = 0; index < this._generatedCutMeshes.length; ++index)
        {
            this._generatedCutMeshes[index].group.position.copy(this._generatedCutMeshes[index].referencePos).addScaledVector(this._generatedCutMeshes[index].expandDir, value);
        }
    }

    //Called when we finished loading a new mesh
    private onMeshLoaded(meshName: string, parent: Object3D, pureMeshes: Mesh[], onMeshLoadedCallback: () => void)
    {
        //Go through each loaded mesh and set up preview material
        for(let index = 0; index < pureMeshes.length; ++index)
        {
            let newMat = new CutLinePreviewShader({
                u_LineColor: { value: new Vector3(1.0, 1.0, 0.0) },
                u_LineThickness: { value: 0.01 },
                u_CutPlaneNormals: { value: this.getCutPlaneNormals() },
                u_CutPlanePoints: { value: this.getCutPlanePoints() },
                u_NumOfCutPlanes: { value: 0 }
            });
            if (pureMeshes[index].material instanceof MeshStandardMaterial)
                newMat.copy(pureMeshes[index].material as Material);
            pureMeshes[index].material = newMat;

            //If it is a skinned mesh, set to default pose
            if (pureMeshes[index] instanceof SkinnedMesh)
            {
                (pureMeshes[index] as SkinnedMesh).skeleton.pose();
                pureMeshes[index].updateMatrixWorld(true);
            }
        }

        //Add the model and store required data
        this._scene.add(parent);
        this._sceneBaseModel = parent;
        this._meshesToCut = pureMeshes;

        //After a small timeout, process the loaded mesh. This timeout is required to allow shaders and object data to compile properly
        setTimeout(() => { this.processLoadedMesh(meshName, onMeshLoadedCallback); }, 100); 
    }

    private processLoadedMesh(meshName: string, onMeshLoadedCallback: () => void)
    {
        this._modelBounds.setFromObject(this._sceneBaseModel!, true);
        if (meshName != "Torus Knot")
        {
            this._modelBounds.getCenter(this._boundsCenter);
            this._sceneBaseModel!.position.sub(this._boundsCenter);
            this._modelBounds.setFromObject(this._sceneBaseModel!, true); //Update bounds after the shift
        }
        onMeshLoadedCallback();
    }

    //Cut the meshes into multiple parts based on the cut plane
    private cutMesh(meshes: CutGroup[], plane: Plane, fillTextureName: string)
    {
        let results: CutGroup[] = [];
        let planeCenter = plane.normal.clone().multiplyScalar(-plane.constant);

        for (let index = 0; index < meshes.length; ++index)
        {
            const left: CutGroup = {
                group: new Group(),
                expandDir: meshes[index].expandDir.clone(),
                referencePos: new Vector3()
            };
            const right = {
                group: new Group(),
                expandDir: meshes[index].expandDir.clone(),
                referencePos: new Vector3()
            };

            left.group.position.copy(planeCenter);
            right.group.position.copy(planeCenter);

            left.expandDir.sub(plane.normal);
            right.expandDir.add(plane.normal);

            for (let index2 = 0; index2 < meshes[index].group.children.length; ++index2)
            {
                let texture = this._resourceLoader.getTexture(fillTextureName)!;
                let result = this._meshCutter.cutGeometry(meshes[index].group.children[index2] as Mesh, plane, texture, true, true);
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