import { MultiCellWithGallery } from "../Helper/MultiCellWithGallery";

export class GameProjectsPanel
{
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
        
        new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "serenityGardenCell",
            _title: "Serenity Garden",
            _description: ``,
            _tags: ["Unity", "C#", "Tower Defense", "Multi-user", "Multi-platform"],
            _tagColors: ["#6d1aa1", "#1a59a1", "#a11a1a", "#146913", "#853e13"],
            _moreDetailsPage: "",
            _imagesPath: "images/gallery/planetquest/",
            _imageCount: 6,
            _imageDurationMs: 2000
        });

        new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "chickenInvadersCell",
            _title: "Chicken Invaders DX",
            _description: ``,
            _tags: ["C++", "SFML", "Bullet Hell", "Endless", "Leaderboard"],
            _tagColors: ["#6d1aa1", "#1a59a1", "#a11a1a", "#146913", "#146913"],
            _moreDetailsPage: "",
            _imagesPath: "images/gallery/planetquest/",
            _imageCount: 6,
            _imageDurationMs: 2000
        });

        new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "legeithielUnaelianCell",
            _title: "Legeithiel Unaelian",
            _description: ``,
            _tags: ["Unity", "C#", "Bullet Hell", "Leaderboard"],
            _tagColors: ["#6d1aa1", "#1a59a1", "#a11a1a", "#a11a1a"],
            _moreDetailsPage: "",
            _imagesPath: "images/gallery/planetquest/",
            _imageCount: 6,
            _imageDurationMs: 2000
        });

        new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "oriCloneCell",
            _title: "Ori Gameplay Clone",
            _description: ``,
            _tags: ["Unity", "C#", "Platformer", "WIP"],
            _tagColors: ["#6d1aa1", "#1a59a1", "#a11a1a", "#a11a1a"],
            _moreDetailsPage: "",
            _imagesPath: "images/gallery/planetquest/",
            _imageCount: 6,
            _imageDurationMs: 2000
        });

        let moreGamesBtn = document.createElement("button");
        moreGamesBtn.className = "middleCenterBtn";
        moreGamesBtn.innerHTML = "More Games";
        parentNode.appendChild(moreGamesBtn);
    }
}