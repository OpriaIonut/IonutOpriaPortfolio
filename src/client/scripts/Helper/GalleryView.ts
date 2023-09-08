import { timeStats } from "../../client";

export class GalleryView
{
    private _inputBoxes: HTMLInputElement[] = [];
    private _navLabels: HTMLLabelElement[] = [];
    private _isImageItem: boolean[] = [];
    private _actualItems: HTMLElement[] = [];
    private _galleryItem!: HTMLDivElement;
    private _currentSelectedIndex: number = 0;

    private _galleryParent: HTMLDivElement;

    private _imageDuration: number = 0;
    private _currentDuration: number = 0;
    private _startTime: number = 0;

    constructor(parentNode: HTMLElement, id: string, imagesPath: string, imageCount: number, videoFormatIndices: number[], durationMs: number)
    {
        this.onInputClicked = this.onInputClicked.bind(this);
        this._imageDuration = durationMs;
        this._startTime = timeStats.currentTime;

        this._galleryParent = document.createElement("div");
        this._galleryParent.className = "gallery";
        parentNode.appendChild(this._galleryParent);

        let slidesParent = document.createElement("div");
        slidesParent.className = "gallerySlidesParent";
        slidesParent.style.width = `${imageCount}00%`;
        this._galleryParent.appendChild(slidesParent);

        let navigation = document.createElement("div");
        navigation.className = "galleryNavigation";
        this._galleryParent.appendChild(navigation);

        var style = document.createElement('style');
        style.type = 'text/css';

        let cssRules = "";
        for(let index = 0; index < imageCount; ++index)
        {
            let input = document.createElement("input");
            input.type = "radio";
            input.name = "r";
            input.id = "gallery" + id + "R" + index;
            if(index == 0)
                input.checked = true;

            input.onchange = this.onInputClicked;
            this._inputBoxes.push(input);
            
            // cssRules += `#gallery${id}R${index}:checked ~ .gallery${id}S0 { margin-left: -${100 / imageCount * index}%; }\n`;
            slidesParent.appendChild(input);
        }
        style.textContent = cssRules;
        document.head.appendChild(style);

        for(let index = 0; index < imageCount; ++index)
        {
            let slide = document.createElement("div");
            slide.className = "gallerySlide"; 
            slide.style.width = `${100 / imageCount}%`;
            slidesParent.appendChild(slide);
            if(index == 0)
            {
                slide.classList.add("gallery" + id + "S0");
                this._galleryItem = slide;
            }

            if(videoFormatIndices.includes(index))
            {
                let video = document.createElement("video");
                video.className = "fullres";
                video.src = imagesPath + index.toString() + ".mp4";
                slide.appendChild(video);
                this._actualItems.push(video);
                this._isImageItem.push(false);
            }
            else
            {
                let img = document.createElement("img");
                img.className = "fullres";
                img.src = imagesPath + index.toString() + ".jpg";
                slide.appendChild(img);
                this._actualItems.push(img);
                this._isImageItem.push(true);
            }

            let navLabel = document.createElement("label");
            navLabel.className = "galleryBar";
            navLabel.htmlFor = "gallery" + id + "R" + index;
            if(index == 0)
                navLabel.style.backgroundColor = "#999999";
            
            navLabel.onmouseenter = (e) => { (e.target as HTMLElement).style.backgroundColor = "#fff"; };
            navLabel.onmouseleave = (e) => { 
                let elem = e.target as HTMLLabelElement;
                if(elem !== undefined)
                    elem.style.backgroundColor = (elem.htmlFor == this._navLabels[this._currentSelectedIndex].htmlFor) ? "#999999" : "transparent"; 
            };
            navigation.appendChild(navLabel);
            this._navLabels.push(navLabel);
        }
    }

    public update()
    {
        if(timeStats.currentTime - this._startTime > this._currentDuration)
        {
            if(!this.isElementInViewport())
            {
                this._startTime = timeStats.currentTime;
                return;
            }

            this.clearCurrentSelection();
            this._currentSelectedIndex++;
            if(this._currentSelectedIndex >= this._navLabels.length)
                this._currentSelectedIndex = 0;

            this.applyCurrentSelection();
        }
    }

    private isElementInViewport() 
    {
        var rect = this._galleryParent.getBoundingClientRect();
        return rect.top >= -window.innerHeight * 0.1 && rect.bottom <= (window.innerHeight + window.innerHeight * 0.1);
      }

    private applyCurrentSelection()
    {
        if(this._isImageItem[this._currentSelectedIndex])
            this._currentDuration = this._imageDuration;
        else
        {
            let vid = this._actualItems[this._currentSelectedIndex] as HTMLVideoElement;
            vid.play();
            this._currentDuration = vid.duration * 1000 + 500;
        }

        this._galleryItem.style.marginLeft = `-${100 / this._navLabels.length * this._currentSelectedIndex}%`;
        this._navLabels[this._currentSelectedIndex].style.backgroundColor = "#999999";
        this._startTime = timeStats.currentTime;
    }

    private clearCurrentSelection()
    {
        if(!this._isImageItem[this._currentSelectedIndex])
        {
            let vid = this._actualItems[this._currentSelectedIndex] as HTMLVideoElement;
            vid.pause();
            vid.currentTime = 0;
        }
        this._navLabels[this._currentSelectedIndex].style.backgroundColor = "transparent";
    }

    private onInputClicked(e: any)
    {
        this.clearCurrentSelection();
        for(let index = 0; index < this._inputBoxes.length; ++index)
        {
            this._navLabels[this._currentSelectedIndex].style.backgroundColor = "transparent";
            if(this._inputBoxes[index].id == e.target.id)
            {
                this._currentSelectedIndex = index;
                this.applyCurrentSelection();
                break;
            }
        }
    }
}