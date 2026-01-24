import { Group, Vector3, Plane, Mesh, MathUtils, Object3D, Scene, Material, Box3, ShaderMaterial, Color } from "three";
import { CutLinePreviewShader } from "../Materials/CutLinePreviewShader";
import { MeshCutter } from "../MeshCutter";
import { MeshCutterResourceLoader } from "./MeshCutterResourceLoader";

declare type CutGroup =
{
    group: Group,
    referencePos: Vector3,
    expandDir: Vector3
}

export class MeshCutterLogic
{
    private _scene: Scene;
    private _meshCutter = new MeshCutter();
    private _resourceLoader!: MeshCutterResourceLoader;
    
    private _sceneBaseModel?: Object3D;
    private _modelBounds: Box3 = new Box3();
    private _boundsCenter: Vector3 = new Vector3();
    
    private _meshesToCut: Mesh[] = [];
    private _cutMeshes: CutGroup[] = [];
    private _cutPlanes: Plane[] = [];
    private _cutPlaneNormals: Vector3[] = [];
    private _cutPlanePoints: Vector3[] = [];

    constructor(scene: Scene)
    {
        this._scene = scene;
        this._resourceLoader = new MeshCutterResourceLoader(this);
        for (let index = 0; index < 50; ++index) // Needs to match max planes in the shader
        {
            this._cutPlaneNormals.push(new Vector3());
            this._cutPlanePoints.push(new Vector3());
        }
    }

    public getSceneBaseModel() { return this._sceneBaseModel; }
    public getCutPlanes() { return this._cutPlanes; }
    public getCutPlanePoints() { return this._cutPlanePoints; }
    public getCutPlaneNormals() { return this._cutPlaneNormals; }

    public setMeshesToCut(meshes: Mesh[])
    {
        this._meshesToCut = meshes;
    }

    public reset(resetMeshesToCut: boolean)
    {
        for(let index = 0; index < this._cutMeshes.length; ++index)
        {
            this._scene.remove(this._cutMeshes[index].group);
            this._cutMeshes[index].group.traverse((obj) => {
                this.disposeObject(obj);
            });
        }
        this._cutMeshes = [];
        if(resetMeshesToCut)
            this._meshesToCut = [];
    }

    public disposeBaseModel()
    {
        if(this._sceneBaseModel)
        {
            this._scene.remove(this._sceneBaseModel);
            this.disposeObject(this._sceneBaseModel);
        }
    }

    public loadNewMesh(meshName: string, onMeshLoadedCallback: () => void)
    {
        this._resourceLoader.loadMesh(meshName, (parent: Object3D, pureMeshes: Mesh[]) => {
            this.onMeshLoaded(meshName, parent, pureMeshes, onMeshLoadedCallback);
        });
    }

    public runCuttingAlgoritm(fillTextureName: string)
    {
        this._cutMeshes.push({
            group: new Group(),
            expandDir: new Vector3(),
            referencePos: new Vector3()
        });
        this._cutMeshes[0].group.position.copy(this._sceneBaseModel!.position);
        for (let index = 0; index < this._meshesToCut.length; ++index) {
            this._cutMeshes[0].group.add(this._meshesToCut[index].clone(true)); //Clone to keep original mesh visible
        }
        for (let index = 0; index < this._cutPlanes.length; ++index) {
            this._cutMeshes = this.cutMesh(this._cutMeshes, this._cutPlanes[index], fillTextureName);
        }

        for (let index = 0; index < this._cutMeshes.length; ++index) {
            this._cutMeshes[index].referencePos.copy(this._cutMeshes[index].group.position);
            this._scene.add(this._cutMeshes[index].group);
        }

        this._scene.remove(this._sceneBaseModel!);
    }

    public updateCutPlanes(numOfPlanes: number, cutMode: string)
    {
        this._cutPlanes = [];

        let boundsCenter = new Vector3();
        let boundsSize = new Vector3();
        this._modelBounds.getSize(boundsSize);
        this._modelBounds.getCenter(boundsCenter);

        let constant = 0;
        let increment = 0;

        if (cutMode == "Grid")
        {
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
            // for (let depth = 0; depth < Math.floor(numOfPlanes); ++depth)
            // {
            //     let normal = new Vector3(0, 0, 1);
            //     increment = boundsSize.z / (numOfPlanes + 1);
            //     constant = this._modelBounds.min.z + increment * (depth + 1);
            //     this._cutPlanes.push(new Plane(normal, -constant));
            // }
            for (let index = 0; index < this._cutPlanes.length; ++index) {
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
        this.updateBaseMeshMaterial();
    }

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

    public updateFillTexture(textureName: string, fillType: string, fillTextureName: string, fillColor: Color)
    {
        if(this._resourceLoader.isTextureLoaded(textureName))
        {
            this.updateCutMeshesMaterial(fillType, fillTextureName, fillColor);
        }
        else
        {
            this._resourceLoader.loadTexture(textureName, (tex) => {
                this.updateCutMeshesMaterial(fillType, fillTextureName, fillColor);
            });
        }
    }

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

    public updateCutMeshesMaterial(fillType: string, fillTextureName: string, fillColor: Color)
    {
        for(let index = 0; index < this._cutMeshes.length; ++index)
        {
            this._cutMeshes[index].group.traverse((obj) => {
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
                                if(this._resourceLoader.isTextureLoaded(fillTextureName))
                                    shader.uniforms.u_DiffuseMap.value = this._resourceLoader.getTexture(fillTextureName);

                            }
                        }
                    }
                }
            });
        }
    }

    public expandCutMeshes(value: number)
    {
        for (let index = 0; index < this._cutMeshes.length; ++index)
        {
            this._cutMeshes[index].group.position.copy(this._cutMeshes[index].referencePos).addScaledVector(this._cutMeshes[index].expandDir, value);
        }
    }

    private onMeshLoaded(meshName: string, parent: Object3D, pureMeshes: Mesh[], onMeshLoadedCallback: () => void)
    {
        this._scene.add(parent);
        this._sceneBaseModel = parent;
        this.setMeshesToCut(pureMeshes);

        setTimeout(() => { this.processLoadedMesh(meshName, onMeshLoadedCallback); }, 100); //Set a small timeout to allow the shader to compile properly
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

    //Artificial offset is used because we are setting the origin of the cut meshes in the center of the new geometry.
    //This shifts the coordinate space that they are in, and for consequent cuts it produces wrong results
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