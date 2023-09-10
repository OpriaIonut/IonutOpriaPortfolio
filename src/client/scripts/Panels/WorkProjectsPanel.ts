import { WideCellGallery } from "../Helper/WideCellGallery";

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
        title.innerHTML = "Work Projects";
        parentNode.appendChild(title);

        this._gallery = new WideCellGallery(parentNode, {
            _id: "planetquestCell",
            _title: "Planet Quest",
            _description: `<br>
            Planetquest is a Blockchain game in which you can explore procedurally generated planets dirrectly in your browser. I was one of the first persons that joined the team and played a big role during the entire development of the project.<br><br>
            Key contributions: <br>
            &#149; Developed a 3D engine that is able to procedurally generate planets dirrectly in the browser. <br>
            &#149; Played a big role in the gameplay aspect of the project, by developing a lot of the core gameplay mechanics. <br>
            &#149; Played a big role in each of the product launches. <br> 
            &#149; Helped out in building a procedural volumetric terrain system that is also able to also generate underground caves. <br>
            &#149; Currently helping out on the engine development side, by creating the tools that are required to run the game in the most optimal manner.`,
            _tags: ["WebGL", "Typescript", "C++", "Procedural", "GameDev"],
            _tagColors: ["#6d1aa1", "#1a59a1", "#a11a1a", "#146913", "#853e13"],
            _moreDetailsPage: "https://planetquest.io",
            _imagesPath: "images/gallery/planetquest/",
            _imageCount: 7,
            _videoFormatIndices: [5, 6],
            _imageDurationMs: 5000
        });
    }

    public update()
    {
        this._gallery.update();
    }
}