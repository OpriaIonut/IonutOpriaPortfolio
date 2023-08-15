export class GalleryView
{
    constructor(parentNode: HTMLElement, id: string, imagesPath: string, imageCount: number, durationMs: number)
    {
        let galleryParent = document.createElement("div");
        galleryParent.className = "gallery";
        parentNode.appendChild(galleryParent);

        let slidesParent = document.createElement("div");
        slidesParent.className = "gallerySlidesParent";
        slidesParent.style.width = `${imageCount}00%`;
        galleryParent.appendChild(slidesParent);

        let navigation = document.createElement("div");
        navigation.className = "galleryNavigation";
        galleryParent.appendChild(navigation);

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
            
            cssRules += `#gallery${id}R${index}:checked ~ .gallery${id}S0 { margin-left: -${100 / imageCount * index}%; }\n`;
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
                slide.classList.add("gallery" + id + "S0");

            let img = document.createElement("img");
            img.className = "fullres";
            img.src = imagesPath + index.toString() + ".jpg";
            slide.appendChild(img);

            let navLabel = document.createElement("label");
            navLabel.className = "galleryBar";
            navLabel.htmlFor = "gallery" + id + "R" + index;
            navigation.appendChild(navLabel);
        }
    }
}