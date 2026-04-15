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
    private scene: ShaderSceneOctree;

    private spawnedTrees: OctreeObj[] = [];
    
    private spawnDistance: Vector3 = new Vector3(100, 100, 100);
    private octreeBounds: Box3 = new Box3(new Vector3(-150, -150, -150), new Vector3(150, 150, 150));

    private viewRadius: number = 35;
    private viewHeight: number = 150.0;

    private octree!: Octree;
    private octreeDebugVisualizer!: OctreeVisualizer;
    private objectsDebugVisualizer!: OctreeVisualizer;
    
    private tree?: Object3D;
    private frustumGround?: Mesh;
    private frustumViewRadius?: Mesh;
    
    constructor(sceneManager: ShaderSceneOctree)
    {
        this.scene = sceneManager;
        this.octreeDebugVisualizer = new OctreeVisualizer(this.scene.getScene());
        this.objectsDebugVisualizer = new OctreeVisualizer(this.scene.getScene());
    }

    public setupScene()
    {
        let settings = this.scene.getUISettings();
        settings.displayOctreeDebug = false;
        settings.displayObjectsDebug = false;

        this.scene.setBackgroundColor(new Color(0x555555));
        this.scene.getCamera().position.set(0, 300, 0.0);

        if(this.frustumGround == undefined)
        {
            this.frustumGround = new Mesh(new PlaneGeometry(), new MeshStandardMaterial({ color: 0xffffff, side: DoubleSide }));
            this.frustumGround.position.set(0, 5, 0);
            this.frustumGround.scale.set(200, 200, 200);
            this.frustumGround.rotation.set(-Math.PI / 2.0, 0.0, 0.0);
            this.scene.getScene().add(this.frustumGround);

            this.scene.getTextureLoader().load("images/textures/grass.jpg", (tex: Texture) => {
                tex.wrapS = RepeatWrapping;
                tex.wrapT = RepeatWrapping;
                tex.repeat.set(2, 2);

                let mat = this.frustumGround!.material as MeshStandardMaterial;
                mat.map = tex;
                mat.needsUpdate = true;
            });
        }
        else
            this.frustumGround.visible = true;

        if(this.frustumViewRadius == undefined)
        {
            this.frustumViewRadius = new Mesh(new ConeGeometry(35, 150, 32, 1), new MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.25 }));
            this.frustumViewRadius.rotateX(Math.PI / 2);
            this.frustumViewRadius.renderOrder = 100;
            this.scene.getScene().add(this.frustumViewRadius);
        }
        else
            this.frustumViewRadius.visible = true;
        
        if(this.tree == undefined)
        {
            this.scene.getObjectLoader().loadModel("models/ShaderProjects/Octree/pine_tree.glb", (model: Asset3D) => {
                this.tree = model.model;
                this.onTreeAssetLoaded();
            }, () => {});
        }
        else
            this.onTreeAssetLoaded();
    }

    public update()
    {
        this.moveViewRadius();
        if(this.scene.getUISettings().selectedDemo == "FrustumCulling" && this.octree != undefined && this.frustumViewRadius != undefined && this.frustumViewRadius.visible)
        {
            let boxes = this.computeViewBoxes();
            let foundTrees = this.queryOctree(boxes);
            this.frustumCull(foundTrees);
        }
    }

    public hideScene()
    {
        if(this.octree)
            this.octree.destroy();
        for(let index = 0; index < this.spawnedTrees.length; ++index)
        {
            let obj = this.spawnedTrees[index].getObject3D();
            this.scene.getScene().remove(obj);
            ThreeHelpers.disposeObject(obj);
        }
        this.spawnedTrees = [];

        if(this.frustumViewRadius)
            this.frustumViewRadius.visible = false;
        if(this.frustumGround)
            this.frustumGround.visible = false;

        this.octreeDebugVisualizer.releaseAllCubes();
        this.objectsDebugVisualizer.releaseAllCubes();
    }

    public discardScene()
    {
        this.hideScene();
        if(this.frustumGround)
            ThreeHelpers.disposeObject(this.frustumGround);
        if(this.frustumViewRadius)
            ThreeHelpers.disposeObject(this.frustumViewRadius);
    }

    public onDebugDisplayChanged()
    {
        let settings = this.scene.getUISettings();
        if(this.octree)
            this.octree.setDebugVisualizer(settings.displayOctreeDebug ? this.octreeDebugVisualizer : undefined);
        for(let index = 0; index < this.spawnedTrees.length; ++index)
        {
            this.spawnedTrees[index].setDebugVisualizer(settings.displayObjectsDebug ? this.objectsDebugVisualizer : undefined);
        }
    }

    public updateTreeCount()
    {
        let diff = this.scene.getUISettings().treeCount - this.spawnedTrees.length;
        if(diff < 0)
        {
            for(let index = 0; index < -diff; ++index)
            {
                this.spawnedTrees[index].setDebugVisualizer(undefined);
                let obj = this.spawnedTrees[index].getObject3D();
                this.octree.removeObject(obj);
                this.scene.getScene().remove(obj);
                ThreeHelpers.disposeObject(obj);
            }
            this.spawnedTrees.splice(0, -diff);
        }
        else if(diff > 0)
        {
            let newTrees = this.scene.spawnRandomObjects(this.tree!, diff, 1.0, 2.0, false, 5, this.spawnDistance, false, this.objectsDebugVisualizer);
            let length = this.spawnedTrees.length;
            for(let index = 0; index < newTrees.length; ++index)
            {
                this.spawnedTrees.push(newTrees[index]);
                this.octree.addObject(this.spawnedTrees[index + length]);
            }
        }
    }

    private onTreeAssetLoaded()
    {
        let settings = this.scene.getUISettings();
        this.spawnedTrees = this.scene.spawnRandomObjects(this.tree!, settings.treeCount, 1.0, 2.0, false, 5, this.spawnDistance, false, this.objectsDebugVisualizer);
        for(let index = 0; index < this.spawnedTrees.length; ++index)
        {
            this.spawnedTrees[index].getObject3D().visible = false;
        }
        this.octree = new Octree(this.octreeBounds, this.spawnedTrees, 5, 7, 1, settings.displayOctreeDebug ? this.octreeDebugVisualizer : undefined);
    }

    private moveViewRadius()
    {
        if(this.frustumViewRadius != undefined && this.frustumViewRadius.visible == true)
        {
            let time = timeStats.currentTime * 0.5;
            this.frustumViewRadius.position.set(
                Math.cos(time) * 75.0,
                5.0,
                Math.sin(time) * 75.0
            );
            let angle = Math.atan2(Math.cos(time), -Math.sin(time));
            this.frustumViewRadius.rotation.set(Math.PI / 2.0, 0.0, angle);
        }
    }

    private computeViewBoxes()
    {
        for(let index = 0; index < this.spawnedTrees.length; ++index)
        {
            this.spawnedTrees[index].getObject3D().visible = false;
        }

        let origin = new Vector3();

        let sliceCount = 5;
        let boxes: THREE.Box3[] = [];
        for (let index = 0; index < sliceCount; ++index)
        {
            let distance1 = index / sliceCount * this.viewHeight;
            let distance2 = (index + 1) / sliceCount * this.viewHeight;
            let distanceMid = (distance1 + distance2) * 0.5;
            let midRadius = (distanceMid / this.viewHeight) * this.viewRadius;
            if(index == 0)
                midRadius = Math.max(distance1 / this.viewHeight * this.viewRadius, distance2 / this.viewHeight * this.viewRadius) * 2.0;

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
                        corner.applyQuaternion(this.frustumViewRadius!.quaternion).add(origin);
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
            let foundTrees = this.octree.queryBounds(boxes[index]);
            for(let index2 = 0; index2 < foundTrees.length; ++index2)
            {
                allFoundTrees.push(foundTrees[index2]);
            }
        }
        this.scene.getUISettings().octreeQueryTime = `${(performance.now() - queryStartTime).toFixed(2)}ms`;
        return allFoundTrees;
    }

    private frustumCull(allFoundTrees: OctreeObj[])
    {
        let frustumStartTime = performance.now()
        let coneForward = new Vector3(0, -1, 0).applyQuaternion(this.frustumViewRadius!.quaternion).normalize();
        let halfAngle = Math.atan(this.viewRadius / this.viewHeight);
        let cosThreshold = Math.cos(halfAngle);
        for(let index = 0; index < allFoundTrees.length; ++index)
        {
            let obj = allFoundTrees[index].getObject3D();
            let dirToObj = obj.position.clone().normalize();

            let dot = coneForward.dot(dirToObj);
            let insideAngle = dot >= cosThreshold;
            if(insideAngle)
                obj.visible = true;
        }
        this.scene.getUISettings().frustumCullingTime = `${(performance.now() - frustumStartTime).toFixed(2)}ms`;
    }
}