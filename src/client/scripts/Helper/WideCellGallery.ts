import { CellGalleryConfig } from "../../types";
import { GalleryView } from "./GalleryView";

export class WideCellGallery
{
    private _gallery: GalleryView;

    constructor(parentNode: HTMLElement, config: CellGalleryConfig)
    {
        let cellParent = document.createElement("div");
        cellParent.id = config._id;
        cellParent.className = "wideCellGallery";
        parentNode.appendChild(cellParent);

        let leftPanel = document.createElement("div");
        leftPanel.className = "wideCellGalleryLeftPanel";
        cellParent.appendChild(leftPanel);

        let rightPanel = document.createElement("div");
        rightPanel.className = "wideCellGalleryRightPanel";
        cellParent.appendChild(rightPanel);

        let title = document.createElement("div");
        title.className = "wideCellGalleryTitle";
        title.innerHTML = config._title;
        leftPanel.appendChild(title);

        let tagsList = document.createElement("div");
        tagsList.className = "wideCellGalleryTagsList";
        leftPanel.appendChild(tagsList);
        for(let index = 0; index < config._tags.length; ++index)
        {
            let tag = document.createElement("div");
            tag.className = "wideCellGalleryTag";
            tag.innerHTML = config._tags[index];
            tag.style.backgroundColor = config._tagColors[index];
            tagsList.appendChild(tag);
        }

        let description = document.createElement("div");
        description.className = "wideCellGalleryDescription";
        description.innerHTML = config._description;
        leftPanel.appendChild(description);

        this._gallery = new GalleryView(rightPanel, "planetquestGallery", config._imagesPath, config._imageCount, config._videoFormatIndices, config._imageDurationMs);

        let moreDetails = document.createElement("button");
        moreDetails.innerHTML = "More Details";
        moreDetails.className = "cellButton";
        moreDetails.classList.add("wideCellGalleryMoreDetailsButton");
        leftPanel.appendChild(moreDetails);
    }

    public update()
    {
        this._gallery.update();
    }
}