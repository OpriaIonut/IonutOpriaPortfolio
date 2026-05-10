import { EquirectangularReflectionMapping, Object3D, RepeatWrapping, Texture, TextureLoader } from "three";
import { Asset3D } from "../../../../../types";
import { ObjectLoader } from "../../../../ThreeVisualizer/ObjectLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { timeStats } from "../../../../../client";
import { ThreeHelpers } from "../../../../Helper/ThreeHelpers";

export class WaterResourceLoader
{
    private sandMesh?: Object3D;
    private rocksMesh?: Object3D;
    private palmTree?: Object3D;
    private seashell1?: Object3D;
    private seashell2?: Object3D;
    private skybox?: Object3D;

    private sandTexAO?: Texture;
    private skyTexture?: Texture;

    private objLoader: ObjectLoader;
    private rgbeLoader: RGBELoader;

    private onAllResourcesLoaded?: () => void;

    public getSandMesh() { return this.sandMesh; }
    public getRocksMesh() { return this.rocksMesh; }
    public getPalmTree() { return this.palmTree; }
    public getSeashell1() { return this.seashell1; }
    public getSeashell2() { return this.seashell2; }
    public getSkybox() { return this.skybox; }
    public getSandTexAO() { return this.sandTexAO; }
    public getSkyTexture() { return this.skyTexture; }

    constructor(objectLoader: ObjectLoader)
    {
        this.objLoader = objectLoader;
        this.rgbeLoader = new RGBELoader();
    }

    public loadResources(onAllResourcesLoaded?: () => void)
    {
        this.onAllResourcesLoaded = onAllResourcesLoaded;
        const textureLoader = new TextureLoader();
    
        let waitForResources = false;
        if(this.sandMesh == undefined)
        {
            waitForResources = true;
            this.objLoader.loadModel("models/ShaderProjects/Water/Sand.glb", (asset: Asset3D) => {
                this.sandMesh = asset.model;
                this.onResourceLoaded();
            });
        }
        if(this.rocksMesh == undefined)
        {
            waitForResources = true;
            this.objLoader.loadModel("models/ShaderProjects/Water/Rocks.glb", (asset: Asset3D) => {
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
            this.objLoader.loadModel("models/ShaderProjects/Water/PalmTree.glb", (asset: Asset3D) => {
                this.palmTree = asset.model;
                this.onResourceLoaded();
            });
        }
        if(this.skybox == undefined)
        {
            waitForResources = true;
            this.objLoader.loadModel("models/ShaderProjects/Water/WaterSkybox.glb", (asset: Asset3D) => {
            this.skybox = asset.model;
                this.onResourceLoaded();
            });
        }
        if(this.skyTexture == null)
        {
            waitForResources = true;
            this.rgbeLoader.load("models/ShaderProjects/Water/SkyEnvMap.hdr", (asset: Texture) => {
                asset.wrapS = RepeatWrapping;
                asset.wrapT = RepeatWrapping;
                asset.mapping = EquirectangularReflectionMapping;
                this.skyTexture = asset;
                this.onResourceLoaded();
            });
        }
        if(this.seashell1 == undefined)
        {
            waitForResources = true;
            this.objLoader.loadModel("models/ShaderProjects/Water/Seashell1.glb", (asset: Asset3D) => {
                this.seashell1 = asset.model;
                this.onResourceLoaded();
            });
        }
        if(this.seashell2 == undefined)
        {
            waitForResources = true;
            this.objLoader.loadModel("models/ShaderProjects/Water/Seashell2.glb", (asset: Asset3D) => {
                this.seashell2 = asset.model;
                this.onResourceLoaded();
            });
        }
    
        if(!waitForResources)
            this.onResourceLoaded();
    }

    private onResourceLoaded()
    {
        if(this.sandMesh == undefined || this.sandTexAO == undefined || this.palmTree == undefined || this.skybox == undefined || 
            this.skyTexture == null || this.seashell1 == undefined || this.seashell2 == undefined || this.rocksMesh == undefined)
            return;

        if(this.onAllResourcesLoaded)
            this.onAllResourcesLoaded();
    }

    public discardResources()
    {
        this.sandTexAO?.dispose();
        this.skyTexture?.dispose();

        this.sandTexAO = undefined;
        this.skyTexture = undefined;
    }
}