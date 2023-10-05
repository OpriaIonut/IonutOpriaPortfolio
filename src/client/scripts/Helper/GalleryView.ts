import { timeStats, userInteractedWithPage } from "../../client";

export class GalleryView
{
    private _inputBoxes: HTMLInputElement[] = [];
    private _navLabels: HTMLLabelElement[] = [];
    private _isImageItem: boolean[] = [];
    private _actualItems: HTMLElement[] = [];
    private _galleryItem!: HTMLDivElement;
    private _currentSelectedIndex: number = 0;

    private _pauseBtn: HTMLDivElement;
    private _galleryParent: HTMLDivElement;
    private _isMouseOverGallery: boolean = false;

    private _imageDuration: number = 0;
    private _currentDuration: number = 10000;
    private _startTime: number = 0;

    constructor(parentNode: HTMLElement, id: string, imagesPath: string, imageCount: number, videoFormatIndices: number[], durationMs: number, imgExtension?: string)
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

        this._pauseBtn = document.createElement("div");
        this._pauseBtn.className = "pauseBtn";
        this._pauseBtn.style.display = "none";
        this._galleryParent.appendChild(this._pauseBtn);

        for(let index = 0; index < imageCount; ++index)
        {
            let input = document.createElement("input");
            input.type = "radio";
            input.name = "r";
            input.id = "gallery" + id + "R" + index;
            if(index == 0)
                input.checked = true;

            input.onclick = this.onInputClicked;
            this._inputBoxes.push(input);
            slidesParent.appendChild(input);
        }

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
                video.className = "galleryVisualItem";
                video.src = imagesPath + index.toString() + ".mp4";
                
                slide.appendChild(video);
                this._actualItems.push(video);
                this._isImageItem.push(false);
                if(index == 0)
                {
                    video.addEventListener("loadedmetadata", () => {
                        this._currentDuration = video.duration * 1000 + 500;
                    });
                }
            }
            else
            {
                let img = document.createElement("img");
                img.className = "galleryVisualItem";
                img.src = imagesPath + index.toString() + "." + (imgExtension === undefined ? "jpg" : imgExtension);

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
        //To do: check when all images/videos finish loading and then run this function
        setTimeout(() => { this.checkAspectRatio(); }, 1000);
        window.addEventListener('mousemove', (event) => { this.onMouseMove(event); });
    }

    public update()
    {
        if(timeStats.currentTime > 3000 && timeStats.currentTime - this._startTime > this._currentDuration)
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

        if(!this._isImageItem[this._currentSelectedIndex])
        {
            let vid = this._actualItems[this._currentSelectedIndex] as HTMLVideoElement;
            this._pauseBtn.style.display = vid.paused ? "block" : "none";
            if(document.documentElement.className == "grayscaleTheme")
                this._pauseBtn.style.filter = "grayscale(100%)";
            else
                this._pauseBtn.style.filter = "";

            if(this._isMouseOverGallery && vid.currentTime < vid.duration)
            {
                if(userInteractedWithPage.value)
                    vid.play();
                this._currentDuration = (vid.duration - vid.currentTime) * 1000 + 500;
                this._startTime = timeStats.currentTime;
            }
            else
                vid.pause();
        }
        else
            this._pauseBtn.style.display = "none";
    }

    private onMouseMove(event: any)
    {
        const divRect = this._galleryParent.getBoundingClientRect();
        const mouseX = event.clientX;
        const mouseY = event.clientY;
      
        if (mouseX >= divRect.left && mouseX <= divRect.right && mouseY >= divRect.top && mouseY <= divRect.bottom) 
            this._isMouseOverGallery = true;
        else
            this._isMouseOverGallery = false;
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
            this._currentDuration = vid.duration * 1000 + 500;
        }

        this._galleryItem.style.marginLeft = `-${100 / this._navLabels.length * this._currentSelectedIndex}%`;
        this._navLabels[this._currentSelectedIndex].style.backgroundColor = "#999999";
        this._startTime = timeStats.currentTime;
    }

    private checkAspectRatio()
    {
        let applyRatio = false;
        for(let index = 0; index < this._actualItems.length; ++index)
        {
            let currentAspectRatio = this._actualItems[index].clientWidth / this._actualItems[index].clientHeight;
            if(currentAspectRatio <= 17.0 / 9.0)
            {
                applyRatio = true;
                break;
            }
        }
        if(applyRatio)
        {
            for(let index = 0; index < this._actualItems.length; ++index)
            {
                this._actualItems[index].style.height = `${this._actualItems[index].clientWidth * 9.0 / 16.0}px`; 
            }
        }
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

    public updateColorTheme()
    {
        for(let index = 0; index < this._actualItems.length; ++index)
        {
            if(document.documentElement.className == "grayscaleTheme")
                this._actualItems[index].classList.add("grayscale");
            else
                this._actualItems[index].classList.remove("grayscale");
        }
    }
}