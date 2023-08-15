import { threeModelView } from "../../client";

export class CellWithPreview
{
    constructor(parentNode: HTMLElement, cellsPerWidth: number, modelName: string, imagePath: string)
    {
        let cellParent = document.createElement("div");
        cellParent.className = "cellWithPreview";
        cellParent.style.width = `${90 / cellsPerWidth}vw`;
        cellParent.style.height = `${(90 / cellsPerWidth) * 9.0 / 16.0}vw`;
        parentNode.appendChild(cellParent);

        let img = document.createElement("img");
        img.className = "fullres";
        img.src = imagePath;
        cellParent.appendChild(img);

        cellParent.addEventListener('mouseenter', () => {
            cellParent.style.cursor = 'pointer';
        });

        cellParent.addEventListener('mouseleave', () => {
            cellParent.style.cursor = 'default';
        });

        cellParent.onclick = () => {
            threeModelView.activateView(modelName);
        };
    }
}