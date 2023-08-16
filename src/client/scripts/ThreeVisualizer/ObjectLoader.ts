import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Asset3D } from "../../types";
import { LoadingManager } from "three";

export class ObjectLoader
{
    private _glbLoader: GLTFLoader;
    private _pool: Map<string, Asset3D> = new Map();

    constructor()
    {
        const loadingManager = new LoadingManager();
        this._glbLoader = new GLTFLoader(loadingManager);
    }

    public loadModel(path: string, callback: (model: Asset3D) => void, onProgress: (bytesLoaded: number) => void)
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
            }, (progress: any) => {
                onProgress(progress.loaded);
            });
        }
    }
}