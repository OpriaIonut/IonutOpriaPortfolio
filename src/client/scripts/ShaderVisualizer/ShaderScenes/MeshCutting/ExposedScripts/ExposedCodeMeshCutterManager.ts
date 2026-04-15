export const exposedCodeMeshCutterManager = `
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
    private scene: Scene;
    private meshCutter = new MeshCutter(); //Script that contains all of our cutting logic
    private resourceLoader!: MeshCutterResourceLoader; //Utility script to load and cache resources
    
    private sceneBaseModel?: Object3D; //Model that you see in the scene before cutting it
    private modelBounds: Box3 = new Box3(); //Bounding box of the model that you see in the scene
    private boundsCenter: Vector3 = new Vector3(); //Center of the bounding box
    
    private meshesToCut: Mesh[] = []; //Meshes that will be cut when you run the cutting algorithm
    private generatedCutMeshes: CutGroup[] = []; //Meshes that were generated after running the cut algorithm

    //Plane data used in the cutting logic
    private cutPlanes: Plane[] = [];
    private cutPlaneNormals: Vector3[] = [];
    private cutPlanePoints: Vector3[] = [];

    constructor(scene: Scene)
    {
        this.scene = scene;
        this.resourceLoader = new MeshCutterResourceLoader();
        for (let index = 0; index < 50; ++index) // Needs to match max planes in the shader
        {
            this.cutPlaneNormals.push(new Vector3());
            this.cutPlanePoints.push(new Vector3());
        }
    }

    //Getters and setters
    public getSceneBaseModel() { return this.sceneBaseModel; }
    public getCutPlanes() { return this.cutPlanes; }
    public getCutPlanePoints() { return this.cutPlanePoints; }
    public getCutPlaneNormals() { return this.cutPlaneNormals; }

    //Dispose of the generated data and reset the current state of the script
    public reset(resetMeshesToCut: boolean)
    {
        for(let index = 0; index < this.generatedCutMeshes.length; ++index)
        {
            this.scene.remove(this.generatedCutMeshes[index].group);
            this.generatedCutMeshes[index].group.traverse((obj) => {
                this.disposeObject(obj);
            });
        }
        this.generatedCutMeshes = [];
        if(resetMeshesToCut)
            this.meshesToCut = [];
    }

    //Utility script to destroy an deallocate all data of the model that you see in the scene
    public disposeBaseModel()
    {
        if(this.sceneBaseModel)
        {
            this.scene.remove(this.sceneBaseModel);
            this.disposeObject(this.sceneBaseModel);
        }
    }

    //Called when you change the mesh in the scene
    public loadNewMesh(meshName: string, onMeshLoadedCallback: () => void)
    {
        this.resourceLoader.loadMesh(meshName, (parent: Object3D, pureMeshes: Mesh[]) => {
            this.onMeshLoaded(meshName, parent, pureMeshes, onMeshLoadedCallback);
        });
    }

    //Start cutting the mesh
    public runCuttingAlgoritm(fillTextureName: string)
    {
        //Create a single group that holds all of the meshes that we need to cut
        this.generatedCutMeshes.push({
            group: new Group(),
            expandDir: new Vector3(),
            referencePos: new Vector3()
        });
        this.generatedCutMeshes[0].group.position.copy(this.sceneBaseModel!.position);
        for (let index = 0; index < this.meshesToCut.length; ++index)
        {
            this.generatedCutMeshes[0].group.add(this.meshesToCut[index].clone(true)); //Clone to keep original mesh visible
        }
        //For each of the cut planes, run the cutting algorithm over all of the meshes
        //This will generate additional groups (ex: we have a single group, we run the algorithm and this will return 2 groups: a "left" and "right" group)
        //Grouping helps in expanding objects by slider after the cut
        for (let index = 0; index < this.cutPlanes.length; ++index)
        {
            this.generatedCutMeshes = this.cutMesh(this.generatedCutMeshes, this.cutPlanes[index], fillTextureName);
        }

        //Add the new generated meshes to the scene and remove the base model to not see it
        for (let index = 0; index < this.generatedCutMeshes.length; ++index)
        {
            this.generatedCutMeshes[index].referencePos.copy(this.generatedCutMeshes[index].group.position);
            this.scene.add(this.generatedCutMeshes[index].group);
        }
        this.scene.remove(this.sceneBaseModel!);
    }

    //Recalculate the data for all of the cut planes
    public updateCutPlanes(numOfPlanes: number, cutMode: string)
    {
        this.cutPlanes = [];

        //We are using the bounds data for the cut planes to make sure that we don't cut "empty space"
        let boundsCenter = new Vector3();
        let boundsSize = new Vector3();
        this.modelBounds.getSize(boundsSize);
        this.modelBounds.getCenter(boundsCenter);

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
                constant = this.modelBounds.min.x + increment * (width + 1);
                this.cutPlanes.push(new Plane(normal, -constant));
            }
            for (let height = 0; height < Math.floor(numOfPlanes); ++height)
            {
                let normal = new Vector3(0, 1, 0);
                increment = boundsSize.y / (numOfPlanes + 1);
                constant = this.modelBounds.min.y + increment * (height + 1);
                this.cutPlanes.push(new Plane(normal, -constant));
            }
            //Calculate data for the generated planes
            for (let index = 0; index < this.cutPlanes.length; ++index)
            {
                this.cutPlaneNormals[index].copy(this.cutPlanes[index].normal);
                this.cutPlanePoints[index].copy(this.cutPlanes[index].normal).multiplyScalar(-this.cutPlanes[index].constant);
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
                        constant = this.modelBounds.min.x + increment * (index + 1);
                        break;
                    case "Vertical":
                        normal.set(0, 1, 0);
                        increment = boundsSize.y / (numOfPlanes + 1);
                        constant = this.modelBounds.min.y + increment * (index + 1);
                        break;
                    case "Depth":
                        normal.set(0, 0, 1);
                        increment = boundsSize.z / (numOfPlanes + 1);
                        constant = this.modelBounds.min.z + increment * (index + 1);
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
                this.cutPlanes.push(new Plane(normal, -constant));
                this.cutPlaneNormals[index].copy(normal);
                this.cutPlanePoints[index].copy(normal).multiplyScalar(constant);
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
        this.resourceLoader.loadTexture(textureName, (tex) => {
            this.updateCutMeshesMaterial(fillType, fillTextureName, fillColor);
        });
    }

    //Update the material for scene model (before the cut)
    public updateBaseMeshMaterial()
    {
        for (let index = 0; index < this.meshesToCut.length; ++index)
        {
            let mat = this.meshesToCut[index].material as CutLinePreviewShader;
            mat.updateUniforms({
                u_LineColor: { value: new Vector3(1.0, 1.0, 0.0) },
                u_LineThickness: { value: 0.01 },
                u_CutPlaneNormals: { value: this.cutPlaneNormals },
                u_CutPlanePoints: { value: this.cutPlanePoints },
                u_NumOfCutPlanes: { value: this.cutPlanes.length }
            });
        }
    }

    //Update the materials for the generated meshes after the cut
    public updateCutMeshesMaterial(fillType: string, fillTextureName: string, fillColor: Color)
    {
        for(let index = 0; index < this.generatedCutMeshes.length; ++index)
        {
            this.generatedCutMeshes[index].group.traverse((obj) => {
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
                                shader.uniforms.u_DiffuseMap.value = this.resourceLoader.getTexture(fillTextureName);
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
        for (let index = 0; index < this.generatedCutMeshes.length; ++index)
        {
            this.generatedCutMeshes[index].group.position.copy(this.generatedCutMeshes[index].referencePos).addScaledVector(this.generatedCutMeshes[index].expandDir, value);
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
        this.scene.add(parent);
        this.sceneBaseModel = parent;
        this.meshesToCut = pureMeshes;

        //After a small timeout, process the loaded mesh. This timeout is required to allow shaders and object data to compile properly
        setTimeout(() => { this.processLoadedMesh(meshName, onMeshLoadedCallback); }, 100); 
    }

    private processLoadedMesh(meshName: string, onMeshLoadedCallback: () => void)
    {
        this.modelBounds.setFromObject(this.sceneBaseModel!, true);
        if (meshName != "Torus Knot")
        {
            this.modelBounds.getCenter(this.boundsCenter);
            this.sceneBaseModel!.position.sub(this.boundsCenter);
            this.modelBounds.setFromObject(this.sceneBaseModel!, true); //Update bounds after the shift
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
                let texture = this.resourceLoader.getTexture(fillTextureName)!;
                let result = this.meshCutter.cutGeometry(meshes[index].group.children[index2] as Mesh, plane, texture, true, true);
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
`;