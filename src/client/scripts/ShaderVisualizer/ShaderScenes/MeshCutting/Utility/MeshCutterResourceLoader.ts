import { Mesh, MeshStandardMaterial, Object3D, Texture, TextureLoader, TorusKnotGeometry } from "three";
import { ObjectLoader } from "../../../../ThreeVisualizer/ObjectLoader";

//Utility script to handle object loading and caching of it
export class MeshCutterResourceLoader
{
    private objectLoader!: ObjectLoader; //ObjectLoaded already caches meshes, so we don't need to do the same on our side
    private textureLoader!: TextureLoader;
    
    //Maps that are used to cache load results (to not load same assets over the network multiple times)
    private loadedFillTextures: Map<string, Texture> = new Map();

    constructor()
    {
        this.objectLoader = new ObjectLoader();
        this.textureLoader = new TextureLoader();
    }

    public getTexture(texName: string) { return this.loadedFillTextures.get(texName); }

    //Load texture or retrieve it from the cache
    public loadTexture(texName: string, onTextureLoaded: (tex: Texture) => void)
    {
        let texPath = this.getPathFromFillTexture(texName);
        if(this.loadedFillTextures.has(texName))
            onTextureLoaded(this.loadedFillTextures.get(texName)!);
        else
        {
            this.textureLoader.load(texPath, (texture: Texture) => {
                this.loadedFillTextures.set(texName, texture);
                onTextureLoaded(texture);
            });
        }
    }

    //Pure meshes will contain only meshes from the loaded objects (it can have other things, such as lights, camera, groups, empty transforms, etc.)
    public loadMesh(meshName: string, onModelLoaded: (parent: Object3D, pureMeshes: Mesh[]) => void)
    {
        let results: Mesh[] = [];

        //If it is a geometry that we can create with three.js, create it instantly
        if (meshName == "Torus Knot")
        {
            let mesh = new Mesh(new TorusKnotGeometry(1, 0.4, 256, 32), new MeshStandardMaterial());
            results.push(mesh);
            onModelLoaded(mesh, results);
        }
        else
        {
            //Otherwise, we need to load it from the given path
            let path = this.getPathFromModel(meshName);
            this.objectLoader.loadModel(path, (obj) => {
                obj.model.traverse((item) => {
                    if (item instanceof Mesh)
                    {
                        let mesh = item as Mesh;
                        results.push(mesh);
                    }
                });
                onModelLoaded(obj.model, results);
            }, () => { });
        }
    }

    //Utility function to get a path from a mesh name
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

    //Utility function to get a path from a texture name
    private getPathFromFillTexture(textureName: string)
    {
        switch (textureName)
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
}