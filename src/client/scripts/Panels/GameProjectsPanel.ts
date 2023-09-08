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
            _description: `Tower defense game in which you can:<br>
                - Construct & upgrade 6 different types of turrets<br>
                - Control a playable character that shoots enemies & can empower the turrets<br>
                - Play 30 different PvE levels on 6 different maps<br>
                - Buy permanent upgrades for your turrets<br>
                - Play a co-op boss-fight arena mode with a friend on 3 different difficulties`,
            _tags: ["Unity", "C#", "Photon 2", "Tower Defense", "Multi-user", "Multi-platform"],
            _tagColors: ["#6d1aa1", "#1a59a1", "#1a59a1", "#a11a1a", "#146913", "#853e13"],
            _moreDetailsPage: "https://kirirato.itch.io/serenity-garden",
            _imagesPath: "images/gallery/serenity-garden/",
            _imageCount: 7,
            _videoFormatIndices: [0],
            _imageDurationMs: 5000
        }));

        this._galleries.push(new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "chickenInvadersCell",
            _title: "Chicken Invaders DX",
            _description: `Replica of the initial Chicken Invaders DX game, which contains the following:<br>
                - 10 playable levels that repeat endlessly<br>
                - Local leaderboard system<br>
                - Weapon utility with 8 different levels, each having a different attack pattern<br>
                - Rocket that fries all chickens and skips the level<br>
                - Assistant spaceship that helps with shooting enemies<br>
                <br>
                Main Contributions:<br>
                - Implemented asteroid belt & waves 4 & 5<br>
                - Created the spritesheets for all non-ui elements in the game (spaceship, chickens, weapons, etc.)<br>
                - Optimized resource loading using multithreaded programming`,
            _tags: ["C++", "SFML", "Bullet Hell", "Endless", "Leaderboard"],
            _tagColors: ["#6d1aa1", "#1a59a1", "#a11a1a", "#146913", "#146913"],
            _moreDetailsPage: "https://kirirato.itch.io/chicken-invaders-dx",
            _imagesPath: "images/gallery/chicken-invaders/",
            _imageCount: 6,
            _videoFormatIndices: [0],
            _imageDurationMs: 5000
        }));

        this._galleries.push(new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "legeithielUnaelianCell",
            _title: "Legeithiel Unaelian",
            _description: `Bullet-hell game that I built during my time at the University of Lincoln UK<br>
                It contains the following:<br>
                - 3 playable levels<br>
                - 3 types of powerups (increased movement speed, double damage, faster fire rate)<br>
                - Pause menu from which you can tweak sound settings<br>
                - Leaderboard system stored locally<br>
                - Controller support`,
            _tags: ["Unity", "C#", "Bullet Hell", "Leaderboard", "Controller Support"],
            _tagColors: ["#6d1aa1", "#1a59a1", "#a11a1a", "#a11a1a", "#a11a1a"],
            _moreDetailsPage: "https://kirirato.itch.io/legeithiel-unaelian",
            _imagesPath: "images/gallery/legeithiel-unaelian/",
            _imageCount: 5,
            _videoFormatIndices: [0],
            _imageDurationMs: 5000,
            _imgExtension: "png"
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