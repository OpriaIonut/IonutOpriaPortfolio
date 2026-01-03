import { AmbientLight, BoxGeometry, DirectionalLight, DoubleSide, Mesh, MeshStandardMaterial, Plane, PlaneHelper, Scene, ShaderMaterial, Vector3 } from "three";
import { ShaderVisualizer } from "../../ShaderVisualizer";
import { IShaderScene } from "../IShaderScene";
import { MeshCutter } from "./MeshCutter";
import { DebugUI } from "../../../ThreeVisualizer/DebugGUI";

export class ShaderSceneMeshCutting implements IShaderScene
{
    private _visualizer!: ShaderVisualizer;
    private _scene: Scene = new Scene();

    private _meshToCut!: Mesh;

    private _ambientLight!: AmbientLight;
    private _directionalLight!: DirectionalLight;

    private _meshCutter: MeshCutter = new MeshCutter();
    private _meshes: Mesh[] = [];
    private _explodeDir: Vector3[] = [];
    private _centers: Vector3[] = [];

    private _debugUI!: DebugUI;
    private _debugUISettings = {
        explodeRadius: 0.0
    }

    public init(visualizer: ShaderVisualizer): void 
    {
        this._visualizer = visualizer;

        this._ambientLight = new AmbientLight(0xffffff, 0.25);
        this._scene.add(this._ambientLight);

        this._directionalLight = new DirectionalLight(0xffffff, 1.0);
        this._directionalLight.position.set(10.0, 10.0, 5.0);
        this._scene.add(this._directionalLight);

        this._meshToCut = new Mesh(
            new BoxGeometry(1, 1, 1, 1, 1, 1),
            // new ShaderMaterial({
            //     vertexShader: voronoiVertShader,
            //     fragmentShader: voronoiFragShader,
            //     uniforms: {
            //         u_scale: { value: 2.0 }
            //     },
            //     wireframe: true
            // })
            new MeshStandardMaterial({wireframe: true})
            // new ShaderMaterial({vertexShader: normalVisualizerVert, fragmentShader: normalVisualizerFrag, side: DoubleSide})
        );
        let scale = 1;
        this._meshToCut.scale.setScalar(scale);
        // this._meshToCut.position.set(3, 3, 3);
        // this._meshToCut.rotateY(Math.PI / 4);
        // this._meshToCut.rotateX(Math.PI / 8);
        // this._meshToCut.rotateZ(Math.PI / 8);
        this._scene.add(this._meshToCut);

        const plane1 = new Plane(new Vector3( 0, 1, 0 ), 0.3);
        const plane2 = new Plane(new Vector3(1, 0, 0), 0.1);
        const plane3 = new Plane(new Vector3(0, 0, 1), 0.1);
        
        let result1 = this.cutMesh([this._meshToCut], plane1);
        // let result2 = this.cutMesh(result1, plane2);
        // let result3 = this.cutMesh(result2, plane3);
        
        console.log(result1);
        for(let index = 0; index < result1.length; ++index)
        {
            this._meshes.push(result1[index]);
            this._explodeDir.push(result1[index].position.clone().sub(this._meshToCut.position));
            this._centers.push(result1[index].position.clone());
            this._meshes[index].scale.setScalar(scale);
            this._scene.add(this._meshes[index]);
        }

        // Debug UI
        this._debugUI = new DebugUI();
        let guiHtml = this._debugUI.getGUIClass()!.domElement;
        document.getElementById("shaderVisualizer")?.appendChild(guiHtml);
        guiHtml.style.position = "absolute";
        guiHtml.style.left = "0px";
        guiHtml.style.top = "0px";

        this._debugUI.addSlider("", this._debugUISettings, "explodeRadius", 0.0, 10.0, "Explode Radius", (value) => {
            for(let index = 0; index < this._meshes.length; ++index)
            {
                let dir = this._explodeDir[index].clone().normalize();
                this._meshes[index].position.copy(this._centers[index]).add(dir.multiplyScalar(this._debugUISettings.explodeRadius));
            }
        });


        /* To do:
            Cut multiple times
            Optimize vertices by calculating proper indices
            Add visualizer for cut line
            Explode physics
            Make different test scenarios (random planes, grid, etc.)
            Test on skinned meshes
            Make prettier demonstration scenes
            Optimize code
            Clean up the code
            Add code inspection (also add error checking for everything: check index 0, throw proper errors, etc.)
        */
    }

    public update(deltaTime: number): void 
    {

    }

    public hide(): void 
    {
        
    }

    public getScene(): Scene { return this._scene; }

    //Artificial offset is used because we are setting the origin of the cut meshes in the center of the new geometry.
    //This shifts the coordinate space that they are in, and for consequent cuts it produces wrong results
    private cutMesh(meshes: Mesh[], plane: Plane, displayPlane: boolean = true): Mesh[]
    {
        if(displayPlane)
        {
            const helper = new PlaneHelper( plane, 25, 0xffff00 );
            this._scene.add( helper );
        }

        let results: Mesh[] = [];
        for(let index = 0; index < meshes.length; ++index)
        {
            let result = this._meshCutter.cutGeometry(meshes[index], plane, true, true);
            let leftMesh = new Mesh(result.leftMesh, new MeshStandardMaterial());
            leftMesh.position.copy(result.leftCenter);

            let rightMesh = new Mesh(result.rightMesh, new MeshStandardMaterial());
            rightMesh.position.copy(result.rightCenter);

            results.push(leftMesh, rightMesh);
        }

        return results;
    }
}