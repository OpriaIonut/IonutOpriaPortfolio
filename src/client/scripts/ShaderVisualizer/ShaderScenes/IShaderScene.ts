import { Scene } from "three";
import { ShaderVisualizer } from "../ShaderVisualizer";

export interface IShaderScene
{
    init(visualizer: ShaderVisualizer): void;
    update(deltaTime: number): void;
    postRender(): void;
    hide(): void;
    getScene(): Scene;
}