import { Box3, Color, ConeGeometry, DoubleSide, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PlaneGeometry, RepeatWrapping, Texture, Vector3 } from "three";
import { OctreeObj } from "../Scripts/OctreeObj";
import { ShaderSceneOctree } from "../ShaderSceneOctree";
import { Octree } from "../Scripts/Octree";
import { timeStats } from "../../../../../client";
import { Asset3D } from "../../../../../types";
import { ThreeHelpers } from "../../../../Helper/ThreeHelpers";
import { OctreeVisualizer } from "../Scripts/OctreeVisualizer";

export class OctreeFrustumCullingDemo
{
    private _scene: ShaderSceneOctree;

    private _spawnedTrees: OctreeObj[] = [];
    
    private _spawnDistance: Vector3 = new Vector3(100, 100, 100);
    private _octreeBounds: Box3 = new Box3(new Vector3(-150, -150, -150), new Vector3(150, 150, 150));

    private _viewRadius: number = 35;
    private _viewHeight: number = 150.0;

    private _octree!: Octree;
    private _octreeDebugVisualizer!: OctreeVisualizer;
    private _objectsDebugVisualizer!: OctreeVisualizer;
    
    private _tree?: Object3D;
    private _frustumGround?: Mesh;
    private _frustumViewRadius?: Mesh;
    
    constructor(sceneManager: ShaderSceneOctree)
    {
        this._scene = sceneManager;
        this._octreeDebugVisualizer = new OctreeVisualizer(this._scene.getScene());
        this._objectsDebugVisualizer = new OctreeVisualizer(this._scene.getScene());
    }

    public setupScene()
    {
        let settings = this._scene.getUISettings();
        settings.displayOctreeDebug = false;
        settings.displayObjectsDebug = false;

        this._scene.setBackgroundColor(new Color(0x555555));
        this._scene.getCamera().position.set(0, 300, 0.0);

        if(this._frustumGround == undefined)
        {
            this._frustumGround = new Mesh(new PlaneGeometry(), new MeshStandardMaterial({ color: 0xffffff, side: DoubleSide }));
            this._frustumGround.position.set(0, 5, 0);
            this._frustumGround.scale.set(200, 200, 200);
            this._frustumGround.rotation.set(-Math.PI / 2.0, 0.0, 0.0);
            this._scene.getScene().add(this._frustumGround);

            this._scene.getTextureLoader().load("images/textures/grass.jpg", (tex: Texture) => {
                tex.wrapS = RepeatWrapping;
                tex.wrapT = RepeatWrapping;
                tex.repeat.set(2, 2);

                let mat = this._frustumGround!.material as MeshStandardMaterial;
                mat.map = tex;
                mat.needsUpdate = true;
            });
        }
        else
            this._frustumGround.visible = true;

        if(this._frustumViewRadius == undefined)
        {
            this._frustumViewRadius = new Mesh(new ConeGeometry(35, 150, 32, 1), new MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.25 }));
            this._frustumViewRadius.rotateX(Math.PI / 2);
            this._frustumViewRadius.renderOrder = 100;
            this._scene.getScene().add(this._frustumViewRadius);
        }
        else
            this._frustumViewRadius.visible = true;
        
        if(this._tree == undefined)
        {
            this._scene.getObjectLoader().loadModel("models/ShaderProjects/Octree/pine_tree.glb", (model: Asset3D) => {
                this._tree = model.model;
                this.onTreeAssetLoaded();
            }, () => {});
        }
        else
            this.onTreeAssetLoaded();
    }

    public update()
    {
        this.moveViewRadius();
        if(this._scene.getUISettings().selectedDemo == "FrustumCulling" && this._octree != undefined && this._frustumViewRadius != undefined && this._frustumViewRadius.visible)
        {
            let boxes = this.computeViewBoxes();
            let foundTrees = this.queryOctree(boxes);
            this.frustumCull(foundTrees);
        }
    }

    public hideScene()
    {
        if(this._octree)
            this._octree.Destroy();
        for(let index = 0; index < this._spawnedTrees.length; ++index)
        {
            let obj = this._spawnedTrees[index].GetObject3D();
            this._scene.getScene().remove(obj);
            ThreeHelpers.disposeObject(obj);
        }
        this._spawnedTrees = [];

        if(this._frustumViewRadius)
            this._frustumViewRadius.visible = false;
        if(this._frustumGround)
            this._frustumGround.visible = false;

        this._octreeDebugVisualizer.releaseAllCubes();
        this._objectsDebugVisualizer.releaseAllCubes();
    }

    public discardScene()
    {
        this.hideScene();
        if(this._frustumGround)
            ThreeHelpers.disposeObject(this._frustumGround);
        if(this._frustumViewRadius)
            ThreeHelpers.disposeObject(this._frustumViewRadius);
    }

    public onDebugDisplayChanged()
    {
        let settings = this._scene.getUISettings();
        if(this._octree)
            this._octree.SetDebugVisualizer(settings.displayOctreeDebug ? this._octreeDebugVisualizer : undefined);
        for(let index = 0; index < this._spawnedTrees.length; ++index)
        {
            this._spawnedTrees[index].SetDebugVisualizer(settings.displayObjectsDebug ? this._objectsDebugVisualizer : undefined);
        }
    }

    public updateTreeCount()
    {
        let diff = this._scene.getUISettings().treeCount - this._spawnedTrees.length;
        if(diff < 0)
        {
            for(let index = 0; index < -diff; ++index)
            {
                this._spawnedTrees[index].SetDebugVisualizer(undefined);
                let obj = this._spawnedTrees[index].GetObject3D();
                this._octree.RemoveObject(obj);
                this._scene.getScene().remove(obj);
                ThreeHelpers.disposeObject(obj);
            }
            this._spawnedTrees.splice(0, -diff);
        }
        else if(diff > 0)
        {
            let newTrees = this._scene.spawnRandomObjects(this._tree!, diff, 1.0, 2.0, false, 5, this._spawnDistance, false, this._objectsDebugVisualizer);
            let length = this._spawnedTrees.length;
            for(let index = 0; index < newTrees.length; ++index)
            {
                this._spawnedTrees.push(newTrees[index]);
                this._octree.AddObject(this._spawnedTrees[index + length]);
            }
        }
    }

    private onTreeAssetLoaded()
    {
        let settings = this._scene.getUISettings();
        this._spawnedTrees = this._scene.spawnRandomObjects(this._tree!, settings.treeCount, 1.0, 2.0, false, 5, this._spawnDistance, false, this._objectsDebugVisualizer);
        for(let index = 0; index < this._spawnedTrees.length; ++index)
        {
            this._spawnedTrees[index].GetObject3D().visible = false;
        }
        this._octree = new Octree(this._octreeBounds, this._spawnedTrees, 5, 7, 1, settings.displayOctreeDebug ? this._octreeDebugVisualizer : undefined);
    }

    private moveViewRadius()
    {
        if(this._frustumViewRadius != undefined && this._frustumViewRadius.visible == true)
        {
            let time = timeStats.currentTime * 0.5;
            this._frustumViewRadius.position.set(
                Math.cos(time) * 75.0,
                5.0,
                Math.sin(time) * 75.0
            );
            let angle = Math.atan2(Math.cos(time), -Math.sin(time));
            this._frustumViewRadius.rotation.set(Math.PI / 2.0, 0.0, angle);
        }
    }

    private computeViewBoxes()
    {
        for(let index = 0; index < this._spawnedTrees.length; ++index)
        {
            this._spawnedTrees[index].GetObject3D().visible = false;
        }

        let origin = new Vector3();

        let sliceCount = 5;
        let boxes: THREE.Box3[] = [];
        for (let index = 0; index < sliceCount; ++index)
        {
            let distance1 = index / sliceCount * this._viewHeight;
            let distance2 = (index + 1) / sliceCount * this._viewHeight;
            let distanceMid = (distance1 + distance2) * 0.5;
            let midRadius = (distanceMid / this._viewHeight) * this._viewRadius;
            if(index == 0)
                midRadius = Math.max(distance1 / this._viewHeight * this._viewRadius, distance2 / this._viewHeight * this._viewRadius) * 2.0;

            let halfSize = new Vector3(midRadius, midRadius, (distance2 - distance1) * 0.5);
            const corners: Vector3[] = [];
            const localCenter = new Vector3(0, -distanceMid, 0);
            for (let dx of [-1, 1])
            {
                for (let dy of [-1, 1])
                {
                    for (let dz of [-1, 1])
                    {
                        const corner = new Vector3(
                            localCenter.x + dx * halfSize.x,
                            localCenter.y + dy * halfSize.y,
                            localCenter.z + dz * halfSize.z
                        );
                        corner.applyQuaternion(this._frustumViewRadius!.quaternion).add(origin);
                        corners.push(corner);
                    }
                }
            }
            const box = new Box3().setFromPoints(corners);
            boxes.push(box);
        }
        return boxes;
    }

    private queryOctree(boxes: Box3[])
    {
        let allFoundTrees: OctreeObj[] = [];
        let queryStartTime = performance.now();
        for(let index = 0; index < boxes.length; ++index)
        {
            let foundTrees = this._octree.QueryBounds(boxes[index]);
            for(let index2 = 0; index2 < foundTrees.length; ++index2)
            {
                allFoundTrees.push(foundTrees[index2]);
            }
        }
        this._scene.getUISettings().octreeQueryTime = `${(performance.now() - queryStartTime).toFixed(2)}ms`;
        return allFoundTrees;
    }

    private frustumCull(allFoundTrees: OctreeObj[])
    {
        let frustumStartTime = performance.now()
        let coneForward = new Vector3(0, -1, 0).applyQuaternion(this._frustumViewRadius!.quaternion).normalize();
        let halfAngle = Math.atan(this._viewRadius / this._viewHeight);
        let cosThreshold = Math.cos(halfAngle);
        for(let index = 0; index < allFoundTrees.length; ++index)
        {
            let obj = allFoundTrees[index].GetObject3D();
            let dirToObj = obj.position.clone().normalize();

            let dot = coneForward.dot(dirToObj);
            let insideAngle = dot >= cosThreshold;
            if(insideAngle)
                obj.visible = true;
        }
        this._scene.getUISettings().frustumCullingTime = `${(performance.now() - frustumStartTime).toFixed(2)}ms`;
    }
}