import { CellGalleryConfig } from "../../types";
import { GalleryView } from "./GalleryView";

export class MultiCellWithGallery
{
    constructor(parentNode: HTMLElement, cellsPerWidth: number, config: CellGalleryConfig)
    {
        let cellParent = document.createElement("div");
        cellParent.id = config._id;
        cellParent.className = "multiCellWithGallery";
        cellParent.style.width = `${90 / cellsPerWidth}%`;
        parentNode.appendChild(cellParent);

        let topPanel = document.createElement("div");
        topPanel.className = "multiCellWithGalleryTopPanel";
        cellParent.appendChild(topPanel);

        let downPanel = document.createElement("div");
        downPanel.className = "multiCellWithGalleryDownPanel";
        cellParent.appendChild(downPanel);

        let title = document.createElement("div");
        title.className = "multiCellWithGalleryTitle";
        title.innerHTML = config._title;
        topPanel.appendChild(title);

        let tagsList = document.createElement("div");
        tagsList.className = "multiCellWithGalleryTagsList";
        downPanel.appendChild(tagsList);
        for(let index = 0; index < config._tags.length; ++index)
        {
            let tag = document.createElement("div");
            tag.className = "multiCellWithGalleryTag";
            tag.innerHTML = config._tags[index];
            tag.style.backgroundColor = config._tagColors[index];
            tagsList.appendChild(tag);
        }

        let description = document.createElement("div");
        description.className = "multiCellWithGalleryDescription";
        description.innerHTML = config._description;
        downPanel.appendChild(description);

        let gallery = new GalleryView(topPanel, config._id, config._imagesPath, config._imageCount, config._imageDurationMs);

        //To do: add more details button
        let moreDetails = document.createElement("button");
        moreDetails.innerHTML = "More Details";
        moreDetails.className = "cellButton";
        moreDetails.classList.add("multiCellWithGalleryMoreDetailsButton");
        downPanel.appendChild(moreDetails);
    }
}