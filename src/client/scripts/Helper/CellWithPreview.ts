import { threeModelView } from "../../client";

export class CellWithPreview
{
    private _preview: HTMLImageElement;

    constructor(parentNode: HTMLElement, title: string, cellsPerWidth: number, modelName: string, imagePath: string, onClick: (projectName: string, progressBar: HTMLDivElement) => void)
    {
        let baseWidthForCalc = 75;
        if(window.innerWidth / window.innerHeight > 2.5 / 1.0)
            baseWidthForCalc = 65;

        let cellParent = document.createElement("div");
        cellParent.className = "cellWithPreview";
        cellParent.style.width = `${baseWidthForCalc / cellsPerWidth}vw`;
        cellParent.style.height = `${(baseWidthForCalc / cellsPerWidth) * 9.0 / 16.0}vw`;
        parentNode.appendChild(cellParent);

        this._preview = document.createElement("img");
        this._preview.className = "fullres";
        this._preview.src = imagePath;
        this._preview.style.objectFit = "cover";
        cellParent.appendChild(this._preview);

        let clickMeTag = document.createElement("div");
        clickMeTag.innerHTML = "Click Me";
        clickMeTag.className = "clickMeTag";
        cellParent.appendChild(clickMeTag);

        let progressBar = document.createElement("div");
        progressBar.className = "cellWithPreviewProgressBar";
        cellParent.appendChild(progressBar);

        let titleBox: HTMLDivElement | undefined;
        if(title != "")
        {
            titleBox = document.createElement("div");
            titleBox.className = "cellWithPreviewTitle";
            titleBox.innerHTML = title;
            cellParent.appendChild(titleBox);
        }

        cellParent.addEventListener('mouseenter', () => {
            cellParent.style.cursor = 'pointer';
            if(titleBox)
            {
                titleBox.style.backgroundColor = "var(--secondary-color)";
                titleBox.style.color = "aliceblue";
            }
        });

        cellParent.addEventListener('mouseleave', () => {
            cellParent.style.cursor = 'default';
            if(titleBox)
            {
                titleBox.style.backgroundColor = "aliceblue";
                titleBox.style.color = "var(--secondary-color)";
            }
        });

        cellParent.onclick = () => {
            onClick(modelName, progressBar);
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