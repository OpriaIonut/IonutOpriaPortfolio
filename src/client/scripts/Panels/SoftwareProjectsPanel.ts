import { MultiCellWithGallery } from "../Helper/MultiCellWithGallery";

export class SoftwareProjectsPanel
{
    private _galleries: MultiCellWithGallery[] = [];

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
        
        this._galleries.push(new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "japoTimeAppCell",
            _title: "Japo Time",
            _description: ``,
            _tags: ["Java", "Android Studio", "Language Learning", "AWS storage"],
            _tagColors: ["#6d1aa1", "#6d1aa1", "#1a59a1", "#a11a1a"],
            _moreDetailsPage: "",
            _imagesPath: "images/gallery/planetquest-test/",
            _imageCount: 6,
            _videoFormatIndices: [],
            _imageDurationMs: 5000
        }));

        this._galleries.push(new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "hobbyManagementAppCell",
            _title: "Hobby Management",
            _description: ``,
            _tags: ["Java", "Android Studio", "Local Storage"],
            _tagColors: ["#6d1aa1", "#6d1aa1", "#1a59a1"],
            _moreDetailsPage: "",
            _imagesPath: "images/gallery/planetquest-test/",
            _imageCount: 6,
            _videoFormatIndices: [],
            _imageDurationMs: 5000
        }));

        this._galleries.push(new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "hangmanCell",
            _title: "Hangman",
            _description: ``,
            _tags: ["C#", "MVVM", "Local Storage"],
            _tagColors: ["#6d1aa1", "#6d1aa1", "#6d1aa1"],
            _moreDetailsPage: "",
            _imagesPath: "images/gallery/hangman/",
            _imageCount: 6,
            _videoFormatIndices: [],
            _imageDurationMs: 5000
        }));
    }

    public update()
    {
        for(let index = 0; index < this._galleries.length; ++index)
        {
            this._galleries[index].update();
        }
    }
}