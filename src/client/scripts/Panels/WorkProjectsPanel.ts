import { isPortraitMode } from "../../client";
import { CellGalleryConfig } from "../../types";
import { MultiCellWithGallery } from "../Helper/MultiCellWithGallery";
import { WideCellGallery } from "../Helper/WideCellGallery";
import { tagColors } from "../Themes/ChartThemes";

export class WorkProjectsPanel
{
    private _pqGalery!: WideCellGallery | MultiCellWithGallery;
    private _recogneoGalery!: WideCellGallery | MultiCellWithGallery;

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

        let pqCellData: CellGalleryConfig = {
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
            _btn1Link: "",
            _btn2Link: "https://planetquest.io",
            _imagesPath: "images/gallery/planetquest/",
            _imageCount: 7,
            _videoFormatIndices: [5, 6],
            _imageDurationMs: 5000,
            _downloadPath: "",
            _downloadName: "",
            _btn1Name: "More Details",
            _btn2Name: "Project Link"
        }

        let recogneoCellData: CellGalleryConfig = {
            _id: "recogneoCell",
            _title: "Recogneo",
            _description: `<br>
            Recogneo is a library that is able to generate datasets for AI training in a matter of minutes, process which would take weeks if done manually. You can generate thousands or even milions of images in the environment that you want to train your AI model in, while also generating annotations for the Yolo & Coco-based models.<br><br>
            Key contributions:<br>
            <div class='bulletPointList'>
                <b>&#149;</b> Developed the image generation logic. <br>
                <b>&#149;</b> Implemented image processing algorithms using compute shaders, to generate the desired results in a very optimal manner. <br>
                <b>&#149;</b> Developed the logic for automatically generating the annotations for the datasets. <br>
                <b>&#149;</b> Trained a couple of AI models in different environments to test the accuracy of the datasets generated. <br>
            </div>
            `,
            _tags: ["Unity", "C#", "AI Training", "Image Processing", "Compute Shaders"],
            _tagColors: [tagColors.software, tagColors.language, tagColors.extra, tagColors.extra, tagColors.extra],
            _btn1Link: "",
            _btn2Link: "",
            _imagesPath: "images/gallery/recogneo/",
            _imageCount: 5,
            _videoFormatIndices: [3, 4],
            _imageDurationMs: 5000,
            _downloadPath: "",
            _downloadName: "",
            _btn1Name: "More Details",
            _btn2Name: "Project Link"
        }

        if(isPortraitMode.value)
        {
            this._pqGalery = new MultiCellWithGallery(parentNode, 1, pqCellData);
            this._recogneoGalery = new MultiCellWithGallery(parentNode, 1, recogneoCellData);
        }
        else
        {
            this._pqGalery = new WideCellGallery(parentNode, pqCellData);
            this._recogneoGalery = new WideCellGallery(parentNode, recogneoCellData);
        }

        let separator = document.createElement("div");
        separator.className = "separator";
        parentNode.appendChild(separator);
    }

    public update()
    {
        this._pqGalery.update();
        this._recogneoGalery.update();
    }

    public updateColorTheme()
    {
        this._pqGalery.updateColorTheme();
        this._recogneoGalery.updateColorTheme();
    }
}