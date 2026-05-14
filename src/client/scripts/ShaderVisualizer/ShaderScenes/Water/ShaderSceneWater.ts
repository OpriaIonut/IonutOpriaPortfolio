import { Color, Matrix4, Scene, Vector2, Vector3 } from "three";
import { ShaderVisualizer } from "../../ShaderVisualizer";
import { DebugUI } from "../../../ThreeVisualizer/DebugGUI";
import { IShaderScene } from "../IShaderScene";
import { WaterMaterialUniforms } from "./Scripts/WaterMaterial";
import { timeStats } from "../../../../client";
import { WaterPostProcessingParams } from "./Scripts/WaterPostProcessing";
import { WaterResourceLoader } from "./Scripts/WaterResourceLoader";
import { WaterSceneInitializer } from "./Scripts/WaterSceneInitializer";
import { exposedCodeWaterMaterialFrag, exposedCodeWaterMaterialVert } from "./ExposedScripts/ExposedCodeWaterMaterial";
import { exposedCodeWaterPostProcessingFrag, exposedCodeWaterPostProcessingVert } from "./ExposedScripts/ExposedCodeWaterPostProcessing";


//Handles high-level management of the scene and it's components
export class ShaderSceneWater implements IShaderScene
{
    private scene: Scene = new Scene();
    private visualizer!: ShaderVisualizer;

    private debugUI!: DebugUI;

    private resourceLoader!: WaterResourceLoader;       //Utility script which loads resources need for this scene
    private sceneInitializer!: WaterSceneInitializer;   //Utility script which setup up the scene and all objects needed inside it

    //Uniforms linked directly into WaterMaterial.ts
    private waterUniforms: WaterMaterialUniforms = {
        u_DepthTex: { value: null },
        u_SkyTexture: { value: null },
        
        u_Time: { value: 0.0 },

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
        u_FresnelColorIntensity: { value: 0.65},
        u_FresnelColor: { value: new Color(0xecf7fc) },
        u_EnvironmentIntensity: { value: 0.075 },
        
        u_WaveCount: { value: 4.0 },
        u_WaveSteepness: { value: 1.5 },
        u_WaveAmplitude: { value: 0.45 },
        u_WaveFrequency: { value: 30.0 },
        u_WaveSpeed: { value: 1.2 },

        u_FoamDistance: { value: 0.0125 },
        u_FoamOpacity: { value: 0.7 },
        u_FoamColor: { value: new Color(0xffffff) }
    }

    //Uniforms linked directly into WaterPostProcessing.ts
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

        //Initialize debug ui
        this.debugUI = new DebugUI();
        let guiHtml = this.debugUI.getGUIClass()!.domElement;
        let guiParent = document.getElementById("shaderVisualizer") as HTMLElement;
        guiParent.appendChild(guiHtml);
        guiHtml.style.position = "absolute";
        guiHtml.style.left = "0px";
        guiHtml.style.top = "0px";

        this.resourceLoader = new WaterResourceLoader(this.visualizer.objectLoader);
        this.sceneInitializer = new WaterSceneInitializer(this.scene, this.resourceLoader, this.visualizer.cameraManager, this.waterUniforms, this.waterPostUniforms);

        //Set up the current scene
        this.displayUI();
        this.resourceLoader.loadResources(() => { this.onAllResourcesLoaded(); });

        this.visualizer.displayInstructions("WASD - move; Right click - rotate camera<br>Try going underwater");

        this.visualizer.addScript("WaterMatrial.vert", exposedCodeWaterMaterialVert);
        this.visualizer.addScript("WaterMatrial.frag", exposedCodeWaterMaterialFrag);
        this.visualizer.addScript("WaterPostProcessing.vert", exposedCodeWaterPostProcessingVert);
        this.visualizer.addScript("WaterPostProcessing.frag", exposedCodeWaterPostProcessingFrag);
        this.visualizer.addScript("Credits", `
Special thanks to the following artists for their work:

Skybox: https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky
Tree: https://sketchfab.com/3d-models/curly-palm-00f2b57dd0e844edbeb116034fa471ec
Environment map: https://polyhaven.com/a/farm_field_puresky
Seashell1: https://sketchfab.com/3d-models/seashell-9b59afbf4a694e8cb6daa0e0235cff86
Seashell2: https://sketchfab.com/3d-models/purple-seashell-04d9983ba04242fe99182d4506ea0714
Rock1: https://sketchfab.com/3d-models/rock-stone-02-0455747c7ac848269830ed0dca33726c
Rock2: https://sketchfab.com/3d-models/sandy-rock-d200b776c544466986b4f2fdd067113e
Rock3: https://sketchfab.com/3d-models/desert-rock-base-62da7c177a6241eebe94c4eba6fc81b7
Rock4: https://sketchfab.com/3d-models/obj-nat-rock-01-62d63fd7d1dd416aac1496eb19c43cc0
Chest1: https://sketchfab.com/3d-models/treasure-chest-773a2f35025b4e2e9ac48fd84c16b3ab
Chest2: https://sketchfab.com/3d-models/pirate-a-chest-a-94c560bc25c34d4caeabb217bafeb467
        `, false);
    }

    public update(deltaTime: number)
    {
        if(this.sceneInitializer == undefined || this.sceneInitializer.getFinishedInitializing() == false)
            return;

        const waterMesh = this.sceneInitializer.getWaterMesh();
        const skybox = this.resourceLoader.getSkybox();
        const renderer = this.sceneInitializer.getRenderer();
        const camera = this.sceneInitializer.getCamera();
        const depthBuffer = this.sceneInitializer.getDepthBuffer();
        const waterPostRT = this.sceneInitializer.getWaterPostRT();

        if(waterMesh == undefined || skybox == undefined)
            return;

        //Render depth texture
        waterMesh.visible = false;
        skybox.visible = false;

        depthBuffer.setSize(renderer.domElement.width, renderer.domElement.height);
        renderer.setRenderTarget(depthBuffer);
        renderer.render(this.scene, camera);

        waterMesh.visible = true;
        skybox.visible = true;

        //Update water shader with rendered data
        this.waterUniforms.u_ViewportSize.value.set(renderer.domElement.width, renderer.domElement.height);
        this.waterUniforms.u_Time.value = timeStats.currentTime;
        this.waterUniforms.u_CameraPos.value.copy(camera.position);
        this.waterUniforms.u_InverseViewMatrix.value.copy(camera.matrixWorldInverse);

        //The scene will be rendered at the end of the update function, in the ShaderVisualizerCamera.ts.
        //We are setting the render target for that render pass, and then postRender() will be called
        waterPostRT.setSize(renderer.domElement.width, renderer.domElement.height);
        renderer.setRenderTarget(waterPostRT);
    }

    public postRender()
    {
        if(this.sceneInitializer == undefined || this.sceneInitializer.getFinishedInitializing() == false)
            return;

        const waterMesh = this.sceneInitializer.getWaterMesh();
        const renderer = this.sceneInitializer.getRenderer();
        const camera = this.sceneInitializer.getCamera();
        const waterPostRT = this.sceneInitializer.getWaterPostRT();
        const waterPostScene = this.sceneInitializer.getWaterPostScene();
        const wanterPostCamera = this.sceneInitializer.getWaterPostCamera();

        renderer.setRenderTarget(null);

        if(waterMesh == undefined)
            return;

        this.waterPostUniforms.u_DiffuseTex.value = waterPostRT.texture;
        this.waterPostUniforms.u_DepthTex.value = waterPostRT.depthTexture;
        this.waterPostUniforms.u_CameraPos.value.copy(camera.position);
        this.waterPostUniforms.u_IsUnderwater.value = camera.position.y < waterMesh.position.y;
        
        renderer.render(waterPostScene, wanterPostCamera);
    }

    //Called when you deactivate the view, dispose & reset everything
    public hide()
    {
        //Reset the debug ui and the camera
        this.debugUI.reset(); //Events will also unsubscribe here
        this.sceneInitializer.hideScene();
        this.resourceLoader.discardResources();

        this.waterUniforms.u_SkyTexture.value = null;
        this.waterUniforms.u_DepthTex.value = null;
        this.waterPostUniforms.u_DepthTex.value = null;
        this.waterPostUniforms.u_DiffuseTex.value = null;

        while (this.scene.children.length > 0)
        {
            this.scene.remove(this.scene.children[0]);
        }

        this.visualizer.displayInstructions("");

        this.visualizer.removeScript("WaterMatrial.vert");
        this.visualizer.removeScript("WaterMatrial.frag");
        this.visualizer.removeScript("WaterPostProcessing.vert");
        this.visualizer.removeScript("WaterPostProcessing.frag");
        this.visualizer.removeScript("Credits");
    }

    private displayUI()
    {
        this.debugUI.reset();
        
        this.debugUI.addFolder("General", "");
        this.debugUI.addColorPicker("General", this.waterUniforms.u_FarColor, "value", "Water Far Color", (value) => { this.waterUniforms.u_FarColor.value.set(value); });
        this.debugUI.addColorPicker("General", this.waterUniforms.u_MidColor, "value", "Water Mid Color", (value) => { this.waterUniforms.u_MidColor.value.set(value); });
        this.debugUI.addColorPicker("General", this.waterUniforms.u_ShoreColor, "value", "Water Shore Color", (value) => { this.waterUniforms.u_ShoreColor.value.set(value); });
        this.debugUI.addSlider("General", this.waterUniforms.u_FoamDistance, "value", 0.0, 0.1, "Foam Distance");
        this.debugUI.addSlider("General", this.waterUniforms.u_FoamOpacity, "value", 0.0, 1.0, "Foam Opacity");
        this.debugUI.addColorPicker("General", this.waterUniforms.u_FoamColor, "value", "Foam Color", (value) => { this.waterUniforms.u_FoamColor.value.set(value); });

        this.debugUI.addFolder("Lighting", "");
        this.debugUI.addColorPicker("Lighting", this.waterUniforms.u_LightColor, "value", "Light Color", (value) => { this.waterUniforms.u_LightColor.value.set(value); });
        this.debugUI.addColorPicker("Lighting", this.waterUniforms.u_FresnelColor, "value", "Fresnel Color", (value) => { this.waterUniforms.u_FresnelColor.value.set(value); });
        this.debugUI.addSlider("Lighting", this.waterUniforms.u_FresnelColorIntensity, "value", 0.0, 1.0, "Fresnel Intensity");
        this.debugUI.addSlider("Lighting", this.waterUniforms.u_EnvironmentIntensity, "value", 0.0, 0.2, "Environment Intensity");

        this.debugUI.addFolder("WaveMovement", "");
        this.debugUI.addSlider("WaveMovement", this.waterUniforms.u_WaveCount, "value", 2.0, 7.0, "Wave Count");
        this.debugUI.addSlider("WaveMovement", this.waterUniforms.u_WaveSteepness, "value", 0.0, 1.5, "Wave Steepness");
        this.debugUI.addSlider("WaveMovement", this.waterUniforms.u_WaveAmplitude, "value", 0.001, 3.0, "Wave Amplitude");
        this.debugUI.addSlider("WaveMovement", this.waterUniforms.u_WaveFrequency, "value", 10.0, 100.0, "Wave Frequency");
        this.debugUI.addSlider("WaveMovement", this.waterUniforms.u_WaveSpeed, "value", 0.0, 5.0, "Wave Speed");

        this.debugUI.addFolder("Underwater", "");
        this.debugUI.addColorPicker("Underwater", this.waterPostUniforms.u_FarColor, "value", "Far Color", (value) => { this.waterPostUniforms.u_FarColor.value.set(value); });
        this.debugUI.addColorPicker("Underwater", this.waterPostUniforms.u_MidColor, "value", "Mid Color", (value) => { this.waterPostUniforms.u_MidColor.value.set(value); });
        this.debugUI.addColorPicker("Underwater", this.waterPostUniforms.u_NearColor, "value", "Near Color", (value) => { this.waterPostUniforms.u_NearColor.value.set(value); });
    }

    private onAllResourcesLoaded()
    {
       this.sceneInitializer.initializeScene();
    }
}
