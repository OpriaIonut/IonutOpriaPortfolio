export class EndingPanel
{
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

        let text = document.createElement("div");
        text.id = "endingPanelText";
        text.innerHTML = `
        Thank you for spending the time to look through my portfolio!<br>
        In case you also want to take a look at my CV, you can download it <a href = 'CV Ionut Opria.pdf' download>here</a><br>
        In case you want to contact me you can do so here: opriaionut@gmailcom<br>
        `;
        parentNode.appendChild(text);
    }
}