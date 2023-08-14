export class WideCellWithDesc
{
    constructor(parentNode: HTMLDivElement, cellID: string, title: string, description: string)
    {
        let cellDiv = document.createElement("div");
        cellDiv.id = cellID;
        cellDiv.className = "wideCellWithDesc";
        parentNode.appendChild(cellDiv);

        let cellTitle = document.createElement("div");
        cellTitle.className = "wideCellWithDescTitle";
        cellTitle.innerHTML = title;
        cellDiv.appendChild(cellTitle);

        let cellDesc = document.createElement("div");
        cellDesc.className = "wideCellWithDescText";
        cellDesc.innerHTML = description;
        cellDiv.appendChild(cellDesc);
    }
}