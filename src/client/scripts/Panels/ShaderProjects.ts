import { isPortraitMode, threeModelView } from "../../client";
import { CellWithPreview } from "../Helper/CellWithPreview";

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
        this._cells.push(new CellWithPreview(parentNode, cellsPerWidth, "BloodyBunny", "images/models/BloodyBunny.jpg", (projectName: string, progressBar: HTMLDivElement) => { threeModelView.activateView(projectName, progressBar); }));
        // this._cells.push(new CellWithPreview(parentNode, cellsPerWidth, "MechaGirl", "images/models/MechaGirl.jpg"));
        // this._cells.push(new CellWithPreview(parentNode, cellsPerWidth, "OniGurl", "images/models/OniGurl.jpg"));
        // this._cells.push(new CellWithPreview(parentNode, cellsPerWidth, "Jorogumo", "images/models/Jorogumo.jpg"));
        // this._cells.push(new CellWithPreview(parentNode, cellsPerWidth, "MechSpider", "images/models/MechSpider.jpg"));
        // this._cells.push(new CellWithPreview(parentNode, cellsPerWidth, "GodEater", "images/models/GodEaterChainsaw.jpg"));
        // this._cells.push(new CellWithPreview(parentNode, cellsPerWidth, "AnchorSword", "images/models/AnchorSword.jpg"));
        // this._cells.push(new CellWithPreview(parentNode, cellsPerWidth, "FantasyBow", "images/models/FantasyBow.jpg"));

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