import { AmbientLight, BoxGeometry, DirectionalLight, Mesh, MeshStandardMaterial, Scene, ShaderMaterial } from "three";
import { IShaderScene } from "./IShaderScene";
import { ShaderVisualizer } from "../ShaderVisualizer";

export class ShaderSceneTest implements IShaderScene
{
    private _visualizer!: ShaderVisualizer;
    private _ambientLight!: AmbientLight;
    private _directionalLight!: DirectionalLight;
    private _cube!: Mesh;
    private _scene: Scene = new Scene();

    public init(visualizer: ShaderVisualizer): void 
    {
        const vertShader = `
            varying vec2 v_uv;

            void main()
            {
                v_uv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        const fragShader = `
            varying vec2 v_uv;

            int test()
            {
                return 5;
            }

            void main() 
            {
                gl_FragColor = vec4(v_uv, 0.0, 1.0);
            }
        `;

        this._visualizer = visualizer;
        this._ambientLight = new AmbientLight(0xffffff, 0.25);
        this._scene.add(this._ambientLight);

        this._directionalLight = new DirectionalLight(0xffffff, 1.0);
        this._scene.add(this._directionalLight);

        this._cube = new Mesh(
            new BoxGeometry(),
            new ShaderMaterial({
                vertexShader: vertShader,
                fragmentShader: fragShader
            })
        )
        this._scene.add(this._cube);

        this._visualizer.addScript("test.vert", vertShader);
        this._visualizer.addScript("test.frag", fragShader);
    }

    public update(deltaTime: number): void 
    {
        this._cube.rotateX(deltaTime * 0.05);
        this._cube.rotateY(deltaTime * 0.1);
        this._cube.rotateZ(deltaTime * 0.15);
    }

    public hide(): void 
    {
        this._visualizer.removeScript("test.vert");
        this._visualizer.removeScript("test.frag");
    }

    public getScene(): Scene { return this._scene; }
}