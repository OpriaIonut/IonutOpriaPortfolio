import { WideCellGallery } from "../Helper/WideCellGallery";

export class WorkProjectsPanel
{
    constructor()
    {
        this.createElements();
    }

    private createElements()
    {
        const parentNode = document.createElement("div");
        parentNode.id = "workProjectsPanel";
        parentNode.className = "fullwidth";
        document.body.appendChild(parentNode);

        new WideCellGallery(parentNode, {
            _id: "planetquestCell",
            _title: "Planet Quest",
            _description: `
            - Planetquest is a Blockchain game in which you can explore procedurally generated planets dirrectly in your browser. I was one of the first persons that joined the team and played a big role in the entire development of it.<br>
            - As part of the collaboration, I developed a 3D engine that is able to procedurally generate planets dirrectly in the browser. The planets can generate in a fast manner even on old hardware, and due to ingenius algorithms, it's able to generate near infinite planets that all look different from one another.<br>
            - I also played a big role in the gameplay aspect of the project, by developing a lot of the main gameplay functionalities that were required and contributed to multiple preview launches that had the purpose of collecting valuable feedback from the users.<br>
            - Currently helping out on the engine development side of things, by creating tools that are required to run the game in the most optimal manner, and helping out with other procedural generation tasks.`,
            _tags: ["WebGL", "Typescript", "C++", "Procedural", "GameDev"],
            _tagColors: ["#6d1aa1", "#1a59a1", "#a11a1a", "#146913", "#853e13"],
            _moreDetailsPage: "",
            _imagesPath: "images/gallery/planetquest/",
            _imageCount: 6,
            _imageDurationMs: 2000
        });
    }
}