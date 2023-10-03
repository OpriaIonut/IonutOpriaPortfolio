import { threeModelView } from "../../client";

export class CellWithPreview
{
    private _preview: HTMLImageElement;

    constructor(parentNode: HTMLElement, cellsPerWidth: number, modelName: string, imagePath: string)
    {
        let cellParent = document.createElement("div");
        cellParent.className = "cellWithPreview";
        cellParent.style.width = `${80 / cellsPerWidth}vw`;
        cellParent.style.height = `${(80 / cellsPerWidth) * 9.0 / 16.0}vw`;
        parentNode.appendChild(cellParent);

        this._preview = document.createElement("img");
        this._preview.className = "fullres";
        this._preview.src = imagePath;
        this._preview.style.objectFit = "cover";
        cellParent.appendChild(this._preview);

        let progressBar = document.createElement("div");
        progressBar.className = "cellWithPreviewProgressBar";
        cellParent.appendChild(progressBar);

        cellParent.addEventListener('mouseenter', () => {
            cellParent.style.cursor = 'pointer';
        });

        cellParent.addEventListener('mouseleave', () => {
            cellParent.style.cursor = 'default';
        });

        cellParent.onclick = () => {
            threeModelView.activateView(modelName, progressBar);
        };
    }

    public updateColorTheme()
    {
        if(document.documentElement.className == "grayscaleTheme")
            this._preview.classList.add("grayscale");
        else
            this._preview.classList.remove("grayscale");
    }
}