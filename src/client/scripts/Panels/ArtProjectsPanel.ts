import { CellWithPreview } from "../Helper/CellWithPreview";

export class ArtProjectsPanel
{
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
        parentNode.appendChild(title);

        const cellsPerWidth = 4;
        new CellWithPreview(parentNode, cellsPerWidth, "Zoro", "images/gallery/planetquest-test/5.jpg");
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

        //new GalleryView(renderGalleryParent, "renderGallery", "images/gallery/renders/", 9, 2000);

        let moreGamesBtn = document.createElement("div");
        moreGamesBtn.className = "middleCenterBtn";
        moreGamesBtn.style.marginTop = "2vw";
        moreGamesBtn.style.marginBottom = "1vw";
        moreGamesBtn.innerHTML = "More Models";
        moreGamesBtn.onclick = () => { window.open('https://sketchfab.com/kirirato', '_blank'); };
        parentNode.appendChild(moreGamesBtn);
    }
}