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

        this.createCellLink(parentNode, "", "https://www.linkedin.com/in/ionut-opria-6164b5150/");
        this.createCellLink(parentNode, "", "https://kirirato.itch.io");
        this.createCellLink(parentNode, "", "https://twitter.com/Kirirato");
        this.createCellLink(parentNode, "", "https://sketchfab.com/kirirato");
        this.createCellLink(parentNode, "", "https://www.artstation.com/kirirato16");
        this.createCellLink(parentNode, "", "email");
        this.createCellLink(parentNode, "", "CV");
    }

    private createCellLink(parentNode: HTMLElement, imageSrc: string, link: string)
    {
        let cell = document.createElement("div");
        cell.className = "homePageReferalLink";
        parentNode.appendChild(cell);
    }
}