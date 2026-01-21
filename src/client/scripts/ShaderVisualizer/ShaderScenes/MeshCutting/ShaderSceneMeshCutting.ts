import { AmbientLight, Box3, BoxGeometry, Color, DirectionalLight, Group, Material, MathUtils, Mesh, MeshStandardMaterial, Object3D, Plane, PlaneHelper, Scene, ShaderMaterial, SkinnedMesh, Texture, TextureLoader, TorusKnotGeometry, Vector3 } from "three";
import { MeshCutter } from "./MeshCutter";
import { DebugUI } from "../../../ThreeVisualizer/DebugGUI";
import { ObjectLoader } from "../../../ThreeVisualizer/ObjectLoader";
import { CutLinePreviewShader } from "./CutLinePreviewShader";
import { ShaderVisualizer } from "../../ShaderVisualizer";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";

declare type CutGroup = {
    group: Group,
    referencePos: Vector3,
    expandDir: Vector3
}

export class ShaderSceneMeshCutting
{
    private _scene: Scene = new Scene();
    private _meshesToCut: Mesh[] = [];
    private _meshCutter = new MeshCutter();
    private _cutMeshes: CutGroup[] = [];
    private _cutPlanes: Plane[] = [];
    private _cutPlaneNormals: Vector3[] = [];
    private _cutPlanePoints: Vector3[] = [];
    private _isMeshCut: boolean = false;
    private _modelFullyLoaded: boolean = false;
    private _modelBounds: Box3 = new Box3();
    private _boundsCenter: Vector3 = new Vector3();

    private _sceneBaseModel?: Object3D;

    private _visualizer!: ShaderVisualizer;
    private _objectLoader!: ObjectLoader;
    private _textureLoader!: TextureLoader;
    private _debugUI!: DebugUI;

    private _currentFillTexture: string = "";
    private _loadedFillTextures: Map<string, Texture> = new Map();

    private _artistCredits!: HTMLDivElement;

    private _debugUISettings = {
        numOfPlanes: 5,
        explodeRadius: 0.0,

        currentMesh: "Heart",
        availableMeshes: ["Torus Knot", "Heart", "Mecha Girl", "God Eater Sword", "City"],

        cutMode: "Vertical",
        availableCutModes: ["Horizontal", "Vertical", "Depth", "Grid", "Random"],

        fillType: "Texture Fill",
        availableFillTypes: ["No Fill", "Color Fill", "Texture Fill"],

        fillTexture: "Orange",
        availableFillTextures: ["Orange", "Watermelon", "Rock", "Wood", "Lava", "Blood", "Blood Veins"],
        fillColor: new Color(0x2e70a6),

        currentAnimation: "Default",
        availableAnimations: ["Default"],

        cutDuration: "0ms",

        cut: () => { this.runCuttingAlgoritm(); },
        reset: () => { this.resetState(); },
        randomizeCuts: () => { this.updateCutPlanes(); }
    };

    public init(visualizer: ShaderVisualizer)
    {
        this._visualizer = visualizer;
        this._objectLoader = new ObjectLoader();
        this._textureLoader = new TextureLoader();
        this._debugUI = new DebugUI();

        let guiHtml = this._debugUI.getGUIClass()!.domElement;
        let guiParent = document.getElementById("shaderVisualizer") as HTMLElement;
        guiParent.appendChild(guiHtml);
        guiHtml.style.position = "absolute";
        guiHtml.style.left = "0px";
        guiHtml.style.top = "0px";

        this._artistCredits = document.createElement("div");
        this._artistCredits.id = "artistCredits";
        this._artistCredits.style.display = "none";
        this._artistCredits.innerHTML = "Please credit <a href='https://sketchfab.com/3d-models/city-1f50f0d6ec5a493d8e91d7db1106b324'>SpatialNeglect</a> for the 3D model";
        guiParent.appendChild(this._artistCredits);

        let ambientLight = new AmbientLight(0xffffff, 0.25);
        this._scene.add(ambientLight);
        
        let directionalLight = new DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(10.0, 10.0, 5.0);
        this._scene.add(directionalLight);

        for (let index = 0; index < 50; ++index) // Needs to match max planes in the shader
         {
            this._cutPlaneNormals.push(new Vector3());
            this._cutPlanePoints.push(new Vector3());
        }

        this.onMeshChanged = this.onMeshChanged.bind(this);
        this.onCutModeChanged = this.onCutModeChanged.bind(this);
        this.onNumOfPlanesChanged = this.onNumOfPlanesChanged.bind(this);
        this.onFillTypeChanged = this.onFillTypeChanged.bind(this);
        this.onFillTextureChanged = this.onFillTextureChanged.bind(this);
        this.onFillColorChanged = this.onFillColorChanged.bind(this);

        this.displayCutMenu();
        this.onFillTextureChanged();
        this.onMeshChanged();

        /* To do:
            Clean up the code
            Add code inspection (also add error checking for everything: check index 0, throw proper errors, etc.)

            Test on skinned meshes
                * Doesn't cut pose, cuts only base position. Is this ok?
                * Animate mesh and make cut parts also animated
        */
    }

    public update(deltaTime: number)
    {

    }

    public hide()
    {

    }

    public getScene() { return this._scene; }

    private runCuttingAlgoritm()
    {
        const start = performance.now();

        this._cutMeshes.push({
            group: new Group(),
            expandDir: new Vector3(),
            referencePos: new Vector3()
        });
        this._cutMeshes[0].group.position.copy(this._sceneBaseModel!.position);
        for (let index = 0; index < this._meshesToCut.length; ++index)
        {
            this._cutMeshes[0].group.add(this._meshesToCut[index].clone(true)); //Clone to keep original mesh visible
        }
        for (let index = 0; index < this._cutPlanes.length; ++index)
        {
            this._cutMeshes = this.cutMesh(this._cutMeshes, this._cutPlanes[index]);
        }

        for (let index = 0; index < this._cutMeshes.length; ++index)
        {
            this._cutMeshes[index].referencePos.copy(this._cutMeshes[index].group.position);
            this._scene.add(this._cutMeshes[index].group);
        }

        this._scene.remove(this._sceneBaseModel!);
        this._debugUISettings.explodeRadius = 0.05;

        this._debugUISettings.cutDuration = `${(performance.now() - start).toFixed(2)}ms`;

        this._isMeshCut = true;
        this.displayResetMenu();
    }

    private resetState()
    {
        for(let index = 0; index < this._cutMeshes.length; ++index)
        {
            this._scene.remove(this._cutMeshes[index].group);
            this._cutMeshes[index].group.traverse((obj) => {
                this.disposeObject(obj);
            });
        }
        this._cutMeshes = [];
        this._scene.add(this._sceneBaseModel!);

        this._isMeshCut = false;
        this.displayCutMenu();
    }

    private disposeObject(obj: Object3D)
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

    //Artificial offset is used because we are setting the origin of the cut meshes in the center of the new geometry.
    //This shifts the coordinate space that they are in, and for consequent cuts it produces wrong results
    private cutMesh(meshes: CutGroup[], plane: Plane)
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
                let texture = this._loadedFillTextures.get(this._debugUISettings.fillTexture)!;
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

    private displayCutMenu()
    {
        this._debugUI.reset();

        this._debugUI.addDropdown("", this._debugUISettings, "currentMesh", this._debugUISettings.availableMeshes, "Mesh", this.onMeshChanged);
        this._debugUI.addDropdown("", this._debugUISettings, "cutMode", this._debugUISettings.availableCutModes, "Cut Mode", this.onCutModeChanged);

        let maxCutPlanes = this._debugUISettings.cutMode == "Grid" ? 5 : 10;
        if(this._debugUISettings.currentMesh == "City")
            maxCutPlanes = this._debugUISettings.cutMode == "Grid" ? 3 : 6;

        if(this._debugUISettings.numOfPlanes > maxCutPlanes)
            this._debugUISettings.numOfPlanes = maxCutPlanes;
        this._debugUI.addSlider("", this._debugUISettings, "numOfPlanes", 1, maxCutPlanes, "Number of Cuts", this.onNumOfPlanesChanged);
        if(this._debugUISettings.cutMode == "Random")
            this._debugUI.addButton("", this._debugUISettings, "randomizeCuts", "Randomize Cuts");

        this._debugUI.addDropdown("", this._debugUISettings, "fillType", this._debugUISettings.availableFillTypes, "Fill Type", this.onFillTypeChanged);
        if (this._debugUISettings.fillType == "Texture Fill")
            this._debugUI.addDropdown("", this._debugUISettings, "fillTexture", this._debugUISettings.availableFillTextures, "Fill Texture", this.onFillTextureChanged);
        if (this._debugUISettings.fillType == "Color Fill")
            this._debugUI.addColorPicker("", this._debugUISettings, "fillColor", "Fill Color", this.onFillColorChanged);

        this._debugUI.addButton("", this._debugUISettings, "cut", "Cut");
    }
    
    private displayResetMenu()
    {
        this._debugUI.reset();

        //Update positions to current slider value
        for (let index = 0; index < this._cutMeshes.length; ++index) {
            this._cutMeshes[index].group.position.copy(this._cutMeshes[index].referencePos).addScaledVector(this._cutMeshes[index].expandDir, this._debugUISettings.explodeRadius);
        }
        this._debugUI.addSlider("", this._debugUISettings, "explodeRadius", 0.0, 3.0, "Expand Radius", () => {
            for (let index = 0; index < this._cutMeshes.length; ++index) {
                this._cutMeshes[index].group.position.copy(this._cutMeshes[index].referencePos).addScaledVector(this._cutMeshes[index].expandDir, this._debugUISettings.explodeRadius);
            }
        });

        this._debugUI.addDropdown("", this._debugUISettings, "fillType", this._debugUISettings.availableFillTypes, "Fill Type", this.onFillTypeChanged);
        if (this._debugUISettings.fillType == "Texture Fill")
            this._debugUI.addDropdown("", this._debugUISettings, "fillTexture", this._debugUISettings.availableFillTextures, "Fill Texture", this.onFillTextureChanged);
        if (this._debugUISettings.fillType == "Color Fill")
            this._debugUI.addColorPicker("", this._debugUISettings, "fillColor", "Fill Color", this.onFillColorChanged);

        this._debugUI.addButton("", this._debugUISettings, "reset", "Reset");

        this._debugUI.addText("", this._debugUISettings, "cutDuration", "Cut Duration", false);
    }

    private onMeshChanged()
    {
        if (this._sceneBaseModel != undefined)
        {
            this._scene.remove(this._sceneBaseModel);
            this.disposeObject(this._sceneBaseModel);
            this._sceneBaseModel = undefined;
        }

        for(let index = 0; index < this._meshesToCut.length; ++index)
        {
            this._scene.remove(this._meshesToCut[index]);
            this._meshesToCut[index].traverse((obj) => {
                this.disposeObject(obj);
            });
        }
        this._meshesToCut = [];

        this._modelFullyLoaded = false;
        if (this._debugUISettings.currentMesh == "Torus Knot")
        {
            let mesh = new Mesh(new TorusKnotGeometry(1, 0.4, 256, 32), new CutLinePreviewShader({
                u_LineColor: { value: new Vector3(1.0, 1.0, 0.0) },
                u_LineThickness: { value: 0.01 },
                u_CutPlaneNormals: { value: this._cutPlaneNormals },
                u_CutPlanePoints: { value: this._cutPlanePoints },
                u_NumOfCutPlanes: { value: 0 }
            }));
            this._meshesToCut.push(mesh);
            this._scene.add(mesh);
            this._sceneBaseModel = mesh;
            this._modelBounds.setFromObject(this._sceneBaseModel);
            this._modelFullyLoaded = true;
            setTimeout(() => { this.updateCutPlanes(); }, 100); //Set a small timeout to allow the shader to compile properly
        }
        else {
            let path = this.getPathFromModel(this._debugUISettings.currentMesh);
            this._objectLoader.loadModel(path, (obj) => {
                this._scene.add(obj.model);
                this._sceneBaseModel = obj.model;
                obj.model.traverse((item) => {
                    let mesh = item as Mesh;
                    if (mesh != undefined && mesh != null && mesh.geometry != undefined) {
                        let newMat = new CutLinePreviewShader({
                            u_LineColor: { value: new Vector3(1.0, 1.0, 0.0) },
                            u_LineThickness: { value: 0.01 },
                            u_CutPlaneNormals: { value: this._cutPlaneNormals },
                            u_CutPlanePoints: { value: this._cutPlanePoints },
                            u_NumOfCutPlanes: { value: 0 }
                        });
                        if(mesh.material instanceof MeshStandardMaterial)
                            newMat.copy(mesh.material as Material);
                        mesh.material = newMat;
                        this._meshesToCut.push(mesh);

                        if(item instanceof SkinnedMesh)
                        {
                            item.skeleton.pose();
                            item.updateMatrixWorld(true);
                        }
                    }
                });
                this._modelFullyLoaded = true;
                this._artistCredits.style.display = this._debugUISettings.currentMesh == "City" ? "block" : "none";
                setTimeout(() => {
                    this._modelBounds.setFromObject(this._sceneBaseModel!, true);
                    this._modelBounds.getCenter(this._boundsCenter);
                    this._sceneBaseModel!.position.sub(this._boundsCenter);
                    this._modelBounds.setFromObject(this._sceneBaseModel!, true); //Update bounds after the shift
                    this.displayCutMenu();
                    this.updateCutPlanes();
                }, 100);
            }, () => { });
        }
    }

    private onCutModeChanged()
    {
        if (this._debugUISettings.cutMode == "Grid")
            this._debugUISettings.numOfPlanes = MathUtils.clamp(this._debugUISettings.numOfPlanes, 1, 5);
        this.displayCutMenu();
        this.updateCutPlanes();
    }
    
    private onNumOfPlanesChanged()
    {
        this.updateCutPlanes();
    }
    
    private onFillTypeChanged()
    {
        if (!this._isMeshCut)
            this.displayCutMenu();
        else
            this.displayResetMenu();
        this.updateCutMeshesMaterial();
    }
    
    private onFillTextureChanged()
    {
        if(this._loadedFillTextures.has(this._debugUISettings.fillTexture))
        {
            this.updateCutMeshesMaterial();
        }
        else
        {
            let texPath = this.getPathFromFillTexture(this._debugUISettings.fillTexture);
            this._textureLoader.load(texPath, (texture: Texture) => {
                this._loadedFillTextures.set(this._debugUISettings.fillTexture, texture);
                this.updateCutMeshesMaterial();
            });
        }
    }
    
    private onFillColorChanged(value: any)
    {
        this._debugUISettings.fillColor.setStyle(value);
        this.updateCutMeshesMaterial();
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
        switch(textureName)
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
    
    private updateCutPlanes()
    {
        this._cutPlanes = [];

        let boundsCenter = new Vector3();
        let boundsSize = new Vector3();
        this._modelBounds.getSize(boundsSize);
        this._modelBounds.getCenter(boundsCenter);

        let constant = 0;
        let increment = 0;
        let numOfPlanes = Math.floor(this._debugUISettings.numOfPlanes);

        if (this._debugUISettings.cutMode == "Grid")
        {
            for (let width = 0; width < numOfPlanes; ++width)
            {
                let normal = new Vector3(1, 0, 0);
                increment = boundsSize.x / (numOfPlanes + 1);
                constant = this._modelBounds.min.x + increment * (width + 1);
                this._cutPlanes.push(new Plane(normal, -constant));
            }
            for (let height = 0; height < numOfPlanes; ++height)
            {
                let normal = new Vector3(0, 1, 0);
                increment = boundsSize.y / (numOfPlanes + 1);
                constant = this._modelBounds.min.y + increment * (height + 1);
                this._cutPlanes.push(new Plane(normal, -constant));
            }
            // for (let depth = 0; depth < numOfPlanes; ++depth)
            // {
            //     let normal = new Vector3(0, 0, 1);
            //     increment = boundsSize.z / (numOfPlanes + 1);
            //     constant = this._modelBounds.min.z + increment * (depth + 1);
            //     this._cutPlanes.push(new Plane(normal, -constant));
            // }
            for (let index = 0; index < this._cutPlanes.length; ++index)
            {
                this._cutPlaneNormals[index].copy(this._cutPlanes[index].normal);
                this._cutPlanePoints[index].copy(this._cutPlanes[index].normal).multiplyScalar(-this._cutPlanes[index].constant);
            }
        }
        else
        {
            for (let index = 0; index < numOfPlanes; ++index)
            {
                let normal = new Vector3(0, 0, 0);
                switch (this._debugUISettings.cutMode)
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
                // const helper = new PlaneHelper( this._cutPlanes[index], 4, 0xffff00 );
                // this._scene.add( helper );
            }
        }
        this.updateBaseMeshMaterial();
    }

    private updateBaseMeshMaterial()
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

    private updateCutMeshesMaterial()
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
                                shader.uniforms.u_UseDiffuseMap.value = (this._debugUISettings.fillType == "Texture Fill");
                                shader.uniforms.u_HideShader.value = (this._debugUISettings.fillType == "No Fill");
                                shader.uniforms.u_DiffuseColor.value = this._debugUISettings.fillColor;
                                if(this._loadedFillTextures.has(this._debugUISettings.fillTexture))
                                    shader.uniforms.u_DiffuseMap.value = this._loadedFillTextures.get(this._debugUISettings.fillTexture);

                            }
                        }
                    }
                }
            });
        }
    }
}
