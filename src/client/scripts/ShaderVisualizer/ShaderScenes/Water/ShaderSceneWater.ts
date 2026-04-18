import { AmbientLight, Color, DepthFormat, DepthTexture, DirectionalLight, FloatType, LinearSRGBColorSpace, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, PlaneGeometry, Raycaster, RedFormat, RepeatWrapping, Scene, ShaderMaterial, Texture, TextureLoader, Vector2, Vector3, WebGLRenderer, WebGLRenderTarget } from "three";
import { ShaderVisualizer } from "../../ShaderVisualizer";
import { DebugUI } from "../../../ThreeVisualizer/DebugGUI";
import { IShaderScene } from "../IShaderScene";
import { Asset3D } from "../../../../types";
import { FreeFlyCamera } from "./FreeFlyCamera";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { WaterMaterial, WaterMaterialUniforms } from "./WaterMaterial";


/*
To do:
    -look up a water shader and implement it
    -improve environment
    -antialias
    -check performance

skybox: https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky
potential tree: https://sketchfab.com/3d-models/coconut-palm-26e787f2ff2e4c0fb004c3b0210805a3
potential tree: https://sketchfab.com/3d-models/curly-palm-00f2b57dd0e844edbeb116034fa471ec
*/

declare type SpawnedObj = {
    obj: Object3D,
    radius: number;
}

//Handles high-level management of the scene and it's components
export class ShaderSceneWater implements IShaderScene
{
    private scene: Scene = new Scene();
    private visualizer!: ShaderVisualizer;
    private camera!: PerspectiveCamera;
    private renderer!: WebGLRenderer;

    //Default properties of the camera/scene in order to reset things back to how they were before
    private defaultCameraNear: number = 0.01;
    private defaultCameraFar: number = 100.0;
    private defaultCameraPos: Vector3 = new Vector3();
    private defaultControls!: OrbitControls;

    private debugUI!: DebugUI;

    private sandMesh?: Object3D;
    private sandTexAO?: Texture;

    private palmTree?: Object3D;
    private skybox?: Object3D;

    private depthBuffer!: WebGLRenderTarget;


    private waterPlaneResolution: number = 50.0;
    private waterMesh?: Mesh;
    private waterShader!: ShaderMaterial;

    private spawnedTrees: SpawnedObj[] = [];

    private aux1: Vector3 = new Vector3();

    private settings = {
        sandColor: new Color(0x48463e)
    }

    private waterUniforms: WaterMaterialUniforms = {
        u_DepthTex: { value: null },
        u_ViewportSize: { value: new Vector2() },
        u_CameraNear: { value: 0.1 },
        u_CameraFar: { value: 100.0 },
        
        u_FarColor: { value: new Color(0x436a92) },
        u_MidColor: { value: new Color(0x31a6bd) },
        u_ShoreColor: { value: new Color(0x6dd1c3) }
    }

    public getScene() { return this.scene; }

    public init(visualizer: ShaderVisualizer)
    {
        this.visualizer = visualizer;
        this.camera = visualizer.cameraManager.getCamera();
        this.renderer = visualizer.cameraManager.getRenderer();

        //Set up depth buffer
        this.depthBuffer = new WebGLRenderTarget(this.renderer.domElement.width, this.renderer.domElement.height);
        this.depthBuffer.depthBuffer = true;
        this.depthBuffer.texture.format = RedFormat;

        this.depthBuffer.depthTexture = new DepthTexture(this.renderer.domElement.width, this.renderer.domElement.height);
        this.depthBuffer.depthTexture.format = DepthFormat;
        this.depthBuffer.depthTexture.type = FloatType;

        //Store current camera properties to be able to reset them later on
        this.defaultCameraFar = this.camera.far;
        this.defaultCameraNear = this.camera.near;
        this.defaultCameraPos.copy(this.camera.position);
        this.defaultControls = this.visualizer.cameraManager.controls as OrbitControls;

        //Set desired camera properties
        this.camera.near = 0.1;
        this.camera.far = 750;
        this.camera.updateProjectionMatrix();
        this.camera.position.set(40, 20, 0);

        this.camera.rotation.set(0, Math.PI / 2.0, 0.0);
        this.camera.rotateX(-Math.PI / 8.0);

        this.waterUniforms.u_CameraNear.value = this.camera.near;
        this.waterUniforms.u_CameraFar.value = this.camera.far;

        let newControls = new FreeFlyCamera(this.camera, this.visualizer.cameraManager.getRenderer().domElement);
        newControls.moveSpeed = 25.0;
        this.visualizer.cameraManager.changeControls(newControls);

        //Set up lights in the scene
        let ambientLight = new AmbientLight(0xffffff, 0.25);
        this.scene.add(ambientLight);
        
        let directionalLight = new DirectionalLight(0xffffff, 7.0);
        directionalLight.position.set(10.0, 10.0, -10.0);
        this.scene.add(directionalLight);

        //Initialize debug ui
        this.debugUI = new DebugUI();
        let guiHtml = this.debugUI.getGUIClass()!.domElement;
        let guiParent = document.getElementById("shaderVisualizer") as HTMLElement;
        guiParent.appendChild(guiHtml);
        guiHtml.style.position = "absolute";
        guiHtml.style.left = "0px";
        guiHtml.style.top = "0px";

        //Set up the current scene
        this.displayUI();
        this.loadResources();
    }

    public update(deltaTime: number)
    {
        if(!this.waterMesh)
            return;

        //Render depth texture
        this.waterMesh.visible = false;
        this.setMaterialRendering(false, true); //Update materials to not render color information

        this.depthBuffer.setSize(this.renderer.domElement.width, this.renderer.domElement.height);
        this.renderer.setRenderTarget(this.depthBuffer);
        this.renderer.render(this.scene, this.camera);
        this.renderer.setRenderTarget(null);

        this.setMaterialRendering(true, true); //Reset materials
        this.waterMesh.visible = true;

        //Update water shader with rendered data
        this.waterUniforms.u_ViewportSize.value.set(this.renderer.domElement.width, this.renderer.domElement.height);
        this.waterUniforms.u_DepthTex.value = this.depthBuffer.depthTexture;
    }

    private setMaterialRendering(drawColor: boolean, drawDepth: boolean)
    {
        this.scene.traverse((asset: Object3D) => {
           if(!(asset instanceof Mesh))
                return;
            let mesh = asset as Mesh;
        
            if (Object.prototype.toString.call(mesh.material) === '[object Object]')
            {
                let mat = mesh.material as Material;
                mat.colorWrite = drawColor;
                mat.depthWrite = drawDepth;
                mat.depthTest = drawDepth;
            }
            else
            {
                let material = mesh.material as Material[];
                for (let index = 0; index < material.length; ++index)
                {
                    let mat = material[index];
                    mat.colorWrite = drawColor;
                    mat.depthWrite = drawDepth;
                    mat.depthTest = drawDepth;
                }
            }
        });
    }

    //Called when you deactivate the view, dispose & reset everything
    public hide()
    {
        //Reset the debug ui and the camera
        this.debugUI.reset(); //Events will also unsubscribe here
        
        this.camera.position.copy(this.defaultCameraPos);
        this.camera.far = this.defaultCameraFar;
        this.camera.near = this.defaultCameraNear;
        this.camera.updateProjectionMatrix();

        let controls = new OrbitControls(this.camera, this.visualizer.cameraManager.getRenderer().domElement);
        controls.target.copy(this.defaultControls.target);
        controls.position0.copy(this.defaultControls.position0);
        this.visualizer.cameraManager.changeControls(controls);

        this.depthBuffer.depthTexture.dispose();
        this.depthBuffer.dispose();
    }

    private displayUI()
    {
        this.debugUI.reset();

        this.debugUI.addColorPicker("", this.settings, "sandColor", "Sand Color", (value) => { this.settings.sandColor.set(value); });
        this.debugUI.addColorPicker("", this.waterUniforms.u_FarColor, "value", "Far Color", (value) => { this.waterUniforms.u_FarColor.value.set(value); });
        this.debugUI.addColorPicker("", this.waterUniforms.u_MidColor, "value", "Mid Color", (value) => { this.waterUniforms.u_MidColor.value.set(value); });
        this.debugUI.addColorPicker("", this.waterUniforms.u_ShoreColor, "value", "Shore Color", (value) => { this.waterUniforms.u_ShoreColor.value.set(value); });
    }

    private loadResources()
    {
        const objLoader = this.visualizer.objectLoader;
        const textureLoader = new TextureLoader();

        let waitForResources = false;
        if(this.sandMesh == undefined)
        {
            waitForResources = true;
            objLoader.loadModel("models/ShaderProjects/Water/Sand.glb", (asset: Asset3D) => {
                this.sandMesh = asset.model;
                this.onResourceLoaded();
            });
        }
        if(this.sandTexAO == undefined)
        {
            waitForResources = true;
            textureLoader.load("models/ShaderProjects/Water/Sand_AO.jpg", (asset: Texture) => {
                this.sandTexAO = asset;
                this.onResourceLoaded();
            });
        }
        if(this.palmTree == undefined)
        {
            waitForResources = true;
            objLoader.loadModel("models/ShaderProjects/Water/PalmTree.glb", (asset: Asset3D) => {
                this.palmTree = asset.model;
                this.onResourceLoaded();
            });
        }
        if(this.skybox == undefined)
        {
            waitForResources = true;
            objLoader.loadModel("models/ShaderProjects/Water/WaterSkybox.glb", (asset: Asset3D) => {
                this.skybox = asset.model;
                this.onResourceLoaded();
            });
        }

        if(!waitForResources)
            this.onResourceLoaded();
    }

    private onResourceLoaded()
    {
        if(this.sandMesh == undefined || this.sandTexAO == undefined || this.palmTree == undefined || this.skybox == undefined)
            return;

        this.setupSand();
        this.setupSkybox();
        this.setupTrees();
        this.setupWater();
    }

    private scaleTex(tex: Texture | null, widthRepeat: number, heightRepeat: number)
    {
        if(tex == null)
            return;

        tex.wrapS = RepeatWrapping;
        tex.wrapT = RepeatWrapping;
        tex.repeat.set(widthRepeat, heightRepeat);
    }

    private setupSand()
    {
        if(this.sandMesh == undefined || this.sandTexAO == undefined)
            return;

        this.sandMesh.scale.set(10, 10, 10);

        let mesh = this.sandMesh.children[0] as Mesh;
        this.sandMesh.updateMatrixWorld(true);

        let sandMat = mesh.material as MeshStandardMaterial;
        sandMat.aoMap = this.sandTexAO;
        sandMat.aoMapIntensity = 1.0;
        sandMat.emissive = this.settings.sandColor;
        sandMat.emissiveIntensity = 3.0;

        let texScale = 50;
        this.scaleTex(sandMat.map, texScale, texScale);
        this.scaleTex(sandMat.normalMap, texScale, texScale);
        this.scaleTex(sandMat.roughnessMap, texScale, texScale);
        this.scaleTex(sandMat.aoMap, texScale, texScale);

        this.scene.add(this.sandMesh);
    }

    private setupSkybox()
    {
        if(this.skybox == undefined)
            return;

        let mesh = this.skybox.children[0] as Mesh;
        let mat = mesh.material as MeshStandardMaterial;
        let newMat = new MeshBasicMaterial().copy(mat);
        newMat.map!.colorSpace = LinearSRGBColorSpace;
        mesh.material = newMat;

        this.scene.add(this.skybox);
    }

    private setupWater()
    {
        let waterGeom = new PlaneGeometry(1.0, 1.0, this.waterPlaneResolution, this.waterPlaneResolution);
        // let waterMat = new MeshStandardMaterial({ color: 0x35abc1, transparent: true, opacity: 0.5, side: DoubleSide });
        this.waterShader = WaterMaterial.createMaterial(this.waterUniforms);

        this.waterMesh = new Mesh(waterGeom, this.waterShader);
        this.waterMesh.position.set(0, 5, 0);
        this.waterMesh.rotateX(-Math.PI * 0.5)
        this.waterMesh.scale.set(750, 750, 750);
        this.scene.add(this.waterMesh);
    }

    private setupTrees()
    {
        if(this.palmTree == undefined)
            return;

        let leavesMat!: MeshStandardMaterial;
        this.palmTree.traverse((obj: Object3D) => {
            if(obj.name == "Leaves")
            {
                leavesMat = (obj as Mesh).material as MeshStandardMaterial;
            }
        });

        leavesMat.color.set(0.5, 1.0, 0.5);

        let min = new Vector3(-3, 8, -18);
        let max = new Vector3(10, 8, 15);
        this.spawnObj(this.palmTree, 30, this.spawnedTrees, 2, 3, min, max, 2.0, true, this.sandMesh);
    }

    private spawnObj(obj: Object3D, count: number, arrayToFill: SpawnedObj[], minScale: number, maxScale: number, minPos: Vector3, maxPos: Vector3, radius: number, checkCollision: boolean = true, floor?: Object3D)
    {
        let targetPos = new Vector3();
        let raycaster = new Raycaster();
        raycaster.far = 300.0;
        let raycastDir = new Vector3(0, -1, 0);
        for(let index = 0; index < count; ++index)
        {
            if(checkCollision)
            {
                let foundCollision = true;
                let currentIterations = 0;
                while(foundCollision && currentIterations < 100)
                {
                    foundCollision = false;
                    targetPos.set(
                        minPos.x + Math.random() * (maxPos.x - minPos.x),
                        minPos.y + Math.random() * (maxPos.y - minPos.y),
                        minPos.z + Math.random() * (maxPos.z - minPos.z),
                    );
                    for(let index2 = 0; index2 < arrayToFill.length; ++index2)
                    {
                        this.aux1.copy(targetPos).sub(arrayToFill[index2].obj.position);
                        let rad = Math.max(radius, arrayToFill[index2].radius);
                        if(this.aux1.lengthSq() <= rad * rad)
                        {
                            foundCollision = true;
                            break;
                        }
                    }
                    currentIterations++;
                }
                
                if(foundCollision)
                {
                    console.warn("Couldn't spawn all trees, tweak radius or decrease spawn count.");
                    return;
                }
            }
            else
            {
                targetPos.set(
                    minPos.x + Math.random() * (maxPos.x - minPos.x),
                    minPos.y + Math.random() * (maxPos.y - minPos.y),
                    minPos.z + Math.random() * (maxPos.z - minPos.z),
                );
            }

            if(floor != undefined)
            {
                this.aux1.copy(targetPos);
                this.aux1.y = 100.0;
                raycaster.set(this.aux1, raycastDir);
                let result = raycaster.intersectObjects([floor], true);
                
                if(result.length > 0)
                {
                    targetPos.copy(result[0].point).addScaledVector(raycastDir, 0.25);
                }
            }

            // let sphere = new Mesh(new SphereGeometry(), new MeshStandardMaterial({color: 0xff0000, transparent: true, opacity: 0.25}));
            // sphere.position.copy(targetPos);
            // sphere.scale.set(radius * 0.5, radius * 0.5, radius * 0.5);
            // this.scene.add(sphere);

            let spawnedObj = obj.clone();
            spawnedObj.rotateY(Math.random() * Math.PI * 2.0);
            let scale = minScale + Math.random() * (maxScale - minScale);
            spawnedObj.scale.set(scale, scale, scale);
            spawnedObj.position.copy(targetPos);
            this.scene.add(spawnedObj);

            arrayToFill.push({ obj: spawnedObj, radius: radius });
        }
    }
}
