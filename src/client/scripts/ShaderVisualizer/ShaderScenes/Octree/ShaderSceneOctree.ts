import { AmbientLight, Box3, BufferAttribute, BufferGeometry, Color, ConeGeometry, DirectionalLight, DoubleSide, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, PlaneGeometry, Points, PointsMaterial, RepeatWrapping, Scene, Texture, TextureLoader, Vector3 } from "three";
import { ShaderVisualizer } from "../../ShaderVisualizer";
import { DebugUI } from "../../../ThreeVisualizer/DebugGUI";
import { Octree } from "./Scripts/Octree";
import { OctreeObj } from "./Scripts/OctreeObj";
import { OctreeVisualizer } from "./Scripts/OctreeVisualizer";
import { Asset3D } from "../../../../types";
import { Spaceship } from "./Scripts/Spaceship";
import { timeStats } from "../../../../client";

/* Demo scenes to build:
        Clean up shader scene
        Comment everything
        Display scripts on the page & add credits

spaceship model: https://sketchfab.com/3d-models/spaceship-70e786969e70447c86bc4168df8ccbcd
tree: https://sketchfab.com/3d-models/pine-tree-e52769d653cd4e52a4acff3041961e65
*/

//Handles high-level management of the scene and it's components
export class ShaderSceneOctree
{
    private _scene: Scene = new Scene();
    private _visualizer!: ShaderVisualizer;
    private _camera!: PerspectiveCamera;

    private _debugUI!: DebugUI;

    private _spawnedAsteroids: OctreeObj[] = [];
    private _spawnedSpaceships: OctreeObj[] = [];
    private _spawnedTrees: OctreeObj[] = [];

    private _spaceshipLogic: Spaceship[] = [];

    private _spawnDistance: Vector3 = new Vector3(100, 100, 100);
    private _octreeBounds: Box3 = new Box3(new Vector3(-150, -150, -150), new Vector3(150, 150, 150));
    private _octree!: Octree;
    private _textureLoader: TextureLoader = new TextureLoader();

    private _defaultSceneColor!: Color;
    private _defaultCameraNear: number = 0.01;
    private _defaultCameraFar: number = 100.0;
    private _defaultCameraPos: Vector3 = new Vector3();

    private _octreeDebugVisualizer!: OctreeVisualizer;
    private _objectsDebugVisualizer!: OctreeVisualizer;

    private _asteroid?: Object3D;
    private _spaceship?: Object3D;
    private _tree?: Object3D;
    private _stars?: Points;
    private _frustumGround?: Mesh;
    private _frustumViewRadius?: Mesh;

    private _settings = {
        //General
        selectedDemo: "Spaceships",
        availableDemos: ["Spaceships", "FrustumCulling"],
        displayOctreeDebug: true,
        displayObjectsDebug: true,

        //Space
        asteroidCount: 50,
        spaceshipCount: 50,
        objBoundsUpdate: "",
        octreeUpdateTime: "",

        //Frustum
        treeCount: 1000,
        octreeQueryTime: "",
        frustumCullingTime: ""
    }

    public init(visualizer: ShaderVisualizer)
    {
        this._visualizer = visualizer;
        this._camera = visualizer._cameraManager.camera;

        this._defaultCameraFar = this._camera.far;
        this._defaultCameraNear = this._camera.near;
        this._defaultSceneColor = this._visualizer._cameraManager.scene.background as Color;
        this._defaultCameraPos.copy(this._camera.position);

        this._camera.near = 0.1;
        this._camera.far = 1000;
        this._camera.updateProjectionMatrix();

        //Set up lights in the scene
        let ambientLight = new AmbientLight(0xffffff, 0.25);
        this._scene.add(ambientLight);
        
        let directionalLight = new DirectionalLight(0xffffff, 3.0);
        directionalLight.position.set(10.0, 10.0, 5.0);
        this._scene.add(directionalLight);

        this._debugUI = new DebugUI();
        let guiHtml = this._debugUI.getGUIClass()!.domElement;
        let guiParent = document.getElementById("shaderVisualizer") as HTMLElement;
        guiParent.appendChild(guiHtml);
        guiHtml.style.position = "absolute";
        guiHtml.style.left = "0px";
        guiHtml.style.top = "0px";

        this.displayUI();

        this._octreeDebugVisualizer = new OctreeVisualizer(this._scene);
        this._objectsDebugVisualizer = new OctreeVisualizer(this._scene);
        Octree.EnableLogs(false, true);

        this.onSceneChanged();
    }

    public update(deltaTime: number)
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
        for(let index = 0; index < this._spaceshipLogic.length; ++index)
        {
            this._spaceshipLogic[index].update();
        }
        if(this._octree)
        {
            let boundsStartTime = performance.now()
            this._octree.UpdateBounds();
            this._settings.objBoundsUpdate = `${(performance.now() - boundsStartTime).toFixed(2)}ms`;

            let movableStartTime = performance.now()
            this._octree.UpdateMovableObjects();
            this._settings.octreeUpdateTime = `${(performance.now() - movableStartTime).toFixed(2)}ms`;
        }
        if(this._stars && this._stars.visible)
            this._stars.position.copy(this._camera.position);

        if(this._settings.selectedDemo == "FrustumCulling" && this._octree != undefined && this._frustumViewRadius != undefined && this._frustumViewRadius.visible)
        {
            for(let index = 0; index < this._spawnedTrees.length; ++index)
            {
                this._spawnedTrees[index].GetObject3D().visible = false;
            }

            let origin = new Vector3();

            //Needs to match cone radius & height
            let height = 150;
            let radius = 35;
            let sliceCount = 5;

            let boxes: THREE.Box3[] = [];
            for (let index = 0; index < sliceCount; ++index)
            {
                let distance1 = index / sliceCount * height;
                let distance2 = (index + 1) / sliceCount * height;
                let distanceMid = (distance1 + distance2) * 0.5;
                let midRadius = (distanceMid / height) * radius;
                if(index == 0)
                    midRadius = Math.max(distance1 / height * radius, distance2 / height * radius) * 2.0;

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
                            corner.applyQuaternion(this._frustumViewRadius.quaternion).add(origin);
                            corners.push(corner);
                        }
                    }
                }
                const box = new Box3().setFromPoints(corners);
                boxes.push(box);
            }

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
            this._settings.octreeQueryTime = `${(performance.now() - queryStartTime).toFixed(2)}ms`;

            let frustumStartTime = performance.now()
            let coneForward = new Vector3(0, -1, 0).applyQuaternion(this._frustumViewRadius.quaternion).normalize();
            let halfAngle = Math.atan(radius / height);
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
                this._settings.frustumCullingTime = `${(performance.now() - frustumStartTime).toFixed(2)}ms`;
        }
    }

    //Called when you deactivate the view, dispose & reset everything
    public hide()
    {
        if(this._octree)
            this._octree.Destroy();
        for(let index = 0; index < this._spawnedAsteroids.length; ++index)
        {
            let obj = this._spawnedAsteroids[index].GetObject3D();
            this._scene.remove(obj);
            this.disposeObject(obj);
        }
        for(let index = 0; index < this._spawnedSpaceships.length; ++index)
        {
            let obj = this._spawnedSpaceships[index].GetObject3D();
            this._scene.remove(obj);
            this.disposeObject(obj);
        }
        for(let index = 0; index < this._spawnedTrees.length; ++index)
        {
            let obj = this._spawnedTrees[index].GetObject3D();
            this._scene.remove(obj);
            this.disposeObject(obj);
        }
        this._spawnedAsteroids = [];
        this._spawnedSpaceships = [];
        this._spaceshipLogic = [];
        this._spawnedTrees = [];
        
        if(this._stars)
            this.disposeObject(this._stars);
        if(this._frustumGround)
            this.disposeObject(this._frustumGround);
        if(this._frustumViewRadius)
            this.disposeObject(this._frustumViewRadius);

        this._debugUI.reset(); //Events will also unsubscribe here
        this._visualizer._cameraManager.scene.background = this._defaultSceneColor;
        this._camera.position.copy(this._defaultCameraPos);
        this._camera.far = this._defaultCameraFar;
        this._camera.near = this._defaultCameraNear;
    }

    public getScene() { return this._scene; }

    private displayUI()
    {
        this._debugUI.reset();
        this._debugUI.addDropdown("", this._settings, "selectedDemo", this._settings.availableDemos, "DemoScene", () => { this.onSceneChanged(); });
        this._debugUI.addCheckbox("", this._settings, "displayOctreeDebug", "Display Octree", () => { this.onDebugDisplayChanged(); });
        this._debugUI.addCheckbox("", this._settings, "displayObjectsDebug", "Display Object Bounds", () => { this.onDebugDisplayChanged(); });

        if(this._settings.selectedDemo == "Spaceships")
        {
            this._debugUI.addSlider("", this._settings, "asteroidCount", 0, 5000, "Asteroid Count", () => { this.updateAsteroidCount(); });
            this._debugUI.addSlider("", this._settings, "spaceshipCount", 0, 1000, "Spaceship Count", () => { this.updateSpaceshipCount(); });
            this._debugUI.addText("", this._settings, "objBoundsUpdate", "Bounds Recompute", false);
            this._debugUI.addText("", this._settings, "octreeUpdateTime", "Octree Update", false);
        }
        else if(this._settings.selectedDemo == "FrustumCulling")
        {
            this._debugUI.addSlider("", this._settings, "treeCount", 0, 10000, "Tree Count", () => { this.updateTreeCount(); });
            this._debugUI.addText("", this._settings, "octreeQueryTime", "Octree Query", false);
            this._debugUI.addText("", this._settings, "frustumCullingTime", "Frustum Culling", false);
        }
    }

    private onSceneChanged()
    {
        if(this._octree)
            this._octree.Destroy();
        for(let index = 0; index < this._spawnedAsteroids.length; ++index)
        {
            let obj = this._spawnedAsteroids[index].GetObject3D();
            this._scene.remove(obj);
            this.disposeObject(obj);
        }
        for(let index = 0; index < this._spawnedSpaceships.length; ++index)
        {
            let obj = this._spawnedSpaceships[index].GetObject3D();
            this._scene.remove(obj);
            this.disposeObject(obj);
        }
        for(let index = 0; index < this._spawnedTrees.length; ++index)
        {
            let obj = this._spawnedTrees[index].GetObject3D();
            this._scene.remove(obj);
            this.disposeObject(obj);
        }
        this._spawnedAsteroids = [];
        this._spawnedSpaceships = [];
        this._spaceshipLogic = [];
        this._spawnedTrees = [];

        this._octreeDebugVisualizer.releaseAllCubes();
        this._objectsDebugVisualizer.releaseAllCubes();
        this.displayUI();

        switch(this._settings.selectedDemo)
        {
            case "Spaceships":
                this.setupSpaceshipScene();
                break;
            case "FrustumCulling":
                this.setupFrustumCullingScene();
                break;
        }
    }

    private onDebugDisplayChanged()
    {
        this._octree.SetDebugVisualizer(this._settings.displayOctreeDebug ? this._octreeDebugVisualizer : undefined);
        for(let index = 0; index < this._spawnedAsteroids.length; ++index)
        {
            this._spawnedAsteroids[index].SetDebugVisualizer(this._settings.displayObjectsDebug ? this._objectsDebugVisualizer : undefined);
        }
        for(let index = 0; index < this._spawnedSpaceships.length; ++index)
        {
            this._spawnedSpaceships[index].SetDebugVisualizer(this._settings.displayObjectsDebug ? this._objectsDebugVisualizer : undefined);
        }
        for(let index = 0; index < this._spawnedTrees.length; ++index)
        {
            this._spawnedTrees[index].SetDebugVisualizer(this._settings.displayObjectsDebug ? this._objectsDebugVisualizer : undefined);
        }
    }

    private setupSpaceshipScene()
    {
        if(this._frustumViewRadius)
            this._frustumViewRadius.visible = false;
        if(this._frustumGround)
            this._frustumGround.visible = false;

        this._settings.displayOctreeDebug = true;
        this._settings.displayObjectsDebug = true;

        this._visualizer._cameraManager.scene.background = new Color(0x000000);
        this._camera.position.set(500, 0, 0);
        this._camera.rotation.set(0, 0, 0);
        
        if(this._stars == undefined)
            this.generateStars();
        else
            this._stars.visible = true;

        let waitForLoad = false;
        if(this._asteroid == undefined)
        {
            waitForLoad = true;
            this._visualizer._objectLoader.loadModel("models/ShaderProjects/Octree/asteroid.glb", (model: Asset3D) => {
                this._asteroid = model.model;
                this.onSpaceAssetsLoaded();
            }, () => {});
        }
        if(this._spaceship == undefined)
        {
            waitForLoad = true;
            this._visualizer._objectLoader.loadModel("models/ShaderProjects/Octree/spaceship.glb", (model: Asset3D) => {
                this._spaceship = model.model;
                this.onSpaceAssetsLoaded();
            }, () => {});
        }
        if(!waitForLoad)
            this.onSpaceAssetsLoaded();
    }

    private onSpaceAssetsLoaded()
    {
        if(this._asteroid == undefined || this._spaceship == undefined)
            return;
        
        this._spawnedAsteroids = this.spawnRandomObjects(this._asteroid, this._settings.asteroidCount, 1.0, 3.0, true, 0, this._spawnDistance, false);
        this._spawnedSpaceships = this.spawnRandomObjects(this._spaceship, this._settings.spaceshipCount, 1.0, 1.0, true, 0, this._spawnDistance, true);

        let objToAdd: OctreeObj[] = [];
        for(let index = 0; index < this._spawnedAsteroids.length; ++index)
        {
            objToAdd.push(this._spawnedAsteroids[index]);
        }
        for(let index = 0; index < this._spawnedSpaceships.length; ++index)
        {
            let logic = new Spaceship(this._spawnedSpaceships[index].GetObject3D(), this._octreeBounds, 20.0, 1.5);
            this._spaceshipLogic.push(logic);
            objToAdd.push(this._spawnedSpaceships[index]);
        }

        this._octree = new Octree(this._octreeBounds, objToAdd, 5, 5, 1, this._settings.displayOctreeDebug ? this._octreeDebugVisualizer : undefined);
    }

    private setupFrustumCullingScene()
    {
        if(this._stars)
            this._stars.visible = false;

        this._settings.displayOctreeDebug = false;
        this._settings.displayObjectsDebug = false;

        this._visualizer._cameraManager.scene.background = new Color(0x555555);
        this._camera.position.set(0, 300, 0.0);

        if(this._frustumGround == undefined)
        {
            this._frustumGround = new Mesh(new PlaneGeometry(), new MeshStandardMaterial({ color: 0xffffff, side: DoubleSide }));
            this._frustumGround.position.set(0, 5, 0);
            this._frustumGround.scale.set(200, 200, 200);
            this._frustumGround.rotation.set(-Math.PI / 2.0, 0.0, 0.0);
            this._scene.add(this._frustumGround);

            this._textureLoader.load("images/textures/grass.jpg", (tex: Texture) => {
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
            this._scene.add(this._frustumViewRadius);
        }
        else
            this._frustumViewRadius.visible = true;
        
        if(this._tree == undefined)
        {
            this._visualizer._objectLoader.loadModel("models/ShaderProjects/Octree/pine_tree.glb", (model: Asset3D) => {
                this._tree = model.model;
                this.onTreeAssetLoaded();
            }, () => {});
        }
        else
            this.onTreeAssetLoaded();
    }

    private onTreeAssetLoaded()
    {
        this._spawnedTrees = this.spawnRandomObjects(this._tree!, this._settings.treeCount, 1.0, 2.0, false, 5, this._spawnDistance, false);
        for(let index = 0; index < this._spawnedTrees.length; ++index)
        {
            this._spawnedTrees[index].GetObject3D().visible = false;
        }
        this._octree = new Octree(this._octreeBounds, this._spawnedTrees, 5, 7, 1, this._settings.displayOctreeDebug ? this._octreeDebugVisualizer : undefined);
    }

    private updateAsteroidCount()
    {
        let diff = this._settings.asteroidCount - this._spawnedAsteroids.length;
        if(diff < 0)
        {
            for(let index = 0; index < -diff; ++index)
            {
                this._spawnedAsteroids[index].SetDebugVisualizer(undefined);
                let obj = this._spawnedAsteroids[index].GetObject3D();
                this._octree.RemoveObject(obj);
                this._scene.remove(obj);
                this.disposeObject(obj);
            }
            this._spawnedAsteroids.splice(0, -diff);
        }
        else if(diff > 0)
        {
            let newAsteroids = this.spawnRandomObjects(this._asteroid!, diff, 1.0, 3.0, true, 0, this._spawnDistance, false);
            for(let index = 0; index < newAsteroids.length; ++index)
            {
                this._spawnedAsteroids.push(newAsteroids[index]);
                this._octree.AddObject(newAsteroids[index]);
            }
        }
    }

    private updateSpaceshipCount()
    {
        let diff = this._settings.spaceshipCount - this._spawnedSpaceships.length;
        if(diff < 0)
        {
            for(let index = 0; index < -diff; ++index)
            {
                this._spawnedSpaceships[index].SetDebugVisualizer(undefined);
                let obj = this._spawnedSpaceships[index].GetObject3D();
                this._octree.RemoveObject(obj);
                this._scene.remove(obj);
                this.disposeObject(obj);
            }
            this._spawnedSpaceships.splice(0, -diff);
            this._spaceshipLogic.splice(0, -diff);
        }
        else if(diff > 0)
        {
            let newSpaceships = this.spawnRandomObjects(this._spaceship!, diff, 1.0, 1.0, true, 0, this._spawnDistance, true);
            let length = this._spawnedSpaceships.length;
            for(let index = 0; index < newSpaceships.length; ++index)
            {
                let logic = new Spaceship(newSpaceships[index].GetObject3D(), this._octreeBounds, 20.0, 1.5);
                this._spaceshipLogic.push(logic);
                this._spawnedSpaceships.push(newSpaceships[index]);
                this._octree.AddObject(this._spawnedSpaceships[index + length]);
            }
        }
    }

    private updateTreeCount()
    {
        let diff = this._settings.treeCount - this._spawnedTrees.length;
        if(diff < 0)
        {
            for(let index = 0; index < -diff; ++index)
            {
                this._spawnedTrees[index].SetDebugVisualizer(undefined);
                let obj = this._spawnedTrees[index].GetObject3D();
                this._octree.RemoveObject(obj);
                this._scene.remove(obj);
                this.disposeObject(obj);
            }
            this._spawnedTrees.splice(0, -diff);
        }
        else if(diff > 0)
        {
            let newTrees = this.spawnRandomObjects(this._tree!, diff, 1.0, 2.0, false, 5, this._spawnDistance, false);
            let length = this._spawnedTrees.length;
            for(let index = 0; index < newTrees.length; ++index)
            {
                this._spawnedTrees.push(newTrees[index]);
                this._octree.AddObject(this._spawnedTrees[index + length]);
            }
        }
    }

    private spawnRandomObjects(objToSpawn: Object3D, count: number, minScale: number, maxScale: number, randomizeY: boolean, fixedY: number, maxSpawnDistance: Vector3, isMovable: boolean)
    {
        let newObjects: OctreeObj[] = [];
        for(let index = 0; index < count; ++index)
        {
            let obj = objToSpawn.clone();
            if(randomizeY)
            {
                obj.position.set(
                    (Math.random() * 2.0 - 1.0) * maxSpawnDistance.x,
                    (Math.random() * 2.0 - 1.0) * maxSpawnDistance.y,
                    (Math.random() * 2.0 - 1.0) * maxSpawnDistance.z
                );
            }
            else
            {
                obj.position.set(
                    (Math.random() * 2.0 - 1.0) * maxSpawnDistance.x,
                    fixedY,
                    (Math.random() * 2.0 - 1.0) * maxSpawnDistance.z
                );
            }
            let scale = minScale + Math.random() * (maxScale - minScale)
            obj.scale.set(scale, scale, scale);

            this._scene.add(obj);
            let octreeObj = new OctreeObj(obj, isMovable, this._settings.displayObjectsDebug ? this._objectsDebugVisualizer : undefined);
            newObjects.push(octreeObj);
        }
        return newObjects;
    }

    private generateStars()
    {
        const starCount = 5000;
        const minRadius = 600;
        const maxRadius = 800;
        const positions = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++)
        {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            const xDir = Math.sin(phi) * Math.cos(theta);
            const yDir = Math.cos(phi);
            const zDir = Math.sin(phi) * Math.sin(theta);

           const radius = minRadius + Math.random() * (maxRadius - minRadius);

            const idx = i * 3;
            positions[idx] = xDir * radius;
            positions[idx + 1] = yDir * radius;
            positions[idx + 2] = zDir * radius;
        }

        const geometry = new BufferGeometry();
        geometry.setAttribute("position", new BufferAttribute(positions, 3));

        const material = new PointsMaterial({
            color: 0xffffff,
            size: 2.0,
            sizeAttenuation: true,
        });

        this._stars = new Points(geometry, material);
        this._scene.add(this._stars);
    }

    private disposeObject(obj: Object3D)
    {
        obj.traverse((item) => {
            if(item instanceof Mesh)
            {
                let mesh = item as Mesh;
                if(Object.prototype.toString.call(mesh.material) === '[object Object]')
                    (mesh.material as Material).dispose();
                else
                {
                    let material = mesh.material as Material[];
                    for(let index = 0; index < material.length; ++index)
                    {
                        material[index].dispose();
                    }
                }
                mesh.geometry.dispose();
            }
        });
    }
}
