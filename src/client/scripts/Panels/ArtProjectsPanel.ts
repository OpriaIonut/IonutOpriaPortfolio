import { isPortraitMode } from "../../client";
import { CellWithPreview } from "../Helper/CellWithPreview";

export class ArtProjectsPanel
{
    private _cells: CellWithPreview[] = [];

    constructor(pageParent: HTMLDivElement)
    {
        this.createElements(pageParent);
    }

    private createElements(pageParent: HTMLDivElement)
    {
        const parentNode = document.createElement("div");
        parentNode.id = "artProjectsPanel";
        parentNode.className = "fullwidth";
        pageParent.appendChild(parentNode);

        let title = document.createElement("div");
        title.className = "sectionTitle";
        title.innerHTML = "3D Models";
        title.style.paddingBottom = "2vw";
        parentNode.appendChild(title);

        const cellsPerWidth = isPortraitMode.value ? 2 : 4;
        this._cells.push(new CellWithPreview(parentNode, cellsPerWidth, "BloodyBunny", "images/models/BloodyBunny.jpg"));
        this._cells.push(new CellWithPreview(parentNode, cellsPerWidth, "MechaGirl", "images/models/MechaGirl.jpg"));
        this._cells.push(new CellWithPreview(parentNode, cellsPerWidth, "OniGurl", "images/models/OniGurl.jpg"));
        this._cells.push(new CellWithPreview(parentNode, cellsPerWidth, "Jorogumo", "images/models/Jorogumo.jpg"));
        this._cells.push(new CellWithPreview(parentNode, cellsPerWidth, "MechSpider", "images/models/MechSpider.jpg"));
        this._cells.push(new CellWithPreview(parentNode, cellsPerWidth, "GodEater", "images/models/GodEaterChainsaw.jpg"));
        this._cells.push(new CellWithPreview(parentNode, cellsPerWidth, "AnchorSword", "images/models/AnchorSword.jpg"));
        this._cells.push(new CellWithPreview(parentNode, cellsPerWidth, "FantasyBow", "images/models/FantasyBow.jpg"));

        let renderGalleryParent = document.createElement("div");
        renderGalleryParent.id = "renderGalleryParent";
        document.body.appendChild(renderGalleryParent);

        //new GalleryView(renderGalleryParent, "renderGallery", "images/gallery/renders/", 9, 2000);

        let moreDetailsBorder = document.createElement("div");
        moreDetailsBorder.className = "middleCenterBtnBorder";
        moreDetailsBorder.style.marginTop = "2vw";
        moreDetailsBorder.style.marginBottom = "1vw";
        parentNode.appendChild(moreDetailsBorder);

        let moreGamesBtn = document.createElement("div");
        moreGamesBtn.className = "middleCenterBtn";
        moreGamesBtn.addEventListener('mousedown', () => { window.open('https://sketchfab.com/kirirato', '_blank'); });
        moreDetailsBorder.appendChild(moreGamesBtn);

        let moreDetailsText = document.createElement("div");
        moreDetailsText.className = "centerText";
        moreDetailsText.innerHTML = "More Models";
        moreGamesBtn.appendChild(moreDetailsText);
    }

    public updateColorTheme()
    {
        for(let index = 0; index < this._cells.length; ++index)
        {
            this._cells[index].updateColorTheme();
        }
    }
}