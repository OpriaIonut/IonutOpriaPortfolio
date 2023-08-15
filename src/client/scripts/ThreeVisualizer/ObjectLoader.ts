import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Asset3D } from "../../types";

export class ObjectLoader
{
    private _glbLoader: GLTFLoader;
    private _pool: Map<string, Asset3D> = new Map();

    constructor()
    {
        this._glbLoader = new GLTFLoader();
    }

    public loadModel(path: string, callback: (model: Asset3D) => void)
    {
        if(this._pool.has(path))
            callback(this._pool.get(path) as Asset3D);
        else
        {
            this._glbLoader.load(path, (gltf) => {
                let asset: Asset3D = {
                    model: gltf.scene,
                    animations: gltf.animations
                };
                this._pool.set(path, asset);
                callback(asset);
            });
        }
    }
}