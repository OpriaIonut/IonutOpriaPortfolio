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
        title.innerHTML = "Shader Projects";
        title.style.paddingBottom = "2vw";
        parentNode.appendChild(title);

        const cellsPerWidth = isPortraitMode.value ? 2 : 4;
        this._cells.push(new CellWithPreview(parentNode, "Mesh Cutting", cellsPerWidth, "MeshCutting.jpg", "images/shaders/MeshCuttingPreview.jpg", () => { shaderVisualizer.activateView(ShaderSceneType.MeshCutting); }));

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