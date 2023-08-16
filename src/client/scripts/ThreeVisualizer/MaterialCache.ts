import { Material, Mesh, Object3D, SkinnedMesh } from "three";

export class MaterialCache
{
    private _originalMat: Material[] = [];
    private _model: Object3D | undefined;

    constructor()
    {

    }

    public registerModel(model: Object3D)
    {
        this.clearCache();
        this._model = model;
        model.traverse((child) => {
            if(child instanceof Mesh || child instanceof SkinnedMesh)
            {
                this._originalMat.push(child.material);
            }
        });
    }

    public clearCache()
    {
        this.resetOriginalMat();
        this._originalMat = [];
        this._model = undefined;
    }

    public applyMaterial(mat: Material)
    {
        if(this._model === undefined)
            return;

        this._model.traverse((child) => {
            if(child instanceof Mesh || child instanceof SkinnedMesh)
            {
                child.material = mat;
            }
        });
    }

    public resetOriginalMat()
    {
        let matCounter = 0;
        this._model?.traverse((child) => {
            if(child instanceof Mesh || child instanceof SkinnedMesh)
            {
                child.material = this._originalMat[matCounter];
                ++matCounter;
            }
        })
    }
}