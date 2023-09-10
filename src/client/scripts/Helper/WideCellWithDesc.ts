export class WideCellWithDesc
{
    private _cellDesc: HTMLDivElement;
    private _isVisible: boolean = false;

    constructor(parentNode: HTMLDivElement, cellID: string, title: string, description: string)
    {
        let cellDiv = document.createElement("div");
        cellDiv.id = cellID;
        cellDiv.className = "wideCellWithDesc";
        cellDiv.style.cursor = "pointer";
        cellDiv.onclick = () => { this.toggleVisibility(); };
        parentNode.appendChild(cellDiv);

        let cellTitle = document.createElement("div");
        cellTitle.className = "wideCellWithDescTitle";
        cellTitle.innerHTML = title;
        cellDiv.appendChild(cellTitle);

        // let cellBtn = document.createElement("button");
        // cellBtn.className = "wideCellWithDescBtn";
        // cellBtn.innerHTML = "^"
        // cellBtn.onclick = () => { this.toggleVisibility(); };
        // cellDiv.appendChild(cellBtn);

        this._cellDesc = document.createElement("div");
        this._cellDesc.className = "wideCellWithDescText";
        this._cellDesc.innerHTML = description;
        this._cellDesc.style.display = "none";
        cellDiv.appendChild(this._cellDesc);
    }

    public toggleVisibility()
    {
        this._isVisible = !this._isVisible;
        this._cellDesc.style.display = this._isVisible ? "block" : "none";
    }
}