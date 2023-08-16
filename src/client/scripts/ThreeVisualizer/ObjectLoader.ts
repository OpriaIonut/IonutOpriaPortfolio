import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { Asset3D } from "../../types";
import { LoadingManager } from "three";
import * as THREE from "three";

export class ObjectLoader
{
    private _glbLoader: GLTFLoader;
    private _fbxLoader: FBXLoader;
    private _pool: Map<string, Asset3D> = new Map();

    constructor()
    {
        const loadingManager = new LoadingManager();
        this._glbLoader = new GLTFLoader(loadingManager);
        this._fbxLoader = new FBXLoader(loadingManager);
    }

    public loadModel(path: string, callback: (model: Asset3D) => void, onProgress: (bytesLoaded: number) => void)
    {
        if(this._pool.has(path))
            callback(this._pool.get(path) as Asset3D);
        else
        {
            let isFBX = path.includes(".fbx");
            let loader = isFBX ? this._fbxLoader : this._glbLoader;

            loader.load(path, (loadedObj) => {
                let asset: Asset3D = {
                    model: isFBX ? (loadedObj as THREE.Group) : (loadedObj as GLTF).scene,
                    animations: loadedObj.animations
                };
                asset.model.traverse((child) => {
                    if(child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh)
                    {
                        if(child.material.metalness > 0.5)
                            child.material.metalness = 0.5;
                    }
                });
                this._pool.set(path, asset);
                callback(asset);
            }, (progress: any) => {
                onProgress(progress.loaded);
            });
        }
    }
}