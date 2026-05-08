import { AmbientLight, CameraHelper, Color, DepthFormat, DepthTexture, DirectionalLight, EquirectangularReflectionMapping, FloatType, Fog, FogExp2, LinearSRGBColorSpace, Material, Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, OrthographicCamera, PCFSoftShadowMap, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Quaternion, Raycaster, RedFormat, RepeatWrapping, RGBAFormat, Scene, ShaderMaterial, SphereGeometry, SRGBColorSpace, Texture, TextureLoader, Vector2, Vector3, WebGLRenderer, WebGLRenderTarget } from "three";
import { ShaderVisualizer } from "../../ShaderVisualizer";
import { DebugUI } from "../../../ThreeVisualizer/DebugGUI";
import { IShaderScene } from "../IShaderScene";
import { Asset3D } from "../../../../types";
import { FreeFlyCamera } from "../../../ThreeVisualizer/FreeFlyCamera";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { WaterMaterial, WaterMaterialUniforms } from "./Scripts/WaterMaterial";
import { timeStats } from "../../../../client";
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass";
import { WaterPostProcessing, WaterPostProcessingParams } from "./Scripts/WaterPostProcessing";


/*
To do:
    -look up a water shader and implement it
    -improve environment
    -antialias
    -check performance

skybox: https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky
potential tree: https://sketchfab.com/3d-models/coconut-palm-26e787f2ff2e4c0fb004c3b0210805a3
potential tree: https://sketchfab.com/3d-models/curly-palm-00f2b57dd0e844edbeb116034fa471ec
env map: https://polyhaven.com/a/farm_field_puresky
seashell1: https://sketchfab.com/3d-models/seashell-9b59afbf4a694e8cb6daa0e0235cff86
seashell2: https://sketchfab.com/3d-models/purple-seashell-04d9983ba04242fe99182d4506ea0714
rock1: https://sketchfab.com/3d-models/rock-stone-02-0455747c7ac848269830ed0dca33726c
rock2: https://sketchfab.com/3d-models/sandy-rock-d200b776c544466986b4f2fdd067113e
rock3: https://sketchfab.com/3d-models/desert-rock-base-62da7c177a6241eebe94c4eba6fc81b7
rock4: https://sketchfab.com/3d-models/obj-nat-rock-01-62d63fd7d1dd416aac1496eb19c43cc0
chest1: https://sketchfab.com/3d-models/treasure-chest-773a2f35025b4e2e9ac48fd84c16b3ab
chest2: https://sketchfab.com/3d-models/pirate-a-chest-a-94c560bc25c34d4caeabb217bafeb467
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

    private rocksMesh?: Object3D;
    private sandMesh?: Object3D;
    private sandTexAO?: Texture;

    private palmTree?: Object3D;
    private skybox?: Object3D;

    private depthBuffer!: WebGLRenderTarget;
    private waterPostMat!: ShaderMaterial;
    private waterPostPlane!: Mesh;
    private waterPostCamera!: OrthographicCamera;
    private waterPostScene!: Scene;
    private waterPostRT!: WebGLRenderTarget;

    private waterPlaneResolution: number = 600.0;
    private waterMesh?: Mesh;
    private waterShader!: ShaderMaterial;

    private seashell1?: Object3D;
    private seashell2?: Object3D;

    private spawnedTrees: SpawnedObj[] = [];
    private spawnedSeashells: SpawnedObj[] = [];

    private aux1: Vector3 = new Vector3();

    private settings = {
        sandColor: new Color(0x48463e)
    }

    private waterUniforms: WaterMaterialUniforms = {
        u_DepthTex: { value: null },
        u_ViewportSize: { value: new Vector2() },
        u_CameraNear: { value: 0.1 },
        u_CameraFar: { value: 100.0 },
        u_CameraPos: { value: new Vector3() },
        u_InverseViewMatrix: { value: new Matrix4() },
        
        u_FarColor: { value: new Color(0x436a92) },
        u_MidColor: { value: new Color(0x31a6bd) },
        u_ShoreColor: { value: new Color(0x6dd1c3) },

        u_LightDir: { value: new Vector3() },
        u_AmbientIntensity: { value: 0.2 },
        u_LightIntensity: { value: 5.0 },
        u_LightColor: { value: new Color(0xffffff) },
        u_FresnelColorIntensity: { value: 0.4},
        u_FresnelColor: { value: new Color(0xd6dcd6) },
        u_EnvironmentIntensity: { value: 0.075 },
        
        u_WaveCount: { value: 4.0 },
        u_WaveSteepness: { value: 1.5 },
        u_WaveAmplitude: { value: 0.45 },
        u_WaveFrequency: { value: 30.0 },
        u_WaveSpeed: { value: 1.2 },

        u_FoamDistance: { value: 0.0125 },
        u_FoamOpacity: { value: 0.7 },
        u_FoamColor: { value: new Color(0xffffff) },

        u_WaveRotationFactor: { value: 1.3 },
        u_WaveSteepnessMultiplier: { value: 1.15 },

        u_Time: { value: 0.0 },

        u_WaterNormal: { value: null },
        u_SkyTexture: { value: null }
    }

    private waterPostUniforms: WaterPostProcessingParams = {
        u_CameraNear: { value: 0.1 },
        u_CameraFar: { value: 100.0 },
        u_CameraPos: { value: new Vector3() },

        u_IsUnderwater: { value: false },
        
        u_FarColor: { value: new Color(0x528f88) },
        u_MidColor: { value: new Color(0x1d5e7b) },
        u_NearColor: { value: new Color(0x22b8c8) },

        u_DiffuseTex: { value: null },
        u_DepthTex: { value: null },
    };

    public getScene() { return this.scene; }

    public init(visualizer: ShaderVisualizer)
    {
        this.visualizer = visualizer;
        this.camera = visualizer.cameraManager.getCamera();
        this.renderer = visualizer.cameraManager.getRenderer();

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFSoftShadowMap;

        //Set up depth buffer
        this.depthBuffer = new WebGLRenderTarget(this.renderer.domElement.width, this.renderer.domElement.height);
        this.depthBuffer.depthBuffer = true;
        this.depthBuffer.texture.format = RedFormat;

        this.depthBuffer.depthTexture = new DepthTexture(this.renderer.domElement.width, this.renderer.domElement.height);
        this.depthBuffer.depthTexture.format = DepthFormat;
        this.depthBuffer.depthTexture.type = FloatType;

        //Set up post processing
        this.waterPostRT = new WebGLRenderTarget(this.renderer.domElement.width, this.renderer.domElement.height);
        this.waterPostRT.texture.format = RGBAFormat;

        this.waterPostRT.depthTexture = new DepthTexture(this.renderer.domElement.width, this.renderer.domElement.height);
        this.waterPostRT.depthTexture.format = DepthFormat;
        this.waterPostRT.depthTexture.type = FloatType;

        this.waterPostCamera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
        this.waterPostCamera.position.set(0, 0, 10);
        this.waterPostMat = WaterPostProcessing.createPass(this.waterPostUniforms);
        this.waterPostPlane = new Mesh(new PlaneGeometry(2, 2), this.waterPostMat);
        this.waterPostScene = new Scene();
        this.waterPostScene.add(this.waterPostPlane);

        //Store current camera properties to be able to reset them later on
        this.defaultCameraFar = this.camera.far;
        this.defaultCameraNear = this.camera.near;
        this.defaultCameraPos.copy(this.camera.position);
        this.defaultControls = this.visualizer.cameraManager.controls as OrbitControls;

        //Set desired camera properties
        this.camera.near = 0.1;
        this.camera.far = 750;
        this.camera.updateProjectionMatrix();
        this.camera.position.set(-50, 19, 33.5);
        this.camera.rotation.set(-0.38, -0.835, -0.28);

        this.waterUniforms.u_CameraNear.value = this.camera.near;
        this.waterUniforms.u_CameraFar.value = this.camera.far;

        this.waterPostUniforms.u_CameraNear.value = this.camera.near;
        this.waterPostUniforms.u_CameraFar.value = this.camera.far;

        let newControls = new FreeFlyCamera(this.camera, this.visualizer.cameraManager.getRenderer().domElement);
        newControls.moveSpeed = 25.0;
        this.visualizer.cameraManager.changeControls(newControls);

        //Set up lights in the scene
        let ambientLight = new AmbientLight(0xffffff, 0.25);
        this.scene.add(ambientLight);
        
        let directionalLight = new DirectionalLight(0xffffff, 5.0);
        directionalLight.position.set(25.0, 50.0, -25.0);
        directionalLight.target.position.set(0.0, 0.0, 0.0);

        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.set(2048, 2048);
        directionalLight.shadow.camera.near = 1.0;
        directionalLight.shadow.camera.far = 150.0;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.bias = -0.0001;

        this.scene.add(directionalLight);
        this.waterUniforms.u_LightDir.value.copy(directionalLight.target.position).sub(directionalLight.position).normalize();

        // this.scene.add(new CameraHelper(directionalLight.shadow.camera));

        // let sunSphere = new Mesh(new SphereGeometry(), new MeshBasicMaterial({ color: 0xff0000 }));
        // sunSphere.position.copy(directionalLight.position);
        // this.scene.add(sunSphere);

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
        this.skybox!.visible = false;
        this.setMaterialRendering(false, true); //Update materials to not render color information

        this.depthBuffer.setSize(this.renderer.domElement.width, this.renderer.domElement.height);
        this.renderer.setRenderTarget(this.depthBuffer);
        this.renderer.render(this.scene, this.camera);
        this.renderer.setRenderTarget(null);

        this.setMaterialRendering(true, true); //Reset materials
        this.waterMesh.visible = true;
        this.skybox!.visible = true;

        //Update water shader with rendered data
        this.waterUniforms.u_ViewportSize.value.set(this.renderer.domElement.width, this.renderer.domElement.height);
        this.waterUniforms.u_DepthTex.value = this.depthBuffer.depthTexture;
        this.waterUniforms.u_Time.value = timeStats.currentTime;
        this.waterUniforms.u_CameraPos.value.copy(this.camera.position);
        this.waterUniforms.u_InverseViewMatrix.value.copy(this.camera.matrixWorldInverse);

        // if(this.skybox != undefined)
        //     ((this.skybox.children[0] as Mesh).material as MeshStandardMaterial).depthWrite = false;

        this.waterPostRT.setSize(this.renderer.domElement.width, this.renderer.domElement.height);
        this.renderer.setRenderTarget(this.waterPostRT);
    }

    public postRender()
    {
        this.renderer.setRenderTarget(null);

        this.waterPostUniforms.u_DiffuseTex.value = this.waterPostRT.texture;
        this.waterPostUniforms.u_DepthTex.value = this.waterPostRT.depthTexture;
        this.waterPostUniforms.u_CameraPos.value.copy(this.camera.position);

        if(this.waterMesh != undefined)
            this.waterPostUniforms.u_IsUnderwater.value = this.camera.position.y < this.waterMesh.position.y;
        
        this.renderer.render(this.waterPostScene, this.waterPostCamera);
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
        
        this.debugUI.addFolder("General", "");
        this.debugUI.addColorPicker("General", this.settings, "sandColor", "Sand Color", (value) => { this.settings.sandColor.set(value); });
        this.debugUI.addColorPicker("General", this.waterUniforms.u_FarColor, "value", "Far Color", (value) => { this.waterUniforms.u_FarColor.value.set(value); });
        this.debugUI.addColorPicker("General", this.waterUniforms.u_MidColor, "value", "Mid Color", (value) => { this.waterUniforms.u_MidColor.value.set(value); });
        this.debugUI.addColorPicker("General", this.waterUniforms.u_ShoreColor, "value", "Shore Color", (value) => { this.waterUniforms.u_ShoreColor.value.set(value); });
        this.debugUI.addSlider("General", this.waterUniforms.u_FoamDistance, "value", 0.0, 0.1, "Foam Distance");
        this.debugUI.addSlider("General", this.waterUniforms.u_FoamOpacity, "value", 0.0, 1.0, "Foam Opacity");
        this.debugUI.addColorPicker("General", this.waterUniforms.u_FoamColor, "value", "Foam Color", (value) => { this.waterUniforms.u_FoamColor.value.set(value); });

        this.debugUI.addFolder("PBR", "");
        this.debugUI.addSlider("PBR", this.waterUniforms.u_AmbientIntensity, "value", 0.0, 1.0, "Ambient Intensity");
        this.debugUI.addSlider("PBR", this.waterUniforms.u_LightIntensity, "value", 0.0, 10.0, "Light Intensity");
        this.debugUI.addSlider("PBR", this.waterUniforms.u_FresnelColorIntensity, "value", 0.0, 1.0, "Fresnel Color Intensity");
        this.debugUI.addSlider("PBR", this.waterUniforms.u_EnvironmentIntensity, "value", 0.0, 1.0, "Environment Intensity");
        this.debugUI.addColorPicker("PBR", this.waterUniforms.u_LightColor, "value", "Light Color", (value) => { this.waterUniforms.u_LightColor.value.set(value); });
        this.debugUI.addColorPicker("PBR", this.waterUniforms.u_FresnelColor, "value", "Fresnel Color", (value) => { this.waterUniforms.u_FresnelColor.value.set(value); });

        this.debugUI.addFolder("WaveMovement", "");
        this.debugUI.addSlider("WaveMovement", this.waterUniforms.u_WaveCount, "value", 1.0, 10.0, "Wave Count");
        this.debugUI.addSlider("WaveMovement", this.waterUniforms.u_WaveSteepness, "value", 0.0, 1.5, "Wave Steepness");
        this.debugUI.addSlider("WaveMovement", this.waterUniforms.u_WaveAmplitude, "value", 0.001, 3.0, "Wave Amplitude");
        this.debugUI.addSlider("WaveMovement", this.waterUniforms.u_WaveFrequency, "value", 8.0, 100.0, "Wave Frequency");
        this.debugUI.addSlider("WaveMovement", this.waterUniforms.u_WaveSpeed, "value", 0.0, 3.0, "Wave Speed");
        this.debugUI.addSlider("WaveMovement", this.waterUniforms.u_WaveRotationFactor, "value", 0.0, 3.14, "Wave Rotation Factor");
        this.debugUI.addSlider("WaveMovement", this.waterUniforms.u_WaveSteepnessMultiplier, "value", 0.0, 1.25, "Wave Steepness Multiplier");

        this.debugUI.addFolder("Underwater", "");
        this.debugUI.addColorPicker("Underwater", this.waterPostUniforms.u_FarColor, "value", "Far Color", (value) => { this.waterPostUniforms.u_FarColor.value.set(value); });
        this.debugUI.addColorPicker("Underwater", this.waterPostUniforms.u_MidColor, "value", "Mid Color", (value) => { this.waterPostUniforms.u_MidColor.value.set(value); });
        this.debugUI.addColorPicker("Underwater", this.waterPostUniforms.u_NearColor, "value", "Near Color", (value) => { this.waterPostUniforms.u_NearColor.value.set(value); });
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
        if(this.rocksMesh == undefined)
        {
            waitForResources = true;
            objLoader.loadModel("models/ShaderProjects/Water/Rocks.glb", (asset: Asset3D) => {
                this.rocksMesh = asset.model;
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
        if(this.waterUniforms.u_WaterNormal.value == null)
        {
            waitForResources = true;
            textureLoader.load("models/ShaderProjects/Water/WaterNormal.jpg", (asset: Texture) => {
                asset.wrapS = RepeatWrapping;
                asset.wrapT = RepeatWrapping;
                this.waterUniforms.u_WaterNormal.value = asset;
                this.onResourceLoaded();
            });
        }
        if(this.waterUniforms.u_SkyTexture.value == null)
        {
            waitForResources = true;
            new RGBELoader().load("models/ShaderProjects/Water/SkyEnvMap.hdr", (asset: Texture) => {
                asset.wrapS = RepeatWrapping;
                asset.wrapT = RepeatWrapping;
                asset.mapping = EquirectangularReflectionMapping;
                this.waterUniforms.u_SkyTexture.value = asset;
                this.onResourceLoaded();
            });
        }
        if(this.seashell1 == undefined)
        {
            waitForResources = true;
            objLoader.loadModel("models/ShaderProjects/Water/Seashell1.glb", (asset: Asset3D) => {
                this.seashell1 = asset.model;
                this.onResourceLoaded();
            });
        }
        if(this.seashell2 == undefined)
        {
            waitForResources = true;
            objLoader.loadModel("models/ShaderProjects/Water/Seashell2.glb", (asset: Asset3D) => {
                this.seashell2 = asset.model;
                this.onResourceLoaded();
            });
        }

        if(!waitForResources)
            this.onResourceLoaded();
    }

    private onResourceLoaded()
    {
        if(this.sandMesh == undefined || this.sandTexAO == undefined || this.palmTree == undefined || this.skybox == undefined || this.waterUniforms.u_WaterNormal.value == null || 
            this.waterUniforms.u_SkyTexture.value == null || this.seashell1 == undefined || this.seashell2 == undefined || this.rocksMesh == undefined)
            return;

        this.setupSand();
        this.setupSkybox();
        this.setupTrees();
        this.setupWater();
        this.setupSeashells();
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
        if(this.sandMesh == undefined || this.sandTexAO == undefined || this.rocksMesh == undefined)
            return;

        this.sandMesh.scale.set(10, 10, 10);
        this.rocksMesh.scale.set(10, 10, 10);

        let mesh = this.sandMesh.children[0] as Mesh;
        this.sandMesh.updateMatrixWorld(true);
        this.rocksMesh.updateMatrixWorld(true);

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

        this.sandMesh.traverse((asset: Object3D) => {
            if(asset instanceof Mesh)
            {
                let mesh = asset as Mesh;
                mesh.receiveShadow = true;
            }
        });
        this.rocksMesh.traverse((asset: Object3D) => {
            if(asset instanceof Mesh)
            {
                let mesh = asset as Mesh;
                mesh.receiveShadow = true;
            }
        });

        this.scene.add(this.sandMesh);
        this.scene.add(this.rocksMesh);
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
        let waterGeom = new PlaneGeometry(750.0, 750.0, this.waterPlaneResolution, this.waterPlaneResolution).rotateX(-Math.PI * 0.5);
        waterGeom.computeTangents();
        this.waterShader = WaterMaterial.createMaterial(this.waterUniforms);

        this.waterMesh = new Mesh(waterGeom, this.waterShader);
        this.waterMesh.position.set(0, 5, 0);
        this.scene.add(this.waterMesh);

        // let skyMesh = this.skybox!.children[0] as Mesh;
        // let skyMat = skyMesh.material as MeshBasicMaterial;
        // this.waterUniforms.u_SkyTexture.value = skyMat.map;
    }

    private setupTrees()
    {
        if(this.palmTree == undefined)
            return;

        let leavesMat!: MeshStandardMaterial;
        this.palmTree.traverse((asset: Object3D) => {
            if(asset.name == "Leaves")
            {
                leavesMat = (asset as Mesh).material as MeshStandardMaterial;
            }
            if(asset instanceof Mesh)
            {
                let mesh = asset as Mesh;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
            }
        });

        // leavesMat.color.set(0.5, 1.0, 0.5);

        let min = new Vector3(-5, 8, -20);
        let max = new Vector3(12, 8, 13);
        this.spawnObj(this.palmTree, 50, this.spawnedTrees, 2, 3, min, max, 2.0, true, this.sandMesh);
    }

    private setupSeashells()
    {
        if(this.seashell1 == undefined || this.seashell2 == undefined)
            return;

        this.spawnObjInCircle(this.seashell1, 250, this.spawnedSeashells, 1.0, 2.0, new Vector3(0.0, 0.25, 0.0), 35.0, 0.4, this.sandMesh);
        this.spawnObjInCircle(this.seashell2, 250, this.spawnedSeashells, 0.5, 1.5, new Vector3(0.0, 0.3, 0.0), 35.0, 0.4, this.sandMesh);
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
            
            spawnedObj.traverse((asset: Object3D) => {
                if(asset instanceof Mesh)
                {
                    let mesh = asset as Mesh;
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;
                }
            });
            spawnedObj.rotateY(Math.random() * Math.PI * 2.0);

            let scale = minScale + Math.random() * (maxScale - minScale);
            spawnedObj.scale.set(scale, scale, scale);
            spawnedObj.position.copy(targetPos);
            this.scene.add(spawnedObj);

            arrayToFill.push({ obj: spawnedObj, radius: radius });
        }
    }

    private spawnObjInCircle(obj: Object3D, count: number, arrayToFill: SpawnedObj[], minScale: number, maxScale: number, spawnCenter: Vector3, spawnRadius: number, objRadius: number, floor?: Object3D)
    {
        let up = new Vector3(0.0, 1.0, 0.0);
        let targetUp = new Vector3(0.0, 1.0, 0.0);
        let quat = new Quaternion();

        let targetPos = new Vector3();
        let raycaster = new Raycaster();
        raycaster.far = 300.0;
        let raycastDir = new Vector3(0, -1, 0);
        for(let index = 0; index < count; ++index)
        {
            let angle = Math.random() * Math.PI * 2.0;
            let targetRadius = Math.random() * spawnRadius;

            targetPos.set(
                spawnCenter.x + Math.sin(angle) * targetRadius,
                10.0,
                spawnCenter.z + Math.cos(angle) * targetRadius,
            );

            targetUp.set(0.0, 1.0, 0.0);
            if(floor != undefined)
            {
                this.aux1.copy(targetPos);
                this.aux1.y = 100.0;
                raycaster.set(this.aux1, raycastDir);
                let result = raycaster.intersectObjects([floor], true);
                
                if(result.length > 0)
                {
                    targetPos.copy(result[0].point).addScaledVector(raycastDir, 0.25);
                    if(result[0].normal != undefined)
                        targetUp.copy(result[0].normal);
                }
            }
            targetPos.y += spawnCenter.y;

            // let sphere = new Mesh(new SphereGeometry(), new MeshStandardMaterial({color: 0xff0000, transparent: true, opacity: 0.25}));
            // sphere.position.copy(targetPos);
            // sphere.scale.set(objRadius * 0.5, objRadius * 0.5, objRadius * 0.5);
            // this.scene.add(sphere);

            let spawnedObj = obj.clone();
            spawnedObj.traverse((asset: Object3D) => {
                if(asset instanceof Mesh)
                {
                    let mesh = asset as Mesh;
                    mesh.receiveShadow = true;
                }
            });
            quat.setFromUnitVectors(up, targetUp);
            spawnedObj.quaternion.premultiply(quat);
            spawnedObj.rotateY(Math.random() * Math.PI * 2.0);

            let scale = minScale + Math.random() * (maxScale - minScale);
            spawnedObj.scale.set(scale, scale, scale);
            spawnedObj.position.copy(targetPos);
            this.scene.add(spawnedObj);

            arrayToFill.push({ obj: spawnedObj, radius: objRadius });
        }
    }
}
