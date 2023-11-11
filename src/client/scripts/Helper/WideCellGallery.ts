import { CellGalleryConfig } from "../../types";
import { GalleryView } from "./GalleryView";

export class WideCellGallery
{
    private _tags: HTMLDivElement[] = [];
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
            this._tags.push(tag);
        }

        let description = document.createElement("div");
        description.className = "wideCellGalleryDescription";
        description.innerHTML = config._description;
        leftPanel.appendChild(description);

        this._gallery = new GalleryView(rightPanel, config._id, config._imagesPath, config._imageCount, config._videoFormatIndices, config._imageDurationMs);

        if(config._btn1Link != "" || config._btn2Link != "")
        {
            let moreDetailsBorder = document.createElement("div");
            moreDetailsBorder.className = "cellButtonBorder";
            leftPanel.appendChild(moreDetailsBorder);
    
            let moreDetails = document.createElement("div");
            moreDetails.className = "cellButton"; 
            moreDetails.addEventListener('mousedown', () => { window.open(config._btn2Link, '_blank'); });
            moreDetailsBorder.appendChild(moreDetails);
    
            let moreDetailsText = document.createElement("div");
            moreDetailsText.className = "centerText";
            moreDetailsText.innerHTML = config._btn2Name;
            moreDetails.appendChild(moreDetailsText);
        }
    }

    public update()
    {
        this._gallery.update();
    }
    
    public updateColorTheme()
    {
        for(let index = 0; index < this._tags.length; ++index)
        {
            if(document.documentElement.className == "grayscaleTheme")
                this._tags[index].classList.add("grayscale");
            else
                this._tags[index].classList.remove("grayscale");
        }
        this._gallery.updateColorTheme();
    }
}