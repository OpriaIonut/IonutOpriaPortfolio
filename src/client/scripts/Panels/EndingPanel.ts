export class EndingPanel
{
    private _icons: HTMLDivElement[] = [];

    constructor()
    {
        this.createElements();
    }

    private createElements()
    {
        const parentNode = document.createElement("div");
        parentNode.id = "endingPanelParent";
        parentNode.className = "fullwidth";
        document.body.appendChild(parentNode);

        let separator = document.createElement("div");
        separator.className = "separator";
        parentNode.appendChild(separator);

        let text = document.createElement("div");
        text.id = "endingPanelText";
        text.innerHTML = `
        Thank you for spending the time to look through my portfolio!<br>
        Feel free to contact me at the following address: <div style='display: inline-block; color: var(--secondary-color);'>ionutopriaofficial@gmail.com</div><br>
        `;
        parentNode.appendChild(text);

        let linksParent = document.createElement("div");
        linksParent.id = "linksParent";
        parentNode.appendChild(linksParent);

        this.createCellLink(linksParent, "./images/icons/linkedin.jpg", "https://www.linkedin.com/in/ionut-opria-6164b5150/");
        this.createCellLink(linksParent, "./images/icons/github.jpg", "https://github.com/OpriaIonut");
        this.createCellLink(linksParent, "./images/icons/itch.jpg", "https://kirirato.itch.io");
        this.createCellLink(linksParent, "./images/icons/artstation.jpg", "https://www.artstation.com/kirirato16");
        this.createCellLink(linksParent, "./images/icons/twitter.jpg", "https://twitter.com/Kirirato");
        this.createCellLink(linksParent, "./images/icons/CV3.jpg", "CV");

        let copyright = document.createElement("div");
        copyright.id = "copyright";
        copyright.innerHTML = "Copyright © 2025 by Ionu&#x021b; Opria<br>All content and trademarks property of their respective owners";
        parentNode.appendChild(copyright);
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

    public updateColorTheme()
    {
        for(let index = 0; index < this._icons.length; ++index)
        {
            if(document.documentElement.className == "grayscaleTheme")
                this._icons[index].classList.add("grayscale");
            else
                this._icons[index].classList.remove("grayscale");
        }
    }
}