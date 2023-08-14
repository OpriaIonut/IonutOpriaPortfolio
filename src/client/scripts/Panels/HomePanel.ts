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

        let title = document.createElement("div");
        title.id = "title";
        title.innerHTML = "Ionut Opria";
        parentNode.appendChild(title);

        let subtitle = document.createElement("div");
        subtitle.id = "subtitle";
        subtitle.innerHTML = "Game Programmer";
        parentNode.appendChild(subtitle);

        let linksParent = document.createElement("div");
        linksParent.id = "linksParent";
        parentNode.appendChild(linksParent);

        this.createCellLink(linksParent, "", "https://www.linkedin.com/in/ionut-opria-6164b5150/");
        this.createCellLink(linksParent, "", "https://kirirato.itch.io");
        this.createCellLink(linksParent, "", "https://twitter.com/Kirirato");
        this.createCellLink(linksParent, "", "https://sketchfab.com/kirirato");
        this.createCellLink(linksParent, "", "https://www.artstation.com/kirirato16");
        this.createCellLink(linksParent, "", "email");
        this.createCellLink(linksParent, "", "CV");
    }

    private createCellLink(parentNode: HTMLElement, imageSrc: string, link: string)
    {
        let cell = document.createElement("div");
        cell.className = "homePageReferalLink";
        parentNode.appendChild(cell);
    }
}