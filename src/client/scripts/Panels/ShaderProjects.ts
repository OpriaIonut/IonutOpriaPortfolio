import { isPortraitMode, shaderVisualizer, threeModelView } from "../../client";
import { CellWithPreview } from "../Helper/CellWithPreview";
import { ShaderSceneType } from "../ShaderVisualizer/ShaderVisualizer";

export class ShaderProjectsPanel
{
    private _cells: CellWithPreview[] = [];

    constructor(pageParent: HTMLDivElement)
    {
        this.createElements(pageParent);
    }

    private createElements(pageParent: HTMLDivElement)
    {
        const parentNode = document.createElement("div");
        parentNode.id = "shaderProjectsPanel";
        parentNode.className = "fullwidth";
        pageParent.appendChild(parentNode);

        let title = document.createElement("div");
        title.className = "sectionTitle";
        title.innerHTML = "Live Experiments";
        title.style.paddingBottom = "2vw";
        parentNode.appendChild(title);

        const cellsPerWidth = isPortraitMode.value ? 2 : 4;
        this._cells.push(new CellWithPreview(parentNode, "Mesh Cutting", cellsPerWidth, "MeshCutting", "images/shaders/MeshCuttingPreview.jpg", () => { shaderVisualizer.activateView(ShaderSceneType.MeshCutting); }));
        this._cells.push(new CellWithPreview(parentNode, "Octree", cellsPerWidth, "Octree", "images/shaders/OctreePreview.jpg", () => { shaderVisualizer.activateView(ShaderSceneType.Octree); }));
        this._cells.push(new CellWithPreview(parentNode, "Boids", cellsPerWidth, "Boids", "images/shaders/BoidsPreview.jpg", () => { shaderVisualizer.activateView(ShaderSceneType.Boids); }));
        this._cells.push(new CellWithPreview(parentNode, "Procedural Shuriken", cellsPerWidth, "ProceduralShuriken", "images/shaders/ProceduralShuriken.png", () => { shaderVisualizer.activateView(ShaderSceneType.ProceduralShuriken2D); }));
        // this._cells.push(new CellWithPreview(parentNode, "Volumetric Clouds (not finished)", cellsPerWidth, "VolumetricClouds", "images/shaders/MeshCuttingPreview.jpg", () => { shaderVisualizer.activateView(ShaderSceneType.VolumetricClouds); }));

        let separator = document.createElement("div");
        separator.className = "separator";
        pageParent.appendChild(separator);
    }

    public updateColorTheme()
    {
        for(let index = 0; index < this._cells.length; ++index)
        {
            this._cells[index].updateColorTheme();
        }
    }
}