import { MultiCellWithGallery } from "../Helper/MultiCellWithGallery";

export class GameProjectsPanel
{
    private _galleries: MultiCellWithGallery[] = [];

    constructor()
    {
        this.createElements();
    }

    private createElements()
    {
        const parentNode = document.createElement("div");
        parentNode.id = "gameProjectsPanel";
        parentNode.className = "fullwidth";
        document.body.appendChild(parentNode);

        let cellsPerWidth = 2;
        
        this._galleries.push(new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "serenityGardenCell",
            _title: "Serenity Garden",
            _description: ``,
            _tags: ["Unity", "C#", "Tower Defense", "Multi-user", "Multi-platform"],
            _tagColors: ["#6d1aa1", "#1a59a1", "#a11a1a", "#146913", "#853e13"],
            _moreDetailsPage: "",
            _imagesPath: "images/gallery/planetquest-test/",
            _imageCount: 6,
            _videoFormatIndices: [],
            _imageDurationMs: 5000
        }));

        this._galleries.push(new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "chickenInvadersCell",
            _title: "Chicken Invaders DX",
            _description: ``,
            _tags: ["C++", "SFML", "Bullet Hell", "Endless", "Leaderboard"],
            _tagColors: ["#6d1aa1", "#1a59a1", "#a11a1a", "#146913", "#146913"],
            _moreDetailsPage: "",
            _imagesPath: "images/gallery/planetquest-test/",
            _imageCount: 6,
            _videoFormatIndices: [],
            _imageDurationMs: 5000
        }));

        this._galleries.push(new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "legeithielUnaelianCell",
            _title: "Legeithiel Unaelian",
            _description: ``,
            _tags: ["Unity", "C#", "Bullet Hell", "Leaderboard"],
            _tagColors: ["#6d1aa1", "#1a59a1", "#a11a1a", "#a11a1a"],
            _moreDetailsPage: "",
            _imagesPath: "images/gallery/planetquest-test/",
            _imageCount: 6,
            _videoFormatIndices: [],
            _imageDurationMs: 5000
        }));

        this._galleries.push(new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "oriCloneCell",
            _title: "Ori Gameplay Clone",
            _description: ``,
            _tags: ["Unity", "C#", "Platformer", "WIP"],
            _tagColors: ["#6d1aa1", "#1a59a1", "#a11a1a", "#a11a1a"],
            _moreDetailsPage: "",
            _imagesPath: "images/gallery/planetquest-test/",
            _imageCount: 6,
            _videoFormatIndices: [],
            _imageDurationMs: 5000
        }));

        let moreGamesBtn = document.createElement("button");
        moreGamesBtn.className = "middleCenterBtn";
        moreGamesBtn.innerHTML = "More Games";
        moreGamesBtn.onclick = () => { window.open('https://kirirato.itch.io', '_blank'); };
        parentNode.appendChild(moreGamesBtn);
    }

    public update()
    {
        for(let index = 0; index < this._galleries.length; ++index)
        {
            this._galleries[index].update();
        }
    }
}