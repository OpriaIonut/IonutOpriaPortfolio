import { isPortraitMode } from "../../client";
import { CellGalleryConfig } from "../../types";
import { GalleryView } from "./GalleryView";

export class MultiCellWithGallery
{
    private _tags: HTMLDivElement[] = [];
    private _gallery: GalleryView;

    constructor(parentNode: HTMLElement, cellsPerWidth: number, config: CellGalleryConfig)
    {
        let cellParent = document.createElement("div");
        cellParent.id = config._id;
        cellParent.className = "multiCellWithGallery";
        cellParent.style.width = isPortraitMode.value ? "95%" : `${94 / cellsPerWidth}%`;
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
            this._tags.push(tag);
        }

        let description = document.createElement("div");
        description.className = "multiCellWithGalleryDescription";
        description.innerHTML = config._description;
        downPanel.appendChild(description);

        this._gallery = new GalleryView(topPanel, config._id, config._imagesPath, config._imageCount, config._videoFormatIndices, config._imageDurationMs, config._imgExtension);

        // let moreDetails = document.createElement("div");
        // moreDetails.innerHTML = "More Details";
        // moreDetails.className = "cellButton";
        // moreDetails.onclick = () => { window.open(config._moreDetailsPage, '_blank'); };
        // downPanel.appendChild(moreDetails);

        if(config._btn1Name != "" || config._btn2Name != "")
        {
            if(config._btn1Name == "" && config._btn2Name != "")
            {
                let moreDetailsBorder = document.createElement("div");
                moreDetailsBorder.className = "cellButtonBorder";
                moreDetailsBorder.style.width = "20vw";
                moreDetailsBorder.style.height = "3vw";
                downPanel.appendChild(moreDetailsBorder);
        
                let moreDetails = document.createElement("div");
                moreDetails.className = "cellButton"; 
                moreDetails.addEventListener('mousedown', () => { window.open(config._btn2Link, '_blank'); });
                moreDetailsBorder.appendChild(moreDetails);
        
                let moreDetailsText = document.createElement("div");
                moreDetailsText.className = "centerText";
                moreDetailsText.innerHTML = config._btn2Name;
                moreDetailsText.style.fontSize = "2vw";
                moreDetails.appendChild(moreDetailsText);
            }
            else if(config._btn1Name != "" && config._btn2Name == "")
            {
                let moreDetailsBorder = document.createElement("div");
                moreDetailsBorder.className = "cellButtonBorder";
                moreDetailsBorder.style.width = "10vw";
                moreDetailsBorder.style.height = "1vw";
                downPanel.appendChild(moreDetailsBorder);
        
                let moreDetails = document.createElement("div");
                moreDetails.className = "cellButton"; 
                moreDetails.addEventListener('mousedown', () => { window.open(config._btn1Link, '_blank'); });
                moreDetailsBorder.appendChild(moreDetails);
        
                let moreDetailsText = document.createElement("div");
                moreDetailsText.className = "centerText";
                moreDetailsText.innerHTML = config._btn1Name;
                moreDetailsText.style.fontSize = "1vw";
                moreDetails.appendChild(moreDetailsText);
            }
            else
            {            
                let combinedBtnParent = document.createElement("div");
                combinedBtnParent.className = "combinedBtnParent";
                downPanel.appendChild(combinedBtnParent);

                let moreDetailsBorder = document.createElement("div");
                moreDetailsBorder.className = "combinedBtnLeftBorder";
                combinedBtnParent.appendChild(moreDetailsBorder);
        
                let moreDetails = document.createElement("div");
                moreDetails.className = "combinedBtnLeft";
                moreDetails.addEventListener('mousedown', () => { window.open(config._btn1Link, '_blank'); });
                moreDetailsBorder.appendChild(moreDetails);
        
                let moreDetailsText = document.createElement("div");
                moreDetailsText.className = "centerText";
                moreDetailsText.innerHTML = "More Details";
                moreDetails.appendChild(moreDetailsText);

                let downloadBtnBorder = document.createElement("div");
                downloadBtnBorder.className = "combinedBtnRightBorder";
                combinedBtnParent.appendChild(downloadBtnBorder);

                let downloadBtn = document.createElement("div");
                downloadBtn.className = "combinedBtnRight";
                downloadBtn.addEventListener('mousedown', () => { this.downloadFile(config._downloadPath, config._downloadName); });
                downloadBtnBorder.appendChild(downloadBtn);

                let downloadBtnText = document.createElement("div");
                downloadBtnText.className = "centerText";
                downloadBtnText.innerHTML = "Download";
                downloadBtn.appendChild(downloadBtnText);
            }
        }
    }

    public update()
    {
        this._gallery.update();
    }

    private downloadFile(filePath: string, fileName: string) 
    {
        const link = document.createElement('a');
        link.href = filePath;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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