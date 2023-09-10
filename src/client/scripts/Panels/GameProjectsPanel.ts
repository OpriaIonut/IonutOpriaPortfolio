import { MultiCellWithGallery } from "../Helper/MultiCellWithGallery";
import { tagColors } from "../Themes/ChartThemes";

export class GameProjectsPanel
{
    private _galleries: MultiCellWithGallery[] = [];

    constructor(pageParent: HTMLDivElement)
    {
        this.createElements(pageParent);
    }

    private createElements(pageParent: HTMLDivElement)
    {
        const parentNode = document.createElement("div");
        parentNode.id = "gameProjectsPanel";
        parentNode.className = "fullwidth";
        pageParent.appendChild(parentNode);

        let title = document.createElement("div");
        title.className = "sectionTitle";
        title.innerHTML = "Personal Projects";
        parentNode.appendChild(title);

        let cellsPerWidth = 2;
        
        this._galleries.push(new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "serenityGardenCell",
            _title: "Serenity Garden",
            _description: `Tower defense game in which you can:<br>
                &#149; Construct & upgrade 6 different types of turrets<br>
                &#149; Control a playable character that shoots enemies & can empower the turrets<br>
                &#149; Play 30 different PvE levels on 6 different maps<br>
                &#149; Buy permanent upgrades for your turrets<br>
                &#149; Play a co-op boss-fight arena mode with a friend on 3 different difficulties`,
            _tags: ["Unity", "Photon 2", "C#", "Tower Defense", "Multi-user", "Multi-platform"],
            _tagColors: [tagColors.software, tagColors.software, tagColors.language, tagColors.gameType, tagColors.extra, tagColors.extra],
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
                &#149; 10 playable levels that repeat endlessly<br>
                &#149; Local leaderboard system<br>
                &#149; Weapon utility with 8 different levels, each having a different attack pattern<br>
                &#149; Rocket that fries all chickens and skips the level<br>
                &#149; Assistant spaceship that helps with shooting enemies<br>
                <br>
                Main Contributions:<br>
                &#149; Implemented asteroid belt and waves 4-5<br>
                &#149; Created the spritesheets for all non-ui elements in the game (spaceship, chickens, etc.)<br>
                &#149; Optimized resource loading using multithreaded programming`,
            _tags: ["C++", "SFML", "Bullet Hell", "Endless", "Leaderboard"],
            _tagColors: [tagColors.language, tagColors.language, tagColors.gameType, tagColors.extra, tagColors.extra],
            _moreDetailsPage: "https://kirirato.itch.io/chicken-invaders-dx",
            _imagesPath: "images/gallery/chicken-invaders/",
            _imageCount: 6,
            _videoFormatIndices: [0],
            _imageDurationMs: 5000
        }));

        this._galleries.push(new MultiCellWithGallery(parentNode, cellsPerWidth, {
            _id: "legeithielUnaelianCell",
            _title: "Legeithiel Unaelian",
            _description: `Bullet-hell game that I built during my time at the University of Lincoln UK<br><br>
                It contains the following:<br>
                &#149; 3 playable levels<br>
                &#149; 3 types of powerups (increased movement speed, double damage, faster fire rate)<br>
                &#149; Pause menu from which you can tweak sound settings<br>
                &#149; Leaderboard system stored locally<br>
                &#149; Controller support`,
            _tags: ["Unity", "C#", "Bullet Hell", "Leaderboard", "Controller Support"],
            _tagColors: [tagColors.software, tagColors.language, tagColors.gameType, tagColors.extra, tagColors.extra],
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
            _description: `Gameplay replica of the game Ori and the Blind Forest<br><br>
                It contains the following mechanics:<br>
                &#149; Normal attack that can target up to 3 enemies + charge attack that deals a lot of damage<br>
                &#149; Dynamic movement with double jump, dashing, charged jump, wall climbing, propulsion dodge<br>
                &#149; 8 different enemy types<br>
                &#149; 4 kinds of traps that each require different interactions<br>
                &#149; Minimap functionality that shows the objective for the game`,
            _tags: ["Unity", "C#", "Platformer", "Dynamic Gameplay"],
            _tagColors: [tagColors.software, tagColors.language, tagColors.gameType, tagColors.extra],
            _moreDetailsPage: "https://kirirato.itch.io/origameplayclone",
            _imagesPath: "images/gallery/ori/",
            _imageCount: 6,
            _videoFormatIndices: [0],
            _imageDurationMs: 5000
        }));

        let moreGamesBtn = document.createElement("div");
        moreGamesBtn.className = "middleCenterBtn";
        moreGamesBtn.innerHTML = "More Games";
        moreGamesBtn.onclick = () => { window.open('https://kirirato.itch.io', '_blank'); };
        parentNode.appendChild(moreGamesBtn);
        
        let separator = document.createElement("div");
        separator.className = "separator";
        separator.style.marginTop = "2vw";
        parentNode.appendChild(separator);
    }

    public update()
    {
        for(let index = 0; index < this._galleries.length; ++index)
        {
            this._galleries[index].update();
        }
    }
}