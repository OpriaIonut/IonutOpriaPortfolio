import { MultiCellWithGallery } from "../Helper/MultiCellWithGallery";

export class SoftwareProjectsPanel
{
    constructor()
    {
        this.createElements();
    }

    private createElements()
    {
        const parentNode = document.createElement("div");
        parentNode.id = "softwareProjectsPanel";
        parentNode.className = "fullwidth";
        document.body.appendChild(parentNode);

        let cellsPerWidth = 3;
        
        new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "japoTimeAppCell",
            _title: "Japo Time",
            _description: ``,
            _tags: ["Java", "Android Studio", "Language Learning", "AWS storage"],
            _tagColors: ["#6d1aa1", "#6d1aa1", "#1a59a1", "#a11a1a"],
            _moreDetailsPage: "",
            _imagesPath: "images/gallery/planetquest/",
            _imageCount: 6,
            _imageDurationMs: 2000
        });

        new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "hobbyManagementAppCell",
            _title: "Hobby Management",
            _description: ``,
            _tags: ["Java", "Android Studio", "Local Storage"],
            _tagColors: ["#6d1aa1", "#6d1aa1", "#1a59a1"],
            _moreDetailsPage: "",
            _imagesPath: "images/gallery/planetquest/",
            _imageCount: 6,
            _imageDurationMs: 2000
        });

        new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "hangmanCell",
            _title: "Hangman",
            _description: ``,
            _tags: ["C#", "MVVM", "Local Storage"],
            _tagColors: ["#6d1aa1", "#6d1aa1", "#6d1aa1"],
            _moreDetailsPage: "",
            _imagesPath: "images/gallery/hangman/",
            _imageCount: 6,
            _imageDurationMs: 2000
        });
    }
}