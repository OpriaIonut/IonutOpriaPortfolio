import { WideCellGallery } from "../Helper/WideCellGallery";
import { tagColors } from "../Themes/ChartThemes";

export class WorkProjectsPanel
{
    private _gallery!: WideCellGallery;

    constructor(pageParent: HTMLDivElement)
    {
        this.createElements(pageParent);
    }

    private createElements(pageParent: HTMLDivElement)
    {
        const parentNode = document.createElement("div");
        parentNode.id = "workProjectsPanel";
        parentNode.className = "fullwidth";
        pageParent.appendChild(parentNode);

        let title = document.createElement("div");
        title.className = "sectionTitle";
        title.innerHTML = "Professional Projects";
        parentNode.appendChild(title);

        this._gallery = new WideCellGallery(parentNode, {
            _id: "planetquestCell",
            _title: "Planet Quest",
            _description: `<br>
            PlanetQuest is a Blockchain game in which you can explore procedurally generated planets directly in your browser. I was one of the first persons that joined the team and played a big role during the entire development of the project.<br><br>
            Key contributions: <br>
            <div class='bulletPointList'>
                <b>&#149;</b> Developed a 3D engine that is able to procedurally generate planets directly in the browser. <br>
                <b>&#149;</b> Played a big role in the gameplay aspect of the project, by developing a lot of the core gameplay mechanics. <br>
                <b>&#149;</b> Played a big role in each of the product launches. <br> 
                <b>&#149;</b> Helped out in building a procedural volumetric terrain system that is also able to generate underground caves. <br>
                <b>&#149;</b> Currently helping out on the engine development side, by creating the tools that are required to run the game in the most optimal manner.
            </div>`,
            _tags: ["WebGL", "Typescript", "C++", "Procedural", "Custom Engine"],
            _tagColors: [tagColors.language, tagColors.language, tagColors.language, tagColors.gameType, tagColors.software],
            _moreDetailsPage: "https://planetquest.io",
            _imagesPath: "images/gallery/planetquest/",
            _imageCount: 7,
            _videoFormatIndices: [5, 6],
            _imageDurationMs: 5000,
            _downloadPath: "",
            _downloadName: ""
        });

        let separator = document.createElement("div");
        separator.className = "separator";
        parentNode.appendChild(separator);
    }

    public update()
    {
        this._gallery.update();
    }

    public updateColorTheme()
    {
        this._gallery.updateColorTheme();
    }
}