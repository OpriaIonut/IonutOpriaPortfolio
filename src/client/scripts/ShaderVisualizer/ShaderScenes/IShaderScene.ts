import { Scene } from "three";

export interface IShaderScene
{
    init(parentScene: Scene, scriptsHeader: HTMLDivElement, scriptCodeEditor: HTMLDivElement): void;
    update(deltaTime: number): void;
    hide(): void;
}