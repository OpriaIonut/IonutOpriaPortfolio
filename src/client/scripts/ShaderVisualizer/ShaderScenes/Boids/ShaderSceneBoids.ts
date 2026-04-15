import { AmbientLight, Box3, BoxGeometry, BoxHelper, Camera, ConeGeometry, DirectionalLight, MathUtils, Mesh, MeshBasicMaterial, MeshStandardMaterial, Scene, Vector3 } from "three";
import { ShaderVisualizer } from "../../ShaderVisualizer";
import { DebugUI } from "../../../ThreeVisualizer/DebugGUI";

//Demo scene with the boids
//Handles high-level management of the scene and it's components
export class ShaderSceneBoids
{
    private _scene: Scene = new Scene();
    private _visualizer!: ShaderVisualizer;
    private _camera!: Camera;

    private _debugUI!: DebugUI;

    private _settings = {
        
    }

    // private _boids: Boid[] = [];

    public init(visualizer: ShaderVisualizer)
    {
        this._visualizer = visualizer;
        this._camera = visualizer.cameraManager.getCamera();

        this._camera.position.set(50, 0.0, 0.0);

        //Set up lights in the scene
        let ambientLight = new AmbientLight(0xffffff, 0.25);
        this._scene.add(ambientLight);
        
        let directionalLight = new DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(10.0, 10.0, 5.0);
        this._scene.add(directionalLight);

        let boundsMesh = new Mesh(new BoxGeometry(20, 20, 30), new MeshBasicMaterial({ color: 0x00ff00, wireframe: true }));
        let box = new BoxHelper(boundsMesh, 0xffff00);
        this._scene.add(box);

        let bounds = new Box3();
        bounds.setFromObject(boundsMesh);

        // let boidParams: BoidParams = {
        //     baseMesh: new Mesh(new ConeGeometry(1.0, 3.0, 8.0).rotateX(Math.PI / 2.0), new MeshStandardMaterial({color: 0x00ffff})),
        //     position: new Vector3(),
        //     scale: new Vector3(0.25, 0.25, 0.25),
        //     moveDir: new Vector3(),
        //     speed: 0.5,
        //     bounds: bounds,
        //     avoidFactor: 1.0
        // };

        // let numBoids = 100;
        // for(let index = 0; index < numBoids; ++index)
        // {
        //     boidParams.position.set(MathUtils.randFloat(bounds.min.x, bounds.max.x), MathUtils.randFloat(bounds.min.y, bounds.max.y), MathUtils.randFloat(bounds.min.z, bounds.max.z));
        //     boidParams.moveDir.set(Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0).normalize();

        //     let boid = new Boid(boidParams, this._scene);
        //     this._boids.push(boid);
        //     this._scene.add(boid.getMesh());
        // }

        this._debugUI = new DebugUI();
        let guiHtml = this._debugUI.getGUIClass()!.domElement;
        let guiParent = document.getElementById("shaderVisualizer") as HTMLElement;
        guiParent.appendChild(guiHtml);
        guiHtml.style.position = "absolute";
        guiHtml.style.left = "0px";
        guiHtml.style.top = "0px";

        // this._debugUI.addSlider("", boidParams, "avoidFactor", 0.0, 3.0, "Avoid Factor");
    }

    public update(deltaTime: number)
    {
        // for(let index = 0; index < this._boids.length; ++index)
        // {
        //     this._boids[index].update(deltaTime, this._boids);
        // }
    }

    //Called when you deactivate the view, dispose & reset everything
    public hide()
    {
        
    }

    public getScene() { return this._scene; }
}
