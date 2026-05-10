import { AmbientLight, Color, DepthFormat, DepthTexture, DirectionalLight, FloatType, LinearSRGBColorSpace, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, OrthographicCamera, PCFSoftShadowMap, PerspectiveCamera, PlaneGeometry, Quaternion, Raycaster, RedFormat, RepeatWrapping, RGBAFormat, Scene, ShaderMaterial, Texture, Vector3, WebGLRenderer, WebGLRenderTarget } from "three";
import { WaterResourceLoader } from "./WaterResourceLoader";
import { WaterMaterial, WaterMaterialUniforms } from "./WaterMaterial";
import { WaterPostProcessing, WaterPostProcessingParams as WaterPostProcessingUniforms } from "./WaterPostProcessing";
import { FreeFlyCamera } from "../../../../ThreeVisualizer/FreeFlyCamera";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ShaderVisualizerCamera } from "../../../ShaderVisualizerCamera";
import { ThreeHelpers } from "../../../../Helper/ThreeHelpers";

declare type SpawnedObj = {
    obj: Object3D,
    radius: number;
}

enum SpawnType { Bounds, Circle }

declare type SpawnSettings = {
    count: number,
    minScale: number,
    maxScale: number,
    objRadius: number,
    checkCollision: boolean,
    alignToSurface: boolean,
    castShadow: boolean,
    spawnType: SpawnType
}

export class WaterSceneInitializer
{
    private scene: Scene;
    private loader: WaterResourceLoader;
    private cameraManager: ShaderVisualizerCamera;
    private camera: PerspectiveCamera;
    private renderer: WebGLRenderer;

    private waterUniforms: WaterMaterialUniforms;
    private waterPostUniforms: WaterPostProcessingUniforms;

    //Default properties of the camera/scene in order to reset things back to how they were before
    private defaultCameraNear: number = 0.01;
    private defaultCameraFar: number = 100.0;
    private defaultCameraPos: Vector3 = new Vector3();
    private defaultControls!: OrbitControls;

    private depthBuffer!: WebGLRenderTarget;
    private waterPostMat!: ShaderMaterial;
    private waterPostPlane!: Mesh;
    private waterPostCamera!: OrthographicCamera;
    private waterPostScene!: Scene;
    private waterPostRT!: WebGLRenderTarget;

    private directionalLight?: DirectionalLight;
    private ambientLight?: AmbientLight;

    private waterPlaneResolution: number = 600.0;

    private waterMesh?: Mesh;
    private waterShader?: ShaderMaterial;
    
    private spawnedTrees: SpawnedObj[] = [];
    private spawnedSeashells: SpawnedObj[] = [];

    private finishedInitializing: boolean = false;

    private aux1: Vector3 = new Vector3();

    public getFinishedInitializing() { return this.finishedInitializing; }
    public getWaterMesh() { return this.waterMesh; }
    public getRenderer() { return this.renderer; }
    public getCamera() { return this.camera; }
    public getDepthBuffer() { return this.depthBuffer; }
    public getWaterPostRT() { return this.waterPostRT; }
    public getWaterPostScene() { return this.waterPostScene; }
    public getWaterPostCamera() { return this.waterPostCamera; }

    constructor(scene: Scene, resourceLoader: WaterResourceLoader, cameraManager: ShaderVisualizerCamera, waterUniforms: WaterMaterialUniforms, waterPostUniforms: WaterPostProcessingUniforms)
    {
        this.scene = scene;
        this.loader = resourceLoader;
        this.cameraManager = cameraManager;

        this.waterUniforms = waterUniforms;
        this.waterPostUniforms = waterPostUniforms;

        this.camera = this.cameraManager.getCamera();
        this.renderer = this.cameraManager.getRenderer();

        this.setupCamera();
        this.setupLighting();
        this.setupPostProcessing();
    }

    public initializeScene()
    {
        this.setupSand();
        this.setupSkybox();
        this.setupTrees();
        this.setupWater();
        this.setupSeashells();
        this.finishedInitializing = true;
    }

    public hideScene()
    {
        this.camera.position.copy(this.defaultCameraPos);
        this.camera.far = this.defaultCameraFar;
        this.camera.near = this.defaultCameraNear;
        this.camera.updateProjectionMatrix();

        let controls = new OrbitControls(this.camera, this.renderer.domElement);
        controls.target.copy(this.defaultControls.target);
        controls.position0.copy(this.defaultControls.position0);
        this.cameraManager.changeControls(controls);

        this.depthBuffer.depthTexture.dispose();
        this.depthBuffer.dispose();

        this.waterPostRT.depthTexture.dispose();
        this.waterPostRT.dispose();

        if(this.waterMesh)
        {
            this.waterMesh.geometry.dispose();
            this.waterShader!.dispose();
            this.waterMesh = undefined;
            this.waterShader = undefined;
        }
        this.waterPostScene.remove(this.waterPostPlane);
        ThreeHelpers.disposeObject(this.waterPostPlane);

        for(let index = 0; index < this.spawnedTrees.length; ++index)
        {
            ThreeHelpers.disposeObject(this.spawnedTrees[index].obj);
        }
        for(let index = 0; index < this.spawnedSeashells.length; ++index)
        {
            ThreeHelpers.disposeObject(this.spawnedSeashells[index].obj);
        }

        this.spawnedSeashells = [];
        this.spawnedTrees = [];

        this.directionalLight?.dispose();
        this.ambientLight?.dispose();

        this.renderer.shadowMap.enabled = false;
        this.renderer.shadowMap.type = PCFSoftShadowMap;
    }

    private setupCamera()
    {
        //Store current camera properties to be able to reset them later on
        this.defaultCameraFar = this.camera.far;
        this.defaultCameraNear = this.camera.near;
        this.defaultCameraPos.copy(this.camera.position);
        this.defaultControls = this.cameraManager.controls as OrbitControls;

        //Set desired camera properties
        this.camera.near = 0.1;
        this.camera.far = 750;
        this.camera.updateProjectionMatrix();
        this.camera.position.set(-50, 19, 33.5);
        this.camera.rotation.set(-0.38, -0.835, -0.28);

        let newControls = new FreeFlyCamera(this.camera, this.cameraManager.getRenderer().domElement);
        newControls.moveSpeed = 25.0;
        this.cameraManager.changeControls(newControls);

        this.waterUniforms.u_CameraNear.value = this.camera.near;
        this.waterUniforms.u_CameraFar.value = this.camera.far;

        this.waterPostUniforms.u_CameraNear.value = this.camera.near;
        this.waterPostUniforms.u_CameraFar.value = this.camera.far;
    }

    private setupLighting()
    {
        //Set up lights in the scene
        this.ambientLight = new AmbientLight(0xffffff, 0.25);
        this.scene.add(this.ambientLight);

        this.directionalLight = new DirectionalLight(0xffffff, 5.0);
        this.directionalLight.position.set(25.0, 50.0, -25.0);
        this.directionalLight.target.position.set(0.0, 0.0, 0.0);

        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.set(2048, 2048);
        this.directionalLight.shadow.camera.near = 1.0;
        this.directionalLight.shadow.camera.far = 150.0;
        this.directionalLight.shadow.camera.left = -50;
        this.directionalLight.shadow.camera.right = 50;
        this.directionalLight.shadow.camera.top = 50;
        this.directionalLight.shadow.camera.bottom = -50;
        this.directionalLight.shadow.bias = -0.0001;

        this.scene.add(this.directionalLight);
        this.waterUniforms.u_LightDir.value.copy(this.directionalLight.target.position).sub(this.directionalLight.position).normalize();
    }

    private setupPostProcessing()
    {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFSoftShadowMap;

        //Set up depth buffer
        this.depthBuffer = new WebGLRenderTarget(this.renderer.domElement.width, this.renderer.domElement.height);
        this.depthBuffer.depthBuffer = true;
        this.depthBuffer.texture.format = RedFormat;

        this.depthBuffer.depthTexture = new DepthTexture(this.renderer.domElement.width, this.renderer.domElement.height);
        this.depthBuffer.depthTexture.format = DepthFormat;
        this.depthBuffer.depthTexture.type = FloatType;
        
        this.waterUniforms.u_DepthTex.value = this.depthBuffer.depthTexture;

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
        const sandMesh = this.loader.getSandMesh();
        const sandTexAO = this.loader.getSandTexAO();
        const rockMesh = this.loader.getRocksMesh();

        if(sandMesh == undefined || sandTexAO == undefined || rockMesh == undefined)
            return;

        sandMesh.scale.set(10, 10, 10);
        rockMesh.scale.set(10, 10, 10);

        let mesh = sandMesh.children[0] as Mesh;
        sandMesh.updateMatrixWorld(true);
        rockMesh.updateMatrixWorld(true);

        let sandMat = mesh.material as MeshStandardMaterial;
        sandMat.aoMap = sandTexAO;
        sandMat.aoMapIntensity = 1.0;
        sandMat.emissive = new Color(0x48463e);
        sandMat.emissiveIntensity = 3.0;

        let texScale = 50;
        this.scaleTex(sandMat.map, texScale, texScale);
        this.scaleTex(sandMat.normalMap, texScale, texScale);
        this.scaleTex(sandMat.roughnessMap, texScale, texScale);
        this.scaleTex(sandMat.aoMap, texScale, texScale);

        sandMesh.traverse((asset: Object3D) => {
            if(asset instanceof Mesh)
            {
                let mesh = asset as Mesh;
                mesh.receiveShadow = true;
            }
        });
        rockMesh.traverse((asset: Object3D) => {
            if(asset instanceof Mesh)
            {
                let mesh = asset as Mesh;
                mesh.receiveShadow = true;
            }
        });

        this.scene.add(sandMesh);
        this.scene.add(rockMesh);
    }

    private setupSkybox()
    {
        const skybox = this.loader.getSkybox();
        const skyTexture = this.loader.getSkyTexture();

        if(skybox == undefined || skyTexture == undefined)
            return;

        let mesh = skybox.children[0] as Mesh;
        let mat = mesh.material as MeshStandardMaterial;
        let newMat = new MeshBasicMaterial().copy(mat);
        newMat.map!.colorSpace = LinearSRGBColorSpace;
        mesh.material = newMat;

        this.scene.add(skybox);

        this.waterUniforms.u_SkyTexture.value = skyTexture;
    }

    private setupWater()
    {
        let waterGeom = new PlaneGeometry(750.0, 750.0, this.waterPlaneResolution, this.waterPlaneResolution).rotateX(-Math.PI * 0.5);
        waterGeom.computeTangents();
        this.waterShader = WaterMaterial.createMaterial(this.waterUniforms);

        this.waterMesh = new Mesh(waterGeom, this.waterShader);
        this.waterMesh.position.set(0, 5, 0);
        this.scene.add(this.waterMesh);
    }

    private setupTrees()
    {
        const palmTree = this.loader.getPalmTree();
        const sandMesh = this.loader.getSandMesh();

        if(palmTree == undefined || sandMesh == undefined)
            return;

        palmTree.traverse((asset: Object3D) => {
            if(asset.name == "Leaves")
            {
                let leavesMat = (asset as Mesh).material as MeshStandardMaterial;
                leavesMat.color.set(0.5, 1.0, 0.5);
            }
            if(asset instanceof Mesh)
            {
                let mesh = asset as Mesh;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
            }
        });

        let spawnSettings: SpawnSettings = {
            count: 50,
            minScale: 2.0,
            maxScale: 3.0,
            objRadius: 2.0,
            checkCollision: true,
            alignToSurface: false,
            castShadow: true,
            spawnType: SpawnType.Bounds
        }

        let min = new Vector3(-5, 8, -20);
        let max = new Vector3(12, 8, 13);
        this.spawnObj(palmTree, spawnSettings, this.spawnedTrees, min, max, this.aux1, 0.0, sandMesh);
    }

    private setupSeashells()
    {
        const seashell1 = this.loader.getSeashell1();
        const seashell2 = this.loader.getSeashell2();
        const sandMesh = this.loader.getSandMesh();

        if(seashell1 == undefined || seashell2 == undefined || sandMesh == undefined)
            return;

        let spawnSettings: SpawnSettings = {
            count: 250,
            minScale: 1.0,
            maxScale: 2.0,
            objRadius: 0.4,
            checkCollision: false,
            alignToSurface: true,
            castShadow: false,
            spawnType: SpawnType.Circle
        }

        this.spawnObj(seashell1, spawnSettings, this.spawnedSeashells, this.aux1, this.aux1, new Vector3(0.0, 0.25, 0.0), 35.0, sandMesh);

        spawnSettings.minScale = 0.5;
        spawnSettings.maxScale = 1.5;
        this.spawnObj(seashell2, spawnSettings, this.spawnedSeashells, this.aux1, this.aux1, new Vector3(0.0, 0.3, 0.0), 35.0, sandMesh);
    }

    private spawnObj(obj: Object3D, settings: SpawnSettings, arrayToFill: SpawnedObj[], minPos: Vector3, maxPos: Vector3, circleCenter: Vector3, circleRadius: number, floor?: Object3D)
    {
        let up = new Vector3(0.0, 1.0, 0.0);
        let targetUp = new Vector3(0.0, 1.0, 0.0);
        let quat = new Quaternion();

        let targetPos = new Vector3();
        let raycaster = new Raycaster();
        raycaster.far = 300.0;
        let raycastDir = new Vector3(0, -1, 0);
        for(let index = 0; index < settings.count; ++index)
        {
            if(settings.checkCollision)
            {
                let foundCollision = this.spawnCheckCollisions(targetPos, settings.objRadius, arrayToFill, settings.spawnType, minPos, maxPos, circleCenter, circleRadius);
                if(foundCollision)
                {
                    console.warn("Couldn't spawn all trees, tweak radius or decrease spawn count.");
                    return;
                }
            }
            else
            {
                if(settings.spawnType == SpawnType.Bounds)
                    this.pickPosInBounds(targetPos, minPos, maxPos);
                else if(settings.spawnType == SpawnType.Circle)
                    this.pickPosInCircle(targetPos, circleCenter, circleRadius);
            }

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
                    if(settings.alignToSurface && result[0].normal != undefined)
                    {
                        targetUp.copy(result[0].normal);
                    }
                }
            }
            if(settings.spawnType == SpawnType.Circle)
                targetPos.y += circleCenter.y;

            let spawnedObj = obj.clone();
            
            spawnedObj.traverse((asset: Object3D) => {
                if(asset instanceof Mesh)
                {
                    let mesh = asset as Mesh;
                    mesh.castShadow = settings.castShadow;
                    mesh.receiveShadow = true;
                }
            });
            if(settings.alignToSurface)
            {
                quat.setFromUnitVectors(up, targetUp);
                spawnedObj.quaternion.premultiply(quat);
            }
            spawnedObj.rotateY(Math.random() * Math.PI * 2.0);

            let scale = settings.minScale + Math.random() * (settings.maxScale - settings.minScale);
            spawnedObj.scale.set(scale, scale, scale);
            spawnedObj.position.copy(targetPos);
            this.scene.add(spawnedObj);

            arrayToFill.push({ obj: spawnedObj, radius: settings.objRadius });
        }
    }

    private spawnCheckCollisions(targetPos: Vector3, objRadius: number, arrayToFill: SpawnedObj[], spawnType: SpawnType, minPos: Vector3, maxPos: Vector3, circleCenter: Vector3, circleRadius: number)
    {
        let foundCollision = true;
        let currentIterations = 0;
        while (foundCollision && currentIterations < 100)
        {
            foundCollision = false;
            if(spawnType == SpawnType.Bounds)
                this.pickPosInBounds(targetPos, minPos, maxPos);
            else if(spawnType == SpawnType.Circle)
                this.pickPosInCircle(targetPos, circleCenter, circleRadius);
            
            for (let index2 = 0; index2 < arrayToFill.length; ++index2) {
                this.aux1.copy(targetPos).sub(arrayToFill[index2].obj.position);
                let rad = Math.max(objRadius, arrayToFill[index2].radius);
                if (this.aux1.lengthSq() <= rad * rad) {
                    foundCollision = true;
                    break;
                }
            }
            currentIterations++;
        }
        return foundCollision;
    }

    private pickPosInCircle(targetPos: Vector3, spawnCenter: Vector3, spawnRadius: number)
    {
        let angle = Math.random() * Math.PI * 2.0;
        let targetRadius = Math.random() * spawnRadius;

        targetPos.set(
            spawnCenter.x + Math.sin(angle) * targetRadius,
            10.0,
            spawnCenter.z + Math.cos(angle) * targetRadius,
        );
    }

    private pickPosInBounds(targetPos: Vector3, minPos: Vector3, maxPos: Vector3)
    {
        targetPos.set(
            minPos.x + Math.random() * (maxPos.x - minPos.x),
            minPos.y + Math.random() * (maxPos.y - minPos.y),
            minPos.z + Math.random() * (maxPos.z - minPos.z),
        );
    }
}