import { timeStats } from "../../client";
import { TypewriterElement } from "../Effects/TypewriterElement";

export class WideCellWithDesc
{
    private _cellDesc: HTMLDivElement;
    private _isVisible: boolean = false;
    private _arrowElem: HTMLImageElement;

    private _typewriter: TypewriterElement;
    private _description: string;

    constructor(parentNode: HTMLDivElement, cellID: string, title: string, description: string)
    {
        let cellDiv = document.createElement("div");
        cellDiv.id = cellID;
        cellDiv.className = "wideCellWithDesc";
        cellDiv.style.cursor = "pointer";
        cellDiv.addEventListener('mousedown', () => { this.toggleVisibility(); });
        parentNode.appendChild(cellDiv);

        let cellTitle = document.createElement("div");
        cellTitle.className = "wideCellWithDescTitle";
        cellTitle.innerHTML = title;
        cellDiv.appendChild(cellTitle);

        this._arrowElem = document.createElement("img");
        this._arrowElem.className = "wideCellWithDescArrow";
        this._arrowElem.src = "./images/ui/down-arrow.png";
        cellDiv.appendChild(this._arrowElem);

        // let cellBtn = document.createElement("button");
        // cellBtn.className = "wideCellWithDescBtn";
        // cellBtn.innerHTML = "^"
        // cellBtn.onclick = () => { this.toggleVisibility(); };
        // cellDiv.appendChild(cellBtn);

        this._cellDesc = document.createElement("div");
        this._cellDesc.className = "wideCellWithDescText";
        this._cellDesc.style.display = "none";
        cellDiv.appendChild(this._cellDesc);


        this._typewriter = new TypewriterElement(this._cellDesc);
        this._description = description;
    }

    public toggleVisibility()
    {
        this._isVisible = !this._isVisible;
        if(this._isVisible)
        {
            this._cellDesc.style.display = "block";
            this._arrowElem.src = "./images/ui/next.png";
            this._typewriter.displayText(this._description, 0.1, 0, 0, true, null);
        }
        else
        {
            this._cellDesc.innerHTML = "";
            this._cellDesc.style.display = "none";
            this._arrowElem.src = "./images/ui/down-arrow.png";
        }
    }

    public update()
    {
        this._typewriter.update(timeStats.currentTime, timeStats.deltaTime);
    }
}