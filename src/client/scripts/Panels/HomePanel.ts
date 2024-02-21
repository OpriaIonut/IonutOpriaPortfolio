const bannersPerTheme: any = 
{
    blueTheme: "./images/banners/0.jpg",
    purpleTheme: "./images/banners/alter_purple.jpg",
    orangeTheme: "./images/banners/alter_orange.jpg",
    greenTheme: "./images/banners/alter_green.jpg",
    grayscaleTheme: "./images/banners/grayscale.jpg"
}

export class HomePanel
{
    private _banner!: HTMLImageElement;
    private _icons: HTMLImageElement[] = [];

    constructor()
    {
        this.createElements();
    }

    private createElements()
    {
        const parentNode = document.createElement("div");
        parentNode.id = "homePanelParent";
        parentNode.className = "fullwidth";
        document.body.appendChild(parentNode);

        this._banner = document.createElement("img");
        this._banner.id = "banner";
        parentNode.appendChild(this._banner);
        this.updateBanner();

        let titleParent = document.createElement("div");
        titleParent.id = "homePanelTitleParent";
        parentNode.appendChild(titleParent);

        let title = document.createElement("div");
        title.id = "homePanelTitle";
        title.innerHTML = "Ionu&#x021b; Opria";
        titleParent.appendChild(title);

        let subtitle = document.createElement("div");
        subtitle.id = "homePanelSubtitle";
        subtitle.innerHTML = "Game Programmer";
        titleParent.appendChild(subtitle);

        let linksParent = document.createElement("div");
        linksParent.id = "linksParent";
        titleParent.appendChild(linksParent);

        this.createCellLink(linksParent, "./images/icons/linkedin.jpg", "https://www.linkedin.com/in/ionut-opria-6164b5150/");
        this.createCellLink(linksParent, "./images/icons/github.jpg", "https://github.com/OpriaIonut");
        this.createCellLink(linksParent, "./images/icons/itch.jpg", "https://kirirato.itch.io");
        this.createCellLink(linksParent, "./images/icons/artstation.jpg", "https://www.artstation.com/kirirato16");
        this.createCellLink(linksParent, "./images/icons/twitter.jpg", "https://twitter.com/Kirirato");
        this.createCellLink(linksParent, "./images/icons/CV3.jpg", "CV");

        let contact = document.createElement("div");
        contact.innerHTML = "Contact: ionutopriaofficial@gmail.com";
        contact.id = "homePanelContact";
        titleParent.appendChild(contact);
    }

    private createCellLink(parentNode: HTMLElement, imageSrc: string, link: string)
    {
        let cell = document.createElement("img");
        cell.className = "homePageReferalLink";
        cell.src = imageSrc;
        if(link == "CV")
            cell.addEventListener('mousedown', () => { this.downloadFile("CV Ionut Opria.pdf", "CV Ionut Opria.pdf"); });
        else
            cell.addEventListener('mousedown', () => { window.open(link, '_blank'); });
        cell.style.cursor = "pointer";
        parentNode.appendChild(cell);
        this._icons.push(cell);
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

    public updateBanner()
    {
        this._banner.src = bannersPerTheme[document.documentElement.className];
        for(let index = 0; index < this._icons.length; ++index)
        {
            if(document.documentElement.className == "grayscaleTheme")
                this._icons[index].classList.add("grayscale");
            else
                this._icons[index].classList.remove("grayscale");
        }
    }
}