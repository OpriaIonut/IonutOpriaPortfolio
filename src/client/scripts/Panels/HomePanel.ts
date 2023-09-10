export class HomePanel
{
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

        let banner = document.createElement("img");
        banner.id = "banner";
        banner.src = "./images/banners/0.jpg";
        parentNode.appendChild(banner);

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
        this.createCellLink(linksParent, "./images/icons/PDF.jpg", "CV");

        let contact = document.createElement("div");
        contact.innerHTML = "Contact: opriaionut14@gmail.com";
        contact.id = "homePanelContact";
        titleParent.appendChild(contact);
    }

    private createCellLink(parentNode: HTMLElement, imageSrc: string, link: string)
    {
        let cell = document.createElement("img");
        cell.className = "homePageReferalLink";
        cell.src = imageSrc;
        if(link == "CV")
            cell.onclick = () => { this.downloadFile("CV Ionut Opria.pdf", "CV Ionut Opria.pdf"); };
        else
            cell.onclick = () => { window.open(link, '_blank'); };
        cell.style.cursor = "pointer";
        parentNode.appendChild(cell);
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
}