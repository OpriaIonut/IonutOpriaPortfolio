import { CellWithPreview } from "../Helper/CellWithPreview";
import { GalleryView } from "../Helper/GalleryView";

export class ArtProjectsPanel
{
    constructor()
    {
        this.createElements();
    }

    private createElements()
    {
        const parentNode = document.createElement("div");
        parentNode.id = "artProjectsPanel";
        parentNode.className = "fullwidth";
        document.body.appendChild(parentNode);

        const cellsPerWidth = 4;
        new CellWithPreview(parentNode, cellsPerWidth, "Zoro", "images/gallery/planetquest/5.jpg");
        new CellWithPreview(parentNode, cellsPerWidth, "MechaGirl", "images/models/MechaGirl.jpg");
        new CellWithPreview(parentNode, cellsPerWidth, "OniGurl", "images/models/OniGurl.jpg");
        new CellWithPreview(parentNode, cellsPerWidth, "Enri", "images/models/Enri.jpg");
        new CellWithPreview(parentNode, cellsPerWidth, "MechSpider", "images/models/MechSpider.png");
        new CellWithPreview(parentNode, cellsPerWidth, "GodEater", "images/models/GodEaterChainsaw.jpg");
        new CellWithPreview(parentNode, cellsPerWidth, "AnchorSword", "images/models/AnchorSword.png");
        new CellWithPreview(parentNode, cellsPerWidth, "FantasyBow", "images/models/FantasyBow.png");

        let renderGalleryParent = document.createElement("div");
        renderGalleryParent.id = "renderGalleryParent";
        document.body.appendChild(renderGalleryParent);

        new GalleryView(renderGalleryParent, "renderGallery", "images/gallery/renders/", 9, 2000);

        let moreGamesBtn = document.createElement("button");
        moreGamesBtn.className = "middleCenterBtn";
        moreGamesBtn.innerHTML = "More Models";
        moreGamesBtn.onclick = () => { window.open('https://sketchfab.com/kirirato', '_blank'); };
        document.body.appendChild(moreGamesBtn);
    }
}